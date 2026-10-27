import Image from "next/image";

/** Las fotos de marca del cliente, corriendo sin fin.
 *
 *  Ojo con el nombre de los archivos: cambiarles el CONTENIDO dejando la misma
 *  ruta no alcanza, porque el optimizador de imagenes de Next cachea por URL y
 *  sigue sirviendo las viejas. Si se cambian las fotos, se cambia el nombre. Van DOS veces y la
 *  animacion desplaza exactamente la mitad, asi el ciclo cierra sin salto.
 *  NO se frena al pasar el mouse: llegamos a pausarla para poder mirar una,
 *  pero el cliente ya habia sacado esa pausa en su version y la quiere
 *  corriendo siempre, haya cursor encima o no.
 *
 *  CADA FOTO CONSERVA SU PROPORCION, como en el original: alto fijo y ancho
 *  segun el archivo. Las cinco primeras son 4:5, levemente verticales, y la
 *  ultima es mas angosta. Estuvieron metidas en un marco 4:3 con
 *  `object-cover`, que las recortaba apaisadas, y el cliente lo marco dos
 *  veces: "eran levemente verticales". Por eso las medidas de cada archivo
 *  estan escritas aca: si se cambia una foto por otra de distinta proporcion,
 *  se cambian sus medidas.
 *
 *  Los altos en px de aca abajo son la entrada de la cuenta que fija la
 *  velocidad en globals.css (`--dur-tira`): la duracion se calcula para que la
 *  tira corra a los mismos px/s que el original del cliente. Tocar estos altos
 *  sin rehacer esa cuenta cambia la velocidad sin querer.
 *
 *  Son seis y no once a proposito: las cinco que faltan son piezas graficas con
 *  texto encima ("MATE CAMIONERO", "ME / YOU", "YERBA MATE"...). En una tira que
 *  corre, un texto que pasa de largo no se llega a leer y ensucia. Quedan solo
 *  las fotograficas. */
const FOTOS = [
  { n: 1, ancho: 720, alto: 900 },
  { n: 2, ancho: 720, alto: 900 },
  { n: 3, ancho: 720, alto: 900 },
  { n: 4, ancho: 720, alto: 900 },
  { n: 5, ancho: 720, alto: 900 },
  { n: 6, ancho: 597, alto: 900 },
].map((f) => ({
  ...f,
  src: `/marquee/foto-${String(f.n).padStart(2, "0")}.jpg`,
}));

export function Tira() {
  const dobles = [...FOTOS, ...FOTOS];

  return (
    <section aria-hidden className="overflow-hidden py-2">
      <div className="tira">
        {dobles.map((f, i) => (
          <div
            key={i}
            style={{ aspectRatio: `${f.ancho} / ${f.alto}` }}
            className="relative h-[280px] shrink-0 overflow-hidden rounded-foto bg-humo sm:h-[340px] lg:h-[420px]"
          >
            {/* El ancho mas grande que se dibuja es el de una 4:5 a 420px de
                alto: 336px. */}
            <Image
              src={f.src}
              alt=""
              fill
              sizes="(max-width: 640px) 224px, (max-width: 1024px) 272px, 336px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
