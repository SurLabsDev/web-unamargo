/**
 * Las dos guias interactivas del cliente: como curar un mate y como cebarlo.
 *
 * Son paginas suyas, armadas a mano con una escena 3D en three.js, y se sirven
 * tal cual desde `src/guias/<id>.html` (las trae `scripts/importar-guia.mjs`).
 * Aca vive solo lo que el resto del sitio necesita saber de ellas: donde
 * estan, como se llaman y que se le dice al buscador. No importa nada del
 * servidor, asi que lo pueden usar los componentes de cliente.
 *
 * Las rutas se repiten en el script de importacion, que corre con Node pelado
 * y no puede importar este archivo. Si una cambia, cambian las dos, y la vieja
 * necesita una redireccion: para entonces ya puede estar indexada.
 */
export const GUIAS = {
  curar: {
    ruta: "/como-curar-un-mate",
    /** Su titular, como lo escribio el cliente. Es lo que dicen los enlaces:
     *  quien toca "Cómo curar tu mate" tiene que caer en una pagina que dice
     *  eso mismo. */
    nombre: "Cómo curar tu mate",
    /** El <title> no es el titular: va lo que la gente escribe en el buscador.
     *  Nadie busca "curar tu mate", busca "como curar un mate de calabaza". Sin
     *  la marca, que la agrega la ruta, igual que el `template` del layout. */
    titulo: "Cómo curar un mate de calabaza o algarrobo",
    descripcion:
      "Cómo curar un mate nuevo, paso a paso. De calabaza: yerba usada bien húmeda y, a las 24 horas, raspar y secar. De algarrobo: grasa, reposo y yerba húmeda.",
    /** Un HowTo por cada mate que la guia sabe curar. La clave es el
     *  `data-mate` de sus pasos: si el cliente suma un mate y no se lo nombra
     *  aca, el build falla en vez de publicar un HowTo sin nombre. */
    recorridos: {
      calabaza: "Cómo curar un mate de calabaza",
      algarrobo: "Cómo curar un mate de algarrobo",
    },
    /** La imagen que se ve al compartir el enlace. El titulo va partido como
     *  el del cliente, que pone la segunda mitad en otro tono: a 92px, "de
     *  calabaza o de algarrobo" no entra en un renglon y partia en tres. */
    og: {
      linea: "Cómo curar",
      bajada: "tu mate",
      pie: "De calabaza o de algarrobo, paso a paso y con el mate en 3D",
    },
  },
  cebar: {
    ruta: "/como-cebar-un-mate",
    nombre: "Cómo cebar un buen amargo",
    titulo: "Cómo cebar un mate amargo, paso a paso",
    descripcion:
      "Cómo cebar un mate amargo: yerba hasta tres cuartas partes, la montañita, un poco de agua fría, la bombilla y agua a 70 u 80 °C, nunca hervida.",
    /** Esta guia tiene un solo recorrido y sus pasos no llevan `data-mate`. */
    recorridos: { "": "Cómo cebar un mate amargo" },
    og: { linea: "Cómo cebar", bajada: "un buen amargo", pie: "Guía paso a paso, con el mate en 3D" },
  },
} as const;

export type IdGuia = keyof typeof GUIAS;

/** En el orden en que se leen: primero se cura, despues se ceba. */
export const ORDEN_GUIAS: IdGuia[] = ["curar", "cebar"];
