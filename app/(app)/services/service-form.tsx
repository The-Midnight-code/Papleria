"use client";

import { useState } from "react";
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

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
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
        const form = document.getElementById(
          "service-form",
        ) as HTMLFormElement | null;
        form?.reset();
      }
    } catch {
      setError("No fue posible guardar el servicio. Intenta nuevamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      id="service-form"
      action={handleSubmit}
      className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-md sm:p-7"
    >
      {" "}
      <div className="space-y-2">
        {" "}
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Nombre del servicio *{" "}
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={150}
          defaultValue={service?.name ?? ""}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:ring-2 focus:ring-[#176B7A]/20"
        />{" "}
      </div>
      <div>
        <label
          htmlFor="category"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Categoría *
        </label>
        <input
          id="category"
          name="category"
          required
          maxLength={100}
          defaultValue={service?.category ?? ""}
          placeholder="Ej. Impresión, diseño, engargolado"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:ring-2 focus:ring-[#176B7A]/20"
        />
      </div>
      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          maxLength={5000}
          rows={4}
          defaultValue={service?.description ?? ""}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:ring-2 focus:ring-[#176B7A]/20"
        />
      </div>
      <div>
        <label
          htmlFor="price"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Precio (MXN)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          min="0"
          max="99999999.99"
          step="0.01"
          defaultValue={service?.price ?? ""}
          placeholder="Ej. 150.00"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:ring-2 focus:ring-[#176B7A]/20"
        />
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Si el precio depende del trabajo, puedes marcar cotización.
        </p>
      </div>
      <label className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
        <input
          type="checkbox"
          name="requiresQuote"
          defaultChecked={service?.requiresQuote ?? false}
          className="size-5 shrink-0 cursor-pointer appearance-auto accent-[#176B7A]"
        />
        Requiere cotización
      </label>
      <div>
        <label
          htmlFor="estimatedDays"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Tiempo estimado de producción (días)
        </label>
        <input
          id="estimatedDays"
          name="estimatedDays"
          type="number"
          min="1"
          max="365"
          step="1"
          defaultValue={service?.estimatedDays ?? ""}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:ring-2 focus:ring-[#176B7A]/20"
        />
      </div>
      <label className="flex items-center gap-3 rounded-lg  bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
        <input
          type="checkbox"
          name="published"
          defaultChecked={service?.published ?? false}
          className="size-5 shrink-0 cursor-pointer appearance-auto accent-[#176B7A]"
        />
        Publicar en el catálogo público
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-emerald-600">
          {success}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex items-center justify-center rounded-lg bg-[#176B7A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#125663] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B7A] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending
          ? "Guardando..."
          : service
            ? "Guardar cambios"
            : "Crear servicio"}
      </button>
    </form>
  );
}
