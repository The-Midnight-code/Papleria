"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { activityLogs, products, promotions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";

export async function createPromotion(formData: FormData) {
  try {
    const user = await requireAdmin();
    const name = String(formData.get("name") ?? "").trim();
    const productIdRaw = String(formData.get("productId") ?? "").trim();
    const discountType = String(formData.get("discountType") ?? "");
    const discountRaw = String(formData.get("discountValue") ?? "").trim();
    const startsRaw = String(formData.get("startsAt") ?? "");
    const endsRaw = String(formData.get("endsAt") ?? "");
    if (!name || name.length > 120) return { error: "El nombre es obligatorio y admite hasta 120 caracteres." };
    if (!["percent","fixed"].includes(discountType) || !/^\d{1,8}(?:\.\d{1,2})?$/.test(discountRaw)) return { error: "Configura un descuento válido." };
    const discountValue = Number(discountRaw);
    if (discountValue <= 0 || (discountType === "percent" && discountValue > 100)) return { error: "El porcentaje debe ser máximo 100 y el importe debe ser mayor que cero." };
    const startsAt = new Date(startsRaw), endsAt = new Date(endsRaw);
    if (!startsRaw || !endsRaw || !Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) return { error: "La fecha final debe ser posterior a la inicial." };
    let productId: string | null = null;
    if (productIdRaw) {
      const [product] = await db.select({id:products.id}).from(products).where(eq(products.id,productIdRaw)).limit(1);
      if (!product) return { error: "El producto seleccionado no existe." };
      productId = product.id;
    }
    const [promotion] = await db.insert(promotions).values({name,productId,discountType,discountValue:discountValue.toFixed(2),startsAt,endsAt,createdBy:user.id}).returning({id:promotions.id});
    await db.insert(activityLogs).values({userId:user.id,module:"sales",action:"CREATE_PROMOTION",entityType:"promotion",entityId:promotion.id,newValue:name,metadata:{productId,discountType,discountValue,startsAt:startsAt.toISOString(),endsAt:endsAt.toISOString()}});
    for (const path of ["/pos","/pos/promotions"]) revalidatePath(path);
    return {success:true};
  } catch(error) { return {error:error instanceof Error?error.message:"No fue posible crear la oferta."}; }
}

export async function setPromotionActive(id: string, active: boolean) {
  try {
    const user = await requireAdmin();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || typeof active !== "boolean") return {error:"La oferta seleccionada no es válida."};
    const [updated] = await db.update(promotions).set({active}).where(eq(promotions.id,id)).returning({id:promotions.id,name:promotions.name});
    if (!updated) return {error:"La oferta ya no existe."};
    await db.insert(activityLogs).values({userId:user.id,module:"sales",action:active?"ACTIVATE_PROMOTION":"DEACTIVATE_PROMOTION",entityType:"promotion",entityId:id,newValue:updated.name});
    revalidatePath("/pos"); revalidatePath("/pos/promotions");
    return {success:true};
  } catch(error) { return {error:error instanceof Error?error.message:"No fue posible actualizar la oferta."}; }
}
