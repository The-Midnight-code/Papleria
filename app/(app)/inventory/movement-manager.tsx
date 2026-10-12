"use client";

import { useMemo, useState, useTransition } from "react";
import { registerInventoryMovement } from "./movement-actions";

type Product = { id: string; name: string; sku: string; stockQuantity: number; active: boolean };
type Movement = { id: string; productName: string; sku: string; type: string; reason: string; quantity: number; stockBefore: number; stockAfter: number; notes: string | null; createdAt: string; userName: string | null };
const reasons: Record<string, { value: string; label: string }[]> = {
  entry: [{value:"purchase",label:"Compra / mercancía recibida"},{value:"return",label:"Devolución recibida"},{value:"other",label:"Otro motivo"}],
  exit: [{value:"sale",label:"Venta"},{value:"damage",label:"Producto dañado"},{value:"loss",label:"Pérdida"},{value:"other",label:"Otro motivo"}],
  adjustment: [{value:"count_correction",label:"Corrección por conteo físico"},{value:"other",label:"Otro motivo"}],
};
const typeLabels: Record<string,string> = { entry:"Entrada", exit:"Salida", adjustment:"Ajuste" };
const reasonLabels: Record<string,string> = { purchase:"Compra", return:"Devolución", other:"Otro", sale:"Venta", damage:"Daño", loss:"Pérdida", count_correction:"Corrección de conteo" };

export function MovementManager({ products, history }: { products: Product[]; history: Movement[] }) {
  const [type,setType] = useState("entry");
  const [productId,setProductId] = useState(products.find(p=>p.active)?.id ?? "");
  const [error,setError] = useState("");
  const [pending,startTransition] = useTransition();
  const [query,setQuery] = useState("");
  const selected = products.find(p=>p.id===productId);
  const visibleHistory = useMemo(()=>history.filter(m=>!query || [m.productName,m.sku,m.userName ?? "",typeLabels[m.type] ?? "",reasonLabels[m.reason] ?? ""].some(v=>v.toLocaleLowerCase("es-MX").includes(query.toLocaleLowerCase("es-MX")))),[history,query]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formData = new FormData(event.currentTarget); setError("");
    startTransition(async()=>{ const result=await registerInventoryMovement(formData); if(result.error){setError(result.error);return;} window.location.reload(); });
  }

  return <div className="space-y-6">
    <section className="rounded-2xl border border-white/70 bg-white p-4 shadow-md sm:p-6">
      <h2 className="text-lg font-bold text-gray-900">Registrar movimiento</h2>
      <p className="mt-1 text-sm text-gray-500">La existencia se actualiza junto con el registro, en una sola transacción segura.</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Tipo de movimiento *</span><select name="type" value={type} onChange={e=>setType(e.target.value)} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900"><option value="entry">Entrada</option><option value="exit">Salida</option><option value="adjustment">Ajuste de existencias</option></select></label>
          <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Producto *</span><select name="productId" value={productId} onChange={e=>setProductId(e.target.value)} required className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900"><option value="">Selecciona un producto</option>{products.filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.name} · {p.sku} · stock: {p.stockQuantity}</option>)}</select></label>
          <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Motivo *</span><select name="reason" key={type} required className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900">{reasons[type].map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
          <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">{type==="adjustment"?"Existencia real después del conteo *":"Cantidad *"}</span><input name="quantity" type="number" min="1" max="2147483647" step="1" required className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900" /><span className="block text-xs text-gray-500">{type==="adjustment"?"Stock actual: "+(selected?.stockQuantity ?? "—")+". Escribe la cantidad total correcta.":"Usa una cantidad entera mayor que cero."}</span></label>
          <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-semibold text-gray-700">Notas (opcional)</span><textarea name="notes" maxLength={1000} rows={2} placeholder="Referencia de compra, detalle de daño, observaciones..." className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900" /></label>
        </div>
        {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        <div className="flex justify-end"><button disabled={pending||!products.some(p=>p.active)} className="min-h-11 rounded-xl bg-[#176B7A] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#125663] disabled:opacity-50">{pending?"Registrando...":"Registrar movimiento"}</button></div>
      </form>
    </section>
    <section className="space-y-4 rounded-2xl border border-white/70 bg-white p-4 shadow-md sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-gray-900">Historial de movimientos</h2><p className="text-sm text-gray-500">Últimos 200 movimientos registrados.</p></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar producto, SKU o responsable..." className="min-h-11 rounded-xl border border-gray-200 px-3.5 text-sm text-gray-900 sm:w-80" /></div>
      <div className="overflow-x-auto rounded-xl border border-gray-100"><table className="w-full min-w-[950px] text-left"><thead className="bg-gray-50"><tr>{["Fecha","Producto","Tipo / motivo","Cantidad","Existencias","Responsable","Notas"].map(label=><th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-gray-100">{visibleHistory.map(m=><tr key={m.id} className="hover:bg-gray-50"><td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{new Date(m.createdAt).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"})} <span className="text-gray-400">{new Date(m.createdAt).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}</span></td><td className="px-4 py-3"><p className="font-semibold text-gray-900">{m.productName}</p><p className="text-xs text-gray-500">{m.sku}</p></td><td className="px-4 py-3"><span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-bold "+(m.type==="entry"?"bg-emerald-50 text-emerald-700":m.type==="exit"?"bg-red-50 text-red-700":"bg-amber-50 text-amber-800")}>{typeLabels[m.type]}</span><p className="mt-1 text-xs text-gray-500">{reasonLabels[m.reason]??m.reason}</p></td><td className="px-4 py-3 font-semibold text-gray-900">{m.type==="entry"?"+":m.type==="exit"?"−":""}{m.quantity}</td><td className="px-4 py-3 text-sm text-gray-700">{m.stockBefore} → <span className="font-bold">{m.stockAfter}</span></td><td className="px-4 py-3 text-sm text-gray-600">{m.userName??"Usuario eliminado"}</td><td className="max-w-xs px-4 py-3 text-sm text-gray-600">{m.notes||"—"}</td></tr>)}
      {visibleHistory.length===0&&<tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500">No hay movimientos que coincidan con la búsqueda.</td></tr>}</tbody></table></div>
    </section>
  </div>;
}
