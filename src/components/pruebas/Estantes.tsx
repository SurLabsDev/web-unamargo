"use client";

import { useRef } from "react";
import Image from "next/image";
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react/dist/ssr";
import { precio, type Producto } from "@/lib/catalog";

/** ESTANTES. Una fila por rubro, que se recorre de costado. Es el patron de
 *  Mercado Libre, Netflix y Apple: cualquiera que compre en Uruguay ya sabe
 *  usarlo, y en el celular se pasa con el dedo sin aprender nada.
 *
 *  No es un carrusel de portada -esos rinden mal y por eso cayeron de 52% a 32%
 *  de los sitios grandes-: aca no rota solo ni esconde nada, es una estanteria
 *  que se empuja. La proxima pieza siempre asoma, que es lo que avisa que hay
 *  mas para el costado. */
function Estante({ titulo, items }: { titulo: string; items: Producto[] }) {
  const pista = useRef<HTMLDivElement>(null);

  function correr(dir: 1 | -1) {
    const el = pista.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section className="mb-14 last:mb-0">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h3 className="type-display text-[clamp(1.6rem,3.5vw,2.5rem)]">
          {titulo}
          <span className="ml-3 align-middle text-sm font-normal text-tinta-suave">
            {items.length}
          </span>
        </h3>
        <div className="hidden gap-2 md:flex">
          <button
            onClick={() => correr(-1)}
            aria-label={`Ver ${titulo} anteriores`}
            className="flex h-9 w-9 items-center justify-center rounded-pill border border-linea transition-colors hover:border-tinta"
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <button
            onClick={() => correr(1)}
            aria-label={`Ver más ${titulo}`}
            className="flex h-9 w-9 items-center justify-center rounded-pill border border-linea transition-colors hover:border-tinta"
          >
            <CaretRight size={14} weight="bold" />
          </button>
        </div>
      </div>

      <div
        ref={pista}
        className="sin-barra flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1"
      >
        {items.map((p) => (
          <article
            key={p.sku}
            className="group w-[64vw] shrink-0 snap-start sm:w-[38vw] lg:w-[22vw] xl:w-[19vw]"
          >
            <div className="relative aspect-square overflow-hidden rounded-foto border border-linea bg-papel">
              {p.images[0] && (
                <Image
                  src={p.images[0]}
                  alt={p.name}
                  fill
                  sizes="(max-width: 640px) 64vw, (max-width: 1024px) 38vw, 20vw"
                  className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.05]"
                />
              )}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums">
                  {precio(p.price_final)}
                </p>
              </div>
              <button
                aria-label={`Agregar ${p.name}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border border-linea transition-colors hover:border-tinta hover:bg-tinta hover:text-papel"
              >
                <Plus size={13} weight="bold" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Estantes({ productos }: { productos: Producto[] }) {
  const porRubro = new Map<string, Producto[]>();
  for (const p of productos) {
    const c = p.category?.name ?? "Otros";
    porRubro.set(c, [...(porRubro.get(c) ?? []), p]);
  }
  return (
    <>
      {[...porRubro.entries()].map(([rubro, items]) => (
        <Estante key={rubro} titulo={rubro} items={items} />
      ))}
    </>
  );
}
