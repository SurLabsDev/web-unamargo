"use client";

import Image from "next/image";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { precio, type Producto } from "@/lib/catalog";

/** EL MOSAICO. La grilla de la demo del cliente llevada al extremo: 1px de
 *  separacion, fotos a sangre y tamaños mezclados para que no sea un muro de
 *  tarjetas iguales.
 *
 *  El patron de tamaños se repite cada 7 piezas: da ritmo sin que haya que
 *  decidir a mano el tamaño de cada producto, y aguanta que el catalogo crezca. */
const PATRON = [
  "col-span-2 row-span-2", // pieza grande
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-2", // alta
  "col-span-1 row-span-1",
  "col-span-2 row-span-1", // ancha
  "col-span-1 row-span-1",
];

export function Mosaico({ productos }: { productos: Producto[] }) {
  return (
    <div className="grid auto-rows-[minmax(150px,auto)] grid-cols-2 gap-px bg-linea md:grid-cols-4 lg:grid-cols-6">
      {productos.map((p, i) => {
        const span = PATRON[i % PATRON.length];
        const grande = span.startsWith("col-span-2");
        return (
          <article
            key={p.sku}
            className={`group relative flex flex-col bg-papel ${span}`}
          >
            <div className="relative flex-1 overflow-hidden">
              {p.images[0] && (
                <Image
                  src={p.images[0]}
                  alt={p.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.06]"
                />
              )}
              {/* El nombre y el precio viven encima y solo aparecen al pasar:
                  asi la grilla es puro producto y no una pared de texto. */}
              <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-papel via-papel/95 to-transparent p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <p className={`font-semibold leading-tight ${grande ? "text-base" : "text-[13px]"}`}>
                  {p.name}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold tabular-nums">
                    {precio(p.price_final)}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-pill bg-tinta text-papel">
                    <Plus size={12} weight="bold" />
                  </span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
