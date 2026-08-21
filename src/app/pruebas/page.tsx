import type { Metadata } from "next";
import { getCatalogo } from "@/lib/catalog";
import { Selector } from "@/components/pruebas/Selector";

/** Banco de pruebas de la tienda: tres formas distintas de recorrer el mismo
 *  catalogo real. No se enlaza desde ningun lado y no se indexa. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Pruebas de la tienda",
  robots: { index: false, follow: false },
};

export default async function Pruebas() {
  const catalogo = await getCatalogo();
  return (
    <main className="min-h-[100dvh] bg-papel">
      <Selector catalogo={catalogo} />
    </main>
  );
}
