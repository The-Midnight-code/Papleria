"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { activityLogs, cashClosures, inventoryMovements, products, saleItems, sales } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";

export async function cancelSale(saleId: string, reasonInput: string) {
  try {
    const user = await requireAdmin();
    const reason = reasonInput.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saleId)) {
      return { error: "La venta seleccionada no es válida." };
    }
    if (reason.length < 5) return { error: "Describe el motivo de la cancelación (mínimo 5 caracteres)." };
    if (reason.length > 500) return { error: "El motivo admite hasta 500 caracteres." };

    const result = await db.transaction(async (tx) => {
      const [sale] = await tx.select().from(sales).where(eq(sales.id, saleId)).for("update").limit(1);
      if (!sale) throw new Error("No se encontró la venta.");
      if (sale.status !== "completed") throw new Error("Esta venta ya fue cancelada o no se puede cancelar.");

      // La cancelación comparte el bloqueo de caja de la fecha original de la venta.
      const dateParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit",
      }).formatToParts(sale.soldAt);
      const datePart = (type: string) => dateParts.find(part => part.type === type)?.value ?? "";
      const businessDate = datePart("year") + "-" + datePart("month") + "-" + datePart("day");
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext('papeleria-cash:' || ${businessDate}))`);
      const [existingClosure] = await tx.select({ id: cashClosures.id })
        .from(cashClosures).where(eq(cashClosures.businessDate, businessDate)).limit(1);
      if (existingClosure) {
        throw new Error("No se puede cancelar una venta de un día cuya caja ya fue cerrada. Registra el ajuste correspondiente con el administrador.");
      }

      const items = await tx.select().from(saleItems).where(eq(saleItems.saleId, sale.id));
      if (!items.length) throw new Error("La venta no contiene productos y no puede cancelarse automáticamente.");

      const lockedProducts = [];
      for (const item of [...items].sort((a, b) => a.productId.localeCompare(b.productId))) {
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId)).for("update").limit(1);
        if (!product) throw new Error(`No se encontró el producto "${item.productName}". No se modificó la venta.`);
        if (product.stockQuantity > 2147483647 - item.quantity) {
          throw new Error(`La devolución de "${item.productName}" excedería el límite de existencias.`);
        }
        lockedProducts.push({ item, product });
      }

      const now = new Date();
      for (const { item, product } of lockedProducts) {
        const before = product.stockQuantity;
        const after = before + item.quantity;
        await tx.update(products).set({ stockQuantity: after, updatedAt: now }).where(eq(products.id, product.id));
        await tx.insert(inventoryMovements).values({
          productId: product.id, userId: user.id, type: "entry", reason: "sale_cancellation",
          quantity: item.quantity, stockBefore: before, stockAfter: after,
          notes: `Cancelación de venta ${sale.folio}. Motivo: ${reason}`,
        });
      }

      await tx.update(sales).set({
        status: "cancelled", cancelledAt: now, cancelledBy: user.id, cancellationReason: reason,
      }).where(and(eq(sales.id, sale.id), eq(sales.status, "completed")));

      await tx.insert(activityLogs).values({
        userId: user.id, module: "sales", action: "CANCEL_SALE", entityType: "sale", entityId: sale.id,
        previousValue: sale.total, newValue: "cancelled",
        metadata: { folio: sale.folio, reason, restoredItems: items.length, restoredUnits: items.reduce((sum, item) => sum + item.quantity, 0) },
      });
      return { folio: sale.folio, restoredItems: items.length };
    });

    for (const path of ["/pos", "/pos/sales", "/pos/sales/" + saleId, "/inventory", "/inventory/movements", "/inventory/monthly-report", "/inventory/replenishment"]) revalidatePath(path);
    return { success: true, sale: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No fue posible cancelar la venta." };
  }
}
