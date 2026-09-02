import Image from "next/image";
import { SITE } from "@/lib/site";
import { Instagram } from "./Sociales";

/** Las dos fotos de grabado son las que mando el cliente. Van desfasadas en
 *  vertical para que el bloque no se lea como dos cuadros pegados. */
export function Personalizados() {
  return (
    <section
      id="personalizados"
      className="scroll-mt-24 bg-humo px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
    >
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="reveal grid grid-cols-2 gap-4 lg:col-span-6">
          <div className="relative aspect-[3/4] overflow-hidden rounded-foto bg-papel">
            <Image
              src="/secciones/personalizado-1.jpg"
              alt="Mate con grabado láser"
              fill
              sizes="(max-width: 1024px) 45vw, 22vw"
              className="object-cover"
            />
          </div>
          <div className="relative mt-10 aspect-[3/4] overflow-hidden rounded-foto bg-papel">
            <Image
              src="/secciones/personalizado-2.jpg"
              alt="Virola trabajada a mano"
              fill
              sizes="(max-width: 1024px) 45vw, 22vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="reveal lg:col-span-5 lg:col-start-8" style={{ "--d": "120ms" } as React.CSSProperties}>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-tinta-suave">
            Servicio
          </p>
          {/* 4.6vw y no 6vw como el resto de los titulos: "Personalizados" es
              una sola palabra de catorce letras y no puede cortar, asi que a 6vw
              se salia de su columna de cinco doceavos y le metia scroll
              horizontal a TODA la pagina. Medido: 33px de desborde a 1024,
              34px a 1100 y 13px a 1250; de 1300 para arriba la columna ya da.
              El desborde horizontal es el peor sintoma posible porque no se ve
              de donde viene. */}
          <h2 className="type-display text-[clamp(2.5rem,4.6vw,4.5rem)]">
            Personalizados
          </h2>
          <p className="type-body mt-6 text-lg leading-relaxed text-tinta-media">
            Hacemos grabados láser en mates y trabajos artesanales en virolas.
            Cada pieza puede llevar un nombre, una fecha, un símbolo o lo que
            quieras. Ideal para regalar o para hacer tuyo algo que ya usás.
          </p>
          <p className="type-body mt-5 leading-relaxed text-tinta-media">
            Trabajamos con tiempo y cuidado. Coordinamos por Instagram para
            entender bien qué buscás antes de arrancar.
          </p>
          {/* Antes abria WhatsApp, y en verde porque ese verde es el de
              WhatsApp. Un personalizado se define charlando antes de que haya
              pedido que armar, asi que ahora va por Instagram, y con el negro
              de la marca: el verde sigue reservado para WhatsApp y Spotify. */}
          <a
            href={SITE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex items-center gap-2 rounded-pill bg-tinta px-7 py-3.5 text-sm font-semibold text-papel transition-transform duration-300 hover:scale-[1.03]"
          >
            <Instagram className="h-3.5 w-3.5" />
            Consultar por Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
