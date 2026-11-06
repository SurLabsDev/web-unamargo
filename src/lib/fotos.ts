/** Si una foto que manda el ERP se puede pasar a `next/image`.
 *
 *  El optimizador de Next solo acepta los hosts de `images.remotePatterns` en
 *  `next.config.ts`. Con uno que no esta en la lista, en desarrollo TIRA LA
 *  PAGINA ENTERA, y en produccion la foto sale rota porque el optimizador
 *  contesta 400. Por eso lo que viene del ERP se mira antes de pintarlo, y
 *  una foto que no pasa se descarta.
 *
 *  Es la misma regla que ese patron: https, cualquier proyecto de Supabase y
 *  solo el prefijo publico del Storage. Si se cambia uno, se cambia el otro.
 *  La usan el pop-up y la tira, y por eso vive aca y no en uno de los dos:
 *  dos copias de la misma regla terminan diciendo cosas distintas. */
export function fotoServible(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      u.hostname.endsWith(".supabase.co") &&
      u.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}
