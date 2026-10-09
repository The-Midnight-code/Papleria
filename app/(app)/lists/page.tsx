import { requireUser } from "@/lib/auth/authorization";
import { db } from "@/db/db";
import { lists } from "@/db/schema";
import { desc } from "drizzle-orm";
import { CreateListForm } from "./create-list-form";
import ListsSearch from "./lists-search";

export default async function ListsPage() {
  const user = await requireUser();

  const userLists = await db.query.lists.findMany({
    with: {
      creator: true,
      clients: true,
    },
    orderBy: [desc(lists.createdAt)],
  });

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white/60">Gestión de listas</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
            Listas
          </h1>

          <p className="mt-2 text-sm text-white/70">
            Administra las listas y consulta su estado de pago y entrega.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden rounded-xl bg-white/10 px-4 py-2 text-center sm:block">
            <p className="text-2xl font-bold text-white">{userLists.length}</p>
            <p className="text-xs font-medium text-white/60">
              {userLists.length === 1 ? "lista" : "listas"}
            </p>
          </div>

          <CreateListForm />
        </div>
      </div>

      {userLists.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#FFD400] text-2xl">
            📋
          </div>

          <h2 className="font-semibold text-gray-900">No hay listas todavía</h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            Crea tu primera lista para comenzar a agregar y administrar
            personas.
          </p>

          <div className="mt-6">
            <CreateListForm />
          </div>
        </div>
      ) : (
        <ListsSearch lists={userLists} isAdmin={user.role === "ADMIN"} />
      )}
    </div>
  );
}
