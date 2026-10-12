"use client";

import { useMemo, useState, useTransition } from "react";
import { registerPurchase } from "./purchase-actions";

type Product = { id: string; name: string; sku: string; costPrice: string; stockQuantity: number; active: boolean };
type PurchaseItem = { purchaseId: string; productName: string; sku: string; quantity: number; unitCost: string; lineTotal: string };
type Purchase = { id: string; supplierName: string; reference: string | null; notes: string | null; totalAmount: string; purchasedAt: string; createdAt: string; userName: string | null; itemCount: number; items: PurchaseItem[] };
type Line = { productId: string; quantity: number; unitCost: string };
const money = (value: number) => value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const dateLabel = (value: string) => new Date(value).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
const localDateValue = () => { const now = new Date(); return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0"); };

export function PurchaseManager({ products, history }: { products: Product[]; history: Purchase[] }) {
  const [supplierName, setSupplierName] = useState("");
  const [reference, setReference] = useState("");
  const [purchasedAt, setPurchasedAt] = useState(localDateValue());
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: 1, unitCost: "0.00" }]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const activeProducts = products.filter((p) => p.active);
  const selectedIds = lines.map((line) => line.productId).filter(Boolean);
  const total = lines.reduce((sum, line) => sum + Math.max(0, Number(line.quantity) || 0) * Math.max(0, Number(line.unitCost) || 0), 0);
  const visibleHistory = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es-MX");
    return history.filter((purchase) => {
      const matchesQuery = !q || [purchase.supplierName, purchase.reference ?? "", purchase.notes ?? "", ...purchase.items.flatMap((item) => [item.productName, item.sku])]
        .some((value) => value.toLocaleLowerCase("es-MX").includes(q));
      const date = new Date(purchase.purchasedAt);
      const from = dateFrom ? new Date(dateFrom + "T00:00:00") : null;
      const to = dateTo ? new Date(dateTo + "T23:59:59.999") : null;
      return matchesQuery && (!from || date >= from) && (!to || date <= to);
    });
  }, [history, query, dateFrom, dateTo]);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((current) => current.map((line, i) => i === index ? { ...line, ...patch } : line));
  }
  function selectProduct(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateLine(index, { productId, unitCost: product?.costPrice ?? "0.00" });
  }
  function addLine() {
    if (lines.length < 100) setLines((current) => [...current, { productId: "", quantity: 1, unitCost: "0.00" }]);
  }
  function removeLine(index: number) {
    setLines((current) => current.length > 1 ? current.filter((_, i) => i !== index) : current);
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lines.some((line) => !line.productId || !Number.isSafeInteger(Number(line.quantity)) || Number(line.quantity) < 1 || !/^\d{1,8}(?:\.\d{1,2})?$/.test(line.unitCost))) {
      setError("Completa cada producto con una cantidad entera y un costo válido."); return;
    }
    if (new Set(lines.map((line) => line.productId)).size !== lines.length) {
      setError("Cada producto debe aparecer una sola vez. Combina las cantidades si es necesario."); return;
    }
    if (!window.confirm("¿Registrar esta compra y sumar las cantidades al inventario? Esta acción guardará la compra y sus movimientos de entrada.")) return;
    const form = new FormData(event.currentTarget);
    form.set("items", JSON.stringify(lines.map((line) => ({ productId: line.productId, quantity: Number(line.quantity), unitCost: line.unitCost }))));
    setError("");
    startTransition(async () => {
      const result = await registerPurchase(form);
      if (result.error) { setError(result.error); return; }
      window.location.reload();
    });
  }
  function exportCsv() {
    const headers = ["Fecha de compra", "Proveedor", "Folio / referencia", "Productos", "Unidades", "Total MXN", "Responsable", "Notas"];
    const rows = visibleHistory.map((purchase) => [
      dateLabel(purchase.purchasedAt), purchase.supplierName, purchase.reference ?? "",
      purchase.items.map((item) => item.productName + " (" + item.sku + ") x" + item.quantity + " @ " + money(Number(item.unitCost))).join(" | "),
      purchase.items.reduce((sum, item) => sum + item.quantity, 0), Number(purchase.totalAmount).toFixed(2),
      purchase.userName ?? "Usuario eliminado", purchase.notes ?? "",
    ]);
    const escapeCell = (value: string | number) => { const text = String(value); return /[;"\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text; };
    const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(escapeCell).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url;
    link.download = "compras-proveedores-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }

  return <div className="space-y-6">
    <section className="rounded-2xl border border-white/70 bg-white p-4 shadow-md sm:p-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176B7A]">Entrada de mercancía</p><h2 className="mt-1 text-xl font-bold text-gray-900">Registrar compra recibida</h2><p className="mt-1 text-sm text-gray-500">Al confirmar, el sistema guardará la compra, actualizará el costo del producto y aumentará el stock de cada artículo.</p></div>
      <form onSubmit={submit} className="mt-5 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Proveedor *</span><input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} name="supplierName" required maxLength={160} placeholder="Nombre del proveedor" className="min-h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm text-gray-900" /></label>
          <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Folio / factura</span><input value={reference} onChange={(e) => setReference(e.target.value)} name="reference" maxLength={100} placeholder="Ej. FAC-1048" className="min-h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm text-gray-900" /></label>
          <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Fecha de compra *</span><input type="date" value={purchasedAt} onChange={(e) => setPurchasedAt(e.target.value)} name="purchasedAt" required className="min-h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm text-gray-900" /></label>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-gray-900">Productos recibidos</h3><button type="button" onClick={addLine} disabled={lines.length >= 100 || lines.length >= activeProducts.length} className="min-h-10 rounded-xl border border-[#176B7A]/25 px-4 py-2 text-sm font-bold text-[#176B7A] hover:bg-[#176B7A]/5 disabled:opacity-40">+ Agregar producto</button></div>
          {lines.map((line, index) => {
            const product = products.find((p) => p.id === line.productId);
            const lineTotal = (Number(line.quantity) || 0) * (Number(line.unitCost) || 0);
            return <div key={index} className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(100px,0.7fr)_minmax(130px,0.9fr)_minmax(120px,0.8fr)_auto] sm:p-4">
              <label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Producto *</span><select value={line.productId} onChange={(e) => selectProduct(index, e.target.value)} required className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900"><option value="">Seleccionar producto...</option>{activeProducts.filter((p) => p.id === line.productId || !selectedIds.includes(p.id)).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.sku}</option>)}</select>{product && <span className="block text-xs text-gray-500">Stock actual: {product.stockQuantity}</span>}</label>
              <label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Cantidad *</span><input type="number" min="1" max="2147483647" step="1" value={line.quantity} onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })} required className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900" /></label>
              <label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Costo unitario (MXN) *</span><input type="number" min="0" max="99999999.99" step="0.01" value={line.unitCost} onChange={(e) => updateLine(index, { unitCost: e.target.value })} required className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900" /></label>
              <div className="flex flex-col justify-center"><span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Importe</span><span className="mt-1 font-bold text-gray-900">{money(lineTotal)}</span></div>
              <button type="button" onClick={() => removeLine(index)} disabled={lines.length === 1} aria-label="Quitar producto" className="min-h-10 self-end rounded-lg px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-30">Quitar</button>
            </div>;
          })}
        </div>
        <label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-700">Notas (opcional)</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} name="notes" maxLength={1000} rows={2} placeholder="Condiciones de entrega u observaciones..." className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-gray-900" /></label>
        <div className="flex flex-col gap-3 rounded-xl bg-[#176B7A]/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-gray-600">Total estimado de compra</p><p className="text-2xl font-bold text-gray-900">{money(total)}</p><p className="text-xs text-gray-500">{lines.length} renglón(es) de producto · Moneda MXN</p></div><button disabled={pending || !activeProducts.length} className="min-h-11 rounded-xl bg-[#176B7A] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#125663] disabled:opacity-50">{pending ? "Registrando compra..." : "Confirmar compra y actualizar stock"}</button></div>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {!activeProducts.length && <p className="text-sm text-amber-700">Necesitas al menos un producto activo para registrar compras.</p>}
      </form>
    </section>
    <section className="space-y-4 rounded-2xl border border-white/70 bg-white p-4 shadow-md sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-gray-900">Historial de compras</h2><p className="text-sm text-gray-500">Últimas {history.length} compras registradas, con detalle de productos y costos.</p></div><button type="button" onClick={exportCsv} disabled={!visibleHistory.length} className="min-h-10 rounded-xl border border-[#176B7A]/25 px-4 py-2 text-sm font-bold text-[#176B7A] hover:bg-[#176B7A]/5 disabled:opacity-50">↓ Exportar CSV</button></div>
      <div className="grid gap-3 sm:grid-cols-3"><label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Buscar</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Proveedor, folio, producto o SKU..." className="min-h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm text-gray-900" /></label><label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Desde</span><input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} className="min-h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm text-gray-900" /></label><label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Hasta</span><input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} className="min-h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm text-gray-900" /></label></div>
      <p className="text-xs text-gray-500">Mostrando {visibleHistory.length} de {history.length} compras.</p>
      <div className="overflow-x-auto rounded-xl border border-gray-100"><table className="w-full min-w-[850px] text-left"><thead className="bg-gray-50"><tr>{["Fecha","Proveedor / folio","Productos","Total","Registró","Detalle"].map((label) => <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{visibleHistory.map((purchase) => <tr key={purchase.id} className="align-top hover:bg-gray-50"><td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{dateLabel(purchase.purchasedAt)}</td><td className="px-4 py-3"><p className="font-semibold text-gray-900">{purchase.supplierName}</p><p className="text-xs text-gray-500">{purchase.reference || "Sin folio"}</p></td><td className="px-4 py-3 text-sm text-gray-700">{purchase.itemCount}</td><td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-gray-900">{money(Number(purchase.totalAmount))}</td><td className="px-4 py-3 text-sm text-gray-600">{purchase.userName ?? "Usuario eliminado"}</td><td className="px-4 py-3"><button type="button" onClick={() => setExpanded(expanded === purchase.id ? null : purchase.id)} className="rounded-lg px-2 py-1 text-sm font-semibold text-[#176B7A] hover:bg-[#176B7A]/5">{expanded === purchase.id ? "Ocultar" : "Ver detalle"}</button>{expanded === purchase.id && <div className="mt-2 min-w-64 space-y-2 rounded-lg bg-gray-50 p-3">{purchase.items.map((item, i) => <div key={item.sku + i} className="border-b border-gray-200 pb-2 last:border-0 last:pb-0"><p className="text-sm font-semibold text-gray-900">{item.productName}</p><p className="text-xs text-gray-600">{item.sku} · {item.quantity} × {money(Number(item.unitCost))} = {money(Number(item.lineTotal))}</p></div>)}{purchase.notes && <p className="pt-1 text-xs text-gray-500">Notas: {purchase.notes}</p>}</div>}</td></tr>)}{visibleHistory.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">No hay compras que coincidan con los filtros.</td></tr>}</tbody></table></div>
    </section>
  </div>;
}
