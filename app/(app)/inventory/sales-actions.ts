"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { activityLogs, inventoryMovements, products, saleItems, sales } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const moneyPattern = /^\d{1,10}(?:\.\d{1,2})?$/;
const cents = (value: number) => Math.round((value + Number.EPSILON) * 100);

export async function registerSale(formData: FormData) {
  try {
    const user = await requireEmployeeOrAdmin();
    const paymentMethod = String(formData.get("paymentMethod") ?? "");
    const amountReceivedRaw = String(formData.get("amountReceived") ?? "0").trim();
    const notes = String(formData.get("notes") ?? "").trim() || null;
    let submitted: { productId: string; quantity: number }[];
    if (!["cash", "card", "transfer"].includes(paymentMethod)) return { error: "Selecciona un método de pago válido." };
    if (!moneyPattern.test(amountReceivedRaw)) return { error: "El importe recibido debe ser válido." };
    if (notes && notes.length > 500) return { error: "Las notas admiten hasta 500 caracteres." };
    try {
      const parsed = JSON.parse(String(formData.get("items") ?? ""));
      if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 100) throw new Error();
      submitted = parsed.map((item: unknown) => {
        if (!item || typeof item !== "object") throw new Error();
        const row = item as Record<string, unknown>;
        if (typeof row.productId !== "string" || !uuidPattern.test(row.productId)) throw new Error();
        if (typeof row.quantity !== "number" || !Number.isSafeInteger(row.quantity) || row.quantity < 1 || row.quantity > 2147483647) throw new Error();
        return { productId: row.productId, quantity: row.quantity };
      });
    } catch {
      return { error: "Revisa los productos y las cantidades del carrito." };
    }
    if (new Set(submitted.map((item) => item.productId)).size !== submitted.length) return { error: "Cada producto debe aparecer una sola vez en el carrito." };
    const received = Number(amountReceivedRaw);
    if (!Number.isFinite(received) || received > 9999999999.99) return { error: "El importe recibido supera el límite permitido." };

    const result = await db.transaction(async (tx) => {
      const locked = [];
      for (const item of [...submitted].sort((a, b) => a.productId.localeCompare(b.productId))) {
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId)).for("update").limit(1);
        if (!product || !product.active) throw new Error("Uno de los productos ya no está disponible. Actualiza la pantalla e inténtalo de nuevo.");
        if (product.stockQuantity < item.quantity) throw new Error(`Existencias insuficientes de "${product.name}". Disponibles: ${product.stockQuantity}.`);
        locked.push({ ...item, product });
      }
      const totalCents = locked.reduce((sum, item) => sum + cents(Number(item.product.salePrice) * item.quantity), 0);
      const receivedCents = cents(received);
      if (totalCents <= 0) throw new Error("El total de la venta debe ser mayor que cero. Revisa los precios de los productos.");
      if (paymentMethod === "cash" && receivedCents < totalCents) throw new Error("El efectivo recibido no puede ser menor que el total.");
      const amountToStore = paymentMethod === "cash" ? receivedCents : totalCents;
      const changeCents = paymentMethod === "cash" ? receivedCents - totalCents : 0;
      const now = new Date();
      const folio = `V-${now.toISOString().slice(0,10).replace(/-/g,"")}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
      const [sale] = await tx.insert(sales).values({
        folio, paymentMethod, subtotal: (totalCents / 100).toFixed(2), total: (totalCents / 100).toFixed(2),
        amountReceived: (amountToStore / 100).toFixed(2), changeDue: (changeCents / 100).toFixed(2),
        notes, soldBy: user.id, soldAt: now,
      }).returning({ id: sales.id, folio: sales.folio, total: sales.total, soldAt: sales.soldAt, paymentMethod: sales.paymentMethod, amountReceived: sales.amountReceived, changeDue: sales.changeDue });
      for (const item of locked) {
        const before = item.product.stockQuantity;
        const after = before - item.quantity;
        const unitPriceCents = cents(Number(item.product.salePrice));
        const unitCostCents = cents(Number(item.product.costPrice));
        const lineTotal = (unitPriceCents * item.quantity / 100).toFixed(2);
        const lineCost = (unitCostCents * item.quantity / 100).toFixed(2);
        await tx.insert(saleItems).values({
          saleId: sale.id, productId: item.product.id, productName: item.product.name, sku: item.product.sku,
          quantity: item.quantity, unitPrice: (unitPriceCents / 100).toFixed(2), unitCost: (unitCostCents / 100).toFixed(2),
          lineTotal, lineCost,
        });
        await tx.update(products).set({ stockQuantity: after, updatedAt: now }).where(eq(products.id, item.product.id));
        await tx.insert(inventoryMovements).values({
          productId: item.product.id, userId: user.id, type: "exit", reason: "sale", quantity: item.quantity,
          stockBefore: before, stockAfter: after, notes: `Venta ${sale.folio}`,
        });
      }
      await tx.insert(activityLogs).values({
        userId: user.id, module: "sales", action: "REGISTER_SALE", entityType: "sale", entityId: sale.id,
        newValue: sale.total, metadata: { folio: sale.folio, paymentMethod, itemCount: locked.length, total: sale.total },
      });
      return { id: sale.id, folio: sale.folio };
    });
    for (const path of ["/pos", "/pos/sales", "/inventory", "/inventory/movements", "/inventory/monthly-report", "/inventory/replenishment"]) revalidatePath(path);
    return { success: true, sale: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No fue posible registrar la venta." };
  }
}
