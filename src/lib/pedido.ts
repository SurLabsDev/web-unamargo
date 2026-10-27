import { aCentavos, desdeCentavos } from "./centavos";
import { precio } from "./catalog";
import { PICKUPS, ZONAS_ENVIO, type Zona } from "./zonas";

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
  | { tipo: "a-coordinar" };

/** Como sale el pedido, o null mientras falte elegir. */
export function envioDe(d: DatosEntrega): Envio | null {
  const punto = PICKUPS.find((p) => p.id === d.modo);
  if (punto) return { tipo: "retiro", punto };
  if (d.modo !== A_DOMICILIO || !d.barrio) return null;
  if (d.barrio === OTRO_BARRIO) return { tipo: "a-coordinar" };
  const zona = ZONAS_ENVIO.find((z) => z.barrios.includes(d.barrio));
  return zona?.costo
    ? { tipo: "zona", zona, costo: zona.costo }
    : { tipo: "a-coordinar" };
}

/** El total con el envio sumado, en centavos como todo el carrito. null
 *  cuando el envio todavia no tiene precio: un total sin el envio adentro no
 *  se muestra como si fuera el final. */
export function totalConEnvio(subtotal: string, envio: Envio | null): string | null {
  if (!envio || envio.tipo === "a-coordinar") return null;
  if (envio.tipo === "retiro") return subtotal;
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

/** "a, b y c", o "a, b o c". */
export function enumerar(partes: string[], conjuncion: "y" | "o" = "y"): string {
  return partes.length < 2
    ? (partes[0] ?? "")
    : `${partes.slice(0, -1).join(", ")} ${conjuncion} ${partes[partes.length - 1]}`;
}

export function armarMensaje(
  items: { nombre: string; cantidad: number; precio: string }[],
  subtotal: string,
  d: DatosEntrega,
): string {
  const envio = envioDe(d);
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
            : "Envío: a coordinar",
          total ? `Total: ${precio(total)}` : `Total: ${precio(subtotal)} + envío`,
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
