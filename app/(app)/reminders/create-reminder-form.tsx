"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createReminder } from "./actions";

export function CreateReminderForm() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scheduleType, setScheduleType] = useState<"NOW" | "SCHEDULED">("NOW");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setTitle("");
    setMessage("");
    setScheduleType("NOW");
    setScheduledDate("");
    setScheduledTime("");
    setError("");
    setIsSubmitting(false);
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    resetForm();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }

    if (scheduleType === "SCHEDULED") {
      if (!scheduledDate || !scheduledTime) {
        setError("Selecciona una fecha y una hora.");
        return;
      }
    }

    setIsSubmitting(true);

    const scheduledAt =
      scheduleType === "SCHEDULED" ? `${scheduledDate}T${scheduledTime}` : "";

    const result = await createReminder(title, message, scheduledAt);

    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setIsOpen(false);
    resetForm();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl bg-[#FFD400] px-4 py-2.5 text-sm font-bold text-[#176B7A] transition hover:brightness-95"
      >
        + Nuevo recordatorio
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Nuevo recordatorio
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                El recordatorio se asignará a todos los usuarios activos.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="reminder-title"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Título
                </label>

                <input
                  id="reminder-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={150}
                  placeholder="Ej. Sacar la basura"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:ring-2 focus:ring-[#176B7A]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="reminder-message"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Descripción
                  <span className="ml-1 font-normal text-gray-400">
                    (opcional)
                  </span>
                </label>

                <textarea
                  id="reminder-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Agrega detalles del recordatorio..."
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:ring-2 focus:ring-[#176B7A]/20"
                />
              </div>

              <div>
                <p className="mb-2 block text-sm font-semibold text-gray-700">
                  ¿Cuándo debe aparecer?
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setScheduleType("NOW")}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      scheduleType === "NOW"
                        ? "border-[#176B7A] bg-[#176B7A]/10 text-[#176B7A]"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="block text-sm font-bold">Ahora</span>

                    <span className="mt-1 block text-xs opacity-70">
                      Aparece inmediatamente
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleType("SCHEDULED")}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      scheduleType === "SCHEDULED"
                        ? "border-[#176B7A] bg-[#176B7A]/10 text-[#176B7A]"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="block text-sm font-bold">Programar</span>

                    <span className="mt-1 block text-xs opacity-70">
                      Elegir fecha y hora
                    </span>
                  </button>
                </div>
              </div>

              {scheduleType === "SCHEDULED" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="reminder-date"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Fecha
                    </label>

                    <input
                      id="reminder-date"
                      type="date"
                      value={scheduledDate}
                      onChange={(event) => setScheduledDate(event.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-2 focus:ring-[#176B7A]/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reminder-time"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Hora
                    </label>

                    <input
                      id="reminder-time"
                      type="time"
                      value={scheduledTime}
                      onChange={(event) => setScheduledTime(event.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#176B7A] focus:ring-2 focus:ring-[#176B7A]/20"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#176B7A] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Creando..." : "Crear recordatorio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
