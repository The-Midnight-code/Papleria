import Link from "next/link";
import { asc } from "drizzle-orm";

import { db } from "@/db/db";
import { products } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";
import { ProductCatalog } from "./product-catalog";

export default async function InventoryPage() {
  await requireEmployeeOrAdmin();

  const productList = await db.select({
    id: products.id,
    name: products.name,
    sku: products.sku,
    category: products.category,
    description: products.description,
    costPrice: products.costPrice,
    salePrice: products.salePrice,
    stockQuantity: products.stockQuantity,
    minStock: products.minStock,
    active: products.active,
  }).from(products).orderBy(asc(products.name));

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-white/75 transition hover:text-white">← Volver al inicio</Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Inventario de productos</h1>
          <p className="mt-1 text-sm text-white/75">Controla los productos físicos, sus precios y las existencias de la papelería.</p>
        </div>
        <Link href="/inventory/movements" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FFD400] px-5 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-[#f2ca00]">Movimientos de inventario →</Link>
      </header>
      <ProductCatalog products={productList} />
    </main>
  );
}
