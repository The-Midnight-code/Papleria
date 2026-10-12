import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";
import { ReplenishmentReport } from "../replenishment-report";

export default async function InventoryReplenishmentPage() {
  await requireAdmin();
  const productList = await db.select({
    id: products.id,
    name: products.name,
    sku: products.sku,
    category: products.category,
    costPrice: products.costPrice,
    stockQuantity: products.stockQuantity,
    minStock: products.minStock,
    active: products.active,
  }).from(products).orderBy(asc(products.name));

  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
    <header>
      <Link href="/inventory" className="text-sm text-white/75 transition hover:text-white">← Volver al inventario</Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Compras y reabastecimiento</h1>
      <p className="mt-1 text-sm text-white/75">Prepara una lista de compra según las existencias y el presupuesto estimado.</p>
    </header>
    <ReplenishmentReport products={productList} />
  </main>;
}
