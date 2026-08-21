"use client";

import { useEffect, useRef, useState } from "react";
import { WhatsappLogo, MapPin, Truck, ArrowDown } from "@phosphor-icons/react/dist/ssr";
import { linkWhatsApp } from "@/lib/site";
import { MapaMontevideo } from "./MapaMontevideo";
import { PICKUPS, ZONAS_ENVIO, SIN_POLIGONO, barriosDeZona, type Zona } from "@/lib/zonas";

const TODAS: Zona[] = [...PICKUPS, ...ZONAS_ENVIO];

/** El scroll recorre las zonas. Se entra a la seccion, queda fija, y al bajar
 *  va cambiando de zona hasta que se acaban; ahi la pagina sigue de largo.
 *
 *  El progreso NO se mide escuchando "scroll": eso corre en cada cuadro y traba
 *  el celular. Se ponen centinelas invisibles, uno por zona, y un
 *  IntersectionObserver avisa cual esta cruzando el medio de la pantalla. El
 *  estado cambia como mucho seis veces en toda la seccion. */
export function Envios() {
  const [i, setI] = useState(0);
  const pista = useRef<HTMLDivElement>(null);
  const centinelas = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // sin scroll guiado: quedan los botones

    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          const n = Number((e.target as HTMLElement).dataset.zona);
          setI((prev) => (prev === n ? prev : n));
        }
      },
      // Una franja fina en el medio de la pantalla: la zona activa es la que
      // esta pasando por ahi.
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    centinelas.current.forEach((c) => c && obs.observe(c));
    return () => obs.disconnect();
  }, []);

  function irA(n: number) {
    centinelas.current[n]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const zona = TODAS[i];
  const encendidos = barriosDeZona(zona);
  const faltantes = zona.barrios.filter((b) => SIN_POLIGONO.includes(b));
  const esPickup = PICKUPS.some((p) => p.id === zona.id);

  return (
    <section id="envios" className="scroll-mt-0 bg-tinta text-papel">
      {/* Encabezado, antes de que empiece la pista */}
      <div className="mx-auto max-w-[1400px] px-5 pt-24 sm:px-8 lg:px-12 lg:pt-28">
        <div className="reveal max-w-[36ch]">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-papel/45">
            Logística
          </p>
          <h2 className="type-display text-[clamp(2.5rem,6vw,4.5rem)]">
            Cómo recibís tu pedido
          </h2>
          <p className="type-body mt-6 text-lg leading-relaxed text-papel/65">
            Seis formas de recibirlo. Segui bajando y las vas viendo una por una
            en el mapa.
          </p>
        </div>
        <div className="reveal mt-8 inline-flex rounded-pill bg-verde px-5 py-2.5 text-sm font-semibold">
          Envío gratis en Montevideo a partir de $3.490
        </div>
      </div>

      {/* La pista: alta, con la vista fija adentro y un centinela por zona. */}
      <div ref={pista} className="relative mt-10" style={{ height: `${TODAS.length * 58}vh` }}>
        {TODAS.map((_, n) => (
          <div
            key={n}
            data-zona={n}
            ref={(el) => {
              centinelas.current[n] = el;
            }}
            className="absolute w-px"
            style={{ top: `${n * 58}vh`, height: "58vh" }}
            aria-hidden
          />
        ))}

        <div className="sticky top-0 flex min-h-[100dvh] items-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="mx-auto grid w-full max-w-[1400px] items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              {/* Los pasos, como una barra de progreso que se puede tocar. */}
              <div className="mb-8 flex flex-wrap items-center gap-1.5">
                {TODAS.map((z, n) => (
                  <button
                    key={z.id}
                    onClick={() => irA(n)}
                    aria-label={`Ir a ${z.titulo}`}
                    aria-current={n === i}
                    className={`h-1 rounded-pill transition-all duration-500 ${
                      n === i ? "w-10 bg-verde-vivo" : "w-5 bg-papel/25 hover:bg-papel/50"
                    }`}
                  />
                ))}
                <span className="ml-3 text-[11px] uppercase tracking-[0.16em] text-papel/40">
                  {i + 1} / {TODAS.length}
                </span>
              </div>

              <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-papel/45">
                {esPickup ? <MapPin size={13} weight="fill" /> : <Truck size={13} weight="fill" />}
                {esPickup ? "Retiro sin costo" : "Cadetería a domicilio"}
                <span className="text-papel/30">·</span>
                {zona.rotulo}
              </p>

              <div className="mt-3 flex items-start justify-between gap-6">
                <h3 className="type-display text-[clamp(1.9rem,4.5vw,3.25rem)]">
                  {zona.titulo}
                </h3>
                <p className="shrink-0 pt-1 text-right">
                  <span className="type-display text-3xl sm:text-4xl">
                    {zona.precio ?? "Gratis"}
                  </span>
                  {zona.precio && <span className="ml-1 text-xs text-papel/45">UYU</span>}
                </p>
              </div>

              <p className="type-body mt-4 max-w-[50ch] leading-relaxed text-papel/60">
                {zona.detalle}
              </p>

              {zona.barrios.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-1.5">
                  {zona.barrios.map((b) => (
                    <li
                      key={b}
                      className="rounded-pill border border-papel/25 px-3 py-1.5 text-[13px] text-papel/80"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              {faltantes.length > 0 && (
                <p className="mt-4 max-w-[52ch] text-xs leading-relaxed text-papel/40">
                  {faltantes.join(" y ")}{" "}
                  {faltantes.length === 1 ? "entra" : "entran"} en la zona, pero no{" "}
                  {faltantes.length === 1 ? "figura" : "figuran"} como barrio oficial
                  de Montevideo, así que el mapa no{" "}
                  {faltantes.length === 1 ? "lo" : "los"} pinta.
                </p>
              )}

              {i === TODAS.length - 1 && (
                <a
                  href={linkWhatsApp("Hola! Quiero consultar por el envío.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex items-center gap-2 rounded-pill bg-verde px-6 py-3 text-sm font-semibold transition-colors duration-300 hover:bg-verde-vivo"
                >
                  <WhatsappLogo size={16} weight="fill" />
                  ¿No ves tu barrio? Escribinos
                </a>
              )}
            </div>

            <div className="lg:col-span-7">
              <MapaMontevideo
                encendidos={encendidos}
                etiqueta={`Montevideo con ${zona.titulo} resaltado`}
              />
              {i === 0 && (
                <p className="mt-4 flex items-center justify-center gap-2 text-xs text-papel/35">
                  <ArrowDown size={13} />
                  Seguí bajando
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-5 pb-24 sm:px-8 lg:px-12">
        <p className="max-w-[62ch] text-xs leading-relaxed text-papel/40">
          Ciudad de la Costa queda fuera de Montevideo, en Canelones, y se
          coordina aparte. Al interior enviamos por Correo Uruguayo o encomienda:
          el costo varía según destino y peso.
        </p>
      </div>
    </section>
  );
}
