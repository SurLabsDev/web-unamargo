import { MapPin, Package } from "@phosphor-icons/react/dist/ssr";

const RETIROS = [
  {
    zona: "Pocitos / Punta Carretas",
    detalle:
      "Coordinamos un punto de encuentro en la zona. Ves el producto en persona antes de pagar.",
  },
  {
    zona: "Cordón Sur / Centro",
    detalle:
      "Zona céntrica, fácil acceso. Ideal si estás en el microcentro, Palermo o Parque Rodó.",
  },
  {
    zona: "Ciudad de la Costa",
    detalle:
      "Solymar, Lagomar, El Pinar y zonas aledañas. Coordinamos según agenda semanal.",
  },
];

/** Agrupado por lo que de verdad separa las opciones: sin costo contra con
 *  costo. Cuatro tarjetas iguales esconderian justo ese dato. */
export function Envios() {
  return (
    <section id="envios" className="scroll-mt-20 bg-papel py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <h2 className="type-display text-[clamp(2rem,5vw,3.5rem)] font-semibold">
          Cómo recibís tu pedido
        </h2>
        <p className="type-body mt-4 max-w-[58ch] text-tinta-media">
          Todo se coordina por WhatsApp cuando cerras el pedido.
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="reveal lg:col-span-7">
            <div className="flex items-center gap-2 text-verde">
              <MapPin size={18} weight="fill" />
              <span className="font-semibold">Retiro sin costo</span>
            </div>
            <ul className="mt-5 divide-y divide-tinta/10">
              {RETIROS.map((r) => (
                <li key={r.zona} className="py-5 first:pt-0">
                  <p className="font-medium">{r.zona}</p>
                  <p className="type-body mt-1 max-w-[52ch] text-sm leading-relaxed text-tinta-media">
                    {r.detalle}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal lg:col-span-4 lg:col-start-9">
            <div className="rounded-brand bg-papel-hondo p-7">
              <div className="flex items-center gap-2 text-tinta-media">
                <Package size={18} weight="fill" />
                <span className="font-semibold">Resto del país</span>
              </div>
              <p className="type-body mt-4 leading-relaxed text-tinta-media">
                Enviamos por Correo Uruguayo o encomienda. El costo varía según
                el destino y lo confirmamos antes de despachar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
