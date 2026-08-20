import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { linkWhatsApp } from "@/lib/site";

/** Las tres modalidades de retiro mas el interior, con la copia del cliente.
 *  El beneficio de envio gratis es un dato real del negocio y va arriba de
 *  todo, porque es lo que mas mueve la decision de comprar. */
const ZONAS = [
  {
    rotulo: "Pickup 01",
    zona: "Pocitos / Punta Carretas",
    detalle:
      "Coordinamos un punto de encuentro en la zona. Sin costo extra, ves el producto en persona antes de pagar.",
    nota: "Sin costo · Coordinamos horario",
  },
  {
    rotulo: "Pickup 02",
    zona: "Cordón Sur / Centro",
    detalle:
      "Zona céntrica, fácil acceso. Ideal si estás en el microcentro, Palermo o Parque Rodó.",
    nota: "Sin costo · Coordinamos horario",
  },
  {
    rotulo: "Pickup 03",
    zona: "Ciudad de la Costa",
    detalle:
      "Solymar, Lagomar, El Pinar y zonas aledañas. Coordinamos según agenda semanal.",
    nota: "Sin costo · Consultar disponibilidad",
  },
];

export function Envios() {
  return (
    <section
      id="envios"
      className="scroll-mt-24 bg-tinta px-5 py-24 text-papel sm:px-8 lg:px-12 lg:py-32"
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
            Trabajamos con tres modalidades para que llegarte sea simple. Todo
            se coordina por WhatsApp.
          </p>
        </div>

        <div className="reveal mt-10 inline-flex flex-wrap items-center gap-2 rounded-pill bg-verde px-5 py-2.5 text-sm font-semibold">
          Envío gratis en Montevideo a partir de $3.490
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-foto bg-papel/15 md:grid-cols-3">
          {ZONAS.map((z, i) => (
            <div
              key={z.zona}
              className="reveal flex flex-col bg-tinta p-7 lg:p-9"
              style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
            >
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-papel/40">
                {z.rotulo}
              </p>
              <h3 className="mt-3 text-xl font-semibold leading-snug">{z.zona}</h3>
              <p className="type-body mt-3 flex-1 text-sm leading-relaxed text-papel/60">
                {z.detalle}
              </p>
              <p className="mt-6 text-xs text-papel/45">{z.nota}</p>
            </div>
          ))}
        </div>

        <div className="reveal mt-10 flex flex-col items-start justify-between gap-6 border-t border-papel/15 pt-10 sm:flex-row sm:items-center">
          <div className="max-w-[46ch]">
            <h3 className="text-xl font-semibold">Resto del país</h3>
            <p className="type-body mt-2 leading-relaxed text-papel/60">
              Correo Uruguayo o encomienda. El costo varía según destino y peso
              del pedido.
            </p>
          </div>
          <a
            href={linkWhatsApp("Hola! Quiero consultar el costo de envío al interior.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-pill bg-verde px-6 py-3 text-sm font-semibold transition-colors duration-300 hover:bg-verde-vivo"
          >
            <WhatsappLogo size={16} weight="fill" />
            Consultar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
