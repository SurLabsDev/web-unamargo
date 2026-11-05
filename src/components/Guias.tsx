import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { GUIAS, type IdGuia } from "@/lib/guias";

/** Lo que dice cada tarjeta ademas del nombre de la guia.
 *
 *  Sin cantidad de pasos a proposito: los pasos los escribe el cliente en su
 *  guia, y un "5 pasos" escrito aca quedaria mintiendo el dia que sume uno. Es
 *  lo que ya le paso al texto de envios cuando los retiros bajaron de tres a
 *  uno. */
const TARJETAS: { id: IdGuia; rotulo: string; bajada: string }[] = [
  {
    id: "curar",
    rotulo: "Calabaza o algarrobo",
    bajada: "Cada mate tiene su curado. Elegí el tuyo y seguí los pasos.",
  },
  {
    id: "cebar",
    rotulo: "El ritual",
    bajada: "De la yerba a la primera ronda, cada cosa en su orden.",
  },
];

/**
 * Las dos guias interactivas del cliente, cada una con su boton grande.
 *
 * Va antes de las preguntas porque es el orden en que pasan las cosas: se
 * elige el mate, llega, se cura y se ceba. Y las dos primeras dudas que llegan
 * despues de una compra son justo esas.
 *
 * Las tarjetas son los botones de zona de la demo del cliente: negras, con el
 * rotulo chico en mayusculas arriba. Son enlaces comunes y no `next/link`: la
 * guia es un HTML aparte, servido por una ruta, y no una pagina de React a la
 * que se pueda navegar sin recargar.
 */
export function Guias() {
  return (
    <section id="guias" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-[1400px]">
        {/* La misma grilla que "¿Qué hacemos?": titulo a la izquierda y texto a
            la derecha desde lg. En una sola columna angosta el titulo partia en
            tres renglones y dejaba media pantalla vacia. */}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="reveal lg:col-span-6">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-tinta-suave">
              Guías
            </p>
            <h2 className="type-display text-[clamp(2.5rem,6vw,4.5rem)]">
              Antes del primer amargo
            </h2>
          </div>
          <p
            className="reveal type-body max-w-[46ch] text-lg leading-relaxed text-tinta-media lg:col-span-5 lg:col-start-8"
            style={{ "--d": "120ms" } as React.CSSProperties}
          >
            Un mate nuevo se cura antes de estrenarlo, y un buen amargo tiene su
            ritual. Las dos guías van paso a paso, con un mate en 3D que hace
            cada cosa mientras bajás.
          </p>
        </div>

        <div className="mt-12 grid gap-3 md:grid-cols-2">
          {TARJETAS.map((t, i) => (
            <a
              key={t.id}
              href={GUIAS[t.id].ruta}
              className="reveal group flex min-h-[19rem] flex-col justify-between gap-12 rounded-[14px] bg-tinta p-7 text-papel transition-colors duration-300 hover:bg-[#262626] sm:p-9"
              style={{ "--d": `${i * 120}ms` } as React.CSSProperties}
            >
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-papel/55">
                {t.rotulo}
              </span>
              <span>
                <span className="type-display block text-[clamp(2.25rem,4.4vw,3.5rem)]">
                  {GUIAS[t.id].nombre}
                </span>
                <span className="type-body mt-4 block max-w-[36ch] leading-relaxed text-papel/65">
                  {t.bajada}
                </span>
                <span className="mt-8 inline-flex items-center gap-2 rounded-pill bg-papel px-6 py-3 text-sm font-semibold text-tinta transition-transform duration-300 group-hover:scale-[1.03]">
                  Ver la guía
                  <ArrowRight
                    size={14}
                    weight="bold"
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  />
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
