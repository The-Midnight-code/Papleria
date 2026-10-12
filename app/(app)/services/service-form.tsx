"use client";
import Link from "next/link";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createService, updateService } from "./actions";

type ServiceFormProps = {
  service?: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    price: string | null;
    requiresQuote: boolean;
    estimatedDays: number | null;
    published: boolean;
  };
};

const fieldClassName =
  "w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10";

const labelClassName = "mb-2 block text-sm font-semibold text-gray-800";

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fieldId = useId();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess("");
    setPending(true);

    try {
      const result = service
        ? await updateService(service.id, formData)
        : await createService(formData);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setSuccess(service ? "Servicio actualizado." : "Servicio creado.");
      router.refresh();

      if (!service) {
        formRef.current?.reset();
      }
    } catch {
      setError("No fue posible guardar el servicio. Intenta nuevamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      aria-label={service ? `Editar ${service.name}` : "Registrar servicio"}
      className="space-y-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:space-y-6 sm:p-6"
    >
      <div className="space-y-1">
        <h3 className="text-base font-bold text-gray-900">
          {service ? "Datos del servicio" : "Información del servicio"}
        </h3>
        <p className="text-sm leading-5 text-gray-500">
          {service
            ? "Actualiza los datos y guarda los cambios."
            : "Completa los datos para registrar un nuevo servicio."}
        </p>
      </div>

      <div>
        <label htmlFor={`${fieldId}-name`} className={labelClassName}>
          Nombre del servicio <span className="text-rose-600">*</span>
        </label>
        <input
          id={`${fieldId}-name`}
          name="name"
          required
          maxLength={150}
          defaultValue={service?.name ?? ""}
          placeholder="Ej. Impresión a color"
          autoComplete="off"
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor={`${fieldId}-category`} className={labelClassName}>
          Categoría <span className="text-rose-600">*</span>
        </label>
        <input
          id={`${fieldId}-category`}
          name="category"
          required
          maxLength={100}
          defaultValue={service?.category ?? ""}
          placeholder="Ej. Impresión, diseño, engargolado"
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor={`${fieldId}-description`} className={labelClassName}>
          Descripción
        </label>
        <textarea
          id={`${fieldId}-description`}
          name="description"
          maxLength={5000}
          rows={4}
          defaultValue={service?.description ?? ""}
          placeholder="Describe qué incluye el servicio (opcional)"
          className={`${fieldClassName} min-h-28 resize-y leading-6`}
        />
        <p className="mt-1.5 text-xs text-gray-500">Máximo 5,000 caracteres.</p>
      </div>

      <div>
        <label htmlFor={`${fieldId}-price`} className={labelClassName}>
          Precio (MXN)
        </label>
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-gray-500"
          >
            $
          </span>
          <input
            id={`${fieldId}-price`}
            name="price"
            type="number"
            min="0"
            max="99999999.99"
            step="0.01"
            defaultValue={service?.price ?? ""}
            placeholder="0.00"
            inputMode="decimal"
            className={`${fieldClassName} pl-8 tabular-nums`}
          />
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
          Si el precio depende del trabajo, activa la opción de cotización.
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-[#176B7A]/40 hover:bg-[#176B7A]/5">
        <input
          type="checkbox"
          name="requiresQuote"
          defaultChecked={service?.requiresQuote ?? false}
          className="mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-[#176B7A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B7A]"
        />
        <span className="space-y-1">
          <span className="block text-sm font-semibold text-gray-900">
            Requiere cotización
          </span>
          <span className="block text-xs leading-5 text-gray-500">
            El precio final se determinará según las necesidades del cliente.
          </span>
        </span>
      </label>

      <div>
        <label htmlFor={`${fieldId}-estimated-days`} className={labelClassName}>
          Tiempo estimado de producción
        </label>
        <div className="relative">
          <input
            id={`${fieldId}-estimated-days`}
            name="estimatedDays"
            type="number"
            min="1"
            max="365"
            step="1"
            defaultValue={service?.estimatedDays ?? ""}
            placeholder="Ej. 3"
            inputMode="numeric"
            className={`${fieldClassName} pr-20`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-gray-500">
            días
          </span>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-[#176B7A]/40 hover:bg-[#176B7A]/5">
        <input
          type="checkbox"
          name="published"
          defaultChecked={service?.published ?? false}
          className="mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-[#176B7A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B7A]"
        />
        <span className="space-y-1">
          <span className="block text-sm font-semibold text-gray-900">
            Publicar en el catálogo público
          </span>
          <span className="block text-xs leading-5 text-gray-500">
            Permite que los clientes vean este servicio en el catálogo.
          </span>
        </span>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      {success && (
        <div
          role="status"
          className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <p>{success}</p>
          <Link
            href="/services"
            className="inline-flex font-semibold underline underline-offset-4 hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Volver al catálogo
          </Link>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#176B7A] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#125663] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B7A] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {pending
            ? "Guardando..."
            : service
              ? "Guardar cambios"
              : "Crear servicio"}
        </button>
      </div>
    </form>
  );
}
