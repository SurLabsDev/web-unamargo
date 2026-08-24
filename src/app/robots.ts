import type { MetadataRoute } from "next";
import { SE_INDEXA, SITE } from "@/lib/site";

/** El `noindex` de las metadatas es el que de verdad saca una pagina del
 *  indice; esto es la segunda barrera, para que ni siquiera la rastreen. Las
 *  dos salen de la misma constante, asi que no pueden discrepar. */
export default function robots(): MetadataRoute.Robots {
  if (!SE_INDEXA) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    host: SITE.url,
  };
}
