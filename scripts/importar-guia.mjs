#!/usr/bin/env node
/**
 * Trae al sitio una guia interactiva del cliente (curar o cebar).
 *
 *   node scripts/importar-guia.mjs curar ~/Downloads/curar.html
 *   node scripts/importar-guia.mjs cebar ~/Downloads/cebar.html
 *
 * El cliente arma las guias en claude.ai y las comparte como artifact. Lo que
 * se guarda de ahi NO es solo su pagina: el host le inyecta su propio runtime
 * (`window.__FRAME_PREAMBLE` mas un IIFE minificado de ~40 KB que habla con
 * claude.ai) y la envuelve en un esqueleto de documento suyo. Este script se
 * queda con lo del cliente y lo deja listo para servirse desde este dominio:
 *
 *  1. Saca lo del host. Queda su CSS, su marcado, su script de pasos, el
 *     importmap de three.js y su modulo 3D, sin tocarles una linea.
 *  2. Saca las imagenes en base64 a `public/guias/`. Embebidas, el HTML de
 *     curar pesaba 921 KB (560 KB comprimido) y habia que bajarlo entero antes
 *     de ver una letra; afuera viaja en 24 KB, el texto llega primero y las
 *     fotos se bajan aparte, se cachean y se comparten entre las dos guias. El
 *     archivo de cada una lleva el hash del contenido: si el
 *     cliente cambia una foto, la nueva entra con otro nombre y la otra guia,
 *     que puede seguir usando la vieja, no se entera.
 *  3. Apunta los enlaces a este sitio: el que iba a la otra guia en claude.ai
 *     va a su ruta de aca, el logo vuelve al inicio y el boton de Instagram del
 *     ultimo paso pasa a llevar a la tienda (Instagram queda en el encabezado).
 *  4. Escribe la plantilla en `src/guias/<guia>.html`. Las etiquetas que
 *     dependen del ambiente (titulo, canonical, robots, Open Graph, JSON-LD) NO
 *     van aca: las pone la ruta al construir, en el lugar de `<!--guia:head-->`.
 *
 * OJO CON CURAR: su plantilla lleva un parche local de rendimiento, marcado
 * `PARCHE LOCAL` (ver "Las guias de curar y cebar" en el README). Importar un
 * archivo nuevo del cliente escribe la plantilla de cero, solo con lo que trae
 * ese archivo, asi que el parche se pierde sin avisar y hay que volver a
 * aplicarlo. Pasar por aca la plantilla ya importada, para revalidarla, lo
 * deja como esta.
 *
 * Es codigo de un tercero que se publica con nuestro dominio. Por eso, si algo
 * no cierra, falla sin escribir nada: si queda codigo del host, si aparece un
 * host externo que no esta en la lista, si una dependencia del CDN no tiene la
 * version fija, o si un script hace algo con la red. Esto ultimo se puede
 * aceptar con `--revisado`, pero solo despues de leerlo.
 *
 * Correrlo dos veces con el mismo archivo deja todo igual, y se puede correr
 * sobre la plantilla ya importada para revalidarla.
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR_PLANTILLAS = join(RAIZ, "src", "guias");
const DIR_IMAGENES = join(RAIZ, "public", "guias");
const URL_IMAGENES = "/guias/";

/* Las rutas viven en `src/lib/guias.ts`, que es de donde las toma el resto del
   sitio. Se repiten aca porque este script corre con Node pelado y no puede
   importar TypeScript. Si una cambia, cambian las dos. */
const GUIAS = {
  curar: { ruta: "/como-curar-un-mate", otra: "cebar" },
  cebar: { ruta: "/como-cebar-un-mate", otra: "curar" },
};

/* El boton a la tienda del ultimo paso. Lleva las mismas clases que el
   "Seguinos" del cliente, cuyo lugar ocupa (ver `apuntarEnlaces`), asi hereda
   su estilo, incluido el blanco sobre negro del paso final. */
const TIENDA = "/#tienda";
const BOTON_TIENDA = `<a class="pill ghost" href="${TIENDA}">La tienda <span aria-hidden="true">→</span></a>`;

/* Los unicos hosts que la guia puede nombrar. Cualquier otro frena la
   importacion: una guia que de repente carga algo de un dominio nuevo es justo
   lo que hay que mirar antes de publicar. Si esta bien, se agrega aca. */
const HOSTS_PERMITIDOS = new Set([
  "cdn.jsdelivr.net",
  "www.instagram.com",
  "instagram.com",
  // espacios de nombres de SVG y XHTML: no se descargan, son identificadores
  "www.w3.org",
]);

/* Lo que un script de pasos o una escena 3D no tiene por que hacer. No es una
   revision de seguridad, es un aviso de que hay que leer antes de seguir. */
const SOSPECHOSOS = [
  [/\bfetch\s*\(/, "fetch"],
  [/XMLHttpRequest/, "XMLHttpRequest"],
  [/\bWebSocket\b/, "WebSocket"],
  [/\bEventSource\b/, "EventSource"],
  [/sendBeacon/, "sendBeacon"],
  [/\bimport\s*\(/, "import() dinamico"],
  [/\beval\s*\(/, "eval"],
  [/new\s+Function\b/, "new Function"],
  [/postMessage/, "postMessage"],
  [/document\.cookie/, "document.cookie"],
  [/window\.(?:parent|top|opener)\b/, "acceso a otra ventana"],
  [/\bnew\s+Worker\b|serviceWorker/, "workers"],
  [/document\.write/, "document.write"],
];

const EXTENSIONES = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  // SVG NO se extrae: un .svg servido desde nuestro dominio es un documento y
  // puede correr <script> u onload si alguien lo abre directo. Embebido como
  // data URI en un <img> no puede ejecutar nada, asi que queda embebido.
  "font/woff2": "woff2",
  "font/woff": "woff",
  "font/ttf": "ttf",
  "font/otf": "otf",
};

const RE_SCRIPT = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;
const RE_STYLE = /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi;
const RE_DATA = /data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/gi;
const MARCA_HEAD = "<!--guia:head-->";

// --- utilidades ------------------------------------------------------------

const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const kb = (n) => `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;

function fallar(mensaje) {
  console.error(`\n  No se importo nada.\n  ${mensaje.replace(/\n/g, "\n  ")}\n`);
  process.exit(1);
}

function atributo(tag, nombre) {
  const m = new RegExp(`\\s${nombre}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return m ? (m[1] ?? m[2] ?? m[3]) : null;
}

function sinAtributo(tag, nombre) {
  return tag.replace(new RegExp(`\\s${nombre}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)`, "gi"), "");
}

function conAtributo(tag, nombre, valor) {
  const limpio = sinAtributo(tag, nombre);
  return limpio.replace(/^<(\w+)/, `<$1 ${nombre}="${valor}"`);
}

/** Los atributos sueltos de una etiqueta, en orden. Solo para <html> y <body>. */
function atributos(texto) {
  const out = [];
  for (const m of texto.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    out.push([m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? ""]);
  }
  return out;
}

const PALABRAS_VACIAS = new Set(["de", "del", "la", "el", "los", "las", "un", "una", "y", "con", "para", "en", "a"]);

function slug(texto) {
  return (
    String(texto ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((p) => p && !PALABRAS_VACIAS.has(p))
      .join("-")
      .slice(0, 40)
      .replace(/-+$/, "") || "imagen"
  );
}

/** Donde termina un <div> que abre en `desde`, contando los <div> de adentro. */
function cierreDeDiv(html, desde) {
  const re = /<div\b[^>]*>|<\/div\s*>/gi;
  re.lastIndex = desde;
  let nivel = 0;
  for (let m; (m = re.exec(html)); ) {
    nivel += m[0][1] === "/" ? -1 : 1;
    if (nivel === 0) return re.lastIndex;
  }
  return -1;
}

// --- 1. lo del host -----------------------------------------------------------

function sacarHost(html) {
  let bytes = 0;
  const quitar = (m) => {
    bytes += Buffer.byteLength(m);
    return "";
  };
  // El bloque entero del runtime viene entre estas dos marcas.
  html = html.replace(/<!--\s*frame-runtime\s*-->[\s\S]*?<!--\s*\/frame-runtime\s*-->/gi, quitar);
  // Por si un dia cambian las marcas: un script del host se reconoce por lo que
  // nombra, y ninguno del cliente nombra estas cosas.
  html = html.replace(RE_SCRIPT, (m) => (/__FRAME_PREAMBLE|shellOrigin/.test(m) ? quitar(m) : m));
  // El estilo base que el host le pone a toda pagina publicada. Se saca porque
  // no cambia nada: el cliente define su propia tipografia, margenes y caja, y
  // lo unico que agrega son margenes de zona segura para un
  // `viewport-fit=cover` que aca no se usa. Medido contra el original con ese
  // estilo puesto: cada paso en reposo da la misma captura, pixel a pixel.
  html = html.replace(RE_STYLE, (m) =>
    /\[hidden\]:not\(\[hidden=until-found i\]\)/.test(m) && /safe-area-inset/.test(m) ? quitar(m) : m,
  );
  return { html, bytes };
}

// --- 2. documento: que va al <head> y que al <body> -------------------------

function separar(html) {
  // Los scripts se apartan antes de tocar nada: adentro puede haber texto que
  // parezca una etiqueta, y nada de lo que sigue tiene que ver con ellos.
  const scripts = [];
  let resto = html.replace(RE_SCRIPT, (m) => `\u0000${scripts.push(m) - 1}\u0000`);

  // Nuestras propias marcas, por si se importa una plantilla ya importada.
  resto = resto.replace(/<!--guia[\s\S]*?-->/g, "");

  let titulo = null;
  let descripcion = null;
  const cabeza = [];
  const metas = [];
  const attrsHtml = new Map();
  const attrsBody = new Map();
  // Como hace el navegador con un <body> repetido: se suman los atributos que
  // falten. El de curar trae su propio `<body data-mate="calabaza">` adentro
  // del cuerpo que arma el host, y ese atributo es el que elige el mate.
  const juntar = (destino, texto) => {
    for (const [k, v] of atributos(texto)) if (!destino.has(k)) destino.set(k, v);
  };

  resto = resto
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/gi, (_, t) => {
      titulo ??= t.trim();
      return "";
    })
    .replace(/<meta\b[^>]*>/gi, (m) => {
      if (/\scharset\s*=/i.test(m) || /name\s*=\s*["']?viewport/i.test(m)) return "";
      if (/name\s*=\s*["']?description/i.test(m)) {
        descripcion ??= atributo(m, "content");
        return "";
      }
      metas.push(m);
      return "";
    })
    // Estilos y hojas externas juntos, para no cambiar el orden de la cascada.
    .replace(/<link\b[^>]*>|<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, (m) => {
      cabeza.push(m.trim());
      return "";
    })
    .replace(/<html\b([^>]*)>/gi, (_, a) => {
      juntar(attrsHtml, a);
      return "";
    })
    .replace(/<body\b([^>]*)>/gi, (_, a) => {
      juntar(attrsBody, a);
      return "";
    })
    .replace(/<\/?(?:html|head|body)\b[^>]*>/gi, "");

  // Los huecos que dejaron las etiquetas sacadas se ordenan ANTES de devolver
  // los scripts: adentro de un template literal un espacio o un renglon vacio
  // son parte del texto.
  const volver = (t) => t.replace(/\u0000(\d+)\u0000/g, (_, i) => scripts[+i]);
  const cuerpo = volver(
    resto
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );

  return { titulo, descripcion, cabeza: [...metas, ...cabeza.map(volver)], cuerpo, attrsHtml, attrsBody };
}

// --- 3. imagenes ------------------------------------------------------------

const GENERICAS = new Set(["photo", "foto", "tex", "texture", "textura", "img", "image", "imagen", "src", "url", "map", "data"]);

/** Un nombre para una imagen embebida en codigo, sacado de lo que tiene
 *  escrito antes. En las guias del cliente alcanza con tres pistas: la clave
 *  del objeto en el que esta (`algarrobo: { photo: ... }`), la variable que la
 *  carga (`const interiorTex = loader.load(...)`) y el archivo original que
 *  nombran sus comentarios (`images/bombilla.png`). Si no hay ninguna, queda
 *  "imagen" y el hash la distingue. */
function nombrePorContexto(antes) {
  const objeto = /(\w+)\s*[:=]\s*\{[^{}]*$/.exec(antes);
  const variable =
    /(\w+)\s*:\s*["'`]$/.exec(antes) ?? /(\w+)\s*=\s*[\w.]+\.load(?:Async)?\(\s*["'`]$/.exec(antes);
  const pista = [...antes.matchAll(/images\/([\w-]+)\.(?:jpe?g|png|webp|avif|gif|svg)/gi)].pop();

  const partes = [];
  if (objeto) partes.push(objeto[1]);
  else if (pista) partes.push(pista[1]);
  if (variable) partes.push(...variable[1].split(/(?=[A-Z])|_/));
  const limpias = [...new Set(partes.map((p) => slug(p)).filter((p) => p !== "imagen" && !GENERICAS.has(p)))];
  return limpias.join("-") || "imagen";
}

function crearAlmacen() {
  // Lo que ya esta en disco, por contenido: una imagen que no cambio conserva
  // su archivo aunque el cliente la haya movido de lugar en el codigo.
  const porHash = new Map();
  if (existsSync(DIR_IMAGENES)) {
    for (const f of readdirSync(DIR_IMAGENES)) {
      const ruta = join(DIR_IMAGENES, f);
      if (statSync(ruta).isFile()) porHash.set(sha(readFileSync(ruta)), f);
    }
  }
  const usadas = new Map(); // archivo -> { nuevo, bytes }
  const embebidas = [];
  const aEscribir = new Map();
  let ocurrencias = 0;

  return {
    guardar(uri, nombre) {
      const [, tipo, base64] = /^data:([^;]+);base64,(.+)$/s.exec(uri);
      const ext = EXTENSIONES[tipo.toLowerCase()];
      if (!ext) {
        embebidas.push(tipo);
        return uri;
      }
      ocurrencias++;
      const buf = Buffer.from(base64, "base64");
      const hash = sha(buf);
      let archivo = porHash.get(hash);
      if (!archivo) {
        archivo = `${nombre}-${hash.slice(0, 8)}.${ext}`;
        porHash.set(hash, archivo);
        aEscribir.set(archivo, buf);
      }
      if (!usadas.has(archivo)) usadas.set(archivo, { nuevo: aEscribir.has(archivo), bytes: buf.length });
      return URL_IMAGENES + archivo;
    },
    /** Reemplaza las embebidas de un texto, nombrandolas por su contexto. */
    extraer(texto) {
      let out = "";
      let desde = 0;
      for (const m of texto.matchAll(RE_DATA)) {
        out += texto.slice(desde, m.index);
        // 12 KB hacia atras: entre el comentario que nombra la foto del mate y la
        // linea que la carga, el cliente tiene la silueta medida fila por fila.
        out += this.guardar(m[0], nombrePorContexto(out.slice(-12000)));
        desde = m.index + m[0].length;
      }
      return out + texto.slice(desde);
    },
    get usadas() {
      return usadas;
    },
    get aEscribir() {
      return aEscribir;
    },
    get embebidas() {
      return embebidas;
    },
    get ocurrencias() {
      return ocurrencias;
    },
  };
}

// --- 4. enlaces -------------------------------------------------------------

function apuntarEnlaces(cuerpo, id) {
  const cambios = [];
  const otra = GUIAS[GUIAS[id].otra].ruta;

  // Las dos guias se enlazan entre si por su URL de claude.ai. Esa URL puede
  // cambiar si el cliente publica de nuevo, pero el destino no: desde una guia
  // el unico artifact que se nombra es la otra.
  cuerpo = cuerpo.replace(/<a\b[^>]*>/gi, (tag) => {
    const href = atributo(tag, "href") ?? "";
    if (!/^https?:\/\/(?:[\w-]+\.)*claude\.(?:ai|site)\//i.test(href)) return tag;
    cambios.push(`${href} -> ${otra}`);
    // Ahora es un enlace interno: se abre en la misma pestaña.
    return conAtributo(sinAtributo(sinAtributo(tag, "target"), "rel"), "href", otra);
  });

  // El logo iba al Instagram. En el sitio, el logo lleva al inicio.
  let marca = 0;
  cuerpo = cuerpo.replace(/<a\b[^>]*\sclass\s*=\s*["'][^"']*\bbrand\b[^"']*["'][^>]*>/gi, (tag) => {
    marca++;
    let t = sinAtributo(sinAtributo(tag, "target"), "rel");
    t = conAtributo(t, "href", "/");
    return conAtributo(t, "aria-label", "Un Amargo, ir al inicio");
  });
  if (marca === 0) fallar('No encontre el logo de la guia (<a class="brand">) para que vuelva al inicio.');
  cambios.push(`logo -> /`);

  // El boton a la tienda va en el ultimo paso, donde la guia termina y la
  // pregunta que sigue es donde se consigue el mate.
  //
  // TOMA EL LUGAR DEL "Seguinos" DE INSTAGRAM, no se suma como tercero. En el
  // celular entran dos botones por fila: un tercero la parte en dos, y en cebar
  // la bombilla 3D, que en ese paso sube hasta el texto, se mete adentro de la
  // segunda fila. Medido en el ultimo paso, entre el texto y la escena: sin el
  // boton quedan 19, 9 y 51 px a 375, 360 y 390 de ancho; como tercer boton, 2
  // px en los tres, o sea la bombilla encima. Instagram no se pierde: el
  // encabezado de la guia lo tiene a la vista en todos los pasos.
  //
  // "La tienda" y no "Ver los mates" porque mide 145 px, lo mismo que
  // "Seguinos", y la fila queda igual que la del cliente en cualquier ancho.
  // "Ver los mates" mide 174 y a 360 de ancho ya no entra en una fila.
  if (!cuerpo.includes(`href="${TIENDA}"`)) {
    const inicios = [...cuerpo.matchAll(/<div\b[^>]*\sclass\s*=\s*["'][^"']*\bstep-copy\b[^>]*>/gi)];
    if (inicios.length === 0) fallar("No encontre los pasos de la guia (.step-copy).");
    const ultimo = inicios.at(-1);
    const fin = cierreDeDiv(cuerpo, ultimo.index);
    if (fin < 0) fallar("El ultimo paso de la guia no cierra su <div>.");
    const bloque = cuerpo.slice(ultimo.index, fin);
    const instagram = [...bloque.matchAll(/<a\b[^>]*>[\s\S]*?<\/a\s*>/gi)].find(([a]) => {
      const tag = /^<a\b[^>]*>/i.exec(a)[0];
      return /\bpill\b/.test(atributo(tag, "class") ?? "") && /instagram\.com/i.test(atributo(tag, "href") ?? "");
    });
    let nuevo;
    if (instagram) {
      nuevo = bloque.slice(0, instagram.index) + BOTON_TIENDA + bloque.slice(instagram.index + instagram[0].length);
      cambios.push(`boton "Seguinos" del ultimo paso -> "La tienda" ${TIENDA} (Instagram sigue en el encabezado)`);
    } else {
      // Si un dia el cliente saca ese boton, el de la tienda se suma primero.
      // Puede partir la fila en el celular: hay que mirarlo.
      const acciones = /<div\b[^>]*\sclass\s*=\s*["'][^"']*\bactions\b[^"']*["'][^>]*>/i.exec(bloque);
      nuevo = acciones
        ? bloque.slice(0, acciones.index + acciones[0].length) +
          `\n      ${BOTON_TIENDA}` +
          bloque.slice(acciones.index + acciones[0].length)
        : bloque.replace(/<\/div\s*>$/, `  <div class="actions">\n      ${BOTON_TIENDA}\n    </div>\n  </div>`);
      cambios.push(`boton "La tienda" ${TIENDA} sumado al ultimo paso. OJO: el ultimo paso ya no tenia el`);
      cambios.push(`  "Seguinos" de Instagram; mirar en un celular de 360 px que la fila no choque con el mate`);
    }
    cuerpo = cuerpo.slice(0, ultimo.index) + nuevo + cuerpo.slice(fin);
  }
  return { cuerpo, cambios };
}

// --- 5. revision ------------------------------------------------------------

function revisar(html, { revisado }) {
  const errores = [];
  if (/__FRAME_PREAMBLE|shellOrigin|frame-runtime/.test(html)) errores.push("Quedo codigo del host de claude.ai.");
  if (/claude\.(?:ai|site)/i.test(html)) errores.push("Quedo una referencia a claude.ai.");
  if (html.split(MARCA_HEAD).length !== 2) errores.push(`La plantilla tiene que tener ${MARCA_HEAD} una sola vez.`);
  if (!/\bstep-copy\b/.test(html)) errores.push("No quedaron pasos (.step-copy).");

  const externos = new Set();
  // Toda referencia a otro origen, no solo las "http(s)://" en minusculas: el
  // navegador tambien carga "HTTPS://host", "wss://host" y "//host" (que sale
  // por https en este sitio). Las "//host" se buscan solo detras de comillas,
  // "(" o "=", que es donde las pone un atributo, un string o un url() de
  // CSS: detras de un espacio son casi siempre comentarios de JS.
  // Antes de buscar: "\/" vale "/" adentro de un string de JS
  // ("https:\/\/host" carga igual), asi que se normaliza.
  const plano = html.replace(/\\\//g, "/");
  const candidatas = [
    ...plano.matchAll(/\b[a-z][a-z0-9+.-]*:\/\/[^\s"'`<>()\\]+/gi),
    // Detras de comillas, "(", "=" o "," (los candidatos de un srcset), con
    // espacios opcionales en el medio: "src= //host", "1x, //host 2x".
    ...plano.matchAll(/(?<=["'`(=,]\s*)\/\/[^\s"'`<>()\\/]+[^\s"'`<>()\\]*/g),
  ].map((m) => m[0]);
  for (const url of candidatas) {
    let host;
    try {
      host = new URL(url, "https://local.invalid/").hostname;
    } catch {
      errores.push(`URL que no se entiende: ${url}`);
      continue;
    }
    if (host === "local.invalid") continue;
    if (!HOSTS_PERMITIDOS.has(host)) errores.push(`Host externo no permitido: ${url}`);
    // Un CDN sin version fija sirve lo que haya hoy: la guia podria romperse
    // sola, o cambiar de codigo sin que nadie lo revise.
    if (host === "cdn.jsdelivr.net" && !/\/npm\/(?:@[\w.-]+\/)?[\w.-]+@\d+\.\d+\.\d+\//.test(url)) {
      errores.push(`Dependencia del CDN sin version fija: ${url}`);
    }
    if (host !== "www.w3.org") externos.add(url.replace(/^https?:\/\//, "").replace(/\/(?:build|examples)\/.*$/, ""));
  }

  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].map(([, attrs, cuerpo]) => {
    const tipo = atributo(attrs ? `<x ${attrs}>` : "<x>", "type") ?? "clasico";
    // El primer comentario dice que es cada script; el importmap no tiene.
    const primera =
      tipo === "importmap" ? "" : (/^\s*\/\/\s*(.+)$/m.exec(cuerpo)?.[1] ?? "").replace(/^[─\s]+|[─\s]+$/g, "");
    const avisos = SOSPECHOSOS.filter(([re]) => re.test(cuerpo)).map(([, n]) => n);
    if (attrs && /\ssrc\s*=/i.test(` ${attrs}`)) avisos.push(`src externo ${atributo(`<x ${attrs}>`, "src")}`);
    return { tipo, bytes: Buffer.byteLength(cuerpo), primera, avisos };
  });
  // Los manejadores en linea (onclick=, onload=...) tambien son codigo, aunque
  // no esten adentro de un <script>: se revisan con las mismas reglas.
  // Tambien sin comillas (onerror=eval(...)) y sin espacio adelante
  // (<img src="x"onerror=...>, <svg/onload=...>): el navegador los corre igual.
  const enLinea = [
    ...html.matchAll(/(?:^|[\s/"'])on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi),
  ].map(([, valor]) => valor);
  const avisosEnLinea = [...new Set(enLinea.flatMap((v) => SOSPECHOSOS.filter(([re]) => re.test(v)).map(([, n]) => n)))];
  if (avisosEnLinea.length) {
    scripts.push({ tipo: "manejadores en linea (on*=)", bytes: Buffer.byteLength(enLinea.join("")), primera: "", avisos: avisosEnLinea });
  }
  const conAvisos = scripts.filter((s) => s.avisos.length);
  if (conAvisos.length && !revisado) {
    errores.push(
      "Un script hace cosas que una guia no deberia necesitar:\n" +
        conAvisos.map((s) => `  - ${s.tipo} (${kb(s.bytes)}): ${s.avisos.join(", ")}`).join("\n") +
        "\nLeelo. Si esta bien, volve a correr con --revisado.",
    );
  }
  return { errores, externos, scripts };
}

// --- 6. limpieza --------------------------------------------------------------

/** Las imagenes que nadie nombra ya. Se busca en todo `src`, no solo en las
 *  plantillas, por si algun componente usa una foto de las guias. */
function huerfanas() {
  const nombradas = new Set();
  const recorrer = (dir) => {
    for (const f of readdirSync(dir)) {
      const ruta = join(dir, f);
      if (statSync(ruta).isDirectory()) recorrer(ruta);
      else if (/\.(?:html|tsx?|css|mjs|js|json)$/.test(f)) {
        for (const m of readFileSync(ruta, "utf8").matchAll(/\/guias\/([\w.-]+\.\w+)/g)) nombradas.add(m[1]);
      }
    }
  };
  recorrer(join(RAIZ, "src"));
  if (!existsSync(DIR_IMAGENES)) return [];
  // Solo las que siguen el formato de este script: lo que alguien haya puesto
  // a mano en la carpeta no se borra.
  return readdirSync(DIR_IMAGENES).filter((f) => /^[a-z0-9-]+-[0-9a-f]{8}\.\w+$/.test(f) && !nombradas.has(f));
}

// --- principal ----------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const revisado = args.includes("--revisado");
  const [id, archivo] = args.filter((a) => !a.startsWith("--"));
  if (!GUIAS[id] || !archivo) {
    fallar(
      "Uso: node scripts/importar-guia.mjs <curar|cebar> <archivo.html> [--revisado]\n" +
        "El archivo es el HTML de la guia tal como lo manda el cliente o como se guarda del artifact.",
    );
  }
  if (!existsSync(archivo)) fallar(`No existe el archivo ${archivo}`);

  const original = readFileSync(archivo, "utf8").replace(/\r\n?/g, "\n");
  const { html: sinHost, bytes: bytesHost } = sacarHost(original);
  const doc = separar(sinHost);

  // Un archivo cambiado de guia se nota en el titulo del cliente: mejor frenar
  // que publicar la de cebar en la ruta de curar.
  if (doc.titulo && !new RegExp(id, "i").test(slug(doc.titulo))) {
    fallar(`El titulo del archivo es "${doc.titulo}" y no parece la guia de ${id}. ¿Se cambiaron los archivos?`);
  }

  const almacen = crearAlmacen();
  // En una <img> el mejor nombre es su texto alternativo.
  let cuerpo = doc.cuerpo.replace(/<img\b[^>]*>/gi, (tag) =>
    tag.replace(RE_DATA, (uri) => almacen.guardar(uri, slug(atributo(tag, "alt")))),
  );
  cuerpo = almacen.extraer(cuerpo);
  const cabeza = doc.cabeza.map((c) => almacen.extraer(c));

  const enlaces = apuntarEnlaces(cuerpo, id);
  cuerpo = enlaces.cuerpo;

  const attrsHtml = new Map(doc.attrsHtml);
  attrsHtml.set("lang", "es-UY");
  const htmlAttrs = [...attrsHtml].map(([k, v]) => (v === "" ? ` ${k}` : ` ${k}="${v}"`)).join("");
  const bodyAttrs = [...doc.attrsBody].map(([k, v]) => (v === "" ? ` ${k}` : ` ${k}="${v}"`)).join("");

  const destino = join(DIR_PLANTILLAS, `${id}.html`);
  const contenido = (fecha) =>
    [
      "<!doctype html>",
      "<!--guia",
      `  Guia "${id}", servida en ${GUIAS[id].ruta}. La genera scripts/importar-guia.mjs`,
      "  con el HTML que manda el cliente: no se edita a mano, se vuelve a importar.",
      `  Origen: ${basename(archivo)}`,
      `  Actualizada: ${fecha}`,
      "-->",
      `<html${htmlAttrs}>`,
      "<head>",
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      MARCA_HEAD,
      ...cabeza,
      "</head>",
      `<body${bodyAttrs}>`,
      cuerpo,
      "</body>",
      "</html>",
      "",
    ].join("\n");

  // La fecha solo cambia si cambio la guia: es la que leen el sitemap y el
  // JSON-LD, y un "modificado hoy" en cada reimportacion seria mentira.
  const hoy = new Date().toISOString().slice(0, 10);
  let fecha = hoy;
  if (existsSync(destino)) {
    const previa = readFileSync(destino, "utf8");
    const fechaPrevia = /Actualizada: (\d{4}-\d{2}-\d{2})/.exec(previa)?.[1];
    const sinCabecera = (t) => t.replace(/<!--guia[\s\S]*?-->/, "");
    if (fechaPrevia && sinCabecera(previa) === sinCabecera(contenido(fechaPrevia))) fecha = fechaPrevia;
  }
  const plantilla = contenido(fecha);

  const { errores, externos, scripts } = revisar(plantilla, { revisado });
  if (errores.length) fallar(errores.join("\n"));

  mkdirSync(DIR_IMAGENES, { recursive: true });
  for (const [nombre, buf] of almacen.aEscribir) writeFileSync(join(DIR_IMAGENES, nombre), buf);
  mkdirSync(DIR_PLANTILLAS, { recursive: true });
  writeFileSync(destino, plantilla);
  const borradas = huerfanas();
  for (const f of borradas) unlinkSync(join(DIR_IMAGENES, f));

  // --- informe ---
  const pesoImagenes = [...almacen.usadas.values()].reduce((a, u) => a + u.bytes, 0);
  const lineas = [
    `Guia "${id}" importada desde ${basename(archivo)} (${kb(Buffer.byteLength(original))}).`,
    "",
    `  Del host se sacaron ${kb(bytesHost)}: el runtime de claude.ai y el esqueleto del documento.`,
    `  Titulo del cliente: "${doc.titulo ?? "(sin titulo)"}". En el sitio lo reemplaza el de src/lib/guias.ts.`,
    "  Scripts que quedan (revisarlos si cambiaron):",
    ...scripts.map((s) => `    - ${s.tipo}, ${kb(s.bytes)}${s.primera ? `: ${s.primera}` : ""}${s.avisos.length ? `  [${s.avisos.join(", ")}]` : ""}`),
    `  Externos: ${[...externos].join(", ") || "ninguno"}`,
    "",
    `  Imagenes: ${almacen.ocurrencias} embebidas -> ${almacen.usadas.size} archivos, ${kb(pesoImagenes)}.`,
    ...[...almacen.usadas].map(([f, u]) => `    ${u.nuevo ? "nueva " : "igual "} public/guias/${f}  ${kb(u.bytes)}`),
    ...borradas.map((f) => `    borrada public/guias/${f} (ya no la usa nadie)`),
    ...(almacen.embebidas.length ? [`    quedaron embebidas (tipo sin extension conocida): ${almacen.embebidas.join(", ")}`] : []),
    "",
    "  Enlaces:",
    ...enlaces.cambios.map((c) => `    ${c}`),
    "",
    `  Plantilla: ${relative(RAIZ, destino)}, ${kb(Buffer.byteLength(plantilla))}. Actualizada: ${fecha}.`,
    "",
    "  Falta: npm run build y mirar la guia. Si cambiaron los pasos, revisar las",
    "  respuestas de src/lib/faq.ts, que los cuentan con palabras propias.",
  ];
  console.log(`\n  ${lineas.join("\n  ")}\n`);
}

main();
