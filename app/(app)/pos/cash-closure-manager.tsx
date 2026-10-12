"use client";

import { useState, useTransition } from "react";
import { closeCashDay } from "./cash-closure-actions";

type Closure = { id:string; businessDate:string; closedAt:string; salesCount:number; cashTotal:string; cardTotal:string; transferTotal:string; totalSales:string; cashCounted:string; difference:string; notes:string|null; closedByName:string|null };
const money=(value:number|string)=>Number(value).toLocaleString("es-MX",{style:"currency",currency:"MXN"});
const dateLabel=(value:string)=>new Date(value+"T12:00:00").toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"});
export function CashClosureManager({businessDate,existing,todayTotals,history}:{businessDate:string;existing:{businessDate:string;cashTotal:string;cashCounted:string;difference:string}|null;todayTotals:{cash:string;card:string;transfer:string;total:string;salesCount:number};history:Closure[]}) {
  const [pending,startTransition]=useTransition();
  const [feedback,setFeedback]=useState("");
  const [counted,setCounted]=useState(existing?.cashCounted??todayTotals.cash);
  function submit(formData:FormData) {
    setFeedback("");
    startTransition(async()=>{const result=await closeCashDay(formData);if("error" in result){setFeedback(result.error??"No fue posible guardar el corte.");return;}setFeedback("Corte de caja guardado correctamente.");window.location.reload();});
  }
  const difference=Number(counted||0)-Number(todayTotals.cash);
  return <div className="space-y-6">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[["Ventas completadas",String(todayTotals.salesCount)],["Efectivo esperado",money(todayTotals.cash)],["Tarjeta",money(todayTotals.card)],["Transferencias",money(todayTotals.transfer)]].map(([label,value])=><article key={label} className="rounded-2xl bg-white p-4 shadow-md"><p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-2 text-2xl font-black text-gray-900">{value}</p></article>)}
    </section>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
      <form action={submit} className="space-y-4 rounded-2xl bg-white p-5 shadow-md sm:p-6">
        <div><p className="text-xs font-bold uppercase tracking-wide text-[#176B7A]">Fecha de operación</p><h2 className="mt-1 text-xl font-bold text-gray-900">{dateLabel(businessDate)}</h2><p className="mt-1 text-sm text-gray-500">Zona horaria: Tijuana.</p></div>
        <input type="hidden" name="businessDate" value={businessDate}/>
        <div className="space-y-1.5"><label htmlFor="cashCounted" className="text-sm font-semibold text-gray-700">Efectivo contado físicamente (MXN)</label><input id="cashCounted" name="cashCounted" type="number" min="0" step="0.01" max="9999999999.99" required value={counted} disabled={!!existing} onChange={e=>setCounted(e.target.value)} className="min-h-12 w-full rounded-xl border border-gray-200 px-3.5 text-lg font-bold text-gray-900 disabled:bg-gray-50"/></div>
        <div className="rounded-xl bg-gray-50 p-4"><div className="flex items-center justify-between text-sm text-gray-600"><span>Efectivo esperado por ventas</span><span className="font-semibold">{money(todayTotals.cash)}</span></div><div className="mt-2 flex items-center justify-between"><span className="font-bold text-gray-900">Diferencia estimada</span><span className={"text-lg font-black "+(Math.abs(difference)<0.005?"text-emerald-700":difference<0?"text-red-700":"text-amber-700")}>{money(difference)}</span></div><p className="mt-2 text-xs text-gray-500">La diferencia es efectivo contado menos ventas en efectivo. No incluye fondo inicial ni retiros registrados fuera del sistema.</p></div>
        <label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-700">Notas (opcional)</span><textarea name="notes" maxLength={1000} disabled={!!existing} placeholder="Incidencias, retiros o aclaraciones..." rows={3} className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 disabled:bg-gray-50"/></label>
        {existing?<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-bold text-emerald-800">El corte de hoy ya está registrado.</p><p className="mt-1 text-sm text-emerald-700">Los cierres guardados no se pueden duplicar ni modificar desde esta pantalla.</p></div>:<button disabled={pending} className="min-h-11 w-full rounded-xl bg-[#FFD400] px-4 py-2.5 text-sm font-black text-gray-900 disabled:opacity-50">{pending?"Guardando corte…":"Registrar corte de caja"}</button>}
        {feedback&&<p role="status" className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">{feedback}</p>}
      </form>
      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-md sm:p-6"><div><h2 className="text-lg font-bold text-gray-900">Historial de cortes</h2><p className="text-sm text-gray-500">Últimos {history.length} cierres registrados.</p></div>
        {history.map(item=><article key={item.id} className="rounded-xl border border-gray-100 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-bold text-gray-900">{dateLabel(item.businessDate)}</h3><p className="text-xs text-gray-500">{item.salesCount} ventas · Cerró: {item.closedByName??"Usuario eliminado"}</p></div><p className="text-lg font-black text-[#176B7A]">{money(item.totalSales)}</p></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3"><div className="rounded-lg bg-gray-50 p-2"><p className="text-xs text-gray-500">Efectivo esperado</p><p className="font-bold text-gray-900">{money(item.cashTotal)}</p></div><div className="rounded-lg bg-gray-50 p-2"><p className="text-xs text-gray-500">Contado</p><p className="font-bold text-gray-900">{money(item.cashCounted)}</p></div><div className="rounded-lg bg-gray-50 p-2"><p className="text-xs text-gray-500">Diferencia</p><p className={"font-bold "+(Number(item.difference)===0?"text-emerald-700":Number(item.difference)<0?"text-red-700":"text-amber-700")}>{money(item.difference)}</p></div></div><p className="mt-2 text-xs text-gray-500">Tarjeta: {money(item.cardTotal)} · Transferencias: {money(item.transferTotal)}</p>{item.notes&&<p className="mt-2 text-sm text-gray-600">Notas: {item.notes}</p>}</article>)}
        {!history.length&&<p className="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">Aún no hay cortes registrados.</p>}
      </section>
    </div>
  </div>;
}
