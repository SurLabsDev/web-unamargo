import { selloErp, urlDelErp } from "./site";
import { fotoServible } from "./fotos";

/** Contrato de /api/public/v1/popup del ERP: el pop-up que el cliente tiene
 *  prendido hoy, o null. Lo arma el cliente desde el ERP (pantalla Pop-ups) y
 *  el ERP decide cual va cuando hay mas de uno: la web muestra lo que llega.
 *
 *  `version` es opaca: cambia cuando el pop-up se edita o cuando pasa a
 *  mostrarse otro. Es lo que la web recuerda para no repetirselo al mismo
 *  visitante, asi que editarlo alcanza para que lo vuelvan a ver. */
export type Popup = {
  version: string;
  title: string;
  body: string | null;
  image: string | null;
  cta: { label: string; url: string } | null;
};

/** Un link que el pop-up puede abrir: una seccion de esta pagina (`#tienda`)
 *  o una pagina segura de afuera. El ERP ya lo valida al guardar; se vuelve a
 *  validar aca porque lo que se pinta en la web del cliente no puede depender
 *  de que otro sistema no tenga un bug: un `javascript:` en un link es codigo
 *  corriendo en la tienda. */
function linkSeguro(url: string): boolean {
  if (/^#[A-Za-z0-9-]+$/.test(url)) return true;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function texto(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function leer(crudo: unknown): Popup | null {
  if (typeof crudo !== "object" || crudo === null) return null;
  const p = crudo as Record<string, unknown>;
  const version = texto(p.version);
  const title = texto(p.title);
  if (!version || !title) return null;

  const image = texto(p.image);
  const cta =
    typeof p.cta === "object" && p.cta !== null
      ? (p.cta as Record<string, unknown>)
      : null;
  const ctaLabel = texto(cta?.label);
  const ctaUrl = texto(cta?.url);

  return {
    version,
    title,
    body: texto(p.body),
    // Una foto que `next/image` no puede servir se descarta y el pop-up sale
    // sin foto (ver `fotoServible`).
    image: image && fotoServible(image) ? image : null,
    cta: ctaLabel && ctaUrl && linkSeguro(ctaUrl) ? { label: ctaLabel, url: ctaUrl } : null,
  };
}

/** El pop-up vigente, o null. Cualquier falla da null: un pop-up que no
 *  carga no es motivo para que la pagina no cargue. */
export async function getPopup(): Promise<Popup | null> {
  try {
    // Al lado del de stock, en la misma version de la misma API: si la web
    // apunta a otra instancia con `NEXT_PUBLIC_ERP_API`, el pop-up viene de
    // esa misma instancia sin configurar nada mas. Se arma ADENTRO del try: una
    // variable mal escrita no puede tirar la pagina, solo dejarla sin pop-up.
    const url = urlDelErp("popup");
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
    return leer((data as { popup?: unknown }).popup);
  } catch {
    return null;
  }
}
