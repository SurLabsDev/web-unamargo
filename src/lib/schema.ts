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
 *
 * La regla no se cumple sola: se rompio con `telephone` cuando el numero
 * salio de la pagina y nadie volvio a mirar este archivo. Cada vez que se
 * saca algo de la vista hay que pasar por aca. Repasado tras borrar el
 * formulario de Contacto: ningun nodo lo referenciaba (no hay
 * `potentialAction` ni `ContactPoint` en el grafo) y la seccion conserva su
 * ancla `#contacto`, asi que no quedo nada apuntando al vacio.
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
        // ACA NO VA `telephone`, y son dos razones distintas.
        //
        // 1. Todo este trabajo saco el numero de las superficies visibles
        //    porque el cliente pidio que a WhatsApp se llegue con el pedido
        //    ya armado, nunca antes. Un `telephone` en el JSON-LD es la
        //    forma mas indexable que existe de publicarlo: Google lo puede
        //    levantar al panel de conocimiento con boton de llamar, o sea
        //    que deshacia la decision desde afuera de la pagina, donde
        //    nadie la iba a ver deshecha.
        // 2. Rompia la regla de arriba. Medido en el navegador sobre la
        //    pagina recien cargada: `document.body.innerText` no contiene
        //    "098 702 638" en ningun lado, y las dos unicas apariciones del
        //    numero en el HTML servido eran este campo (el <script> de
        //    JSON-LD y su copia en el payload de React). Se estaba marcando
        //    un canal de contacto que la pagina no ofrece.
        //
        // El numero sigue en `site.ts`, que es de donde sale el link `wa.me`
        // que arma el carrito: ese es el unico camino que quedo.
        //
        // `email` si se queda: el mail se lee entero en la seccion de
        // contacto y en el pie (verificado en `document.body.innerText`).
        email: SITE.email,
        address: {
          "@type": "PostalAddress",
          addressLocality: SITE.ciudad,
          addressCountry: "UY",
        },
        areaServed: { "@type": "AdministrativeArea", name: "Uruguay" },
        currenciesAccepted: "UYU",
        paymentAccepted: "Efectivo, transferencia",
        // Instagram y Pinterest son las cuentas reales del negocio y son la
        // señal de entidad mas barata que hay: le dicen al buscador que este
        // sitio y esas cuentas son el mismo negocio, y no tres marcas distintas
        // que casualmente se llaman igual.
        //
        // El Spotify queda afuera aunque sea publico y de la marca: la URL es
        // de una playlist (`/playlist/...`), no de un perfil. `sameAs` es para
        // paginas que IDENTIFICAN a la entidad, y una lista de temas no
        // identifica a nadie; declararla ensucia la señal en vez de reforzarla.
        // Si algun dia abren un perfil de artista o de usuario, ese si va aca.
        sameAs: [SITE.instagram, SITE.pinterest],
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
