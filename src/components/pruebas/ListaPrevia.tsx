"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { precio, type Producto } from "@/lib/catalog";

/** LISTA CON VISTA FIJA. La lista se recorre a la izquierda y la pieza elegida
 *  se ve grande a la derecha, quieta. Es el patron de Mercado Libre en
 *  escritorio y de casi cualquier catalogo con fichas largas: se compara rapido
 *  sin perder de vista lo que estabas mirando.
 *
 *  En el celular no hay lugar para dos columnas, asi que la vista previa pasa a
 *  ser la ficha del que tocaste, arriba de la lista. */
export function ListaPrevia({ productos }: { productos: Producto[] }) {
  const [sel, setSel] = useState(0);
  const p = productos[sel];

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-2">
        <ul>
          {productos.map((prod, i) => (
            <li key={prod.sku}>
              <button
                onClick={() => setSel(i)}
                onMouseEnter={() => setSel(i)}
                aria-current={i === sel}
                className={`flex w-full items-center gap-3 border-b border-linea py-3 text-left transition-colors ${
                  i === sel ? "bg-humo" : "hover:bg-humo/60"
                }`}
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-foto border border-linea bg-papel">
                  {prod.images[0] && (
                    <Image
                      src={prod.images[0]}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-contain p-1"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{prod.name}</p>
                  {prod.subtype && (
                    <p className="truncate text-xs text-tinta-suave">
                      {prod.subtype.name}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {precio(prod.price_final)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {p && (
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-24">
            <div className="relative aspect-[4/3] overflow-hidden rounded-foto border border-linea bg-papel">
              {p.images[0] && (
                <Image
                  key={p.sku}
                  src={p.images[0]}
                  alt={p.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-contain p-8"
                />
              )}
            </div>
            <div className="mt-5 flex items-start justify-between gap-6">
              <div>
                {p.subtype && (
                  <p className="text-[11px] uppercase tracking-[0.16em] text-tinta-suave">
                    {p.subtype.name}
                  </p>
                )}
                <h3 className="type-display mt-1.5 text-[clamp(1.5rem,3vw,2.25rem)]">
                  {p.name}
                </h3>
              </div>
              <p className="type-display shrink-0 text-2xl sm:text-3xl">
                {precio(p.price_final)}
              </p>
            </div>
            {p.description && (
              <p className="type-body mt-4 max-w-[62ch] text-sm leading-relaxed text-tinta-media">
                {p.description}
              </p>
            )}
            <button className="mt-6 inline-flex items-center gap-2 rounded-pill bg-tinta px-6 py-3 text-sm font-semibold text-papel transition-transform duration-300 hover:scale-[1.03]">
              <Plus size={14} weight="bold" />
              Agregar al pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
