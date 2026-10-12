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
  const [productId,setProductId] = useState("");
  const [productSearch,setProductSearch] = useState("");
  const [showProductResults,setShowProductResults] = useState(false);
  const [error,setError] = useState("");
  const [pending,startTransition] = useTransition();
  const [query,setQuery] = useState("");
  const [historyType,setHistoryType] = useState("all");
  const [dateFrom,setDateFrom] = useState("");
  const [dateTo,setDateTo] = useState("");
  const selected = products.find(p=>p.id===productId);
  const productMatches = useMemo(() => {
    const q = productSearch.trim().toLocaleLowerCase("es-MX");
    return products.filter(p => p.active && (!q || p.name.toLocaleLowerCase("es-MX").includes(q) || p.sku.toLocaleLowerCase("es-MX").includes(q))).slice(0, 8);
  }, [products, productSearch]);
  const visibleHistory = useMemo(()=>{
    const q = query.trim().toLocaleLowerCase("es-MX");
    return history.filter(m=>{
      const matchesQuery = !q || [m.productName,m.sku,m.userName ?? "",typeLabels[m.type] ?? "",reasonLabels[m.reason] ?? ""].some(v=>v.toLocaleLowerCase("es-MX").includes(q));
      const matchesType = historyType === "all" || m.type === historyType;
      const movementDate = new Date(m.createdAt);
      const from = dateFrom ? new Date(dateFrom + "T00:00:00") : null;
      const to = dateTo ? new Date(dateTo + "T23:59:59.999") : null;
      return matchesQuery && matchesType && (!from || movementDate >= from) && (!to || movementDate <= to);
    });
  },[history,query,historyType,dateFrom,dateTo]);
  const filtersActive = Boolean(query || historyType !== "all" || dateFrom || dateTo);
  function clearHistoryFilters(){setQuery("");setHistoryType("all");setDateFrom("");setDateTo("");}

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
          <div className="space-y-1.5">
            <label htmlFor="movement-product-search" className="block text-sm font-semibold text-gray-700">Producto *</label>
            <input id="movement-product-search" type="search" value={productSearch} autoComplete="off" onFocus={()=>setShowProductResults(true)} onChange={e=>{setProductSearch(e.target.value);setProductId("");setShowProductResults(true);}} placeholder="Buscar por nombre o SKU..." className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" />
            {showProductResults && productSearch.trim() && !selected && <div className="mt-1 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
              {productMatches.length ? productMatches.map(p=><button key={p.id} type="button" onClick={()=>{setProductId(p.id);setProductSearch(p.name+" · "+p.sku);setShowProductResults(false);}} className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-3.5 py-3 text-left last:border-b-0 hover:bg-[#176B7A]/5">
                <span><span className="block text-sm font-semibold text-gray-900">{p.name}</span><span className="block text-xs text-gray-500">SKU: {p.sku}</span></span><span className="shrink-0 text-xs font-bold text-gray-600">Stock: {p.stockQuantity}</span>
              </button>) : <p className="px-3.5 py-3 text-sm text-gray-500">No encontramos productos activos.</p>}
            </div>}
            {selected && <p className="text-xs font-medium text-[#176B7A]">Seleccionado: {selected.name} · Stock actual: {selected.stockQuantity}</p>}
            <input type="hidden" name="productId" value={productId} />
          </div>
          <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Motivo *</span><select name="reason" key={type} required className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900">{reasons[type].map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
          <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">{type==="adjustment"?"Existencia real después del conteo *":"Cantidad *"}</span><input name="quantity" type="number" min="1" max="2147483647" step="1" required className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900" /><span className="block text-xs text-gray-500">{type==="adjustment"?"Stock actual: "+(selected?.stockQuantity ?? "—")+". Escribe la cantidad total correcta.":"Usa una cantidad entera mayor que cero."}</span></label>
          <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-semibold text-gray-700">Notas (opcional)</span><textarea name="notes" maxLength={1000} rows={2} placeholder="Referencia de compra, detalle de daño, observaciones..." className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900" /></label>
        </div>
        {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        <div className="flex justify-end"><button disabled={pending||!selected} className="min-h-11 rounded-xl bg-[#176B7A] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#125663] disabled:opacity-50">{pending?"Registrando...":"Registrar movimiento"}</button></div>
      </form>
    </section>
    <section className="space-y-4 rounded-2xl border border-white/70 bg-white p-4 shadow-md sm:p-6">
      <div className="space-y-4"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-gray-900">Historial de movimientos</h2><p className="text-sm text-gray-500">Últimos 200 movimientos registrados.</p></div><p className="text-sm font-medium text-gray-600">Mostrando {visibleHistory.length} de {history.length}</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Buscar</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Producto, SKU o responsable..." className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label><label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tipo de movimiento</span><select value={historyType} onChange={e=>setHistoryType(e.target.value)} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10"><option value="all">Todos los tipos</option><option value="entry">Entradas</option><option value="exit">Salidas</option><option value="adjustment">Ajustes</option></select></label><label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Desde</span><input type="date" value={dateFrom} max={dateTo || undefined} onChange={e=>setDateFrom(e.target.value)} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label><label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Hasta</span><input type="date" value={dateTo} min={dateFrom || undefined} onChange={e=>setDateTo(e.target.value)} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label></div><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-gray-500">{filtersActive ? "Hay filtros aplicados al historial." : "Mostrando movimientos sin filtros adicionales."}</p>{filtersActive && <button type="button" onClick={clearHistoryFilters} className="self-start rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-[#176B7A] transition hover:bg-[#176B7A]/5 sm:self-auto">Limpiar filtros</button>}</div></div>
      <div className="overflow-x-auto rounded-xl border border-gray-100"><table className="w-full min-w-[950px] text-left"><thead className="bg-gray-50"><tr>{["Fecha","Producto","Tipo / motivo","Cantidad","Existencias","Responsable","Notas"].map(label=><th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-gray-100">{visibleHistory.map(m=><tr key={m.id} className="hover:bg-gray-50"><td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{new Date(m.createdAt).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"})} <span className="text-gray-400">{new Date(m.createdAt).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}</span></td><td className="px-4 py-3"><p className="font-semibold text-gray-900">{m.productName}</p><p className="text-xs text-gray-500">{m.sku}</p></td><td className="px-4 py-3"><span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-bold "+(m.type==="entry"?"bg-emerald-50 text-emerald-700":m.type==="exit"?"bg-red-50 text-red-700":"bg-amber-50 text-amber-800")}>{typeLabels[m.type]}</span><p className="mt-1 text-xs text-gray-500">{reasonLabels[m.reason]??m.reason}</p></td><td className="px-4 py-3 font-semibold text-gray-900">{m.type==="entry"?"+":m.type==="exit"?"−":""}{m.quantity}</td><td className="px-4 py-3 text-sm text-gray-700">{m.stockBefore} → <span className="font-bold">{m.stockAfter}</span></td><td className="px-4 py-3 text-sm text-gray-600">{m.userName??"Usuario eliminado"}</td><td className="max-w-xs px-4 py-3 text-sm text-gray-600">{m.notes||"—"}</td></tr>)}
      {visibleHistory.length===0&&<tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500">No hay movimientos que coincidan con los filtros seleccionados.</td></tr>}</tbody></table></div>
    </section>
  </div>;
}
