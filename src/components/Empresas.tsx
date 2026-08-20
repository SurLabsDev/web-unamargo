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

        <div className="reveal relative aspect-[4/3] overflow-hidden rounded-foto bg-humo lg:col-span-6 lg:col-start-7" style={{ "--d": "120ms" } as React.CSSProperties}>
          <Image
            src="/secciones/empresas.jpg"
            alt="Pedidos por cantidad para empresas"
            fill
            sizes="(max-width: 1024px) 100vw, 48vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
