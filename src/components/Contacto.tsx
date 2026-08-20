"use client";

import { useState } from "react";
import { WhatsappLogo, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { SITE, linkWhatsApp } from "@/lib/site";

/** Los campos y su orden son los del formulario del cliente. No postea a
 *  ningun lado: arma el mensaje y abre WhatsApp, que es por donde atienden. */
const MOTIVOS = [
  "Hacer un pedido",
  "Consulta sobre producto",
  "Info de envío",
  "Pedido personalizado",
] as const;

export function Contacto() {
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [motivo, setMotivo] = useState<string>(MOTIVOS[0]);
  const [detalle, setDetalle] = useState("");
  const [bloqueado, setBloqueado] = useState(false);

  const mensaje = [
    `Hola! Soy ${nombre || "..."}.`,
    `Motivo: ${motivo}.`,
    celular ? `Cel: ${celular}.` : "",
    email ? `Mail: ${email}.` : "",
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

  /* Los campos son los de la demo: rectangulares, compactos y rellenos, no
     pills. Un pill de 56px de alto con una etiqueta chiquita arriba se lee
     vacio; asi el formulario queda denso y prolijo. */
  const campo =
    "w-full rounded-[8px] border border-linea bg-campo px-3.5 py-2.5 text-[0.9375rem] text-tinta outline-none transition-colors duration-200 placeholder:text-tinta-suave focus:border-tinta focus:bg-papel";
  const rotulo = "text-[10px] font-medium uppercase tracking-[0.09em] text-tinta-suave";

  return (
    <section id="contacto" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="reveal lg:col-span-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-tinta-suave">
            Contacto
          </p>
          <h2 className="type-display text-[clamp(2.5rem,6vw,4.5rem)]">
            Trabajá con nosotros
          </h2>
          <p className="type-body mt-6 text-lg leading-relaxed text-tinta-media">
            ¿Sos creador de contenido y te apasiona el mate? Queremos conocerte.
            Buscamos personas creativas que quieran sumarse para compartir la
            cultura del mate, sus historias y tradiciones.
          </p>
          <p className="type-body mt-5 leading-relaxed text-tinta-media">
            Si te gusta contar momentos reales, mostrar la pasión por el mate y
            conectar con una comunidad que valora lo simple y verdadero, este es
            tu lugar. Trabajemos juntos para que cada mate llegue más lejos.
          </p>

          <p className="mt-8 text-sm text-tinta-suave">Mostranos lo que hacés:</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <a
              href={`mailto:${SITE.email}?subject=${encodeURIComponent("Quiero sumarme")}`}
              className="inline-flex items-center justify-center gap-2 rounded-pill bg-tinta px-6 py-3 text-sm font-semibold text-papel transition-transform duration-300 hover:scale-[1.03]"
            >
              <EnvelopeSimple size={16} />
              Sumate
            </a>
            <a
              href={linkWhatsApp("Hola! Tengo una consulta.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-pill bg-verde px-6 py-3 text-sm font-semibold text-papel transition-colors duration-300 hover:bg-verde-vivo"
            >
              <WhatsappLogo size={16} weight="fill" />
              Escribir por WhatsApp
            </a>
          </div>
        </div>

        <form
          onSubmit={enviar}
          className="reveal flex flex-col gap-3.5 rounded-[14px] border border-linea bg-papel p-6 sm:p-8 lg:col-span-6 lg:col-start-7"
          style={{ "--d": "120ms" } as React.CSSProperties}
        >
          <div className="mb-1 flex items-baseline justify-between gap-4 border-b border-linea pb-4">
            <p className="text-sm font-semibold">Formulario de contacto</p>
            <p className="text-xs text-tinta-suave">Te contestamos por WhatsApp</p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nombre" className={rotulo}>Nombre</label>
              <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required autoComplete="name" className={campo} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="celular" className={rotulo}>Celular</label>
              <input id="celular" type="tel" inputMode="tel" value={celular} onChange={(e) => setCelular(e.target.value)} autoComplete="tel" placeholder="099 123 456" className={campo} />
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className={rotulo}>Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="vos@correo.com" className={campo} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="motivo" className={rotulo}>Motivo</label>
              <select id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} className={campo}>
                {MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="detalle" className={rotulo}>Contanos</label>
            <textarea
              id="detalle"
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              rows={4}
              placeholder="Qué mate te gustó, para cuándo lo necesitás, si va de regalo..."
              className={`${campo} min-h-[104px] resize-y leading-relaxed`}
            />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex items-center justify-center gap-2.5 rounded-pill bg-tinta px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.07em] text-papel transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99]"
          >
            <WhatsappLogo size={16} weight="fill" />
            Seguir por WhatsApp
          </button>

          {bloqueado && (
            <p className="text-sm text-tinta-media">
              El navegador bloqueó la ventana.{" "}
              <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
                Abrí WhatsApp a mano
              </a>.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
