import type { MetadataRoute } from "next";
import { GUIAS, ORDEN_GUIAS } from "@/lib/guias";
import { fechaDeGuia } from "@/guias/servir";
import { SE_INDEXA, SITE } from "@/lib/site";

/** La home y las dos guias. En los hosts que no se indexan se devuelve vacio,
 *  para no ofrecer un mapa de algo que pedimos que no rastreen.
 *
 *  `lastModified` solo va donde hay una fecha que es verdad. La home tenia
 *  `new Date()`, que cambia en cada build aunque no cambie nada: le dice al
 *  buscador que todo es nuevo siempre, y el buscador aprende a no creerle. Su
 *  contenido cambia con el catalogo del ERP, que no tiene una fecha que leer
 *  desde aca, asi que va sin fecha. Las guias si la tienen: es la de la ultima
 *  vez que cambio la guia, que escribe el importador en la plantilla.
 *
 *  Las URLs se arman igual que el canonical de cada pagina: tienen que ser
 *  exactamente las mismas. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!SE_INDEXA) return [];
  return [
    {
      url: SITE.url,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...ORDEN_GUIAS.map((id) => ({
      url: `${SITE.url}${GUIAS[id].ruta}`,
      lastModified: fechaDeGuia(id),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
