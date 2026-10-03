"use client";

import { useRef, useState } from "react";

import { addClientToList } from "./actions";

type AddClientFormProps = {
  listId: string;
};

export function AddClientForm({ listId }: AddClientFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");

    const result = await addClientToList(listId, formData);

    if (result?.error) {
      setError(result.error);
      return;
    }

    formRef.current?.reset();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="rounded-xl bg-[#FFD400] px-4 py-2.5 text-sm font-semibold text-[#176B7A] shadow-sm transition hover:bg-[#e6bf00]"
      >
        + Agregar cliente
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Agregar cliente
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Ingresa el nombre del cliente.
              </p>
            </div>

            <form ref={formRef} action={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Nombre
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  maxLength={100}
                  autoFocus
                  placeholder="Ej. Juan Pérez"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#53B0C9] focus:ring-2 focus:ring-[#53B0C9]/20"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-[#7F27A8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6d218f]"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
