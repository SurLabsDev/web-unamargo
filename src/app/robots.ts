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
      //
      // Van los de busqueda y los que leen la pagina cuando alguien le
      // pregunta al asistente (`*-SearchBot`, `*-User`), no solo los de
      // entrenamiento: son justamente los que citan.
      //
      // OJO al agregar reglas: un rastreador que encuentra un grupo con su
      // nombre usa SOLO ese grupo e ignora el de `*`. Un `disallow` que se
      // sume arriba no les llega a estos; hay que repetirlo aca.
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "PerplexityBot",
          "Perplexity-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "Claude-User",
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
