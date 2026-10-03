"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

type NavbarProps = {
  user: {
    name: string;
    role: "ADMIN" | "EMPLOYEE";
  };
};

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  const isDashboard = pathname === "/dashboard";
  const isLists = pathname.startsWith("/lists");
  const isUsers = pathname.startsWith("/users");
  const isActivity = pathname.startsWith("/activity");

  const activeClass =
    "rounded-lg bg-[#FFD400] px-3 py-2 text-sm font-semibold text-[#176B7A] transition hover:bg-[#e6bf00]";

  const inactiveClass =
    "rounded-lg px-3 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white";

  return (
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
            className={isDashboard ? activeClass : inactiveClass}
          >
            Inicio
          </Link>

          <Link href="/lists" className={isLists ? activeClass : inactiveClass}>
            Listas
          </Link>

          {user.role === "ADMIN" && (
            <>
              <Link
                href="/users"
                className={isUsers ? activeClass : inactiveClass}
              >
                Usuarios
              </Link>

              <Link
                href="/activity"
                className={isActivity ? activeClass : inactiveClass}
              >
                Movimientos
              </Link>
            </>
          )}
        </nav>

        {/* User */}
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/profile"
            className="rounded-xl px-3 py-2 transition hover:bg-white/10"
          >
            <p className="text-sm font-semibold text-white">{user.name}</p>
          </Link>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFD400] font-semibold text-[#176B7A]">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <form action="/logout" method="POST">
            <button
              type="submit"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="group flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-[#FFD400]"
            >
              <LogOut
                size={20}
                strokeWidth={2.2}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
