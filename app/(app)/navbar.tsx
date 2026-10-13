"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { ReminderBell } from "./reminders/reminder-bell";
import Image from "next/image";
import PapeLogo from "@/public/Pape.png";

type NavbarProps = {
  user: {
    name: string;
    role: "ADMIN" | "EMPLOYEE";
  };
};

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/lists", label: "Listas" },
  { href: "/inventory", label: "Inventario" },
  { href: "/pos", label: "Punto de venta" },
];

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  };

  return (
    <header className="relative z-50 border-b-4 border-[#FFD400] bg-[#176B7A]">
      {/* Desktop */}
      <div className="mx-auto hidden h-16 max-w-7xl items-center px-4 sm:flex sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="shrink-0 text-xl font-black tracking-tight text-white"
        >
          <Image alt="La pape" src={PapeLogo} width={40} height={40} />
        </Link>

        {/* Desktop navigation */}
        <nav className="ml-8 flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isActive(link.href)
                  ? "bg-[#FFD400] text-[#176B7A]"
                  : "text-white/90 hover:bg-white/10 hover:text-[#FFD400]"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user.role === "ADMIN" && (
            <>
              <Link
                href="/users"
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive("/users")
                    ? "bg-[#FFD400] text-[#176B7A]"
                    : "text-white/90 hover:bg-white/10 hover:text-[#FFD400]"
                }`}
              >
                Usuarios
              </Link>

              <Link
                href="/activity"
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive("/activity")
                    ? "bg-[#FFD400] text-[#176B7A]"
                    : "text-white/90 hover:bg-white/10 hover:text-[#FFD400]"
                }`}
              >
                Actividad
              </Link>
            </>
          )}
        </nav>

        {/* Desktop user actions */}
        <div className="ml-auto flex items-center gap-3">
          <ReminderBell />

          <div className="text-right">
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-white/60">
              {user.role === "ADMIN" ? "Administrador" : "Empleado"}
            </p>
          </div>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-[#FFD400]"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile */}
      <div className="relative w-full sm:hidden">
        {/* Mobile header row */}
        <div className="flex h-16 w-full items-center px-4">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="block shrink-0 text-xl font-black tracking-tight text-white"
          >
            PAPE
          </Link>

          {/* Mobile actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <ReminderBell />

            <details className="static">
              <summary
                className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl text-white transition hover:bg-white/10 hover:text-[#FFD400] active:bg-white/10 [&::-webkit-details-marker]:hidden"
                title="Abrir menú"
                aria-label="Abrir menú"
              >
                <Menu className="h-6 w-6 shrink-0" strokeWidth={2} />
              </summary>

              {/* Mobile menu */}
              <div className="absolute left-0 right-0 top-16 z-[100] w-full border-t border-white/10 bg-[#176B7A] p-3 shadow-2xl">
                <nav className="flex w-full flex-col gap-1">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        isActive(link.href)
                          ? "bg-[#FFD400] text-[#176B7A]"
                          : "text-white hover:bg-white/10 hover:text-[#FFD400]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {user.role === "ADMIN" && (
                    <>
                      <Link
                        href="/users"
                        className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                          isActive("/users")
                            ? "bg-[#FFD400] text-[#176B7A]"
                            : "text-white hover:bg-white/10 hover:text-[#FFD400]"
                        }`}
                      >
                        Usuarios
                      </Link>

                      <Link
                        href="/activity"
                        className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                          isActive("/activity")
                            ? "bg-[#FFD400] text-[#176B7A]"
                            : "text-white hover:bg-white/10 hover:text-[#FFD400]"
                        }`}
                      >
                        Actividad
                      </Link>
                    </>
                  )}

                  <div className="my-1 border-t border-white/10" />

                  <div className="px-4 py-2">
                    <p className="text-sm font-semibold text-white">
                      {user.name}
                    </p>
                    <p className="text-xs text-white/60">
                      {user.role === "ADMIN" ? "Administrador" : "Empleado"}
                    </p>
                  </div>

                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10 hover:text-[#FFD400]"
                    >
                      <LogOut className="h-5 w-5" />
                      Cerrar sesión
                    </button>
                  </form>
                </nav>
              </div>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}
