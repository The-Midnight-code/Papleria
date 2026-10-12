import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db/db";
import { products } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";
import { PointOfSale } from "./point-of-sale";

export default async function PointOfSalePage() {
  await requireEmployeeOrAdmin();
  const productList = await db.select({
    id: products.id, name: products.name, sku: products.sku, category: products.category,
    salePrice: products.salePrice, stockQuantity: products.stockQuantity, active: products.active,
  }).from(products).where(asc(products.name));
  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><Link href="/dashboard" className="text-sm text-white/75 transition hover:text-white">← Volver al inicio</Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Punto de venta</h1>
        <p className="mt-1 text-sm text-white/75">Registra ventas, cobra y actualiza las existencias en una sola operación.</p>
      </div>
      <Link href="/pos/sales" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">Historial de ventas</Link>
    </header>
    <PointOfSale products={productList.filter(p => p.active).map(p => ({...p, salePrice: String(p.salePrice)}))} />
  </main>;
}
