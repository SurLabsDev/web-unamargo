"use client";

import { Plus } from "@phosphor-icons/react/dist/ssr";
import { useCarrito } from "./CartProvider";
import type { Producto } from "@/lib/catalog";

export function AddToCart({
  producto,
  siguiendoStock,
}: {
  producto: Producto;
  siguiendoStock: boolean;
}) {
  const { agregar } = useCarrito();

  if (siguiendoStock && !producto.in_stock) {
    return (
      <span className="inline-flex items-center rounded-brand border border-tinta/15 px-3 py-1.5 text-xs font-medium text-tinta-media">
        Sin stock
      </span>
    );
  }

  return (
    <button
      onClick={() => agregar(producto, siguiendoStock)}
      aria-label={`Agregar ${producto.name} al pedido`}
      className="inline-flex items-center gap-1.5 rounded-brand bg-verde px-3 py-1.5 text-xs font-semibold text-hueso transition-all hover:bg-verde-vivo active:scale-[0.97]"
    >
      <Plus size={13} weight="bold" />
      Agregar
    </button>
  );
}
