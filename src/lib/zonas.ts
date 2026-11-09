/** Las zonas de entrega son las que declaro el cliente en su demo: precios y
 *  barrios salen tal cual de ahi, no se inventa ninguno. */

export type Zona = {
  id: string;
  /** El indice de la zona: "Zona 1" de 3. */
  rotulo: string;
  titulo: string;
  /** Lo que cuesta llegar a esta zona, en pesos, como string decimal: la plata
   *  nunca viaja como float (ver `centavos.ts`). El checkout lo suma al total
   *  del pedido. */
  costo: string;
  /** `costo` listo para mostrar. NO se escribe: lo arma `zona()` a partir de
   *  `costo`, asi el precio de la seccion Envios, el de las preguntas
   *  frecuentes y el que se suma en el carrito no pueden contradecirse. */
  precio: string;
  detalle: string;
  nota: string;
  barrios: string[];
};

function zona(z: Omit<Zona, "precio">): Zona {
  return { ...z, precio: `$${z.costo}` };
}

/** Cadeteria a domicilio. Precios y barrios exactos de la demo del cliente.
 *  Es la unica forma de entrega: en noviembre de 2026 el cliente saco el
 *  retiro y paso a vender todo con envio. */
export const ZONAS_ENVIO: Zona[] = [
  zona({
    id: "zona1",
    rotulo: "Zona 1",
    titulo: "Centro y costa sur",
    costo: "195",
    detalle: "La franja céntrica y la costa sur, del Puerto al Buceo.",
    nota: "Cadetería a domicilio",
    barrios: [
      "Centro", "Palermo", "Barrio Sur", "Parque Rodó", "Punta Carretas",
      "Pocitos", "Malvín", "Cordón", "Ciudad Vieja", "Parque Batlle", "Buceo",
    ],
  }),
  zona({
    id: "zona2",
    rotulo: "Zona 2",
    titulo: "Centro norte y costa este",
    costo: "235",
    detalle: "El anillo que rodea al centro y la costa hacia Carrasco.",
    nota: "Cadetería a domicilio",
    barrios: [
      "Unión", "Jacinto Vera", "La Comercial", "Aguada", "Reducto",
      "Paso Molino", "Malvín Norte", "Carrasco", "Carrasco Norte", "Punta Gorda",
    ],
  }),
  zona({
    id: "zona3",
    rotulo: "Zona 3",
    titulo: "Resto de Montevideo",
    costo: "250",
    detalle: "El oeste, el norte y los barrios más alejados del centro.",
    nota: "Cadetería a domicilio",
    barrios: [
      "Sayago", "Prado", "Flor de Maroñas", "Bella Italia", "Villa Española",
      "Las Piedras", "Casavalle", "Verdisol", "Nuevo París", "Belvedere",
      "Peñarol", "Cerro", "Paso de la Arena", "Colón",
    ],
  }),
];

/** El envio a domicilio es GRATIS en Montevideo a partir de este monto, como
 *  string decimal igual que toda la plata del sitio. Es la politica de la demo
 *  del cliente ("en Montevideo, las compras superiores a $3.490 tienen envio
 *  sin costo") y la promesa del cartel verde de la seccion Envios.
 *
 *  Vive aca y no escrita en el cartel porque la cumplen tres lugares: el
 *  carrito (que deja de sumar el envio), las preguntas frecuentes y llms.txt.
 *  Estuvo solo en el cartel y el carrito cobraba la zona igual: la pagina
 *  prometia una cosa y el pedido decia otra. Se toma "a partir de" (incluye
 *  el monto justo) porque es lo que dice la pagina. */
export const ENVIO_GRATIS_DESDE = "3490";

/** El mismo monto listo para mostrar: "$3.490". */
export const ENVIO_GRATIS_TEXTO = `$${new Intl.NumberFormat("es-UY").format(
  Number(ENVIO_GRATIS_DESDE),
)}`;

/** Barrios de las zonas de cadeteria que NO son Montevideo. La promesa del
 *  envio gratis es "en Montevideo", y Las Piedras queda en Canelones: se le
 *  cobra su zona siempre. */
export const FUERA_DE_MONTEVIDEO = ["Las Piedras"];

/** La excepcion lista para mostrar al lado de la promesa: "(no incluye Las
 *  Piedras)". Sale de la lista, asi que si cambia, cambia en todos lados. Sin
 *  barrios afuera, no dice nada. Se dice siempre junto a la promesa: el envio
 *  gratis anunciado sin la excepcion le cobraba $250 a quien lo creia gratis. */
export const ENVIO_GRATIS_EXCEPCION = FUERA_DE_MONTEVIDEO.length
  ? `(no incluye ${FUERA_DE_MONTEVIDEO.join(" ni ")})`
  : "";

/** Como se envia al resto del pais. Lo muestran la seccion Envios y llms.txt,
 *  y por eso vive aca y no en el componente. */
export const ENVIO_INTERIOR =
  "Fuera de Montevideo enviamos por Correo Uruguayo o encomienda: el costo varía según destino y peso.";

/** El nombre de uso corriente no siempre es el oficial de la Intendencia.
 *  Acá se traduce, y lo que no tiene poligono se declara en `SIN_POLIGONO`
 *  en vez de forzarlo contra un barrio que no es. */
export const A_BARRIO_OFICIAL: Record<string, string[]> = {
  "Parque Batlle": ["PQUE BATLLE VILLA DOLORES"],
  "Prado": ["PRADO NUEVA SAVONA"],
  "Bella Italia": ["PUNTA RIELES BELLA ITALIA"],
  "Peñarol": ["PENAROL LAVALLEJA"],
  "Colón": ["COLON CENTRO Y NOROESTE", "COLON SURESTE ABAYUBA"],
  "Flor de Maroñas": ["FLOR DE MARONAS"],
  "Villa Española": ["VILLA ESPANOLA"],
  "Malvín": ["MALVIN"],
  "Malvín Norte": ["MALVIN NORTE"],
  "Cordón": ["CORDON"],
  "Parque Rodó": ["PARQUE RODO"],
  "Unión": ["UNION"],
  "Nuevo París": ["NUEVO PARIS"],
};

/** Barrios que el cliente nombra y que no son un barrio oficial de Montevideo:
 *  se listan igual en las etiquetas, pero no pintan nada en el mapa.
 *  `Las Piedras` ademas queda en Canelones, no en Montevideo. */
export const SIN_POLIGONO = ["Paso Molino", "Verdisol", "Las Piedras"];

function sinTildes(x: string): string {
  return x.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
}

/** Los codigos oficiales que le corresponden a una zona. */
export function barriosDeZona(zona: Zona): string[] {
  return zona.barrios.flatMap(
    (b) => A_BARRIO_OFICIAL[b] ?? [sinTildes(b)],
  );
}
