"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

type PublicService = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  imageMimeType: string | null;
  price: string | number | null;
  requiresQuote: boolean;
  estimatedDays: number | null;
};

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function ServiceImage({
  service,
  compact = false,
}: {
  service: PublicService;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-white to-amber-50 ${compact ? "h-32 w-32 shrink-0 rounded-xl p-2" : "h-48 w-full p-4"}`}
    >
      {service.imageMimeType ? (
        <Image
          src={`/api/services/${service.id}/image`}
          alt={service.name}
          width={800}
          height={450}
          unoptimized
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white bg-white/90 text-[#176B7A] shadow-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-9 w-9"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3.75h7.5l4 4v12.5H6.75a1.5 1.5 0 0 1-1.5-1.5v-13.5a1.5 1.5 0 0 1 1.5-1.5Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.25 3.75v4h4M8.5 12h7M8.5 15.5h7"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

function Price({ service }: { service: PublicService }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {service.requiresQuote ? "Precio" : "Precio desde"}
      </p>
      <p className="mt-1 font-extrabold text-[#123D46]">
        {service.requiresQuote
          ? "Sujeto a cotización"
          : currency.format(Number(service.price ?? 0))}
      </p>
    </div>
  );
}

export default function PublicServicesCatalog({
  services,
}: {
  services: PublicService[];
}) {
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: true, slidesToScroll: 1 });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setSnapCount(emblaApi.scrollSnapList().length);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setSnapCount(emblaApi.scrollSnapList().length);
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (isCarouselPaused || !emblaApi || services.length < 2) return;
    const interval = window.setInterval(() => emblaApi.scrollNext(), 5000);
    return () => window.clearInterval(interval);
  }, [emblaApi, isCarouselPaused, services.length]);

  return (
    <div className="space-y-14 sm:space-y-16">
      <section
        aria-labelledby="featured-services-title"
        onMouseEnter={() => setIsCarouselPaused(true)}
        onMouseLeave={() => setIsCarouselPaused(false)}
        onFocusCapture={() => setIsCarouselPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsCarouselPaused(false);
          }
        }}
      >
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#FFD400]">
              Lo más solicitado
            </p>
            <h2
              id="featured-services-title"
              className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              Servicios destacados
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Descubre algunas de las opciones de nuestro catálogo.
            </p>
          </div>
          {services.length > 1 && (
            <div className="hidden shrink-0 gap-2 sm:flex">
              <button
                type="button"
                aria-label="Ver servicios anteriores"
                onClick={() => emblaApi?.scrollPrev()}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-sm backdrop-blur transition hover:border-[#FFD400] hover:bg-white/20 hover:text-[#FFD400] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Ver siguientes servicios"
                onClick={() => emblaApi?.scrollNext()}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[#176B7A] hover:text-[#176B7A] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="-ml-4 flex touch-pan-y">
            {services.map((service) => (
              <div key={service.id} className="min-w-0 flex-[0_0_100%] pl-4 sm:flex-[0_0_50%] lg:flex-[0_0_25%]">
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                  <ServiceImage service={service} />
                  <div className="flex flex-1 flex-col p-4">
                    <p className="w-fit rounded-full bg-[#E8F4F3] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#176B7A]">{service.category}</p>
                    <h3 className="mt-3 text-base font-bold leading-snug text-slate-900">{service.name}</h3>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{service.description || "Consulta los detalles de este servicio en la papelería."}</p>
                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                      <Price service={service} />
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[#123D46]" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>

        {snapCount > 1 && (
          <div className="mt-5 flex items-center justify-center gap-2">
            {Array.from({ length: snapCount }).map((_, index) => (
              <button key={index} type="button" aria-label={"Mostrar selección " + (index + 1) + " de servicios"} aria-current={selectedIndex === index ? "true" : undefined} onClick={() => emblaApi?.scrollTo(index)} className={"h-2.5 rounded-full transition-all " + (selectedIndex === index ? "w-7 bg-[#FFD400]" : "w-2.5 bg-white/50 hover:bg-white/80")} />
            ))}
          </div>
        )}
        {services.length > 1 && (
          <div className="mt-4 flex justify-center gap-3 sm:hidden">
            <button type="button" onClick={() => emblaApi?.scrollPrev()} className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">Anterior</button>
            <button type="button" onClick={() => emblaApi?.scrollNext()} className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">Siguiente</button>
          </div>
        )}
      </section>

      <section aria-labelledby="all-services-title">
        <div className="mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176B7A]">
              Explora el catálogo completo
            </p>
            <h2
              id="all-services-title"
              className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
            >
              Todos nuestros servicios
            </h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.id}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#176B7A]/30 hover:shadow-md sm:p-5"
            >
              <ServiceImage service={service} compact />
              <div className="flex min-w-0 flex-1 flex-col items-start">
                <p className="rounded-full bg-[#E8F4F3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#176B7A]">
                  {service.category}
                </p>
                <h3 className="mt-2 text-sm font-bold leading-snug text-slate-900">
                  {service.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                  {service.description ||
                    "Consulta los detalles de este servicio en la papelería."}
                </p>
                <div className="mt-auto pt-3">
                  <Price service={service} />
                  {service.estimatedDays && (
                    <p className="mt-1 text-xs text-slate-500">
                      Tiempo estimado: {service.estimatedDays}{" "}
                      {service.estimatedDays === 1 ? "día" : "días"}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
