import { ERP_API, selloErp } from "./site";

/** Contrato de /api/public/v1/stock del ERP. Es versionado y solo aditivo:
 *  se agregan campos, nunca se renombran ni se sacan. `price` es el precio de
 *  lista y `price_final` el vigente; son iguales si no hay descuento. Ambos son
 *  strings decimales a proposito: un float redondea plata. */
export type Producto = {
  sku: string;
  name: string;
  stock: number;
  in_stock: boolean;
  slug: string | null;
  price: string | null;
  price_final: string | null;
  discount: { percentage: number; campaign: string } | null;
  description: string | null;
  category: { name: string; slug: string; sort?: number } | null;
  subtype: { name: string; slug: string } | null;
  images: string[];
  /** Todavia no lo manda: el ERP no tiene donde guardar un video. Va declarado
   *  igual porque el contrato es aditivo, asi que el dia que lo mande entra
   *  solo, sin tocar nada mas que borrar el mapa de abajo. */
  video?: string | null;
  /** El valor del tercer eje de clasificacion, el que cada instancia del ERP
   *  titula a su manera (ver `etiquetaRasgo`). Para Un Amargo es el material.
   *  Es opcional porque el ERP de produccion todavia no lo manda: sin el, la
   *  tienda no ofrece esos filtros y sigue igual que antes. */
  trait?: { name: string; slug: string } | null;
  /** "Mas vendido". Es una marca que el cliente le pone a mano a cada producto
   *  en el ERP, no un ranking calculado: con la poca historia de ventas que hay,
   *  un ranking seria ruido. El ERP lo esta agregando ahora, asi que puede no
   *  venir, y si no viene el producto NO es mas vendido. Por eso se pregunta
   *  siempre `=== true` y nunca por la negativa. */
  featured?: boolean;
};

type Conteo = { name: string; slug: string; cantidad: number };

export type Catalogo = {
  productos: Producto[];
  categorias: Conteo[];
  /** Los valores de `trait` que de verdad tiene algun producto, del que mas
   *  productos tiene al que menos. De aca salen los filtros por material: uno
   *  que no aparece en ningun producto no se ofrece. Vacio si el ERP no manda
   *  `trait`. */
  rasgos: Conteo[];
  /** Como titula esta instancia del ERP a ese eje: "Material", "Caracteristica".
   *  Viene una sola vez, arriba de todo de la respuesta (`trait_label`), porque
   *  es de la instancia y no de cada producto. null si no lo manda. */
  etiquetaRasgo: string | null;
  /** Si NINGUN producto tiene stock, el ERP todavia no lo esta llevando: los
   *  productos nacen en cero y solo dejan de estarlo cuando alguien hace el
   *  primer conteo. En ese estado la web no muestra disponibilidad, porque
   *  marcar los 34 como agotados le dice al cliente que no compre. Apenas se
   *  carga el primer stock real, esto se da vuelta solo. El pedido se
   *  confirma por WhatsApp igual, asi que nadie compra lo que no hay. */
  siguiendoStock: boolean;
  /** El ERP no contesto. La pagina se dibuja igual, con la tienda avisando:
   *  una caida del ERP no puede tumbar la web del cliente. */
  caido: boolean;
};

const CATALOGO_VACIO: Catalogo = {
  productos: [],
  categorias: [],
  rasgos: [],
  etiquetaRasgo: null,
  siguiendoStock: false,
  caido: true,
};

/** Cuantos productos tiene cada valor de un eje (rubro o rasgo), del que mas
 *  tiene al que menos. A igual cantidad decide el nombre, para que el orden no
 *  dependa de en que orden manda el ERP los productos. */
function contarPor(
  productos: Producto[],
  eje: (p: Producto) => { name: string; slug: string } | null | undefined,
): Conteo[] {
  const cuenta = new Map<string, Conteo>();
  for (const p of productos) {
    const valor = eje(p);
    if (!valor) continue;
    const previo = cuenta.get(valor.slug);
    if (previo) previo.cantidad += 1;
    else cuenta.set(valor.slug, { name: valor.name, slug: valor.slug, cantidad: 1 });
  }
  return [...cuenta.values()].sort(
    (a, b) => b.cantidad - a.cantidad || a.name.localeCompare(b.name, "es"),
  );
}

export async function getCatalogo(): Promise<Catalogo> {
  try {
    // Con un sello nuevo en cada pedido: sin el, la regeneracion que dispara
    // un aviso del ERP podia recibir del CDN el precio de antes del cambio y
    // guardarlo 5 minutos (ver `selloErp`).
    const res = await fetch(`${ERP_API}?v=${selloErp()}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return CATALOGO_VACIO;

    const data: unknown = await res.json();
    if (
      typeof data !== "object" ||
      data === null ||
      !Array.isArray((data as { items?: unknown }).items)
    ) {
      return CATALOGO_VACIO;
    }

    const items = (data as { items: Producto[] }).items;
    // Sin categoria no se puede navegar ni filtrar, asi que no se muestran.
    const productos = items.filter((p) => p.category !== null);

    const etiqueta = (data as { trait_label?: unknown }).trait_label;

    return {
      productos,
      categorias: contarPor(productos, (p) => p.category),
      rasgos: contarPor(productos, (p) => p.trait),
      etiquetaRasgo:
        typeof etiqueta === "string" && etiqueta.trim() ? etiqueta.trim() : null,
      siguiendoStock: productos.some((p) => p.stock > 0),
      caido: false,
    };
  } catch {
    return CATALOGO_VACIO;
  }
}

/** Plata en pesos uruguayos. Entra string decimal, sale texto es-UY.
 *  Nunca se hace aritmetica con estos numeros: solo se muestran. */
export function precio(valor: string | null): string | null {
  if (!valor) return null;
  const n = Number(valor);
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Los dos videos de producto que existen, por SKU.
 *
 *  Estan en `public/videos/` y no en el ERP porque el ERP no tiene campo para
 *  video: hasta que lo tenga, esta es la unica forma de que el visitante los
 *  vea. La clave es el SKU y no el nombre ni el slug porque el SKU es lo unico
 *  que no cambia cuando el cliente le edita el titulo o el precio al producto.
 *
 *  Se borra entero el dia que el ERP mande `video`: la precedencia de
 *  `videoDe` ya esta puesta para eso y no hay nada mas que tocar. */
const VIDEOS_LOCALES: Record<string, string> = {
  "ACC-BASE-REPOSAMATE": "/videos/base-reposamate.mp4",
  "ACC-SECADOR-MATE-BOMBILLA": "/videos/secamate.mp4",
};

/** El video de un producto, o null si no tiene.
 *
 *  Es la unica funcion que decide esto, para que no haya dos lugares que
 *  contesten distinto. La precedencia es: primero lo que diga el ERP, despues
 *  el mapa local. En ese orden y no al reves, asi cargar el video en el ERP
 *  alcanza para reemplazar al local sin esperar un deploy de la web. */
export function videoDe(producto: Producto): string | null {
  return producto.video ?? VIDEOS_LOCALES[producto.sku] ?? null;
}
