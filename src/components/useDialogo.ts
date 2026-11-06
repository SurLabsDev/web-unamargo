"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useSyncExternalStore,
  type RefObject,
} from "react";

/**
 * Abre y cierra un <dialog> nativo con animacion de entrada y de salida. Lo
 * usan el cajon del pedido, el menu del celular, el pop-up y la ficha de
 * producto: las cuatro cosas que se apoyan encima de la pagina.
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
 * Lo que dura la salida, el dialogo sigue modal y la pagina de atras inerte:
 * un clic ahi no llega a nada. Se acepta porque se lo ve irse. Sin
 * transicion no hay nada que ver, y por eso ahi se cierra en el acto.
 *
 * `esperaMax` es la red por si la transicion no dispara (un navegador que no
 * anima): sin eso el dialogo quedaria abierto para siempre. Tiene que ser un
 * poco mas larga que la transicion de salida.
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
      // SIN TRANSICION SE CIERRA EN EL ACTO. Con movimiento reducido el CSS
      // de los cuatro dialogos pone `transition: none`: el dialogo
      // desaparecia en el primer cuadro pero seguia modal hasta `esperaMax`,
      // y un clic en ese rato no llegaba a nada, sin nada en pantalla que
      // explicara por que. Se mira tambien el `::backdrop`, que tiene su
      // propia transicion.
      const quieto = (duraciones: string) =>
        duraciones.split(",").every((s) => parseFloat(s) === 0);
      if (
        quieto(getComputedStyle(d).transitionDuration) &&
        quieto(getComputedStyle(d, "::backdrop").transitionDuration)
      ) {
        d.close();
        return;
      }

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

/** Lo que dura, despues de abrirse un dialogo, la ventana en la que se ignoran
 *  los clics adentro y en el fondo. Es el segundo toque del gesto que lo abrio:
 *  un doble toque en "Agregar" abre el cajon con el primero, y el segundo cae
 *  en lo que quedo debajo del dedo. Medido en el iPhone: con 40 a 500ms entre
 *  toques caia en "Continuar" y salteaba la lista; con 0ms caia en el fondo y
 *  lo cerraba. Con el mouse, un doble clic abria y cerraba en el mismo gesto. */
const GRACIA_MS = 500;

/**
 * Cerrar con un clic en el fondo, y solo con eso. Lo usan los tres dialogos
 * que se cierran asi: el cajon del pedido, el pop-up y la ficha.
 *
 * El fondo es el `::backdrop`, y un clic ahi le llega al dialogo mismo. Pero
 * si se aprieta de un lado del borde y se suelta del otro, el clic TAMBIEN le
 * llega al dialogo, como ancestro comun de los dos. Por eso tiene que empezar
 * Y terminar en el fondo: si no, cerraban gestos que no son un clic en el
 * fondo, como seleccionar texto adentro (el nombre en el formulario, la
 * descripcion) y soltar afuera, o resbalar unos pixeles por el borde. Con el
 * dedo el `pointerup` le llega al mismo elemento que el `pointerdown`, asi que
 * un toque en el fondo sigue cerrando.
 *
 * Ademas, durante `GRACIA_MS` despues de abrirse no pasa ningun clic, ni al
 * fondo ni a lo de adentro: ver la constante.
 */
export function useCierreEnFondo(abierto: boolean, cerrar: () => void) {
  const empezo = useRef(false);
  const termino = useRef(false);
  const abiertoEn = useRef(0);

  useEffect(() => {
    if (abierto) abiertoEn.current = performance.now();
  }, [abierto]);

  return {
    onClickCapture: (e: React.MouseEvent<HTMLDialogElement>) => {
      // `detail` es 0 en un clic de teclado (Enter, Espacio): ese no viene
      // de un doble toque y pasa siempre.
      if (e.detail > 0 && performance.now() - abiertoEn.current < GRACIA_MS) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    onPointerDown: (e: React.PointerEvent<HTMLDialogElement>) => {
      empezo.current = e.target === e.currentTarget;
    },
    onPointerUp: (e: React.PointerEvent<HTMLDialogElement>) => {
      termino.current = e.target === e.currentTarget;
    },
    onClick: (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget && empezo.current && termino.current) {
        cerrar();
      }
    },
  };
}
