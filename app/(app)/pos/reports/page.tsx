import Link from "next/link";
import { requireAdmin } from "@/lib/auth/authorization";
import { SalesProfitReport } from "../sales-profit-report";
import { getSalesProfitReport } from "./sales-profit-report-actions";

function localDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Tijuana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return get("year") + "-" + get("month") + "-" + get("day");
}

export default async function SalesProfitReportPage() {
  await requireAdmin();
  const today = localDate();
  const monthStart = today.slice(0, 7) + "-01";
  const report = await getSalesProfitReport({ from: monthStart, to: today, status: "all" });

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      <header>
        <Link href="/pos" className="text-sm text-white/75 transition hover:text-white">← Volver al punto de venta</Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Reporte de ventas y utilidad</h1>
        <p className="mt-1 text-sm text-white/75">Ventas netas, costos históricos, utilidad bruta, descuentos y cancelaciones. Solo visible para administración.</p>
      </header>
      <SalesProfitReport sales={report} defaultFrom={monthStart} defaultTo={today} />
    </main>
  );
}
