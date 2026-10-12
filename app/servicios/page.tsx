import Image from "next/image";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/db";
import { services } from "@/db/schema";

export default async function PublicServicesPage() {
  const publishedServices = await db
    .select({
      id: services.id,
      name: services.name,
      description: services.description,
      category: services.category,
      imageMimeType: services.imageMimeType,
      price: services.price,
      requiresQuote: services.requiresQuote,
      estimatedDays: services.estimatedDays,
    })
    .from(services)
    .where(and(eq(services.active, true), eq(services.published, true)))
    .orderBy(services.category, services.name);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden bg-[#123D46]">
        <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-20">
          <div className="absolute -right-20 -top-32 h-96 w-96 rounded-full bg-[#FFD400] blur-3xl" />
          <div className="absolute -bottom-40 left-[-5rem] h-96 w-96 rounded-full bg-[#4BB5B2] blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#FFE56B]">
              Papelería · Catálogo
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Nuestros servicios
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              Encuentra el servicio que necesitas. Consulta las opciones, conoce los precios publicados y revisa los tiempos estimados.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-xl bg-[#FFD400] px-4 py-2.5 text-sm font-extrabold text-slate-900">
                {publishedServices.length} {publishedServices.length === 1 ? "servicio disponible" : "servicios disponibles"}
              </span>
              <span className="text-sm text-white/70">Precios en pesos mexicanos (MXN)</span>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="h-1.5 bg-[#FFD400]" />
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        {publishedServices.length === 0 ? (
          <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-[#176B7A]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-8 w-8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 4.75h14A1.25 1.25 0 0 1 20.25 6v14H3.75V6A1.25 1.25 0 0 1 5 4.75Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 8.5h8M8 12h8M8 15.5h4" />
              </svg>
            </div>
            <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-900">Estamos preparando nuestro catálogo</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Por el momento no hay servicios publicados. Vuelve pronto para conocer nuestras opciones.
            </p>
          </section>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176B7A]">Explora nuestras opciones</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Servicios disponibles</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-slate-500">
                Algunos servicios pueden variar según los detalles del trabajo y requieren cotización.
              </p>
            </div>

            <section aria-label="Lista de servicios disponibles" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {publishedServices.map((service) => (
                <article
                  key={service.id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#176B7A]/30 hover:shadow-lg"
                >
                  <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-white to-amber-50 p-4">
                    {service.imageMimeType ? (
                      <Image
                        src={`/api/services/${service.id}/image`}
                        alt={service.name}
                        width={800}
                        height={450}
                        unoptimized
                        className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white bg-white/90 text-[#176B7A] shadow-sm">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.75h7.5l4 4v12.5H6.75a1.5 1.5 0 0 1-1.5-1.5v-13.5a1.5 1.5 0 0 1 1.5-1.5Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 3.75v4h4M8.5 12h7M8.5 15.5h7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <p className="w-fit rounded-full bg-[#E8F4F3] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#176B7A]">
                      {service.category}
                    </p>
                    <h3 className="mt-3 text-xl font-bold leading-snug text-slate-900">{service.name}</h3>

                    {service.description ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{service.description}</p>
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-slate-400">Consulta los detalles de este servicio en la papelería.</p>
                    )}

                    <div className="mt-auto pt-5">
                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {service.requiresQuote ? "Precio" : "Precio desde"}
                        </p>
                        <p className="mt-1 text-lg font-extrabold text-[#123D46]">
                          {service.requiresQuote
                            ? "Sujeto a cotización"
                            : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(service.price))}
                        </p>
                        {service.estimatedDays && (
                          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 shrink-0" aria-hidden="true">
                              <circle cx="12" cy="12" r="8.25" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v5l3 1.75" />
                            </svg>
                            Tiempo estimado: {service.estimatedDays} {service.estimatedDays === 1 ? "día" : "días"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
