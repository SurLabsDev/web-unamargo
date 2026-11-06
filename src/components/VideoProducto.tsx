"use client";

import { useEffect, useRef } from "react";

/** El video de un producto, apoyado encima de la foto que le hace de marco.
 *
 *  Vive en su propio modulo para que la tarjeta y la ficha compartan una sola
 *  implementacion, y para que la tienda la use SIN cargar la ficha: la ficha
 *  se baja aparte, recien despues del primer pintado (ver `Tienda`).
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
