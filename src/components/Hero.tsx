import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Producto } from "@/lib/catalog";

/** Campo verde profundo. Es el unico cambio de tema de la pagina: de aca para
 *  abajo la tienda respira en claro, para que comprar sea comodo. */
export function Hero({ destacado }: { destacado: Producto | null }) {
  const foto = destacado?.images[0] ?? null;

  return (
    <section
      id="top"
      className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden bg-hondo pt-16 pb-8 text-hueso sm:pt-20 sm:pb-12"
    >
      {/* La luz cae desde arriba a la izquierda, como sobre una mesa. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-verde/25 blur-[130px]"
      />

      <div className="relative mx-auto grid w-full max-w-[1400px] flex-1 content-center items-center gap-7 px-5 sm:gap-10 lg:grid-cols-12 lg:gap-8 lg:px-8">
        <div className="lg:col-span-6 xl:col-span-5">
          <h1 className="type-display text-[clamp(2.75rem,8vw,5.5rem)] font-semibold">
            Un amargo,
            <br />
            sin vueltas.
          </h1>
          <p className="type-body mt-5 max-w-[44ch] text-base text-hueso-medio sm:text-lg">
            Mates, bombillas y accesorios elegidos uno por uno.
            Coordinamos la entrega por WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-7">
            <a
              href="#tienda"
              className="group inline-flex items-center gap-2 rounded-brand bg-hueso px-6 py-3.5 font-semibold text-hondo transition-colors hover:bg-white"
            >
              Ver la tienda
              <ArrowRight
                size={17}
                weight="bold"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </a>
            <a
              href="#personalizados"
              className="rounded-brand border border-hueso/25 px-6 py-3.5 font-semibold text-hueso transition-colors hover:border-hueso/60"
            >
              Personalizados
            </a>
          </div>
        </div>

        {foto && destacado && (
          <div className="relative lg:col-span-6 lg:col-start-7 xl:col-span-7">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-brand bg-white sm:aspect-[2/1] lg:aspect-auto lg:h-[min(64vh,620px)]">
              <Image
                src={foto}
                alt={destacado.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
