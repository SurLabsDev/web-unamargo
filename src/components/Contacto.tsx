"use client";

import { useState } from "react";
import { WhatsappLogo, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { SITE, linkWhatsApp } from "@/lib/site";

const MOTIVOS = [
  "Hacer un pedido",
  "Consulta sobre un producto",
  "Info de envío",
  "Pedido personalizado",
] as const;

/** El formulario no postea a ningun lado: arma el mensaje y abre WhatsApp,
 *  que es por donde el negocio atiende de verdad. Sin backend que mantener y
 *  sin mensajes que se pierdan en una casilla que nadie mira. */
export function Contacto() {
  const [nombre, setNombre] = useState("");
  const [motivo, setMotivo] = useState<string>(MOTIVOS[0]);
  const [detalle, setDetalle] = useState("");
  const [bloqueado, setBloqueado] = useState(false);

  const mensaje = [
    `Hola! Soy ${nombre || "..."}.`,
    `Motivo: ${motivo}.`,
    detalle ? `\n${detalle}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const href = linkWhatsApp(mensaje);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const w = window.open(href, "_blank", "noopener,noreferrer");
    if (!w || w.closed) setBloqueado(true);
  }

  return (
    <section id="contacto" className="scroll-mt-20 bg-papel py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="reveal lg:col-span-5">
          <h2 className="type-display text-[clamp(2rem,5vw,3.5rem)] font-semibold">
            Hablemos
          </h2>
          <p className="type-body mt-5 max-w-[46ch] leading-relaxed text-tinta-media">
            Escribinos para comprar, para preguntar por un material o para
            encargar algo a medida. Contestamos por WhatsApp.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <a
              href={linkWhatsApp("Hola! Tengo una consulta.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-brand bg-verde px-5 py-3.5 font-semibold text-hueso transition-colors hover:bg-verde-vivo"
            >
              <WhatsappLogo size={20} weight="fill" />
              {SITE.whatsappLegible}
            </a>
            <a
              href={`mailto:${SITE.email}`}
              className="inline-flex items-center gap-3 rounded-brand border border-tinta/20 px-5 py-3.5 font-medium transition-colors hover:border-tinta/50"
            >
              <EnvelopeSimple size={20} />
              {SITE.email}
            </a>
          </div>

          <p className="type-body mt-8 max-w-[46ch] text-sm leading-relaxed text-tinta-media">
            Si haces contenido sobre mate y te interesa trabajar con nosotros,
            mandanos por mail lo qué venís haciendo.
          </p>
        </div>

        <form
          onSubmit={enviar}
          className="reveal flex flex-col gap-5 rounded-brand bg-papel-hondo p-7 lg:col-span-6 lg:col-start-7"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="nombre" className="text-sm font-medium">
              Nombre
            </label>
            <input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="rounded-brand border border-tinta/20 bg-papel px-4 py-3 text-tinta outline-none transition-colors placeholder:text-tinta-media focus:border-verde focus:ring-2 focus:ring-verde/25"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="motivo" className="text-sm font-medium">
              Motivo
            </label>
            <select
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="rounded-brand border border-tinta/20 bg-papel px-4 py-3 text-tinta outline-none transition-colors focus:border-verde focus:ring-2 focus:ring-verde/25"
            >
              {MOTIVOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="detalle" className="text-sm font-medium">
              Contanos
            </label>
            <textarea
              id="detalle"
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              rows={4}
              className="resize-none rounded-brand border border-tinta/20 bg-papel px-4 py-3 text-tinta outline-none transition-colors placeholder:text-tinta-media focus:border-verde focus:ring-2 focus:ring-verde/25"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-brand bg-verde px-6 py-3.5 font-semibold text-hueso transition-all hover:bg-verde-vivo active:scale-[0.99]"
          >
            <WhatsappLogo size={19} weight="fill" />
            Seguir por WhatsApp
          </button>

          {bloqueado && (
            <p className="text-sm text-tinta-media">
              El navegador bloqueo la ventana.{" "}
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-verde underline underline-offset-2"
              >
                Abrí WhatsApp a mano
              </a>
              .
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
