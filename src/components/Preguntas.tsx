import { FAQ } from "@/lib/faq";

/**
 * Las preguntas, abiertas y no en un acordeon.
 *
 * Dos razones, y las dos importan mas que el ahorro de espacio:
 *  - El texto ES el activo. Es lo que se indexa y lo que un asistente puede
 *    citar cuando alguien pregunta "hacen envios en Montevideo". Escondido
 *    detras de un clic sigue estando en el HTML, pero se lee peor y hay una
 *    discusion vieja sobre cuanto pesa el contenido colapsado.
 *  - Quien llega buscando "cuanto sale el envio" quiere la respuesta, no un
 *    titulo para desplegar.
 *
 * El contenido sale de `faq.ts`, el mismo archivo que alimenta el marcado
 * `FAQPage`. No pueden divergir.
 */
export function Preguntas() {
  return (
    <section
      id="preguntas"
      className="scroll-mt-24 border-t border-linea px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
    >
      <div className="mx-auto max-w-[1400px]">
        <h2 className="type-display max-w-[14ch] text-[clamp(2.2rem,6vw,4.5rem)]">
          Preguntas
        </h2>

        <dl className="mt-12 grid gap-x-16 gap-y-10 md:grid-cols-2">
          {FAQ.map((f) => (
            <div key={f.pregunta} className="reveal">
              <dt className="text-lg font-semibold tracking-tight">
                {f.pregunta}
              </dt>
              <dd className="type-body mt-2 max-w-[52ch] text-sm leading-relaxed text-tinta-media">
                {f.respuesta}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
