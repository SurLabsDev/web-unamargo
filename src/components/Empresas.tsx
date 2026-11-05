import Image from "next/image";
import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { SITE } from "@/lib/site";

export function Empresas() {
  return (
    <section id="empresas" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="reveal lg:col-span-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-tinta-suave">
            B2B
          </p>
          <h2 className="type-display text-[clamp(2.5rem,6vw,4.5rem)]">
            Trabajo para empresas
          </h2>
          <p className="type-body mt-6 text-lg leading-relaxed text-tinta-media">
            Si buscás mates personalizados para tu empresa, equipo o evento,
            trabajamos con pedidos en cantidad. Grabado láser con logo, virolas
            personalizadas o packaging especial según lo que necesites.
          </p>
          <p className="type-body mt-5 leading-relaxed text-tinta-media">
            Escribinos por mail, contanos qué necesitás y te armamos una
            propuesta a medida.
          </p>
          <a
            href={`mailto:${SITE.email}?subject=${encodeURIComponent("Pedido para empresa")}`}
            className="mt-9 inline-flex items-center gap-2 rounded-pill bg-tinta px-7 py-3.5 text-sm font-semibold text-papel transition-transform duration-300 hover:scale-[1.03]"
          >
            <EnvelopeSimple size={17} />
            Escribirnos por mail
          </a>
        </div>

        {/* La foto es 4:5 vertical (1120x1400) y vivia en un marco 4:3 apaisado
            con `object-cover`. Para llenarlo, el navegador la agrandaba hasta
            el ancho y le cortaba el 40% de la altura: por eso el cliente la veia
            cuadrada, con zoom y sin entrar entera. Ahora el marco es la foto:
            `width` y `height` le dan su proporcion y `h-auto` la respeta, asi
            que se ve entera en cualquier ancho.

            Debajo de lg va con tope de ancho porque ahi la columna es toda la
            pantalla: a lo ancho de una tablet, una 4:5 mide 880px de alto a
            768 y 1200 a 1023, mas alta que la pantalla apaisada. Con el tope
            queda en 640. Desde lg manda la columna, como en Personalizados. */}
        <div className="reveal lg:col-span-6 lg:col-start-7" style={{ "--d": "120ms" } as React.CSSProperties}>
          <Image
            src="/secciones/empresas.jpg"
            alt="Pedidos por cantidad para empresas"
            width={1120}
            height={1400}
            sizes="(min-width: 1024px) 45vw, (min-width: 640px) 512px, 100vw"
            className="h-auto w-full max-w-lg rounded-foto bg-humo lg:max-w-none"
          />
        </div>
      </div>
    </section>
  );
}
