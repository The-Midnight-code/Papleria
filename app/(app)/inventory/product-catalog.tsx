"use client";

import { useMemo, useState, useTransition } from "react";
import { createProduct, setProductActive, updateProduct } from "./product-actions";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  costPrice: string;
  salePrice: string;
  stockQuantity: number;
  minStock: number;
  active: boolean;
};

export function ProductCatalog({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es-MX");
    return products.filter((product) => {
      const matchesQuery = !q || [product.name, product.sku, product.category].some((value) => value.toLocaleLowerCase("es-MX").includes(q));
      const low = product.stockQuantity <= product.minStock;
      const matchesStock = stockFilter === "all" || (stockFilter === "low" && low) || (stockFilter === "out" && product.stockQuantity === 0);
      return matchesQuery && matchesStock;
    }).sort((a, b) => a.name.localeCompare(b.name, "es-MX"));
  }, [products, query, stockFilter]);

  const lowCount = products.filter((product) => product.active && product.stockQuantity > 0 && product.stockQuantity <= product.minStock).length;
  const outCount = products.filter((product) => product.active && product.stockQuantity === 0).length;
  const stockValue = products.reduce((sum, product) => sum + Number(product.costPrice) * product.stockQuantity, 0);
  const alertProducts = products
    .filter((product) => product.active && (product.stockQuantity === 0 || product.stockQuantity <= product.minStock))
    .sort((a, b) => {
      if (a.stockQuantity === 0 && b.stockQuantity !== 0) return -1;
      if (b.stockQuantity === 0 && a.stockQuantity !== 0) return 1;
      return a.stockQuantity - b.stockQuantity || a.name.localeCompare(b.name, "es-MX");
    });

  function exportCsv() {
    const headers = ["Producto", "SKU", "Categoría", "Descripción", "Precio de compra (MXN)", "Precio de venta (MXN)", "Existencias", "Stock mínimo", "Estado"];
    const rows = visibleProducts.map((product) => {
      const status = !product.active ? "Inactivo" : product.stockQuantity === 0 ? "Agotado" : product.stockQuantity <= product.minStock ? "Stock bajo" : "Disponible";
      return [product.name, product.sku, product.category, product.description ?? "", product.costPrice, product.salePrice, product.stockQuantity, product.minStock, status];
    });
    const escapeCell = (value: string | number) => {
      const text = String(value);
      return /[;"\\n\\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    };
    // CSV estándar para Numbers: sin la directiva específica de Excel y con saltos de línea reales.
    const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(escapeCell).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventario-papeleria-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setSuccess("Se exportaron " + visibleProducts.length + " productos a CSV.");
  }

  function submitProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await createProduct(formData);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Producto registrado correctamente.");
      setShowForm(false);
      form.reset();
      window.location.reload();
    });
  }

  function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProduct) return;
    const formData = new FormData(event.currentTarget);
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await updateProduct(editingProduct.id, formData);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Producto actualizado correctamente.");
      setEditingProduct(null);
      window.location.reload();
    });
  }

  function toggleProduct(product: Product) {
    const nextActive = !product.active;
    const confirmed = window.confirm(
      nextActive
        ? `¿Quieres volver a activar “${product.name}”?`
        : `¿Quieres desactivar “${product.name}”? El producto se conservará en el historial.`,
    );
    if (!confirmed) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await setProductActive(product.id, nextActive);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSuccess(nextActive ? "Producto activado correctamente." : "Producto desactivado correctamente.");
      window.location.reload();
    });
  }

  return (
    <div className="space-y-6">
      <section aria-label="Resumen del inventario" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-white/60 bg-white/95 p-4 shadow-sm"><p className="text-sm font-medium text-gray-500">Productos registrados</p><p className="mt-1 text-2xl font-bold text-gray-900">{products.length}</p></article>
        <article className="rounded-2xl border border-white/60 bg-white/95 p-4 shadow-sm"><p className="text-sm font-medium text-gray-500">Valor al costo</p><p className="mt-1 text-2xl font-bold text-gray-900">{stockValue.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</p></article>
        <button type="button" onClick={() => setStockFilter(stockFilter === "low" ? "all" : "low")} aria-pressed={stockFilter === "low"} className={"rounded-2xl border bg-white/95 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md " + (stockFilter === "low" ? "border-amber-400 ring-2 ring-amber-200" : "border-white/60")}><p className="text-sm font-medium text-gray-500">Stock bajo</p><p className="mt-1 text-2xl font-bold text-amber-700">{lowCount}</p><p className="mt-1 text-xs text-gray-500">Ver productos por reabastecer</p></button>
        <button type="button" onClick={() => setStockFilter(stockFilter === "out" ? "all" : "out")} aria-pressed={stockFilter === "out"} className={"rounded-2xl border bg-white/95 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md " + (stockFilter === "out" ? "border-red-400 ring-2 ring-red-200" : "border-white/60")}><p className="text-sm font-medium text-gray-500">Agotados</p><p className="mt-1 text-2xl font-bold text-red-700">{outCount}</p><p className="mt-1 text-xs text-gray-500">Ver productos sin existencias</p></button>
      </section>

      {alertProducts.length > 0 && (
        <section aria-labelledby="inventory-alerts-title" className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-amber-100 bg-amber-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div><h2 id="inventory-alerts-title" className="font-bold text-gray-900">Alertas de reabastecimiento</h2><p className="mt-0.5 text-sm text-gray-600">{alertProducts.length} {alertProducts.length === 1 ? "producto necesita" : "productos necesitan"} atención por sus existencias.</p></div>
            <button type="button" onClick={() => setStockFilter("low")} className="self-start rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 sm:self-auto">Ver stock bajo</button>
          </div>
          <div className="divide-y divide-gray-100">
            {alertProducts.slice(0, 5).map((product) => {
              const out = product.stockQuantity === 0;
              return <button key={product.id} type="button" onClick={() => { setQuery(product.sku); setStockFilter("all"); }} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50 sm:px-5">
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-gray-900">{product.name}</span><span className="block text-xs text-gray-500">SKU: {product.sku} · mínimo: {product.minStock}</span></span>
                <span className={"shrink-0 rounded-full px-2.5 py-1 text-xs font-bold " + (out ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800")}>{out ? "Agotado" : "Stock bajo"} · {product.stockQuantity}</span>
              </button>;
            })}
          </div>
          {alertProducts.length > 5 && <div className="border-t border-gray-100 px-4 py-3 text-center text-sm text-gray-500">Hay {alertProducts.length - 5} alertas más. Usa los filtros para consultarlas todas.</div>}
        </section>
      )}

      <section className="space-y-4 rounded-2xl border border-white/70 bg-white p-4 shadow-md sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Buscar productos</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por producto, SKU o categoría..." className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" />
          </label>
          <label className="sm:w-52">
            <span className="sr-only">Filtrar por existencias</span>
            <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10">
              <option value="all">Todas las existencias</option><option value="low">Stock bajo</option><option value="out">Agotados</option>
            </select>
          </label>
          <button type="button" onClick={exportCsv} disabled={visibleProducts.length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#176B7A]/25 bg-white px-4 py-2.5 text-sm font-bold text-[#176B7A] shadow-sm transition hover:bg-[#176B7A]/5 disabled:cursor-not-allowed disabled:opacity-50">
            <span aria-hidden="true">↓</span> Exportar CSV
          </button>
          <button type="button" onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FFD400] px-5 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-[#f2ca00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B7A]">
            {showForm ? "Cerrar formulario" : "+ Nuevo producto"}
          </button>
        </div>

        {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{success}</p>}
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}

        {editingProduct && (
          <form key={editingProduct.id} onSubmit={submitEdit} className="space-y-4 rounded-2xl border border-[#176B7A]/20 bg-[#176B7A]/5 p-4 sm:p-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Editar producto</h2>
              <p className="mt-1 text-sm text-gray-500">Actualiza los datos comerciales. Las existencias se gestionarán mediante movimientos para conservar su historial.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Nombre del producto *</span><input name="name" required maxLength={160} defaultValue={editingProduct.name} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label>
              <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">SKU / código *</span><input name="sku" required maxLength={60} defaultValue={editingProduct.sku} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm uppercase text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label>
              <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Categoría *</span><input name="category" required maxLength={100} defaultValue={editingProduct.category} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label>
              <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Descripción</span><input name="description" maxLength={2000} defaultValue={editingProduct.description ?? ""} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label>
              <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Precio de compra (MXN) *</span><input name="costPrice" required type="number" min="0" max="99999999" step="0.01" defaultValue={editingProduct.costPrice} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label>
              <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Precio de venta (MXN) *</span><input name="salePrice" required type="number" min="0" max="99999999" step="0.01" defaultValue={editingProduct.salePrice} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label>
              <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Avisar cuando haya (o menos) *</span><input name="minStock" required type="number" min="0" max="9999999" step="1" defaultValue={editingProduct.minStock} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setEditingProduct(null)} disabled={pending} className="min-h-11 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100">Cancelar</button>
              <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-[#176B7A] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </form>
        )}

        {showForm && (
          <form onSubmit={submitProduct} className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
            <div><h2 className="text-lg font-bold text-gray-900">Registrar producto</h2><p className="mt-1 text-sm text-gray-500">Captura los datos del artículo y las existencias iniciales.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Nombre del producto *</span><input name="name" required maxLength={160} placeholder="Ej. Cuaderno profesional" className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label>
              <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">SKU / código *</span><input name="sku" required maxLength={60} placeholder="Ej. CUA-PRO-001" className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm uppercase text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label>
              <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Categoría *</span><input name="category" required maxLength={100} placeholder="Ej. Cuadernos" className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label>
              <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Descripción</span><input name="description" maxLength={2000} placeholder="Marca, tamaño, color..." className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label>
              <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Precio de compra (MXN) *</span><input name="costPrice" required type="number" min="0" max="99999999" step="0.01" defaultValue="0" className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label>
              <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Precio de venta (MXN) *</span><input name="salePrice" required type="number" min="0" max="99999999" step="0.01" className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label>
              <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Existencias iniciales *</span><input name="stockQuantity" required type="number" min="0" max="9999999" step="1" defaultValue="0" className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label>
              <label className="space-y-1.5"><span className="text-sm font-semibold text-gray-700">Avisar cuando haya (o menos) *</span><input name="minStock" required type="number" min="0" max="9999999" step="1" defaultValue="5" className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" /></label>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowForm(false)} disabled={pending} className="min-h-11 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100">Cancelar</button><button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-[#176B7A] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#125663] disabled:cursor-wait disabled:opacity-60">{pending ? "Guardando..." : "Guardar producto"}</button></div>
          </form>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-100">
          {visibleProducts.length === 0 ? <div className="px-5 py-12 text-center"><p className="font-semibold text-gray-900">{products.length === 0 ? "Todavía no hay productos" : "No encontramos productos"}</p><p className="mt-1 text-sm text-gray-500">{products.length === 0 ? "Registra el primer producto para comenzar a controlar las existencias." : "Cambia la búsqueda o el filtro para ver otros productos."}</p></div> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left">
              <thead className="bg-gray-50"><tr>{["Producto","SKU","Categoría","Compra","Venta","Existencias","Estado","Acciones"].map((label) => <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100 bg-white">{visibleProducts.map((product) => {
                const out = product.stockQuantity === 0;
                const low = !out && product.stockQuantity <= product.minStock;
                return <tr key={product.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-4"><p className="font-semibold text-gray-900">{product.name}</p>{product.description && <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500">{product.description}</p>}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-600">{product.sku}</td><td className="px-4 py-4 text-sm text-gray-600">{product.category}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{Number(product.costPrice).toLocaleString("es-MX",{style:"currency",currency:"MXN"})}</td><td className="px-4 py-4 text-sm font-semibold text-gray-900">{Number(product.salePrice).toLocaleString("es-MX",{style:"currency",currency:"MXN"})}</td>
                  <td className="px-4 py-4"><span className="font-bold text-gray-900">{product.stockQuantity}</span><span className="ml-1 text-xs text-gray-400">/ mín. {product.minStock}</span></td>
                  <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${!product.active ? "bg-gray-100 text-gray-600" : out ? "bg-red-50 text-red-700" : low ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>{!product.active ? "Inactivo" : out ? "Agotado" : low ? "Stock bajo" : "Disponible"}</span></td>
                  <td className="px-4 py-4"><div className="flex items-center gap-2">
                    <button type="button" disabled={pending} onClick={() => { setShowForm(false); setEditingProduct(product); setError(""); setSuccess(""); }} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#176B7A] hover:bg-[#176B7A]/5 disabled:opacity-50">Editar</button>
                    <button type="button" disabled={pending} onClick={() => toggleProduct(product)} className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${product.active ? "border-red-200 text-red-700 hover:bg-red-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}>{product.active ? "Desactivar" : "Activar"}</button>
                  </div></td>
                </tr>;
              })}</tbody>
            </table></div>
          )}
        </div>
        <p aria-live="polite" className="text-sm text-gray-500">Mostrando {visibleProducts.length} de {products.length} productos</p>
      </section>
    </div>
  );
}
