"use client";

import { useEffect, useRef, useState } from "react";
import { Bag, List, X } from "@phosphor-icons/react/dist/ssr";
import { useCarrito } from "./cart/CartProvider";

const NAV = [
  { href: "#tienda", label: "Tienda" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#personalizados", label: "Personalizados" },
  { href: "#empresas", label: "Empresas" },
  { href: "#envios", label: "Envíos" },
];

export function Header() {
  const { unidades, setAbierto } = useCarrito();
  const [bajado, setBajado] = useState(false);
  const [menu, setMenu] = useState(false);
  const centinela = useRef<HTMLDivElement>(null);

  // El estado "bajado" se vigila con un centinela y IntersectionObserver.
  // Escuchar "scroll" correria en cada cuadro y trabaria el celular.
  useEffect(() => {
    const el = centinela.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setBajado(!e.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <div ref={centinela} className="absolute top-0 h-24 w-px" aria-hidden />
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
          bajado
            ? "border-b border-tinta/10 bg-papel/95 backdrop-blur-md"
            : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-5 md:h-[72px] lg:px-8">
          <a
            href="#top"
            className={`shrink-0 text-lg font-semibold tracking-tight transition-colors ${
              bajado ? "text-tinta" : "text-hueso"
            }`}
          >
            Un Amargo
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className={`text-sm transition-colors ${
                  bajado
                    ? "text-tinta-media hover:text-tinta"
                    : "text-hueso-medio hover:text-hueso"
                }`}
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setAbierto(true)}
              aria-label={`Ver el pedido, ${unidades} artículos`}
              className={`relative flex items-center gap-2 rounded-brand px-3 py-2 text-sm font-medium transition-colors ${
                bajado
                  ? "text-tinta hover:bg-papel-hondo"
                  : "text-hueso hover:bg-hueso/10"
              }`}
            >
              <Bag size={19} />
              <span className="hidden sm:inline">Pedido</span>
              {unidades > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-verde px-1.5 text-[11px] font-bold tabular-nums text-hueso">
                  {unidades}
                </span>
              )}
            </button>
            <button
              onClick={() => setMenu((v) => !v)}
              aria-label={menu ? "Cerrar el menu" : "Abrir el menu"}
              aria-expanded={menu}
              className={`rounded-brand p-2 lg:hidden ${
                bajado ? "text-tinta" : "text-hueso"
              }`}
            >
              {menu ? <X size={21} weight="bold" /> : <List size={21} weight="bold" />}
            </button>
          </div>
        </div>

        {menu && (
          <nav className="border-t border-tinta/10 bg-papel px-5 py-3 lg:hidden">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setMenu(false)}
                className="block py-2.5 text-tinta-media transition-colors hover:text-tinta"
              >
                {n.label}
              </a>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
