import Image from "next/image";
import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { linkWhatsApp } from "@/lib/site";

export function Personalizados({ foto }: { foto: string | null }) {
  return (
    <section id="personalizados" className="scroll-mt-20 bg-papel py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 lg:grid-cols-12 lg:gap-16 lg:px-8">
        {foto && (
          <div className="reveal relative aspect-[4/3] overflow-hidden rounded-brand bg-papel-hondo lg:col-span-6 lg:aspect-square">
            <Image
              src={foto}
              alt="Mate con grabado laser"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="reveal lg:col-span-6">
          <h2 className="type-display text-[clamp(2rem,5vw,3.5rem)] font-semibold">
            Personalizados
          </h2>
          <p className="type-body mt-5 max-w-[52ch] text-lg leading-relaxed text-tinta-media">
            Hacemos grabados láser en mates y trabajos artesanales en virolas.
            Cada pieza puede llevar un nombre, una fecha, un símbolo o lo que
            quieras.
          </p>
          <p className="type-body mt-4 max-w-[52ch] leading-relaxed text-tinta-media">
            Trabajamos con tiempo y cuidado. Coordinamos por WhatsApp para
            entender bien qué buscás antes de arrancar.
          </p>
          <a
            href={linkWhatsApp(
              "Hola! Quiero consultar por un mate personalizado.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-brand bg-verde px-6 py-3.5 font-semibold text-hueso transition-colors hover:bg-verde-vivo"
          >
            <WhatsappLogo size={19} weight="fill" />
            Consultar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
