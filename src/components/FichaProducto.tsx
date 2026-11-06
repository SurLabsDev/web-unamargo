"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { precio, videoDe, type Producto } from "@/lib/catalog";
import { GUIAS } from "@/lib/guias";
import { AddToCart } from "./cart/AddToCart";
import { useCierreEnFondo, useDialogo } from "./useDialogo";
import { VideoProducto } from "./VideoProducto";

/** La ficha completa del producto. Se abre al tocar una pieza del estante y
 *  trae lo que no entra en la fila: todas las fotos, la descripcion, el rubro y
 *  el subtipo.
 *
 *  Es un <dialog> abierto con `showModal()`, como el cajon, el menu y el
 *  pop-up (ver `useDialogo`). Era un div con `aria-modal`, y eso solo no hace
 *  nada: el foco se quedaba en la tarjeta de atras, el Tab recorria la pagina
 *  tapada (108 veces hasta llegar a la ficha), un Enter en un "Agregar" que no
 *  se veia agregaba otro producto y al cerrar el foco caia en <body>. Con
 *  `showModal()` el resto de la pagina queda inerte: el Tab da la vuelta por
 *  los controles de la ficha y nunca llega a lo de atras (entre vuelta y
 *  vuelta pasa por la barra del navegador, como en el cajon).
 *
 *  Va con un portal a <body>, como los otros tres. No le hace falta
 *  `useMontado`: se monta recien cuando alguien toca una tarjeta, nunca en el
 *  render del servidor, asi que `document` ya existe. */
export function FichaProducto({
  producto,
  siguiendoStock,
  abierta,
  origen,
  onCerrar,
}: {
  producto: Producto;
  siguiendoStock: boolean;
  abierta: boolean;
  /** El boton de la tarjeta que la abrio: ahi vuelve el foco al cerrarla. */
  origen: HTMLElement | null;
  onCerrar: () => void;
}) {
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const cierre = useCierreEnFondo(abierta, onCerrar);
  /** Si lo ultimo que se uso adentro de la ficha fue el teclado. Ver
   *  `devolverFoco`. */
  const conTeclado = useRef(false);
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

  // El foco va al dialogo y no a la X, como en el menu: abierta con el dedo,
  // Safari le pinta a la X el aro de foco del teclado. Con el foco en el
  // dialogo el lector de pantalla anuncia el producto y el primer Tab ya cae
  // adentro. El fondo deja de scrollear lo que dura abierta (`useDialogo`).
  useDialogo(dialogoRef, abierta, {
    alAbrir: () => dialogoRef.current?.focus(),
  });

  /* EL FOCO VUELVE A LA TARJETA, Y SE LO LLEVA A MANO.
     `close()` devuelve el foco solo, pero al elemento que lo tenia cuando se
     abrio, y no siempre es la tarjeta: Safari no le da foco a un boton al
     tocarlo o al hacerle clic, asi que ahi la ficha se abre sin nada que
     devolver. Medido en WebKit: despues de `close()` el foco se queda en el
     dialogo ya cerrado, y de ahi cae a <body>.
     Si al cerrarse ya hay otro dialogo abierto (el pedido, despues de
     "Agregar"), el foco es de el y no se toca. `preventScroll` porque la
     tarjeta ya esta a la vista: es la que se toco.
     El aro de foco, solo si se cerro con el teclado. Llevado a mano, WebKit
     tambien lo pintaba despues de un toque, porque hereda lo "visible" del
     foco anterior y el dialogo lo trae de `showModal()`. Chrome, sin que se
     lo digan, ya decide asi. `focusVisible` todavia no esta en los tipos de
     TypeScript, por eso el tipo escrito a mano. */
  const devolverFoco = () => {
    if (document.querySelector("dialog[open]")) return;
    const opciones: FocusOptions & { focusVisible: boolean } = {
      preventScroll: true,
      focusVisible: conTeclado.current,
    };
    if (origen?.isConnected) origen.focus(opciones);
  };

  /* "AGREGAR" CIERRA LA FICHA EN EL ACTO, SIN ESPERAR LA SALIDA.
     Agregar abre el cajon del pedido (ver `AddToCart`), que es otro dialogo
     modal. Si la ficha esperara su salida, por 300ms habria dos dialogos
     modales a la vez: el cajon se abriria con el foco en este "Agregar" y lo
     anotaria como el lugar adonde devolverlo, y al cerrarse el pedido ese
     boton ya estaria en una ficha cerrada. Probado en Chrome y en WebKit con
     dos dialogos sueltos: el foco termina en <body>.
     Cerrandola aca, antes de que el cajon se abra, el foco pasa primero a la
     tarjeta, el cajon la anota a ella y al cerrarse vuelve ahi.
     La salida igual se ve en Chrome, que sigue pintando el dialogo mientras
     se va (`allow-discrete`, ver globals.css). */
  const pasarAlPedido = () => {
    dialogoRef.current?.close();
    devolverFoco();
    onCerrar();
  };

  /* Las flechas pasan las fotos. Se escuchan en el dialogo y no en todo el
     documento: escuchando el documento, para no robarle las teclas a un
     dialogo de encima habia que callarse con cualquier `dialog[open]`, y
     ahora la ficha es uno. Aca llegan solo con el foco adentro de la ficha,
     y con otro dialogo modal encima el foco es de ese otro. El Escape no pasa
     por aca: el navegador se lo da al dialogo de mas arriba (ver
     `onCancel`). */
  const alTeclear = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    // Con un modificador las flechas son de otro: Alt y Cmd son atras y
    // adelante del navegador.
    if (diapos.length < 2 || e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.key === "ArrowRight") verDiapo((v) => (v + 1) % diapos.length);
    if (e.key === "ArrowLeft") verDiapo((v) => (v - 1 + diapos.length) % diapos.length);
  };

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

  /* Sin `aria-modal`: un <dialog> abierto con `showModal()` ya es modal para
     el lector de pantalla. */
  return createPortal(
    <dialog
      ref={dialogoRef}
      aria-label={producto.name}
      tabIndex={-1}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      /* Todos los cierres terminan en `close()` (la salida, "Agregar", un
         Escape que el navegador no deja cancelar), y todos pasan por aca: el
         estado queda al dia y el foco vuelve a la tarjeta. */
      onClose={() => {
        onCerrar();
        devolverFoco();
      }}
      /* Un clic en el fondo cierra, solo si empieza y termina ahi, y nada
         pasa en el primer medio segundo (un doble clic en una tarjeta abria
         la ficha y el segundo clic caia en el fondo o en "Agregar"). Ver
         `useCierreEnFondo`. Adentro de la ficha un clic cae siempre en algo
         de adentro, porque el scroller la llena entera. */
      onClickCapture={cierre.onClickCapture}
      onPointerDown={(e) => {
        conTeclado.current = false;
        cierre.onPointerDown(e);
      }}
      onPointerUp={cierre.onPointerUp}
      onClick={cierre.onClick}
      onKeyDown={(e) => {
        conTeclado.current = true;
        alTeclear(e);
      }}
      className="ficha"
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
          abajo de la columna de texto.

          Y es `flex-auto`, no `flex-1`. El dialogo no tiene alto propio: es
          `fit-content` (asi lo centra `margin: auto`), o sea que toma el alto
          de este scroller. `flex-1` es `flex-basis: 0%`, y Safari 26.6 usa esa
          base como el alto del scroller cuando calcula el `fit-content`: la
          ficha quedaba de 0px de alto y solo se veia el fondo oscurecido.
          Chrome y el WebKit de Playwright miden el contenido, y por eso las
          pruebas automaticas no lo vieron. Con base `auto` la base es el
          contenido, y con `min-h-0` igual se achica y scrollea cuando no entra
          en el `max-height`. Medido en Safari 26.6.2: de 0 a 577px en
          escritorio y de 0 a 546px a 390 y a 375px de ancho. */}
      <div className="flex min-h-0 flex-auto flex-col overflow-y-auto sm:flex-row">
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
                {/* Tambien aca y no solo en la tarjeta: la ficha se abre
                    desde cualquier estante o filtro, y es lo que el cliente
                    quiere que se lea primero. */}
                {producto.featured === true && (
                  <span className="rounded-pill border border-tinta bg-tinta px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-papel">
                    Más vendido
                  </span>
                )}
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

            {/* La descripcion se muestra con sus saltos de linea, como el
                texto del pop-up: el ERP la manda en parrafos separados por un
                renglon en blanco y con una caracteristica por renglon
                ("Material: ...", "Cuidados: ..."), y sin `pre-line` todo
                quedaba en un solo parrafo corrido. Llegan saltos `\r\n` y
                `\n`; los dos se ven igual con `pre-line` (medido en Chrome y
                en WebKit), asi que no hace falta tocar el texto. */}
            {producto.description && (
              <p className="type-body whitespace-pre-line text-sm leading-relaxed text-tinta-media">
                {producto.description}
              </p>
            )}

            {/* Un mate nuevo se cura antes de usarlo, y es lo primero que
                pregunta quien compra uno. Solo en los mates: en una bombilla
                o una matera no aplica. Se compara el slug y no el nombre, que
                es el texto que el cliente puede cambiar desde el ERP. */}
            {producto.category?.slug === "mates" && (
              <a
                href={GUIAS.curar.ruta}
                className="self-start text-sm font-medium underline decoration-tinta-suave underline-offset-4 transition-colors hover:decoration-tinta"
              >
                ¿Mate nuevo? Así se cura
              </a>
            )}

            <dl className="mt-1 border-t border-linea pt-4 text-sm">
              {/* Con `gap` y alineado a la derecha: en 320px los codigos mas
                  largos parten en dos lineas, y sin esto quedaban pegados a la
                  etiqueta ("CódigoCOMBO-PORONGO-..."). */}
              <div className="flex justify-between gap-4 py-1">
                <dt className="text-tinta-suave">Código</dt>
                <dd className="text-right font-mono text-xs">{producto.sku}</dd>
              </div>
              {/* Hay o no hay, nunca cuantos: el cliente no quiere que se
                  vea cuantas unidades le quedan. El tope del carrito sigue
                  respetando el stock real, pero sin decir el numero. */}
              {siguiendoStock && (
                <div className="flex justify-between gap-4 py-1">
                  <dt className="text-tinta-suave">Disponibilidad</dt>
                  <dd>{producto.in_stock ? "En stock" : "Sin stock"}</dd>
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
              alAgregar={pasarAlPedido}
            />
          </div>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
