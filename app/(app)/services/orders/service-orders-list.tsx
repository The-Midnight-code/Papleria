"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  orderNumber: string;
  serviceName: string;
  customerName: string;
  customerPhone: string | null;
  agreedPrice: string | null;
  depositAmount: string;
  status: string;
  promisedDeliveryDate: string | null;
  createdAt: Date | string;
  totalPaid: number;
};

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

export default function ServiceOrdersList({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "AWAITING_DEPOSIT" | "READY">("all");
  const filteredOrders = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-MX");
    return orders.filter((order) => {
      const matchesSearch = !term || [order.customerName, order.serviceName, order.orderNumber].some((value) => value.toLocaleLowerCase("es-MX").includes(term));
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#176B7A]">
            Órdenes activas
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {orders.length}
          </p>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg">
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

      {orders.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-3">
          <button type="button" onClick={() => setStatusFilter("all")} className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${statusFilter === "all" ? "border-[#FFD400] bg-white text-gray-900 ring-2 ring-[#FFD400]/40" : "border-white/50 bg-white/80 text-gray-700 hover:bg-white"}`}>
            Todas las órdenes <span className="ml-1 text-gray-500">({orders.length})</span>
          </button>
          <button type="button" onClick={() => setStatusFilter("AWAITING_DEPOSIT")} className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${statusFilter === "AWAITING_DEPOSIT" ? "border-orange-300 bg-orange-50 text-orange-900 ring-2 ring-orange-200" : "border-white/50 bg-white/80 text-gray-700 hover:bg-white"}`}>
            Esperando anticipo <span className="ml-1 text-gray-500">({orders.filter((order) => order.status === "AWAITING_DEPOSIT").length})</span>
          </button>
          <button type="button" onClick={() => setStatusFilter("READY")} className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${statusFilter === "READY" ? "border-teal-300 bg-teal-50 text-teal-900 ring-2 ring-teal-200" : "border-white/50 bg-white/80 text-gray-700 hover:bg-white"}`}>
            Listos para entregar <span className="ml-1 text-gray-500">({orders.filter((order) => order.status === "READY").length})</span>
          </button>
        </section>
      )}

      {orders.length > 0 && (
        <section className="space-y-3">
          <label
            htmlFor="customer-search"
            className="block text-sm font-semibold text-white"
          >
            Buscar por nombre del cliente
          </label>
          <div className="relative">
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </span>
            <input
              id="customer-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Escribe el nombre del cliente..."
              className="min-h-12 w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:ring-2 focus:ring-[#176B7A]/20"
            />
          </div>
          <p className="text-xs text-gray-300">
            {search.trim()
              ? `${filteredOrders.length} de ${orders.length} órdenes`
              : "Busca entre las órdenes activas por nombre."}
          </p>
        </section>
      )}

      {orders.length === 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white px-5 py-12 text-center shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Todavía no hay órdenes
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Registra el primer trabajo para comenzar a controlar sus avances y
            entregas.
          </p>
        </section>
      ) : filteredOrders.length === 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white px-5 py-12 text-center shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            No encontramos coincidencias
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Prueba con otro nombre de cliente.
          </p>
          <button
            type="button"
            onClick={() => { setSearch(""); setStatusFilter("all"); }}
            className="mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
          >
            Limpiar búsqueda
          </button>
        </section>
      ) : (
        <section className="space-y-3">
          {filteredOrders.map((order) => {
            const totalPaid = Math.round(order.totalPaid * 100) / 100;
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
                className="block rounded-2xl border border-white/70 bg-white p-5 shadow-md transition-shadow duration-200 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD400] sm:p-6"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#176B7A]">
                      {order.orderNumber}
                    </p>
                    <h2 className="text-lg font-bold text-gray-900">
                      {order.serviceName}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {order.customerName}
                      {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[order.status] ?? "border-border bg-muted text-muted-foreground"}`}
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
    </>
  );
}
