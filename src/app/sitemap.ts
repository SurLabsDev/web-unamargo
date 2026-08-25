import type { MetadataRoute } from "next";
import { SE_INDEXA, SITE } from "@/lib/site";

/** Una sola URL, pero el sitemap igual sirve: le da al buscador una fecha de
 *  ultima modificacion y un lugar donde mirar primero. En los hosts que no se
 *  indexan se devuelve vacio, para no ofrecer un mapa de algo que pedimos que
 *  no rastreen. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!SE_INDEXA) return [];
  return [
    {
      url: SITE.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
