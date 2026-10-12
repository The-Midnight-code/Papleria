import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/db";
import { serviceOrderPayments, serviceOrders } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";
import { StatusControl } from "../status-control";
import { PaymentForm } from "../payment-form";

const statusLabels: Record<string, string> = {
  PENDING_QUOTE: "Pendiente de cotización",
  AWAITING_DEPOSIT: "Esperando anticipo",
  IN_PROGRESS: "En proceso",
  READY: "Listo para entregar",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
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

function formatDateTime(value: Date) {
  return value.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Tijuana",
  });
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div className="font-semibold leading-6 text-gray-900">{children}</div>
    </div>
  );
}

export default async function ServiceOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireEmployeeOrAdmin();

  const { id } = await params;

  const [order] = await db
    .select()
    .from(serviceOrders)
    .where(eq(serviceOrders.id, id))
    .limit(1);

  if (!order) notFound();

  const payments = await db
    .select()
    .from(serviceOrderPayments)
    .where(eq(serviceOrderPayments.serviceOrderId, order.id))
    .orderBy(desc(serviceOrderPayments.createdAt));

  const initialDeposit = Number(order.depositAmount);
  const additionalPayments = payments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );
  const totalPaid =
    Math.round((initialDeposit + additionalPayments) * 100) / 100;

  const balance =
    order.agreedPrice === null
      ? null
      : Math.max(
          0,
          Math.round((Number(order.agreedPrice) - totalPaid) * 100) / 100,
        );

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="space-y-3">
        <Link
          href="/services/orders"
          className="inline-flex text-sm font-medium text-white/75 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          ← Volver a órdenes
        </Link>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#FFD400]">
              Orden {order.orderNumber}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {order.serviceName}
            </h1>
            <p className="text-sm text-white/75">{order.customerName}</p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${({ PENDING_QUOTE: "border-amber-200 bg-amber-50 text-amber-800", AWAITING_DEPOSIT: "border-orange-200 bg-orange-50 text-orange-800", IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-800", READY: "border-teal-200 bg-teal-50 text-teal-800", DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-800", CANCELLED: "border-gray-200 bg-gray-100 text-gray-700" } as Record<string, string>)[order.status] ?? "border-gray-200 bg-gray-100 text-gray-700"}`}
          >
            {statusLabels[order.status] ?? order.status}
          </span>
        </div>
      </header>

      <section className="space-y-5 rounded-2xl border border-white/70 bg-white p-5 shadow-md sm:p-6">
        <h2 className="text-lg font-bold tracking-tight text-gray-900">
          Datos del cliente
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <DetailItem label="Nombre">{order.customerName}</DetailItem>
          <DetailItem label="Teléfono">
            {order.customerPhone || "No registrado"}
          </DetailItem>
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-white/70 bg-white p-5 shadow-md sm:p-6">
        <h2 className="text-lg font-bold tracking-tight text-gray-900">
          Especificaciones del trabajo
        </h2>

        <DetailItem label="Servicio">{order.serviceName}</DetailItem>

        <DetailItem label="Indicaciones">
          {order.specifications ? (
            <p className="whitespace-pre-wrap font-normal leading-6 text-gray-700">
              {order.specifications}
            </p>
          ) : (
            <span className="font-normal text-gray-500">
              Sin especificaciones adicionales
            </span>
          )}
        </DetailItem>
      </section>

      <section className="space-y-5 rounded-2xl border border-white/70 bg-white p-5 shadow-md sm:p-6">
        <h2 className="text-lg font-bold tracking-tight text-gray-900">
          Precio y pagos
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="Precio acordado">
            {formatMoney(order.agreedPrice)}
          </DetailItem>

          <DetailItem label="Anticipo inicial">
            {formatMoney(order.depositAmount)}
          </DetailItem>

          <DetailItem label="Total pagado">{formatMoney(totalPaid)}</DetailItem>

          <DetailItem label="Saldo pendiente">
            {formatMoney(balance)}
          </DetailItem>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-5">
          <h3 className="font-semibold text-gray-900">Historial de pagos</h3>

          {initialDeposit > 0 && (
            <div className="flex flex-col justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-900">
                    Anticipo inicial
                  </p>
                  <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    Efectivo
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Registrado al crear la orden
                </p>
              </div>
              <p className="text-lg font-bold tabular-nums text-gray-900">
                {formatMoney(initialDeposit)}
              </p>
            </div>
          )}

          {payments.length === 0 && initialDeposit === 0 && (
            <p className="text-sm text-muted-foreground">
              Todavía no hay pagos registrados.
            </p>
          )}

          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-col justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:flex-row sm:items-center"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-900">
                    Abono registrado
                  </p>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${({ CASH: "border-emerald-200 bg-emerald-50 text-emerald-800", CARD: "border-blue-200 bg-blue-50 text-blue-800", TRANSFER: "border-violet-200 bg-violet-50 text-violet-800", OTHER: "border-gray-200 bg-gray-100 text-gray-700" } as Record<string, string>)[payment.paymentMethod] ?? "border-gray-200 bg-gray-100 text-gray-700"}`}
                  >
                    {paymentMethodLabels[payment.paymentMethod] ??
                      payment.paymentMethod}
                  </span>
                </div>
                <p className="text-sm text-sm text-gray-500">
                  {formatDateTime(payment.createdAt)}
                </p>
                {payment.notes && (
                  <p className="text-sm text-sm text-gray-500">
                    {payment.notes}
                  </p>
                )}
              </div>

              <p className="text-lg font-bold tabular-nums text-gray-900">
                {formatMoney(payment.amount)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {order.agreedPrice !== null &&
        balance !== null &&
        balance > 0 &&
        order.status !== "CANCELLED" && (
          <section className="space-y-4 rounded-2xl border border-white/70 bg-white p-5 shadow-md sm:p-6">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              Registrar abono
            </h2>
            <PaymentForm orderId={order.id} balance={balance} />
          </section>
        )}

      <section className="space-y-5 rounded-2xl border border-white/70 bg-white p-5 shadow-md sm:p-6">
        <h2 className="text-lg font-bold tracking-tight text-gray-900">
          Fechas de entrega
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <DetailItem label="Fecha solicitada">
            {formatDate(order.requestedDeliveryDate)}
          </DetailItem>

          <DetailItem label="Fecha prometida">
            {formatDate(order.promisedDeliveryDate)}
          </DetailItem>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/70 bg-white p-5 shadow-md sm:p-6">
        <h2 className="text-lg font-bold tracking-tight text-gray-900">
          Actualizar estado
        </h2>
        <StatusControl orderId={order.id} currentStatus={order.status} />
      </section>

      <section className="space-y-4 rounded-2xl border border-white/70 bg-white p-5 shadow-md sm:p-6">
        <h2 className="text-lg font-bold tracking-tight text-gray-900">
          Registro de la orden
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <DetailItem label="Creada">
            {formatDateTime(order.createdAt)}
          </DetailItem>

          <DetailItem label="Última actualización">
            {formatDateTime(order.updatedAt)}
          </DetailItem>
        </div>
      </section>
    </main>
  );
}
