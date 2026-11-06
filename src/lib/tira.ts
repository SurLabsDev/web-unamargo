import { selloErp, urlDelErp } from "./site";
import { fotoServible } from "./fotos";

/** Contrato de /api/public/v1/tira del ERP: las fotos que corren abajo del
 *  hero, en el orden en que se muestran. Las carga el cliente desde el ERP; si
 *  no cargo ninguna, llega la lista vacia.
 *
 *  `width` y `height` son los px del archivo. La web los necesita ANTES de
 *  bajar la foto: cada una se dibuja con su proporcion, y de los anchos sale
 *  la duracion de la animacion (ver Tira.tsx). */
export type FotoTira = {
  url: string;
  width: number;
  height: number;
  alt: string | null;
};

/** Un lado de la foto en px: entero y mayor que cero. Un cero, un negativo o
 *  un texto romperian la proporcion de la foto y, con ella, la velocidad de
 *  toda la tira. */
function lado(v: unknown): number | null {
  return typeof v === "number" && Number.isSafeInteger(v) && v > 0 ? v : null;
}

/** Una foto del ERP, o null si no se puede dibujar. Se valida aca aunque el
 *  ERP ya valide al guardar, por lo mismo que el pop-up: lo que se pinta en la
 *  web del cliente no puede depender de que otro sistema no tenga un bug. */
function leerFoto(crudo: unknown): FotoTira | null {
  if (typeof crudo !== "object" || crudo === null) return null;
  const f = crudo as Record<string, unknown>;
  const url = typeof f.url === "string" ? f.url.trim() : "";
  const width = lado(f.width);
  const height = lado(f.height);
  if (!fotoServible(url) || !width || !height) return null;
  // `alt` es texto o null y nada mas. Si falta o viene otra cosa, el ERP no
  // esta cumpliendo el contrato y la foto se descarta entera, igual que con
  // una URL mala.
  if (typeof f.alt !== "string" && f.alt !== null) return null;
  const alt = typeof f.alt === "string" && f.alt.trim() ? f.alt.trim() : null;
  return { url, width, height, alt };
}

/** Las fotos de la tira que mando el ERP, en su orden. Las que no se pueden
 *  dibujar se descartan una por una y el resto sale igual.
 *
 *  null si el ERP no contesto o contesto algo que no es el contrato. Cualquier
 *  falla da null: la tira tiene sus fotos de siempre para eso (ver Tira.tsx),
 *  y una tira que no carga no es motivo para que la pagina no cargue. */
export async function getTira(): Promise<FotoTira[] | null> {
  try {
    // Al lado del de stock, en la misma version de la misma API, como el del
    // pop-up: si la web apunta a otra instancia con `NEXT_PUBLIC_ERP_API`, la
    // tira viene de esa misma instancia. Se arma ADENTRO del try: una variable
    // mal escrita deja la tira con las fotos de siempre, no tira la pagina.
    const url = urlDelErp("tira");
    // Un sello nuevo en cada pedido, como el catalogo: el endpoint cachea 60s
    // en el CDN del ERP, y sin el la regeneracion que dispara un aviso del ERP
    // podia recibir la respuesta de antes del cambio (ver `selloErp`).
    url.searchParams.set("v", selloErp());
    const res = await fetch(url, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (typeof data !== "object" || data === null) return null;
    const fotos = (data as { photos?: unknown }).photos;
    if (!Array.isArray(fotos)) return null;
    return fotos.map(leerFoto).filter((f): f is FotoTira => f !== null);
  } catch {
    return null;
  }
}
