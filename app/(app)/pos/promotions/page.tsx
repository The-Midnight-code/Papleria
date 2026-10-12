import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/db";
import { products, promotions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";
import { PromotionManager } from "../promotion-manager";

export default async function PromotionsPage() {
  await requireAdmin();
  const [productList, rows] = await Promise.all([
    db.select({id:products.id,name:products.name,sku:products.sku}).from(products).where(eq(products.active,true)).orderBy(products.name),
    db.select({id:promotions.id,name:promotions.name,productId:promotions.productId,productName:products.name,discountType:promotions.discountType,discountValue:promotions.discountValue,startsAt:promotions.startsAt,endsAt:promotions.endsAt,active:promotions.active}).from(promotions).leftJoin(products,eq(promotions.productId,products.id)).orderBy(desc(promotions.createdAt)),
  ]);
  const promotionsList=rows.map(p=>({...p,startsAt:p.startsAt.toISOString(),endsAt:p.endsAt.toISOString(),discountValue:String(p.discountValue)}));
  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
    <header><Link href="/pos" className="text-sm text-white/75 transition hover:text-white">← Volver al punto de venta</Link><h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Descuentos y ofertas</h1><p className="mt-1 text-sm text-white/75">Configura promociones con vigencia y administra descuentos manuales desde la caja.</p></header>
    <PromotionManager products={productList} promotions={promotionsList}/>
  </main>;
}
