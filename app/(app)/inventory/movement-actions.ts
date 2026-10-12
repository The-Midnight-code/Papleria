"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { activityLogs, inventoryMovements, products } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reasons: Record<string, string[]> = {
  entry: ["purchase", "return", "other"],
  exit: ["sale", "damage", "loss", "other"],
  adjustment: ["count_correction", "other"],
};

export async function registerInventoryMovement(formData: FormData) {
  try {
    const user = await requireEmployeeOrAdmin();
    const productId = String(formData.get("productId") ?? "");
    const type = String(formData.get("type") ?? "");
    const reason = String(formData.get("reason") ?? "");
    const rawQuantity = String(formData.get("quantity") ?? "");
    const notes = String(formData.get("notes") ?? "").trim() || null;
    if (!uuidPattern.test(productId)) return { error: "Selecciona un producto válido." };
    if (!(type in reasons) || !reasons[type].includes(reason)) return { error: "El tipo y motivo del movimiento no son válidos." };
    if (!/^\d{1,9}$/.test(rawQuantity)) return { error: "La cantidad debe ser un número entero positivo." };
    const quantity = Number(rawQuantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 2147483647) return { error: "La cantidad debe ser mayor que cero." };
    if (notes && notes.length > 1000) return { error: "Las notas admiten hasta 1000 caracteres." };

    await db.transaction(async (tx) => {
      const [product] = await tx.select().from(products).where(eq(products.id, productId)).for("update").limit(1);
      if (!product) throw new Error("El producto seleccionado ya no existe.");
      if (!product.active) throw new Error("No se pueden registrar movimientos de un producto inactivo.");
      const before = product.stockQuantity;
      let after = before;
      let movementQuantity = quantity;
      if (type === "entry") {
        after = before + quantity;
        if (!Number.isSafeInteger(after) || after > 2147483647) throw new Error("La cantidad supera el límite de existencias permitido.");
      } else if (type === "exit") {
        if (quantity > before) throw new Error("No hay existencias suficientes para registrar esa salida.");
        after = before - quantity;
      } else {
        after = quantity;
        movementQuantity = Math.abs(after - before);
        if (movementQuantity === 0) throw new Error("El nuevo stock debe ser diferente al actual.");
      }

      await tx.update(products).set({ stockQuantity: after, updatedAt: new Date() }).where(eq(products.id, productId));
      await tx.insert(inventoryMovements).values({ productId, userId: user.id, type, reason, quantity: movementQuantity, stockBefore: before, stockAfter: after, notes });
      await tx.insert(activityLogs).values({
        userId: user.id, module: "inventory", action: "REGISTER_MOVEMENT", entityType: "product", entityId: productId,
        previousValue: String(before), newValue: String(after), metadata: { type, reason, quantity: movementQuantity, notes },
      });
    });
    revalidatePath("/inventory");
    revalidatePath("/inventory/movements");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No fue posible registrar el movimiento." };
  }
}
