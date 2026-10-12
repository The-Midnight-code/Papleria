import Link from "next/link";
import { desc } from "drizzle-orm";
import Image from "next/image";

import { db } from "@/db/db";
import { services } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";
import { ServiceStatusButton } from "./service-status-button";

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
          <h2 className="text-lg font-semibold text-white">
            Servicios registrados
          </h2>
          <p className="text-sm text-white/75">
            {allServices.length} {allServices.length === 1 ? "servicio" : "servicios"}
          </p>
        </div>

        {allServices.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#FFD400]/25 text-2xl" aria-hidden="true">
              ✦
            </div>
            <h3 className="mt-4 font-bold text-gray-900">
              Todavía no hay servicios
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-500">
              Registra el primer servicio para comenzar a organizar tu catálogo.
            </p>
            <Link
              href="/services/new"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#176B7A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#125663] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B7A]"
            >
              Crear primer servicio
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {allServices.map((service) => (
              <article
                key={service.id}
                className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-white p-5 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#176B7A]">
                      {service.category}
                    </p>
                    <h3 className="mt-1 break-words text-lg font-bold text-gray-900">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                        {service.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      service.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {service.active ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {service.imageMimeType && (
                  <Image
                    src={`/api/services/${service.id}/image`}
                    alt={service.name}
                    width={600}
                    height={240}
                    className="max-h-44 w-full rounded-xl border border-gray-100 bg-gray-50 object-contain"
                  />
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-gray-50 px-4 py-3 text-sm">
                  <span className="font-semibold text-gray-900">
                    {service.requiresQuote
                      ? "Precio por cotización"
                      : `$${Number(service.price).toFixed(2)} MXN`}
                  </span>
                  {service.estimatedDays && (
                    <span className="text-gray-600">
                      Tiempo estimado: {service.estimatedDays} día(s)
                    </span>
                  )}
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                  <div className="space-y-1">
                    <span
                      className={`block text-sm font-medium ${
                        service.published ? "text-[#176B7A]" : "text-gray-500"
                      }`}
                    >
                      {service.published ? "Publicado" : "No publicado"}
                    </span>
                    <ServiceStatusButton
                      serviceId={service.id}
                      active={service.active}
                    />
                  </div>

                  <Link
                    href={`/services/${service.id}/edit`}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-[#176B7A]/40 hover:bg-[#176B7A]/5 hover:text-[#125663] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B7A]"
                  >
                    Editar servicio <span aria-hidden="true" className="ml-2">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
