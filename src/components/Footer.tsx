import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { SITE } from "@/lib/site";
import { Instagram, Spotify, Pinterest } from "./Sociales";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-tinta px-5 py-16 text-papel sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <Logo className="h-12 w-auto" />
            <p className="type-body mt-5 max-w-[34ch] text-papel/55">
              Mates, bombillas y accesorios en {SITE.ciudad}, {SITE.pais}.
            </p>
          </div>

          {/* Aca habia un enlace a WhatsApp con el numero. El WhatsApp quedo
              reservado para los pedidos ya armados, que salen del cajon del
              carrito, asi que el pie deja el mail y las redes. El numero
              tampoco va como texto suelto: escrito invita a la consulta suelta
              igual que un enlace. */}
          <div className="flex flex-col gap-3 md:items-end">
            <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-2 text-papel/60 transition-colors hover:text-papel">
              <EnvelopeSimple size={16} />
              {SITE.email}
            </a>
            <div className="mt-2 flex gap-2.5">
              <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-pill bg-papel/10 transition-colors hover:bg-papel/20">
                <Instagram className="h-3.5 w-3.5" />
              </a>
              <a href={SITE.spotify} target="_blank" rel="noopener noreferrer" aria-label="Playlist en Spotify" className="flex h-9 w-9 items-center justify-center rounded-pill bg-papel/10 transition-colors hover:bg-papel/20">
                <Spotify className="h-3.5 w-3.5" />
              </a>
              <a href={SITE.pinterest} target="_blank" rel="noopener noreferrer" aria-label="Pinterest" className="flex h-9 w-9 items-center justify-center rounded-pill bg-papel/10 transition-colors hover:bg-papel/20">
                <Pinterest className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-papel/15 pt-7 text-sm text-papel/45 sm:flex-row sm:items-center sm:justify-between">
          <p>{new Date().getFullYear()} {SITE.nombre}</p>
          <a href="https://www.surlabs.tech" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-papel">
            Sitio por Surlabs
          </a>
        </div>
      </div>
    </footer>
  );
}
