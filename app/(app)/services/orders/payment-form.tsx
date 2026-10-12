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
    <form action={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Saldo pendiente:{" "}
        <span className="font-semibold text-foreground">
          ${balance.toFixed(2)} MXN
        </span>
      </p>

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
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            placeholder="0.00"
          />
        </label>

        <label className="space-y-1.5">
          <span className="block text-sm font-medium">Método de pago</span>
          <select
            name="paymentMethod"
            required
            defaultValue="CASH"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
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
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
          placeholder="Referencia o comentario del pago"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="text-sm text-emerald-400">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Registrando..." : "Registrar abono"}
      </button>
    </form>
  );
}
