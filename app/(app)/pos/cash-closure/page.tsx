import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/db";
import { cashClosures, sales, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";
import { CashClosureManager } from "./cash-closure-manager";

function localDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return get("year") + "-" + get("month") + "-" + get("day");
}

export default async function CashClosurePage() {
  await requireAdmin();
  const today = localDate();
  const [todaySales, history] = await Promise.all([
    db.select({paymentMethod:sales.paymentMethod,total:sales.total}).from(sales).where(sql` ${sales.status} = 'completed' AND (${sales.soldAt} AT TIME ZONE 'America/Tijuana')::date = ${today}::date `),
    db.select({id:cashClosures.id,businessDate:cashClosures.businessDate,closedAt:cashClosures.closedAt,salesCount:cashClosures.salesCount,cashTotal:cashClosures.cashTotal,cardTotal:cashClosures.cardTotal,transferTotal:cashClosures.transferTotal,totalSales:cashClosures.totalSales,cashCounted:cashClosures.cashCounted,difference:cashClosures.difference,notes:cashClosures.notes,closedByName:users.name}).from(cashClosures).leftJoin(users,eq(cashClosures.closedBy,users.id)).orderBy(desc(cashClosures.businessDate)).limit(60),
  ]);
  const totals = todaySales.reduce((acc,sale)=>{const value=Math.round(Number(sale.total)*100);acc.total+=value;if(sale.paymentMethod==="cash")acc.cash+=value;else if(sale.paymentMethod==="card")acc.card+=value;else if(sale.paymentMethod==="transfer")acc.transfer+=value;return acc;},{cash:0,card:0,transfer:0,total:0});
  const existing=history.find(row=>row.businessDate===today);
  const serialized=history.map(row=>({...row,businessDate:String(row.businessDate),closedAt:row.closedAt.toISOString(),cashTotal:String(row.cashTotal),cardTotal:String(row.cardTotal),transferTotal:String(row.transferTotal),totalSales:String(row.totalSales),cashCounted:String(row.cashCounted),difference:String(row.difference)}));
  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
    <header><Link href="/pos" className="text-sm text-white/75 transition hover:text-white">← Volver al punto de venta</Link><h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Corte de caja diario</h1><p className="mt-1 text-sm text-white/75">Conciliación de ventas completadas por método de pago y registro del efectivo contado.</p></header>
    <CashClosureManager businessDate={today} existing={existing ? {businessDate:String(existing.businessDate),cashTotal:String(existing.cashTotal),cashCounted:String(existing.cashCounted),difference:String(existing.difference)} : null} todayTotals={{cash:(totals.cash/100).toFixed(2),card:(totals.card/100).toFixed(2),transfer:(totals.transfer/100).toFixed(2),total:(totals.total/100).toFixed(2),salesCount:todaySales.length}} history={serialized}/>
  </main>;
}
