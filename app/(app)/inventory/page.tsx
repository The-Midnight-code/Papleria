import Link from "next/link";
import { asc } from "drizzle-orm";

import { db } from "@/db/db";
import { products } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";
import { ProductCatalog } from "./product-catalog";
import { InventoryReport } from "./inventory-report";

export default async function InventoryPage() {
  const user = await requireEmployeeOrAdmin();
  const isAdmin = user.role === "ADMIN";

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

  const activeProducts = productList.filter((product) => product.active);
  const report = activeProducts.reduce((totals, product) => {
    const cost = Number(product.costPrice) * product.stockQuantity;
    const sale = Number(product.salePrice) * product.stockQuantity;
    const out = product.stockQuantity === 0;
    const low = !out && product.stockQuantity <= product.minStock;
    return {
      units: totals.units + product.stockQuantity,
      costValue: totals.costValue + cost,
      saleValue: totals.saleValue + sale,
      lowCount: totals.lowCount + (low ? 1 : 0),
      outCount: totals.outCount + (out ? 1 : 0),
      lowProducts: low ? [...totals.lowProducts, { id: product.id, name: product.name, sku: product.sku, stockQuantity: product.stockQuantity, minStock: product.minStock, costValue: cost, saleValue: sale, status: "low" as const }] : totals.lowProducts,
      outProducts: out ? [...totals.outProducts, { id: product.id, name: product.name, sku: product.sku, stockQuantity: product.stockQuantity, minStock: product.minStock, costValue: cost, saleValue: sale, status: "out" as const }] : totals.outProducts,
    };
  }, { units: 0, costValue: 0, saleValue: 0, lowCount: 0, outCount: 0, lowProducts: [] as { id: string; name: string; sku: string; stockQuantity: number; minStock: number; costValue: number; saleValue: number; status: "low" | "out" }[], outProducts: [] as { id: string; name: string; sku: string; stockQuantity: number; minStock: number; costValue: number; saleValue: number; status: "low" | "out" }[] });

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-white/75 transition hover:text-white">← Volver al inicio</Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Inventario de productos</h1>
          <p className="mt-1 text-sm text-white/75">Controla los productos físicos, sus precios y las existencias de la papelería.</p>
        </div>
        <div className="flex flex-wrap gap-2">{isAdmin && <Link href="/inventory/purchases" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-white/20">Compras a proveedores</Link>} {isAdmin && <Link href="/inventory/replenishment" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-white/20">Compras y reabastecimiento</Link>} {isAdmin && <Link href="/inventory/monthly-report" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-white/20">Reporte mensual</Link>} <Link href="/inventory/movements" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FFD400] px-5 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-[#f2ca00]">Movimientos de inventario →</Link></div>
      </header>
      {isAdmin && <InventoryReport report={{ ...report, productCount: activeProducts.length, potentialProfit: report.saleValue - report.costValue }} />}
      <ProductCatalog products={isAdmin ? productList : productList.map((product) => ({ ...product, costPrice: "0.00", salePrice: "0.00" }))} isAdmin={isAdmin} />
    </main>
  );
}
