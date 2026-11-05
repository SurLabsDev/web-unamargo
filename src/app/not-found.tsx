import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

/** La 404 de Next viene en ingles ("This page could not be found"), y en una
 *  tienda uruguaya eso se lee como un sitio roto. Esta dice lo mismo en su
 *  idioma y con su letra, y saca a la persona hacia donde puede comprar.
 *  `noindex` porque una pagina que no existe no tiene nada que ofrecer en un
 *  buscador. */
export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: true },
};

export default function NoEncontrada() {
  return (
    <main className="flex min-h-svh flex-col justify-center px-5 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <Link
          href="/"
          aria-label="Un Amargo, ir al inicio"
          className="mb-16 inline-flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-70"
        >
          <Logo className="h-8 w-auto" />
          <span className="text-lg font-semibold tracking-tight">Un Amargo</span>
        </Link>
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-tinta-suave">
          Error 404
        </p>
        <h1 className="type-display text-[clamp(2.75rem,8vw,6rem)]">
          Esta página
          <br />
          no existe.
        </h1>
        <p className="type-body mt-6 max-w-[48ch] text-lg leading-relaxed text-tinta-media">
          Puede que el link esté mal escrito o que la página ya no esté. La
          tienda sigue en el mismo lugar.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/#tienda"
            className="rounded-pill bg-tinta px-7 py-3.5 text-sm font-semibold text-papel transition-transform duration-300 hover:scale-[1.03]"
          >
            Ver los productos
          </Link>
          <Link
            href="/"
            className="rounded-pill border border-linea px-7 py-3.5 text-sm font-semibold transition-colors hover:border-tinta"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
