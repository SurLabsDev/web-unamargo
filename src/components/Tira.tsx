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
 *  Los anchos en vw de aca abajo son la entrada de la cuenta que fija la
 *  velocidad en globals.css (`--dur-tira`): la duracion se calcula para que la
 *  tira corra a los mismos px/s que el original del cliente. Tocar estos vw
 *  sin rehacer esa cuenta cambia la velocidad sin querer.
 *
 *  Son seis y no once a proposito: las cinco que faltan son piezas graficas con
 *  texto encima ("MATE CAMIONERO", "ME / YOU", "YERBA MATE"...). En una tira que
 *  corre, un texto que pasa de largo no se llega a leer y ensucia. Quedan solo
 *  las fotograficas. */
const FOTOS = Array.from({ length: 6 }, (_, i) =>
  `/marquee/foto-${String(i + 1).padStart(2, "0")}.jpg`,
);

export function Tira() {
  const dobles = [...FOTOS, ...FOTOS];

  return (
    <section aria-hidden className="overflow-hidden py-2">
      <div className="tira">
        {dobles.map((src, i) => (
          <div
            key={i}
            className="relative aspect-[4/3] w-[62vw] shrink-0 overflow-hidden rounded-foto bg-humo sm:w-[38vw] lg:w-[24vw]"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="(max-width: 640px) 62vw, (max-width: 1024px) 38vw, 24vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
