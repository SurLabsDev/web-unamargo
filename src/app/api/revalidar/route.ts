import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";

/**
 * Aviso del ERP: "cambio algo del catalogo, volve a generar la home".
 *
 * Existe porque sin esto un cambio de precio tarda hasta 5 minutos EN EL MEJOR
 * caso: la pagina se revalida sola cada 300s, y ademas la primera visita
 * despues de vencer todavia sirve la version vieja mientras regenera por
 * detras. O sea que el cliente edita, refresca, ve el precio viejo y concluye
 * que el ERP no guardo.
 *
 * El revalidado por tiempo se queda igual, como red: si este aviso se pierde
 * -deploy en curso, red caida-, la pagina se pone al dia sola mas tarde.
 */
export const runtime = "nodejs";

function igualSinFiltrarTiempo(a: string, b: string): boolean {
  // Comparar con === filtra el secreto por el tiempo que tarda en fallar.
  // timingSafeEqual exige el mismo largo, asi que se chequea antes.
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

export async function POST(req: Request): Promise<Response> {
  const secreto = process.env.REVALIDATE_SECRET;
  if (!secreto) {
    // Sin secreto configurado no se revalida nada: un endpoint abierto deja que
    // cualquiera fuerce regeneraciones.
    return Response.json(
      { ok: false, motivo: "REVALIDATE_SECRET no está configurado" },
      { status: 503 },
    );
  }

  const dado = req.headers.get("x-revalidar-secreto");
  if (!dado || !igualSinFiltrarTiempo(dado, secreto)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  revalidatePath("/");
  return Response.json({ ok: true, momento: new Date().toISOString() });
}
