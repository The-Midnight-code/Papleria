"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/db";
import { saleItems, sales, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";

export type SalesProfitReportFilters = {
  from: string;
  to: string;
  status: "all" | "completed" | "cancelled";
};

export type SalesProfitReportRow = {
  id: string;
  folio: string;
  paymentMethod: string;
  subtotal: string;
  discountTotal: string;
  total: string;
  status: string;
  soldAt: string;
  cancellationReason: string | null;
  userName: string | null;
  cost: string;
  profit: string;
  units: number;
};

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function getSalesProfitReport(filters: SalesProfitReportFilters): Promise<SalesProfitReportRow[]> {
  await requireAdmin();

  if (!filters || !isValidDate(filters.from) || !isValidDate(filters.to) || filters.from > filters.to) {
    throw new Error("Selecciona un periodo de fechas válido.");
  }
  if (!["all", "completed", "cancelled"].includes(filters.status)) {
    throw new Error("El estado seleccionado no es válido.");
  }

  const rows = await db.select({
    id: sales.id,
    folio: sales.folio,
    paymentMethod: sales.paymentMethod,
    subtotal: sales.subtotal,
    discountTotal: sales.discountTotal,
    total: sales.total,
    status: sales.status,
    soldAt: sales.soldAt,
    cancellationReason: sales.cancellationReason,
    userName: users.name,
  })
    .from(sales)
    .leftJoin(users, eq(sales.soldBy, users.id))
    .where(and(
      sql\`(\${sales.soldAt} AT TIME ZONE 'America/Tijuana')::date >= \${filters.from}::date\`,
      sql\`(\${sales.soldAt} AT TIME ZONE 'America/Tijuana')::date <= \${filters.to}::date\`,
      filters.status === "all" ? undefined : eq(sales.status, filters.status),
    ))
    .orderBy(desc(sales.soldAt));

  const ids = rows.map((row) => row.id);
  const items = ids.length ? await db.select({
    saleId: saleItems.saleId,
    quantity: saleItems.quantity,
    lineTotal: saleItems.lineTotal,
    lineCost: saleItems.lineCost,
  }).from(saleItems).where(inArray(saleItems.saleId, ids)) : [];

  const totalsBySale = new Map<string, { costCents: number; profitCents: number; units: number }>();
  for (const item of items) {
    const current = totalsBySale.get(item.saleId) ?? { costCents: 0, profitCents: 0, units: 0 };
    const costCents = Math.round(Number(item.lineCost) * 100);
    const netCents = Math.round(Number(item.lineTotal) * 100);
    current.costCents += costCents;
    current.profitCents += netCents - costCents;
    current.units += item.quantity;
    totalsBySale.set(item.saleId, current);
  }

  return rows.map((row) => {
    const valid = row.status === "completed";
    const totals = totalsBySale.get(row.id);
    return {
      ...row,
      soldAt: row.soldAt.toISOString(),
      subtotal: String(row.subtotal),
      discountTotal: String(row.discountTotal),
      total: String(row.total),
      cost: ((valid ? totals?.costCents ?? 0 : 0) / 100).toFixed(2),
      profit: ((valid ? totals?.profitCents ?? 0 : 0) / 100).toFixed(2),
      units: totals?.units ?? 0,
    };
  });
}
