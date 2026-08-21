"use client";

import { useState } from "react";
import type { Catalogo } from "@/lib/catalog";
import { Estantes } from "./Estantes";
import { Escalonado } from "./Escalonado";
import { ListaPrevia } from "./ListaPrevia";

const VARIANTES = [
  {
    id: "estantes",
    nombre: "Estantes",
    idea: "Una fila por rubro, que se recorre de costado. Es lo que usan Mercado Libre, Netflix y Apple: cualquiera que compre en Uruguay ya sabe usarlo y en el celular se pasa con el dedo. La pieza siguiente siempre asoma, que es lo que avisa que hay más.",
  },
  {
    id: "escalonado",
    nombre: "Escalonado",
    idea: "Columnas independientes, cada pieza con el alto que le pide su foto, como Pinterest o Etsy. Al no forzar todo a un cuadrado, el aire sobrante desaparece solo. Cada siete productos se cuela una foto de la marca.",
  },
  {
    id: "lista",
    nombre: "Lista con vista fija",
    idea: "La lista a la izquierda y la pieza elegida grande a la derecha, quieta. Se compara rápido sin perder de vista lo que estabas mirando. En el celular pasa a ser una lista con la ficha arriba.",
  },
] as const;

export function Selector({ catalogo }: { catalogo: Catalogo }) {
  const [v, setV] = useState<string>("estantes");
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
        {v === "estantes" && <Estantes productos={catalogo.productos} />}
        {v === "escalonado" && <Escalonado productos={catalogo.productos} />}
        {v === "lista" && <ListaPrevia productos={catalogo.productos} />}
      </div>
    </>
  );
}
