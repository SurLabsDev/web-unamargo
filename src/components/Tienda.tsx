"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react/dist/ssr";
import { precio, videoDe, type Catalogo, type Producto } from "@/lib/catalog";
import { FichaProducto, VideoProducto } from "./FichaProducto";
import { useCarrito } from "./cart/CartProvider";
import { SITE } from "@/lib/site";

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
  /* Ver `VideoProducto`: el video no tapa la foto, hay que apagarla cuando
     arranca. */
  const [videoAndando, setVideoAndando] = useState(false);
  const agotado = siguiendoStock && !producto.in_stock;
  const video = videoDe(producto);

  return (
    <article className="group w-[62vw] shrink-0 snap-start sm:w-[36vw] lg:w-[23vw] xl:w-[19vw]">
      <button
        onClick={onAbrir}
        aria-label={`Ver ${producto.name}`}
        className="relative block aspect-square w-full"
      >
        {/* LA FOTO SIEMPRE VA POR `next/image`, Y EL VIDEO SE MONTA ENCIMA.
            El marco lo pone el boton (`aspect-square`), asi que la fila sigue
            midiendo lo mismo aunque una pieza traiga video. Antes el video
            llevaba `poster` con la URL cruda del Storage del ERP: eso no pasa
            por `next/image`, asi que bajaba el original de 960x1200 para
            pintarlo del tamano de una tarjeta, y lo bajaba al renderizar la
            pagina en vez de al entrar en pantalla. Ahora hasta que el video
            arranca se ve la foto optimizada de abajo, y con
            `prefers-reduced-motion` el video no se pide nunca.

            Y CUANDO ARRANCA, LA FOTO SE APAGA. El video es vertical y la foto
            es 4:5: apoyado sobre el mismo marco con `object-contain` el video
            se pinta mas angosto, y sin apagarla quedaba la foto quieta
            asomando por los dos costados del video que corre. El aviso lo da
            el evento `playing`, que llega con el video ya en `readyState` 4:
            la foto se va recien cuando hay cuadro que poner en su lugar. */}
        {producto.images[0] && (
          /* El <span> esta nada mas que para que el desvanecido tenga su propia
             duracion: el zoom del hover vive en la <Image> con sus 500ms, y las
             dos cosas no entran en una sola declaracion de transicion. */
          <span
            className={`absolute inset-0 transition-opacity duration-300 ${
              videoAndando ? "opacity-0" : "opacity-100"
            }`}
          >
            <Image
              src={producto.images[0]}
              alt={producto.name}
              fill
              sizes="(max-width: 640px) 62vw, (max-width: 1024px) 36vw, 20vw"
              className="foto-fundida object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            />
          </span>
        )}
        {video && (
          /* Sin `.foto-fundida`: esa mascara desvanece el borde de la caja del
             elemento, y la caja del video es el marco entero mientras que el
             video pinta una franja mas angosta en el medio, asi que el
             degradado le caia casi todo al vacio de los costados. Los numeros
             de la medicion estan en `VideoProducto`. */
          <VideoProducto
            src={video}
            alArrancar={() => setVideoAndando(true)}
            className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
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
          {/* Con descuento se muestran los dos precios: el tachado es lo que
              hace que el nuevo se lea como una rebaja y no como el precio de
              siempre. Sin el, el "20% off" de la foto obliga a hacer la cuenta
              de cabeza para saber cuanto se ahorra. */}
          <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-sm font-semibold tabular-nums">
            {precio(producto.price_final)}
            {producto.discount && producto.price !== producto.price_final ? (
              <span className="text-xs font-normal text-tinta-suave line-through">
                {precio(producto.price)}
              </span>
            ) : null}
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

/** El orden de los estantes lo decide el ERP, no esta lista.
 *
 *  Antes estaba escrito aca, asi que cambiar en que orden se muestran los
 *  rubros pedia un deploy de la web. Ahora sale de `sort_order` de la categoria,
 *  que el cliente edita desde Configuracion.
 *
 *  El desempate por nombre queda para dos rubros con el mismo numero, que es lo
 *  que pasa cuando alguien crea uno nuevo y todavia no lo acomodo. */

export function Tienda({ catalogo }: { catalogo: Catalogo }) {
  const [abierto, setAbierto] = useState<Producto | null>(null);

  const porRubro = new Map<string, Producto[]>();
  for (const p of catalogo.productos) {
    const c = p.category?.name ?? "Otros";
    porRubro.set(c, [...(porRubro.get(c) ?? []), p]);
  }

  const ordenDe = new Map<string, number>();
  for (const p of catalogo.productos) {
    const c = p.category;
    if (c && !ordenDe.has(c.name)) ordenDe.set(c.name, c.sort ?? 0);
  }
  const rubros = [...porRubro.entries()].sort(([a], [b]) => {
    const oa = ordenDe.get(a) ?? Number.MAX_SAFE_INTEGER;
    const ob = ordenDe.get(b) ?? Number.MAX_SAFE_INTEGER;
    return oa !== ob ? oa - ob : a.localeCompare(b, "es");
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
            {/* Manda a Instagram y no a WhatsApp: el WhatsApp quedo reservado
                para pedidos ya armados, y aca todavia no hay ninguno. */}
            <p className="type-body text-tinta-media">
              No pudimos cargar el catálogo en este momento. Escribinos por{" "}
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 transition-colors hover:text-tinta"
              >
                Instagram
              </a>{" "}
              y te contamos qué hay disponible.
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
