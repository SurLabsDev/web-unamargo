"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Minus, Plus, WhatsappLogo, Bag } from "@phosphor-icons/react/dist/ssr";
import { useCarrito } from "./CartProvider";
import { precio } from "@/lib/catalog";
import { SITE, linkWhatsApp } from "@/lib/site";

/** El pedido se cierra por WhatsApp, no hay pasarela de pago. Es lo que hace
 *  hoy el negocio y lo que espera quien compra en Montevideo. */
function armarMensaje(
  items: { nombre: string; cantidad: number; precio: string }[],
  total: string,
): string {
  const lineas = items.map(
    (i) => `- ${i.cantidad} x ${i.nombre} (${precio(i.precio)})`,
  );
  return [
    "Hola! Quiero hacer un pedido:",
    "",
    ...lineas,
    "",
    `Total: ${precio(total)}`,
    "",
    "Quedo a la espera para coordinar la entrega.",
  ].join("\n");
}

export function CartDrawer() {
  const { items, unidades, total, abierto, setAbierto, cambiarCantidad, quitar } =
    useCarrito();
  const [bloqueado, setBloqueado] = useState(false);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  // Escape cierra, y el foco entra al panel: sin esto el teclado queda atras.
  useEffect(() => {
    if (!abierto) return;
    cerrarRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [abierto, setAbierto]);

  // El cajon se monta en <body> y NO donde vive el componente.
  //
  // Un `position: fixed` no se posiciona respecto a la ventana si algun
  // ancestro tiene `transform`, `filter`, `backdrop-filter`, `will-change` o
  // `contain`: en ese caso se ancla a ESE ancestro. Safari aplica la regla en
  // casos donde Chrome no, y por eso el panel aparecia flotando en el medio en
  // Safari y perfecto en Chrome, con el mismo codigo.
  //
  // Buscar cual era el ancestro culpable arregla el sintoma de hoy y deja el
  // problema armado para la proxima vez que alguien agregue una sombra o un
  // blur en cualquier lado. Sacandolo del arbol, ninguno puede capturarlo.
  // Devuelve false en el servidor y true en el navegador, sin llamar a
  // `setState` dentro de un efecto (que dispara un render en cascada). El
  // portal necesita el DOM, que en el servidor no existe.
  const montado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const mensaje = armarMensaje(items, total);
  const href = linkWhatsApp(mensaje);

  function enviar(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const w = window.open(href, "_blank", "noopener,noreferrer");
    // Un envio que se traga el bloqueador de popups es un pedido perdido:
    // se ofrece el link a mano en vez de fallar en silencio.
    if (!w || w.closed) setBloqueado(true);
  }

  if (!montado) return null;

  return createPortal(
    <div
      aria-hidden={!abierto}
      className={`fixed inset-0 z-50 overflow-hidden ${abierto ? "" : "pointer-events-none"}`}
    >
      <div
        onClick={() => setAbierto(false)}
        className={`absolute inset-0 bg-tinta/50 transition-opacity duration-300 ${
          abierto ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Tu pedido"
        /* `w-[min(28rem,100%)]` y no `w-full max-w-md`: con los dos el ancho se
           resuelve en dos pasos y hay un cuadro en el que el panel ocupa la
           pantalla entera, asi que su contenido -que va centrado- aparece un
           instante en el medio antes de que el panel se acomode a la derecha.
           Con un solo ancho calculado no hay paso intermedio.

           `will-change-transform` le pide al navegador la capa ANTES de que
           arranque el gesto: sin eso el primer cuadro del deslizamiento se
           pinta en la posicion vieja. */
        /* Se desliza con `transform` escrito a mano y NO con `translate-x-*`.
           Tailwind 4 emite la propiedad `translate`, que es mas nueva y que en
           Safari dejaba el panel corrido exactamente su propio ancho: quedaba
           flotando en el medio de la pantalla en vez de pegado a la derecha. En
           Chrome se veia perfecto en todos los anchos, asi que el bug solo
           aparecia mirando el navegador del cliente.

           `transform: translateX()` tiene veinte años de soporte parejo y no
           pasa por las variables CSS que Tailwind usa para componer `translate`.

           `w-[min(28rem,100%)]` es un solo ancho calculado, no `w-full` mas un
           maximo: con dos reglas hay un cuadro en el que el panel ocupa la
           pantalla entera antes de acomodarse. */
        style={{ transform: abierto ? "translateX(0)" : "translateX(100%)" }}
        className="absolute right-0 top-0 flex h-full w-[min(28rem,100%)] flex-col bg-papel shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      >
        <header className="flex items-center justify-between border-b border-linea px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Tu pedido
            {unidades > 0 && (
              <span className="ml-2 text-tinta-media">
                {unidades} {unidades === 1 ? "artículo" : "artículos"}
              </span>
            )}
          </h2>
          <button
            ref={cerrarRef}
            onClick={() => setAbierto(false)}
            aria-label="Cerrar el pedido"
            className="rounded-pill p-2 text-tinta-media transition-colors hover:bg-humo hover:text-tinta"
          >
            <X size={20} weight="bold" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <Bag size={40} weight="light" className="text-tinta-media" />
            <p className="type-body text-tinta-media">
              Todavía no elegiste nada. Agregá un mate y lo coordinamos por
              WhatsApp.
            </p>
            <button
              onClick={() => setAbierto(false)}
              className="mt-2 rounded-pill bg-verde px-5 py-2.5 text-sm font-semibold text-papel transition-colors hover:bg-verde-vivo"
            >
              Ver la tienda
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-linea overflow-y-auto px-5">
              {items.map((it) => (
                <li key={it.sku} className="flex gap-4 py-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-foto bg-humo">
                    {it.imagen && (
                      <Image
                        src={it.imagen}
                        alt={it.nombre}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">{it.nombre}</p>
                      <button
                        onClick={() => quitar(it.sku)}
                        aria-label={`Quitar ${it.nombre}`}
                        className="shrink-0 rounded-pill p-1 text-tinta-media transition-colors hover:text-tinta"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-pill border border-linea">
                        <button
                          onClick={() => cambiarCantidad(it.sku, it.cantidad - 1)}
                          aria-label={`Quitar una unidad de ${it.nombre}`}
                          className="px-2 py-1.5 text-tinta-media transition-colors hover:text-tinta"
                        >
                          <Minus size={13} weight="bold" />
                        </button>
                        <span className="min-w-7 text-center text-sm tabular-nums">
                          {it.cantidad}
                        </span>
                        <button
                          onClick={() => cambiarCantidad(it.sku, it.cantidad + 1)}
                          disabled={it.cantidad >= it.stock}
                          aria-label={`Agregar una unidad de ${it.nombre}`}
                          className="px-2 py-1.5 text-tinta-media transition-colors hover:text-tinta disabled:opacity-30"
                        >
                          <Plus size={13} weight="bold" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {precio(it.precio)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-linea px-5 py-4">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-tinta-media">Total</span>
                <span className="text-2xl font-semibold tabular-nums tracking-tight">
                  {precio(total)}
                </span>
              </div>
              <p className="type-body mb-3 text-xs text-tinta-media">
                El envío se coordina por WhatsApp. Los retiros en Pocitos,
                Centro y Ciudad de la Costa no tienen costo.
              </p>
              <a
                href={href}
                onClick={enviar}
                className="flex w-full items-center justify-center gap-2 rounded-pill bg-verde px-5 py-3.5 font-semibold text-papel transition-colors hover:bg-verde-vivo"
              >
                <WhatsappLogo size={19} weight="fill" />
                Enviar el pedido
              </a>
              {bloqueado && (
                <p className="mt-3 text-xs text-tinta-media">
                  El navegador bloqueo la ventana.{" "}
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-verde underline underline-offset-2"
                  >
                    Abrí WhatsApp a mano
                  </a>{" "}
                  o escribinos al {SITE.whatsappLegible}.
                </p>
              )}
            </footer>
          </>
        )}
      </aside>
    </div>,
    document.body,
  );
}
