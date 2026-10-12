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
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="font-medium">{children}</div>
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
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <header className="space-y-3">
        <Link
          href="/services/orders"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a órdenes
        </Link>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Orden {order.orderNumber}
            </p>
            <h1 className="text-3xl font-bold">{order.serviceName}</h1>
            <p className="text-muted-foreground">{order.customerName}</p>
          </div>

          <span className="inline-flex w-fit rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium">
            {statusLabels[order.status] ?? order.status}
          </span>
        </div>
      </header>

      <section className="space-y-5 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Datos del cliente</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <DetailItem label="Nombre">{order.customerName}</DetailItem>
          <DetailItem label="Teléfono">
            {order.customerPhone || "No registrado"}
          </DetailItem>
        </div>
      </section>

      <section className="space-y-5 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Especificaciones del trabajo</h2>

        <DetailItem label="Servicio">{order.serviceName}</DetailItem>

        <DetailItem label="Indicaciones">
          {order.specifications ? (
            <p className="whitespace-pre-wrap font-normal">
              {order.specifications}
            </p>
          ) : (
            <span className="font-normal text-muted-foreground">
              Sin especificaciones adicionales
            </span>
          )}
        </DetailItem>
      </section>

      <section className="space-y-5 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Precio y pagos</h2>

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

        <div className="space-y-3 border-t border-border pt-4">
          <h3 className="font-semibold">Historial de pagos</h3>

          {initialDeposit > 0 && (
            <div className="flex flex-col justify-between gap-1 rounded-lg border border-border p-3 sm:flex-row sm:items-center">
              <div>
                <p className="font-medium">Anticipo inicial</p>
                <p className="text-sm text-muted-foreground">
                  Registrado al crear la orden
                </p>
              </div>
              <p className="font-semibold">{formatMoney(initialDeposit)}</p>
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
              className="flex flex-col justify-between gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center"
            >
              <div className="space-y-1">
                <p className="font-medium">
                  {paymentMethodLabels[payment.paymentMethod] ??
                    payment.paymentMethod}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(payment.createdAt)}
                </p>
                {payment.notes && (
                  <p className="text-sm text-muted-foreground">
                    {payment.notes}
                  </p>
                )}
              </div>

              <p className="font-semibold">{formatMoney(payment.amount)}</p>
            </div>
          ))}
        </div>
      </section>

      {order.agreedPrice !== null &&
        balance !== null &&
        balance > 0 &&
        order.status !== "CANCELLED" && (
          <section className="space-y-4 rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Registrar abono</h2>
            <PaymentForm orderId={order.id} balance={balance} />
          </section>
        )}

      <section className="space-y-5 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Fechas de entrega</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <DetailItem label="Fecha solicitada">
            {formatDate(order.requestedDeliveryDate)}
          </DetailItem>

          <DetailItem label="Fecha prometida">
            {formatDate(order.promisedDeliveryDate)}
          </DetailItem>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Actualizar estado</h2>
        <StatusControl orderId={order.id} currentStatus={order.status} />
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Registro de la orden</h2>

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
