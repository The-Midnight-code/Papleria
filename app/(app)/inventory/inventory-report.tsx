"use client";

import { useMemo, useState } from "react";

type ReportProduct = {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  minStock: number;
  costValue: number;
  saleValue: number;
  status: "low" | "out";
};

type Report = {
  units: number;
  costValue: number;
  saleValue: number;
  potentialProfit: number;
  lowCount: number;
  outCount: number;
  productCount: number;
  lowProducts: ReportProduct[];
  outProducts: ReportProduct[];
};

const money = (value: number) => value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export function InventoryReport({ report }: { report: Report }) {
  const [stockStatus, setStockStatus] = useState("all");
  const products = useMemo(() => {
    const combined = [...report.outProducts, ...report.lowProducts];
    return combined.filter((product) => stockStatus === "all" || product.status === stockStatus)
      .sort((a, b) => a.stockQuantity - b.stockQuantity || a.name.localeCompare(b.name, "es-MX"));
  }, [report, stockStatus]);

  return (
    <section aria-labelledby="inventory-report-title" className="space-y-4 rounded-2xl border border-white/70 bg-white p-4 shadow-md sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176B7A]">Resumen financiero</p>
          <h2 id="inventory-report-title" className="mt-1 text-xl font-bold text-gray-900">Reporte de inventario</h2>
          <p className="mt-1 text-sm text-gray-500">Valor de las existencias de productos activos a precios registrados actualmente.</p>
        </div>
        <span className="text-xs text-gray-500">No incluye productos inactivos</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-500">Unidades en existencia</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{report.units.toLocaleString("es-MX")}</p>
          <p className="mt-1 text-xs text-gray-500">En {report.productCount} productos activos</p>
        </article>
        <article className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-500">Valor total al costo</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{money(report.costValue)}</p>
          <p className="mt-1 text-xs text-gray-500">Costo de compra × existencias</p>
        </article>
        <article className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="text-sm font-medium text-emerald-800">Valor potencial de venta</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{money(report.saleValue)}</p>
          <p className="mt-1 text-xs text-emerald-800/75">Si se venden todas las existencias</p>
        </article>
        <article className="rounded-xl border border-[#176B7A]/15 bg-[#176B7A]/5 p-4">
          <p className="text-sm font-medium text-[#176B7A]">Ganancia bruta potencial</p>
          <p className={"mt-1 text-2xl font-bold " + (report.potentialProfit < 0 ? "text-red-700" : "text-gray-900")}>{money(report.potentialProfit)}</p>
          <p className="mt-1 text-xs text-gray-500">Antes de gastos e impuestos</p>
        </article>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => setStockStatus(stockStatus === "low" ? "all" : "low")} aria-pressed={stockStatus === "low"} className={"flex items-center justify-between rounded-xl border p-4 text-left transition " + (stockStatus === "low" ? "border-amber-400 bg-amber-50 ring-2 ring-amber-100" : "border-amber-100 bg-amber-50/50 hover:bg-amber-50")}>
          <span><span className="block text-sm font-semibold text-amber-900">Productos con stock bajo</span><span className="mt-1 block text-xs text-amber-800/75">Existencias positivas en el mínimo o por debajo</span></span>
          <span className="text-2xl font-bold text-amber-800">{report.lowCount}</span>
        </button>
        <button type="button" onClick={() => setStockStatus(stockStatus === "out" ? "all" : "out")} aria-pressed={stockStatus === "out"} className={"flex items-center justify-between rounded-xl border p-4 text-left transition " + (stockStatus === "out" ? "border-red-300 bg-red-50 ring-2 ring-red-100" : "border-red-100 bg-red-50/50 hover:bg-red-50")}>
          <span><span className="block text-sm font-semibold text-red-900">Productos agotados</span><span className="mt-1 block text-xs text-red-800/75">Requieren reabastecimiento</span></span>
          <span className="text-2xl font-bold text-red-800">{report.outCount}</span>
        </button>
      </div>

      {(report.lowProducts.length + report.outProducts.length > 0) && (
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="font-semibold text-gray-900">Productos que requieren atención</h3><p className="text-xs text-gray-500">Valores calculados con el costo y precio de venta actuales.</p></div>
            <select aria-label="Filtrar productos por estado de stock" value={stockStatus} onChange={(event) => setStockStatus(event.target.value)} className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800">
              <option value="all">Stock bajo y agotados</option><option value="low">Solo stock bajo</option><option value="out">Solo agotados</option>
            </select>
          </div>
          {products.length === 0 ? <p className="px-4 py-8 text-center text-sm text-gray-500">No hay productos en esta categoría.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="bg-white"><tr>{["Producto","SKU","Estado","Existencias","Valor al costo","Venta potencial"].map((label) => <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{products.map((product) => <tr key={product.id} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm font-semibold text-gray-900">{product.name}</td><td className="px-4 py-3 text-sm text-gray-600">{product.sku}</td><td className="px-4 py-3"><span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-bold " + (product.status === "out" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800")}>{product.status === "out" ? "Agotado" : "Stock bajo"}</span></td><td className="px-4 py-3 text-sm font-bold text-gray-900">{product.stockQuantity} <span className="font-normal text-gray-400">/ mín. {product.minStock}</span></td><td className="px-4 py-3 text-sm text-gray-700">{money(product.costValue)}</td><td className="px-4 py-3 text-sm font-semibold text-gray-900">{money(product.saleValue)}</td></tr>)}</tbody></table></div>}
        </div>
      )}
    </section>
  );
}
