"use client";

import { useState, useTransition } from "react";
import { createPromotion, setPromotionActive } from "./promotion-actions";

type Product = { id: string; name: string; sku: string };
type Promotion = { id: string; name: string; productId: string | null; productName: string | null; discountType: string; discountValue: string; startsAt: string; endsAt: string; active: boolean };
const dateLabel = (value: string) => new Date(value).toLocaleString("es-MX",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
export function PromotionManager({products,promotions}:{products:Product[];promotions:Promotion[]}) {
  const [pending,startTransition]=useTransition();
  const [feedback,setFeedback]=useState("");
  function submit(formData:FormData) {
    setFeedback("");
    startTransition(async()=>{const result=await createPromotion(formData);setFeedback("error" in result?result.error??"No se pudo guardar la oferta.":"Oferta guardada. Actualiza la lista si no aparece inmediatamente.");if(!("error" in result)) window.location.reload();});
  }
  function toggle(p:Promotion) {
    startTransition(async()=>{const result=await setPromotionActive(p.id,!p.active);setFeedback("error" in result?result.error??"No se pudo actualizar.":"Estado de oferta actualizado.");if(!("error" in result))window.location.reload();});
  }
  return <div className="grid items-start gap-5 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
    <form action={submit} className="space-y-4 rounded-2xl bg-white p-5 shadow-md sm:p-6">
      <h2 className="text-lg font-bold text-gray-900">Crear oferta</h2>
      <label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-700">Nombre de la oferta *</span><input name="name" required maxLength={120} placeholder="Ej. Regreso a clases 10%" className="min-h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm text-gray-900"/></label>
      <label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-700">Productos</span><select name="productId" defaultValue="" className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900"><option value="">Todos los productos activos</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.sku}</option>)}</select><span className="text-xs text-gray-500">La oferta se aplicará globalmente o al producto elegido.</span></label>
      <div className="grid grid-cols-2 gap-3"><label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-700">Tipo *</span><select name="discountType" className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900"><option value="percent">Porcentaje (%)</option><option value="fixed">Descuento por unidad ($)</option></select></label><label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-700">Valor *</span><input name="discountValue" required type="number" min="0.01" step="0.01" max="100" placeholder="10" className="min-h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900"/></label></div>
      <label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-700">Inicio *</span><input name="startsAt" required type="datetime-local" className="min-h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm text-gray-900"/></label>
      <label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-700">Fin *</span><input name="endsAt" required type="datetime-local" className="min-h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm text-gray-900"/></label>
      {feedback&&<p role="status" className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">{feedback}</p>}
      <button disabled={pending} className="min-h-11 w-full rounded-xl bg-[#FFD400] px-4 py-2.5 text-sm font-black text-gray-900 disabled:opacity-50">{pending?"Guardando…":"Crear oferta"}</button>
      <p className="text-xs text-gray-500">Las ofertas se activan automáticamente dentro de su vigencia. Si hay varias, se aplica la que deje el menor precio; no se acumulan.</p>
    </form>
    <section className="space-y-3 rounded-2xl bg-white p-5 shadow-md sm:p-6"><div><h2 className="text-lg font-bold text-gray-900">Ofertas registradas</h2><p className="text-sm text-gray-500">{promotions.length} ofertas en total</p></div>
      {promotions.map(p=><article key={p.id} className="rounded-xl border border-gray-100 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-gray-900">{p.name}</h3><span className={"rounded-full px-2.5 py-1 text-xs font-bold "+(p.active?"bg-emerald-50 text-emerald-700":"bg-gray-100 text-gray-500")}>{p.active?"Activa":"Pausada"}</span></div><p className="mt-1 text-sm text-gray-600">{p.discountType==="percent"?p.discountValue+"% de descuento":"$"+p.discountValue+" por unidad"} · {p.productName??"Todos los productos"}</p><p className="mt-1 text-xs text-gray-500">{dateLabel(p.startsAt)} — {dateLabel(p.endsAt)}</p></div><button type="button" disabled={pending} onClick={()=>toggle(p)} className="min-h-9 shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">{p.active?"Pausar":"Activar"}</button></div></article>)}
      {!promotions.length&&<p className="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">Todavía no hay ofertas registradas.</p>}
    </section>
  </div>;
}
