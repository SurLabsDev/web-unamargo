import type { ReactNode } from "react";
import { Question, EnvelopeSimple, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { SITE } from "@/lib/site";
import { Instagram } from "./Sociales";

/** Aca habia un formulario que armaba un mensaje y abria WhatsApp.
 *
 *  WhatsApp quedo reservado para los pedidos ya armados, que salen del cajon
 *  del carrito con el detalle adentro. Una consulta suelta entrando por el
 *  mismo chat rompe eso: mezcla preguntas con pedidos en la misma bandeja y
 *  obliga a contestar a mano lo que la pagina ya contesta sola. Por eso la
 *  seccion conserva su lugar y su forma, pero dejo de pedir datos: ahora es un
 *  indice de donde encontrar respuesta, ordenado por lo que cuesta atender cada
 *  via. Primero las preguntas frecuentes, que no cuestan nada; despues
 *  Instagram, que es donde el cliente ya conversa; y el mail al final, para lo
 *  que no entra en un mensaje directo.
 *
 *  Sin formulario no queda estado ni ventana bloqueada que vigilar, asi que la
 *  seccion volvio a ser un Server Component. */

type Salida = {
  href: string;
  icono: ReactNode;
  titulo: string;
  detalle: string;
  /** Las redes abren en pestaña nueva; el ancla y el mailto, no. */
  externo?: boolean;
};

/* El icono va armado y no como componente porque son de dos familias: las
   marcas traen su propio dibujo y el resto es Phosphor. */
const SALIDAS: Salida[] = [
  {
    href: "#preguntas",
    icono: <Question size={16} weight="bold" />,
    titulo: "Preguntas frecuentes",
    detalle: "Envíos, retiros, pagos y personalizados, respondidos más arriba.",
  },
  {
    href: SITE.instagram,
    icono: <Instagram className="h-3.5 w-3.5" />,
    titulo: "Instagram",
    detalle: `Escribinos por mensaje directo a ${SITE.instagramUsuario}.`,
    externo: true,
  },
  {
    href: `mailto:${SITE.email}`,
    icono: <EnvelopeSimple size={16} />,
    titulo: "Mail",
    detalle: SITE.email,
  },
];

/* Derivado y no escrito a mano: decia "Tres formas" al lado de una lista que
   se recorre con `.map()`, o sea que el dia que se sume o se saque una salida
   el numero pasa a mentir sin que nada falle. Es exactamente lo que le paso al
   texto de envios cuando los retiros bajaron de tres a uno.

   El singular esta contemplado porque el bug que se esta arreglando es
   justamente que la lista cambie: con una sola salida, "1 formas" seria peor
   que el numero viejo. */
const FORMAS = `${SALIDAS.length} ${SALIDAS.length === 1 ? "forma" : "formas"} de resolverla`;

export function Contacto() {
  return (
    <section id="contacto" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="reveal lg:col-span-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-tinta-suave">
            Contacto
          </p>
          <h2 className="type-display text-[clamp(2.5rem,6vw,4.5rem)]">
            Trabajá con nosotros
          </h2>
          <p className="type-body mt-6 text-lg leading-relaxed text-tinta-media">
            ¿Sos creador de contenido y te apasiona el mate? Queremos conocerte.
            Buscamos personas creativas que quieran sumarse para compartir la
            cultura del mate, sus historias y tradiciones.
          </p>
          <p className="type-body mt-5 leading-relaxed text-tinta-media">
            Si te gusta contar momentos reales, mostrar la pasión por el mate y
            conectar con una comunidad que valora lo simple y verdadero, este es
            tu lugar. Trabajemos juntos para que cada mate llegue más lejos.
          </p>

          <p className="mt-8 text-sm text-tinta-suave">Mostranos lo que hacés:</p>
          <a
            href={`mailto:${SITE.email}?subject=${encodeURIComponent("Quiero sumarme")}`}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-pill bg-tinta px-6 py-3 text-sm font-semibold text-papel transition-transform duration-300 hover:scale-[1.03]"
          >
            <EnvelopeSimple size={16} />
            Sumate
          </a>
        </div>

        <div
          className="reveal flex flex-col rounded-[14px] border border-linea bg-papel p-6 sm:p-8 lg:col-span-6 lg:col-start-7"
          style={{ "--d": "120ms" } as React.CSSProperties}
        >
          <div className="flex items-baseline justify-between gap-4 border-b border-linea pb-4">
            <p className="text-sm font-semibold">¿Tenés una duda?</p>
            <p className="text-xs text-tinta-suave">{FORMAS}</p>
          </div>

          <ul className="flex flex-col">
            {SALIDAS.map(({ href, icono, titulo, detalle, externo }) => (
              <li key={titulo}>
                <a
                  href={href}
                  {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex items-center gap-4 border-b border-linea py-4 last:border-b-0"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-humo transition-colors duration-200 group-hover:bg-tinta group-hover:text-papel">
                    {icono}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{titulo}</span>
                    {/* `wrap-anywhere` esta por el mail, y la eleccion de esa
                        utilidad y no otra es lo unico que arregla el problema.

                        "unamargo.info@gmail.com" es UNA palabra: ni el arroba
                        ni los puntos habilitan un corte de linea, asi que mide
                        170px enteros e indivisibles. La tarjeta es un item de
                        grid, y un item de grid no puede achicarse por debajo de
                        su ancho min-content: a 320px la pista mide 280px pero
                        el mail le daba un min-content de 308px, la tarjeta se
                        estiraba a 308 y sobresalia 8px del viewport. Eso le
                        metia scroll horizontal a TODA la pagina, que es el peor
                        sintoma posible porque el desborde aparece lejos de
                        donde se lo causa.

                        `break-words` (overflow-wrap: break-word) NO alcanza y
                        se midio: parte la palabra cuando no entra en su
                        renglon, pero el min-content se sigue calculando como si
                        fuera incortable, asi que la tarjeta se estira igual y
                        el scroll queda. Medido a 320px: scrollWidth 328 con
                        `break-words`, identico a no poner nada. `wrap-anywhere`
                        (overflow-wrap: anywhere) si cuenta esos cortes al
                        calcular el min-content: la tarjeta vuelve a 280 y el
                        mail cae en dos renglones. scrollWidth 320 = clientWidth.

                        No `break-all`, que corta entre dos letras cualesquiera:
                        esta clase la comparten los tres detalles y los otros
                        dos son frases normales. Con `anywhere` solo se parte la
                        palabra que no entra, y a 320px la mas ancha de esas
                        frases mide 99px contra una columna de 142, o sea que no
                        se parte ninguna. Y no `truncate`, porque el mail no es
                        una etiqueta sino el dato: hay que poder leerlo y
                        copiarlo entero. */}
                    <span className="block wrap-anywhere text-sm text-tinta-media">
                      {detalle}
                    </span>
                  </span>
                  <ArrowUpRight
                    size={16}
                    weight="bold"
                    className="shrink-0 text-tinta-suave transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </a>
              </li>
            ))}
          </ul>

          {/* Lo aclara de frente para que nadie salga a buscar el numero: el
              WhatsApp existe, pero se llega por el pedido, no antes. */}
          <p className="mt-6 text-xs leading-relaxed text-tinta-suave">
            Los pedidos se cierran por WhatsApp: armás el carrito en la tienda y
            se manda desde ahí, con el detalle adentro.
          </p>
        </div>
      </div>
    </section>
  );
}
