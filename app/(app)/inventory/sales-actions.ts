"use server";

import { and, eq, lte, gte, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { activityLogs, inventoryMovements, products, promotions, saleItems, sales } from "@/db/schema";
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
    const discountType = String(formData.get("manualDiscountType") ?? "none");
    const discountRaw = String(formData.get("manualDiscountValue") ?? "0").trim();
    let submitted: { productId: string; quantity: number }[];
    if (!["cash", "card", "transfer"].includes(paymentMethod)) return { error: "Selecciona un método de pago válido." };
    if (!moneyPattern.test(amountReceivedRaw)) return { error: "El importe recibido debe ser válido." };
    if (notes && notes.length > 500) return { error: "Las notas admiten hasta 500 caracteres." };
    if (!["none", "percent", "fixed"].includes(discountType) || !moneyPattern.test(discountRaw)) return { error: "El descuento manual no es válido." };
    if (discountType !== "none" && user.role !== "ADMIN") return { error: "Solo el administrador puede aplicar descuentos manuales." };
    const discountValue = Number(discountRaw);
    if (discountType === "percent" && (discountValue <= 0 || discountValue > 100)) return { error: "El descuento porcentual debe estar entre 0.01 y 100." };
    if (discountType === "fixed" && discountValue <= 0) return { error: "El descuento fijo debe ser mayor que cero." };
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
    } catch { return { error: "Revisa los productos y las cantidades del carrito." }; }
    if (new Set(submitted.map(item => item.productId)).size !== submitted.length) return { error: "Cada producto debe aparecer una sola vez en el carrito." };
    const received = Number(amountReceivedRaw);
    if (!Number.isFinite(received) || received > 9999999999.99) return { error: "El importe recibido supera el límite permitido." };

    const result = await db.transaction(async tx => {
      const locked = [];
      for (const item of [...submitted].sort((a,b) => a.productId.localeCompare(b.productId))) {
        const [product] = await tx.select().from(products).where(eq(products.id,item.productId)).for("update").limit(1);
        if (!product || !product.active) throw new Error("Uno de los productos ya no está disponible. Actualiza la pantalla e inténtalo de nuevo.");
        if (product.stockQuantity < item.quantity) throw new Error(`Existencias insuficientes de "${product.name}". Disponibles: ${product.stockQuantity}.`);
        locked.push({...item,product});
      }
      const now = new Date();
      const activePromotions = await tx.select().from(promotions).where(and(
        eq(promotions.active,true), lte(promotions.startsAt,now), gte(promotions.endsAt,now),
      ));
      const priced = locked.map(item => {
        const applicable = activePromotions.filter(p => p.productId === null || p.productId === item.product.id);
        let best = { unitPrice: cents(Number(item.product.salePrice)), name: null as string | null };
        for (const promo of applicable) {
          const original = cents(Number(item.product.salePrice));
          const reduction = promo.discountType === "percent" ? Math.round(original * Number(promo.discountValue) / 100) : cents(Number(promo.discountValue));
          const candidate = Math.max(0, original - reduction);
          if (candidate < best.unitPrice) best = {unitPrice:candidate,name:promo.name};
        }
        return {...item,originalUnitPrice:cents(Number(item.product.salePrice)), promoUnitPrice:best.unitPrice,promotionName:best.name};
      });
      const subtotalCents = priced.reduce((sum,item)=>sum+item.originalUnitPrice*item.quantity,0);
      const promoTotalCents = priced.reduce((sum,item)=>sum+(item.originalUnitPrice-item.promoUnitPrice)*item.quantity,0);
      const afterPromosCents = priced.reduce((sum,item)=>sum+item.promoUnitPrice*item.quantity,0);
      const manualCents = discountType === "percent" ? Math.round(afterPromosCents*discountValue/100) : discountType === "fixed" ? cents(discountValue) : 0;
      if (manualCents > afterPromosCents) throw new Error("El descuento no puede superar el total después de promociones.");
      const totalCents = afterPromosCents-manualCents;
      if (totalCents <= 0) throw new Error("El total de la venta debe ser mayor que cero.");
      if (paymentMethod === "cash" && cents(received) < totalCents) throw new Error("El efectivo recibido no puede ser menor que el total.");
      const receivedCents = cents(received);
      const amountToStore = paymentMethod === "cash" ? receivedCents : totalCents;
      const changeCents = paymentMethod === "cash" ? receivedCents-totalCents : 0;
      const folio = `V-${now.toISOString().slice(0,10).replace(/-/g,"")}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
      const [sale] = await tx.insert(sales).values({
        folio,paymentMethod,subtotal:(subtotalCents/100).toFixed(2),discountTotal:((subtotalCents-totalCents)/100).toFixed(2),total:(totalCents/100).toFixed(2),
        amountReceived:(amountToStore/100).toFixed(2),changeDue:(changeCents/100).toFixed(2),notes,soldBy:user.id,soldAt:now,
      }).returning({id:sales.id,folio:sales.folio,total:sales.total});
      let manualRemaining = manualCents;
      const manualBase = afterPromosCents;
      for (let index=0;index<priced.length;index++) {
        const item=priced[index];
        const before=item.product.stockQuantity, after=before-item.quantity;
        const promoLineCents=item.promoUnitPrice*item.quantity;
        const allocatedManual = index===priced.length-1 ? manualRemaining : (manualBase ? Math.floor(manualCents*promoLineCents/manualBase) : 0);
        manualRemaining-=allocatedManual;
        const finalLineCents=promoLineCents-allocatedManual;
        const unitFinalCents=item.quantity ? Math.floor(finalLineCents/item.quantity) : 0;
        const unitCostCents=cents(Number(item.product.costPrice));
        const lineCostCents=unitCostCents*item.quantity;
        await tx.insert(saleItems).values({
          saleId:sale.id,productId:item.product.id,productName:item.product.name,sku:item.product.sku,quantity:item.quantity,
          originalUnitPrice:(item.originalUnitPrice/100).toFixed(2),unitPrice:(unitFinalCents/100).toFixed(2),
          discountAmount:((item.originalUnitPrice*item.quantity-finalLineCents)/100).toFixed(2),promotionName:item.promotionName,
          unitCost:(unitCostCents/100).toFixed(2),lineTotal:(finalLineCents/100).toFixed(2),lineCost:(lineCostCents/100).toFixed(2),
        });
        await tx.update(products).set({stockQuantity:after,updatedAt:now}).where(eq(products.id,item.product.id));
        await tx.insert(inventoryMovements).values({productId:item.product.id,userId:user.id,type:"exit",reason:"sale",quantity:item.quantity,stockBefore:before,stockAfter:after,notes:`Venta ${sale.folio}`});
      }
      await tx.insert(activityLogs).values({
        userId:user.id,module:"sales",action:"REGISTER_SALE",entityType:"sale",entityId:sale.id,newValue:sale.total,
        metadata:{folio:sale.folio,paymentMethod,itemCount:priced.length,total:sale.total,discountTotal:sale.discountTotal,promotionalDiscount:(promoTotalCents/100).toFixed(2),manualDiscount:(manualCents/100).toFixed(2)},
      });
      return {id:sale.id,folio:sale.folio};
    });
    for (const path of ["/pos","/pos/sales","/pos/promotions","/inventory","/inventory/movements","/inventory/monthly-report","/inventory/replenishment"]) revalidatePath(path);
    return {success:true,sale:result};
  } catch(error) { return {error:error instanceof Error?error.message:"No fue posible registrar la venta."}; }
}
