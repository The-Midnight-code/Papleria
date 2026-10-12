import Link from "next/link";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db/db";
import { products, promotions } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";
import { PointOfSale } from "./point-of-sale";

export default async function PointOfSalePage() {
  const user = await requireEmployeeOrAdmin();
  const now = new Date();
  const [productList, activePromotions] = await Promise.all([
    db.select({ id: products.id, name: products.name, sku: products.sku, category: products.category, salePrice: products.salePrice, stockQuantity: products.stockQuantity, active: products.active }).from(products).orderBy(asc(products.name)),
    db.select().from(promotions).where(and(eq(promotions.active,true),lte(promotions.startsAt,now),gte(promotions.endsAt,now))),
  ]);
  const visibleProducts = productList.filter(p => p.active).map(product => {
    let promoPrice = Number(product.salePrice);
    let promotionName: string | null = null;
    for (const promotion of activePromotions.filter(p => p.productId === null || p.productId === product.id)) {
      const reduction = promotion.discountType === "percent" ? Number(product.salePrice) * Number(promotion.discountValue) / 100 : Number(promotion.discountValue);
      const candidate = Math.max(0, Number(product.salePrice) - reduction);
      if (candidate < promoPrice) { promoPrice = candidate; promotionName = promotion.name; }
    }
    return { ...product, salePrice: String(product.salePrice), promoPrice: promoPrice.toFixed(2), promotionName };
  });
  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><Link href="/dashboard" className="text-sm text-white/75 transition hover:text-white">← Volver al inicio</Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Punto de venta</h1>
        <p className="mt-1 text-sm text-white/75">Registra ventas, aplica ofertas vigentes y actualiza existencias en una sola operación.</p>
      </div>
      <div className="flex flex-wrap gap-2"><Link href="/pos/sales" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">Historial de ventas</Link>{user.role === "ADMIN" && <Link href="/pos/promotions" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FFD400] px-4 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-[#f2ca00]">Administrar ofertas</Link>}</div>
    </header>
    <PointOfSale products={visibleProducts} isAdmin={user.role === "ADMIN"} />
  </main>;
}
