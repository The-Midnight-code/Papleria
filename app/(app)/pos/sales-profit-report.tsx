"use client";

import { useMemo, useState } from "react";

type Sale = {
  id:string; folio:string; paymentMethod:string; subtotal:string; discountTotal:string; total:string;
  status:string; soldAt:string; cancellationReason:string|null; userName:string|null;
  cost:string; profit:string; units:number;
};
const money=(value:number)=>value.toLocaleString("es-MX",{style:"currency",currency:"MXN"});
const paymentLabels:Record<string,string>={cash:"Efectivo",card:"Tarjeta",transfer:"Transferencia"};
const localDay=(value:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Tijuana",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));

export function SalesProfitReport({sales,defaultFrom,defaultTo}:{sales:Sale[];defaultFrom:string;defaultTo:string}) {
  const [from,setFrom]=useState(defaultFrom);
  const [to,setTo]=useState(defaultTo);
  const [status,setStatus]=useState("all");
  const visible=useMemo(()=>sales.filter(s=>{
    const day=localDay(s.soldAt);
    return day>=from&&day<=to&&(status==="all"||s.status===status);
  }),[sales,from,to,status]);
  const completed=visible.filter(s=>s.status==="completed");
  const cancelled=visible.filter(s=>s.status==="cancelled");
  const sum=(list:Sale[],pick:(s:Sale)=>number)=>list.reduce((total,s)=>total+pick(s),0);
  const netSales=sum(completed,s=>Math.round(Number(s.total)*100))/100;
  const discounts=sum(completed,s=>Math.round(Number(s.discountTotal)*100))/100;
  const costs=sum(completed,s=>Math.round(Number(s.cost)*100))/100;
  const profit=sum(completed,s=>Math.round(Number(s.profit)*100))/100;
  const byPayment=["cash","card","transfer"].map(method=>({method,total:sum(completed.filter(s=>s.paymentMethod===method),s=>Math.round(Number(s.total)*100))/100,count:completed.filter(s=>s.paymentMethod===method).length}));
  function exportCsv(){
    const headers=["Fecha","Hora","Folio","Estado","Método de pago","Subtotal MXN","Descuento MXN","Venta neta MXN","Unidades","Responsable","Costo histórico MXN","Utilidad bruta MXN","Motivo de cancelación"];
    const rows=visible.map(s=>{const date=new Date(s.soldAt);const valid=s.status==="completed";return [date.toLocaleDateString("es-MX",{timeZone:"America/Tijuana"}),date.toLocaleTimeString("es-MX",{timeZone:"America/Tijuana",hour:"2-digit",minute:"2-digit"}),s.folio,valid?"Completada":"Cancelada",paymentLabels[s.paymentMethod]??s.paymentMethod,(valid?Number(s.subtotal):0).toFixed(2),(valid?Number(s.discountTotal):0).toFixed(2),(valid?Number(s.total):0).toFixed(2),s.units,s.userName??"Usuario eliminado",(valid?Number(s.cost):0).toFixed(2),(valid?Number(s.profit):0).toFixed(2),s.cancellationReason??""]});
    const esc=(value:string|number)=>{const text=String(value);return /[;"\n\r]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text;};
    const csv="\uFEFF"+[headers,...rows].map(row=>row.map(esc).join(";")).join("\r\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="reporte-utilidad-"+from+"-"+to+".csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  return <div className="space-y-5">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[["Ventas netas",money(netSales),"Después de descuentos"],["Costo de mercancía",money(costs),"Costos guardados al vender"],["Utilidad bruta",money(profit),netSales>0?"Margen: "+(profit/netSales*100).toLocaleString("es-MX",{maximumFractionDigits:1})+"%":"Sin ventas netas"],["Descuentos",money(discounts),"En ventas completadas"]].map(([label,value,note])=><div key={label} className="rounded-2xl bg-white p-4 shadow-md"><p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-2 text-2xl font-black text-gray-900">{value}</p><p className="mt-1 text-xs text-gray-500">{note}</p></div>)}
    </section>
    <section className="space-y-4 rounded-2xl bg-white p-4 shadow-md sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-bold text-gray-900">Periodo del reporte</h2><p className="text-sm text-gray-500">Puedes elegir cualquier fecha entre los últimos 5,000 registros disponibles.</p></div><button onClick={exportCsv} disabled={!visible.length} className="min-h-10 rounded-xl bg-[#176B7A] px-4 py-2 text-sm font-bold text-white hover:bg-[#125765] disabled:opacity-50">↓ Exportar CSV</button></div>
      <div className="grid gap-3 sm:grid-cols-3"><label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Desde</span><input type="date" value={from} max={to||undefined} onChange={e=>setFrom(e.target.value)} className="min-h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900"/></label><label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Hasta</span><input type="date" value={to} min={from||undefined} onChange={e=>setTo(e.target.value)} className="min-h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900"/></label><label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</span><select value={status} onChange={e=>setStatus(e.target.value)} className="min-h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900"><option value="all">Todos</option><option value="completed">Completadas</option><option value="cancelled">Canceladas</option></select></label></div>
      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs font-semibold text-gray-500">Ventas completadas</p><p className="mt-1 text-xl font-bold text-gray-900">{completed.length}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs font-semibold text-gray-500">Cancelaciones</p><p className="mt-1 text-xl font-bold text-red-700">{cancelled.length}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs font-semibold text-gray-500">Unidades vendidas</p><p className="mt-1 text-xl font-bold text-gray-900">{sum(completed,s=>s.units).toLocaleString("es-MX")}</p></div></div>
    </section>
    <section className="rounded-2xl bg-white p-4 shadow-md sm:p-6"><h2 className="text-lg font-bold text-gray-900">Desglose por método de pago</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{byPayment.map(item=><div key={item.method} className="rounded-xl border border-gray-100 p-4"><p className="text-sm font-semibold text-gray-500">{paymentLabels[item.method]}</p><p className="mt-2 text-xl font-black text-[#176B7A]">{money(item.total)}</p><p className="mt-1 text-xs text-gray-500">{item.count} ventas</p></div>)}</div><p className="mt-3 text-xs text-gray-500">Las ventas canceladas no suman a ventas netas, costos ni utilidad. La utilidad es bruta: no descuenta gastos operativos, comisiones ni impuestos.</p></section>
    <section className="overflow-hidden rounded-2xl bg-white shadow-md"><div className="border-b border-gray-100 p-4 sm:p-6"><h2 className="text-lg font-bold text-gray-900">Detalle del periodo</h2><p className="text-sm text-gray-500">{visible.length} registros · importes en MXN</p></div><div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left"><thead className="bg-gray-50"><tr>{["Fecha","Folio","Estado","Pago","Descuento","Venta neta","Costo histórico","Utilidad bruta","Responsable"].map(label=><th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{visible.map(s=>{const valid=s.status==="completed";return <tr key={s.id} className="hover:bg-gray-50"><td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{new Date(s.soldAt).toLocaleDateString("es-MX",{timeZone:"America/Tijuana",day:"2-digit",month:"short",year:"numeric"})}</td><td className="px-4 py-3 text-sm font-bold text-gray-900">{s.folio}</td><td className="px-4 py-3"><span className={"rounded-full px-2.5 py-1 text-xs font-bold "+(valid?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-700")}>{valid?"Completada":"Cancelada"}</span></td><td className="px-4 py-3 text-sm text-gray-600">{paymentLabels[s.paymentMethod]??s.paymentMethod}</td><td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{valid?money(Number(s.discountTotal)): "—"}</td><td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-gray-900">{valid?money(Number(s.total)):"—"}</td><td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{valid?money(Number(s.cost)):"—"}</td><td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-emerald-700">{valid?money(Number(s.profit)):"—"}</td><td className="px-4 py-3 text-sm text-gray-600">{s.userName??"Usuario eliminado"}</td></tr>})}{!visible.length&&<tr><td colSpan={9} className="px-5 py-10 text-center text-sm text-gray-500">No hay ventas para este periodo y filtros.</td></tr>}</tbody></table></div></section>
  </div>;
}
