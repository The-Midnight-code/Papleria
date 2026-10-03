"use client";

import { useState } from "react";

import { resetUserPassword } from "./actions";

type ResetPasswordFormProps = {
  userId: string;
  username: string;
  onClose: () => void;
};

export function ResetPasswordForm({
  userId,
  username,
  onClose,
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    const result = await resetUserPassword(userId, password, confirmPassword);

    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-[#7F27A8]">
            Restablecer contraseña
          </p>

          <h2 className="mt-1 text-2xl font-bold text-[#176B7A]">{username}</h2>

          <p className="mt-2 text-sm text-gray-500">
            Establece una nueva contraseña para este usuario.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reset-password"
              className="mb-1 block text-sm font-semibold text-gray-700"
            >
              Nueva contraseña
            </label>

            <div className="relative">
              <input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 text-gray-800 outline-none transition focus:border-[#53B0C9]"
                placeholder="Mínimo 8 caracteres"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="reset-confirm-password"
              className="mb-1 block text-sm font-semibold text-gray-700"
            >
              Confirmar contraseña
            </label>

            <div className="relative">
              <input
                id="reset-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 text-gray-800 outline-none transition focus:border-[#53B0C9]"
                placeholder="Repite la contraseña"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
                aria-label={
                  showConfirmPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#176B7A] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Restableciendo..." : "Restablecer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
