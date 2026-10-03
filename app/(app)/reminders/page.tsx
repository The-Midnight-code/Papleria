import { desc, eq } from "drizzle-orm";

import { db } from "@/db/db";
import { userReminders } from "@/db/schema";
import { requireUser } from "@/lib/auth/authorization";
import { CompleteReminderButton } from "./complete-reminder-button";
import { CreateReminderForm } from "./create-reminder-form";

export default async function RemindersPage() {
  const user = await requireUser();
  const now = new Date();

  const reminders = await db.query.userReminders.findMany({
    where: eq(userReminders.userId, user.id),
    with: {
      reminder: {
        with: {
          creator: {
            columns: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: [desc(userReminders.createdAt)],
  });

  const pendingReminders = reminders.filter(
    (item) =>
      !item.completedAt &&
      (!item.reminder.scheduledAt || item.reminder.scheduledAt <= now),
  );

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const completedReminders = reminders.filter(
    (item) =>
      item.completedAt &&
      item.completedAt >= startOfDay &&
      item.completedAt <= endOfDay,
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#FFD400]">
            Recordatorios
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Mis recordatorios
          </h1>

          <p className="mt-2 text-white/70">
            Aquí aparecerán las tareas que necesitan tu atención.
          </p>
        </div>

        {user.role === "ADMIN" && <CreateReminderForm />}
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Pendientes</h2>

          <p className="text-sm text-white/60">
            {pendingReminders.length}{" "}
            {pendingReminders.length === 1
              ? "recordatorio pendiente"
              : "recordatorios pendientes"}
          </p>
        </div>

        {pendingReminders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/10 p-8 text-center">
            <p className="text-white/70">No tienes recordatorios pendientes.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingReminders.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/10 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {item.reminder.title}
                    </h3>

                    {item.reminder.message && (
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {item.reminder.message}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="rounded-full bg-[#FFD400] px-3 py-1 text-xs font-bold text-[#176B7A]">
                      PENDIENTE
                    </span>

                    <CompleteReminderButton userReminderId={item.id} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/50">
                  {item.reminder.scheduledAt && (
                    <span>
                      Programado:{" "}
                      {item.reminder.scheduledAt.toLocaleString("es-MX")}
                    </span>
                  )}

                  {item.reminder.creator && (
                    <span>Creado por: {item.reminder.creator.name}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {completedReminders.length > 0 && (
        <section className="mt-10 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Realizados</h2>

            <p className="text-sm text-white/60">
              {completedReminders.length}{" "}
              {completedReminders.length === 1
                ? "recordatorio realizado"
                : "recordatorios realizados"}
            </p>
          </div>

          <div className="grid gap-3">
            {completedReminders.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/10 bg-black/10 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-white/70 line-through">
                      {item.reminder.title}
                    </h3>

                    <p className="mt-1 text-xs text-white/40">
                      Realizado: {item.completedAt?.toLocaleString("es-MX")}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300">
                    REALIZADO
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
