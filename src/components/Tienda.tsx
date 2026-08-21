"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { X, CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { precio, type Catalogo, type Producto } from "@/lib/catalog";
import { AddToCart } from "./cart/AddToCart";

function Ficha({
  producto,
  siguiendoStock,
  onCerrar,
}: {
  producto: Producto;
  siguiendoStock: boolean;
  onCerrar: () => void;
}) {
  const [i, setI] = useState(0);
  const fotos = producto.images;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-tinta/50" onClick={onCerrar} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={producto.name}
        className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-foto bg-papel sm:max-h-[86dvh] sm:rounded-foto"
      >
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 rounded-pill bg-papel/90 p-2 text-tinta-media backdrop-blur transition-colors hover:text-tinta"
        >
          <X size={19} weight="bold" />
        </button>

        <div className="grid overflow-y-auto sm:grid-cols-2">
          <div className="relative aspect-square border border-linea bg-papel">
            {fotos[i] && (
              <Image
                src={fotos[i]}
                alt={producto.name}
                fill
                sizes="(max-width: 640px) 100vw, 384px"
                className="object-contain p-4"
              />
            )}
            {fotos.length > 1 && (
              <>
                <button
                  onClick={() => setI((v) => (v - 1 + fotos.length) % fotos.length)}
                  aria-label="Foto anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-pill bg-papel/85 p-2 backdrop-blur transition-colors hover:bg-papel"
                >
                  <CaretLeft size={16} weight="bold" />
                </button>
                <button
                  onClick={() => setI((v) => (v + 1) % fotos.length)}
                  aria-label="Foto siguiente"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-pill bg-papel/85 p-2 backdrop-blur transition-colors hover:bg-papel"
                >
                  <CaretRight size={16} weight="bold" />
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col gap-4 p-6">
            <div>
              {producto.subtype && (
                <p className="mb-1.5 text-xs font-medium text-verde">
                  {producto.subtype.name}
                </p>
              )}
              <h3 className="text-2xl font-semibold leading-tight tracking-tight">
                {producto.name}
              </h3>
            </div>
            {producto.description && (
              <p className="type-body text-sm leading-relaxed text-tinta-media">
                {producto.description}
              </p>
            )}
            <div className="mt-auto flex items-center justify-between gap-4 pt-2">
              <div>
                {producto.discount && (
                  <span className="mr-2 text-sm text-tinta-media line-through">
                    {precio(producto.price)}
                  </span>
                )}
                <span className="text-2xl font-semibold tabular-nums tracking-tight">
                  {precio(producto.price_final)}
                </span>
              </div>
              <AddToCart producto={producto} siguiendoStock={siguiendoStock} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tarjeta({
  producto,
  siguiendoStock,
  onAbrir,
}: {
  producto: Producto;
  siguiendoStock: boolean;
  onAbrir: () => void;
}) {
  return (
    <article className="reveal group flex flex-col">
      <button
        onClick={onAbrir}
        aria-label={`Ver ${producto.name}`}
        className="relative aspect-square w-full overflow-hidden rounded-foto border border-linea bg-papel"
      >
        {producto.images[0] && (
          <Image
            src={producto.images[0]}
            alt={producto.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        {producto.discount && (
          <span className="absolute left-2 top-2 rounded-pill bg-verde px-2 py-1 text-[11px] font-bold text-papel">
            {producto.discount.percentage}% off
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col pt-3">
        {producto.subtype && (
          <p className="text-xs text-tinta-media">{producto.subtype.name}</p>
        )}
        <h3 className="mt-0.5 text-sm font-medium leading-snug">
          <button onClick={onAbrir} className="text-left hover:underline">
            {producto.name}
          </button>
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="font-semibold tabular-nums tracking-tight">
            {precio(producto.price_final)}
          </span>
          <AddToCart producto={producto} siguiendoStock={siguiendoStock} />
        </div>
      </div>
    </article>
  );
}

export function Tienda({ catalogo }: { catalogo: Catalogo }) {
  const [filtro, setFiltro] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<Producto | null>(null);

  const visibles = useMemo(
    () =>
      filtro
        ? catalogo.productos.filter((p) => p.category?.slug === filtro)
        : catalogo.productos,
    [catalogo.productos, filtro],
  );

  return (
    <section id="tienda" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="reveal">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-tinta-suave">
            Colección
          </p>
          <h2 className="type-display text-[clamp(2.5rem,6vw,4.5rem)]">La tienda</h2>
          <p className="type-body mt-5 text-tinta-suave">
            {catalogo.productos.length} productos · precios en pesos uruguayos
          </p>
        </div>

        {catalogo.caido ? (
          <div className="mt-10 rounded-pill border border-linea bg-humo px-6 py-14 text-center">
            <p className="type-body text-tinta-media">
              No pudimos cargar el catálogo en este momento. Escribinos por
              WhatsApp y te contamos qué hay disponible.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap gap-2">
              <button
                onClick={() => setFiltro(null)}
                aria-pressed={filtro === null}
                className={`rounded-pill border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  filtro === null
                    ? "border-tinta bg-tinta text-papel"
                    : "border-linea text-tinta-media hover:border-tinta hover:text-tinta"
                }`}
              >
                Todo{" "}
                <span className="tabular-nums opacity-70">
                  {catalogo.productos.length}
                </span>
              </button>
              {catalogo.categorias.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setFiltro(c.slug)}
                  aria-pressed={filtro === c.slug}
                  className={`rounded-pill border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    filtro === c.slug
                      ? "border-tinta bg-tinta text-papel"
                      : "border-linea text-tinta-media hover:border-tinta hover:text-tinta"
                  }`}
                >
                  {c.name}{" "}
                  <span className="tabular-nums opacity-70">{c.cantidad}</span>
                </button>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {visibles.map((p) => (
                <Tarjeta
                  key={p.sku}
                  producto={p}
                  siguiendoStock={catalogo.siguiendoStock}
                  onAbrir={() => setAbierto(p)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {abierto && (
        <Ficha
          producto={abierto}
          siguiendoStock={catalogo.siguiendoStock}
          onCerrar={() => setAbierto(null)}
        />
      )}
    </section>
  );
}
