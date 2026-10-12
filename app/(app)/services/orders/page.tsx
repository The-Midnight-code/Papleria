import Link from "next/link";
import { desc, inArray } from "drizzle-orm";

import { db } from "@/db/db";
import { serviceOrderPayments, serviceOrders } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";
import ServiceOrdersList from "./service-orders-list";

export default async function ServiceOrdersPage() {
  await requireEmployeeOrAdmin();

  const orders = await db
    .select({
      id: serviceOrders.id,
      orderNumber: serviceOrders.orderNumber,
      serviceName: serviceOrders.serviceName,
      customerName: serviceOrders.customerName,
      customerPhone: serviceOrders.customerPhone,
      agreedPrice: serviceOrders.agreedPrice,
      depositAmount: serviceOrders.depositAmount,
      status: serviceOrders.status,
      promisedDeliveryDate: serviceOrders.promisedDeliveryDate,
      createdAt: serviceOrders.createdAt,
    })
    .from(serviceOrders)
    .where(inArray(serviceOrders.status, ["AWAITING_DEPOSIT", "IN_PROGRESS", "READY"]))
    .orderBy(desc(serviceOrders.createdAt));

  const payments = await db
    .select({
      serviceOrderId: serviceOrderPayments.serviceOrderId,
      amount: serviceOrderPayments.amount,
    })
    .from(serviceOrderPayments);

  const additionalPaymentsByOrder = new Map<string, number>();

  for (const payment of payments) {
    const current = additionalPaymentsByOrder.get(payment.serviceOrderId) ?? 0;

    additionalPaymentsByOrder.set(
      payment.serviceOrderId,
      current + Number(payment.amount),
    );
  }

  const ordersWithPayments = orders.map((order) => ({
    ...order,
    totalPaid:
      Math.round(
        ((Number(order.depositAmount) || 0) +
          (additionalPaymentsByOrder.get(order.id) ?? 0)) * 100,
      ) / 100,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Órdenes de servicio</h1>
          <p className="text-muted-foreground">Administra los trabajos, pagos y fechas de entrega.</p>
        </div>
        <Link href="/services/orders/new" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FFD400] px-5 py-3 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-[#ffe04d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          + Nueva orden
        </Link>
      </header>
      <ServiceOrdersList orders={ordersWithPayments} />
    </main>
  );
}
