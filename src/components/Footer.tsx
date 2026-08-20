import { WhatsappLogo, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { SITE, linkWhatsApp } from "@/lib/site";

/** Cierra en el mismo verde profundo con el que abre el hero: los dos extremos
 *  sostienen la pagina y todo lo del medio respira en claro. */
export function Footer() {
  return (
    <footer className="bg-hondo px-5 py-14 text-hueso lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-2xl font-semibold tracking-tight">Un Amargo</p>
            <p className="type-body mt-2 max-w-[38ch] text-hueso-medio">
              Mates, bombillas y accesorios en {SITE.ciudad}, {SITE.pais}.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <a
              href={linkWhatsApp("Hola! Tengo una consulta.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-hueso-medio transition-colors hover:text-hueso"
            >
              <WhatsappLogo size={17} weight="fill" />
              {SITE.whatsappLegible}
            </a>
            <a
              href={`mailto:${SITE.email}`}
              className="inline-flex items-center gap-2 text-hueso-medio transition-colors hover:text-hueso"
            >
              <EnvelopeSimple size={17} />
              {SITE.email}
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-hueso/15 pt-6 text-sm text-hueso-medio sm:flex-row sm:items-center sm:justify-between">
          <p>
            {new Date().getFullYear()} {SITE.nombre}
          </p>
          <a
            href="https://www.surlabs.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-hueso"
          >
            Sitio por Surlabs
          </a>
        </div>
      </div>
    </footer>
  );
}
