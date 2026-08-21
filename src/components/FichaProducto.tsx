"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { precio, type Producto } from "@/lib/catalog";
import { AddToCart } from "./cart/AddToCart";

/** La ficha completa del producto. Se abre al tocar una pieza del estante y
 *  trae lo que no entra en la fila: todas las fotos, la descripcion, el rubro y
 *  el subtipo. */
export function FichaProducto({
  producto,
  siguiendoStock,
  onCerrar,
}: {
  producto: Producto;
  siguiendoStock: boolean;
  onCerrar: () => void;
}) {
  const [i, setI] = useState(0);
  const fotos = producto.images;

  // Escape cierra y el fondo no scrollea mientras esta abierta.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowRight" && fotos.length > 1) setI((v) => (v + 1) % fotos.length);
      if (e.key === "ArrowLeft" && fotos.length > 1)
        setI((v) => (v - 1 + fotos.length) % fotos.length);
    };
    document.addEventListener("keydown", onKey);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
    };
  }, [onCerrar, fotos.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-tinta/55 backdrop-blur-[2px]" onClick={onCerrar} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={producto.name}
        className="relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[18px] bg-papel sm:max-h-[86dvh] sm:rounded-[18px]"
      >
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-pill bg-papel/85 text-tinta-media backdrop-blur transition-colors hover:text-tinta"
        >
          <X size={18} weight="bold" />
        </button>

        <div className="grid overflow-y-auto sm:grid-cols-2">
          <div className="relative flex flex-col">
            <div className="relative aspect-square">
              {fotos[i] && (
                <Image
                  src={fotos[i]}
                  alt={producto.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 448px"
                  className="foto-fundida object-contain p-6"
                />
              )}
              {fotos.length > 1 && (
                <>
                  <button
                    onClick={() => setI((v) => (v - 1 + fotos.length) % fotos.length)}
                    aria-label="Foto anterior"
                    className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-pill bg-papel/80 backdrop-blur transition-colors hover:bg-papel"
                  >
                    <CaretLeft size={15} weight="bold" />
                  </button>
                  <button
                    onClick={() => setI((v) => (v + 1) % fotos.length)}
                    aria-label="Foto siguiente"
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-pill bg-papel/80 backdrop-blur transition-colors hover:bg-papel"
                  >
                    <CaretRight size={15} weight="bold" />
                  </button>
                </>
              )}
            </div>

            {/* Miniaturas: dicen cuantas fotos hay y dejan saltar a una. */}
            {fotos.length > 1 && (
              <div className="flex justify-center gap-2 pb-5">
                {fotos.map((f, n) => (
                  <button
                    key={f}
                    onClick={() => setI(n)}
                    aria-label={`Ver foto ${n + 1}`}
                    aria-current={n === i}
                    className={`h-1.5 rounded-pill transition-all duration-300 ${
                      n === i ? "w-7 bg-tinta" : "w-3 bg-linea hover:bg-tinta-suave"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-linea p-6 sm:border-l sm:border-t-0 sm:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {producto.category && (
                  <span className="rounded-pill border border-linea px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-tinta-suave">
                    {producto.category.name}
                  </span>
                )}
                {producto.subtype && (
                  <span className="rounded-pill bg-humo px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-tinta-media">
                    {producto.subtype.name}
                  </span>
                )}
              </div>
              <h3 className="type-display mt-3 text-[clamp(1.5rem,3vw,2.25rem)]">
                {producto.name}
              </h3>
            </div>

            {producto.description && (
              <p className="type-body text-sm leading-relaxed text-tinta-media">
                {producto.description}
              </p>
            )}

            <dl className="mt-1 border-t border-linea pt-4 text-sm">
              <div className="flex justify-between py-1">
                <dt className="text-tinta-suave">Código</dt>
                <dd className="font-mono text-xs">{producto.sku}</dd>
              </div>
              {siguiendoStock && (
                <div className="flex justify-between py-1">
                  <dt className="text-tinta-suave">Disponibilidad</dt>
                  <dd>{producto.in_stock ? `${producto.stock} en stock` : "Sin stock"}</dd>
                </div>
              )}
            </dl>

            <div className="mt-auto flex items-end justify-between gap-4 border-t border-linea pt-5">
              <div>
                {producto.discount && (
                  <p className="text-sm text-tinta-suave line-through">
                    {precio(producto.price)}
                  </p>
                )}
                <p className="type-display text-3xl">{precio(producto.price_final)}</p>
                {producto.discount && (
                  <p className="mt-1 text-xs font-semibold text-verde">
                    {producto.discount.percentage}% off · {producto.discount.campaign}
                  </p>
                )}
              </div>
              <AddToCart producto={producto} siguiendoStock={siguiendoStock} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
