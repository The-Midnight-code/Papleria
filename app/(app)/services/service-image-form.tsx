"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadServiceImage } from "./image-actions";

type Props = {
  serviceId: string;
  serviceName: string;
};

export function ServiceImageForm({ serviceId, serviceName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setMessage("");
    setError("");

    startTransition(async () => {
      try {
        const result = await uploadServiceImage(serviceId, formData);

        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }

        setMessage("Imagen actualizada.");
        router.refresh();
      } catch {
        setError("No se pudo guardar la imagen.");
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4"
    >
      <label
        htmlFor={`image-${serviceId}`}
        className="block text-sm font-semibold text-gray-800"
      >
        Imagen de {serviceName}{" "}
      </label>

      <input
        id={`image-${serviceId}`}
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required
        className="block w-full rounded-lg border border-gray-200 bg-white p-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#176B7A]/10 file:px-3 file:py-2 file:font-semibold file:text-[#176B7A] hover:file:bg-[#176B7A]/20"
      />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-lg bg-[#176B7A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#125663] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B7A] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Subiendo..." : "Guardar imagen"}
      </button>

      {message && (
        <p role="status" className="text-sm text-emerald-600">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </form>
  );
}
