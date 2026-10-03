"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { toggleUserStatus } from "./actions";

type ToggleUserStatusButtonProps = {
  userId: string;
  userName: string;
  active: boolean;
};

export function ToggleUserStatusButton({
  userId,
  userName,
  active,
}: ToggleUserStatusButtonProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    setOpen(false);
    setError("");
  }

  async function handleConfirm() {
    setError("");
    setIsSubmitting(true);

    const result = await toggleUserStatus(userId);

    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          active
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : "bg-green-50 text-green-600 hover:bg-green-100"
        }`}
      >
        {active ? "Desactivar" : "Activar"}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <div
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full text-xl ${
                  active ? "bg-red-100" : "bg-green-100"
                }`}
              >
                {active ? "⚠️" : "✓"}
              </div>

              <h2 className="text-lg font-bold text-gray-900">
                {active ? "Desactivar empleado" : "Activar empleado"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                ¿Deseas {active ? "desactivar" : "activar"} la cuenta de{" "}
                <span className="font-semibold text-gray-900">{userName}</span>?
              </p>

              {active && (
                <p className="mt-2 text-sm leading-6 text-red-600">
                  El empleado no podrá iniciar sesión mientras su cuenta esté
                  inactiva.
                </p>
              )}
            </div>

            {error && (
              <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 px-6 py-5">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isSubmitting
                  ? "Guardando..."
                  : active
                    ? "Desactivar"
                    : "Activar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
