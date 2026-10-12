"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { activityLogs, cashClosures, cashRegisterMovements, sales } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";

const moneyPattern = /^\d{1,10}(?:\.\d{1,2})?$/;
const cents = (value: number) => Math.round((value + Number.EPSILON) * 100);

function currentBusinessDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return get("year") + "-" + get("month") + "-" + get("day");
}

export async function registerCashMovement(formData: FormData) {
  try {
    const user = await requireAdmin();
    const businessDate = String(formData.get("businessDate") ?? "").trim();
    const type = String(formData.get("type") ?? "").trim();
    const amountRaw = String(formData.get("amount") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim() || null;
    if (businessDate !== currentBusinessDate()) return { error: "Solo puedes registrar movimientos de la fecha operativa actual." };
    if (!["opening", "in", "out"].includes(type)) return { error: "Selecciona un tipo de movimiento válido." };
    if (!moneyPattern.test(amountRaw) || Number(amountRaw) <= 0 || Number(amountRaw) > 9999999999.99) return { error: "El importe debe ser mayor que cero y válido." };
    if (!reason || reason.length > 160) return { error: "Indica un motivo de hasta 160 caracteres." };
    if (notes && notes.length > 1000) return { error: "Las notas admiten hasta 1000 caracteres." };
    const amountCents = cents(Number(amountRaw));
    const saved = await db.transaction(async tx => {
      const existingClosure = await tx.select({id:cashClosures.id}).from(cashClosures).where(eq(cashClosures.businessDate,businessDate)).limit(1);
      if (existingClosure.length) throw new Error("La caja de este día ya está cerrada. No se permiten más movimientos.");
      if (type === "opening") {
        const opening = await tx.select({id:cashRegisterMovements.id}).from(cashRegisterMovements).where(and(eq(cashRegisterMovements.businessDate,businessDate),eq(cashRegisterMovements.type,"opening"))).limit(1);
        if (opening.length) throw new Error("El fondo inicial ya fue registrado y no se puede modificar.");
      }
      const [row] = await tx.insert(cashRegisterMovements).values({
        businessDate, type, amount:(amountCents/100).toFixed(2), reason, notes, createdBy:user.id,
      }).returning({id:cashRegisterMovements.id});
      await tx.insert(activityLogs).values({
        userId:user.id,module:"sales",action:type==="opening"?"SET_CASH_OPENING":type==="in"?"REGISTER_CASH_IN":"REGISTER_CASH_OUT",
        entityType:"cash_register_movement",entityId:row.id,
        newValue:(amountCents/100).toFixed(2),metadata:{businessDate,type,amount:(amountCents/100).toFixed(2),reason,notes},
      });
      return row;
    });
    revalidatePath("/pos/cash-closure");
    return {success:true,movementId:saved.id};
  } catch(error) { return {error:error instanceof Error?error.message:"No fue posible registrar el movimiento de caja."}; }
}

export async function closeCashDay(formData: FormData) {
  try {
    const user = await requireAdmin();
    const businessDate = String(formData.get("businessDate") ?? "").trim();
    const countedRaw = String(formData.get("cashCounted") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim() || null;
    if (businessDate !== currentBusinessDate()) return { error: "Solo puedes cerrar la caja de la fecha operativa actual." };
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
      const dayMovements = await tx.select({type:cashRegisterMovements.type,amount:cashRegisterMovements.amount}).from(cashRegisterMovements).where(eq(cashRegisterMovements.businessDate,businessDate));
      let cash=0,card=0,transfer=0,total=0,openingFloat=0,cashIn=0,cashOut=0;
      for (const sale of daySales) {
        const amount=cents(Number(sale.total)); total+=amount;
        if(sale.paymentMethod==="cash") cash+=amount;
        else if(sale.paymentMethod==="card") card+=amount;
        else if(sale.paymentMethod==="transfer") transfer+=amount;
      }
      for (const movement of dayMovements) {
        const amount=cents(Number(movement.amount));
        if(movement.type==="opening") openingFloat+=amount;
        else if(movement.type==="in") cashIn+=amount;
        else if(movement.type==="out") cashOut+=amount;
      }
      const expected=openingFloat+cash+cashIn-cashOut;
      if(expected<0) throw new Error("Los retiros registrados superan el efectivo disponible. Revisa los movimientos antes de cerrar.");
      const difference=cashCountedCents-expected;
      const [saved]=await tx.insert(cashClosures).values({
        businessDate,salesCount:daySales.length,cashTotal:(cash/100).toFixed(2),cardTotal:(card/100).toFixed(2),
        transferTotal:(transfer/100).toFixed(2),totalSales:(total/100).toFixed(2),
        openingFloat:(openingFloat/100).toFixed(2),cashIn:(cashIn/100).toFixed(2),cashOut:(cashOut/100).toFixed(2),
        cashExpected:(expected/100).toFixed(2),cashCounted:(cashCountedCents/100).toFixed(2),
        difference:(difference/100).toFixed(2),notes,closedBy:user.id,
      }).returning({id:cashClosures.id});
      await tx.insert(activityLogs).values({
        userId:user.id,module:"sales",action:"CLOSE_CASH_DAY",entityType:"cash_closure",entityId:saved.id,
        newValue:(total/100).toFixed(2),metadata:{businessDate,salesCount:daySales.length,cashTotal:(cash/100).toFixed(2),cardTotal:(card/100).toFixed(2),transferTotal:(transfer/100).toFixed(2),openingFloat:(openingFloat/100).toFixed(2),cashIn:(cashIn/100).toFixed(2),cashOut:(cashOut/100).toFixed(2),cashExpected:(expected/100).toFixed(2),cashCounted:(cashCountedCents/100).toFixed(2),difference:(difference/100).toFixed(2)},
      });
      return saved;
    });
    revalidatePath("/pos/cash-closure");
    return {success:true,closureId:closure.id};
  } catch(error) { return {error:error instanceof Error?error.message:"No fue posible registrar el corte de caja."}; }
}
