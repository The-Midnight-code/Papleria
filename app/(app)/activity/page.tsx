import { and, desc, gte, lt, sql } from "drizzle-orm";

import { db } from "@/db/db";
import { activityLogs, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    CREATE: "Creó",
    DELETE: "Eliminó",
    ACTIVATE: "Activó usuario",
    DEACTIVATE: "Desactivó usuario",
    PAID: "Marcó como pagado",
    UNPAID: "Marcó como no pagado",
  };

  return labels[action] ?? action;
}

function getEntityLabel(entityType: string) {
  const labels: Record<string, string> = {
    USER: "Usuario",
    LIST: "Lista",
    CLIENT: "Cliente",
    LIST_CLIENT: "Cliente en lista",
  };

  return labels[entityType] ?? entityType;
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  await requireAdmin();
  const { user } = await searchParams;
  const username = user?.trim() ?? "";

  const now = new Date();

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const startOfNextDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  const activityList = await db
    .select({
      id: activityLogs.id,
      module: activityLogs.module,
      action: activityLogs.action,
      entityType: activityLogs.entityType,
      entityId: activityLogs.entityId,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
      performedBy: {
        id: users.id,
        name: users.name,
        username: users.username,
      },
    })
    .from(activityLogs)
    .leftJoin(
      users,
      sql`${users.id} = (${activityLogs.metadata}->>'performedBy')::uuid`,
    )
    .where(
      and(
        gte(activityLogs.createdAt, startOfDay),
        lt(activityLogs.createdAt, startOfNextDay),
        ...(username
          ? [
              sql`LOWER(${users.username}) LIKE ${`%${username.toLowerCase()}%`}`,
            ]
          : []),
      ),
    )
    .orderBy(desc(activityLogs.createdAt));

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white/60">Administración</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
            Movimientos
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Consulta los movimientos realizados hoy dentro del sistema.
          </p>
        </div>

        <div className="hidden rounded-xl bg-white/10 px-4 py-2 text-center sm:block">
          <p className="text-2xl font-bold text-white">{activityList.length}</p>
          <p className="text-xs font-medium text-white/60">
            {activityList.length === 1 ? "movimiento" : "movimientos"}
          </p>
        </div>
      </div>

      <form method="GET" className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="search"
            name="user"
            defaultValue={username}
            placeholder="Buscar por usuario..."
            className="w-full rounded-xl border border-white/20 bg-white px-4 py-3 pr-4 text-sm text-gray-900 shadow-lg outline-none transition placeholder:text-gray-400 focus:border-[#53B0C9] focus:ring-2 focus:ring-[#53B0C9]/30"
          />
        </div>

        <button
          type="submit"
          className="rounded-xl bg-[#176B7A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#125866]"
        >
          Buscar
        </button>

        {username && (
          <a
            href="/activity"
            className="rounded-xl bg-white/80 px-6 py-3 text-center text-sm font-semibold text-gray-600 transition hover:bg-white"
          >
            Limpiar
          </a>
        )}
      </form>

      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        {activityList.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium text-gray-900">
              No hay movimientos registrados
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Los movimientos realizados hoy aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Usuario
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Acción
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Entidad
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {activityList.map((activity) => (
                  <tr
                    key={activity.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {new Intl.DateTimeFormat("es-MX", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(activity.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {activity.performedBy ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {activity.performedBy.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            @{activity.performedBy.username}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Usuario desconocido
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {getActionLabel(activity.action)}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getEntityLabel(activity.entityType)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
