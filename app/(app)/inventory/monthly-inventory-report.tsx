"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getMonthlyInventoryReport, type MonthlyInventoryMovement } from "./monthly-report/monthly-report-actions";

type Movement = MonthlyInventoryMovement;

const typeLabels: Record<string, string> = { entry: "Entrada", exit: "Salida", adjustment: "Ajuste" };
const reasonLabels: Record<string, string> = {
  purchase: "Compra", return: "Devolución", other: "Otro", sale: "Venta",
  damage: "Producto dañado", loss: "Pérdida", count_correction: "Corrección de conteo",
};
const monthLabel = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
};

export function MonthlyInventoryReport({ initialMovements, initialMonth }: { initialMovements: Movement[]; initialMonth: string }) {
  const currentMonth = initialMonth;
  const [movements, setMovements] = useState<Movement[]>(initialMovements);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (selectedMonth === initialMonth) {
      setMovements(initialMovements);
      setError(null);
      return;
    }
    let active = true;
    setError(null);
    startTransition(() => {
      getMonthlyInventoryReport(selectedMonth)
        .then((result) => { if (active) setMovements(result); })
        .catch(() => { if (active) setError("No se pudo cargar el reporte de ese mes. Intenta nuevamente."); });
    });
    return () => { active = false; };
  }, [selectedMonth, initialMonth, initialMovements]);

  const monthly = useMemo(() => movements.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [movements]);

  const summary = useMemo(() => {
    const result = { entries: 0, exits: 0, adjustments: 0, unitsIn: 0, unitsOut: 0, damaged: 0, lost: 0 };
    for (const movement of monthly) {
      if (movement.type === "entry") { result.entries++; result.unitsIn += movement.quantity; }
      else if (movement.type === "exit") {
        result.exits++;
        result.unitsOut += movement.quantity;
        if (movement.reason === "damage") result.damaged += movement.quantity;
        if (movement.reason === "loss") result.lost += movement.quantity;
      } else result.adjustments++;
    }
    return result;
  }, [monthly]);
  const productSummary = useMemo(() => {
    const map = new Map<string, { name: string; sku: string; movements: number; unitsIn: number; unitsOut: number; firstStock: number; lastStock: number; firstDate: string; lastDate: string }>();
    for (const m of monthly) {
      const item = map.get(m.sku);
      if (!item) map.set(m.sku, { name: m.productName, sku: m.sku, movements: 1, unitsIn: m.type === "entry" ? m.quantity : 0, unitsOut: m.type === "exit" ? m.quantity : 0, firstStock: m.stockBefore, lastStock: m.stockAfter, firstDate: m.createdAt, lastDate: m.createdAt });
      else {
        item.movements++;
        if (m.type === "entry") item.unitsIn += m.quantity;
        if (m.type === "exit") item.unitsOut += m.quantity;
        if (m.createdAt < item.firstDate) { item.firstDate = m.createdAt; item.firstStock = m.stockBefore; }
        if (m.createdAt >= item.lastDate) { item.lastDate = m.createdAt; item.lastStock = m.stockAfter; }
      }
    }
    return [...map.values()].sort((a, b) => (b.unitsIn + b.unitsOut) - (a.unitsIn + a.unitsOut) || a.name.localeCompare(b.name, "es-MX"));
  }, [monthly]);

  function exportCsv() {
    const headers = ["Fecha", "Hora", "Producto", "SKU", "Tipo de movimiento", "Motivo", "Cantidad", "Existencias anteriores", "Existencias posteriores", "Responsable", "Notas"];
    const rows = monthly.map((m) => {
      const date = new Date(m.createdAt);
      return [date.toLocaleDateString("es-MX"), date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }), m.productName, m.sku, typeLabels[m.type] ?? m.type, reasonLabels[m.reason] ?? m.reason, m.quantity, m.stockBefore, m.stockAfter, m.userName ?? "Usuario eliminado", m.notes ?? ""];
    });
    const escapeCell = (value: string | number) => {
      const text = String(value);
      return /[;"\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    };
    const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(escapeCell).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reporte-mensual-inventario-" + selectedMonth + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const cards = [
    { label: "Movimientos", value: monthly.length.toLocaleString("es-MX"), note: "Registros del mes" },
    { label: "Entradas", value: summary.entries.toLocaleString("es-MX"), note: summary.unitsIn.toLocaleString("es-MX") + " unidades recibidas" },
    { label: "Salidas", value: summary.exits.toLocaleString("es-MX"), note: summary.unitsOut.toLocaleString("es-MX") + " unidades retiradas" },
    { label: "Ajustes", value: summary.adjustments.toLocaleString("es-MX"), note: "Correcciones de existencias" },
  ];

  return <section className="space-y-5 rounded-2xl border border-white/70 bg-white p-4 shadow-md sm:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176B7A]">Análisis por periodo</p><h2 className="mt-1 text-xl font-bold text-gray-900">Reporte mensual</h2><p className="mt-1 text-sm text-gray-500">Resumen de entradas, salidas, ajustes y actividad por producto.</p></div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><span>Mes</span><input type="month" value={selectedMonth} max={currentMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900" /></label>
        <button type="button" onClick={exportCsv} disabled={monthly.length === 0 || isPending} className="min-h-10 rounded-xl border border-[#176B7A]/25 bg-white px-4 py-2 text-sm font-bold text-[#176B7A] hover:bg-[#176B7A]/5 disabled:cursor-not-allowed disabled:opacity-50">Exportar mes CSV</button>
      </div>
    </div>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    {isPending && <p className="text-sm text-gray-500">Cargando movimientos de {monthLabel(selectedMonth)}…</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <article key={card.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4"><p className="text-sm font-medium text-gray-500">{card.label}</p><p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p><p className="mt-1 text-xs text-gray-500">{card.note}</p></article>)}</div>
    <div className="grid gap-3 sm:grid-cols-2">
      <article className="rounded-xl border border-red-100 bg-red-50/60 p-4"><p className="text-sm font-semibold text-red-900">Productos dañados</p><p className="mt-1 text-2xl font-bold text-red-800">{summary.damaged.toLocaleString("es-MX")} unidades</p></article>
      <article className="rounded-xl border border-amber-100 bg-amber-50/60 p-4"><p className="text-sm font-semibold text-amber-900">Pérdidas</p><p className="mt-1 text-2xl font-bold text-amber-800">{summary.lost.toLocaleString("es-MX")} unidades</p></article>
    </div>
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3"><h3 className="font-semibold text-gray-900">Resumen por producto</h3><p className="text-xs text-gray-500">Existencias iniciales y finales según el primer y último movimiento registrado del mes para cada producto.</p></div>
      {productSummary.length === 0 ? <p className="px-4 py-10 text-center text-sm text-gray-500">No hay movimientos registrados en {monthLabel(selectedMonth)}.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead className="bg-white"><tr>{["Producto","SKU","Movimientos","Unidades de entrada","Unidades de salida","Stock al primer movimiento","Stock al último movimiento"].map((label) => <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{productSummary.map((p) => <tr key={p.sku} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm font-semibold text-gray-900">{p.name}</td><td className="px-4 py-3 text-sm text-gray-600">{p.sku}</td><td className="px-4 py-3 text-sm text-gray-700">{p.movements}</td><td className="px-4 py-3 text-sm text-emerald-700">{p.unitsIn}</td><td className="px-4 py-3 text-sm text-red-700">{p.unitsOut}</td><td className="px-4 py-3 text-sm text-gray-700">{p.firstStock}</td><td className="px-4 py-3 text-sm font-bold text-gray-900">{p.lastStock}</td></tr>)}</tbody></table></div>}
    </div>
    <p className="text-xs text-gray-500">El reporte refleja movimientos guardados en el sistema. Los totales de unidades no son importes monetarios; los movimientos históricos no guardan el precio de venta o costo aplicado en cada operación.</p>
  </section>;
}
