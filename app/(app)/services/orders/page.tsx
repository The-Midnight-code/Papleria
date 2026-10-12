import Link from "next/link";
import { desc } from "drizzle-orm";

import { db } from "@/db/db";
import { serviceOrderPayments, serviceOrders } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";

const statusLabels: Record<string, string> = {
  PENDING_QUOTE: "Pendiente de cotización",
  AWAITING_DEPOSIT: "Esperando anticipo",
  IN_PROGRESS: "En proceso",
  READY: "Listo para entregar",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const statusStyles: Record<string, string> = {
  PENDING_QUOTE: "border-amber-200 bg-amber-50 text-amber-800",
  AWAITING_DEPOSIT: "border-orange-200 bg-orange-50 text-orange-800",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-800",
  READY: "border-teal-200 bg-teal-50 text-teal-800",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-gray-200 bg-gray-100 text-gray-700",
};

function formatMoney(value: string | number | null) {
  if (value === null) return "Por cotizar";

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value));
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";

  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

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

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Órdenes de servicio</h1>
          <p className="text-muted-foreground">
            Administra los trabajos, pagos y fechas de entrega.
          </p>
        </div>

        <Link
          href="/services/orders/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FFD400] px-5 py-3 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-[#ffe04d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          + Nueva orden
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-sm transition hover:shadow-md">
          <p className="text-sm font-semibold text-gray-500">
            Total de órdenes
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {orders.length}
          </p>
        </article>

        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg transition hover:shadow-xl">
          <p className="text-sm font-semibold text-[#176B7A]">
            Trabajos activos
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {
              orders.filter(
                (order) => !["DELIVERED", "CANCELLED"].includes(order.status),
              ).length
            }
          </p>
        </article>

        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg transition hover:shadow-xl">
          <p className="text-sm font-semibold text-[#176B7A]">
            Listos para entregar
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {orders.filter((order) => order.status === "READY").length}
          </p>
        </article>
      </section>

      {orders.length === 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white px-5 py-12 text-center shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Todavía no hay órdenes</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Registra el primer trabajo para comenzar a controlar sus avances y
            entregas.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          {orders.map((order) => {
            const additionalPayments =
              additionalPaymentsByOrder.get(order.id) ?? 0;

            const totalPaid =
              Math.round(
                (Number(order.depositAmount) + additionalPayments) * 100,
              ) / 100;

            const balance =
              order.agreedPrice === null
                ? null
                : Math.max(
                    0,
                    Math.round((Number(order.agreedPrice) - totalPaid) * 100) /
                      100,
                  );

            return (
              <Link
                key={order.id}
                href={`/services/orders/${order.id}`}
                className="block rounded-2xl border border-white/70 bg-white p-5 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD400] sm:p-6"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#176B7A]">{order.orderNumber}</p>
                    <h2 className="text-lg font-bold text-gray-900">
                      {order.serviceName}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {order.customerName}
                      {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${
                      statusStyles[order.status] ??
                      "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {statusLabels[order.status] ?? order.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Precio acordado
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {formatMoney(order.agreedPrice)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-600">
                      Anticipo inicial
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {formatMoney(order.depositAmount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-600">
                      Total pagado
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {formatMoney(totalPaid)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-600">
                      Saldo pendiente
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {formatMoney(balance)}
                    </p>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4">
                    <p className="text-xs font-medium text-gray-600">
                      Fecha prometida
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {formatDate(order.promisedDeliveryDate)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}
