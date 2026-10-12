"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateServiceOrderStatus } from "../order-actions";

type OrderStatus =
  | "PENDING_QUOTE"
  | "AWAITING_DEPOSIT"
  | "IN_PROGRESS"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

const statusLabels: Record<OrderStatus, string> = {
  PENDING_QUOTE: "Pendiente de cotización",
  AWAITING_DEPOSIT: "Esperando anticipo",
  IN_PROGRESS: "En proceso",
  READY: "Listo para entregar",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING_QUOTE: ["AWAITING_DEPOSIT", "CANCELLED"],
  AWAITING_DEPOSIT: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["READY", "CANCELLED"],
  READY: ["DELIVERED", "IN_PROGRESS", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function StatusControl({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");

  const options = allowedTransitions[currentStatus];

  function handleUpdate() {
    if (!nextStatus) {
      setError("Selecciona el nuevo estado.");
      return;
    }

    setError("");

    startTransition(async () => {
      const result = await updateServiceOrderStatus(orderId, nextStatus);

      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }

      setNextStatus("");
      router.refresh();
    });
  }

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta orden ya tiene un estado final y no admite más cambios.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-gray-600">Selecciona el siguiente estado permitido para esta orden. El cambio se reflejará en el listado y en el detalle.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          aria-label="Nuevo estado de la orden"
          value={nextStatus}
          onChange={(event) =>
            setNextStatus(event.target.value as OrderStatus | "")
          }
          disabled={pending}
          className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200 disabled:bg-gray-100"
        >
          <option value="">Selecciona un estado</option>
          {options.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleUpdate}
          disabled={pending || !nextStatus}
          className="inline-flex items-center justify-center rounded-xl bg-[#FFD400] px-5 py-2.5 font-bold text-gray-900 shadow-sm transition hover:bg-[#f2ca00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Actualizando..." : "Actualizar estado"}
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
