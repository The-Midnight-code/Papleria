import Link from "next/link";
import { getMonthlyInventoryReport } from "./monthly-report-actions";
import { requireAdmin } from "@/lib/auth/authorization";
import { MonthlyInventoryReport } from "../monthly-inventory-report";

export default async function MonthlyInventoryReportPage() {
  await requireAdmin();
  const currentMonth = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit" }).format(new Date());
  const movements = await getMonthlyInventoryReport(currentMonth);

  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
    <header>
      <Link href="/inventory" className="text-sm text-white/75 transition hover:text-white">← Volver al inventario</Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Reporte mensual de inventario</h1>
      <p className="mt-1 text-sm text-white/75">Consulta la actividad de inventario por mes y exporta el detalle para tus reportes.</p>
    </header>
    <MonthlyInventoryReport initialMovements={movements} initialMonth={currentMonth} />
  </main>;
}
