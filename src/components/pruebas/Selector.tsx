"use client";

import { useState } from "react";
import type { Catalogo } from "@/lib/catalog";
import { Indice } from "./Indice";
import { Mosaico } from "./Mosaico";
import { Ronda } from "./Ronda";

const VARIANTES = [
  {
    id: "indice",
    nombre: "El índice",
    idea: "Sin tarjetas. El catálogo es tipografía y la foto aparece flotando al pasar el mouse. Cero espacio muerto porque no hay cajas de imagen hasta que las pedís.",
  },
  {
    id: "mosaico",
    nombre: "El mosaico",
    idea: "Tu grilla llevada al extremo: 1px de separación, fotos a sangre y tamaños mezclados. El nombre y el precio aparecen recién al pasar, así la pared es puro producto.",
  },
  {
    id: "ronda",
    nombre: "La ronda",
    idea: "El mate gira y vuelve. Arrastrás para girar y el de arriba es el elegido. Es la metáfora propia de la marca hecha navegación.",
  },
] as const;

export function Selector({ catalogo }: { catalogo: Catalogo }) {
  const [v, setV] = useState<string>("indice");
  const actual = VARIANTES.find((x) => x.id === v) ?? VARIANTES[0];

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-linea bg-papel/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 px-5 py-3 sm:px-8 lg:px-12">
          <span className="mr-2 text-xs uppercase tracking-[0.16em] text-tinta-suave">
            Probá
          </span>
          {VARIANTES.map((x) => (
            <button
              key={x.id}
              onClick={() => setV(x.id)}
              aria-pressed={v === x.id}
              className={`rounded-pill border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                v === x.id
                  ? "border-tinta bg-tinta text-papel"
                  : "border-linea text-tinta-media hover:border-tinta hover:text-tinta"
              }`}
            >
              {x.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12">
        <h1 className="type-display text-[clamp(2.5rem,6vw,4.5rem)]">
          {actual.nombre}
        </h1>
        <p className="type-body mt-4 max-w-[62ch] text-tinta-media">{actual.idea}</p>
      </div>

      <div className="mx-auto max-w-[1400px] px-5 pb-24 sm:px-8 lg:px-12">
        {v === "indice" && <Indice productos={catalogo.productos} />}
        {v === "mosaico" && <Mosaico productos={catalogo.productos} />}
        {v === "ronda" && <Ronda productos={catalogo.productos} />}
      </div>
    </>
  );
}
