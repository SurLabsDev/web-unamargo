import { ERP_API } from "./site";

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
  category: { name: string; slug: string } | null;
  subtype: { name: string; slug: string } | null;
  images: string[];
};

export type Catalogo = {
  productos: Producto[];
  categorias: { name: string; slug: string; cantidad: number }[];
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
  siguiendoStock: false,
  caido: true,
};

export async function getCatalogo(): Promise<Catalogo> {
  try {
    // La URL lleva un sello que cambia cada 5 segundos.
    //
    // No es paranoia: el endpoint del ERP cachea 60s en su CDN. Cuando el ERP
    // avisa que hubo un cambio y esta pagina se regenera al instante, sin este
    // sello el pedido podria recibir una respuesta de hasta 59 segundos antes
    // -o sea el precio viejo- y guardarla otros 5 minutos. El aviso no serviria
    // de nada.
    //
    // Cambiar la URL tambien anula la cache de datos de Next, asi que cada
    // regeneracion hace un pedido de verdad. Es lo que se quiere: la pagina se
    // regenera pocas veces, no en cada visita.
    const sello = Math.floor(Date.now() / 5000);
    const res = await fetch(`${ERP_API}?v=${sello}`, {
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

    const cuenta = new Map<string, { name: string; slug: string; cantidad: number }>();
    for (const p of productos) {
      const c = p.category!;
      const previo = cuenta.get(c.slug);
      if (previo) previo.cantidad += 1;
      else cuenta.set(c.slug, { name: c.name, slug: c.slug, cantidad: 1 });
    }

    return {
      productos,
      categorias: [...cuenta.values()].sort((a, b) => b.cantidad - a.cantidad),
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
