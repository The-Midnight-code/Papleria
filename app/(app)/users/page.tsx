import { desc } from "drizzle-orm";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";
import { CreateUserForm } from "./create-user-form";
import { ToggleUserStatusButton } from "./toggle-user-status-button";
import { ResetPasswordButton } from "./reset-password-button";

export default async function UsersPage() {
  const admin = await requireAdmin();

  const userList = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
  });

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white/60">Administración</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
            Usuarios
          </h1>

          <p className="mt-2 text-sm text-white/70">
            Administra las cuentas que tienen acceso al sistema.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden rounded-xl bg-white/10 px-4 py-2 text-center sm:block">
            <p className="text-2xl font-bold text-white">{userList.length}</p>

            <p className="text-xs font-medium text-white/60">
              {userList.length === 1 ? "usuario" : "usuarios"}
            </p>
          </div>

          <CreateUserForm />
        </div>
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        {userList.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium text-gray-900">
              No hay usuarios registrados
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Los usuarios aparecerán aquí cuando sean creados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Usuario
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Nombre
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rol
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Estado
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Creado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {userList.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {user.username}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{user.name}</span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={
                          user.role === "ADMIN"
                            ? "inline-flex rounded-full bg-[#FFD400]/30 px-3 py-1 text-xs font-bold text-[#176B7A]"
                            : "inline-flex rounded-full bg-[#53B0C9]/20 px-3 py-1 text-xs font-bold text-[#176B7A]"
                        }
                      >
                        {user.role === "ADMIN" ? "ADMINISTRADOR" : "EMPLEADO"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              user.active ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              user.active ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {user.active ? "Activo" : "Inactivo"}
                          </span>
                        </div>

                        {user.id !== admin.id && (
                          <ToggleUserStatusButton
                            userId={user.id}
                            userName={user.name}
                            active={user.active}
                          />
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Intl.DateTimeFormat("es-MX", {
                        dateStyle: "medium",
                      }).format(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {user.id !== admin.id && (
                        <ResetPasswordButton
                          userId={user.id}
                          username={user.username}
                        />
                      )}
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
