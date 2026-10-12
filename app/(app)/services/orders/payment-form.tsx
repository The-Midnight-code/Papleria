"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { registerServiceOrderPayment } from "../order-payment-actions";

type PaymentFormProps = {
  orderId: string;
  balance: number;
};

const paymentMethods = [
  { value: "CASH", label: "Efectivo" },
  { value: "CARD", label: "Tarjeta" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "OTHER", label: "Otro" },
];

export function PaymentForm({ orderId, balance }: PaymentFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await registerServiceOrderPayment(orderId, formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess("Abono registrado correctamente.");
      router.refresh();
    });
  }

  if (balance <= 0) {
    return (
      <p className="text-sm font-medium text-emerald-400">
        Esta orden está pagada por completo.
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-amber-900">Saldo pendiente</span>
        <span className="text-xl font-bold tabular-nums text-amber-950">${balance.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="block text-sm font-medium">Monto del abono</span>
          <input
            name="amount"
            type="number"
            min="0.01"
            max={balance.toFixed(2)}
            step="0.01"
            required
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            placeholder="0.00"
          />
        </label>

        <label className="space-y-1.5">
          <span className="block text-sm font-medium">Método de pago</span>
          <select
            name="paymentMethod"
            required
            defaultValue="CASH"
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
          >
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="block text-sm font-medium">Notas (opcional)</span>
        <textarea
          name="notes"
          maxLength={500}
          rows={2}
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
          placeholder="Referencia o comentario del pago"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl bg-[#FFD400] px-5 py-2.5 font-bold text-gray-900 shadow-sm transition hover:bg-[#f2ca00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Registrando..." : "Registrar abono"}
      </button>
    </form>
  );
}
