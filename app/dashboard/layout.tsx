import Link from "next/link";

import { requireUser } from "@/lib/auth/authorization";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#7F27A8]">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#FFD400] opacity-90" />

        <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-[#53B0C9] opacity-80" />

        <div className="absolute right-1/4 top-24 h-40 w-40 rounded-full bg-[#F76400] opacity-70" />

        <div className="absolute bottom-24 left-1/4 h-32 w-32 rounded-full bg-[#E885CF] opacity-70" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b-2 border-[#FFD400] bg-[#176B7A] shadow-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/dashboard" className="flex shrink-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFD400] text-xl">
              📋
            </div>

            <span className="hidden text-lg font-bold text-white sm:block">
              Papelería
            </span>
          </Link>
          {/* Navigation */}
          <nav className="ml-8 flex h-full items-center gap-1">
            <Link
              href="/dashboard"
              className="rounded-lg bg-[#FFD400] px-3 py-2 text-sm font-semibold text-[#176B7A] transition hover:bg-[#e6bf00]"
            >
              Inicio
            </Link>

            <Link
              href="/lists"
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              Listas
            </Link>

            {user.role === "ADMIN" && (
              <>
                <Link
                  href="/users"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  Usuarios
                </Link>

                <Link
                  href="/activity"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  Movimientos
                </Link>
              </>
            )}
          </nav>
          {/* User */}
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">{user.name}</p>

              <p className="text-xs text-white/60">
                {user.role === "ADMIN" ? "Administrador" : "Empleado"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFD400] font-semibold text-[#176B7A]">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <form action="/logout" method="POST">
              <button
                type="submit"
                title="Cerrar sesión"
                className="rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-red-50 hover:text-red-600"
              >
                🚪
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-7xl">{children}</main>
    </div>
  );
}
