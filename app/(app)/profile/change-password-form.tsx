"use client";

import { useState } from "react";

import { changePassword } from "./actions";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    const result = await changePassword(
      currentPassword,
      newPassword,
      confirmPassword,
    );

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccess("Tu contraseña se actualizó correctamente.");
    setLoading(false);
  }

  return (
    <div className="mt-6 rounded-2xl bg-white p-6 shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Cambiar contraseña</h2>

        <p className="mt-1 text-sm text-gray-500">
          Usa una contraseña segura de al menos 8 caracteres.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="currentPassword"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Contraseña actual
          </label>

          <div className="relative">
            <input
              id="currentPassword"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Contraseña actual"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:bg-white focus:ring-2 focus:ring-[#176B7A]/20"
            />

            <button
              type="button"
              onClick={() => setShowCurrentPassword((current) => !current)}
              aria-label={
                showCurrentPassword
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-1.5 py-1 text-gray-400 transition hover:bg-gray-100 hover:text-[#176B7A]"
            >
              {showCurrentPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Nueva contraseña
          </label>

          <div className="relative">
            <input
              id="newPassword"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              type={showNewPassword ? "text" : "password"}
              placeholder="Nueva contraseña"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:bg-white focus:ring-2 focus:ring-[#176B7A]/20"
            />

            <button
              type="button"
              onClick={() => setShowNewPassword((current) => !current)}
              aria-label={
                showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-1.5 py-1 text-gray-400 transition hover:bg-gray-100 hover:text-[#176B7A]"
            >
              {showNewPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Confirmar nueva contraseña
          </label>

          <div className="relative">
            <input
              id="confirmPassword"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repite la contraseña"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:bg-white focus:ring-2 focus:ring-[#176B7A]/20"
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={
                showConfirmPassword
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-1.5 py-1 text-gray-400 transition hover:bg-gray-100 hover:text-[#176B7A]"
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#176B7A] px-5 py-3 font-semibold text-white transition hover:bg-[#125968] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Actualizando..." : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}
