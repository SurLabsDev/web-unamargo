"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CaretLeft, CaretRight, Plus, X } from "@phosphor-icons/react/dist/ssr";
import { precio, videoDe, type Catalogo, type Producto } from "@/lib/catalog";
import { FichaProducto, VideoProducto } from "./FichaProducto";
import { FiltrosTienda, filtrosDe } from "./FiltrosTienda";
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
  enGrilla = false,
}: {
  producto: Producto;
  siguiendoStock: boolean;
  /** Recibe el boton que se toco: la ficha le devuelve el foco al cerrarse. */
  onAbrir: (origen: HTMLElement) => void;
  /** En la grilla del filtro la tarjeta llena su columna, que en el celular
   *  es la mitad de la pantalla. Ahi el nombre en un solo renglon se corta
   *  justo en lo que distingue a un producto de otro: "Mate Camionero (..."
   *  salia dos veces, Clasico y Pulido, iguales. Por eso en la grilla el
   *  nombre usa hasta tres renglones. Dos no alcanzan: a 390px "Combo
   *  Camionero + Posamate..." tambien salia repetido. Con tres entran enteros
   *  todos los nombres del catalogo, y el tope queda para uno que no entre
   *  nunca. */
  enGrilla?: boolean;
}) {
  const { agregar } = useCarrito();
  /* Ver `VideoProducto`: el video no tapa la foto, hay que apagarla cuando
     arranca. */
  const [videoAndando, setVideoAndando] = useState(false);
  const agotado = siguiendoStock && !producto.in_stock;
  const video = videoDe(producto);
  const masVendido = producto.featured === true;

  return (
    <article
      className={`group ${enGrilla ? "" : "w-[62vw] shrink-0 snap-start sm:w-[36vw] lg:w-[23vw] xl:w-[19vw]"}`}
    >
      <button
        onClick={(e) => onAbrir(e.currentTarget)}
        // La marca y el descuento van en el nombre accesible: las chapitas
        // estan adentro de este boton, y su aria-label las tapaba para el
        // lector de pantalla.
        aria-label={`Ver ${producto.name}${masVendido ? ", más vendido" : ""}${
          producto.discount ? `, ${producto.discount.percentage}% off` : ""
        }`}
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
            {/* Los `sizes` son los del estante tambien en la grilla del filtro,
                donde la tarjeta es un poco mas angosta. Es a proposito: con la
                misma cuenta el navegador elige el mismo archivo, y la foto que
                ya se vio en el estante sale de la cache al filtrar en vez de
                bajarse otra vez en otra medida. */}
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
        {/* Las insignias van en fila y se acomodan solas: en la grilla del
            celular la tarjeta mide la mitad de la pantalla y las dos juntas
            pueden no entrar en un renglon. "Mas vendido" va primero porque es
            lo que el cliente pidio que se vea antes que nada. */}
        {(masVendido || producto.discount) && (
          <span className="absolute inset-x-1 top-1 flex flex-wrap items-start gap-1">
            {masVendido && (
              <span className="rounded-pill bg-tinta px-2.5 py-1 text-[11px] font-bold text-papel">
                Más vendido
              </span>
            )}
            {producto.discount && (
              <span className="rounded-pill bg-verde px-2.5 py-1 text-[11px] font-bold text-papel">
                {producto.discount.percentage}% off
              </span>
            )}
          </span>
        )}
      </button>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button onClick={(e) => onAbrir(e.currentTarget)} className="block w-full text-left">
            <p
              className={`text-sm font-medium group-hover:underline ${enGrilla ? "line-clamp-3" : "truncate"}`}
            >
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
  onAbrir: (p: Producto, origen: HTMLElement) => void;
}) {
  const pista = useRef<HTMLDivElement>(null);
  /* Las flechas, solo si hay para donde correr. El estante "Mas vendidos"
     suele tener dos o tres piezas, que en escritorio entran enteras, y dos
     flechas que no mueven nada se leen como algo roto. No hace falta medir a
     mano al montar: el ResizeObserver avisa apenas empieza a mirar, y despues
     cada vez que cambia el ancho. Arranca en true para que el HTML del
     servidor sea el de siempre. */
  const [desborda, setDesborda] = useState(true);
  useEffect(() => {
    const el = pista.current;
    if (!el || !("ResizeObserver" in window)) return;
    const obs = new ResizeObserver(() => setDesborda(el.scrollWidth > el.clientWidth + 1));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function correr(dir: 1 | -1) {
    const el = pista.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section className="reveal mb-14 last:mb-0">
      <div className="mb-4 flex items-end justify-between gap-4">
        {/* El espacio va escrito: el margen separa a la vista, pero el texto
            que leen los buscadores y los lectores de pantalla salia pegado,
            "Mates14". El margen es chico porque el espacio ya ocupa su lugar
            (medido: 5px en el celular, 7.75px en escritorio), asi el hueco se
            ve como antes. */}
        <h3 className="type-display text-[clamp(1.6rem,3.5vw,2.5rem)]">
          {titulo}{" "}
          <span className="ml-1.5 align-middle text-sm font-normal text-tinta-suave">
            {items.length}
          </span>
        </h3>
        <div className={desborda ? "hidden gap-2 md:flex" : "hidden"}>
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
            onAbrir={(origen) => onAbrir(p, origen)}
          />
        ))}
      </div>
    </section>
  );
}

const cuantos = (n: number) => `${n} ${n === 1 ? "producto" : "productos"}`;

/** Con un filtro prendido, una grilla con lo que da y nada mas.
 *
 *  Grilla y no estante: el estante esconde lo que no entra y pide correrlo, y
 *  quien filtra quiere ver de un vistazo todo lo que quedo. Arriba dice que se
 *  filtro y cuanto dio, y al lado esta la salida, que tiene que estar a la
 *  vista y no solo en el chip "Todo" de mas arriba. */
function Grilla({
  titulo,
  items,
  siguiendoStock,
  onAbrir,
  onQuitar,
}: {
  titulo: string;
  items: Producto[];
  siguiendoStock: boolean;
  onAbrir: (p: Producto, origen: HTMLElement) => void;
  onQuitar: () => void;
}) {
  return (
    <section>
      {/* En el celular el boton va abajo del titulo: al lado no entra, y el
          titulo se partia en dos renglones ("Con / descuento") para hacerle
          lugar. Va siempre abajo y no solo cuando no entra, asi no salta de
          lugar al pasar de un filtro a otro. */}
      <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <h3 className="type-display text-[clamp(1.6rem,3.5vw,2.5rem)]">
          {/* El espacio escrito, igual que en el titulo del estante. Y
              `tracking-normal` porque aca va una frase y no un numero solo:
              con el tracking negativo del titular, "12 productos" se leia
              pegado. */}
          {titulo}{" "}
          <span className="ml-1.5 whitespace-nowrap align-middle text-sm font-normal tracking-normal text-tinta-suave">
            {cuantos(items.length)}
          </span>
        </h3>
        <button
          type="button"
          onClick={onQuitar}
          className="flex shrink-0 items-center gap-1.5 rounded-pill border border-linea px-4 py-2 text-xs font-medium transition-colors hover:border-tinta"
        >
          <X size={12} weight="bold" />
          Quitar filtro
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((p) => (
          <Pieza
            key={p.sku}
            producto={p}
            siguiendoStock={siguiendoStock}
            onAbrir={(origen) => onAbrir(p, origen)}
            enGrilla
          />
        ))}
      </div>
    </section>
  );
}

/** EL MAS VENDIDO VA PRIMERO, EN TODOS LADOS. Es lo unico que el cliente pidio
 *  como imprescindible: tiene un estante propio arriba de todo, encabeza la
 *  fila de su rubro y sale antes que el resto en la grilla de cualquier filtro.
 *  `sort` es estable, asi que lo demas queda en el orden en que lo manda el
 *  ERP. */
const primeroElMasVendido = (a: Producto, b: Producto) =>
  Number(b.featured === true) - Number(a.featured === true);

/** La ficha abierta, o la ultima que se abrio (ver donde se monta). */
type Ficha = {
  producto: Producto;
  /** El boton que la abrio: ahi vuelve el foco al cerrarla. */
  origen: HTMLElement;
  abierta: boolean;
  /** Cuantas veces se abrio una ficha. Es la `key`, asi cada apertura arranca
   *  de cero, en la primera foto. */
  vez: number;
};

/** El orden de los estantes lo decide el ERP, no esta lista.
 *
 *  Antes estaba escrito aca, asi que cambiar en que orden se muestran los
 *  rubros pedia un deploy de la web. Ahora sale de `sort_order` de la categoria,
 *  que el cliente edita desde Configuracion.
 *
 *  El desempate por nombre queda para dos rubros con el mismo numero, que es lo
 *  que pasa cuando alguien crea uno nuevo y todavia no lo acomodo. */

export function Tienda({ catalogo }: { catalogo: Catalogo }) {
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [filtro, setFiltro] = useState<string | null>(null);

  function abrirFicha(producto: Producto, origen: HTMLElement) {
    setFicha((f) => ({ producto, origen, abierta: true, vez: (f?.vez ?? 0) + 1 }));
  }

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
  const rubros = [...porRubro.entries()]
    .sort(([a], [b]) => {
      const oa = ordenDe.get(a) ?? Number.MAX_SAFE_INTEGER;
      const ob = ordenDe.get(b) ?? Number.MAX_SAFE_INTEGER;
      return oa !== ob ? oa - ob : a.localeCompare(b, "es");
    })
    .map(([rubro, items]) => [rubro, [...items].sort(primeroElMasVendido)] as const);

  // Todo en el orden de los estantes: de aca salen el estante "Mas vendidos" y
  // la grilla del filtro, para que ninguno de los dos invente un orden propio.
  const enOrden = rubros.flatMap(([, items]) => items);
  const masVendidos = enOrden.filter((p) => p.featured === true);

  const { generales, rasgos } = filtrosDe(catalogo);
  const activo = [...generales, ...rasgos].find((f) => f.clave === filtro) ?? null;
  const resultado = activo ? enOrden.filter(activo.cumple).sort(primeroElMasVendido) : [];

  // Tocar el chip que ya esta prendido lo apaga: es lo que promete un boton con
  // `aria-pressed`. "Todo" y "Quitar filtro" llegan como null.
  const barraRef = useRef<HTMLDivElement>(null);

  function elegir(clave: string | null) {
    setFiltro((previo) => (clave === previo ? null : clave));
  }

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
          <>
            {/* Sin nada que filtrar no hay barra: un "Todo" solo no elige
                nada. Es lo que ve hoy produccion, que todavia no manda ni
                `trait` ni `featured` ni descuentos. */}
            {generales.length + rasgos.length > 0 && (
              <div ref={barraRef}>
              <FiltrosTienda
                generales={generales}
                rasgos={rasgos}
                etiquetaRasgo={catalogo.etiquetaRasgo}
                activo={activo?.clave ?? null}
                onElegir={elegir}
              />
              </div>
            )}

            {/* Para el lector de pantalla: el filtro cambia todo lo que hay
                debajo del chip y sin esto no se entera de cuanto quedo. Esta
                siempre montado porque un aviso que aparece ya con el texto
                puesto muchos lectores no lo leen. */}
            <p aria-live="polite" className="sr-only">
              {activo ? `${activo.nombre}: ${cuantos(resultado.length)}` : ""}
            </p>

            {activo && (
              <Grilla
                titulo={activo.nombre}
                items={resultado}
                siguiendoStock={catalogo.siguiendoStock}
                onAbrir={abrirFicha}
                onQuitar={() => {
                  elegir(null);
                  // "Quitar filtro" se desmonta con la grilla, y el foco caia
                  // al <body>: se lleva a "Todo", que queda prendido y en el
                  // mismo lugar.
                  requestAnimationFrame(() =>
                    barraRef.current
                      ?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
                      ?.focus(),
                  );
                }}
              />
            )}

            {/* CON UN FILTRO LOS ESTANTES SE ESCONDEN, NO SE DESMONTAN. Cada
                uno entra con el revelado al scroll (`.reveal`): desmontados,
                al volver a "Todo" se montarian de nuevo invisibles y cada fila
                tardaria en aparecer lo que dura el revelado. Escondidos vuelven
                en el acto, y sus videos se pausan solos mientras no se ven
                (ver `VideoProducto`). */}
            <div hidden={activo !== null}>
              {masVendidos.length > 0 && (
                <Estante
                  titulo="Más vendidos"
                  items={masVendidos}
                  siguiendoStock={catalogo.siguiendoStock}
                  onAbrir={abrirFicha}
                />
              )}
              {rubros.map(([rubro, items]) => (
                <Estante
                  key={rubro}
                  titulo={rubro}
                  items={items}
                  siguiendoStock={catalogo.siguiendoStock}
                  onAbrir={abrirFicha}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* LA FICHA NO SE DESMONTA AL CERRARSE: SE CIERRA, Y QUEDA AHI CERRADA
          HASTA QUE SE ABRE OTRA. Es un <dialog> (ver `FichaProducto`), y
          desmontarlo abierto lo saca de la pagina sin pasar por `close()`: no
          hay salida y el foco cae en <body> en vez de volver a la tarjeta.
          Tampoco se desmonta apenas se cerro, porque al agregar se cierra de
          una y Chrome la sigue pintando mientras se va (ver globals.css).
          Cerrada no molesta: no se ve, no recibe foco y no cuenta como
          `dialog[open]`, que es lo que miran el pop-up y la playlist. */}
      {ficha && (
        <FichaProducto
          key={ficha.vez}
          producto={ficha.producto}
          abierta={ficha.abierta}
          origen={ficha.origen}
          siguiendoStock={catalogo.siguiendoStock}
          onCerrar={() => setFicha((f) => (f?.abierta ? { ...f, abierta: false } : f))}
        />
      )}
    </section>
  );
}
