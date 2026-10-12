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
    <main className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6">
      {" "}
      <header className="space-y-2">
        {" "}
        <h1 className="text-3xl font-bold">Nuestros servicios</h1>{" "}
        <p className="max-w-2xl text-muted-foreground">
          Conoce los servicios de nuestra papelería. Algunos trabajos requieren
          cotización según sus características.{" "}
        </p>{" "}
      </header>
      {publishedServices.length === 0 ? (
        <section className="rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">
            Estamos preparando nuestro catálogo
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Por el momento no hay servicios publicados. Vuelve pronto.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {publishedServices.map((service) => (
            <article
              key={service.id}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              {service.imageMimeType && (
                <Image
                  src={`/api/services/${service.id}/image`}
                  alt={service.name}
                  width={800}
                  height={450}
                  unoptimized
                  className="h-48 w-full object-contain"
                />
              )}

              <div className="space-y-3 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {service.category}
                </p>

                <h2 className="text-xl font-semibold">{service.name}</h2>

                {service.description && (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {service.description}
                  </p>
                )}

                <p className="font-semibold">
                  {service.requiresQuote
                    ? "Precio sujeto a cotización"
                    : `$${Number(service.price).toFixed(2)} MXN`}
                </p>

                {service.estimatedDays && (
                  <p className="text-sm text-muted-foreground">
                    Tiempo estimado: {service.estimatedDays} día(s)
                  </p>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
