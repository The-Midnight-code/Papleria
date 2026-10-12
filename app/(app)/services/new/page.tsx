import Link from "next/link";

import { requireAdmin } from "@/lib/auth/authorization";
import { ServiceForm } from "../service-form";

export default async function NewServicePage() {
  await requireAdmin();

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <Link
          href="/services"
          className="text-sm text-white/75 transition hover:text-white"
        >
          ← Volver al catálogo
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Nuevo servicio
        </h1>
        <p className="text-sm text-white/75">
          Registra los datos del servicio que ofrecerá la papelería.
        </p>
      </header>

      <ServiceForm />
    </main>
  );
}
