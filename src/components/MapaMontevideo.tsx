import { BARRIOS_MVD, VIEWBOX_MVD } from "@/lib/barrios-montevideo";

/** Montevideo por barrios. Los limites son los oficiales de la Intendencia, no
 *  un dibujo aproximado: si el mapa dice que Carrasco es zona 2, es Carrasco.
 *
 *  Se dibuja entero siempre y solo cambia el relleno, asi el cambio de zona es
 *  una transicion de color y no un re-dibujo. */
export function MapaMontevideo({
  encendidos,
  etiqueta,
}: {
  encendidos: string[];
  etiqueta?: string;
}) {
  const activos = new Set(encendidos);

  return (
    <svg
      viewBox={VIEWBOX_MVD}
      className="h-auto w-full overflow-visible"
      role="img"
      aria-label={etiqueta ?? "Mapa de Montevideo por barrios"}
    >
      <g>
        {Object.entries(BARRIOS_MVD).map(([nombre, d]) => {
          const on = activos.has(nombre);
          return (
            <path
              key={nombre}
              d={d}
              fill={on ? "var(--color-verde-vivo)" : "rgba(255,255,255,0.10)"}
              stroke={on ? "#3ddc9a" : "rgba(255,255,255,0.30)"}
              strokeWidth={on ? 1.6 : 0.8}
              strokeLinejoin="round"
              className="transition-[fill,stroke,stroke-width] duration-500 ease-out"
            />
          );
        })}
      </g>
    </svg>
  );
}
