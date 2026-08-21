"use client";

import Image from "next/image";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { precio, type Producto } from "@/lib/catalog";

/** ESCALONADO. Grilla tipo Pinterest o Etsy: columnas independientes, cada
 *  pieza con el alto que le pide su foto. Al no forzar todo a un cuadrado, el
 *  aire sobrante desaparece solo.
 *
 *  Cada tantas piezas se cuela una foto de marca a lo alto de la columna. Rompe
 *  la pared de producto sobre blanco y es contenido que ya existe, no relleno. */
const FOTOS_MARCA = ["01", "02", "03", "04", "05", "06"];

/** Alturas que se repiten en ciclo. La foto de producto se ve entera igual
 *  porque va contenida; lo que cambia es cuanto respira cada una. */
const ALTOS = ["h-[210px]", "h-[300px]", "h-[250px]", "h-[340px]", "h-[230px]"];

export function Escalonado({ productos }: { productos: Producto[] }) {
  return (
    <div className="columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3">
      {productos.map((p, i) => (
        <div key={p.sku} className="break-inside-avoid">
          {/* Cada 7 productos entra una foto de la marca. */}
          {i > 0 && i % 7 === 0 && (
            <div className="mb-3 overflow-hidden rounded-foto">
              <Image
                src={`/strip/${FOTOS_MARCA[(i / 7) % FOTOS_MARCA.length]}.jpg`}
                alt=""
                width={600}
                height={800}
                className="h-auto w-full object-cover"
              />
            </div>
          )}

          <article className="group">
            <div
              className={`relative overflow-hidden rounded-foto border border-linea bg-papel ${ALTOS[i % ALTOS.length]}`}
            >
              {p.images[0] && (
                <Image
                  src={p.images[0]}
                  alt={p.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.05]"
                />
              )}
            </div>
            <div className="mt-2.5 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[13px] font-medium leading-snug">{p.name}</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums">
                  {precio(p.price_final)}
                </p>
              </div>
              <button
                aria-label={`Agregar ${p.name}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border border-linea transition-colors hover:border-tinta hover:bg-tinta hover:text-papel"
              >
                <Plus size={12} weight="bold" />
              </button>
            </div>
          </article>
        </div>
      ))}
    </div>
  );
}
