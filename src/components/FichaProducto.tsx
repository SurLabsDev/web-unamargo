"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { precio, videoDe, type Producto } from "@/lib/catalog";
import { AddToCart } from "./cart/AddToCart";

/** El video de un producto, apoyado encima de la foto que le hace de marco.
 *
 *  Vive aca y no en un modulo propio para que la tarjeta y la ficha compartan
 *  una sola implementacion sin importarse en circulo: la tienda ya importa la
 *  ficha, la ficha no importa la tienda.
 *
 *  NO LLEVA `poster`, Y ESO ES A PROPOSITO. El poster tendria que ser la URL
 *  cruda del Storage del ERP, que no pasa por `next/image`: en el celular se
 *  bajaria el original de 960x1200 para pintarlo del tamano de una tarjeta, y se
 *  bajaria al renderizar, no al entrar en pantalla, que es justo lo que este
 *  componente evita. En su lugar quien lo usa deja el <Image> optimizado abajo y
 *  monta el video encima.
 *
 *  ESE <Image> DE ABAJO HAY QUE APAGARLO, Y PARA ESO ESTA `alArrancar`.
 *  El video NO tapa la foto: los MP4 son verticales (464x832 y 480x854, 9:16) y
 *  las fotos del ERP son 4:5 (960x1200), asi que con `object-contain` sobre el
 *  mismo marco el video se pinta mas angosto que la foto y por los costados
 *  queda asomando la foto quieta del mismo producto, partida en dos pedazos.
 *  Medido en Chrome a 390px de ancho, con el video corriendo: en la tarjeta la
 *  foto se pinta 180.2px de ancho y el video 125.9px, o sea 27px de foto por
 *  lado; en la ficha la foto se pinta 297.1px y el video 207.1px, 45px por lado.
 *  Por eso quien lo usa esconde la foto cuando llega este aviso.
 *
 *  El aviso es el evento `playing`, y no `loadstart` ni un temporizador, porque
 *  cuando llega ya hay cuadro: medido en el instante del evento, el video esta
 *  en `readyState` 4 con `videoWidth` 464. La foto no se apaga antes de que
 *  haya algo que la reemplace.
 *
 *  Y si el video no arranca, el evento no llega y la foto se queda. Medido de
 *  las dos maneras a 390px: con `prefers-reduced-motion` el `src` ni se pide, y
 *  cortandole el mp4 a la red queda `video.error` con `readyState` 0. En los
 *  dos casos la foto sigue en opacidad 1, en la tarjeta y en la ficha.
 *  Cualquier otro motivo por el que no reproduzca termina igual, porque sin
 *  reproduccion no hay `playing`.
 *
 *  NO LLEVA `.foto-fundida`. Esa mascara desvanece el borde de la CAJA del
 *  elemento, y la caja del video es el marco entero mientras que el video pinta
 *  esa franja mas angosta del medio, asi que el degradado le cae casi todo al
 *  vacio de los costados. Medido en la ficha volviendole a poner la clase: solo
 *  cambia el 6.4% de los pixeles del video, en las esquinas y con una
 *  diferencia maxima de 18 sobre 255. No hace lo que la clase existe para
 *  hacer, que es suavizar el borde de una foto que llena su caja. Sobre la foto
 *  sigue puesta.
 *
 *  El `className` que recibe siempre lo pone en absoluto sobre ese marco
 *  (`absolute inset-0 h-full w-full object-contain`): asi el tamano intrinseco
 *  del video no decide nada -sin eso arranca en 300x150, el default del
 *  navegador, y la ficha cambia de tamano al cargar- y termina midiendo
 *  exactamente lo que mide el marco.
 *
 *  RECIEN SE DESCARGA CUANDO ENTRA EN PANTALLA. El `preload="none"` mas el
 *  observador que le pone el `src` son las dos mitades de lo mismo: sin el
 *  observador el video no arranca nunca, y sin el `preload` se baja aunque
 *  nadie llegue a verlo. Pesan 975 KB y 340 KB, y en el celular los paga el
 *  visitante. Fuera de pantalla se pausa, por bateria.
 *
 *  Con `prefers-reduced-motion` no se carga nunca: queda la foto de abajo.
 *
 *  Es decorativo (`aria-hidden`) y no lleva nombre: el del producto ya lo dicen
 *  el boton de la tarjeta, el titulo del dialogo y el <h3> de la ficha. Una
 *  cuarta repeticion no agrega nada. */
export function VideoProducto({
  src,
  className,
  alArrancar,
}: {
  src: string;
  className?: string;
  alArrancar?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const arrancar = () => {
      if (!v.src) v.src = src;
      // Si el navegador igual lo bloquea, queda la foto de abajo: no hay nada
      // que hacer.
      void v.play().catch(() => {});
    };

    if (!("IntersectionObserver" in window)) {
      arrancar();
      return;
    }

    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) arrancar();
        else if (!v.paused) v.pause();
      },
      { threshold: 0.25 },
    );
    obs.observe(v);
    return () => obs.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      onPlaying={alArrancar}
      className={className}
    />
  );
}

/** La ficha completa del producto. Se abre al tocar una pieza del estante y
 *  trae lo que no entra en la fila: todas las fotos, la descripcion, el rubro y
 *  el subtipo. */
export function FichaProducto({
  producto,
  siguiendoStock,
  onCerrar,
}: {
  producto: Producto;
  siguiendoStock: boolean;
  onCerrar: () => void;
}) {
  const [i, setI] = useState(0);
  const [videoAndando, setVideoAndando] = useState(false);
  const fotos = producto.images;
  const video = videoDe(producto);

  /* EL VIDEO ES UNA DIAPOSITIVA MAS, no el reemplazo de la primera foto.
     Antes se dibujaba en el indice 0 pisando a `fotos[0]`, y los dos productos
     que tienen video traen una sola foto del ERP: con una sola diapositiva no
     se dibujan ni flechas ni puntitos, asi que la foto quieta no quedaba "a un
     toque", quedaba inalcanzable, y el unico puntito posible hubiera dicho "Ver
     foto 1" mostrando un video. Sumandolo a la lista hay dos diapositivas, los
     controles aparecen solos y cada uno nombra lo que de verdad muestra. */
  const diapos: { tipo: "video" | "foto"; src: string }[] = [
    ...(video ? [{ tipo: "video" as const, src: video }] : []),
    ...fotos.map((src) => ({ tipo: "foto" as const, src })),
  ];
  const actual = diapos[i];
  const esVideo = actual?.tipo === "video";
  /* La foto que le da el marco al video es la primera del producto, SI LA HAY.
     Puede no haberla: `catalog.ts` ya declara `video` en el contrato del ERP y
     `videoDe` le da precedencia, asi que un producto con video y `images: []`
     -o al que le borren la unica foto desde Stock- es un caso que el ERP puede
     mandar hoy. Antes todo el bloque de imagen colgaba de esta constante y ese
     producto abria la ficha vacia: sin foto, sin video, y sin flechas ni
     puntitos porque con una sola diapositiva no se dibujan. */
  const fondo = esVideo ? fotos[0] : actual?.src;
  /* Con el video corriendo la foto no se ve. Ver `VideoProducto`. */
  const fotoTapada = esVideo && videoAndando;

  /* Todo cambio de diapositiva pasa por aca, y no por `setI` suelto, porque al
     cambiar el <video> se desmonta y vuelve a empezar de cero: la bandera tiene
     que empezar de cero con el. Si quedara prendida, al volver a la diapositiva
     del video la foto arrancaria escondida y el marco se veria vacio los
     milisegundos que el video tarda en tener cuadro. */
  const verDiapo = useCallback((n: number | ((v: number) => number)) => {
    setI(n);
    setVideoAndando(false);
  }, []);

  // Escape cierra y el fondo no scrollea mientras esta abierta.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowRight" && diapos.length > 1)
        verDiapo((v) => (v + 1) % diapos.length);
      if (e.key === "ArrowLeft" && diapos.length > 1)
        verDiapo((v) => (v - 1 + diapos.length) % diapos.length);
    };
    document.addEventListener("keydown", onKey);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
    };
  }, [onCerrar, diapos.length, verDiapo]);

  /* Lo unico que le pone limite a la foto.
     Va en dvh y no en vh para que mida la pantalla que de verdad queda con la
     barra del navegador abierta; con vh el marco se pasa de largo en el celular
     y se come el lugar del texto.
     Los 500px de escritorio tampoco son un numero al azar: es el alto al que
     llega una foto 4:5 en esta columna. El video normalmente no entra en esta
     cuenta, porque se apoya sobre la foto y hereda su medida. */
  const alto = "max-h-[44dvh] sm:max-h-[min(60dvh,500px)]";
  /* El mismo tope, pero como alto fijo. Es para el producto con video y sin
     fotos: ahi no hay foto que le de medida al marco, y el video no se la puede
     dar porque hasta que no llegan sus metadatos mide 300x150, el default del
     navegador. Medido a 390px dejando que el video se midiera solo: el dialogo
     abre en 390x600.6 y salta a 390x776.5 cuando el video se entera de cuanto
     mide, 176px de salto con la ficha ya en pantalla. Con el alto puesto aca el
     marco vale 358x371.4 desde el primer cuadro y no se mueve. */
  const altoSinFoto = "h-[44dvh] sm:h-[min(60dvh,500px)]";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-tinta/55 backdrop-blur-[2px]" onClick={onCerrar} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={producto.name}
        className="relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[18px] bg-papel sm:max-h-[86dvh] sm:rounded-[18px]"
      >
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-pill bg-papel/85 text-tinta-media backdrop-blur transition-colors hover:text-tinta"
        >
          <X size={18} weight="bold" />
        </button>

        {/* ACA SCROLLEA TODA LA FICHA, Y ES EL UNICO QUE SCROLLEA.
            Hubo una version en que scrolleaba solo la columna de texto, con el
            precio como hermano fijo afuera. El pie quedaba a la vista, si, pero
            el texto quedaba encerrado en una caja de ~280px de alto sin ninguna
            pista de que hubiera mas: en un iPhone SE la mitad de la ficha era
            inalcanzable y la fila "Codigo" directamente no existia para el
            visitante. Con un solo scroll el contenido no queda encerrado, y el
            precio igual esta siempre a la vista porque va `sticky` adentro de
            este mismo scroller.

            Sigue siendo flex y no grid: en escritorio las dos columnas se
            estiran a la misma altura, que es lo que deja el precio apoyado
            abajo de la columna de texto. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto sm:flex-row">
          <div className="relative flex shrink-0 flex-col sm:w-1/2">
            {/* EL MARCO NO IMPONE PROPORCION, LA PONE LA FOTO.
                Antes era `aspect-square`. Como el ERP manda todas las fotos en
                4:5 vertical, cada una entraba achicada dentro de un cuadrado,
                con dos bandas vacias arriba y abajo: eso es lo que el cliente
                vio como "demasiado cuadrado". Ahora la caja se ajusta a lo que
                trae la foto -alto y ancho automaticos, tope en dvh,
                `object-contain`-, asi que una vertical crece a lo alto y una
                horizontal a lo ancho, y ninguna sale recortada ni deformada.
                Cambiar esto por una proporcion fija vuelve a traer el problema,
                aunque la proporcion elegida sea otra. */}
            <div className="relative flex items-center justify-center p-4 sm:p-6">
              {actual && (
                /* La foto siempre va por `next/image` (optimizada y con
                   `sizes`) y es la que le da la medida al marco. El video,
                   cuando la diapositiva es la suya, se monta encima ocupando
                   ese mismo marco. La foto va centrada dentro del envoltorio
                   para que los dos coincidan aunque el envoltorio quede mas
                   ancho que ella. Sin foto, el envoltorio pone la medida el
                   solo y el video se contiene adentro. */
                <div
                  className={`relative max-w-full ${fondo ? "" : `w-full ${altoSinFoto}`}`}
                >
                  {fondo && (
                    <Image
                      src={fondo}
                      alt={producto.name}
                      /* Medida de las fotos del ERP. No fija la proporcion: solo
                         reserva el lugar mientras carga, despues manda la real. */
                      width={960}
                      height={1200}
                      sizes="(max-width: 640px) 100vw, 448px"
                      className={`foto-fundida mx-auto block h-auto w-auto max-w-full object-contain transition-opacity duration-300 ${alto} ${
                        fotoTapada ? "opacity-0" : "opacity-100"
                      }`}
                    />
                  )}
                  {esVideo && video && (
                    <VideoProducto
                      src={video}
                      alArrancar={() => setVideoAndando(true)}
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                  )}
                </div>
              )}
              {diapos.length > 1 && (
                <>
                  <button
                    onClick={() => verDiapo((v) => (v - 1 + diapos.length) % diapos.length)}
                    aria-label="Anterior"
                    className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-pill bg-papel/80 backdrop-blur transition-colors hover:bg-papel"
                  >
                    <CaretLeft size={15} weight="bold" />
                  </button>
                  <button
                    onClick={() => verDiapo((v) => (v + 1) % diapos.length)}
                    aria-label="Siguiente"
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-pill bg-papel/80 backdrop-blur transition-colors hover:bg-papel"
                  >
                    <CaretRight size={15} weight="bold" />
                  </button>
                </>
              )}
            </div>

            {/* Los puntitos: dicen cuantas diapositivas hay y dejan saltar a
                una. El del video dice "Ver video" y no "Ver foto 1", que es lo
                que un lector de pantalla escuchaba antes. */}
            {diapos.length > 1 && (
              <div className="flex justify-center gap-2 pb-5">
                {diapos.map((d, n) => (
                  <button
                    key={d.src}
                    onClick={() => verDiapo(n)}
                    aria-label={d.tipo === "video" ? "Ver video" : `Ver foto ${video ? n : n + 1}`}
                    aria-current={n === i}
                    className={`h-1.5 rounded-pill transition-all duration-300 ${
                      n === i ? "w-7 bg-tinta" : "w-3 bg-linea hover:bg-tinta-suave"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col border-t border-linea sm:w-1/2 sm:border-l sm:border-t-0">
            <div className="flex flex-col gap-4 p-6 sm:p-8">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {producto.category && (
                    <span className="rounded-pill border border-linea px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-tinta-suave">
                      {producto.category.name}
                    </span>
                  )}
                  {producto.subtype && (
                    <span className="rounded-pill bg-humo px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-tinta-media">
                      {producto.subtype.name}
                    </span>
                  )}
                </div>
                <h3 className="type-display mt-3 text-[clamp(1.5rem,3vw,2.25rem)]">
                  {producto.name}
                </h3>
              </div>

              {producto.description && (
                <p className="type-body text-sm leading-relaxed text-tinta-media">
                  {producto.description}
                </p>
              )}

              <dl className="mt-1 border-t border-linea pt-4 text-sm">
                <div className="flex justify-between py-1">
                  <dt className="text-tinta-suave">Código</dt>
                  <dd className="font-mono text-xs">{producto.sku}</dd>
                </div>
                {siguiendoStock && (
                  <div className="flex justify-between py-1">
                    <dt className="text-tinta-suave">Disponibilidad</dt>
                    <dd>{producto.in_stock ? `${producto.stock} en stock` : "Sin stock"}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* EL PRECIO Y "AGREGAR" VAN PEGADOS AL PIE DEL SCROLL.
                Si el boton de agregar no se ve, no hay pedido, y la ficha
                existe justamente para eso. `sticky bottom-0` lo deja siempre a
                la vista sin sacarlo del scroll: el contenido pasa por detras y
                se sigue pudiendo llegar al final, que es lo que se rompia
                cuando el pie era un hermano fijo afuera del scroller.
                El `mt-auto` es para cuando la ficha es corta: sin el, el pie
                quedaria pegado al texto con un hueco abajo.
                El borde de arriba mas el fondo opaco son lo que evita que el
                texto que pasa por detras se lea encima. */}
            <div className="sticky bottom-0 mt-auto flex items-end justify-between gap-4 border-t border-linea bg-papel px-6 py-4 sm:px-8 sm:py-5">
              <div>
                {producto.discount && (
                  <p className="text-sm text-tinta-suave line-through">
                    {precio(producto.price)}
                  </p>
                )}
                <p className="type-display text-3xl">{precio(producto.price_final)}</p>
                {producto.discount && (
                  <p className="mt-1 text-xs font-semibold text-verde">
                    {producto.discount.percentage}% off · {producto.discount.campaign}
                  </p>
                )}
              </div>
              <AddToCart
                producto={producto}
                siguiendoStock={siguiendoStock}
                alAgregar={onCerrar}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
