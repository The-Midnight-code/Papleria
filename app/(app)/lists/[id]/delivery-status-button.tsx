"use client";

import { useState } from "react";
import { toggleDeliveryStatus } from "./actions";

type DeliveryStatusButtonProps = {
  listClientId: string;
  clientName: string;
  deliveryStatus: "PENDING" | "DELIVERED";
};

export function DeliveryStatusButton({
  listClientId,
  clientName,
  deliveryStatus,
}: DeliveryStatusButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const nextStatus = deliveryStatus === "PENDING" ? "DELIVERED" : "PENDING";

  async function handleConfirm() {
    if (isUpdating) return;

    setIsUpdating(true);

    try {
      const result = await toggleDeliveryStatus(listClientId);

      if (result?.error) {
        alert(result.error);
        return;
      }

      setShowConfirmation(false);
    } catch {
      alert("No se pudo actualizar el estado de entrega.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirmation(true)}
        disabled={isUpdating}
        className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 ${
          deliveryStatus === "DELIVERED"
            ? "bg-teal-50 text-[#176B7A] hover:bg-teal-100"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        {deliveryStatus === "DELIVERED" ? "Entregado" : "Pendiente"}{" "}
      </button>

      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delivery-confirmation-title"
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
          >
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#FFD400] text-xl">
                ?
              </div>

              <h2
                id="delivery-confirmation-title"
                className="text-lg font-bold text-gray-900"
              >
                Cambiar estado de entrega
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                ¿Deseas cambiar la entrega de{" "}
                <span className="font-semibold text-gray-900">
                  {clientName}
                </span>{" "}
                a{" "}
                <span className="font-semibold text-[#176B7A]">
                  {nextStatus === "DELIVERED" ? "ENTREGADO" : "PENDIENTE"}
                </span>
                ?
              </p>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                disabled={isUpdating}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isUpdating}
                className="rounded-xl bg-[#FFD400] px-4 py-2 text-sm font-bold text-[#176B7A] transition hover:brightness-95 disabled:opacity-50"
              >
                {isUpdating ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
