/** Datos del negocio. Todos salen de la demo que armo el cliente, ninguno
 *  esta inventado: el numero, el mail y las zonas son los suyos. */
export const SITE = {
  nombre: "Un Amargo",
  descripcion:
    "Mates, bombillas y accesorios seleccionados en Montevideo. Grabado láser y trabajos en virola. Coordinamos entrega por WhatsApp.",
  /** URL canonica. Hoy es la de Vercel porque todavia no hay dominio propio:
   *  poner uno que no existe rompe el canonical y las Open Graph, que resolveran
   *  contra un host que no responde. Cuando se compre el dominio se cambia ACA
   *  y lo siguen las metadatas, el JSON-LD y el sitemap. Se puede pisar por
   *  entorno para no tener que redeployar. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://web-unamargo.vercel.app",
  whatsapp: "59897022638",
  whatsappLegible: "098 702 638",
  email: "unamargo.info@gmail.com",
  ciudad: "Montevideo",
  instagram: "https://www.instagram.com/unamargo_/",
  instagramUsuario: "@unamargo_",
  /** La playlist que armaron ellos. Es de las cosas mas suyas que tiene la
   *  marca y no puede faltar. */
  spotify:
    "https://open.spotify.com/playlist/2e3Gb1Cfnrop9ZJS6OBLrE?si=tofpgyjRQU-NrKYnMN-ySg",
  pais: "Uruguay",
} as const;

/** El ERP es la unica fuente del catalogo. Se puede pisar por entorno para
 *  apuntar a una instancia distinta sin tocar codigo. */
export const ERP_API =
  process.env.NEXT_PUBLIC_ERP_API ??
  "https://erp-unamargo.vercel.app/api/public/v1/stock";

export function linkWhatsApp(mensaje: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}

/** Los unicos hosts que Google puede indexar: el dominio real y nada mas.
 *
 *  Se decide por el host y no por una variable aparte a proposito. Cualquier
 *  otro sitio -los `.vercel.app`, `test.unamargo.com`, un preview de una rama-
 *  queda fuera del indice solo, sin que nadie se tenga que acordar. Sin esto,
 *  la tienda de prueba compite en los resultados contra la real y muestra
 *  precios que no existen.
 *
 *  El efecto secundario es el correcto: la web se vuelve indexable justo cuando
 *  se muda al dominio de verdad, en vez de depender de que alguien se acuerde
 *  de prender el indexado el dia del lanzamiento. */
const HOSTS_INDEXABLES = ["unamargo.com", "www.unamargo.com"];

export const SE_INDEXA: boolean = (() => {
  try {
    return HOSTS_INDEXABLES.includes(new URL(SITE.url).hostname);
  } catch {
    return false;
  }
})();
