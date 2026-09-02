import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { SITE } from "@/lib/site";
import { Instagram } from "./Sociales";

/** Copia textual del cliente. Los rotulos chicos sobre el titular son parte de
 *  su diseño y los quiso asi. */
export function Nosotros() {
  return (
    <section id="nosotros" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="reveal lg:col-span-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-tinta-suave">
            Servicios
          </p>
          <h2 className="type-display text-[clamp(2.5rem,6vw,4.5rem)]">
            ¿Qué hacemos?
          </h2>
        </div>

        <div className="reveal lg:col-span-6 lg:col-start-7" style={{ "--d": "120ms" } as React.CSSProperties}>
          <p className="type-body text-lg leading-relaxed text-tinta-media">
            En Un Amargo nos dedicamos a acercarte mates y accesorios
            seleccionados con dedicación y pasión. Más que vender productos,
            queremos fomentar la cultura del mate, el encuentro y la conexión
            entre personas.
          </p>
          <p className="type-body mt-5 text-lg leading-relaxed text-tinta-media">
            Buscamos que cada mate que llevés a casa sea un compañero fiel en
            tus momentos de pausa, charla y tradición.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#tienda"
              className="group inline-flex items-center gap-2 rounded-pill bg-tinta px-6 py-3 text-sm font-semibold text-papel transition-transform duration-300 hover:scale-[1.03]"
            >
              Ver colección
              <ArrowRight size={14} weight="bold" className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
            {/* Este boton abria WhatsApp. WhatsApp quedo solo para los pedidos
                ya armados, que se mandan desde el cajon del carrito, asi que las
                dudas sueltas van por Instagram. */}
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-pill border border-linea px-6 py-3 text-sm font-semibold transition-colors duration-300 hover:border-tinta"
            >
              <Instagram className="h-3.5 w-3.5" />
              Escribinos por Instagram
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
