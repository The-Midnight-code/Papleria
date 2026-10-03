"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateProfile } from "./actions";

type EditProfileFormProps = {
  name: string;
  username: string;
};

export function EditProfileForm({
  name: initialName,
  username: initialUsername,
}: EditProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const result = await updateProfile(name, username);

    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setSuccess("Tu información se actualizó correctamente.");
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="mt-6 rounded-2xl bg-white p-6 shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Información de la cuenta
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Actualiza tu nombre y nombre de usuario.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="profile-name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Nombre
          </label>

          <input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            type="text"
            placeholder="Nombre completo"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:bg-white focus:ring-2 focus:ring-[#176B7A]/20"
          />
        </div>

        <div>
          <label
            htmlFor="profile-username"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Usuario
          </label>

          <input
            id="profile-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            type="text"
            placeholder="Nombre de usuario"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:bg-white focus:ring-2 focus:ring-[#176B7A]/20"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="flex justify-end border-t border-gray-100 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-[#FFD400] px-4 py-2.5 text-sm font-bold text-[#176B7A] transition hover:bg-[#e6bf00] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
