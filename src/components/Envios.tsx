"use client";

import { useState } from "react";
import { WhatsappLogo, MapPin, Truck } from "@phosphor-icons/react/dist/ssr";
import { linkWhatsApp } from "@/lib/site";
import { MapaMontevideo } from "./MapaMontevideo";
import {
  PICKUPS,
  ZONAS_ENVIO,
  SIN_POLIGONO,
  barriosDeZona,
  type Zona,
} from "@/lib/zonas";

const TODAS: Zona[] = [...PICKUPS, ...ZONAS_ENVIO];

export function Envios() {
  const [activa, setActiva] = useState<string>("zona1");
  const zona = TODAS.find((z) => z.id === activa) ?? ZONAS_ENVIO[0];
  const encendidos = barriosDeZona(zona);
  const faltantes = zona.barrios.filter((b) => SIN_POLIGONO.includes(b));

  return (
    <section
      id="envios"
      className="scroll-mt-24 bg-tinta px-5 py-20 text-papel sm:px-8 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="reveal max-w-[36ch]">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-papel/45">
            Logística
          </p>
          <h2 className="type-display text-[clamp(2.5rem,6vw,4.5rem)]">
            Cómo recibís tu pedido
          </h2>
          <p className="type-body mt-6 text-lg leading-relaxed text-papel/65">
            Retirás sin costo en tres puntos, o te lo llevamos a domicilio.
            Tocá una zona y mirá hasta dónde llega.
          </p>
        </div>

        <div className="reveal mt-8 inline-flex rounded-pill bg-verde px-5 py-2.5 text-sm font-semibold">
          Envío gratis en Montevideo a partir de $3.490
        </div>

        <div className="mt-10 grid items-start gap-8 lg:mt-14 lg:grid-cols-12 lg:gap-14">
          {/* --- Selector de zonas ------------------------------------- */}
          <div className="reveal lg:col-span-5">
            <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-papel/40">
              <MapPin size={13} weight="fill" />
              Retiro sin costo
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PICKUPS.map((z) => (
                <BotonZona
                  key={z.id}
                  zona={z}
                  activa={z.id === activa}
                  onSelect={() => setActiva(z.id)}
                />
              ))}
            </div>

            <p className="mt-8 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-papel/40">
              <Truck size={13} weight="fill" />
              Cadetería a domicilio
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ZONAS_ENVIO.map((z) => (
                <BotonZona
                  key={z.id}
                  zona={z}
                  activa={z.id === activa}
                  onSelect={() => setActiva(z.id)}
                />
              ))}
            </div>

            {/* --- Detalle de la zona elegida ------------------------- */}
            <div className="mt-8 border-t border-papel/15 pt-7">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-papel/40">
                    {zona.rotulo}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold sm:text-3xl">
                    {zona.titulo}
                  </h3>
                </div>
                <p className="shrink-0 text-right">
                  <span className="type-display text-4xl sm:text-5xl">
                    {zona.precio ?? "Gratis"}
                  </span>
                  {zona.precio && (
                    <span className="ml-1 text-xs text-papel/45">UYU</span>
                  )}
                </p>
              </div>

              <p className="type-body mt-4 max-w-[52ch] leading-relaxed text-papel/60">
                {zona.detalle}
              </p>

              {zona.barrios.length > 0 && (
                <>
                  <p className="mt-7 text-[11px] font-medium uppercase tracking-[0.16em] text-papel/40">
                    Barrios incluidos
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {zona.barrios.map((b) => (
                      <li
                        key={b}
                        className="rounded-pill border border-papel/25 px-3 py-1.5 text-[13px] text-papel/80"
                      >
                        {b}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* --- El mapa ---------------------------------------------- */}
          <div className="reveal lg:col-span-7 lg:sticky lg:top-28">
            <MapaMontevideo
              encendidos={encendidos}
              etiqueta={`Montevideo con ${zona.titulo} resaltado`}
            />
            <div className="mt-5 max-w-[60ch] space-y-2 text-xs leading-relaxed text-papel/40">
              {faltantes.length > 0 && (
                <p>
                  {faltantes.join(" y ")}{" "}
                  {faltantes.length === 1 ? "entra" : "entran"} en la zona, pero
                  no {faltantes.length === 1 ? "figura" : "figuran"} como barrio
                  oficial de Montevideo, así que el mapa no{" "}
                  {faltantes.length === 1 ? "lo" : "los"} pinta.
                </p>
              )}
              <p>
                Ciudad de la Costa queda fuera de Montevideo, en Canelones, y se
                coordina aparte. Al interior enviamos por Correo Uruguayo o
                encomienda: el costo varía según destino y peso.
              </p>
            </div>
          </div>
        </div>

        <div className="reveal mt-10">
          <a
            href={linkWhatsApp("Hola! Quiero consultar por el envío.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-pill bg-verde px-6 py-3 text-sm font-semibold transition-colors duration-300 hover:bg-verde-vivo"
          >
            <WhatsappLogo size={16} weight="fill" />
            ¿No ves tu barrio? Escribinos
          </a>
        </div>
      </div>
    </section>
  );
}

function BotonZona({
  zona,
  activa,
  onSelect,
}: {
  zona: Zona;
  activa: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onSelect}
      onFocus={onSelect}
      aria-pressed={activa}
      className={`rounded-pill border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
        activa
          ? "border-verde-vivo bg-verde-vivo text-papel"
          : "border-papel/25 text-papel/65 hover:border-papel/60 hover:text-papel"
      }`}
    >
      {zona.rotulo}
      {zona.precio && (
        <span className={activa ? "ml-1.5 text-papel/75" : "ml-1.5 text-papel/40"}>
          {zona.precio}
        </span>
      )}
    </button>
  );
}
