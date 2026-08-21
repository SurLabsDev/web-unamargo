"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { precio, type Producto } from "@/lib/catalog";

/** EL ÍNDICE. No hay tarjetas: el catalogo es tipografia. La foto aparece
 *  flotando y sigue al cursor, asi que no ocupa lugar hasta que la pedis.
 *
 *  La posicion se escribe directo sobre el nodo con un ref. Meterla en el
 *  estado de React re-renderizaria las 34 filas en cada movimiento del mouse. */
export function Indice({ productos }: { productos: Producto[] }) {
  const [activo, setActivo] = useState<Producto | null>(null);
  const flotanteRef = useRef<HTMLDivElement>(null);

  function mover(e: React.MouseEvent) {
    const el = flotanteRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${e.clientX + 24}px, ${e.clientY - 130}px, 0)`;
  }

  // Se agrupan por categoria: el rubro es el unico orden que le sirve a alguien
  // que esta mirando una lista larga de nombres.
  const porCategoria = new Map<string, Producto[]>();
  for (const p of productos) {
    const c = p.category?.name ?? "Otros";
    porCategoria.set(c, [...(porCategoria.get(c) ?? []), p]);
  }

  return (
    <div onMouseMove={mover} onMouseLeave={() => setActivo(null)}>
      {[...porCategoria.entries()].map(([categoria, items]) => (
        <section key={categoria} className="mb-14 last:mb-0">
          <div className="flex items-baseline gap-4 border-b-2 border-tinta pb-2">
            <h3 className="type-display text-2xl uppercase">{categoria}</h3>
            <span className="text-sm text-tinta-suave">{items.length}</span>
          </div>

          <ul>
            {items.map((p) => (
              <li key={p.sku}>
                <button
                  onMouseEnter={() => setActivo(p)}
                  onFocus={() => setActivo(p)}
                  className="group flex w-full items-baseline gap-4 border-b border-linea py-4 text-left outline-none transition-[padding] duration-300 hover:pl-4 focus-visible:pl-4"
                >
                  <span className="type-display flex-1 text-[clamp(1.35rem,3.2vw,2.4rem)] transition-opacity duration-200 group-hover:opacity-100 sm:opacity-70">
                    {p.name}
                  </span>
                  {p.subtype && (
                    <span className="hidden shrink-0 text-xs text-tinta-suave md:block">
                      {p.subtype.name}
                    </span>
                  )}
                  <span className="shrink-0 text-lg font-semibold tabular-nums">
                    {precio(p.price_final)}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border border-linea transition-colors duration-200 group-hover:border-tinta group-hover:bg-tinta group-hover:text-papel">
                    <Plus size={13} weight="bold" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* La foto flotante. `fixed` + transform: no reflowea nada al moverse. */}
      <div
        ref={flotanteRef}
        aria-hidden
        className={`pointer-events-none fixed left-0 top-0 z-30 hidden h-[260px] w-[260px] overflow-hidden rounded-foto bg-papel transition-opacity duration-200 lg:block ${
          activo ? "opacity-100" : "opacity-0"
        }`}
      >
        {activo?.images[0] && (
          <Image
            src={activo.images[0]}
            alt=""
            fill
            sizes="260px"
            className="object-contain p-3"
          />
        )}
      </div>
    </div>
  );
}
