"use client";

import { useMemo, useState } from "react";

type Product = { id: string; name: string; sku: string; category: string; costPrice: string; stockQuantity: number; minStock: number; active: boolean };
const money = (value: number) => value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export function ReplenishmentReport({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [includeAll, setIncludeAll] = useState(false);
  const [targets, setTargets] = useState<Record<string, number>>({});
  const candidates = useMemo(() => products.filter((p) => p.active).map((p) => ({
    ...p,
    target: targets[p.id] ?? Math.max(p.minStock * 2, p.minStock + 5),
  })).filter((p) => includeAll || p.stockQuantity <= p.minStock)
    .filter((p) => !query.trim() || [p.name, p.sku, p.category].some((v) => v.toLocaleLowerCase("es-MX").includes(query.trim().toLocaleLowerCase("es-MX"))))
    .sort((a, b) => a.stockQuantity - b.stockQuantity || a.name.localeCompare(b.name, "es-MX")), [products, includeAll, query, targets]);
  const rows = candidates.map((p) => ({ ...p, suggested: Math.max(0, p.target - p.stockQuantity), cost: Number(p.costPrice) }));
  const needsPurchase = rows.filter((p) => p.suggested > 0);
  const totalUnits = needsPurchase.reduce((sum, p) => sum + p.suggested, 0);
  const totalCost = needsPurchase.reduce((sum, p) => sum + p.suggested * p.cost, 0);

  function exportCsv() {
    const headers = ["Producto", "SKU", "Categoría", "Existencias actuales", "Stock mínimo", "Stock objetivo", "Cantidad sugerida", "Costo unitario (MXN)", "Costo estimado (MXN)"];
    const data = needsPurchase.map((p) => [p.name, p.sku, p.category, p.stockQuantity, p.minStock, p.target, p.suggested, p.cost.toFixed(2), (p.suggested * p.cost).toFixed(2)]);
    const escapeCell = (value: string | number) => {
      const text = String(value);
      return /[;"\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    };
    const csv = "\uFEFF" + [headers, ...data].map((row) => row.map(escapeCell).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reabastecimiento-inventario-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return <section className="space-y-5 rounded-2xl border border-white/70 bg-white p-4 shadow-md sm:p-6">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176B7A]">Planificación de compras</p><h2 className="mt-1 text-xl font-bold text-gray-900">Lista de reabastecimiento</h2><p className="mt-1 max-w-2xl text-sm text-gray-500">Calcula una cantidad sugerida para recuperar existencias y estima el presupuesto con el costo de compra actual.</p></div>
      <button type="button" onClick={exportCsv} disabled={needsPurchase.length === 0} className="min-h-11 rounded-xl bg-[#FFD400] px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-[#f2ca00] disabled:cursor-not-allowed disabled:opacity-50">Exportar lista CSV</button>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-xl border border-amber-100 bg-amber-50/70 p-4"><p className="text-sm font-medium text-amber-900">Productos por comprar</p><p className="mt-1 text-2xl font-bold text-amber-900">{needsPurchase.length}</p></article>
      <article className="rounded-xl border border-gray-100 bg-gray-50 p-4"><p className="text-sm font-medium text-gray-500">Unidades sugeridas</p><p className="mt-1 text-2xl font-bold text-gray-900">{totalUnits.toLocaleString("es-MX")}</p></article>
      <article className="rounded-xl border border-[#176B7A]/15 bg-[#176B7A]/5 p-4"><p className="text-sm font-medium text-[#176B7A]">Presupuesto estimado</p><p className="mt-1 text-2xl font-bold text-gray-900">{money(totalCost)}</p><p className="mt-1 text-xs text-gray-500">Con el costo unitario registrado</p></article>
    </div>
    <div className="flex flex-col gap-3 sm:flex-row">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por producto, SKU o categoría..." aria-label="Buscar productos para reabastecer" className="min-h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" />
      <label className="flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm text-gray-700"><input type="checkbox" checked={includeAll} onChange={(e) => setIncludeAll(e.target.checked)} className="h-4 w-4 accent-[#176B7A]" />Mostrar todos los productos activos</label>
    </div>
    <div className="overflow-hidden rounded-xl border border-gray-100">
      {rows.length === 0 ? <div className="px-5 py-12 text-center"><p className="font-semibold text-gray-900">No hay productos para mostrar</p><p className="mt-1 text-sm text-gray-500">{query ? "Prueba con otra búsqueda." : "No hay productos activos por debajo de su stock mínimo."}</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left"><thead className="bg-gray-50"><tr>{["Producto","SKU","Existencias","Stock mínimo","Stock objetivo","Cantidad sugerida","Costo unitario","Costo estimado"].map((label) => <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{rows.map((p) => <tr key={p.id} className="hover:bg-gray-50"><td className="px-4 py-3"><p className="text-sm font-semibold text-gray-900">{p.name}</p><p className="text-xs text-gray-500">{p.category}</p></td><td className="px-4 py-3 text-sm text-gray-600">{p.sku}</td><td className="px-4 py-3 text-sm font-bold text-gray-900">{p.stockQuantity}</td><td className="px-4 py-3 text-sm text-gray-700">{p.minStock}</td><td className="px-4 py-3"><label className="sr-only" htmlFor={"target-" + p.id}>Stock objetivo para {p.name}</label><input id={"target-" + p.id} type="number" min={0} max={9999999} step={1} value={p.target} onChange={(e) => setTargets((current) => ({ ...current, [p.id]: Math.max(0, Math.min(9999999, Number(e.target.value) || 0)) }))} className="min-h-9 w-24 rounded-lg border border-gray-200 px-2 text-sm text-gray-900 focus:border-[#176B7A] focus:outline-none focus:ring-2 focus:ring-[#176B7A]/10" /></td><td className="px-4 py-3 text-sm font-bold">{p.suggested > 0 ? <span className="text-[#176B7A]">{p.suggested}</span> : <span className="text-gray-400">0</span>}</td><td className="px-4 py-3 text-sm text-gray-700">{money(p.cost)}</td><td className="px-4 py-3 text-sm font-semibold text-gray-900">{money(p.suggested * p.cost)}</td></tr>)}</tbody></table></div>}
    </div>
    <p className="text-xs text-gray-500">La sugerencia inicial lleva el stock al doble del mínimo o, cuando el mínimo es bajo, al menos 5 unidades por encima. Puedes editar el stock objetivo de cada producto antes de exportar. El presupuesto es una estimación y no crea órdenes de compra.</p>
  </section>;
}
