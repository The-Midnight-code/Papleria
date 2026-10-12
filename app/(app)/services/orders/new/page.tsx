import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db/db";
import { services } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";

import { OrderForm } from "../../order-form";

export default async function NewServiceOrderPage() {
  await requireEmployeeOrAdmin();

  const availableServices = await db
    .select({
      id: services.id,
      name: services.name,
      category: services.category,
      price: services.price,
      requiresQuote: services.requiresQuote,
      imageMimeType: services.imageMimeType,
    })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.category), asc(services.name));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <Link
          href="/services/orders"
          className="inline-flex text-sm font-semibold text-white/75 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          ← Volver a órdenes
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Nueva orden de servicio</h1>

        <p className="max-w-2xl text-sm leading-6 text-white/75">
          Registra los datos del cliente, las especificaciones y las condiciones
          de entrega del trabajo.
        </p>
      </header>

      {availableServices.length === 0 ? (
        <section className="rounded-2xl border border-white/70 bg-white p-5 shadow-md sm:p-6">
          <p className="font-medium">No hay servicios activos disponibles.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Activa al menos un servicio en el catálogo antes de registrar una
            orden.
          </p>
          <Link
            href="/services"
            className="mt-4 inline-flex rounded-xl bg-[#FFD400] px-4 py-2.5 font-bold text-gray-900 shadow-sm transition hover:bg-[#f2ca00]"
          >
            Ir al catálogo
          </Link>
        </section>
      ) : (
        <OrderForm services={availableServices.map(({ imageMimeType, ...service }) => ({ ...service, imageUrl: imageMimeType ? `/api/services/${service.id}/image` : null }))} />
      )}
    </main>
  );
}
