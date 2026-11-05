import { aCentavos } from "@/lib/centavos";
import { getCatalogo, precio, type Producto } from "@/lib/catalog";
import { FORMAS_PAGO, enumerar } from "@/lib/pedido";
import { SITE } from "@/lib/site";
import {
  ENVIO_GRATIS_TEXTO,
  ENVIO_INTERIOR,
  FUERA_DE_MONTEVIDEO,
  PICKUPS,
  ZONAS_ENVIO,
} from "@/lib/zonas";

/**
 * /llms.txt: la tienda contada para un asistente de IA, en el formato de
 * llmstxt.org. Un H1, un resumen en cita, el detalle, y despues secciones con
 * listas de enlaces `[texto](url): nota`.
 *
 * SE ARMA CON LOS MISMOS DATOS QUE DIBUJAN LA PAGINA, y no es un archivo
 * escrito a mano, porque el escrito a mano ya habia mentido dos veces: seguia
 * nombrando tres puntos de retiro cuando quedaba uno, y publicaba el numero de
 * WhatsApp que el cliente pidio sacar de todos lados. Un asistente que lee eso
 * lo repite como cierto, y desde afuera de la pagina, donde nadie lo ve.
 *
 * Los enlaces van en Markdown y no sueltos: es lo que pide el formato, y con
 * las URLs sueltas Lighthouse daba el archivo por invalido ("no contiene
 * enlaces").
 *
 * El envio gratis desde cierto monto y los envios fuera de Montevideo se
 * repiten aca porque viven en `zonas.ts`, de donde los lee tambien la pagina:
 * escritos a mano en dos lugares es como se llego a los tres retiros.
 */

export const dynamic = "force-static";
/** Igual que la home: el catalogo sale del ERP y se revisa cada 5 minutos. */
export const revalidate = 300;

/** Un renglon por rubro, con cuantos productos tiene y desde cuanto. Es lo que
 *  contesta "cuanto sale un mate" sin listar los 34. El minimo se busca en
 *  centavos, como toda la plata del sitio (ver `centavos.ts`). */
function rubros(productos: Producto[]): string[] {
  const porRubro = new Map<string, { cantidad: number; desde: string | null }>();
  for (const p of productos) {
    const nombre = p.category?.name;
    if (!nombre) continue;
    const vigente = p.price_final ?? p.price;
    const valido = precio(vigente) !== null ? vigente : null;
    const previo = porRubro.get(nombre) ?? { cantidad: 0, desde: null };
    previo.cantidad += 1;
    if (valido && (previo.desde === null || aCentavos(valido) < aCentavos(previo.desde))) {
      previo.desde = valido;
    }
    porRubro.set(nombre, previo);
  }
  return [...porRubro].map(
    ([nombre, { cantidad, desde }]) =>
      `- ${nombre}: ${cantidad} ${cantidad === 1 ? "producto" : "productos"}${
        desde ? `, desde ${precio(desde)}` : ""
      }.`,
  );
}

export async function GET(): Promise<Response> {
  const catalogo = await getCatalogo();
  const url = (ruta: string) => `${SITE.url}${ruta}`;
  const pagos = enumerar(FORMAS_PAGO.map((f) => f.etiqueta.toLowerCase()), "o");

  const lineas = [
    `# ${SITE.nombre}`,
    "",
    `> Tienda de mates, bombillas y accesorios en ${SITE.ciudad}, ${SITE.pais}. El pedido se arma en el carrito de la web y se cierra por WhatsApp. Envío a domicilio por zonas en ${SITE.ciudad} y retiro sin costo.`,
    "",
    `${SITE.nombre} vende mates, bombillas, combos y accesorios materos, y hace grabado láser sobre mates y trabajos artesanales en virola, para regalo o para empresas. No hay pasarela de pago online: el pago se coordina en el chat del pedido, en ${pagos}.`,
    "",
    "WhatsApp se usa solo para recibir pedidos ya armados, que salen del carrito con el detalle adentro. Las consultas van por Instagram o por mail.",
    "",
    // Si el ERP no contesto no se inventa un catalogo: se omite el bloque.
    ...(catalogo.caido || catalogo.productos.length === 0
      ? []
      : ["Catálogo actual, con precios en pesos uruguayos:", ...rubros(catalogo.productos), ""]),
    "Entregas:",
    ...PICKUPS.map((p) => `- Retiro sin costo en ${p.titulo}. ${p.detalle}`),
    ...ZONAS_ENVIO.map(
      (z) =>
        `- Envío por cadetería, ${z.rotulo ? `${z.rotulo} (${z.titulo})` : z.titulo}: ${
          precio(z.costo) ?? "costo a coordinar"
        }. Barrios: ${enumerar(z.barrios)}.`,
    ),
    `- Envío gratis en ${SITE.ciudad} en compras desde ${ENVIO_GRATIS_TEXTO} (no aplica en ${enumerar(FUERA_DE_MONTEVIDEO)}).`,
    `- ${ENVIO_INTERIOR}`,
    "",
    "## Tienda",
    `- [Catálogo con precios](${url("/#tienda")}): todos los productos, por rubro, con su precio.`,
    `- [Envíos y retiro](${url("/#envios")}): zonas de entrega, precio por zona y barrios.`,
    `- [Preguntas frecuentes](${url("/#preguntas")}): envíos, retiro, pagos, personalizados y empresas.`,
    "",
    "## Guías",
    `- [Cómo curar un mate](${url("/como-curar-un-mate")}): cómo curar un mate nuevo antes de usarlo, de calabaza o de algarrobo, paso a paso.`,
    `- [Cómo cebar un mate](${url("/como-cebar-un-mate")}): el ritual del mate paso a paso: yerba, montañita, agua tibia y bombilla.`,
    "",
    "## Servicios",
    `- [Personalizados](${url("/#personalizados")}): grabado láser en mates y trabajos en virola. Se coordina por Instagram.`,
    `- [Empresas](${url("/#empresas")}): pedidos por cantidad, con el logo grabado en cada mate. Se cotiza por mail.`,
    "",
    "## Contacto",
    `- [Instagram ${SITE.instagramUsuario}](${SITE.instagram}): consultas por mensaje directo.`,
    `- [Mail](mailto:${SITE.email}): ${SITE.email}, para empresas y propuestas.`,
    "",
    "## Optional",
    `- [Pinterest](${SITE.pinterest})`,
    `- [Playlist de ${SITE.nombre} en Spotify](${SITE.spotify})`,
    "",
  ];

  return new Response(lineas.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Es para que lo lea un agente, no para salir en los resultados: sin
      // esto Google lo puede indexar como una pagina mas y mostrar el texto
      // plano en una busqueda de la marca. `noindex` no impide leerlo.
      "X-Robots-Tag": "noindex",
    },
  });
}
