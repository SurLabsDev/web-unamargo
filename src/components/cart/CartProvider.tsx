"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { aCentavos, desdeCentavos } from "@/lib/centavos";
import type { Catalogo, Producto } from "@/lib/catalog";

export type ItemCarrito = {
  sku: string;
  nombre: string;
  precio: string;
  imagen: string | null;
  cantidad: number;
  stock: number;
};

/** Lo que cambio en el carrito al ponerlo al dia con el catalogo, con el
 *  nombre de cada producto. El cajon lo cuenta en una nota: un total distinto
 *  del que la persona recuerda, sin una explicacion, se lee como un error. */
export type Ajustes = {
  /** Cambiaron de precio. */
  precio: string[];
  /** Habia mas unidades en el carrito que en el stock del ERP. */
  cantidad: string[];
  /** Se sacaron: ya no estan en la tienda, no tienen precio o se quedaron sin
   *  stock. */
  quitados: string[];
};

type Carrito = {
  items: ItemCarrito[];
  unidades: number;
  total: string;
  abierto: boolean;
  /** Lo que cambio, para la nota del cajon. Sale en la primera apertura
   *  despues del cambio, y en la siguiente ya no. */
  ajustes: Ajustes | null;
  agregar: (p: Producto, siguiendoStock: boolean) => void;
  cambiarCantidad: (sku: string, cantidad: number) => void;
  quitar: (sku: string) => void;
  vaciar: () => void;
  setAbierto: (v: boolean) => void;
};

const Ctx = createContext<Carrito | null>(null);
const CLAVE = "unamargo:carrito:v1";
/** La nota que nadie vio todavia. Ver `nota` en `CartProvider`. */
const CLAVE_NOTA = "unamargo:carrito-nota:v1";

/** La nota guardada, si tiene la forma de unos `Ajustes`. Cualquier otra cosa
 *  (rota, de otra version) se descarta: es solo un aviso. */
function leerNota(raw: string | null): Ajustes | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    const lista = (v: unknown) =>
      Array.isArray(v) && v.every((x) => typeof x === "string");
    if (o && lista(o.precio) && lista(o.cantidad) && lista(o.quitados)) {
      return { precio: o.precio, cantidad: o.cantidad, quitados: o.quitados };
    }
  } catch {
    /* idem */
  }
  return null;
}

/** Dos notas que nadie vio, en una sola y sin repetir nombres. */
function unir(a: Ajustes, b: Ajustes): Ajustes {
  const u = (x: string[], y: string[]) => [...new Set([...x, ...y])];
  return {
    precio: u(a.precio, b.precio),
    cantidad: u(a.cantidad, b.cantidad),
    quitados: u(a.quitados, b.quitados),
  };
}

/** Lo que una linea del carrito toma de su producto. null si hoy no se puede
 *  pedir: sin precio no hay a cuanto venderlo. */
function datosDe(
  p: Producto,
  siguiendoStock: boolean,
): Omit<ItemCarrito, "cantidad"> | null {
  const precio = p.price_final ?? p.price;
  if (!precio) return null;
  return {
    sku: p.sku,
    nombre: p.name,
    precio,
    imagen: p.images[0] ?? null,
    // Sin seguimiento de stock no hay tope real: la disponibilidad se confirma
    // por WhatsApp. Con seguimiento, nunca por encima de lo que informa el ERP.
    stock: siguiendoStock ? Math.max(p.stock, 0) : Number.MAX_SAFE_INTEGER,
  };
}

/** El carrito puesto al dia con el catalogo. Cada linea toma precio, nombre,
 *  foto y stock del producto de hoy, la cantidad no pasa del stock, y lo que
 *  ya no se puede pedir sale. Si no cambio nada devuelve el mismo arreglo, asi
 *  no se vuelve a dibujar ni a guardar. */
function reconciliar(
  items: ItemCarrito[],
  productos: Producto[],
  siguiendoStock: boolean,
): { items: ItemCarrito[]; ajustes: Ajustes | null } {
  const porSku = new Map(productos.map((p) => [p.sku, p]));
  const ajustes: Ajustes = { precio: [], cantidad: [], quitados: [] };
  let cambio = false;

  const vigentes = items.flatMap((it) => {
    const producto = porSku.get(it.sku);
    const datos = producto ? datosDe(producto, siguiendoStock) : null;
    const cantidad = datos ? Math.min(it.cantidad, datos.stock) : 0;
    if (!datos || cantidad < 1) {
      ajustes.quitados.push(it.nombre);
      cambio = true;
      return [];
    }
    // En centavos y no como texto: "390" y "390.00" son el mismo precio, y
    // avisar de un cambio que no existe asusta igual que uno real.
    if (aCentavos(datos.precio) !== aCentavos(it.precio)) {
      ajustes.precio.push(datos.nombre);
    }
    if (cantidad < it.cantidad) ajustes.cantidad.push(datos.nombre);

    const linea: ItemCarrito = { ...datos, cantidad };
    const igual =
      linea.nombre === it.nombre &&
      linea.precio === it.precio &&
      linea.imagen === it.imagen &&
      linea.stock === it.stock &&
      linea.cantidad === it.cantidad;
    if (igual) return [it];
    cambio = true;
    return [linea];
  });

  const hay =
    ajustes.precio.length + ajustes.cantidad.length + ajustes.quitados.length > 0;
  return { items: cambio ? vigentes : items, ajustes: hay ? ajustes : null };
}

/** El carrito guardado. El formato es el de siempre, un arreglo de
 *  `ItemCarrito`, asi que carga el que dejo cualquier version de la web. Una
 *  linea mal formada se descarta sola y no se lleva puesto al resto: un precio
 *  que no es un numero rompia la suma, y con ella la pagina entera. */
function leerGuardado(crudo: string | null): ItemCarrito[] {
  const lista: unknown = JSON.parse(crudo ?? "[]");
  if (!Array.isArray(lista)) return [];
  const vistos = new Set<string>();
  return lista.flatMap((x: unknown): ItemCarrito[] => {
    if (typeof x !== "object" || x === null) return [];
    const { sku, nombre, precio, imagen, cantidad, stock } = x as Record<
      string,
      unknown
    >;
    if (
      typeof sku !== "string" ||
      vistos.has(sku) ||
      typeof nombre !== "string" ||
      typeof precio !== "string" ||
      !/^\d+(\.\d+)?$/.test(precio) ||
      typeof cantidad !== "number" ||
      !Number.isInteger(cantidad) ||
      cantidad < 1
    ) {
      return [];
    }
    vistos.add(sku);
    return [
      {
        sku,
        nombre,
        precio,
        imagen: typeof imagen === "string" ? imagen : null,
        cantidad,
        stock: typeof stock === "number" ? stock : Number.MAX_SAFE_INTEGER,
      },
    ];
  });
}

export function CartProvider({
  catalogo,
  children,
}: {
  /** El mismo catalogo que dibuja la tienda: el carrito se compara contra el.
   *  Es el mismo objeto que recibe `Tienda`, y React lo manda una sola vez en
   *  el payload: medido, la home crecio 41 bytes y no un catalogo entero. */
  catalogo: Pick<Catalogo, "productos" | "siguiendoStock" | "caido">;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [hidratado, setHidratado] = useState(false);
  /* La nota del cajon. `pendiente` mientras nadie la vio: la proxima apertura
     la muestra y la siguiente la saca. Se decide al ABRIR y no al cerrar:
     borrada al cerrar, la lista saltaria hacia arriba mientras el cajon
     todavia se esta yendo.
     Mientras esta pendiente vive TAMBIEN en localStorage: la primera carga ya
     guarda el carrito puesto al dia, asi que si la pagina se recarga antes
     de abrir el cajon, la nota en memoria se perdia y el pedido aparecia con
     otros precios y productos de menos, sin una palabra. */
  const [nota, setNota] = useState<{ ajustes: Ajustes; pendiente: boolean } | null>(
    null,
  );

  // Se lee despues del montaje, no durante el render: en el servidor no hay
  // localStorage y leerlo antes rompe la hidratacion.
  useEffect(() => {
    try {
      // La regla marca todo setState dentro de un efecto, pero aca es
      // justamente lo correcto: en el servidor no hay localStorage, asi que
      // el primer render TIENE que dar vacio en los dos lados y el carrito
      // guardado entra despues del montaje. Inicializarlo de forma perezosa
      // haria que el HTML del servidor y el del cliente no coincidan.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(leerGuardado(localStorage.getItem(CLAVE)));
      const guardada = leerNota(localStorage.getItem(CLAVE_NOTA));
      if (guardada) setNota({ ajustes: guardada, pendiente: true });
    } catch {
      /* carrito corrupto: se arranca vacio, no se rompe la pagina */
    }
    setHidratado(true);
  }, []);

  const [abiertoAntes, setAbiertoAntes] = useState(abierto);
  if (abierto !== abiertoAntes) {
    setAbiertoAntes(abierto);
    if (abierto) setNota((n) => (n?.pendiente ? { ...n, pendiente: false } : null));
  }

  /* EL CARRITO GUARDADO SE PONE AL DIA CON EL CATALOGO DE AHORA, al cargar y
     cada vez que llega un catalogo nuevo. Guardado tal cual, un pedido armado
     la semana pasada salia por WhatsApp con el precio de la semana pasada, y
     un stock guardado cuando el ERP todavia no lo llevaba no ponia tope nunca.
     Se hace durante el render y no en un efecto, como el paso del cajon: asi
     el carrito viejo no llega a pintarse ni un cuadro. Va despues de la
     apertura para que, si coinciden, la nota nueva le gane a la vieja. */
  const [comparado, setComparado] = useState<typeof catalogo | null>(null);
  if (hidratado && comparado !== catalogo) {
    setComparado(catalogo);
    // Con el ERP caido el catalogo llega vacio, y comparado contra nada el
    // carrito se vaciaria: una caida del ERP no le puede borrar el pedido a
    // nadie. Queda como estaba, con los datos de la ultima vez. Un catalogo
    // vacio sin `caido` se trata igual: es mas probable una falla del ERP que
    // una tienda sin productos.
    if (!catalogo.caido && catalogo.productos.length > 0) {
      const r = reconciliar(items, catalogo.productos, catalogo.siguiendoStock);
      if (r.items !== items) setItems(r.items);
      // Con el cajon abierto se ve en el acto; si no, al abrirlo. Si ya habia
      // una nota sin ver (la guardada de la vez anterior), se suman.
      const nuevos = r.ajustes;
      if (nuevos) {
        setNota((n) => ({
          ajustes: n?.pendiente ? unir(n.ajustes, nuevos) : nuevos,
          pendiente: !abierto,
        }));
      }
    }
  }
  const ajustes = nota && !nota.pendiente ? nota.ajustes : null;

  useEffect(() => {
    if (!hidratado) return;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items));
    } catch {
      /* sin espacio o en modo privado: el carrito vive solo en memoria */
    }
  }, [items, hidratado]);

  useEffect(() => {
    if (!hidratado) return;
    try {
      if (nota?.pendiente) {
        localStorage.setItem(CLAVE_NOTA, JSON.stringify(nota.ajustes));
      } else {
        localStorage.removeItem(CLAVE_NOTA);
      }
    } catch {
      /* idem: la nota queda solo en memoria */
    }
  }, [nota, hidratado]);

  const agregar = useCallback((p: Producto, siguiendoStock: boolean) => {
    const datos = datosDe(p, siguiendoStock);
    if (!datos || datos.stock < 1) return;
    setItems((prev) => {
      const i = prev.findIndex((x) => x.sku === p.sku);
      if (i < 0) return [...prev, { ...datos, cantidad: 1 }];
      const copia = [...prev];
      // Precio, nombre, foto y stock salen del producto que llega y no de la
      // linea que ya estaba: esa puede venir de otra visita, con el precio de
      // entonces. Y nunca por encima del stock que informa el ERP.
      copia[i] = {
        ...datos,
        cantidad: Math.min(prev[i].cantidad + 1, datos.stock),
      };
      return copia;
    });
    setAbierto(true);
  }, []);

  const cambiarCantidad = useCallback((sku: string, cantidad: number) => {
    setItems((prev) =>
      prev.flatMap((x) => {
        if (x.sku !== sku) return [x];
        const nueva = Math.min(Math.max(cantidad, 0), x.stock);
        return nueva === 0 ? [] : [{ ...x, cantidad: nueva }];
      }),
    );
  }, []);

  const quitar = useCallback((sku: string) => {
    setItems((prev) => prev.filter((x) => x.sku !== sku));
  }, []);

  const vaciar = useCallback(() => setItems([]), []);

  const { unidades, total } = useMemo(() => {
    let centavos = 0n;
    let u = 0;
    for (const it of items) {
      centavos += aCentavos(it.precio) * BigInt(it.cantidad);
      u += it.cantidad;
    }
    return { unidades: u, total: desdeCentavos(centavos) };
  }, [items]);

  const valor = useMemo<Carrito>(
    () => ({
      items,
      unidades,
      total,
      abierto,
      ajustes,
      agregar,
      cambiarCantidad,
      quitar,
      vaciar,
      setAbierto,
    }),
    [items, unidades, total, abierto, ajustes, agregar, cambiarCantidad, quitar, vaciar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCarrito(): Carrito {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCarrito fuera de <CartProvider>");
  return c;
}
