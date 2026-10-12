"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createServiceOrder } from "./order-actions";

type ServiceOption = {
  id: string;
  name: string;
  category: string;
  price: string | null;
  requiresQuote: boolean;
};

export function OrderForm({ services }: { services: ServiceOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [agreedPrice, setAgreedPrice] = useState("");

  const selectedService = services.find(
    (service) => service.id === selectedServiceId,
  );

  function handleServiceChange(serviceId: string) {
    setSelectedServiceId(serviceId);
    const service = services.find((item) => item.id === serviceId);

    setAgreedPrice(
      service && !service.requiresQuote && service.price ? service.price : "",
    );
  }

  function handleSubmit(formData: FormData) {
    setError("");

    startTransition(async () => {
      const result = await createServiceOrder(formData);

      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }

      router.push("/services/orders");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Datos de la orden</h2>

        <div className="space-y-2">
          <label htmlFor="serviceId" className="text-sm font-medium">
            Servicio
          </label>
          <select
            id="serviceId"
            name="serviceId"
            required
            value={selectedServiceId}
            onChange={(event) => handleServiceChange(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          >
            <option value="">Selecciona un servicio</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.category} — {service.name}
              </option>
            ))}
          </select>

          {selectedService?.requiresQuote && (
            <p className="text-sm text-muted-foreground">
              Este servicio requiere cotización. Puedes dejar el precio vacío
              mientras preparas la cotización.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="customerName" className="text-sm font-medium">
              Nombre del cliente
            </label>
            <input
              id="customerName"
              name="customerName"
              required
              maxLength={150}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="customerPhone" className="text-sm font-medium">
              Teléfono
            </label>
            <input
              id="customerPhone"
              name="customerPhone"
              type="tel"
              maxLength={30}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="specifications" className="text-sm font-medium">
            Especificaciones del trabajo
          </label>
          <textarea
            id="specifications"
            name="specifications"
            rows={4}
            maxLength={5000}
            placeholder="Cantidad, tamaño, colores, materiales u otras indicaciones..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Precio y entrega</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="agreedPrice" className="text-sm font-medium">
              Precio acordado (MXN)
            </label>
            <input
              id="agreedPrice"
              name="agreedPrice"
              type="number"
              min="0"
              max="99999999.99"
              step="0.01"
              value={agreedPrice}
              onChange={(event) => setAgreedPrice(event.target.value)}
              placeholder="Pendiente de cotización"
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="depositAmount" className="text-sm font-medium">
              Anticipo (MXN)
            </label>
            <input
              id="depositAmount"
              name="depositAmount"
              type="number"
              min="0"
              max="99999999.99"
              step="0.01"
              defaultValue="0"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="requestedDeliveryDate"
              className="text-sm font-medium"
            >
              Fecha solicitada por el cliente
            </label>
            <input
              id="requestedDeliveryDate"
              name="requestedDeliveryDate"
              type="date"
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="promisedDeliveryDate"
              className="text-sm font-medium"
            >
              Fecha prometida de entrega
            </label>
            <input
              id="promisedDeliveryDate"
              name="promisedDeliveryDate"
              type="date"
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </div>
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending || services.length === 0}
          className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Crear orden"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/services/orders")}
          className="rounded-lg border border-border px-5 py-2.5 font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
