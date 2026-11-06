import Image from "next/image";
import type { FotoTira } from "@/lib/tira";

/** Una foto de la tira, venga del ERP o de las fijas. `ancho` y `alto` son los
 *  px del archivo: dan la proporcion, no lo que mide en pantalla. */
type Foto = { src: string; ancho: number; alto: number; alt: string };

/** Las fotos de siempre, las de la demo del cliente. Corren mientras el
 *  cliente no cargue ninguna desde el ERP, y tambien si el ERP no contesta o
 *  manda solo fotos que no se pueden dibujar: la tira nunca queda vacia.
 *
 *  Ojo con el nombre de los archivos: cambiarles el CONTENIDO dejando la misma
 *  ruta no alcanza, porque el optimizador de imagenes de Next cachea por URL y
 *  sigue sirviendo las viejas. Si se cambian estas fotos, se cambia el nombre.
 *  Con las del ERP no hace falta: cada foto que se sube ahi recibe un nombre
 *  nuevo.
 *
 *  Las medidas son las de cada archivo: las cinco primeras son 4:5, levemente
 *  verticales, y la ultima es mas angosta. Si se cambia una foto por otra de
 *  distinta proporcion, se cambian sus medidas.
 *
 *  Son seis y no once a proposito: las cinco que faltan son piezas graficas con
 *  texto encima ("MATE CAMIONERO", "ME / YOU", "YERBA MATE"...). En una tira que
 *  corre, un texto que pasa de largo no se llega a leer y ensucia. Quedan solo
 *  las fotograficas. */
const FIJAS: Foto[] = [
  { n: 1, ancho: 720, alto: 900 },
  { n: 2, ancho: 720, alto: 900 },
  { n: 3, ancho: 720, alto: 900 },
  { n: 4, ancho: 720, alto: 900 },
  { n: 5, ancho: 720, alto: 900 },
  { n: 6, ancho: 597, alto: 900 },
].map(({ n, ancho, alto }) => ({
  src: `/marquee/foto-${String(n).padStart(2, "0")}.jpg`,
  ancho,
  alto,
  alt: "",
}));

/** Los altos de las fotos en cada tramo de pantalla, del mas ancho al mas
 *  angosto, que es el orden en que `sizes` elige. Son los de la clase
 *  `h-[280px] sm:h-[340px] lg:h-[420px]` de abajo, que Tailwind necesita
 *  escrita entera, y los cortes son los de `sm` y `lg`. De aca salen el ancho
 *  de cada foto, su `sizes` y la duracion de la animacion: si se cambia un
 *  alto o un corte, se cambia en los dos lados. */
const TRAMOS = [
  { media: "(min-width: 64rem)", alto: 420, variable: "--dur-tira-lg" },
  { media: "(min-width: 40rem)", alto: 340, variable: "--dur-tira-sm" },
  { media: null, alto: 280, variable: "--dur-tira-movil" },
] as const;

/** La velocidad del original del cliente, en px/s. De donde sale esta
 *  explicado en globals.css, arriba de `.tira`. */
const VELOCIDAD = 187.2;

/** El `gap` de `.tira` en globals.css. */
const HUECO = 10;

/** Lo que mide de ancho una foto dibujada a `alto` px, con su proporcion. */
function anchoA(f: Foto, alto: number): number {
  return (alto * f.ancho) / f.alto;
}

/** Cuanto tiene que durar un ciclo para que ESTE juego corra a VELOCIDAD con
 *  las fotos a `alto` px. La tira lleva el juego dos veces y viaja la mitad:
 *  un ciclo recorre un juego entero mas la mitad de los 2n - 1 huecos de la
 *  tira, o sea n - 0.5 huecos. */
function duracion(juego: Foto[], alto: number): string {
  const ciclo =
    juego.reduce((suma, f) => suma + anchoA(f, alto), 0) +
    (juego.length - 0.5) * HUECO;
  return `${(ciclo / VELOCIDAD).toFixed(3)}s`;
}

/** Lo que de verdad mide la foto en cada tramo. Con eso el navegador baja el
 *  archivo mas chico que alcanza, en vez de suponer que la foto ocupa toda la
 *  pantalla. */
function sizesDe(f: Foto): string {
  return TRAMOS.map(({ media, alto }) => {
    const ancho = `${Math.round(anchoA(f, alto))}px`;
    return media ? `${media} ${ancho}` : ancho;
  }).join(", ");
}

/** Las fotos de marca del cliente, corriendo sin fin.
 *
 *  Las elige el cliente desde el ERP, en el orden en que las quiere ver. Si no
 *  cargo ninguna, o el ERP no contesta, corren las seis de siempre (`FIJAS`).
 *
 *  Van DOS veces y la animacion desplaza exactamente la mitad, asi el ciclo
 *  cierra sin salto. NO se frena al pasar el mouse: llegamos a pausarla para
 *  poder mirar una, pero el cliente ya habia sacado esa pausa en su version y
 *  la quiere corriendo siempre, haya cursor encima o no.
 *
 *  CADA FOTO CONSERVA SU PROPORCION, como en el original: alto fijo y ancho
 *  segun el archivo. Estuvieron metidas en un marco 4:3 con `object-cover`,
 *  que las recortaba apaisadas, y el cliente lo marco dos veces: "eran
 *  levemente verticales". Las del ERP traen sus medidas en la respuesta.
 *
 *  LA VELOCIDAD ES SIEMPRE LA DEL ORIGINAL, 187.2 px/s, sean las fotos que
 *  sean. Como cada juego mide distinto, la duracion no puede estar escrita fija
 *  en el CSS: se calcula aca con los anchos de este juego en cada tramo y
 *  llega a `.tira` como variables (`--dur-tira-movil`, `-sm` y `-lg`).
 *
 *  El `alt` es el que cargo el cliente, o vacio si no cargo ninguno. La tira
 *  sigue oculta para los lectores de pantalla: es decorativa y pasa cada foto
 *  dos veces. */
export function Tira({ fotos }: { fotos: FotoTira[] | null }) {
  const juego: Foto[] =
    fotos && fotos.length > 0
      ? fotos.map((f) => ({
          src: f.url,
          ancho: f.width,
          alto: f.height,
          alt: f.alt ?? "",
        }))
      : FIJAS;
  const dobles = [...juego, ...juego];
  const duraciones = Object.fromEntries(
    TRAMOS.map(({ alto, variable }) => [variable, duracion(juego, alto)]),
  ) as React.CSSProperties;

  return (
    <section aria-hidden className="overflow-hidden py-2">
      <div className="tira" style={duraciones}>
        {dobles.map((f, i) => (
          <div
            key={i}
            style={{ aspectRatio: `${f.ancho} / ${f.alto}` }}
            className="relative h-[280px] shrink-0 overflow-hidden rounded-foto bg-humo sm:h-[340px] lg:h-[420px]"
          >
            <Image
              src={f.src}
              alt={f.alt}
              fill
              sizes={sizesDe(f)}
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
