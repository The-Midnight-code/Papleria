import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/db";
import { inventoryMovements, products, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";
import { MonthlyInventoryReport } from "../monthly-inventory-report";

export default async function MonthlyInventoryReportPage() {
  await requireAdmin();
  const movements = await db.select({
    id: inventoryMovements.id,
    productName: products.name,
    sku: products.sku,
    type: inventoryMovements.type,
    reason: inventoryMovements.reason,
    quantity: inventoryMovements.quantity,
    stockBefore: inventoryMovements.stockBefore,
    stockAfter: inventoryMovements.stockAfter,
    notes: inventoryMovements.notes,
    createdAt: inventoryMovements.createdAt,
    userName: users.name,
  }).from(inventoryMovements)
    .innerJoin(products, eq(inventoryMovements.productId, products.id))
    .leftJoin(users, eq(inventoryMovements.userId, users.id))
    .orderBy(desc(inventoryMovements.createdAt));

  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
    <header>
      <Link href="/inventory" className="text-sm text-white/75 transition hover:text-white">← Volver al inventario</Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Reporte mensual de inventario</h1>
      <p className="mt-1 text-sm text-white/75">Consulta la actividad de inventario por mes y exporta el detalle para tus reportes.</p>
    </header>
    <MonthlyInventoryReport movements={movements.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))} />
  </main>;
}
