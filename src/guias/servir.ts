import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GUIAS, type IdGuia } from "@/lib/guias";
import { SE_INDEXA, SITE } from "@/lib/site";

/**
 * Arma la pagina de una guia: la plantilla del cliente mas lo que depende del
 * ambiente, que es todo lo que va en el <head> y nada mas.
 *
 * La plantilla ya viene limpia de `scripts/importar-guia.mjs`; aca no se toca
 * su codigo. Se agrega titulo, descripcion, canonical, robots, Open Graph,
 * favicon y JSON-LD en el lugar de `<!--guia:head-->`, y se saca la cabecera
 * interna de la plantilla, que es una nota para quien la mantiene.
 *
 * Corre al construir: las rutas son `force-static`, como el resto del sitio,
 * porque el dominio y el indexado salen de variables `NEXT_PUBLIC_*` que ya
 * quedan fijas en el build. Por eso leer del disco no le cuesta nada a nadie.
 */

const MARCA_HEAD = "<!--guia:head-->";
const CABECERA = /^<!--guia\n[\s\S]*?-->\n/m;

function leer(id: IdGuia): string {
  return readFileSync(join(process.cwd(), "src", "guias", `${id}.html`), "utf8");
}

function fechaDe(id: IdGuia, plantilla: string): string {
  const fecha = /Actualizada: (\d{4}-\d{2}-\d{2})/.exec(plantilla)?.[1];
  if (!fecha) throw new Error(`La plantilla de la guia "${id}" no tiene fecha. Volver a importarla.`);
  return fecha;
}

/** El dia en que cambio la guia por ultima vez. Lo escribe el importador y
 *  solo lo mueve si cambio el contenido, asi que el sitemap y el JSON-LD no
 *  dicen "modificada hoy" en cada build. */
export function fechaDeGuia(id: IdGuia): string {
  return fechaDe(id, leer(id));
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Texto plano de un pedazo de HTML del cliente, como lo lee una persona. */
function texto(html: string): string {
  const entidades: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return n === 0xa0 ? " " : String.fromCodePoint(n);
      }
      return entidades[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/** Donde termina el <div> que abre en `desde`, contando los de adentro. */
function cierreDeDiv(html: string, desde: number): number {
  const re = /<div\b[^>]*>|<\/div\s*>/gi;
  re.lastIndex = desde;
  let nivel = 0;
  for (let m; (m = re.exec(html)); ) {
    nivel += m[0][1] === "/" ? -1 : 1;
    if (nivel === 0) return re.lastIndex;
  }
  return -1;
}

type Paso = { titulo: string; texto: string };

/**
 * Los pasos, leidos del mismo HTML que ve el visitante.
 *
 * Se leen de la plantilla y no se copian a mano en ningun lado porque el
 * marcado estructurado tiene que decir exactamente lo que la pagina muestra:
 * marcar pasos que el visitante no lee es motivo de penalizacion. Asi, cuando
 * el cliente cambie un texto y se reimporte, el JSON-LD lo sigue solo.
 *
 * Un paso es un `.step-copy` cuyo rotulo dice "Paso N de M". La portada y el
 * cierre no lo son. Si la numeracion no cierra (falta un paso, se repite uno)
 * se corta el build: es la señal de que el cliente cambio la estructura y hay
 * que mirar esto antes de publicar.
 */
function pasosDe(id: IdGuia, html: string): Map<string, Paso[]> {
  const recorridos = new Map<string, { n: number; total: number; paso: Paso }[]>();
  for (const m of html.matchAll(/<div\b[^>]*\sclass="[^"]*\bstep-copy\b[^"]*"[^>]*>/gi)) {
    const fin = cierreDeDiv(html, m.index);
    const bloque = html.slice(m.index, fin);
    const rotulo = /<p\b[^>]*class="[^"]*\beyebrow\b[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(bloque);
    const numero = rotulo && /Paso\s+(\d+)\s+de\s+(\d+)/i.exec(texto(rotulo[1]));
    if (!numero) continue;
    const titulo = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/i.exec(bloque);
    // Solo los <p> sin clase: el rotulo, el contador de horas y el boton de
    // cambiar de mate son <p> con clase y no son parte de la explicacion.
    const parrafos = [...bloque.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((p) => texto(p[1]));
    const clave = /\sdata-mate="([^"]*)"/.exec(m[0])?.[1] ?? "";
    const lista = recorridos.get(clave) ?? [];
    lista.push({
      n: +numero[1],
      total: +numero[2],
      paso: { titulo: titulo ? texto(titulo[2]) : "", texto: parrafos.join(" ") },
    });
    recorridos.set(clave, lista);
  }

  const nombres: Record<string, string> = GUIAS[id].recorridos;
  if (recorridos.size === 0) throw new Error(`La guia "${id}" no tiene pasos ("Paso N de M").`);
  const salida = new Map<string, Paso[]>();
  for (const [clave, lista] of recorridos) {
    if (!nombres[clave]) {
      throw new Error(`La guia "${id}" tiene un recorrido "${clave}" que no tiene nombre en src/lib/guias.ts.`);
    }
    const total = lista[0].total;
    const ok = lista.length === total && lista.every((p, i) => p.n === i + 1 && p.total === total && p.paso.titulo);
    if (!ok) throw new Error(`Los pasos del recorrido "${clave || id}" de la guia "${id}" no estan numerados de 1 a N.`);
    salida.set(clave, lista.map((p) => p.paso));
  }
  for (const clave of Object.keys(nombres)) {
    if (!salida.has(clave)) throw new Error(`La guia "${id}" ya no tiene el recorrido "${clave}" de src/lib/guias.ts.`);
  }
  return salida;
}

function jsonLd(id: IdGuia, html: string, url: string, imagen: string, fecha: string) {
  const guia = GUIAS[id];
  const nombres: Record<string, string> = guia.recorridos;
  // Los nodos de la tienda y del sitio los declara el JSON-LD de la home; aca
  // solo se los nombra por su @id, para que el buscador lea una sola tienda y
  // no dos que se llaman igual. Son `ID_TIENDA` e `ID_SITIO` de `schema.ts` en
  // la rama de SEO, que esta todavia no tiene: por eso van escritos aca.
  const tienda = `${SITE.url}/#tienda`;
  const sitio = `${SITE.url}/#sitio`;
  const howtos = [...pasosDe(id, html)].map(([clave, pasos]) => ({
    "@type": "HowTo",
    "@id": `${url}#${clave || "pasos"}`,
    name: nombres[clave],
    inLanguage: "es-UY",
    image: imagen,
    step: pasos.map((p, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: p.titulo,
      text: p.texto || p.titulo,
    })),
  }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: guia.titulo,
        description: guia.descripcion,
        inLanguage: "es-UY",
        dateModified: fecha,
        isPartOf: { "@id": sitio },
        publisher: { "@id": tienda },
        mainEntity: howtos.map((h) => ({ "@id": h["@id"] })),
      },
      ...howtos,
    ],
  };
}

function cabeza(id: IdGuia, html: string): string {
  const guia = GUIAS[id];
  // Armadas como el resto de las URLs del sitio (`schema.ts`, el sitemap): el
  // canonical, `og:url` y el sitemap tienen que decir exactamente lo mismo.
  const url = `${SITE.url}${guia.ruta}`;
  const imagen = `${url}/opengraph-image`;
  const fecha = fechaDe(id, html);
  const alt = `${guia.og.linea} ${guia.og.bajada}. ${SITE.nombre}.`;
  const meta = (atributo: "name" | "property", clave: string, valor: string) =>
    `<meta ${atributo}="${clave}" content="${esc(valor)}">`;
  // Igual que el `<script>` de la home: un "</script>" adentro de un texto
  // cerraria la etiqueta antes de tiempo.
  const datos = JSON.stringify(jsonLd(id, html, url, imagen, fecha)).replace(/</g, "\\u003c");

  return [
    `<title>${esc(`${guia.titulo} | ${SITE.nombre}`)}</title>`,
    meta("name", "description", guia.descripcion),
    // Mismo criterio que el `robots` del layout: solo el dominio real indexa.
    meta("name", "robots", SE_INDEXA ? "index, follow" : "noindex, nofollow"),
    `<link rel="canonical" href="${esc(url)}">`,
    meta("property", "og:type", "article"),
    meta("property", "og:url", url),
    meta("property", "og:locale", "es_UY"),
    meta("property", "og:site_name", SITE.nombre),
    meta("property", "og:title", guia.titulo),
    meta("property", "og:description", guia.descripcion),
    meta("property", "og:image", imagen),
    meta("property", "og:image:width", "1200"),
    meta("property", "og:image:height", "630"),
    meta("property", "og:image:alt", alt),
    meta("property", "article:modified_time", fecha),
    // Los mismos que Next arma para la home a partir de su Open Graph.
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", guia.titulo),
    meta("name", "twitter:description", guia.descripcion),
    meta("name", "twitter:image", imagen),
    meta("name", "twitter:image:alt", alt),
    `<link rel="icon" href="/icon.svg" type="image/svg+xml" sizes="any">`,
    // La escena 3D baja three.js de este CDN. Abrir la conexion mientras se lee
    // el HTML le gana un viaje de ida y vuelta al primer cuadro.
    `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>`,
    `<script type="application/ld+json">${datos}</script>`,
  ].join("\n");
}

export function paginaGuia(id: IdGuia): Response {
  const plantilla = leer(id);
  if (plantilla.split(MARCA_HEAD).length !== 2) {
    throw new Error(`La plantilla de la guia "${id}" tiene que tener ${MARCA_HEAD} una sola vez.`);
  }
  // Con funcion y no con el texto directo: en un reemplazo de texto, "$&" o
  // "$'" significan otra cosa, y la descripcion o el JSON-LD los podrian traer.
  const html = plantilla.replace(CABECERA, "").replace(MARCA_HEAD, () => cabeza(id, plantilla));
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
