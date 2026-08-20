/** Datos del negocio. Todos salen de la demo que armo el cliente, ninguno
 *  esta inventado: el numero, el mail y las zonas son los suyos. */
export const SITE = {
  nombre: "Un Amargo",
  descripcion:
    "Mates, bombillas y accesorios seleccionados en Montevideo. Grabado láser y trabajos en virola. Coordinamos entrega por WhatsApp.",
  url: "https://unamargo.uy",
  whatsapp: "59897022638",
  whatsappLegible: "098 702 638",
  email: "unamargo.info@gmail.com",
  ciudad: "Montevideo",
  pais: "Uruguay",
} as const;

/** El ERP es la unica fuente del catalogo. Se puede pisar por entorno para
 *  apuntar a una instancia distinta sin tocar codigo. */
export const ERP_API =
  process.env.NEXT_PUBLIC_ERP_API ??
  "https://erp-unamargo.vercel.app/api/public/v1/stock";

export function linkWhatsApp(mensaje: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}
