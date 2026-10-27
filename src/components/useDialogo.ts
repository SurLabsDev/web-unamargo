"use client";

import { useEffect, useEffectEvent, useSyncExternalStore, type RefObject } from "react";

/**
 * Abre y cierra un <dialog> nativo con animacion de entrada y de salida. Lo
 * usan el cajon del pedido, el menu del celular y el pop-up: las tres cosas
 * que se apoyan encima de la pagina.
 *
 * Se abre con `showModal()`, no con CSS.
 *
 * Un `position: fixed` deja de medirse contra la ventana si CUALQUIER
 * ancestro tiene `transform`, `filter`, `backdrop-filter`, `will-change` o
 * `contain`. En Safari eso dejaba el cajon corrido y el fondo oscurecido sin
 * llegar al borde. Se probo mover el panel, cambiar `translate` por
 * `transform` y sacarlo a un portal en <body>: los tres arreglaron Chrome,
 * que nunca estuvo roto, y ninguno arreglo Safari.
 *
 * `showModal()` pone el elemento en la CAPA SUPERIOR del navegador, fuera del
 * arbol de layout. Ningun ancestro puede alcanzarlo, porque a efectos de
 * posicionamiento ya no tiene ancestros. Ademas trae gratis lo que estabamos
 * haciendo a mano: Escape cierra, el foco queda atrapado adentro y el resto
 * de la pagina queda inerte para lectores de pantalla.
 *
 * Al cerrar NO se llama a `close()` de una: eso lo saca de la capa superior
 * en el primer fotograma y la salida no se ve. Se marca `data-cerrando`, que
 * en el CSS lo devuelve a su posicion de entrada, y recien cuando termina la
 * transicion se cierra de verdad. Chrome resuelve esto solo con
 * `allow-discrete` en `display`. Safari todavia no, y ahi la salida cortaba
 * seco. Esto anda en los dos.
 *
 * `esperaMax` es la red por si la transicion no dispara (movimiento reducido,
 * o un navegador que no anima): sin eso el dialogo quedaria abierto para
 * siempre. Tiene que ser un poco mas larga que la transicion de salida.
 */
export function useDialogo(
  ref: RefObject<HTMLDialogElement | null>,
  abierto: boolean,
  {
    alAbrir,
    esperaMax = 400,
  }: { alAbrir?: () => void; esperaMax?: number } = {},
): void {
  // Un evento de efecto y no una dependencia: el padre pasa una funcion nueva
  // en cada render, y si el efecto la tuviera en sus dependencias se volveria
  // a correr en el medio del cierre y lo cortaria.
  const abrio = useEffectEvent(() => alAbrir?.());

  useEffect(() => {
    const d = ref.current;
    if (!d) return;

    if (abierto && !d.open) {
      d.removeAttribute("data-cerrando");
      d.showModal();
      abrio();
      return;
    }

    if (!abierto && d.open) {
      d.setAttribute("data-cerrando", "");
      let cerrado = false;
      const terminar = () => {
        if (cerrado) return;
        cerrado = true;
        d.removeAttribute("data-cerrando");
        if (d.open) d.close();
      };
      // Solo la transicion del propio dialogo: la de un boton de adentro
      // tambien burbujea hasta aca, y cerraria antes de que termine la salida.
      const alTerminar = (e: TransitionEvent) => {
        if (e.target === d) terminar();
      };
      d.addEventListener("transitionend", alTerminar);
      const t = setTimeout(terminar, esperaMax);
      return () => {
        clearTimeout(t);
        d.removeEventListener("transitionend", alTerminar);
        terminar();
      };
    }
  }, [abierto, ref, esperaMax]);

  // El scroll del fondo se bloquea aparte: `showModal` lo hace en algunos
  // navegadores y en otros no.
  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [abierto]);
}

/**
 * True en el navegador y false en el servidor, sin llamar a `setState` dentro
 * de un efecto (que dispara un render en cascada).
 *
 * Los dialogos se montan en <body> con un portal y NO donde vive el
 * componente, y el portal necesita el DOM, que en el servidor no existe.
 * Montados en <body>, ningun ancestro con una sombra o un blur puede
 * capturarlos el dia que alguien los agregue.
 */
export function useMontado(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
