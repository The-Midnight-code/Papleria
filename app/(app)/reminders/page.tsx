import { Bell, Check, CircleCheck, Clock3, UserRound, Zap } from "lucide-react";
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
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#FFD400]" />

            <p className="text-sm font-semibold uppercase tracking-wider text-[#FFD400]">
              Recordatorios
            </p>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Mis recordatorios
          </h1>

          <p className="mt-2 text-white/70">
            Tareas que necesitan tu atención.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-center">
            <p className="text-2xl font-bold text-white">
              {pendingReminders.length}
            </p>

            <p className="text-xs font-medium text-white/60">
              {pendingReminders.length === 1 ? "pendiente" : "pendientes"}
            </p>
          </div>

          {user.role === "ADMIN" && <CreateReminderForm />}
        </div>
      </div>

      <section className="space-y-5">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Clock3 className="h-5 w-5 text-[#FFD400]" />
            Pendientes
          </h2>

          <p className="mt-1 text-sm text-white/60">
            {pendingReminders.length}{" "}
            {pendingReminders.length === 1
              ? "recordatorio pendiente"
              : "recordatorios pendientes"}
          </p>
        </div>

        {pendingReminders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/10 px-6 py-10 text-center">
            <CircleCheck className="mx-auto h-10 w-10 text-green-300/80" />

            <p className="mt-3 font-medium text-white">Todo está al día</p>

            <p className="mt-1 text-sm text-white/50">
              No tienes recordatorios pendientes.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingReminders.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/10  bg-white/10 p-5 shadow-sm transition hover:bg-white/[0.13] border-l-4 border-l-[#FFD400]"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ">
                        {item.reminder.scheduledAt ? (
                          <Clock3 className="h-5 w-5 text-[#53B0C9]" />
                        ) : (
                          <Zap className="h-5 w-5 text-[#53B0C9]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            {item.reminder.title}
                          </h3>

                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#176B7A]">
                            PENDIENTE
                          </span>
                        </div>

                        {item.reminder.message && (
                          <p className="mt-2 text-sm leading-6 text-white/70">
                            {item.reminder.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/50">
                      {item.reminder.scheduledAt ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          {item.reminder.scheduledAt.toLocaleString("es-MX")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5" />
                          Inmediato
                        </span>
                      )}

                      {item.reminder.creator && (
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5" />
                          {item.reminder.creator.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <CompleteReminderButton userReminderId={item.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {completedReminders.length > 0 && (
        <section className="mt-12 space-y-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <CircleCheck className="h-5 w-5 text-green-300" />
              Realizados hoy
            </h2>

            <p className="mt-1 text-sm text-white/60">
              {completedReminders.length}{" "}
              {completedReminders.length === 1
                ? "recordatorio realizado"
                : "recordatorios realizados"}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/10">
            {completedReminders.map((item, index) => (
              <article
                key={item.id}
                className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                  index > 0 ? "border-t border-white/10" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/15">
                    <Check className="h-4 w-4 text-green-300" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-medium text-white/70 line-through">
                      {item.reminder.title}
                    </h3>

                    <p className="mt-1 text-xs text-white/40">
                      Realizado: {item.completedAt?.toLocaleString("es-MX")}
                    </p>
                  </div>
                </div>

                <span className="ml-11 shrink-0 self-start rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300 sm:ml-0 sm:self-auto">
                  REALIZADO
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
