import { ArrowDown } from "@phosphor-icons/react/dist/ssr";
import { SITE } from "@/lib/site";
import { Instagram, Spotify, Pinterest } from "./Sociales";

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
          {/* El salto de linea es visual. Sin el espacio explicito, el texto
              que extraen los buscadores y los lectores de pantalla sale pegado:
              "Un amargo,sin vueltas,sin azucar.". */}
          Un amargo,{" "}
          <br />
          sin vueltas,{" "}
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
          {/* Las guias van aca, al lado de "Ver productos": el cliente pidio
              que se vean rapido ("es un distintivo que no he visto") y el
              dueño, que queden detras de un boton. Lleva a la seccion con las
              dos y no a una sola, porque desde aca no se sabe si quien entra
              tiene el mate por curar o ya lo esta cebando.
              Es el `.btn-outline` de la demo del cliente: borde negro de 1.5px
              que se llena al pasar. El borde es un ring hacia adentro y no un
              `border`, para que mida lo mismo que el boton lleno de al lado. */}
          <div className="flex flex-wrap items-center gap-3">
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
            <a
              href="#guias"
              className="inline-flex items-center rounded-pill px-7 py-3.5 text-sm font-semibold ring-[1.5px] ring-tinta ring-inset transition-colors duration-300 hover:bg-tinta hover:text-papel"
            >
              Cómo curar y cebar
            </a>
          </div>

          {/* Las tres redes del archivo del cliente, en su orden. Pinterest
              estaba en el original y se habia caido de esta version. */}
          <div className="flex items-center gap-2.5">
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram ${SITE.instagramUsuario}`}
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-tinta text-papel transition-transform duration-300 hover:scale-110"
            >
              <Instagram className="h-3.5 w-3.5" />
            </a>
            <a
              href={SITE.spotify}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Nuestra playlist en Spotify"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-tinta text-papel transition-transform duration-300 hover:scale-110"
            >
              <Spotify className="h-3.5 w-3.5" />
            </a>
            <a
              href={SITE.pinterest}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Nuestro Pinterest"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-tinta text-papel transition-transform duration-300 hover:scale-110"
            >
              <Pinterest className="h-3.5 w-3.5" />
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
