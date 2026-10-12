"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setServiceActive } from "./actions";

type Props = {
  serviceId: string;
  active: boolean;
};

export function ServiceStatusButton({ serviceId, active }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleClick() {
    setError("");

    startTransition(async () => {
      try {
        const result = await setServiceActive(serviceId, !active);
        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }

        router.refresh();
      } catch {
        setError("No se pudo cambiar el estado del servicio.");
      }
    });
  }

  return (
    <div>
      {" "}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          active
            ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:outline-rose-500"
            : "border-[#176B7A] bg-[#176B7A] text-white hover:bg-[#125663] focus-visible:outline-[#176B7A]"
        }`}
      >
        {pending ? "Actualizando..." : active ? "Desactivar" : "Activar"}{" "}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
