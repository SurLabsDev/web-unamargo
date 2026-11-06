/** Datos del negocio. Todos salen de la demo que armo el cliente, ninguno
 *  esta inventado: el numero, el mail y las zonas son los suyos. */
const WHATSAPP = "59896081959";

/** "59896081959" -> "096 081 959": sin el 598, con el 0 adelante, de a tres. */
function legible(internacional: string): string {
  const local = `0${internacional.replace(/^598/, "")}`;
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

export const SITE = {
  nombre: "Un Amargo",
  /** ~155 caracteres, que es lo que entra en un resultado de busqueda. La
   *  version anterior usaba 128 y dejaba afuera "envio" y "retiro sin costo",
   *  que es lo que la gente escribe cuando busca. */
  descripcion:
    "Mates, bombillas y accesorios en Montevideo. Grabado láser y trabajos en virola. Envíos en todo Montevideo y retiro sin costo. Pedidos por WhatsApp.",
  /** URL canonica. Hoy es la de Vercel porque todavia no hay dominio propio:
   *  poner uno que no existe rompe el canonical y las Open Graph, que resolveran
   *  contra un host que no responde. Cuando se compre el dominio se cambia ACA
   *  y lo siguen las metadatas, el JSON-LD y el sitemap. Se puede pisar por
   *  entorno para no tener que redeployar. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://web-unamargo.vercel.app",
  /** El numero al que llegan los pedidos (wa.me). Lo confirmo el dueño el
   *  06/11/2026: los dos que habia estaban mal, el 097 022 638 de los links de
   *  la demo del cliente y el 098 702 638 escrito a mano en la pagina. */
  whatsapp: WHATSAPP,
  /** El mismo numero escrito como se lee en Uruguay ("096 081 959"). Se
   *  DERIVA del de arriba y no se escribe: estaba escrito a mano como "098 702
   *  638", un numero distinto, y el carrito le decia a la gente que escribiera
   *  a un numero mientras el pedido salia para otro. */
  whatsappLegible: legible(WHATSAPP),
  email: "unamargo.info@gmail.com",
  ciudad: "Montevideo",
  instagram: "https://www.instagram.com/unamargo_/",
  instagramUsuario: "@unamargo_",
  /** La playlist que armaron ellos. Es de las cosas mas suyas que tiene la
   *  marca y no puede faltar. */
  spotify:
    "https://open.spotify.com/playlist/2e3Gb1Cfnrop9ZJS6OBLrE?si=tofpgyjRQU-NrKYnMN-ySg",
  /** Copiada del archivo del cliente, del <a aria-label="Pinterest"> de su
   *  index.html, igual que el resto de los datos de aca.
   *
   *  Vivia suelta en Sociales.tsx, que es un archivo de dibujos: un dato del
   *  negocio en el medio de los SVG es un lugar donde nadie lo va a buscar el
   *  dia que la cuenta cambie, y ademas dejaba a este archivo mintiendo cuando
   *  dice ser la unica fuente. */
  pinterest: "https://www.pinterest.com/unamargo/",
  pais: "Uruguay",
} as const;

/** El ERP es la unica fuente del catalogo. Se puede pisar por entorno para
 *  apuntar a una instancia distinta sin tocar codigo. */
export const ERP_API =
  process.env.NEXT_PUBLIC_ERP_API ??
  "https://erp-unamargo.vercel.app/api/public/v1/stock";

/** La direccion de otro recurso de la misma API, al lado de `/stock`:
 *  `urlDelErp("popup")` da `.../v1/popup`. `new URL` reemplaza el ultimo
 *  tramo de `ERP_API`, pero si la variable termina en barra (`.../v1/stock/`)
 *  lo conserva y agrega: `.../v1/stock/popup`, un 404 que la web toma por "no
 *  hay pop-up" sin que nada avise. El catalogo no lo sufre porque arma su URL
 *  pegando texto. La barra se saca aca, una vez, y no en cada consumidor.
 *  Tira si la variable no es una URL: quien lo llama lo hace adentro de su
 *  try. */
export function urlDelErp(recurso: string): URL {
  return new URL(recurso, ERP_API.replace(/\/+$/, ""));
}

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
