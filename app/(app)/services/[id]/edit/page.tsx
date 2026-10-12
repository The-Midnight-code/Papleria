import Image from "next/image";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/db";
import { services } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";
import { ServiceForm } from "../../service-form";
import { ServiceImageForm } from "../../service-image-form";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [service] = await db
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
    })
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  if (!service) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <Link
          href="/services"
          className="text-sm text-white/75 transition hover:text-white"
        >
          ← Volver al catálogo
        </Link>
        <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Editar servicio
        </h1>
        <p className="text-sm text-white/75">
          Actualiza los datos, la imagen y la disponibilidad de “{service.name}”.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Información general</h2>
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
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Imagen del servicio</h2>
        <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm sm:p-5">
          {service.imageMimeType ? (
            <Image
              src={`/api/services/${service.id}/image`}
              alt={service.name}
              width={600}
              height={400}
              className="mb-4 max-h-64 w-full rounded-xl border border-gray-100 bg-gray-50 object-contain"
            />
          ) : (
            <p className="mb-4 rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              Este servicio todavía no tiene imagen.
            </p>
          )}
          <ServiceImageForm
            serviceId={service.id}
            serviceName={service.name}
          />
        </div>
      </section>
    </main>
  );
}
