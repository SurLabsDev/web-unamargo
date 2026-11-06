import type { Metadata } from "next";
import { SITE } from "@/lib/site";

/** Lo que el Open Graph de toda pagina del sitio dice igual.
 *
 *  Vive aparte porque Next no mezcla el `openGraph` campo por campo: una
 *  pagina que define el suyo REEMPLAZA entero el del layout. La home tiene que
 *  definirlo para declarar su `og:url`; si copiara estos campos a mano, el dia
 *  que cambie uno, el de la home y el del layout quedan distintos sin que nada
 *  avise. Es lo que indica la guia de metadatos de Next para compartir campos
 *  anidados entre segmentos.
 *
 *  Sin `url`: cada pagina declara la suya (ver `src/app/layout.tsx`).
 *
 *  Sin `title` ni `description` a proposito: vacios, Next los completa con el
 *  title y la description de cada pagina. Escritos aca, toda pagina que no los
 *  pisara se compartiria por WhatsApp con el titulo y la bajada de la portada.
 *
 *  Sin `images`: la imagen sale de `src/app/opengraph-image.tsx`, y Next la
 *  agrega sola, con sus medidas, a toda pagina cuyo Open Graph no nombre otra:
 *  la home y la 404, que hereda este del layout. */
export const OPEN_GRAPH_BASE = {
  type: "website",
  locale: "es_UY",
  siteName: SITE.nombre,
} satisfies Metadata["openGraph"];
