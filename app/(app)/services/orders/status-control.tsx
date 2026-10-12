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
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          aria-label="Nuevo estado de la orden"
          value={nextStatus}
          onChange={(event) =>
            setNextStatus(event.target.value as OrderStatus | "")
          }
          disabled={pending}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2"
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
          className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Actualizando..." : "Actualizar estado"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
