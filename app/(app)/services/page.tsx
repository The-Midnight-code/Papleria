import Link from "next/link";
import { desc } from "drizzle-orm";
import Image from "next/image";

import { db } from "@/db/db";
import { services } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";
import { ServiceForm } from "./service-form";
import { ServiceStatusButton } from "./service-status-button";
import { ServiceImageForm } from "./service-image-form";

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

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
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
          Administra los servicios que ofrece la papelería.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">
          Registrar servicio
        </h2>
        <ServiceForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">
          Servicios registrados ({allServices.length})
        </h2>

        {allServices.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <p className="font-semibold text-gray-900">
              Todavía no hay servicios.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Registra el primero usando el formulario anterior.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {allServices.map((service) => (
              <article
                key={service.id}
                className="space-y-4 rounded-2xl border border-white/70 bg-white p-5 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#176B7A]">
                        {service.category}
                      </p>
                      <h3 className="mt-1 break-words text-lg font-bold text-gray-900">
                        {service.name}
                      </h3>
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
                      height={400}
                      className="max-h-56 w-full rounded-xl border border-gray-100 bg-gray-50 object-contain"
                    />
                  )}

                  <ServiceImageForm
                    serviceId={service.id}
                    serviceName={service.name}
                  />
                </div>

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

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  <span
                    className={`text-sm font-medium ${
                      service.published ? "text-[#176B7A]" : "text-gray-500"
                    }`}
                  >
                    {service.published
                      ? "Publicado en catálogo"
                      : "No publicado"}
                  </span>

                  <ServiceStatusButton
                    serviceId={service.id}
                    active={service.active}
                  />
                </div>

                <details className="border-t border-gray-100 pt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-[#176B7A] transition hover:text-[#125663] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#176B7A]">
                    Editar servicio
                  </summary>
                  <div className="mt-4">
                    <ServiceForm
                      service={{
                        id: service.id,
                        name: service.name,
                        description: service.description,
                        category: service.category,
                        price: service.price,
                        requiresQuote: service.requiresQuote,
                        estimatedDays: service.estimatedDays,
                        published: service.published,
                      }}
                    />
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
