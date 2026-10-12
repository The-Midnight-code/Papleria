"use client";

import { useMemo, useState, useTransition } from "react";
import { registerSale } from "../inventory/sales-actions";

type Product = { id: string; name: string; sku: string; category: string; salePrice: string; promoPrice?: string; promotionName?: string | null; stockQuantity: number; active: boolean };
type CartLine = { productId: string; quantity: number };
type Receipt = { id: string; folio: string };
const money = (value: number) => value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export function PointOfSale({ products, isAdmin }: { products: Product[]; isAdmin: boolean }) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [notes, setNotes] = useState("");
  const [manualDiscountType, setManualDiscountType] = useState("none");
  const [manualDiscountValue, setManualDiscountValue] = useState("");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [pending, startTransition] = useTransition();
  const matches = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es-MX");
    return products.filter(p => !q || p.name.toLocaleLowerCase("es-MX").includes(q) || p.sku.toLocaleLowerCase("es-MX").includes(q) || p.category.toLocaleLowerCase("es-MX").includes(q)).slice(0, 30);
  }, [products, query]);
  const lines = cart.map(line => ({ ...line, product: products.find(p => p.id === line.productId)! })).filter(line => line.product);
  const subtotal = lines.reduce((sum, line) => sum + Math.round(Number(line.product.salePrice) * 100) * line.quantity / 100, 0);
  const promoTotal = lines.reduce((sum, line) => sum + (Number(line.product.salePrice) - Number(line.product.promoPrice ?? line.product.salePrice)) * line.quantity, 0);
  const afterPromos = Math.max(0, subtotal - promoTotal);
  const manualValue = Math.max(0, Number(manualDiscountValue || 0));
  const manualDiscount = isAdmin && manualDiscountType === "percent" ? afterPromos * Math.min(100, manualValue) / 100 : isAdmin && manualDiscountType === "fixed" ? Math.min(afterPromos, manualValue) : 0;
  const total = Math.max(0, afterPromos - manualDiscount);
  const totalCents = Math.round(total * 100);
  const received = Number(amountReceived || 0);
  const change = paymentMethod === "cash" ? Math.max(0, Math.round(received * 100) - totalCents) / 100 : 0;

  function add(product: Product) {
    setError(""); setReceipt(null);
    setCart(current => {
      const existing = current.find(line => line.productId === product.id);
      if (existing) return current.map(line => line.productId === product.id ? { ...line, quantity: Math.min(product.stockQuantity, line.quantity + 1) } : line);
      return [...current, { productId: product.id, quantity: 1 }];
    });
  }
  function setQuantity(productId: string, quantity: number) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setCart(current => quantity <= 0 ? current.filter(line => line.productId !== productId) : current.map(line => line.productId === productId ? { ...line, quantity: Math.min(product.stockQuantity, quantity) } : line));
  }
  function submit() {
    setError("");
    if (!lines.length) { setError("Agrega al menos un producto al carrito."); return; }
    if (lines.some(line => !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > line.product.stockQuantity)) { setError("Revisa las cantidades: no pueden superar las existencias disponibles."); return; }
    if (paymentMethod === "cash" && (!/^\d{1,10}(?:\.\d{1,2})?$/.test(amountReceived) || Math.round(Number(amountReceived) * 100) < totalCents)) { setError("Ingresa el efectivo recibido, igual o mayor al total."); return; }
    if (paymentMethod !== "cash") setAmountReceived((totalCents / 100).toFixed(2));
    if (!window.confirm("¿Confirmar la venta por " + money(total) + "? Se descontarán las existencias y se guardará el historial.")) return;
    const formData = new FormData();
    formData.set("items", JSON.stringify(lines.map(line => ({ productId: line.productId, quantity: line.quantity }))));
    formData.set("paymentMethod", paymentMethod);
    formData.set("amountReceived", paymentMethod === "cash" ? amountReceived : (totalCents / 100).toFixed(2));
    formData.set("notes", notes);
    formData.set("manualDiscountType", isAdmin ? manualDiscountType : "none");
    formData.set("manualDiscountValue", isAdmin ? manualDiscountValue || "0" : "0");
    startTransition(async () => {
      const result = await registerSale(formData);
      if (result.error) { setError(result.error); return; }
      if (result.sale) { setReceipt(result.sale); setCart([]); setAmountReceived(""); setNotes(""); setQuery(""); setManualDiscountType("none"); setManualDiscountValue(""); }
    });
  }

  if (receipt) return <section className="rounded-2xl border border-white/70 bg-white p-6 shadow-md sm:p-8">
    <div className="mx-auto max-w-xl text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
      <h2 className="mt-4 text-2xl font-bold text-gray-900">¡Venta registrada!</h2><p className="mt-1 text-sm text-gray-500">Folio {receipt.folio}</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => window.open("/pos/sales/" + receipt.id + "?print=1", "_blank", "noopener,noreferrer")} className="min-h-11 rounded-xl bg-[#176B7A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#125663]">Ver e imprimir ticket</button><button onClick={() => setReceipt(null)} className="min-h-11 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">Nueva venta</button></div>
    </div>
  </section>;

  return <div className="mx-auto grid w-full max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
    <div className="min-w-0 space-y-5">
      <section className="rounded-2xl border border-white/70 bg-white p-4 shadow-md sm:p-5">
        <div><h2 className="text-lg font-bold text-gray-900">Buscar productos</h2><p className="text-sm text-gray-500">Busca por nombre, SKU o categoría.</p></div>
        <input value={query} onChange={e => setQuery(e.target.value)} type="search" placeholder="Buscar producto..." className="mt-3 min-h-11 w-full rounded-xl border border-gray-200 px-4 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10" autoFocus />
      </section>
      <section className="space-y-4 rounded-2xl border border-white/70 bg-white p-4 shadow-md sm:p-5">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-gray-900">Productos disponibles</h2><p className="text-sm text-gray-500">Selecciona un producto para agregarlo a la venta.</p></div><span className="shrink-0 rounded-full bg-[#176B7A]/10 px-3 py-1 text-xs font-bold text-[#176B7A]">{matches.length} resultados</span></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{matches.map(product => <button type="button" key={product.id} onClick={() => add(product)} disabled={product.stockQuantity <= 0} className="rounded-xl border border-gray-200 p-4 text-left transition hover:border-[#176B7A]/50 hover:bg-[#176B7A]/5 disabled:cursor-not-allowed disabled:opacity-45">
          <div className="flex items-start justify-between gap-2"><span className="line-clamp-2 font-semibold text-gray-900">{product.name}</span><span className="shrink-0 rounded-lg bg-[#FFD400]/30 px-2 py-1 text-xs font-bold text-gray-800">{money(Number(product.salePrice))}</span></div>
          <p className="mt-2 text-xs text-gray-500">SKU: {product.sku} · {product.category}</p>{product.promotionName && Number(product.promoPrice) < Number(product.salePrice) && <p className="mt-2 text-xs font-bold text-emerald-700">{product.promotionName}: {money(Number(product.promoPrice))}</p>}<p className={"mt-3 text-xs font-semibold "+(product.stockQuantity <= 3 ? "text-amber-700" : "text-emerald-700")}>Existencias: {product.stockQuantity}</p>
          <span className="mt-3 inline-flex rounded-lg bg-[#176B7A] px-3 py-1.5 text-xs font-bold text-white">+ Agregar</span>
        </button>)}
        {matches.length === 0 && <p className="col-span-full rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">No hay productos que coincidan con la búsqueda.</p>}</div>
      </section>
      <section className="rounded-2xl border border-white/70 bg-white p-4 shadow-md sm:p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900">Carrito</h2><span className="rounded-full bg-[#176B7A]/10 px-3 py-1 text-xs font-bold text-[#176B7A]">{lines.reduce((sum, line) => sum + line.quantity, 0)} artículos</span></div>
        <div className="space-y-3">{lines.map(line => <div key={line.productId} className="rounded-xl border border-gray-100 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-gray-900">{line.product.name}</p><p className="text-xs text-gray-500">{money(Number(line.product.salePrice))} c/u · Stock {line.product.stockQuantity}</p>{line.product.promotionName && Number(line.product.promoPrice) < Number(line.product.salePrice) && <p className="text-xs font-bold text-emerald-700">{line.product.promotionName}: {money(Number(line.product.promoPrice))} c/u</p>}</div><button type="button" onClick={() => setQuantity(line.productId, 0)} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Quitar</button></div><div className="mt-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><button type="button" onClick={() => setQuantity(line.productId, line.quantity - 1)} className="h-8 w-8 rounded-lg border border-gray-200 font-bold text-gray-700">−</button><input aria-label={"Cantidad de " + line.product.name} type="number" min="1" max={line.product.stockQuantity} value={line.quantity} onChange={e => setQuantity(line.productId, Number(e.target.value))} className="h-9 w-16 rounded-lg border border-gray-200 text-center text-sm text-gray-900" /><button type="button" onClick={() => setQuantity(line.productId, line.quantity + 1)} disabled={line.quantity >= line.product.stockQuantity} className="h-8 w-8 rounded-lg border border-gray-200 font-bold text-gray-700 disabled:opacity-40">+</button></div><span className="text-right"><span className="block font-bold text-gray-900">{money(Number(line.product.promoPrice ?? line.product.salePrice) * line.quantity)}</span>{Number(line.product.promoPrice) < Number(line.product.salePrice) && <span className="text-xs text-gray-400 line-through">{money(Number(line.product.salePrice) * line.quantity)}</span>}</span></div></div>)}
        {!lines.length && <p className="rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">Agrega productos desde la lista de arriba para comenzar.</p>}</div>
      </section>
    </div>
    <aside className="space-y-4 rounded-2xl border border-white/70 bg-white p-4 shadow-md sm:p-5 lg:sticky lg:top-4">
      <h2 className="text-lg font-bold text-gray-900">Resumen de venta</h2>
      <div className="flex items-center justify-between text-sm text-gray-600"><span>Subtotal</span><span>{money(subtotal)}</span></div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-amber-900">Descuento total</span>
          <span className="text-xl font-black text-amber-900">−{money(promoTotal + manualDiscount)}</span>
        </div>
        {promoTotal > 0 && (
          <div className="mt-1 flex items-center justify-between text-xs text-emerald-800">
            <span>Ofertas aplicadas</span><span>−{money(promoTotal)}</span>
          </div>
        )}
        {manualDiscount > 0 && (
          <div className="mt-1 flex items-center justify-between text-xs text-amber-800">
            <span>Descuento manual</span><span>−{money(manualDiscount)}</span>
          </div>
        )}
      </div>
      {isAdmin && (
        <div className="space-y-2 rounded-xl border border-[#FFD400]/60 bg-amber-50 p-3">
          <p className="text-sm font-bold text-gray-800">Descuento manual</p>
          <select value={manualDiscountType} onChange={e => setManualDiscountType(e.target.value)} className="min-h-10 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-900">
            <option value="none">Sin descuento</option>
            <option value="percent">Porcentaje (%)</option>
            <option value="fixed">Importe (MXN)</option>
          </select>
          {manualDiscountType !== "none" && (
            <input value={manualDiscountValue} onChange={e => setManualDiscountValue(e.target.value)} type="number" min="0.01" max={manualDiscountType === "percent" ? 100 : afterPromos} step="0.01" placeholder="Valor del descuento" className="min-h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900" />
          )}
        </div>
      )}
      <div className="rounded-xl bg-[#176B7A] p-4 text-white shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-white/80">Total a cobrar</p>
        <p aria-live="polite" className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{money(total)}</p>
        <p className="mt-1 text-xs text-white/80">MXN · Importe final</p>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-gray-700">Método de pago *</span>
        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900">
          <option value="cash">Efectivo</option><option value="card">Tarjeta (registro manual)</option><option value="transfer">Transferencia (registro manual)</option>
        </select>
      </label>
      {paymentMethod === "cash" && (
        <>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-gray-700">Efectivo recibido (MXN) *</span>
            <input value={amountReceived} onChange={e => setAmountReceived(e.target.value)} type="number" min={total} step="0.01" placeholder={total.toFixed(2)} className="min-h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm text-gray-900" />
          </label>
          <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 px-3 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Cambio a devolver</p>
            <p aria-live="polite" className="mt-1 text-2xl font-black tabular-nums text-emerald-900">{money(change)}</p>
          </div>
        </>
      )}
      {paymentMethod !== "cash" && (
        <p className="rounded-xl bg-sky-50 px-3 py-3 text-xs text-sky-800">
          El cobro con {paymentMethod === "card" ? "tarjeta" : "transferencia"} se registra manualmente; no se conecta a una terminal.
        </p>
      )}
      <label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-700">Notas (opcional)</span><textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} rows={2} placeholder="Observaciones de la venta..." className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900" /></label>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <button type="button" onClick={submit} disabled={pending || !lines.length} className="min-h-12 w-full rounded-xl bg-[#FFD400] px-5 py-3 text-sm font-black text-gray-900 shadow-sm transition hover:bg-[#f2ca00] disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Registrando venta..." : "Confirmar venta · " + money(total)}</button>
      <p className="text-center text-xs text-gray-400">Al confirmar se descontarán las existencias disponibles.</p>
    </aside>
  </div>;
}
