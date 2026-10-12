import Link from "next/link";
import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "@/db/db";
import { saleItems, sales, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";
import { SalesProfitReport } from "./sales-profit-report";

function localDate() {
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Tijuana",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const get=(type:string)=>parts.find(p=>p.type===type)?.value??"";
  return get("year")+"-"+get("month")+"-"+get("day");
}
function localMidnight(date:string) {
  const [year,month,day]=date.split("-").map(Number);
  // America/Tijuana currently observes UTC-7 in the report's target period.
  return new Date(Date.UTC(year,month-1,day,7,0,0));
}
export default async function SalesProfitReportPage() {
  await requireAdmin();
  const today=localDate();
  const monthStart=today.slice(0,7)+"-01";
  const from=localMidnight(monthStart);
  const [year,month,day]=today.split("-").map(Number);
  const nextDate=new Date(Date.UTC(year,month-1,day+1));
  const until=localMidnight(nextDate.toISOString().slice(0,10));
  const rows=await db.select({
    id:sales.id,folio:sales.folio,paymentMethod:sales.paymentMethod,subtotal:sales.subtotal,
    discountTotal:sales.discountTotal,total:sales.total,status:sales.status,soldAt:sales.soldAt,
    cancellationReason:sales.cancellationReason,userName:users.name,
  }).from(sales).leftJoin(users,eq(sales.soldBy,users.id)).where(and(gte(sales.soldAt,from),lt(sales.soldAt,until))).orderBy(desc(sales.soldAt));
  const ids=rows.map(r=>r.id);
  const items=ids.length?await db.select({saleId:saleItems.saleId,quantity:saleItems.quantity,lineTotal:saleItems.lineTotal,lineCost:saleItems.lineCost}).from(saleItems).where(inArray(saleItems.saleId,ids)):[];
  const itemTotals=new Map<string,{cost:number;profit:number;units:number}>();
  for(const item of items){const current=itemTotals.get(item.saleId)??{cost:0,profit:0,units:0};const cost=Math.round(Number(item.lineCost)*100);const net=Math.round(Number(item.lineTotal)*100);current.cost+=cost;current.profit+=net-cost;current.units+=item.quantity;itemTotals.set(item.saleId,current);}
  const report=rows.map(r=>({...r,soldAt:r.soldAt.toISOString(),subtotal:String(r.subtotal),discountTotal:String(r.discountTotal),total:String(r.total),cost:((itemTotals.get(r.id)?.cost??0)/100).toFixed(2),profit:((itemTotals.get(r.id)?.profit??0)/100).toFixed(2),units:itemTotals.get(r.id)?.units??0}));
  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
    <header><Link href="/pos" className="text-sm text-white/75 transition hover:text-white">← Volver al punto de venta</Link><h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Reporte de ventas y utilidad</h1><p className="mt-1 text-sm text-white/75">Ventas netas, costos históricos, utilidad bruta, descuentos y cancelaciones. Solo visible para administración.</p></header>
    <SalesProfitReport sales={report} defaultFrom={monthStart} defaultTo={today}/>
  </main>;
}
