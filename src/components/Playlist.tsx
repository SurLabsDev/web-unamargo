"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react/dist/ssr";
import { Spotify } from "./Sociales";
import { useMontado } from "./useDialogo";
import { SITE } from "@/lib/site";

/** El reproductor oficial de Spotify con la playlist de SITE, que es la unica
 *  fuente: si cambia la playlist, cambia ahi y esto la sigue solo. `theme=0`
 *  es el tema oscuro, el mismo de la demo del cliente, y queda negro como la
 *  marca. */
const EMBED = `https://open.spotify.com/embed/playlist/${new URL(
  SITE.spotify,
).pathname
  .split("/")
  .pop()}?utm_source=generator&theme=0`;

/** La playlist flotante de la demo del cliente: un boton verde redondo en una
 *  esquina de abajo que despliega el reproductor de Spotify, para escuchar
 *  mientras se recorre la tienda. Ya estuvo una vez y se habia caido en el
 *  camino.
 *
 *  APARECE RECIEN CUANDO SE SALE DEL HERO, y desde que se abre una vez no se
 *  va mas (la musica puede estar sonando). Se midio contra la fila de botones
 *  del hero y, cuando esa fila sumo "Como curar y cebar", en los celulares
 *  bajos (375x667, 390x664) el boton cerrado y el panel abierto le tapaban
 *  botones e iconos: en una pantalla chica no hay esquina libre en el hero.
 *  Fuera del hero si la hay, y es justo donde se compra, que es para lo que
 *  el cliente lo pidio ("escuchar la playlist mientras comprabas").
 *
 *  LA ESQUINA Y EL TAMANO CAMBIAN CON LA PANTALLA. Con el panel abierto, lo
 *  que importa es no tapar contenido:
 *    - En escritorio, desde lg, va abajo a la DERECHA y no a la izquierda como
 *      en la demo. Alla "Ver productos" estaba a la derecha; aca esta abajo a
 *      la izquierda, y el panel abierto lo tapaba en todas las notebooks
 *      comunes (de 1024x768 a 1536x864). A la derecha no toca nada del hero
 *      desde 1280.
 *    - Debajo de lg queda a la izquierda, como en la demo.
 *    - En el celular, debajo de sm, el reproductor es el mini de Spotify, de
 *      80px, a todo el ancho. El de 152 de la demo tapaba la fila de botones
 *      del hero en todo telefono de menos de 412px de ancho; el de 80 la deja
 *      libre desde 360x780. Va a todo el ancho porque a 80px de alto Spotify
 *      necesita unos 300 de ancho, y con menos corta el boton de reproducir.
 *
 *  NO ES UN <dialog>, A PROPOSITO. El cajon, el menu y el pop-up usan
 *  `useDialogo`, que abre con `showModal()`: deja inerte el resto de la pagina
 *  y bloquea el scroll, y aca la idea es justamente seguir comprando con la
 *  musica puesta. Ademas el pop-up espera a que no quede ningun `dialog[open]`:
 *  si esto fuera un dialogo, con la musica sonando el pop-up no apareceria
 *  nunca. Es un boton que despliega un panel, con `aria-expanded`.
 *
 *  EL IFRAME SE CREA EN EL PRIMER CLIC Y DESPUES NO SE DESMONTA NUNCA. Antes
 *  del clic no hay ningun pedido a Spotify, asi que el que no lo toca no paga
 *  nada. Y cerrar el panel lo esconde, no lo saca: la version anterior lo
 *  montaba con `{abierto && ...}`, y cerrar el panel cortaba la musica.
 *
 *  La misma regla que los dialogos (ver "Cajon del pedido" en globals.css): el
 *  estado base del panel es el escondido, y `data-abierto` lo muestra, como
 *  `[open]` a ellos. Escondido es `invisible` e `inert`: no se ve, no recibe
 *  clics ni foco, y el iframe sigue vivo y sonando.
 *
 *  Va en z-30: debajo del header (z-40) y de la ficha de producto (z-50), que
 *  es un div y no un dialogo. El cajon, el menu y el pop-up van en la capa
 *  superior del navegador y lo tapan igual, con su fondo oscurecido.
 *
 *  A 1rem del borde de abajo y no a los 28px de la demo: con 28px, al llegar
 *  al final de la pagina el boton se apoyaba sobre la ultima linea del pie.
 *  El `env(safe-area-inset-*)` lo separa de la barra de abajo del iPhone
 *  cuando el navegador informa ese margen. */
export function Playlist() {
  const [abierto, setAbierto] = useState(false);
  /** Pasa a true en el primer clic y no vuelve: desde ahi el iframe existe. */
  const [cargado, setCargado] = useState(false);
  const [listo, setListo] = useState(false);
  /** La etiqueta ya cumplio: se toco el boton o se apreto Escape. Vuelve
   *  cuando el puntero o el foco se van, no en el medio. */
  const [sinAyuda, setSinAyuda] = useState(false);
  /** El hero ya quedo atras (ver arriba). */
  const [fueraDelHero, setFueraDelHero] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const idPanel = useId();
  const montado = useMontado();

  // Escape se escucha en todo el documento y no solo en el boton: con el
  // panel abierto el foco puede estar en cualquier lado de la pagina. Lo que
  // no llega es el Escape apretado ADENTRO del reproductor, que es otro
  // documento, de otro dominio.
  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      // Con el pedido, el menu, el pop-up o una ficha encima, el Escape es de
      // ellos: cierra lo de arriba y no tambien esto, que queda debajo.
      if (document.querySelector('dialog[open], [aria-modal="true"]')) return;
      const raiz = raizRef.current;
      if (!raiz) return;
      const adentro = raiz.contains(document.activeElement);
      if (abierto) {
        setAbierto(false);
        setSinAyuda(true);
        if (adentro) botonRef.current?.focus();
      } else if (adentro || raiz.matches(":hover")) {
        // Cerrado, Escape descarta la etiqueta sin mover el puntero ni el foco.
        setSinAyuda(true);
      }
    }
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  // Se vigila el hero con un IntersectionObserver y no con "scroll", que corre
  // en cada cuadro. Con menos del 40% del hero a la vista, lo que queda en
  // pantalla ya es la tira o la tienda.
  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    const obs = new IntersectionObserver(
      ([e]) => setFueraDelHero(e.intersectionRatio < 0.4),
      { threshold: [0, 0.4, 1] },
    );
    obs.observe(hero);
    return () => obs.disconnect();
  }, []);

  function alternar() {
    setCargado(true);
    setAbierto((v) => !v);
    // Sin esto, al cerrar con el mouse la etiqueta salta en el acto, porque
    // el puntero sigue encima del boton.
    setSinAyuda(true);
  }

  if (!montado) return null;

  const ayuda = !abierto && !sinAyuda;
  // Una vez abierto se queda, aunque se vuelva al hero: puede estar sonando.
  const visible = fueraDelHero || cargado;

  return createPortal(
    <div
      ref={raizRef}
      inert={!visible}
      onPointerLeave={() => setSinAyuda(false)}
      className={`group fixed transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none ${
        visible ? "" : "pointer-events-none translate-y-3 opacity-0"
      } bottom-[calc(1rem_+_env(safe-area-inset-bottom,0px))] left-[calc(1rem_+_env(safe-area-inset-left,0px))] z-30 sm:left-[calc(1.5rem_+_env(safe-area-inset-left,0px))] lg:left-auto lg:right-[calc(1.5rem_+_env(safe-area-inset-right,0px))] print:hidden`}
    >
      {/* El verde oscuro de base y el claro en el hover, al reves que la
          demo: el claro no da contraste con el blanco (ver globals.css), y
          ese es el criterio de todos los verdes del sitio. El aro de foco va
          doble, blanco y negro, porque el boton pasa por encima de secciones
          claras y oscuras. */}
      <button
        ref={botonRef}
        type="button"
        onClick={alternar}
        onBlur={() => setSinAyuda(false)}
        aria-label="Escuchá nuestra playlist"
        aria-expanded={abierto}
        aria-controls={idPanel}
        className="peer relative flex h-12 w-12 items-center justify-center rounded-pill bg-verde text-papel shadow-[0_2px_12px_rgb(10_10_10/0.22)] transition-[background-color,scale] duration-200 hover:scale-[1.06] hover:bg-verde-vivo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta focus-visible:ring-2 focus-visible:ring-papel active:scale-95 motion-reduce:transition-none"
      >
        <Spotify
          className={`h-5 w-5 transition-[opacity,scale,rotate] duration-200 motion-reduce:transition-none ${
            abierto ? "-rotate-90 scale-50 opacity-0" : ""
          }`}
        />
        <X
          aria-hidden
          size={20}
          weight="bold"
          className={`absolute transition-[opacity,scale,rotate] duration-200 motion-reduce:transition-none ${
            abierto ? "" : "rotate-90 scale-50 opacity-0"
          }`}
        />
      </button>

      {/* La etiqueta de la demo, solo desde md: en el celular no hay hover y
          no entra al lado del boton. Va del lado de adentro de la pantalla,
          asi que desde lg, con el boton a la derecha, cambia de lado. Repite
          el nombre del boton, por eso va escondida del lector de pantalla.
          El `pl-3` (o `pr-3`) es el puente entre el boton y la etiqueta: sin
          el, el puntero cruzaba un hueco vacio, se perdia el hover y la
          etiqueta se iba antes de llegar a ella. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute left-full top-1/2 hidden -translate-x-1.5 -translate-y-1/2 pl-3 opacity-0 transition-[opacity,translate] duration-200 md:block lg:left-auto lg:right-full lg:translate-x-1.5 lg:pl-0 lg:pr-3 motion-reduce:transition-none ${
          ayuda
            ? "group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 peer-focus-visible:translate-x-0 peer-focus-visible:opacity-100"
            : ""
        }`}
      >
        <span className="relative block whitespace-nowrap rounded-pill bg-tinta px-3.5 py-2 text-xs font-semibold text-papel shadow-[0_2px_12px_rgb(10_10_10/0.22)] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-[5px] before:border-transparent before:border-r-tinta lg:before:left-full lg:before:right-auto lg:before:border-r-transparent lg:before:border-l-tinta">
          Conocé y escuchá nuestra playlist
        </span>
      </span>

      {/* Va DESPUES del boton aunque se vea arriba: asi el Tab que sigue al
          boton entra al reproductor. Las medidas son las de Spotify: 80px es
          su reproductor mini y 152 el compacto, el que usaba la demo. */}
      <div
        id={idPanel}
        inert={!abierto}
        data-abierto={abierto || undefined}
        className="invisible absolute bottom-full left-0 mb-2 h-20 w-[min(28rem,calc(100vw_-_2rem))] origin-bottom-left translate-y-2 scale-95 overflow-hidden rounded-xl bg-tinta opacity-0 shadow-[0_4px_24px_rgb(10_10_10/0.28)] transition-[opacity,translate,scale,visibility] duration-200 ease-out data-abierto:visible data-abierto:translate-y-0 data-abierto:scale-100 data-abierto:opacity-100 sm:h-[152px] sm:w-[300px] lg:left-auto lg:right-0 lg:origin-bottom-right motion-reduce:transition-none"
      >
        {cargado && (
          <>
            {!listo && (
              <p className="absolute inset-0 flex items-center justify-center text-xs text-papel/50">
                Cargando la playlist…
              </p>
            )}
            {/* Aparece cuando termina de cargar: hasta ahi el iframe es una
                caja vacia, y asi no se ve el salto. */}
            <iframe
              src={EMBED}
              title="Playlist de Un Amargo en Spotify"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              onLoad={() => setListo(true)}
              className={`relative block h-full w-full border-0 transition-opacity duration-300 motion-reduce:transition-none ${
                listo ? "" : "opacity-0"
              }`}
            />
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
