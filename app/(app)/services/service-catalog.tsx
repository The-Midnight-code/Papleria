"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ServiceStatusButton } from "./service-status-button";

type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  imageMimeType: string | null;
  price: string | null;
  requiresQuote: boolean;
  estimatedDays: number | null;
  published: boolean;
  active: boolean;
  createdAt: Date;
};

type Props = {
  services: Service[];
};

const sortOptions = [
  { value: "newest", label: "Más recientes" },
  { value: "name", label: "Nombre A–Z" },
  { value: "price-asc", label: "Precio: menor a mayor" },
  { value: "price-desc", label: "Precio: mayor a menor" },
] as const;

const filters = [
  { value: "all", label: "Todos los servicios" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
  { value: "published", label: "Publicados" },
  { value: "unpublished", label: "No publicados" },
] as const;

export function ServiceCatalog({ services }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>("newest");

  const visibleServices = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es-MX");

    const filtered = services.filter((service) => {
      const matchesQuery =
        !normalizedQuery ||
        [service.name, service.category, service.description ?? ""].some((value) =>
          value.toLocaleLowerCase("es-MX").includes(normalizedQuery),
        );

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && service.active) ||
        (filter === "inactive" && !service.active) ||
        (filter === "published" && service.published) ||
        (filter === "unpublished" && !service.published);

      return matchesQuery && matchesFilter;
    });

    return filtered.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "es-MX");
      if (sort === "price-asc" || sort === "price-desc") {
        const priceA = a.requiresQuote || a.price == null ? Number.POSITIVE_INFINITY : Number(a.price);
        const priceB = b.requiresQuote || b.price == null ? Number.POSITIVE_INFINITY : Number(b.price);
        return sort === "price-asc" ? priceA - priceB : priceB - priceA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [services, query, filter, sort]);

  return (
    <div className="space-y-4">
      {services.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px_220px]">
          <div className="relative">
            <label htmlFor="service-search" className="sr-only">
              Buscar servicios
            </label>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400"
            >
              ⌕
            </span>
            <input
              id="service-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, categoría..."
              className="min-h-11 w-full rounded-xl border border-white/70 bg-white px-10 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10"
            />
          </div>

          <div>
            <label htmlFor="service-filter" className="sr-only">
              Filtrar servicios
            </label>
            <select
              id="service-filter"
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as (typeof filters)[number]["value"])
              }
              className="min-h-11 w-full rounded-xl border border-white/70 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10"
            >
              {filters.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="service-sort" className="sr-only">
              Ordenar servicios
            </label>
            <select
              id="service-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as (typeof sortOptions)[number]["value"])}
              className="min-h-11 w-full rounded-xl border border-white/70 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#176B7A] focus:ring-4 focus:ring-[#176B7A]/10"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#FFD400]/25 text-2xl" aria-hidden="true">
            ✦
          </div>
          <h3 className="mt-4 font-bold text-gray-900">Todavía no hay servicios</h3>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-500">
            Registra el primer servicio para comenzar a organizar tu catálogo.
          </p>
          <Link
            href="/services/new"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#176B7A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#125663] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B7A]"
          >
            Crear primer servicio
          </Link>
        </div>
      ) : visibleServices.length === 0 ? (
        <div className="rounded-2xl border border-white/70 bg-white p-8 text-center shadow-sm">
          <h3 className="font-semibold text-gray-900">No encontramos servicios</h3>
          <p className="mt-1 text-sm text-gray-500">
            Prueba con otro término o cambia el filtro seleccionado.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("all");
              setSort("newest");
            }}
            className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold text-[#176B7A] transition hover:bg-[#176B7A]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B7A]"
          >
            Limpiar búsqueda y filtros
          </button>
        </div>
      ) : (
        <>
          <p aria-live="polite" className="text-sm text-white/75">
            Mostrando {visibleServices.length} de {services.length}{" "}
            {services.length === 1 ? "servicio" : "servicios"}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {visibleServices.map((service) => (
              <article
                key={service.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-lg"
              >
                {service.imageMimeType && (
                  <div className="relative aspect-[16/7] w-full overflow-hidden bg-gray-50">
                    <Image
                      src={"/api/services/" + service.id + "/image"}
                      alt={service.name}
                      width={900}
                      height={400}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#176B7A]">
                        {service.category}
                      </p>
                      <h3 className="mt-1 break-words text-lg font-bold leading-snug text-gray-900">
                        {service.name}
                      </h3>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          service.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${service.active ? "bg-emerald-500" : "bg-gray-400"}`} aria-hidden="true" />
                        {service.active ? "Activo" : "Inactivo"}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          service.published
                            ? "bg-sky-50 text-sky-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {service.published ? "Publicado" : "No publicado"}
                      </span>
                    </div>
                  </div>

                  {service.description && (
                    <p className="line-clamp-2 text-sm leading-6 text-gray-600">
                      {service.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {service.requiresQuote ? "Costo" : "Precio del servicio"}
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-gray-900">
                        {service.requiresQuote
                          ? "Por cotización"
                          : `${Number(service.price).toFixed(2)} MXN`}
                      </p>
                    </div>
                    {service.estimatedDays && (
                      <div className="text-right">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Tiempo estimado
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-800">
                          {service.estimatedDays} {service.estimatedDays === 1 ? "día" : "días"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <ServiceStatusButton
                      serviceId={service.id}
                      active={service.active}
                    />
                    <Link
                      href={`/services/${service.id}/edit`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-[#176B7A]/40 hover:bg-[#176B7A]/5 hover:text-[#125663] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B7A]"
                    >
                      Editar servicio <span aria-hidden="true" className="ml-2">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
