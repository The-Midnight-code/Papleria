"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DeleteListButton } from "./delete-list-button";

type ListItem = {
  id: string;
  name: string;
  createdAt: Date;
  creator: {
    name: string;
  };
  clients: {
    id: string;
  }[];
};

type ListsSearchProps = {
  lists: ListItem[];
  isAdmin: boolean;
};

export default function ListsSearch({ lists, isAdmin }: ListsSearchProps) {
  const [search, setSearch] = useState("");

  const filteredLists = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return lists;
    }

    return lists.filter((list) => {
      return (
        list.name.toLowerCase().includes(normalizedSearch) ||
        list.creator.name.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [lists, search]);

  return (
    <>
      <div className="mb-6 rounded-2xl bg-white p-4 shadow-lg">
        <div className="relative">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar lista o creador..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:bg-white focus:ring-2 focus:ring-[#176B7A]/20"
          />

          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔎
          </span>
        </div>
      </div>

      {filteredLists.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-lg">
          <p className="font-medium text-gray-900">No se encontraron listas</p>

          <p className="mt-1 text-sm text-gray-500">
            Intenta con otro término de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredLists.map((list) => (
            <div
              key={list.id}
              className="group overflow-hidden rounded-2xl bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Link href={`/lists/${list.id}`} className="block p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#176B7A]">
                      Lista
                    </p>

                    <h2 className="mt-2 truncate text-lg font-bold text-gray-900">
                      {list.name}
                    </h2>
                  </div>

                  <span className="shrink-0 rounded-xl bg-[#53B0C9]/20 px-3 py-2 text-center">
                    <span className="block text-lg font-bold leading-none text-[#176B7A]">
                      {list.clients.length}
                    </span>

                    <span className="mt-1 block text-[11px] font-medium text-[#176B7A]/70">
                      {list.clients.length === 1 ? "persona" : "personas"}
                    </span>
                  </span>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 text-sm">
                      <p className="truncate text-gray-500">
                        Creada por{" "}
                        <span className="font-medium text-gray-700">
                          {list.creator.name}
                        </span>
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {new Intl.DateTimeFormat("es-MX", {
                          dateStyle: "medium",
                        }).format(list.createdAt)}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-semibold text-[#176B7A] opacity-70 transition group-hover:translate-x-1 group-hover:opacity-100">
                      Ver lista →
                    </span>
                  </div>
                </div>
              </Link>

              {isAdmin && (
                <div className="border-t border-gray-100 px-6 py-3">
                  <DeleteListButton listId={list.id} listName={list.name} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
