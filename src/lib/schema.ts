import type { Catalogo, Producto } from "@/lib/catalog";
import { SITE } from "@/lib/site";

/**
 * El marcado estructurado, en UN solo `@graph`.
 *
 * Va todo junto y no en tres etiquetas sueltas para que los nodos se
 * referencien por `@id` y un buscador lea una sola entidad en vez de tres
 * cosas que casualmente comparten dominio.
 *
 * Lo que aporta cada nodo:
 *  - `Store`: quien es el negocio, donde y como se lo contacta.
 *  - `ItemList` + `Product`: los 34 productos con precio, moneda y si hay
 *    stock. Es lo unico que puede hacer que un buscador muestre el precio
 *    junto al resultado, y lo que un asistente puede citar cuando alguien
 *    pregunta "cuanto sale un mate camionero en Montevideo".
 *  - `FAQPage`: las respuestas que la gente pregunta por WhatsApp.
 *
 * REGLA QUE NO SE PUEDE ROMPER: todo lo que se marca aca tiene que estar
 * VISIBLE en la pagina. Marcar respuestas que el visitante no puede leer es
 * motivo de penalizacion manual, y ademas es mentirle a quien busca.
 */

/** Un producto del catalogo, como lo entiende un buscador. */
function nodoProducto(p: Producto) {
  const precio = p.price_final ?? p.price;
  return {
    "@type": "Product",
    "@id": `${SITE.url}/#producto-${p.sku}`,
    name: p.name,
    sku: p.sku,
    ...(p.description ? { description: p.description } : {}),
    ...(p.images?.[0] ? { image: p.images[0] } : {}),
    ...(p.category ? { category: p.category.name } : {}),
    brand: { "@type": "Brand", name: SITE.nombre },
    offers: {
      "@type": "Offer",
      price: precio,
      priceCurrency: "UYU",
      // `in_stock` sale del ERP. Cuando el negocio todavia no lleva stock, la
      // API devuelve 0 en todo y `siguiendoStock` es false: en ese caso NO se
      // declara falta de stock, porque seria falso.
      availability: p.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: SITE.url,
      seller: { "@id": `${SITE.url}/#tienda` },
    },
  };
}

export function construirSchema(catalogo: Catalogo, faq: { pregunta: string; respuesta: string }[]) {
  const productos = catalogo.siguiendoStock
    ? catalogo.productos
    : catalogo.productos.map((p) => ({ ...p, in_stock: true }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Store",
        "@id": `${SITE.url}/#tienda`,
        name: SITE.nombre,
        description: SITE.descripcion,
        url: SITE.url,
        telephone: `+${SITE.whatsapp}`,
        email: SITE.email,
        address: {
          "@type": "PostalAddress",
          addressLocality: SITE.ciudad,
          addressCountry: "UY",
        },
        areaServed: { "@type": "AdministrativeArea", name: "Uruguay" },
        currenciesAccepted: "UYU",
        paymentAccepted: "Efectivo, transferencia",
        // Instagram es la cuenta real del negocio y es la señal de entidad mas
        // barata que hay: le dice al buscador que este sitio y esa cuenta son
        // el mismo negocio.
        sameAs: [SITE.instagram],
      },
      {
        "@type": "ItemList",
        "@id": `${SITE.url}/#catalogo`,
        name: `Catálogo de ${SITE.nombre}`,
        numberOfItems: productos.length,
        itemListElement: productos.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: nodoProducto(p),
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE.url}/#preguntas`,
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.pregunta,
          acceptedAnswer: { "@type": "Answer", text: f.respuesta },
        })),
      },
    ],
  };
}
