import Link from "next/link";
import { desc } from "drizzle-orm";

import { db } from "@/db/db";
import { services } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";
import { ServiceCatalog } from "./service-catalog";

export default async function ServicesPage() {
  await requireAdmin();

  const allServices = await db
    .select({
      id: services.id,
      name: services.name,
      description: services.description,
      category: services.category,
      imageMimeType: services.imageMimeType,
      price: services.price,
      requiresQuote: services.requiresQuote,
      estimatedDays: services.estimatedDays,
      published: services.published,
      active: services.active,
      createdAt: services.createdAt,
    })
    .from(services)
    .orderBy(desc(services.createdAt));

  const activeCount = allServices.filter((service) => service.active).length;
  const publishedCount = allServices.filter((service) => service.published).length;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-white/75 transition hover:text-white"
          >
            ← Volver al inicio
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Catálogo de servicios
          </h1>
          <p className="mt-1 text-sm text-white/75">
            Consulta y administra los servicios que ofrece la papelería.
          </p>
        </div>

        <Link
          href="/services/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FFD400] px-5 py-3 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-[#ffe04d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden="true" className="mr-2 text-lg leading-none">+</span>
          Nuevo servicio
        </Link>
      </header>

      <section aria-label="Resumen del catálogo" className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-white/60 bg-white/95 p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total de servicios</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{allServices.length}</p>
        </article>
        <article className="rounded-2xl border border-white/60 bg-white/95 p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Servicios activos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{activeCount}</p>
        </article>
        <article className="rounded-2xl border border-white/60 bg-white/95 p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Publicados</p>
          <p className="mt-1 text-2xl font-bold text-[#176B7A]">{publishedCount}</p>
        </article>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">Servicios registrados</h2>
          <p className="text-sm text-white/75">
            {allServices.length} {allServices.length === 1 ? "servicio" : "servicios"}
          </p>
        </div>
        <ServiceCatalog services={allServices} />
      </section>
    </main>
  );
}
