import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/db";
import { products, purchaseItems, purchases, users } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";
import { PurchaseManager } from "../purchase-manager";

export default async function PurchasesPage() {
  await requireEmployeeOrAdmin();
  const [productList, purchaseList] = await Promise.all([
    db.select({ id: products.id, name: products.name, sku: products.sku, costPrice: products.costPrice, stockQuantity: products.stockQuantity, active: products.active })
      .from(products).orderBy(products.name),
    db.select({
      id: purchases.id, supplierName: purchases.supplierName, reference: purchases.reference, notes: purchases.notes,
      totalAmount: purchases.totalAmount, purchasedAt: purchases.purchasedAt, createdAt: purchases.createdAt, userName: users.name,
    }).from(purchases).leftJoin(users, eq(purchases.createdBy, users.id)).orderBy(desc(purchases.purchasedAt)).limit(500),
  ]);
  const purchaseIds = purchaseList.map((item) => item.id);
  const items = purchaseIds.length ? await db.select({
    purchaseId: purchaseItems.purchaseId, productName: products.name, sku: products.sku,
    quantity: purchaseItems.quantity, unitCost: purchaseItems.unitCost, lineTotal: purchaseItems.lineTotal,
  }).from(purchaseItems).innerJoin(products, eq(purchaseItems.productId, products.id)).where(inArray(purchaseItems.purchaseId, purchaseIds)) : [];
  const itemMap = new Map<string, typeof items>();
  for (const item of items) itemMap.set(item.purchaseId, [...(itemMap.get(item.purchaseId) ?? []), item]);
  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><Link href="/inventory" className="text-sm text-white/75 transition hover:text-white">← Volver al inventario</Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Compras a proveedores</h1>
        <p className="mt-1 text-sm text-white/75">Registra compras recibidas y actualiza las existencias en una sola operación.</p>
      </div>
      <Link href="/inventory/replenishment" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">Ver sugerencias de reabastecimiento</Link>
    </header>
    <PurchaseManager products={productList.map((p) => ({ ...p, costPrice: String(p.costPrice) }))} history={purchaseList.map((p) => {
      const purchaseItemsForRow = itemMap.get(p.id) ?? [];
      return { ...p, totalAmount: String(p.totalAmount), purchasedAt: p.purchasedAt.toISOString(), createdAt: p.createdAt.toISOString(), itemCount: purchaseItemsForRow.length, items: purchaseItemsForRow };
    })} />
  </main>;
}
