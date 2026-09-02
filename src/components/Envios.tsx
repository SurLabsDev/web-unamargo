"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Truck, ArrowDown } from "@phosphor-icons/react/dist/ssr";
import { SITE } from "@/lib/site";
import { Instagram } from "./Sociales";
import { MapaMontevideo } from "./MapaMontevideo";
import { PICKUPS, ZONAS_ENVIO, SIN_POLIGONO, barriosDeZona, type Zona } from "@/lib/zonas";

const TODAS: Zona[] = [...PICKUPS, ...ZONAS_ENVIO];

/** Los barrios de `SIN_POLIGONO` que de verdad figuran en alguna zona. Se cruza
 *  contra las listas en vez de usar la constante tal cual: si alguno queda ahi
 *  sin estar en ninguna zona, no se nombra en ningun lado de la pagina y
 *  aclarar por que no se pinta seria hablar de un barrio que no ofrecemos. */
const SIN_PINTAR = SIN_POLIGONO.filter((b) =>
  TODAS.some((z) => z.barrios.includes(b)),
);

/** La aclaracion de los barrios que el mapa no pinta, armada en UN solo lugar.
 *
 *  Estaba escrita dos veces y ya habian divergido: escritorio la derivaba de la
 *  zona en pantalla y celular la tenia a mano, asi que celular nombraba dos
 *  barrios ("Paso Molino y Verdisol") mientras `SIN_POLIGONO` tiene tres y
 *  escritorio, parado en la zona 3, decia otros dos ("Las Piedras y Verdisol").
 *  Dos redacciones del mismo dato es como se llega a eso; ahora hay una.
 *
 *  Dice "en su zona" y no "en la zona" a proposito: escritorio le pasa los
 *  barrios de UNA zona y celular los de todas, y esa forma es cierta en los
 *  dos casos.
 *
 *  El separador es ", " menos el ultimo, que va con "y". Con `join(" y ")`,
 *  tres barrios salian "a y b y c"; hoy ninguna zona llega a tres, pero el
 *  bloque de celular ya los junta todos. */
function notaSinPintar(barrios: string[]): string | null {
  if (barrios.length === 0) return null;
  const uno = barrios.length === 1;
  const lista = uno
    ? barrios[0]
    : `${barrios.slice(0, -1).join(", ")} y ${barrios[barrios.length - 1]}`;
  return `${lista} ${uno ? "entra" : "entran"} en su zona, pero no ${
    uno ? "figura" : "figuran"
  } como barrio oficial de Montevideo, así que el mapa no ${
    uno ? "lo" : "los"
  } pinta.`;
}

/** La nota del bloque de celular, que junta todas las zonas. Es constante, asi
 *  que se arma una vez a nivel de modulo y no en cada render. */
const NOTA_TODAS = notaSinPintar(SIN_PINTAR);

/** Alturas de la pista, en **svh** y no en vh ni dvh, a proposito.
 *
 *  En el celular la barra del navegador se encoge y se estira al scrollear, y
 *  eso cambia la altura del viewport. `dvh` sigue ese cambio, asi que la pista
 *  se acorta y se alarga sola: los centinelas se corren debajo del dedo y al
 *  subir despues de bajar mucho la pagina pega saltos. `svh` esta clavado al
 *  viewport chico (barra desplegada) y no se mueve nunca.
 *
 *  `ENTRADA` es el aire antes de que la primera zona tome el control y `SALIDA`
 *  el de despues de la ultima. `PASO` es cuanto dura cada zona. */
const ENTRADA = 55;
const PASO = 62;
const SALIDA = 45;

/** Un grupo de la barra de pasos: las pildoras de retiro o las de domicilio.
 *
 *  CON UNA SOLA ZONA NO DIBUJA BARRA. Una barra de progreso de un paso no
 *  tiene de donde a donde ir: ocupa el mismo lugar que una de verdad y se lee
 *  como un control roto. Mirado en el navegador con los datos de hoy y parado
 *  en una zona de domicilio, el grupo de retiro quedaba en una unica raya de
 *  20x6px, verde apagada, suelta al lado de la palabra RETIRO.
 *
 *  Con una sola zona la etiqueta pasa a ser el boton: mismo destino, se lee
 *  como una chapa que se enciende y no como una barra a la que le faltan
 *  pasos, y de paso el area de toque pasa de esos 20x6px a 69x25px medidos,
 *  que es lo que se puede acertar con el dedo.
 *
 *  La condicion mira `zonas.length`, no cuantos pickups hay hoy: los retiros
 *  ya fueron tres y pueden volver a serlo, y ese dia la barra vuelve sola.
 *
 *  Los dos grupos comparten este componente porque antes eran dos bloques
 *  copiados que solo cambiaban de color, que es como el de celular y el de
 *  escritorio de la nota de barrios terminaron diciendo cosas distintas. */
function GrupoPasos({
  zonas,
  desde,
  activa,
  etiqueta,
  verde,
  irA,
}: {
  zonas: Zona[];
  /** Indice de la primera zona del grupo dentro de `TODAS`. */
  desde: number;
  /** Indice de la zona en pantalla, en el mismo espacio que `desde`. */
  activa: number;
  etiqueta: string;
  /** El retiro va en verde, el domicilio en el papel de la marca. */
  verde: boolean;
  irA: (n: number) => void;
}) {
  if (zonas.length === 0) return null;

  const rotulo = "text-[10px] uppercase tracking-[0.14em]";

  if (zonas.length === 1) {
    const encendida = desde === activa;
    return (
      <button
        onClick={() => irA(desde)}
        /* El nombre accesible arranca con el texto que se ve ("Retiro") y
           despues agrega el destino. Si fuera solo `Ir a Cordón Sur / Centro`,
           quien maneja la pagina por voz diria "Retiro" y no habria nada que
           responda a esa palabra. */
        aria-label={`${etiqueta}: ${zonas[0].titulo}`}
        aria-current={encendida}
        className={`rounded-pill border px-3 py-1 transition-colors duration-500 ${rotulo} ${
          encendida
            ? verde
              ? "border-verde-vivo text-verde-vivo"
              : "border-papel text-papel"
            : "border-papel/20 text-papel/35 hover:border-papel/45 hover:text-papel/70"
        }`}
      >
        {etiqueta}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {zonas.map((z, k) => {
        const n = desde + k;
        const encendida = n === activa;
        return (
          <button
            key={z.id}
            onClick={() => irA(n)}
            aria-label={`Ir a ${z.titulo}`}
            aria-current={encendida}
            className={`h-1.5 rounded-pill transition-all duration-500 ${
              encendida ? "w-10" : "w-5"
            } ${
              encendida
                ? verde
                  ? "bg-verde"
                  : "bg-papel"
                : verde
                  ? "bg-verde/35 hover:bg-verde/60"
                  : "bg-papel/25 hover:bg-papel/50"
            }`}
          />
        );
      })}
      <span className={`ml-1 ${rotulo} text-papel/35`}>{etiqueta}</span>
    </div>
  );
}

/** El scroll recorre las zonas. Se entra a la seccion, queda fija, y al bajar
 *  va cambiando de zona hasta que se acaban; ahi la pagina sigue de largo.
 *
 *  El progreso NO se mide escuchando "scroll": eso corre en cada cuadro y traba
 *  el celular. Se ponen centinelas invisibles, uno por zona, y un
 *  IntersectionObserver avisa cual esta cruzando el medio de la pantalla. El
 *  estado cambia una vez por zona y nada mas en toda la seccion. */
export function Envios() {
  const [i, setI] = useState(0);
  const pista = useRef<HTMLDivElement>(null);
  const centinelas = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // sin scroll guiado: quedan los botones

    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          const n = Number((e.target as HTMLElement).dataset.zona);
          setI((prev) => (prev === n ? prev : n));
        }
      },
      // Una franja de 20% de alto en el medio de la pantalla. Con los
      // centinelas separados 62svh no puede haber dos adentro a la vez, y es
      // lo bastante alta como para que un scroll rapido no la saltee. Una
      // franja de altura cero se puede pasar de largo entre dos cuadros.
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    );
    centinelas.current.forEach((c) => c && obs.observe(c));
    return () => obs.disconnect();
  }, []);

  function irA(n: number) {
    centinelas.current[n]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const zona = TODAS[i];
  const encendidos = barriosDeZona(zona);
  const notaFaltantes = notaSinPintar(
    zona.barrios.filter((b) => SIN_POLIGONO.includes(b)),
  );
  const esPickup = PICKUPS.some((p) => p.id === zona.id);

  return (
    <section id="envios" className="scroll-mt-0 bg-tinta text-papel">
      {/* Encabezado, antes de que empiece la pista */}
      <div className="mx-auto max-w-[1400px] px-5 pt-24 sm:px-8 lg:px-12 lg:pt-28">
        <div className="reveal max-w-[36ch]">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-papel/45">
            Logística
          </p>
          <h2 className="type-display text-[clamp(2.5rem,6vw,4.5rem)]">
            Cómo recibís tu pedido
          </h2>
          {/* Sin numero a proposito: decia "seis" y paso a mentir apenas los
              retiros bajaron de tres a uno. La lista manda, el texto no cuenta. */}
          <p className="type-body mt-6 text-lg leading-relaxed text-papel/65">
            Retiro sin costo o cadetería a tu casa. Segui bajando y vas viendo
            cada zona en el mapa.
          </p>
        </div>
        <div className="reveal mt-8 inline-flex rounded-pill bg-verde px-5 py-2.5 text-sm font-semibold">
          Envío gratis en Montevideo a partir de $3.490
        </div>
      </div>

      {/* La pista: alta, con la vista fija adentro y un centinela por zona. */}
      <div
        ref={pista}
        className="relative mt-10"
        style={{ height: `${ENTRADA + TODAS.length * PASO + SALIDA}svh` }}
      >
        {TODAS.map((_, n) => (
          <div
            key={n}
            data-zona={n}
            ref={(el) => {
              centinelas.current[n] = el;
            }}
            className="absolute h-px w-px"
            style={{ top: `${ENTRADA + n * PASO + PASO / 2}svh` }}
            aria-hidden
          />
        ))}

        {/* Pegado DEBAJO del header, no arriba de todo. El header es `fixed` con
            fondo opaco, asi que con `top-0` el panel arrancaba tapado: medido,
            la fila de pastillas quedaba escondida en el 25% de las posiciones de
            scroll a 390px y en el 84% a 320px, y ahi ni siquiera recibia el toque
            (`elementFromPoint` devolvia el logo del header).

            Y `safe center` en vez de `center` a secas: centrar reparte el aire
            sobrante, pero cuando el contenido es MAS ALTO que el hueco -pasa en
            celulares cortos, donde el bloque mide 626px y el hueco 554- centrar
            recorta por arriba Y por abajo, y lo que se pierde arriba son
            justamente las pastillas. `safe` cae en `start` cuando no hay aire,
            asi que lo que se corta es siempre el final del mapa y nunca el
            control. */}
        <div className="sticky top-16 flex min-h-[calc(100svh-4rem)] [align-items:safe_center] px-5 py-6 sm:px-8 sm:py-10 md:top-[73px] md:min-h-[calc(100svh-73px)] lg:px-12">
          <div className="mx-auto grid w-full max-w-[1400px] items-center gap-6 sm:gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              {/* Los pasos, como una barra de progreso que se puede tocar. */}
              <div className="mb-8 flex flex-wrap items-center gap-4">
                <GrupoPasos
                  zonas={PICKUPS}
                  desde={0}
                  activa={i}
                  etiqueta="Retiro"
                  verde
                  irA={irA}
                />
                <GrupoPasos
                  zonas={ZONAS_ENVIO}
                  desde={PICKUPS.length}
                  activa={i}
                  etiqueta="Domicilio"
                  verde={false}
                  irA={irA}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-pill px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] transition-colors duration-500 ${
                    esPickup
                      ? "bg-verde text-papel"
                      : "border border-papel/35 text-papel"
                  }`}
                >
                  {esPickup ? <MapPin size={15} weight="fill" /> : <Truck size={15} weight="fill" />}
                  {esPickup ? "Retiro sin costo" : "Cadetería a domicilio"}
                </span>
                {/* El rotulo es un indice dentro de su grupo ("Zona 1" de 3).
                    El retiro es uno solo, asi que ahi no numera nada y ademas
                    repetiria la chapa de al lado: por eso no tiene rotulo y el
                    campo es opcional. Se pregunta por el dato y no por el grupo
                    para que el render siga a los datos, no a una suposicion. */}
                {zona.rotulo && (
                  <span className="rounded-pill border border-papel/20 px-3 py-2 text-xs font-medium uppercase tracking-[0.1em] text-papel/55">
                    {zona.rotulo}
                  </span>
                )}
              </div>

              <h3 className="type-display mt-4 text-[clamp(1.9rem,4.5vw,3.25rem)]">
                {zona.titulo}
              </h3>
              <p className="mt-3 flex items-baseline gap-1.5">
                <span
                  className={`type-display text-3xl sm:text-4xl ${
                    esPickup ? "text-verde-vivo" : "text-papel"
                  }`}
                >
                  {zona.precio ?? "Sin costo"}
                </span>
                <span className="text-xs text-papel/45">
                  {zona.precio ? "UYU" : "para vos"}
                </span>
              </p>

              <p className="type-body mt-4 max-w-[50ch] leading-relaxed text-papel/60">
                {zona.detalle}
              </p>

              {/* Mismo criterio que en el bloque de celular de mas abajo: en
                  el retiro los barrios son la zona que se pinta en el mapa, no
                  una lista de direcciones donde se pueda ir a buscar. Estaba
                  aplicado en un solo lado y las chapas aparecian en escritorio
                  y no en celular. */}
              {!esPickup && zona.barrios.length > 0 && (
                <ul className="mt-6 hidden flex-wrap gap-1.5 lg:flex">
                  {zona.barrios.map((b) => (
                    <li
                      key={b}
                      className="rounded-pill border border-papel/25 px-3 py-1.5 text-[13px] text-papel/80"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              {notaFaltantes && (
                <p className="mt-4 hidden max-w-[52ch] text-xs leading-relaxed text-papel/40 lg:block">
                  {notaFaltantes}
                </p>
              )}

              {/* Este boton abria WhatsApp, y en verde porque ese verde es el
                  de WhatsApp. Preguntar si un barrio entra es una duda previa
                  al pedido, y WhatsApp quedo solo para el pedido ya armado que
                  sale del carrito: la duda va por Instagram. Como ya no es de
                  WhatsApp tampoco puede seguir verde (el verde esta reservado
                  para WhatsApp y Spotify), asi que lleva el papel de la marca,
                  que es el negro invertido de los botones de las secciones
                  claras. */}
              {i === TODAS.length - 1 && (
                <a
                  href={SITE.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex items-center gap-2 rounded-pill bg-papel px-6 py-3 text-sm font-semibold text-tinta transition-transform duration-300 hover:scale-[1.03]"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  ¿No ves tu barrio? Escribinos por Instagram
                </a>
              )}
            </div>

            <div className="lg:col-span-7">
              <MapaMontevideo
                encendidos={encendidos}
                etiqueta={`Montevideo con ${zona.titulo} resaltado`}
              />
              {i === 0 && (
                <p className="mt-4 flex items-center justify-center gap-2 text-xs text-papel/35">
                  <ArrowDown size={13} />
                  Seguí bajando
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Solo en celular: el detalle de barrios, fuera de la pantalla fija. */}
      <div className="mx-auto max-w-[1400px] px-5 pb-4 sm:px-8 lg:hidden">
        <h3 className="type-display text-2xl">Barrios por zona</h3>
        <dl className="mt-6">
          {TODAS.map((z) => {
            const pickup = PICKUPS.some((x) => x.id === z.id);
            return (
              <div key={z.id} className="border-t border-papel/15 py-5">
                <dt className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                      pickup ? "bg-verde text-papel" : "border border-papel/35 text-papel"
                    }`}
                  >
                    {pickup ? <MapPin size={12} weight="fill" /> : <Truck size={12} weight="fill" />}
                    {pickup ? "Retiro" : z.precio}
                  </span>
                  <span className="font-semibold">{z.titulo}</span>
                </dt>
                {/* En el retiro los barrios son la zona que se pinta en el
                    mapa, no una lista de direcciones donde se pueda ir a
                    buscar: lo que sirve leer ahi es como se coordina. */}
                <dd className="mt-2.5 text-sm leading-relaxed text-papel/60">
                  {pickup || z.barrios.length === 0
                    ? z.detalle
                    : z.barrios.join(" · ")}
                </dd>
              </div>
            );
          })}
        </dl>
        {/* La misma nota que en escritorio, con los barrios de todas las
            zonas: aca el listado no se recorre zona por zona, se ve entero. */}
        {NOTA_TODAS && (
          <p className="mt-2 text-xs leading-relaxed text-papel/40">
            {NOTA_TODAS}
          </p>
        )}
      </div>

      <div className="mx-auto max-w-[1400px] px-5 pb-24 pt-10 sm:px-8 lg:px-12 lg:pt-0">
        {/* Esta nota estaba para aclarar el pickup de Ciudad de la Costa. Ese
            punto ya no existe y no hay dato nuevo sobre esa zona, asi que queda
            solo lo que si esta confirmado. */}
        <p className="max-w-[62ch] text-xs leading-relaxed text-papel/40">
          Fuera de Montevideo enviamos por Correo Uruguayo o encomienda: el
          costo varía según destino y peso.
        </p>
      </div>
    </section>
  );
}
