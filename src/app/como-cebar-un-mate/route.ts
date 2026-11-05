import { paginaGuia } from "@/guias/servir";

/** Ver `como-curar-un-mate/route.ts`: es la misma ruta para la otra guia. */
export const dynamic = "force-static";

export function GET() {
  return paginaGuia("cebar");
}
