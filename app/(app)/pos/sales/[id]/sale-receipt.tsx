"use client";

import { useEffect } from "react";

type Sale = { id: string; folio: string; paymentMethod: string; subtotal: string; total: string; amountReceived: string; changeDue: string; status: string; notes: string | null; soldAt: string; soldBy: string | null; userName: string | null };
type Item = { productName: string; sku: string; quantity: number; unitPrice: string; lineTotal: string };
const money = (value: number) => value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const methods: Record<string,string> = { cash: "Efectivo", card: "Tarjeta · registro manual", transfer: "Transferencia · registro manual" };

export function SaleReceipt({ sale, items }: { sale: Sale; items: Item[] }) {
  useEffect(() => { if (new URLSearchParams(window.location.search).get("print") === "1") window.setTimeout(() => window.print(), 250); }, []);
  return <section className="mx-auto w-full max-w-xl rounded-2xl border border-white/70 bg-white p-5 shadow-md print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-8">
    <div className="text-center"><p className="text-2xl font-black tracking-tight text-[#176B7A]">PAPE</p><p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-500">Comprobante de venta</p><h2 className="mt-4 text-xl font-bold text-gray-900">{sale.folio}</h2><p className="mt-1 text-sm text-gray-500">{new Date(sale.soldAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</p></div>
    <div className="mt-6 border-y border-dashed border-gray-300 py-4"><div className="flex justify-between gap-3 text-sm"><span className="text-gray-500">Atendió</span><span className="font-semibold text-gray-900">{sale.userName ?? "Usuario eliminado"}</span></div><div className="mt-2 flex justify-between gap-3 text-sm"><span className="text-gray-500">Pago</span><span className="text-right font-semibold text-gray-900">{methods[sale.paymentMethod] ?? sale.paymentMethod}</span></div></div>
    <div className="mt-4 space-y-3">{items.map((item, i) => <div key={item.sku + i} className="flex justify-between gap-4 text-sm"><div className="min-w-0"><p className="font-semibold text-gray-900">{item.productName}</p><p className="text-xs text-gray-500">{item.sku} · {item.quantity} × {money(Number(item.unitPrice))}</p></div><p className="shrink-0 font-semibold text-gray-900">{money(Number(item.lineTotal))}</p></div>)}</div>
    <div className="mt-5 space-y-2 border-t border-gray-200 pt-4"><div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{money(Number(sale.subtotal))}</span></div><div className="flex justify-between text-lg font-black text-gray-900"><span>Total</span><span>{money(Number(sale.total))}</span></div>{sale.paymentMethod === "cash" && <><div className="flex justify-between text-sm text-gray-600"><span>Efectivo recibido</span><span>{money(Number(sale.amountReceived))}</span></div><div className="flex justify-between text-sm text-gray-600"><span>Cambio</span><span>{money(Number(sale.changeDue))}</span></div></>}</div>
    {sale.notes && <p className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">Notas: {sale.notes}</p>}
    <p className="mt-7 text-center text-sm font-semibold text-gray-600">¡Gracias por tu compra!</p><div className="mt-5 flex justify-center print:hidden"><button onClick={() => window.print()} className="min-h-11 rounded-xl bg-[#176B7A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#125663]">Imprimir ticket</button></div>
  </section>;
}
