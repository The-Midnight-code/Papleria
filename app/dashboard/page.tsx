import { requireUser } from "@/lib/auth/authorization";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user.name}
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Este es el inicio del sistema de gestión de la papelería.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFD400] text-2xl">
            📋
          </div>

          <h2 className="font-semibold text-gray-900">Listas</h2>

          <p className="mt-1 text-sm text-gray-500">
            Consulta y administra las listas de clientes.
          </p>
        </div>

        {user.role === "ADMIN" && (
          <>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#53B0C9] text-2xl">
                👥
              </div>

              <h2 className="font-semibold text-gray-900">Usuarios</h2>

              <p className="mt-1 text-sm text-gray-500">
                Administra los usuarios del sistema.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E885CF] text-2xl">
                📝
              </div>

              <h2 className="font-semibold text-gray-900">Movimientos</h2>

              <p className="mt-1 text-sm text-gray-500">
                Consulta la actividad realizada en el sistema.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
