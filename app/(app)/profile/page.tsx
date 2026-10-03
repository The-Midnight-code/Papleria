import { requireUser } from "@/lib/auth/authorization";
import { ChangePasswordForm } from "./change-password-form";
import { EditProfileForm } from "./edit-profile-form";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-4xl pt-8">
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#FFD400]">
          Mi cuenta
        </p>

        <h1 className="text-3xl font-bold text-white">Mi perfil</h1>

        <p className="mt-2 text-white/70">
          Consulta la información de tu cuenta.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-500">Nombre</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {user.name}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Usuario</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {user.username}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Rol</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {user.role === "ADMIN" ? "Administrador" : "Empleado"}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Estado</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-lg font-semibold text-gray-900">
                Activo
              </span>
            </div>
          </div>
        </div>
      </div>
      <EditProfileForm name={user.name} username={user.username} />
      <ChangePasswordForm />
    </div>
  );
}
