import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { SITE } from "@/lib/site";

const QUE_HACEMOS = [
  "Grabado láser con el logo de la empresa",
  "Virolas personalizadas pieza por pieza",
  "Packaging especial para regalo o evento",
];

/** Franja compacta: texto a la izquierda, lo que entra en el trabajo a la
 *  derecha. No lleva foto a proposito, para no encadenar tres secciones
 *  seguidas con la misma division de imagen y texto. */
export function Empresas() {
  return (
    <section
      id="empresas"
      className="scroll-mt-20 border-y border-tinta/10 bg-papel-hondo py-20 lg:py-24"
    >
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="reveal lg:col-span-6">
          <h2 className="type-display text-[clamp(1.75rem,4vw,3rem)] font-semibold">
            Pedidos para empresas
          </h2>
          <p className="type-body mt-5 max-w-[50ch] leading-relaxed text-tinta-media">
            Si buscas mates personalizados para tu equipo o un evento,
            trabajamos con pedidos en cantidad. Contanos qué necesitás y te
            armamos una propuesta a medida.
          </p>
          <a
            href={`mailto:${SITE.email}?subject=${encodeURIComponent("Pedido para empresa")}`}
            className="mt-7 inline-flex items-center gap-2 rounded-brand border border-tinta/20 px-5 py-3 font-semibold transition-colors hover:border-tinta/50"
          >
            <EnvelopeSimple size={18} />
            {SITE.email}
          </a>
        </div>

        <ul className="reveal divide-y divide-tinta/10 lg:col-span-5 lg:col-start-8">
          {QUE_HACEMOS.map((q) => (
            <li key={q} className="py-4 text-lg leading-snug first:pt-0 last:pb-0">
              {q}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
