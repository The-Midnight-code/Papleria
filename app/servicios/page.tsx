import { and, eq } from "drizzle-orm";

import { db } from "@/db/db";
import { services } from "@/db/schema";
import PublicServicesCatalog from "./public-services-catalog";

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
          <div className="absolute -right-20 -top-36 h-72 w-72 rounded-full bg-[#FFD400] blur-3xl" />
          <div className="absolute -bottom-32 left-[-4rem] h-64 w-64 rounded-full bg-[#4BB5B2] blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#FFE56B]">
              Papelería · Catálogo
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Nuestros servicios
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
              Encuentra el servicio que necesitas, consulta los precios publicados y revisa los tiempos estimados.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-lg bg-[#FFD400] px-3.5 py-2 text-sm font-extrabold text-slate-900">
                {publishedServices.length} {publishedServices.length === 1 ? "servicio disponible" : "servicios disponibles"}
              </span>
              <span className="text-xs text-white/70 sm:text-sm">Precios en pesos mexicanos (MXN)</span>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="h-1 bg-[#FFD400]" />
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
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
          <PublicServicesCatalog services={publishedServices} />
        )}
      </div>
    </main>
  );
}
