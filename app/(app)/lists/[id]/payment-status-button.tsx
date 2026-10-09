"use client";

import { useState } from "react";

import { togglePaymentStatus } from "./actions";
import PaymentStatusConfirmation from "./payment-status-confirmation";

type PaymentStatusButtonProps = {
  listClientId: string;
  clientName: string;
  paymentStatus: "UNPAID" | "PAID";
  children: React.ReactNode;
};

export function PaymentStatusButton({
  listClientId,
  clientName,
  paymentStatus,
  children,
}: PaymentStatusButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  function handleClick() {
    if (isUpdating) return;
    setShowConfirmation(true);
  }

  async function handleConfirm() {
    setIsUpdating(true);

    try {
      await togglePaymentStatus(listClientId);
      setShowConfirmation(false);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isUpdating}
        aria-label={`Cambiar estado de pago de ${clientName}`}
        className="cursor-pointer rounded-full text-left transition-opacity hover:opacity-80 disabled:cursor-wait disabled:opacity-50"
      >
        {children}{" "}
      </button>

      <PaymentStatusConfirmation
        open={showConfirmation}
        clientName={clientName}
        currentStatus={paymentStatus}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirmation(false)}
      />
    </>
  );
}
