"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { activityLogs, inventoryMovements, products, purchaseItems, purchases } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const parseMoney = (value: string) => /^\d{1,8}(?:\.\d{1,2})?$/.test(value) ? Number(value) : NaN;

export async function registerPurchase(formData: FormData) {
  try {
    const user = await requireEmployeeOrAdmin();
    const supplierName = String(formData.get("supplierName") ?? "").trim();
    const reference = String(formData.get("reference") ?? "").trim() || null;
    const notes = String(formData.get("notes") ?? "").trim() || null;
    const rawDate = String(formData.get("purchasedAt") ?? "");
    const rawItems = String(formData.get("items") ?? "");
    if (!supplierName || supplierName.length > 160) return { error: "Escribe un nombre de proveedor de hasta 160 caracteres." };
    if (reference && reference.length > 100) return { error: "El folio o referencia admite hasta 100 caracteres." };
    if (notes && notes.length > 1000) return { error: "Las notas admiten hasta 1000 caracteres." };
    const purchasedAt = rawDate ? new Date(rawDate + "T12:00:00") : new Date();
    if (Number.isNaN(purchasedAt.getTime())) return { error: "La fecha de compra no es válida." };
    let submitted: { productId: string; quantity: number; unitCost: number }[];
    try {
      const parsed = JSON.parse(rawItems);
      if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 100) throw new Error();
      submitted = parsed.map((item: unknown) => {
        if (!item || typeof item !== "object") throw new Error();
        const row = item as Record<string, unknown>;
        if (typeof row.productId !== "string" || !uuidPattern.test(row.productId)) throw new Error();
        if (!Number.isSafeInteger(row.quantity) || Number(row.quantity) < 1 || Number(row.quantity) > 2147483647) throw new Error();
        if (typeof row.unitCost !== "string" || !Number.isFinite(parseMoney(row.unitCost))) throw new Error();
        return { productId: row.productId, quantity: Number(row.quantity), unitCost: parseMoney(row.unitCost) };
      });
    } catch {
      return { error: "Revisa los productos, cantidades y costos de la compra." };
    }
    if (new Set(submitted.map((item) => item.productId)).size !== submitted.length) return { error: "Cada producto debe aparecer una sola vez en la compra." };
    const totalAmount = submitted.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    if (!Number.isFinite(totalAmount) || totalAmount > 999999999999.99) return { error: "El total de la compra supera el límite permitido." };

    await db.transaction(async (tx) => {
      const lockedProducts = [];
      for (const item of submitted) {
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId)).for("update").limit(1);
        if (!product) throw new Error("Uno de los productos ya no existe. Actualiza la página e inténtalo de nuevo.");
        if (!product.active) throw new Error(`El producto "${product.name}" está inactivo y no puede recibirse en una compra.`);
        if (product.stockQuantity + item.quantity > 2147483647) throw new Error(`La cantidad supera el límite de existencias para "${product.name}".`);
        lockedProducts.push({ ...item, product });
      }
      const [purchase] = await tx.insert(purchases).values({
        supplierName, reference, notes, totalAmount: totalAmount.toFixed(2), purchasedAt, createdBy: user.id,
      }).returning({ id: purchases.id });

      for (const item of lockedProducts) {
        const before = item.product.stockQuantity;
        const after = before + item.quantity;
        const lineTotal = item.quantity * item.unitCost;
        await tx.insert(purchaseItems).values({
          purchaseId: purchase.id, productId: item.product.id, quantity: item.quantity,
          unitCost: item.unitCost.toFixed(2), lineTotal: lineTotal.toFixed(2),
        });
        await tx.update(products).set({
          stockQuantity: after, costPrice: item.unitCost.toFixed(2), updatedAt: new Date(),
        }).where(eq(products.id, item.product.id));
        const movementNotes = [`Compra #${reference || purchase.id.slice(0, 8)} · Proveedor: ${supplierName}`, notes].filter(Boolean).join(" · ").slice(0, 1000);
        await tx.insert(inventoryMovements).values({
          productId: item.product.id, userId: user.id, type: "entry", reason: "purchase",
          quantity: item.quantity, stockBefore: before, stockAfter: after, notes: movementNotes,
        });
        await tx.insert(activityLogs).values({
          userId: user.id, module: "inventory", action: "REGISTER_PURCHASE_ITEM", entityType: "product", entityId: item.product.id,
          previousValue: String(before), newValue: String(after),
          metadata: { purchaseId: purchase.id, supplierName, reference, quantity: item.quantity, unitCost: item.unitCost, lineTotal },
        });
      }
      await tx.insert(activityLogs).values({
        userId: user.id, module: "inventory", action: "REGISTER_PURCHASE", entityType: "purchase", entityId: purchase.id,
        newValue: totalAmount.toFixed(2), metadata: { supplierName, reference, itemCount: submitted.length, totalAmount: totalAmount.toFixed(2) },
      });
    });
    for (const path of ["/inventory", "/inventory/purchases", "/inventory/movements", "/inventory/monthly-report", "/inventory/replenishment"]) revalidatePath(path);
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No fue posible registrar la compra." };
  }
}
