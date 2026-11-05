import { paginaGuia } from "@/guias/servir";

/** La guia es el HTML del cliente servido tal cual: no pasa por React ni por
 *  el layout, que le pisarian su CSS. Se genera al construir porque lo unico
 *  que cambia entre ambientes (el dominio y si se indexa) son `NEXT_PUBLIC_*`
 *  que ya quedan fijas en el build. */
export const dynamic = "force-static";

export function GET() {
  return paginaGuia("curar");
}
