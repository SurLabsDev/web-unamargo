"use client";

import { useId } from "react";
import type { Catalogo, Producto } from "@/lib/catalog";

/** Un chip de la barra y la regla que decide que productos deja ver. */
export type Filtro = {
  clave: string;
  nombre: string;
  cumple: (p: Producto) => boolean;
};

/** Los filtros que tienen sentido con ESTE catalogo, y ninguno mas.
 *
 *  Un chip que no trae nada no se dibuja: "Con descuento" sin ningun descuento
 *  cargado es una promesa vacia, y lo mismo un material que no tiene ningun
 *  producto. Asi ningun filtro puede dar cero resultados, y la tienda no
 *  necesita un "no encontramos nada".
 *
 *  Es lo que hace que la barra se adapte sola al ERP que conteste: el de
 *  produccion todavia no manda `trait` ni `featured`, y ahi solo aparece lo que
 *  se pueda armar con lo que llega. */
export function filtrosDe(catalogo: Catalogo): { generales: Filtro[]; rasgos: Filtro[] } {
  const generales: Filtro[] = [];
  if (catalogo.productos.some((p) => p.featured === true)) {
    generales.push({
      clave: "mas-vendidos",
      nombre: "Más vendidos",
      cumple: (p) => p.featured === true,
    });
  }
  if (catalogo.productos.some((p) => p.discount)) {
    generales.push({
      clave: "con-descuento",
      nombre: "Con descuento",
      cumple: (p) => Boolean(p.discount),
    });
  }

  const rasgos = catalogo.rasgos.map(
    (r): Filtro => ({
      clave: `rasgo:${r.slug}`,
      nombre: r.name,
      cumple: (p) => p.trait?.slug === r.slug,
    }),
  );

  return { generales, rasgos };
}

function Chip({
  nombre,
  activo,
  onClick,
}: {
  nombre: string;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      /* Con el teclado, el chip enfocado se trae a la vista. Chrome no lo hace
         solo cuando el chip asoma apenas por el borde del renglon corrido:
         medido a 390px, el foco quedaba en "Madera" con 67 de sus 75px
         escondidos, y Safari en cambio si lo corria. Solo con `:focus-visible`
         para no mover el renglon cuando el chip se toca con el dedo. */
      onFocus={(e) => {
        if (e.currentTarget.matches(":focus-visible"))
          e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
      }}
      className={`shrink-0 whitespace-nowrap rounded-pill border-[1.5px] px-4 py-2 text-xs transition-colors duration-200 ${
        activo
          ? "border-tinta bg-tinta text-papel"
          : "border-linea text-tinta-media hover:border-tinta hover:text-tinta"
      }`}
    >
      {nombre}
    </button>
  );
}

/* Cada renglon es su propio scroll de costado en el celular, como en la demo
   del cliente. El `-m-1 p-1` y el `scroll-px-1` no se ven: son el aire para el
   aro de foco, que sin ellos queda cortado contra el borde del scroll al
   llegar con el teclado. El padding cubre el renglon quieto, y el
   scroll-padding el caso en que el navegador lo corre para mostrar el chip
   enfocado, que si no lo deja pegado al borde. */
const RENGLON =
  "sin-barra -m-1 flex scroll-px-1 items-center gap-2 overflow-x-auto p-1 lg:overflow-visible";

/** LA BARRA DE FILTROS, arriba de los estantes. La misma idea que la demo del
 *  cliente: chips pill, y en el celular un renglon por grupo que se corre con
 *  el dedo. En escritorio entra todo en una linea.
 *
 *  Se elige un filtro por vez, no se combinan. En un catalogo de este tamano
 *  cruzar dos (descuento y cuero, por ejemplo) casi siempre da vacio, y un
 *  filtro que vacia la tienda se lee como que no hay nada. Uno por vez se
 *  entiende sin explicacion: el chip negro es lo que se esta viendo. */
export function FiltrosTienda({
  generales,
  rasgos,
  etiquetaRasgo,
  activo,
  onElegir,
}: {
  generales: Filtro[];
  rasgos: Filtro[];
  etiquetaRasgo: string | null;
  activo: string | null;
  onElegir: (clave: string | null) => void;
}) {
  const idEtiqueta = useId();
  /* Sin "Mas vendidos" ni "Con descuento", en el celular "Todo" quedaba solo
     en un renglon entero. Ahi va fijo a la izquierda y los rasgos se corren a
     su lado. Es un caso de todos los dias, no una rareza: el testerp de hoy, y
     produccion cuando llegue `trait` antes de que el cliente marque el primer
     mas vendido o lance una campana. */
  const soloTodo = generales.length === 0;

  return (
    <div
      role="group"
      aria-label="Filtrar la tienda"
      className={`reveal mb-12 flex gap-2.5 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-3 ${
        soloTodo ? "flex-row items-center" : "flex-col"
      }`}
    >
      <div className={`${RENGLON} ${soloTodo ? "shrink-0" : ""}`}>
        <Chip nombre="Todo" activo={activo === null} onClick={() => onElegir(null)} />
        {generales.map((f) => (
          <Chip
            key={f.clave}
            nombre={f.nombre}
            activo={activo === f.clave}
            onClick={() => onElegir(f.clave)}
          />
        ))}
      </div>

      {rasgos.length > 0 && (
        <>
          <span
            aria-hidden="true"
            className={`h-5 w-px shrink-0 bg-linea ${soloTodo ? "block" : "hidden lg:block"}`}
          />
          {/* Los valores van bajo el nombre que el ERP le da al eje. Si no lo
              manda, el renglon queda sin titulo en vez de inventarle uno: el
              nombre es de cada instancia, y uno generico puede ser mentira. */}
          <div
            role="group"
            aria-labelledby={etiquetaRasgo ? idEtiqueta : undefined}
            className={`${RENGLON} lg:flex-wrap ${soloTodo ? "min-w-0 flex-1" : ""}`}
          >
            {etiquetaRasgo && (
              <span
                id={idEtiqueta}
                className="shrink-0 whitespace-nowrap px-1 text-[11px] uppercase tracking-[0.06em] text-tinta-suave"
              >
                {etiquetaRasgo}
              </span>
            )}
            {rasgos.map((f) => (
              <Chip
                key={f.clave}
                nombre={f.nombre}
                activo={activo === f.clave}
                onClick={() => onElegir(f.clave)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
