import { aCentavos, desdeCentavos } from "./centavos";
import { precio } from "./catalog";
import {
  ENVIO_GRATIS_DESDE,
  FUERA_DE_MONTEVIDEO,
  PICKUPS,
  ZONAS_ENVIO,
  type Zona,
} from "./zonas";

/** Lo que pide el checkout antes de mandar el pedido por WhatsApp.
 *
 *  El pedido se sigue cerrando en el chat, no hay pasarela de pago. Lo que
 *  cambia es que el mensaje llega COMPLETO: como lo recibe, a donde, a nombre
 *  de quien y como paga. Antes llegaba solo la lista de productos y el negocio
 *  tenia que preguntar todo lo demas, uno por uno, en el chat. */

/** Las formas de pago que acepta el negocio. De aca salen las opciones del
 *  checkout, la respuesta de las preguntas frecuentes y el `paymentAccepted`
 *  del JSON-LD: agregar una aca la agrega en los tres. */
export const FORMAS_PAGO = [
  { id: "efectivo", etiqueta: "Efectivo" },
  { id: "transferencia", etiqueta: "Transferencia bancaria" },
] as const;
export type FormaPago = (typeof FORMAS_PAGO)[number]["id"];

/** El `modo` de un envio a domicilio. Los retiros usan el `id` de su punto en
 *  `PICKUPS`, asi que si vuelve a haber mas de un punto, cada uno aparece como
 *  opcion solo, sin tocar el checkout. */
export const A_DOMICILIO = "domicilio";

/** El barrio elegido cuando no esta en ninguna zona. El costo queda a
 *  coordinar en vez de inventar uno. */
export const OTRO_BARRIO = "otro";

export type DatosEntrega = {
  /** El `id` de un punto de retiro, `A_DOMICILIO`, o null si todavia no eligio. */
  modo: string | null;
  barrio: string;
  /** El barrio escrito a mano, solo cuando `barrio` es `OTRO_BARRIO`. */
  otroBarrio: string;
  direccion: string;
  nombre: string;
  pago: FormaPago | null;
  notas: string;
};

export const DATOS_VACIOS: DatosEntrega = {
  modo: null,
  barrio: "",
  otroBarrio: "",
  direccion: "",
  nombre: "",
  pago: null,
  notas: "",
};

export type Envio =
  | { tipo: "retiro"; punto: Zona }
  | { tipo: "zona"; zona: Zona; costo: string }
  /** A domicilio en Montevideo, con el pedido por encima de
   *  `ENVIO_GRATIS_DESDE`: la zona se sigue diciendo, pero no se cobra. */
  | { tipo: "gratis"; zona: Zona }
  /** `gratisSiEsMontevideo`: con "Otro barrio" no se sabe la zona, pero si el
   *  pedido ya llega al envio gratis, en Montevideo no se cobra, y se dice. */
  | { tipo: "a-coordinar"; gratisSiEsMontevideo?: boolean };

/** Como sale el pedido, o null mientras falte elegir.
 *
 *  Necesita el subtotal porque el envio depende de el: en Montevideo, desde
 *  `ENVIO_GRATIS_DESDE` no se cobra, que es lo que promete la seccion Envios. */
export function envioDe(d: DatosEntrega, subtotal: string): Envio | null {
  const punto = PICKUPS.find((p) => p.id === d.modo);
  if (punto) return { tipo: "retiro", punto };
  if (d.modo !== A_DOMICILIO || !d.barrio) return null;
  if (d.barrio === OTRO_BARRIO) {
    return { tipo: "a-coordinar", gratisSiEsMontevideo: llegaAlEnvioGratis(subtotal) };
  }
  const zona = ZONAS_ENVIO.find((z) => z.barrios.includes(d.barrio));
  if (!zona?.costo) return { tipo: "a-coordinar" };
  const gratis = !FUERA_DE_MONTEVIDEO.includes(d.barrio) && llegaAlEnvioGratis(subtotal);
  return gratis ? { tipo: "gratis", zona } : { tipo: "zona", zona, costo: zona.costo };
}

/** Si el pedido llega al envio gratis. Se compara contra el subtotal
 *  REDONDEADO A PESOS, como lo muestra `precio()`: con un descuento el
 *  subtotal puede dar $3.489,65, y en pantalla se lee "$ 3.490". Comparando
 *  centavos exactos, el que ve "$ 3.490" igual pagaba el envio. Redondear para
 *  arriba desde los 50 centavos es lo mismo que hace `Intl` al mostrarlo. */
export function llegaAlEnvioGratis(subtotal: string): boolean {
  const pesos = ((aCentavos(subtotal) + 50n) / 100n) * 100n;
  return pesos >= aCentavos(ENVIO_GRATIS_DESDE);
}

/** El total con el envio sumado, en centavos como todo el carrito. null
 *  cuando el envio todavia no tiene precio: un total sin el envio adentro no
 *  se muestra como si fuera el final. */
export function totalConEnvio(subtotal: string, envio: Envio | null): string | null {
  if (!envio || envio.tipo === "a-coordinar") return null;
  if (envio.tipo === "retiro" || envio.tipo === "gratis") return subtotal;
  return desdeCentavos(aCentavos(subtotal) + aCentavos(envio.costo));
}

/** Lo que falta completar, en palabras, en el orden en que aparece en el
 *  formulario. Vacio = se puede mandar. */
export function faltantes(d: DatosEntrega): string[] {
  const f: string[] = [];
  if (!d.modo) f.push("cómo lo recibís");
  if (d.modo === A_DOMICILIO) {
    if (!d.barrio) f.push("el barrio");
    if (d.barrio === OTRO_BARRIO && !d.otroBarrio.trim()) f.push("qué barrio");
    if (!d.direccion.trim()) f.push("la dirección");
  }
  if (!d.nombre.trim()) f.push("tu nombre");
  if (!d.pago) f.push("la forma de pago");
  return f;
}

/** "a, b y c", o "a, b o c". Delante de un sonido "i" la "y" pasa a "e", y
 *  delante de un sonido "o" la "o" pasa a "u": la nota del carrito enumera
 *  nombres de productos, y "Porongo y Imperial Zebra" esta mal escrito. Con
 *  "hie", "io" y compania el sonido no es "i" y queda la "y" ("agua y
 *  hielo"). */
export function enumerar(partes: string[], conjuncion: "y" | "o" = "y"): string {
  if (partes.length < 2) return partes[0] ?? "";
  const ultima = partes[partes.length - 1];
  const nexo =
    conjuncion === "y" && /^h?[ií](?![aeiouáéíóú])/i.test(ultima)
      ? "e"
      : conjuncion === "o" && /^h?[oó]/i.test(ultima)
        ? "u"
        : conjuncion;
  return `${partes.slice(0, -1).join(", ")} ${nexo} ${ultima}`;
}

export function armarMensaje(
  items: { nombre: string; cantidad: number; precio: string }[],
  subtotal: string,
  d: DatosEntrega,
): string {
  const envio = envioDe(d, subtotal);
  const total = totalConEnvio(subtotal, envio);
  const pago = FORMAS_PAGO.find((f) => f.id === d.pago)?.etiqueta;
  const notas = d.notas.trim();

  // En el retiro no hay nada que sumar: subtotal y total serian el mismo
  // numero dos veces.
  const cuentas =
    envio?.tipo === "retiro"
      ? [`Total: ${precio(subtotal)}`]
      : [
          `Subtotal: ${precio(subtotal)}`,
          envio?.tipo === "zona"
            ? `Envío (${envio.zona.rotulo}): ${precio(envio.costo)}`
            : envio?.tipo === "gratis"
              ? `Envío (${envio.zona.rotulo}): sin costo (compras desde ${precio(ENVIO_GRATIS_DESDE)})`
              : envio?.tipo === "a-coordinar" && envio.gratisSiEsMontevideo
                ? "Envío: gratis si es en Montevideo; si no, a coordinar"
                : "Envío: a coordinar",
          total
            ? `Total: ${precio(total)}`
            : envio?.tipo === "a-coordinar" && envio.gratisSiEsMontevideo
              ? `Total: ${precio(subtotal)} (+ envío si es fuera de Montevideo)`
              : `Total: ${precio(subtotal)} + envío`,
        ];

  const entrega =
    envio?.tipo === "retiro"
      ? [`Entrega: retiro en ${envio.punto.titulo}`]
      : [
          "Entrega: envío a domicilio",
          d.barrio === OTRO_BARRIO
            ? `Barrio: ${d.otroBarrio.trim()} (fuera de las zonas)`
            : `Barrio: ${d.barrio}`,
          `Dirección: ${d.direccion.trim()}`,
        ];

  return [
    "Hola! Quiero hacer un pedido:",
    "",
    ...items.map((i) => `- ${i.cantidad} x ${i.nombre} (${precio(i.precio)})`),
    "",
    ...cuentas,
    "",
    ...entrega,
    `Nombre: ${d.nombre.trim()}`,
    ...(pago ? [`Pago: ${pago}`] : []),
    ...(notas ? [`Notas: ${notas}`] : []),
    "",
    "Quedo a la espera para coordinar.",
  ].join("\n");
}

/** Los datos se recuerdan en el navegador para la proxima compra. Las notas
 *  no: son de un pedido ("dejar con el vecino") y repetidas en el siguiente
 *  serian un error. */
const CLAVE = "unamargo:entrega:v1";

export function leerDatosGuardados(): DatosEntrega {
  if (typeof window === "undefined") return DATOS_VACIOS;
  try {
    const crudo: unknown = JSON.parse(localStorage.getItem(CLAVE) ?? "null");
    if (typeof crudo !== "object" || crudo === null) return DATOS_VACIOS;
    const g = crudo as Record<string, unknown>;
    const texto = (v: unknown) => (typeof v === "string" ? v : "");
    const modo = texto(g.modo);
    const barrio = texto(g.barrio);
    const pago = FORMAS_PAGO.find((f) => f.id === g.pago)?.id ?? null;
    return {
      ...DATOS_VACIOS,
      // Un punto de retiro o un barrio que ya no existen no se restauran:
      // quedaria elegido algo que no esta en pantalla.
      modo:
        modo === A_DOMICILIO || PICKUPS.some((p) => p.id === modo)
          ? modo
          : null,
      barrio:
        barrio === OTRO_BARRIO || ZONAS_ENVIO.some((z) => z.barrios.includes(barrio))
          ? barrio
          : "",
      otroBarrio: texto(g.otroBarrio),
      direccion: texto(g.direccion),
      nombre: texto(g.nombre),
      pago,
    };
  } catch {
    return DATOS_VACIOS;
  }
}

export function guardarDatos(d: DatosEntrega): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ ...d, notas: "" }));
  } catch {
    /* modo privado o sin espacio: se piden de nuevo la proxima vez */
  }
}
