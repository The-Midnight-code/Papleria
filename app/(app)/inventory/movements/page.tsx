import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/db";
import { inventoryMovements, products, users } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";
import { MovementManager } from "../movement-manager";

export default async function InventoryMovementsPage() {
  await requireEmployeeOrAdmin();
  const [productList, history] = await Promise.all([
    db.select({ id: products.id, name: products.name, sku: products.sku, stockQuantity: products.stockQuantity, active: products.active }).from(products).orderBy(products.name),
    db.select({
      id: inventoryMovements.id, productName: products.name, sku: products.sku, type: inventoryMovements.type, reason: inventoryMovements.reason,
      quantity: inventoryMovements.quantity, stockBefore: inventoryMovements.stockBefore, stockAfter: inventoryMovements.stockAfter,
      notes: inventoryMovements.notes, createdAt: inventoryMovements.createdAt, userName: users.name,
    }).from(inventoryMovements).innerJoin(products, eq(inventoryMovements.productId, products.id))
      .leftJoin(users, eq(inventoryMovements.userId, users.id)).orderBy(desc(inventoryMovements.createdAt)).limit(200),
  ]);
  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
    <header><Link href="/inventory" className="text-sm text-white/75 transition hover:text-white">← Volver al inventario</Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Movimientos de inventario</h1>
      <p className="mt-1 text-sm text-white/75">Registra entradas, salidas y ajustes; cada cambio conserva su historial.</p>
    </header>
    <MovementManager products={productList} history={history.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))} />
  </main>;
}
