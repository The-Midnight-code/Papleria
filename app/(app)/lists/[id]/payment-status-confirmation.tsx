"use client";

type PaymentStatusConfirmationProps = {
  open: boolean;
  currentStatus: "UNPAID" | "PAID";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function PaymentStatusConfirmation({
  open,
  currentStatus,
  onConfirm,
  onCancel,
}: PaymentStatusConfirmationProps) {
  if (!open) return null;

  const nextStatus = currentStatus === "UNPAID" ? "PAGADO" : "NO PAGADO";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#FFD400] text-xl">
            ?
          </div>

          <h2 className="text-lg font-bold text-gray-900">Cambiar estado</h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            ¿Deseas cambiar el estado de este cliente a{" "}
            <span className="font-semibold text-[#176B7A]">{nextStatus}</span>?
          </p>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-[#FFD400] px-4 py-2 text-sm font-bold text-[#176B7A] transition hover:brightness-95"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
