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
    })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.category), asc(services.name));

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <Link
          href="/services/orders"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a órdenes
        </Link>

        <h1 className="text-3xl font-bold">Nueva orden de servicio</h1>

        <p className="text-muted-foreground">
          Registra los datos del cliente, las especificaciones y las condiciones
          de entrega del trabajo.
        </p>
      </header>

      {availableServices.length === 0 ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <p className="font-medium">No hay servicios activos disponibles.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Activa al menos un servicio en el catálogo antes de registrar una
            orden.
          </p>
          <Link
            href="/services"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
          >
            Ir al catálogo
          </Link>
        </section>
      ) : (
        <OrderForm services={availableServices} />
      )}
    </main>
  );
}
