"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import { Bag } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "./Logo";
import { Instagram, Pinterest, Spotify } from "./Sociales";
import { useDialogo, useMontado } from "./useDialogo";
import { SITE } from "@/lib/site";

/** El menu del celular: una cortina negra que baja y tapa toda la pantalla,
 *  con las secciones en la letra de los titulos.
 *
 *  Era una lista chica que se desplegaba debajo del header, y el cliente la
 *  encontro "muy basica". Ahora el menu es una pantalla de la marca: negro, los
 *  titulos enormes y condensados de siempre, y las secciones entrando una
 *  detras de otra.
 *
 *  La barra de arriba REPITE la del header, en el mismo lugar y con las mismas
 *  medidas, pero en blanco sobre negro. Por eso el boton de cerrar aparece
 *  justo donde estaba el de abrir, y sus dos rayas se cruzan en una X: se lee
 *  como el mismo boton que cambio, no como una pantalla nueva.
 *
 *  Es un <dialog> abierto con `showModal()`, como el cajon del pedido (ver
 *  `useDialogo`): Escape cierra, el foco queda adentro y el resto de la
 *  pagina queda inerte mientras esta abierto. */
export function MenuMovil({
  abierto,
  onCerrar,
  nav,
  unidades,
  onPedido,
}: {
  abierto: boolean;
  onCerrar: () => void;
  nav: readonly { href: string; label: string }[];
  unidades: number;
  onPedido: () => void;
}) {
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const montado = useMontado();

  // El foco va al dialogo y no a la X: abierto con el dedo, Safari le pinta a
  // la X el aro de foco del teclado. Con el foco en el dialogo el lector de
  // pantalla anuncia "Menú" y el primer Tab ya cae adentro.
  // La salida dura 0.55s en el CSS; la red espera un poco mas.
  useDialogo(dialogoRef, abierto, {
    alAbrir: () => dialogoRef.current?.focus(),
    esperaMax: 700,
  });

  /** El salto a la seccion se hace a mano y AL MISMO TIEMPO que la cortina
   *  sube: cuando termina de irse, la pagina ya esta en la seccion. Dejado al
   *  navegador, el ancla salta mientras el fondo esta bloqueado y en algunos
   *  navegadores no se mueve. */
  function ir(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault();
    onCerrar();
    document.querySelector(href)?.scrollIntoView();
    history.replaceState(null, "", href);
  }

  if (!montado) return null;

  return createPortal(
    <dialog
      ref={dialogoRef}
      aria-label="Menú"
      tabIndex={-1}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      className="menu-movil"
    >
      <div className="flex min-h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between gap-6 px-5 sm:px-8 md:h-[72px]">
          <a
            href="#top"
            onClick={(e) => ir(e, "#top")}
            aria-label="Un Amargo, ir al inicio"
            className="flex shrink-0 items-center gap-2.5"
          >
            <Logo className="h-7 w-auto sm:h-8" />
            <span className="text-lg font-semibold tracking-tight">Un Amargo</span>
          </a>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={onPedido}
              aria-label={`Ver el pedido, ${unidades} artículos`}
              className="relative flex items-center gap-2 rounded-pill px-3 py-2 text-sm font-medium transition-colors hover:bg-papel/10"
            >
              <Bag size={19} />
              <span className="hidden sm:inline">Pedido</span>
              {unidades > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-pill bg-papel px-1.5 text-[11px] font-bold tabular-nums text-tinta">
                  {unidades}
                </span>
              )}
            </button>
            <button
              onClick={onCerrar}
              aria-label="Cerrar el menú"
              className="hamburguesa rounded-pill transition-colors hover:bg-papel/10"
            >
              <span />
              <span />
            </button>
          </div>
        </div>

        <nav aria-label="Secciones" className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-8">
          <ol>
            {nav.map((n, i) => (
              <li
                key={n.href}
                className="menu-entra"
                style={{ "--i": i } as React.CSSProperties}
              >
                <a
                  href={n.href}
                  onClick={(e) => ir(e, n.href)}
                  className="group flex items-baseline gap-4 py-2"
                >
                  <span className="w-6 shrink-0 text-xs font-medium tabular-nums text-papel/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {/* 10.5vw y no mas: "Personalizados" es una palabra de
                      catorce letras que no puede cortar, y tiene que entrar
                      entera en un celular de 360px al lado del numero. */}
                  <span className="type-display text-[clamp(2.25rem,10.5vw,4.75rem)] transition-colors duration-200 group-hover:text-papel/55 group-active:text-papel/55">
                    {n.label}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div
          className="menu-entra flex items-center justify-between gap-4 border-t border-papel/15 px-5 py-6 sm:px-8"
          style={{ "--i": nav.length } as React.CSSProperties}
        >
          <a
            href={SITE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-papel/70 transition-colors hover:text-papel"
          >
            {SITE.instagramUsuario}
          </a>
          <div className="flex items-center gap-5">
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de Un Amargo"
              className="transition-opacity hover:opacity-70"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href={SITE.spotify}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="La playlist de Un Amargo en Spotify"
              className="transition-opacity hover:opacity-70"
            >
              <Spotify className="h-5 w-5" />
            </a>
            <a
              href={SITE.pinterest}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Pinterest de Un Amargo"
              className="transition-opacity hover:opacity-70"
            >
              <Pinterest className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
