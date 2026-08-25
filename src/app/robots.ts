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
    rules: [
      { userAgent: "*", allow: "/" },
      // Los rastreadores de IA se nombran explicitamente, aunque `*` ya los
      // cubra: dejarlo escrito evita que alguien "endurezca" el robots mas
      // adelante y los bloquee sin darse cuenta. Un asistente que no puede
      // leer la pagina no la puede citar, y para un negocio que vive de que lo
      // recomienden, aparecer cuando alguien pregunta "donde compro un mate en
      // Montevideo" vale mas que la visita que cuesta.
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
          "Google-Extended",
        ],
        allow: "/",
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
