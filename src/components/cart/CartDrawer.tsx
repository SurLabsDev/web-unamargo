"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Bag,
  CaretDown,
  Minus,
  Plus,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { Whatsapp } from "../Sociales";
import { useCierreEnFondo, useDialogo, useMontado } from "../useDialogo";
import { useCarrito, type Ajustes } from "./CartProvider";
import { aCentavos } from "@/lib/centavos";
import { precio } from "@/lib/catalog";
import { SITE, linkWhatsApp } from "@/lib/site";
import {
  ENVIO_GRATIS_DESDE,
  FUERA_DE_MONTEVIDEO,
  PICKUPS,
  ZONAS_ENVIO,
} from "@/lib/zonas";
import {
  A_DOMICILIO,
  FORMAS_PAGO,
  OTRO_BARRIO,
  armarMensaje,
  enumerar,
  envioDe,
  faltantes,
  guardarDatos,
  llegaAlEnvioGratis,
  leerDatosGuardados,
  totalConEnvio,
  type DatosEntrega,
} from "@/lib/pedido";

/** El cajon tiene dos pasos: la lista de lo elegido y, despues, entrega y
 *  pago. En uno solo, en el celular, el formulario empujaba la lista fuera de
 *  la pantalla, y lo primero que hay que ver al abrir el pedido es que esta
 *  lo que se eligio. */
type Paso = "pedido" | "entrega";

/** El envio mas barato, para el "desde" de la opcion a domicilio. Sale de las
 *  zonas, asi que si cambia un precio cambia solo.
 *
 *  Adentro del cajon toda la plata pasa por `precio()`, tambien la de las
 *  zonas: al lado del subtotal, "$195" y "$ 1.990" se leen como dos formatos
 *  distintos. */
const ENVIO_DESDE = [...ZONAS_ENVIO]
  .flatMap((z) => (z.costo === null ? [] : [z.costo]))
  .sort((a, b) => Number(aCentavos(a) - aCentavos(b)))[0];

/* Todo es pill, tambien los campos: es la firma del cliente. 16px de letra
   como minimo, porque con menos Safari en el iPhone hace zoom al tocar el
   campo y descuadra el cajon. */
const CAMPO =
  "mt-2 w-full rounded-pill border border-linea bg-papel px-5 py-3 text-base placeholder:text-tinta-suave transition-colors focus:border-tinta focus:outline-none";
const ETIQUETA = "text-sm font-semibold";

/** La nota de lo que cambio al poner el pedido al dia con la tienda. Dice
 *  que y de que producto: sin eso, un precio distinto del que se recordaba o
 *  una linea que falta parecen un error de la pagina. */
function textoAjustes({ precio, cantidad, quitados }: Ajustes): string {
  const frases: string[] = [];
  if (precio.length > 0) {
    frases.push(
      precio.length === 1
        ? `Cambió el precio de ${precio[0]}.`
        : `Cambiaron los precios de ${enumerar(precio)}.`,
    );
  }
  if (cantidad.length > 0) {
    frases.push(
      `Ajustamos ${cantidad.length === 1 ? "la cantidad" : "las cantidades"} de ${enumerar(cantidad)} al stock disponible.`,
    );
  }
  if (quitados.length > 0) {
    frases.push(
      `Sacamos ${enumerar(quitados)} del pedido porque ya no ${quitados.length === 1 ? "está disponible" : "están disponibles"}.`,
    );
  }
  return frases.join(" ");
}

/** Una opcion de "como lo recibis": el radio de verdad queda invisible pero
 *  presente, asi el teclado y los lectores de pantalla lo manejan como lo que
 *  es. */
function Opcion({
  valor,
  elegido,
  onElegir,
  titulo,
  detalle,
  costo,
}: {
  valor: string;
  elegido: boolean;
  onElegir: () => void;
  titulo: string;
  detalle: string;
  costo: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-pill border border-linea px-5 py-3 transition-colors hover:border-tinta has-checked:border-tinta has-checked:bg-humo has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-tinta">
      <input
        type="radio"
        name="modo"
        value={valor}
        checked={elegido}
        onChange={onElegir}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-pill border border-tinta-suave peer-checked:border-tinta peer-checked:[&>span]:scale-100"
      >
        <span className="h-2 w-2 scale-0 rounded-pill bg-tinta transition-transform duration-200" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-snug">{titulo}</span>
        <span className="block text-xs text-tinta-media">{detalle}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums">{costo}</span>
    </label>
  );
}

export function CartDrawer() {
  const {
    items,
    unidades,
    total,
    abierto,
    ajustes,
    setAbierto,
    cambiarCantidad,
    quitar,
  } = useCarrito();
  const [bloqueado, setBloqueado] = useState(false);
  const [paso, setPaso] = useState<Paso>("pedido");
  const [datos, setDatos] = useState<DatosEntrega>(leerDatosGuardados);
  const tituloEntregaRef = useRef<HTMLHeadingElement>(null);
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const idNota = useId();
  const montado = useMontado();

  // Cada vez que se abre arranca por la lista: se abre al agregar un
  // producto, y lo que hay que ver ahi es que el producto entro. Se ajusta
  // durante el render y no en un efecto, que pintaria un cuadro de mas con el
  // paso viejo.
  const [abiertoAntes, setAbiertoAntes] = useState(abierto);
  if (abierto !== abiertoAntes) {
    setAbiertoAntes(abierto);
    if (abierto) {
      setPaso("pedido");
      setBloqueado(false);
    }
  }

  // El foco va al dialogo y no a la X, como en el menu: el cajon se abre con
  // el dedo (agregar, la bolsa) y Safari en el iPhone le pintaba a la X el aro
  // de foco del teclado en cada apertura. El primer Tab cae igual en la X,
  // que es lo primero que se puede enfocar adentro.
  useDialogo(dialogoRef, abierto, {
    alAbrir: () => dialogoRef.current?.focus(),
  });
  const fondo = useCierreEnFondo(abierto, () => setAbierto(false));

  useEffect(() => {
    guardarDatos(datos);
  }, [datos]);

  // Al pasar al formulario el foco va a su titulo: sin esto queda en un boton
  // que ya no existe y el teclado arranca de cero.
  useEffect(() => {
    if (paso === "entrega") tituloEntregaRef.current?.focus();
  }, [paso]);

  function cambiar(parcial: Partial<DatosEntrega>) {
    setDatos((d) => ({ ...d, ...parcial }));
  }

  const envio = envioDe(datos, total);
  const totalFinal = totalConEnvio(total, envio);
  const falta = faltantes(datos);
  const href = linkWhatsApp(armarMensaje(items, total, datos));

  function enviar(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    // Sin "noopener" en las opciones: con esa opcion `window.open` devuelve
    // SIEMPRE null aunque la ventana se abra (lo manda la especificacion), y el
    // aviso de "el navegador bloqueo la ventana" salia en cada pedido enviado.
    // El acceso de vuelta a esta pagina se corta a mano, que es lo mismo.
    const w = window.open(href, "_blank");
    if (w) {
      w.opener = null;
      // Si antes se bloqueo y ahora salio, el aviso ya miente.
      setBloqueado(false);
      return;
    }
    // Un envio que se traga el bloqueador de popups es un pedido perdido:
    // se ofrece el link a mano en vez de fallar en silencio.
    setBloqueado(true);
  }

  // La nota va arriba de la lista o del carrito vacio, que es donde arranca
  // cada apertura. En el formulario ya no hace falta: para llegar ahi se paso
  // por la lista.
  const verNota = ajustes !== null && (paso === "pedido" || items.length === 0);

  if (!montado) return null;

  return createPortal(
    <dialog
      ref={dialogoRef}
      aria-label="Tu pedido"
      // Con el foco en el dialogo, el lector de pantalla anuncia el nombre y
      // esta descripcion: la nota se oye al abrir, no recien al recorrerlo.
      aria-describedby={verNota ? idNota : undefined}
      tabIndex={-1}
      onCancel={(e) => {
        e.preventDefault();
        setAbierto(false);
      }}
      /* Un clic en el fondo cierra, solo si empieza y termina ahi: antes
         cerraba al seleccionar el nombre en el formulario y soltar afuera, y
         al reabrir el pedido volvia a la lista. Y en el primer medio segundo
         no pasa ningun clic: el segundo toque de un doble toque en "Agregar"
         caia en "Continuar" y salteaba la lista. Ver `useCierreEnFondo`. El
         panel llena el dialogo entero, asi que un clic adentro nunca le llega
         al dialogo mismo. */
      onClickCapture={fondo.onClickCapture}
      onPointerDown={fondo.onPointerDown}
      onPointerUp={fondo.onPointerUp}
      onClick={fondo.onClick}
      className="cajon-pedido"
    >
      <div className="flex h-full w-full flex-col bg-papel">
        <header className="flex items-center justify-between gap-2 border-b border-linea px-5 py-4">
          {paso === "entrega" && items.length > 0 ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaso("pedido")}
                aria-label="Volver a la lista del pedido"
                className="-ml-2 rounded-pill p-2 text-tinta-media transition-colors hover:bg-humo hover:text-tinta"
              >
                <ArrowLeft size={18} weight="bold" />
              </button>
              <h2
                ref={tituloEntregaRef}
                tabIndex={-1}
                className="text-lg font-semibold tracking-tight outline-none"
              >
                Entrega y pago
              </h2>
            </div>
          ) : (
            <h2 className="text-lg font-semibold tracking-tight">
              Tu pedido
              {/* El espacio va escrito, como en los titulos de la tienda: con
                  el margen solo, el lector de pantalla leia "Tu pedido1
                  artículo". El margen es la mitad porque el espacio ya ocupa
                  su lugar: el hueco mide 7.8px, casi los 8 de antes. */}
              {unidades > 0 && (
                <>
                  {" "}
                  <span className="ml-1 text-tinta-media">
                    {unidades} {unidades === 1 ? "artículo" : "artículos"}
                  </span>
                </>
              )}
            </h2>
          )}
          <button
            onClick={() => setAbierto(false)}
            aria-label="Cerrar el pedido"
            className="rounded-pill p-2 text-tinta-media transition-colors hover:bg-humo hover:text-tinta"
          >
            <X size={20} weight="bold" />
          </button>
        </header>

        {verNota && (
          <p
            id={idNota}
            className="type-body mx-5 mt-4 rounded-foto bg-humo px-4 py-3 text-xs leading-relaxed text-tinta-media"
          >
            {textoAjustes(ajustes)}
          </p>
        )}

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <Bag size={40} weight="light" className="text-tinta-media" />
            <p className="type-body text-tinta-media">
              Todavía no elegiste nada. Agregá un mate y lo coordinamos por
              WhatsApp.
            </p>
            <button
              onClick={() => setAbierto(false)}
              className="mt-2 rounded-pill bg-verde px-5 py-2.5 text-sm font-semibold text-papel transition-colors hover:bg-verde-vivo"
            >
              Ver la tienda
            </button>
          </div>
        ) : paso === "pedido" ? (
          <>
            <ul className="flex-1 divide-y divide-linea overflow-y-auto px-5">
              {items.map((it) => (
                <li key={it.sku} className="flex gap-4 py-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-foto bg-humo">
                    {it.imagen && (
                      <Image
                        src={it.imagen}
                        alt={it.nombre}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">{it.nombre}</p>
                      <button
                        onClick={() => quitar(it.sku)}
                        aria-label={`Quitar ${it.nombre}`}
                        className="shrink-0 rounded-pill p-1 text-tinta-media transition-colors hover:text-tinta"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-pill border border-linea">
                        <button
                          onClick={() => cambiarCantidad(it.sku, it.cantidad - 1)}
                          aria-label={`Quitar una unidad de ${it.nombre}`}
                          className="px-2 py-1.5 text-tinta-media transition-colors hover:text-tinta"
                        >
                          <Minus size={13} weight="bold" />
                        </button>
                        <span className="min-w-7 text-center text-sm tabular-nums">
                          {it.cantidad}
                        </span>
                        <button
                          onClick={() => cambiarCantidad(it.sku, it.cantidad + 1)}
                          disabled={it.cantidad >= it.stock}
                          aria-label={`Agregar una unidad de ${it.nombre}`}
                          className="px-2 py-1.5 text-tinta-media transition-colors hover:text-tinta disabled:opacity-30"
                        >
                          <Plus size={13} weight="bold" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {precio(it.precio)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-linea px-5 py-4">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-tinta-media">Subtotal</span>
                <span className="text-2xl font-semibold tabular-nums tracking-tight">
                  {precio(total)}
                </span>
              </div>
              <p className="type-body mb-3 text-xs text-tinta-media">
                En el paso siguiente elegís retiro o envío y cómo pagás.
              </p>
              {/* Negro y no verde: el verde queda para el boton que de verdad
                  abre WhatsApp, que es el del paso siguiente. */}
              <button
                onClick={() => setPaso("entrega")}
                className="flex w-full items-center justify-center gap-2 rounded-pill bg-tinta px-5 py-3.5 font-semibold text-papel transition-opacity hover:opacity-85"
              >
                Continuar
                <ArrowRight size={16} weight="bold" />
              </button>
            </footer>
          </>
        ) : (
          <>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex-1 space-y-7 overflow-y-auto px-5 py-6"
            >
              <fieldset>
                <legend className={ETIQUETA}>¿Cómo lo recibís?</legend>
                <div className="mt-3 grid gap-2">
                  {PICKUPS.map((p) => (
                    <Opcion
                      key={p.id}
                      valor={p.id}
                      elegido={datos.modo === p.id}
                      onElegir={() => cambiar({ modo: p.id })}
                      titulo={`Retiro en ${p.titulo}`}
                      detalle="Punto y horario, al confirmar"
                      costo="Sin costo"
                    />
                  ))}
                  <Opcion
                    valor={A_DOMICILIO}
                    elegido={datos.modo === A_DOMICILIO}
                    onElegir={() => cambiar({ modo: A_DOMICILIO })}
                    titulo="Envío a domicilio"
                    detalle={`Según el barrio · gratis desde ${precio(ENVIO_GRATIS_DESDE)}`}
                    costo={ENVIO_DESDE ? `desde ${precio(ENVIO_DESDE)}` : ""}
                  />
                </div>
              </fieldset>

              {datos.modo === A_DOMICILIO && (
                <div className="space-y-5">
                  <label className="block">
                    <span className={ETIQUETA}>Barrio</span>
                    {/* Un <select> nativo con un grupo por zona: en el celular
                        abre la rueda del sistema, que es la forma mas rapida
                        de elegir de una lista, y el grupo dice cuanto cuesta
                        antes de elegir. */}
                    <span className="relative block">
                      <select
                        value={datos.barrio}
                        onChange={(e) => cambiar({ barrio: e.target.value })}
                        className={`${CAMPO} appearance-none pr-12`}
                      >
                        <option value="" disabled>
                          Elegí tu barrio
                        </option>
                        {ZONAS_ENVIO.map((z) => (
                          <optgroup
                            key={z.id}
                            label={`${z.rotulo} · ${precio(z.costo) ?? "a coordinar"}`}
                          >
                            {[...z.barrios]
                              .sort((a, b) => a.localeCompare(b, "es"))
                              .map((b) => (
                                <option key={b} value={b}>
                                  {b}
                                </option>
                              ))}
                          </optgroup>
                        ))}
                        <option value={OTRO_BARRIO}>Otro barrio (costo a coordinar)</option>
                      </select>
                      <CaretDown
                        size={14}
                        weight="bold"
                        aria-hidden
                        className="pointer-events-none absolute right-5 top-1/2 mt-1 -translate-y-1/2 text-tinta-media"
                      />
                    </span>
                    {envio?.tipo === "zona" && (
                      <span className="mt-2 block text-xs text-tinta-media">
                        {envio.zona.rotulo} · el envío cuesta {precio(envio.costo)}
                        {/* Si el pedido ya llega al envio gratis y el barrio
                            queda afuera, se dice por que se cobra: si no, la
                            promesa del "desde" de arriba parece incumplida. */}
                        {FUERA_DE_MONTEVIDEO.includes(datos.barrio) &&
                          llegaAlEnvioGratis(total) && (
                            <>
                              . {datos.barrio} queda fuera de Montevideo: el
                              envío gratis es solo en Montevideo.
                            </>
                          )}
                      </span>
                    )}
                    {envio?.tipo === "gratis" && (
                      <span className="mt-2 block text-xs font-semibold text-verde">
                        {envio.zona.rotulo} · envío gratis en compras desde{" "}
                        {precio(ENVIO_GRATIS_DESDE)}
                      </span>
                    )}
                  </label>

                  {datos.barrio === OTRO_BARRIO && (
                    <label className="block">
                      <span className={ETIQUETA}>¿Qué barrio?</span>
                      <input
                        value={datos.otroBarrio}
                        onChange={(e) => cambiar({ otroBarrio: e.target.value })}
                        placeholder="Barrio o localidad"
                        className={CAMPO}
                      />
                    </label>
                  )}

                  <label className="block">
                    <span className={ETIQUETA}>Dirección</span>
                    <input
                      value={datos.direccion}
                      onChange={(e) => cambiar({ direccion: e.target.value })}
                      autoComplete="street-address"
                      placeholder="Calle, número y apartamento"
                      className={CAMPO}
                    />
                  </label>
                </div>
              )}

              <label className="block">
                <span className={ETIQUETA}>Nombre</span>
                <input
                  value={datos.nombre}
                  onChange={(e) => cambiar({ nombre: e.target.value })}
                  autoComplete="name"
                  placeholder="¿A nombre de quién?"
                  className={CAMPO}
                />
              </label>

              <fieldset>
                <legend className={ETIQUETA}>Forma de pago</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {FORMAS_PAGO.map((f) => (
                    <label
                      key={f.id}
                      className="rounded-pill border border-linea px-4 py-2.5 text-sm font-medium transition-colors hover:border-tinta has-checked:border-tinta has-checked:bg-tinta has-checked:text-papel has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-tinta"
                    >
                      <input
                        type="radio"
                        name="pago"
                        value={f.id}
                        checked={datos.pago === f.id}
                        onChange={() => cambiar({ pago: f.id })}
                        className="sr-only"
                      />
                      {f.etiqueta}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className={ETIQUETA}>
                  Notas para la entrega{" "}
                  <span className="font-normal text-tinta-suave">(opcional)</span>
                </span>
                <textarea
                  value={datos.notas}
                  onChange={(e) => cambiar({ notas: e.target.value })}
                  rows={3}
                  placeholder="Timbre, portería o alguna referencia para encontrarte"
                  className="mt-2 w-full resize-none rounded-[24px] border border-linea bg-papel px-5 py-3 text-base placeholder:text-tinta-suave transition-colors focus:border-tinta focus:outline-none"
                />
              </label>
            </form>

            <footer className="border-t border-linea px-5 py-4">
              <dl className="mb-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-tinta-media">Subtotal</dt>
                  <dd className="tabular-nums">{precio(total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-tinta-media">
                    {envio?.tipo === "retiro"
                      ? "Retiro"
                      : envio?.tipo === "zona" || envio?.tipo === "gratis"
                        ? `Envío · ${envio.zona.rotulo}`
                        : "Envío"}
                  </dt>
                  <dd
                    className={`tabular-nums ${envio?.tipo === "gratis" ? "font-semibold text-verde" : ""}`}
                  >
                    {envio?.tipo === "retiro"
                      ? "Sin costo"
                      : envio?.tipo === "gratis"
                        ? "Gratis"
                        : envio?.tipo === "zona"
                          ? precio(envio.costo)
                          : envio?.tipo === "a-coordinar"
                            ? envio.gratisSiEsMontevideo
                              ? "Gratis si es en Montevideo"
                              : "A coordinar"
                            : "—"}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <dt className="text-tinta-media">Total</dt>
                  <dd className="text-2xl font-semibold tabular-nums tracking-tight">
                    {precio(totalFinal ?? total)}
                    {/* El espacio va escrito y no solo como margen: sin el, el
                        texto quedaba "$ 3.630+ envío" para un lector de
                        pantalla o al copiarlo. */}
                    {!totalFinal && datos.modo === A_DOMICILIO && (
                      <>
                        {" "}
                        <span className="text-sm font-normal text-tinta-media">
                          {envio?.tipo === "a-coordinar" && envio.gratisSiEsMontevideo
                            ? "+ envío si es fuera de Montevideo"
                            : "+ envío"}
                        </span>
                      </>
                    )}
                  </dd>
                </div>
              </dl>

              {falta.length > 0 ? (
                <>
                  <button
                    type="button"
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-pill bg-verde px-5 py-3.5 font-semibold text-papel opacity-40"
                  >
                    <Whatsapp className="h-4 w-4" />
                    Enviar el pedido
                  </button>
                  <p className="mt-2 text-center text-xs text-tinta-media">
                    Para mandarlo falta {enumerar(falta)}.
                  </p>
                </>
              ) : (
                <a
                  href={href}
                  onClick={enviar}
                  className="flex w-full items-center justify-center gap-2 rounded-pill bg-verde px-5 py-3.5 font-semibold text-papel transition-colors hover:bg-verde-vivo"
                >
                  <Whatsapp className="h-4 w-4" />
                  Enviar el pedido
                </a>
              )}
              {/* Solo con el pedido completo: si se le borra un dato despues
                  del bloqueo, el link a mano mandaria un pedido incompleto. */}
              {bloqueado && falta.length === 0 && (
                <p className="mt-3 text-xs text-tinta-media">
                  El navegador bloqueó la ventana.{" "}
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-verde underline underline-offset-2"
                  >
                    Abrí WhatsApp a mano
                  </a>{" "}
                  o escribinos al {SITE.whatsappLegible}.
                </p>
              )}
            </footer>
          </>
        )}
      </div>
    </dialog>,
    document.body,
  );
}
