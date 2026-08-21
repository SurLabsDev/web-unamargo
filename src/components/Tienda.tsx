"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react/dist/ssr";
import { precio, type Catalogo, type Producto } from "@/lib/catalog";
import { FichaProducto } from "./FichaProducto";
import { useCarrito } from "./cart/CartProvider";

/** ESTANTES. Una fila por rubro, que se recorre de costado. Es el patron de
 *  Mercado Libre, Netflix y Apple: cualquiera que compre en Uruguay ya sabe
 *  usarlo y en el celular se pasa con el dedo.
 *
 *  No es un carrusel de portada -esos rinden mal y por eso cayeron de 52% a 32%
 *  de los sitios grandes-: aca no rota solo ni esconde nada, es una estanteria
 *  que se empuja. La pieza siguiente siempre asoma, y ese asomo es lo que avisa
 *  que hay mas para el costado. */
function Pieza({
  producto,
  siguiendoStock,
  onAbrir,
}: {
  producto: Producto;
  siguiendoStock: boolean;
  onAbrir: () => void;
}) {
  const { agregar } = useCarrito();
  const agotado = siguiendoStock && !producto.in_stock;

  return (
    <article className="group w-[62vw] shrink-0 snap-start sm:w-[36vw] lg:w-[23vw] xl:w-[19vw]">
      <button
        onClick={onAbrir}
        aria-label={`Ver ${producto.name}`}
        className="relative block aspect-square w-full"
      >
        {producto.images[0] && (
          <Image
            src={producto.images[0]}
            alt={producto.name}
            fill
            sizes="(max-width: 640px) 62vw, (max-width: 1024px) 36vw, 20vw"
            className="foto-fundida object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
        )}
        {producto.discount && (
          <span className="absolute left-1 top-1 rounded-pill bg-verde px-2.5 py-1 text-[11px] font-bold text-papel">
            {producto.discount.percentage}% off
          </span>
        )}
      </button>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button onClick={onAbrir} className="block w-full text-left">
            <p className="truncate text-sm font-medium group-hover:underline">
              {producto.name}
            </p>
          </button>
          <p className="mt-0.5 text-sm font-semibold tabular-nums">
            {precio(producto.price_final)}
          </p>
        </div>

        {agotado ? (
          <span className="shrink-0 rounded-pill border border-linea px-2.5 py-1 text-[11px] text-tinta-suave">
            Sin stock
          </span>
        ) : (
          <button
            onClick={() => agregar(producto, siguiendoStock)}
            aria-label={`Agregar ${producto.name} al pedido`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border border-linea transition-colors duration-200 hover:border-tinta hover:bg-tinta hover:text-papel"
          >
            <Plus size={13} weight="bold" />
          </button>
        )}
      </div>
    </article>
  );
}

function Estante({
  titulo,
  items,
  siguiendoStock,
  onAbrir,
}: {
  titulo: string;
  items: Producto[];
  siguiendoStock: boolean;
  onAbrir: (p: Producto) => void;
}) {
  const pista = useRef<HTMLDivElement>(null);

  function correr(dir: 1 | -1) {
    const el = pista.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section className="reveal mb-14 last:mb-0">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h3 className="type-display text-[clamp(1.6rem,3.5vw,2.5rem)]">
          {titulo}
          <span className="ml-3 align-middle text-sm font-normal text-tinta-suave">
            {items.length}
          </span>
        </h3>
        <div className="hidden gap-2 md:flex">
          <button
            onClick={() => correr(-1)}
            aria-label={`Ver ${titulo} anteriores`}
            className="flex h-9 w-9 items-center justify-center rounded-pill border border-linea transition-colors hover:border-tinta"
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <button
            onClick={() => correr(1)}
            aria-label={`Ver más ${titulo}`}
            className="flex h-9 w-9 items-center justify-center rounded-pill border border-linea transition-colors hover:border-tinta"
          >
            <CaretRight size={14} weight="bold" />
          </button>
        </div>
      </div>

      <div
        ref={pista}
        className="sin-barra flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
      >
        {items.map((p) => (
          <Pieza
            key={p.sku}
            producto={p}
            siguiendoStock={siguiendoStock}
            onAbrir={() => onAbrir(p)}
          />
        ))}
      </div>
    </section>
  );
}

/** El orden de los estantes lo decide el negocio, no el alfabeto: los mates son
 *  lo que la gente viene a buscar y los accesorios lo que se suma al final.
 *
 *  Un rubro que no este en esta lista igual aparece, al final: si mañana el
 *  cliente crea uno nuevo en el ERP no se pierde. Si algun dia quieren manejar
 *  el orden desde el ERP, la categoria ya tiene `sort_order` ahi y alcanza con
 *  exponerlo en la API, que es un cambio aditivo. */
const ORDEN_RUBROS = ["Mates", "Bombillas", "Combos", "Accesorios"];

export function Tienda({ catalogo }: { catalogo: Catalogo }) {
  const [abierto, setAbierto] = useState<Producto | null>(null);

  const porRubro = new Map<string, Producto[]>();
  for (const p of catalogo.productos) {
    const c = p.category?.name ?? "Otros";
    porRubro.set(c, [...(porRubro.get(c) ?? []), p]);
  }

  const rubros = [...porRubro.entries()].sort(([a], [b]) => {
    const ia = ORDEN_RUBROS.indexOf(a);
    const ib = ORDEN_RUBROS.indexOf(b);
    // Los que no estan declarados van al final, entre ellos por nombre.
    if (ia === -1 && ib === -1) return a.localeCompare(b, "es");
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return (
    <section id="tienda" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="reveal mb-12">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-tinta-suave">
            Colección
          </p>
          <h2 className="type-display text-[clamp(2.5rem,6vw,4.5rem)]">La tienda</h2>
          <p className="type-body mt-5 text-tinta-suave">
            {catalogo.productos.length} productos · precios en pesos uruguayos
          </p>
        </div>

        {catalogo.caido ? (
          <div className="rounded-foto border border-linea bg-humo px-6 py-14 text-center">
            <p className="type-body text-tinta-media">
              No pudimos cargar el catálogo en este momento. Escribinos por
              WhatsApp y te contamos qué hay disponible.
            </p>
          </div>
        ) : (
          rubros.map(([rubro, items]) => (
            <Estante
              key={rubro}
              titulo={rubro}
              items={items}
              siguiendoStock={catalogo.siguiendoStock}
              onAbrir={setAbierto}
            />
          ))
        )}
      </div>

      {abierto && (
        <FichaProducto
          producto={abierto}
          siguiendoStock={catalogo.siguiendoStock}
          onCerrar={() => setAbierto(null)}
        />
      )}
    </section>
  );
}
