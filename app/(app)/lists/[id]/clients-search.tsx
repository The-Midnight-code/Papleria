"use client";

import { useMemo, useState } from "react";

import { DeliveryStatusButton } from "./delivery-status-button";
import { PaymentStatusButton } from "./payment-status-button";

type ClientRelation = {
  id: string;
  createdAt: Date;
  paidAt: Date | null;
  paymentStatus: "UNPAID" | "PAID";
  deliveredAt: Date | null;
  deliveryStatus: "PENDING" | "DELIVERED";
  client: {
    name: string;
  };
};

type ClientsSearchProps = {
  clients: ClientRelation[];
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function ClientsSearch({ clients }: ClientsSearchProps) {
  const [search, setSearch] = useState("");

  const paidCount = clients.filter(
    (relation) => relation.paymentStatus === "PAID",
  ).length;

  const unpaidCount = clients.length - paidCount;

  const deliveredCount = clients.filter(
    (relation) => relation.deliveryStatus === "DELIVERED",
  ).length;

  const pendingDeliveryCount = clients.length - deliveredCount;

  const deliveredUnpaidCount = clients.filter(
    (relation) =>
      relation.deliveryStatus === "DELIVERED" &&
      relation.paymentStatus === "UNPAID",
  ).length;

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return clients;
    }

    return clients.filter((relation) =>
      relation.client.name.toLowerCase().includes(normalizedSearch),
    );
  }, [clients, search]);

  return (
    <>
      {" "}
      <div className="border-b border-gray-100 px-6 py-4">
        {" "}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {" "}
          <div>
            {" "}
            <h2 className="font-semibold text-gray-900">
              Personas ({filteredClients.length}
              {search.trim() ? ` de ${clients.length}` : ""}){" "}
            </h2>
            ```
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="font-medium text-green-600">
                {paidCount} pagaron
              </span>

              <span className="font-medium text-red-600">
                {unpaidCount} no pagaron
              </span>

              <span className="font-medium text-[#176B7A]">
                {deliveredCount} entregados
              </span>

              <span className="font-semibold text-amber-700">
                ⚠ {deliveredUnpaidCount} entregados sin pagar
              </span>

              <span className="font-medium text-gray-500">
                {pendingDeliveryCount} pendientes de entrega
              </span>
            </div>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar persona..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pl-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:bg-white focus:ring-2 focus:ring-[#176B7A]/20"
            />

            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>
          </div>
        </div>
      </div>
      {filteredClients.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-medium text-gray-900">
            No se encontraron personas
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Intenta con otro término de búsqueda.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Persona
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Agregado
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Estado de pago
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Pagado el
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Estado de entrega
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Entregado el
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredClients.map((relation) => (
                <tr
                  key={relation.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">
                      {relation.client.name}
                    </p>

                    {relation.deliveryStatus === "DELIVERED" &&
                      relation.paymentStatus === "UNPAID" && (
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          {" "}
                          <span aria-hidden="true">⚠</span>
                          Entregado · Pago pendiente{" "}
                        </span>
                      )}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {dateFormatter.format(new Date(relation.createdAt))}
                  </td>

                  <td className="px-6 py-4">
                    <PaymentStatusButton
                      listClientId={relation.id}
                      clientName={relation.client.name}
                      paymentStatus={relation.paymentStatus}
                    >
                      <span
                        className={
                          relation.paymentStatus === "PAID"
                            ? "inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-sm font-bold text-green-700"
                            : "inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1.5 text-sm font-bold text-red-700"
                        }
                      >
                        <span
                          className={
                            relation.paymentStatus === "PAID"
                              ? "h-2.5 w-2.5 rounded-full bg-green-500"
                              : "h-2.5 w-2.5 rounded-full bg-red-500"
                          }
                        />
                        {relation.paymentStatus === "PAID"
                          ? "PAGADO"
                          : "NO PAGADO"}
                      </span>
                    </PaymentStatusButton>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {relation.paidAt
                      ? dateTimeFormatter.format(new Date(relation.paidAt))
                      : "—"}
                  </td>

                  <td className="px-6 py-4">
                    <DeliveryStatusButton
                      listClientId={relation.id}
                      clientName={relation.client.name}
                      deliveryStatus={relation.deliveryStatus}
                    />
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {relation.deliveredAt
                      ? dateTimeFormatter.format(new Date(relation.deliveredAt))
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
