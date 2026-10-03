import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/db/db";
import { requireUser } from "@/lib/auth/authorization";
import { AddClientForm } from "./add-client-form";
import ClientsSearch from "./clients-search";

type ListPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ListPage({ params }: ListPageProps) {
  await requireUser();

  const { id } = await params;

  const list = await db.query.lists.findFirst({
    where: (lists, { eq }) => eq(lists.id, id),
    with: {
      creator: true,
      clients: {
        with: {
          client: true,
        },
      },
    },
  });

  if (!list) {
    notFound();
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link
          href="/lists"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          ← Volver a listas
        </Link>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div>
              <p className="text-sm font-medium text-white/60">
                Lista de clientes
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
                {list.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
                <span>
                  Creada por{" "}
                  <span className="font-medium text-white">
                    {list.creator.name}
                  </span>
                </span>

                <span className="hidden text-white/30 sm:inline">•</span>

                <span>
                  {new Intl.DateTimeFormat("es-MX", {
                    dateStyle: "medium",
                  }).format(list.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <AddClientForm listId={list.id} />
        </div>
      </div>

      {list.clients.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#FFD400] text-2xl">
            👤
          </div>

          <h2 className="font-semibold text-gray-900">
            No hay clientes en esta lista
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Agrega el primer cliente para comenzar.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <ClientsSearch clients={list.clients} />
        </div>
      )}
    </div>
  );
}
