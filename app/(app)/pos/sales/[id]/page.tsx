import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/db";
import { saleItems, sales, users } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";
import { SaleReceipt } from "./sale-receipt";

export default async function SaleReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireEmployeeOrAdmin();
  const { id } = await params;
  const [sale] = await db.select({
    id: sales.id, folio: sales.folio, paymentMethod: sales.paymentMethod, subtotal: sales.subtotal,
    total: sales.total, amountReceived: sales.amountReceived, changeDue: sales.changeDue, status: sales.status,
    notes: sales.notes, soldAt: sales.soldAt, soldBy: sales.soldBy, userName: users.name,
  }).from(sales).leftJoin(users, eq(sales.soldBy, users.id)).where(eq(sales.id, id)).limit(1);
  if (!sale || (user.role !== "ADMIN" && sale.soldBy !== user.id)) notFound();
  const items = await db.select({
    productName: saleItems.productName, sku: saleItems.sku, quantity: saleItems.quantity,
    unitPrice: saleItems.unitPrice, lineTotal: saleItems.lineTotal,
  }).from(saleItems).where(eq(saleItems.saleId, sale.id));
  return <main className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6">
    <header className="print:hidden"><Link href="/pos/sales" className="text-sm text-white/75 hover:text-white">← Volver al historial</Link><h1 className="mt-3 text-2xl font-bold text-white">Ticket de venta</h1></header>
    <SaleReceipt sale={{...sale, soldAt: sale.soldAt.toISOString()}} items={items} />
  </main>;
}
