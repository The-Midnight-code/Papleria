import Link from "next/link";

import { requireUser } from "@/lib/auth/authorization";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
          Sistema de gestión
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
          Bienvenido, {user.name}
        </h1>

        <p className="mt-2 text-sm text-white/70">
          Administra las operaciones de la papelería desde aquí.
        </p>
      </div>

      {/* Modules */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Listas */}
        <Link
          href="/lists"
          className="group rounded-2xl bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFD400] text-2xl">
              📋
            </div>

            <span className="text-lg text-[#176B7A]/40 transition group-hover:translate-x-1 group-hover:text-[#176B7A]">
              →
            </span>
          </div>

          <h2 className="mt-5 text-lg font-bold text-gray-900">Listas</h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Consulta y administra las listas de personas, sus pagos y entregas.
          </p>

          <div className="mt-5 text-sm font-semibold text-[#176B7A]">
            Ver listas
          </div>
        </Link>

        {user.role === "ADMIN" && (
          <>
            {/* Usuarios */}
            <Link
              href="/users"
              className="group rounded-2xl bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#53B0C9] text-2xl">
                  👥
                </div>

                <span className="text-lg text-[#176B7A]/40 transition group-hover:translate-x-1 group-hover:text-[#176B7A]">
                  →
                </span>
              </div>

              <h2 className="mt-5 text-lg font-bold text-gray-900">Usuarios</h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Administra los usuarios y accesos al sistema.
              </p>

              <div className="mt-5 text-sm font-semibold text-[#176B7A]">
                Administrar usuarios
              </div>
            </Link>

            {/* Movimientos */}
            <Link
              href="/activity"
              className="group rounded-2xl bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E885CF] text-2xl">
                  📝
                </div>

                <span className="text-lg text-[#176B7A]/40 transition group-hover:translate-x-1 group-hover:text-[#176B7A]">
                  →
                </span>
              </div>

              <h2 className="mt-5 text-lg font-bold text-gray-900">
                Movimientos
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Consulta la actividad realizada por los usuarios.
              </p>

              <div className="mt-5 text-sm font-semibold text-[#176B7A]">
                Ver movimientos
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
