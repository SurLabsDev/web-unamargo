import { ArrowDown, InstagramLogo, SpotifyLogo } from "@phosphor-icons/react/dist/ssr";
import { SITE } from "@/lib/site";

/** El hero es el del cliente, palabra por palabra: tres lineas, su parrafo y
 *  sus redes. La entrada se escalona con --d, sin JS. */
export function Hero() {
  return (
    <section
      id="top"
      className="flex min-h-[100svh] flex-col justify-center px-5 pb-10 pt-28 sm:px-8 lg:px-12"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <h1
          className="type-display entra max-w-[15ch] text-[clamp(3.25rem,10vw,7.5rem)]"
          style={{ "--d": "60ms" } as React.CSSProperties}
        >
          Un amargo,
          <br />
          sin vueltas,
          <br />
          sin azúcar.
        </h1>

        <p
          className="type-body entra mt-7 max-w-[46ch] text-[clamp(0.95rem,1.6vw,1.0625rem)] leading-relaxed text-tinta-media"
          style={{ "--d": "180ms" } as React.CSSProperties}
        >
          Como a muchos, el mate nos acompaña desde siempre. Es parte del día,
          del espacio compartido, del rato tranquilo. Esta marca le da un lugar
          a ese ritual.
        </p>

        <div
          className="entra mt-9 flex max-w-[900px] flex-wrap items-center justify-between gap-5"
          style={{ "--d": "300ms" } as React.CSSProperties}
        >
          <a
            href="#tienda"
            className="group inline-flex items-center gap-2.5 rounded-pill bg-tinta px-7 py-3.5 text-sm font-semibold text-papel transition-transform duration-300 hover:scale-[1.03] active:scale-[0.99]"
          >
            Ver productos
            <ArrowDown
              size={15}
              weight="bold"
              className="transition-transform duration-300 group-hover:translate-y-0.5"
            />
          </a>

          <div className="flex items-center gap-2.5">
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram ${SITE.instagramUsuario}`}
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-tinta text-papel transition-transform duration-300 hover:scale-110"
            >
              <InstagramLogo size={17} weight="fill" />
            </a>
            <a
              href={SITE.spotify}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Nuestra playlist en Spotify"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-tinta text-papel transition-transform duration-300 hover:scale-110"
            >
              <SpotifyLogo size={17} weight="fill" />
            </a>
            <span className="ml-1 hidden text-sm text-tinta-suave sm:inline">
              {SITE.instagramUsuario}
            </span>
          </div>
        </div>
      </div>

    </section>
  );
}
