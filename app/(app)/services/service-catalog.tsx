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

  const visibleServices = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es-MX");

    return services.filter((service) => {
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
  }, [services, query, filter]);

  return (
    <div className="space-y-4">
      {services.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
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
                className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-white p-5 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#176B7A]">
                      {service.category}
                    </p>
                    <h3 className="mt-1 break-words text-lg font-bold text-gray-900">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                        {service.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      service.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {service.active ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {service.imageMimeType && (
                  <Image
                    src={`/api/services/${service.id}/image`}
                    alt={service.name}
                    width={600}
                    height={240}
                    className="max-h-44 w-full rounded-xl border border-gray-100 bg-gray-50 object-contain"
                  />
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-gray-50 px-4 py-3 text-sm">
                  <span className="font-semibold text-gray-900">
                    {service.requiresQuote
                      ? "Precio por cotización"
                      : `$${Number(service.price).toFixed(2)} MXN`}
                  </span>
                  {service.estimatedDays && (
                    <span className="text-gray-600">
                      Tiempo estimado: {service.estimatedDays} día(s)
                    </span>
                  )}
                </div>

                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-gray-100 pt-4">
                  <div className="space-y-2">
                    <span
                      className={`block text-sm font-medium ${
                        service.published ? "text-[#176B7A]" : "text-gray-500"
                      }`}
                    >
                      {service.published ? "Publicado" : "No publicado"}
                    </span>
                    <ServiceStatusButton
                      serviceId={service.id}
                      active={service.active}
                    />
                  </div>
                  <Link
                    href={`/services/${service.id}/edit`}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-[#176B7A]/40 hover:bg-[#176B7A]/5 hover:text-[#125663] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B7A]"
                  >
                    Editar servicio <span aria-hidden="true" className="ml-2">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
