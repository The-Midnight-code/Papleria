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
  imageUrl: string | null;
};

export function OrderForm({ services }: { services: ServiceOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [agreedPrice, setAgreedPrice] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [isSearchingService, setIsSearchingService] = useState(false);

  const selectedService = services.find(
    (service) => service.id === selectedServiceId,
  );

  const filteredServices = services.filter((service) =>
    `${service.name} ${service.category}`.toLocaleLowerCase("es-MX").includes(serviceSearch.trim().toLocaleLowerCase("es-MX")),
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

    if (!selectedServiceId) {
      setError("Busca y selecciona un servicio para continuar.");
      return;
    }

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
      <section className="space-y-5 rounded-2xl border border-white/70 bg-white p-5 shadow-md sm:p-6">
        <h2 className="text-lg font-bold tracking-tight text-gray-900">Datos de la orden</h2>

        <div className="space-y-2">
          <label htmlFor="serviceId" className="text-sm font-semibold text-gray-700">
            Servicio
          </label>
          <input type="hidden" name="serviceId" value={selectedServiceId} />
          <div className="space-y-3">
            <input
              id="serviceId"
              type="search"
              value={serviceSearch}
              onFocus={() => setIsSearchingService(true)}
              onChange={(event) => { setServiceSearch(event.target.value); setIsSearchingService(true); }}
              placeholder="Buscar por nombre o categoría..."
              autoComplete="off"
              aria-label="Buscar servicio por nombre o categoría"
              aria-controls="service-options"
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
            {selectedService && !isSearchingService && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
                {selectedService.imageUrl ? (
                  <img src={selectedService.imageUrl} alt="" className="h-16 w-16 rounded-lg border border-amber-200 bg-white object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700"><span className="text-xs font-bold">Sin foto</span></div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Servicio seleccionado</p>
                  <p className="truncate font-bold text-gray-900">{selectedService.name}</p>
                  <p className="text-sm text-gray-600">{selectedService.category}</p>
                </div>
                <button type="button" onClick={() => { handleServiceChange(""); setServiceSearch(""); setIsSearchingService(true); }} className="rounded-lg px-2 py-1 text-sm font-semibold text-gray-600 transition hover:bg-white hover:text-gray-900">Cambiar</button>
              </div>
            )}
            {isSearchingService && <div id="service-options" className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2" role="group" aria-label="Resultados de servicios">
              {filteredServices.length === 0 ? (
                <p className="px-3 py-5 text-center text-sm text-gray-500">No encontramos servicios con esa búsqueda.</p>
              ) : (
                filteredServices.map((service) => {
                  const isSelected = service.id === selectedServiceId;
                  return (
                    <button key={service.id} type="button" onClick={() => handleServiceChange(service.id)} aria-pressed={isSelected} className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${isSelected ? "border-amber-400 bg-amber-50 ring-1 ring-amber-200" : "border-transparent bg-white hover:border-gray-300 hover:bg-gray-50"}`}>
                      {service.imageUrl ? (
                        <img src={service.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-gray-200 bg-white object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-[10px] font-semibold text-gray-500">Sin foto</div>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-gray-900">{service.name}</span>
                        <span className="block truncate text-sm text-gray-500">{service.category}</span>
                        <span className="mt-1 block text-xs font-medium text-gray-600">{service.requiresQuote ? "Requiere cotización" : service.price ? `Precio de referencia: $${Number(service.price).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN` : "Precio por definir"}</span>
                      </span>
                      {isSelected && <span className="text-sm font-bold text-amber-800">Seleccionado</span>}
                    </button>
                  );
                })
              )}
            </div>}
            {selectedService && isSearchingService && <button type="button" onClick={() => { setIsSearchingService(false); setServiceSearch(""); }} className="text-sm font-semibold text-gray-600 underline decoration-gray-300 underline-offset-4 hover:text-gray-900">Conservar servicio seleccionado</button>}
          </div>

          {selectedService?.requiresQuote && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-900">
              Este servicio requiere cotización. Puedes dejar el precio vacío
              mientras preparas la cotización.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="customerName" className="text-sm font-semibold text-gray-700">
              Nombre del cliente
            </label>
            <input
              id="customerName"
              name="customerName"
              required
              maxLength={150}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="customerPhone" className="text-sm font-semibold text-gray-700">
              Teléfono
            </label>
            <input
              id="customerPhone"
              name="customerPhone"
              type="tel"
              maxLength={30}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="specifications" className="text-sm font-semibold text-gray-700">
            Especificaciones del trabajo
          </label>
          <textarea
            id="specifications"
            name="specifications"
            rows={4}
            maxLength={5000}
            placeholder="Cantidad, tamaño, colores, materiales u otras indicaciones..."
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
          />
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-white/70 bg-white p-5 shadow-md sm:p-6">
        <h2 className="text-lg font-bold tracking-tight text-gray-900">Precio y entrega</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="agreedPrice" className="text-sm font-semibold text-gray-700">
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
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="depositAmount" className="text-sm font-semibold text-gray-700">
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
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="requestedDeliveryDate"
              className="text-sm font-semibold text-gray-700"
            >
              Fecha solicitada por el cliente
            </label>
            <input
              id="requestedDeliveryDate"
              name="requestedDeliveryDate"
              type="date"
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="promisedDeliveryDate"
              className="text-sm font-semibold text-gray-700"
            >
              Fecha prometida de entrega
            </label>
            <input
              id="promisedDeliveryDate"
              name="promisedDeliveryDate"
              type="date"
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending || services.length === 0}
          className="inline-flex items-center justify-center rounded-xl bg-[#FFD400] px-5 py-2.5 font-bold text-gray-900 shadow-sm transition hover:bg-[#f2ca00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Crear orden"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/services/orders")}
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
