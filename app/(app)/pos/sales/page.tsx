import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/db";
import { saleItems, sales, users } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";
import { SalesHistory } from "../sales-history";

export default async function SalesPage() {
  const user = await requireEmployeeOrAdmin();
  const cancellationUsers = alias(users, "cancellation_users");
  const rows = await db.select({
    id: sales.id, folio: sales.folio, paymentMethod: sales.paymentMethod, subtotal: sales.subtotal,
    total: sales.total, amountReceived: sales.amountReceived, changeDue: sales.changeDue,
    status: sales.status, cancellationReason: sales.cancellationReason, cancelledAt: sales.cancelledAt, cancelledByName: cancellationUsers.name, notes: sales.notes, soldAt: sales.soldAt, soldBy: sales.soldBy, userName: users.name,
  }).from(sales).leftJoin(users, eq(sales.soldBy, users.id)).leftJoin(cancellationUsers, eq(sales.cancelledBy, cancellationUsers.id)).orderBy(desc(sales.soldAt)).limit(500);
  const allowed = user.role === "ADMIN" ? rows : rows.filter(row => row.soldBy === user.id);
  const ids = allowed.map(row => row.id);
  const allItems = ids.length ? await db.select({
    saleId: saleItems.saleId, productName: saleItems.productName, sku: saleItems.sku, quantity: saleItems.quantity,
    unitPrice: saleItems.unitPrice, unitCost: saleItems.unitCost, lineTotal: saleItems.lineTotal, lineCost: saleItems.lineCost,
  }).from(saleItems).where(inArray(saleItems.saleId, ids)) : [];
  const itemsBySale = new Map<string, typeof allItems>();
  for (const item of allItems) itemsBySale.set(item.saleId, [...(itemsBySale.get(item.saleId) ?? []), item]);
  const history = allowed.map(row => ({
    ...row, soldAt: row.soldAt.toISOString(), cancelledAt: row.cancelledAt?.toISOString() ?? null, items: (itemsBySale.get(row.id) ?? []).map(item => user.role === "ADMIN" ? item : { ...item, unitCost: "0.00", lineCost: "0.00" }),
    grossProfit: user.role === "ADMIN" ? (itemsBySale.get(row.id) ?? []).reduce((sum, item) => sum + Number(item.lineTotal) - Number(item.lineCost), 0) : 0,
  }));
  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
    <header><Link href="/pos" className="text-sm text-white/75 transition hover:text-white">← Volver al punto de venta</Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Historial de ventas</h1>
      <p className="mt-1 text-sm text-white/75">{user.role === "ADMIN" ? "Consulta ventas, métodos de pago y resultados históricos." : "Consulta las ventas que has registrado."}</p>
    </header>
    <SalesHistory sales={history} isAdmin={user.role === "ADMIN"} currentUserId={user.id} />
  </main>;
}
