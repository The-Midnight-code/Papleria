"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { activityLogs, cashClosures, sales, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";

const moneyPattern = /^\d{1,10}(?:\.\d{1,2})?$/;
const cents = (value: number) => Math.round((value + Number.EPSILON) * 100);

export async function closeCashDay(formData: FormData) {
  try {
    const user = await requireAdmin();
    const businessDate = String(formData.get("businessDate") ?? "").trim();
    const countedRaw = String(formData.get("cashCounted") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim() || null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(businessDate) || Number.isNaN(new Date(businessDate + "T12:00:00").getTime())) return { error: "Selecciona una fecha válida." };
    if (!moneyPattern.test(countedRaw) || Number(countedRaw) > 9999999999.99) return { error: "El efectivo contado debe ser un importe válido." };
    if (notes && notes.length > 1000) return { error: "Las notas admiten hasta 1000 caracteres." };
    const cashCountedCents = cents(Number(countedRaw));
    const closure = await db.transaction(async tx => {
      const existing = await tx.select({id:cashClosures.id}).from(cashClosures).where(eq(cashClosures.businessDate,businessDate)).limit(1);
      if (existing.length) throw new Error("Ese día ya tiene un corte de caja registrado. Los cierres no se pueden duplicar.");
      const daySales = await tx.select({paymentMethod:sales.paymentMethod,total:sales.total}).from(sales).where(and(
        eq(sales.status,"completed"),
        sql`(${sales.soldAt} AT TIME ZONE 'America/Tijuana')::date = ${businessDate}::date`,
      ));
      let cash=0,card=0,transfer=0,total=0;
      for (const sale of daySales) {
        const amount=cents(Number(sale.total)); total+=amount;
        if(sale.paymentMethod==="cash") cash+=amount;
        else if(sale.paymentMethod==="card") card+=amount;
        else if(sale.paymentMethod==="transfer") transfer+=amount;
      }
      const difference=cashCountedCents-cash;
      const [saved]=await tx.insert(cashClosures).values({
        businessDate,salesCount:daySales.length,cashTotal:(cash/100).toFixed(2),cardTotal:(card/100).toFixed(2),
        transferTotal:(transfer/100).toFixed(2),totalSales:(total/100).toFixed(2),cashCounted:(cashCountedCents/100).toFixed(2),
        difference:(difference/100).toFixed(2),notes,closedBy:user.id,
      }).returning({id:cashClosures.id});
      await tx.insert(activityLogs).values({
        userId:user.id,module:"sales",action:"CLOSE_CASH_DAY",entityType:"cash_closure",entityId:saved.id,
        newValue:(total/100).toFixed(2),metadata:{businessDate,salesCount:daySales.length,cashTotal:(cash/100).toFixed(2),cardTotal:(card/100).toFixed(2),transferTotal:(transfer/100).toFixed(2),cashCounted:(cashCountedCents/100).toFixed(2),difference:(difference/100).toFixed(2)},
      });
      return saved;
    });
    revalidatePath("/pos/cash-closure");
    return {success:true,closureId:closure.id};
  } catch(error) { return {error:error instanceof Error?error.message:"No fue posible registrar el corte de caja."}; }
}
