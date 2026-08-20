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
import type { Producto } from "@/lib/catalog";

export type ItemCarrito = {
  sku: string;
  nombre: string;
  precio: string;
  imagen: string | null;
  cantidad: number;
  stock: number;
};

type Carrito = {
  items: ItemCarrito[];
  unidades: number;
  total: string;
  abierto: boolean;
  agregar: (p: Producto, siguiendoStock: boolean) => void;
  cambiarCantidad: (sku: string, cantidad: number) => void;
  quitar: (sku: string) => void;
  vaciar: () => void;
  setAbierto: (v: boolean) => void;
};

const Ctx = createContext<Carrito | null>(null);
const CLAVE = "unamargo:carrito:v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [hidratado, setHidratado] = useState(false);

  // Se lee despues del montaje, no durante el render: en el servidor no hay
  // localStorage y leerlo antes rompe la hidratacion.
  useEffect(() => {
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (crudo) {
        const parsed: unknown = JSON.parse(crudo);
        // La regla marca todo setState dentro de un efecto, pero aca es
        // justamente lo correcto: en el servidor no hay localStorage, asi que
        // el primer render TIENE que dar vacio en los dos lados y el carrito
        // guardado entra despues del montaje. Inicializarlo de forma perezosa
        // haria que el HTML del servidor y el del cliente no coincidan.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(parsed)) setItems(parsed as ItemCarrito[]);
      }
    } catch {
      /* carrito corrupto: se arranca vacio, no se rompe la pagina */
    }
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items));
    } catch {
      /* sin espacio o en modo privado: el carrito vive solo en memoria */
    }
  }, [items, hidratado]);

  const agregar = useCallback((p: Producto, siguiendoStock: boolean) => {
    const precioUnitario = p.price_final ?? p.price;
    if (!precioUnitario) return;
    // Sin seguimiento de stock no hay tope real: la disponibilidad se confirma
    // por WhatsApp. Con seguimiento, nunca por encima de lo que informa el ERP.
    const tope = siguiendoStock ? p.stock : Number.MAX_SAFE_INTEGER;
    setItems((prev) => {
      const i = prev.findIndex((x) => x.sku === p.sku);
      if (i >= 0) {
        const copia = [...prev];
        // Nunca por encima del stock que informa el ERP.
        copia[i] = {
          ...copia[i],
          cantidad: Math.min(copia[i].cantidad + 1, tope),
        };
        return copia;
      }
      return [
        ...prev,
        {
          sku: p.sku,
          nombre: p.name,
          precio: precioUnitario,
          imagen: p.images[0] ?? null,
          cantidad: 1,
          stock: tope,
        },
      ];
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
      agregar,
      cambiarCantidad,
      quitar,
      vaciar,
      setAbierto,
    }),
    [items, unidades, total, abierto, agregar, cambiarCantidad, quitar, vaciar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCarrito(): Carrito {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCarrito fuera de <CartProvider>");
  return c;
}
