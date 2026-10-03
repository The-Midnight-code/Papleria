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
      <tr
        onClick={handleClick}
        className="cursor-pointer transition-colors hover:bg-gray-50"
      >
        {children}
      </tr>

      {showConfirmation && (
        <tr>
          <td colSpan={4}>
            <PaymentStatusConfirmation
              open={showConfirmation}
              clientName={clientName}
              currentStatus={paymentStatus}
              onConfirm={handleConfirm}
              onCancel={() => setShowConfirmation(false)}
            />
          </td>
        </tr>
      )}
    </>
  );
}
