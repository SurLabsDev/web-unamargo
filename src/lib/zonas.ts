/** Las zonas de entrega son las que declaro el cliente en su demo: precios y
 *  barrios salen tal cual de ahi, no se inventa ninguno. */

export type Zona = {
  id: string;
  rotulo: string;
  titulo: string;
  precio: string | null;
  detalle: string;
  nota: string;
  barrios: string[];
};

/** Los tres retiros sin costo. */
export const PICKUPS: Zona[] = [
  {
    id: "pickup1",
    rotulo: "Pickup 01",
    titulo: "Pocitos / Punta Carretas",
    precio: null,
    detalle:
      "Coordinamos un punto de encuentro en la zona. Sin costo extra, ves el producto en persona antes de pagar.",
    nota: "Sin costo · Coordinamos horario",
    barrios: ["Pocitos", "Punta Carretas"],
  },
  {
    id: "pickup2",
    rotulo: "Pickup 02",
    titulo: "Cordón Sur / Centro",
    precio: null,
    detalle:
      "Zona céntrica, fácil acceso. Ideal si estás en el microcentro, Palermo o Parque Rodó.",
    nota: "Sin costo · Coordinamos horario",
    barrios: ["Cordón", "Centro", "Palermo", "Parque Rodó"],
  },
  {
    id: "pickup3",
    rotulo: "Pickup 03",
    titulo: "Ciudad de la Costa",
    precio: null,
    detalle:
      "Solymar, Lagomar, El Pinar y zonas aledañas. Coordinamos según agenda semanal.",
    nota: "Sin costo · Consultar disponibilidad",
    barrios: [],
  },
];

/** Cadeteria a domicilio. Precios y barrios exactos de la demo del cliente. */
export const ZONAS_ENVIO: Zona[] = [
  {
    id: "zona1",
    rotulo: "Zona 1",
    titulo: "Centro y costa sur",
    precio: "$195",
    detalle: "La franja céntrica y la costa sur, del Puerto al Buceo.",
    nota: "Cadetería a domicilio",
    barrios: [
      "Centro", "Palermo", "Barrio Sur", "Parque Rodó", "Punta Carretas",
      "Pocitos", "Malvín", "Cordón", "Ciudad Vieja", "Parque Batlle", "Buceo",
    ],
  },
  {
    id: "zona2",
    rotulo: "Zona 2",
    titulo: "Centro norte y costa este",
    precio: "$235",
    detalle: "El anillo que rodea al centro y la costa hacia Carrasco.",
    nota: "Cadetería a domicilio",
    barrios: [
      "Unión", "Jacinto Vera", "La Comercial", "Aguada", "Reducto",
      "Paso Molino", "Malvín Norte", "Carrasco", "Carrasco Norte", "Punta Gorda",
    ],
  },
  {
    id: "zona3",
    rotulo: "Zona 3",
    titulo: "Resto de Montevideo",
    precio: "$250",
    detalle: "El oeste, el norte y los barrios más alejados del centro.",
    nota: "Cadetería a domicilio",
    barrios: [
      "Sayago", "Prado", "Flor de Maroñas", "Bella Italia", "Villa Española",
      "Las Piedras", "Casavalle", "Verdisol", "Nuevo París", "Belvedere",
      "Peñarol", "Cerro", "Paso de la Arena", "Colón",
    ],
  },
];

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
