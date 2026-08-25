import { PICKUPS, ZONAS_ENVIO } from "@/lib/zonas";
import { SITE } from "@/lib/site";

/**
 * Las preguntas que llegan por WhatsApp, contestadas en la pagina.
 *
 * **De aca salen las DOS cosas: la seccion visible y el marcado `FAQPage`.**
 * No es una comodidad, es un requisito: marcar respuestas que el visitante no
 * puede leer es motivo de penalizacion manual. Como los dos usos leen este
 * archivo, no pueden divergir.
 *
 * Ninguna respuesta inventa un dato. Los precios de envio y los puntos de
 * retiro se arman con los mismos datos que dibuja el mapa, asi que cambiar una
 * zona cambia la respuesta sola y nunca quedan contradiciendose.
 *
 * El formato apunta a que sea citable: cada respuesta se entiende sola, sin
 * leer la anterior ni el resto de la pagina. Es lo que necesita un asistente
 * para poder repetirla, y tambien lo que necesita alguien que cayo directo
 * desde una busqueda.
 */
export type Pregunta = { pregunta: string; respuesta: string };

const precios = ZONAS_ENVIO.map((z) => `${z.titulo} ${z.precio}`).join(", ");
const retiros = PICKUPS.map((p) => p.titulo).join(", ");

export const FAQ: Pregunta[] = [
  {
    pregunta: "¿Hacen envíos en Montevideo?",
    respuesta: `Sí. Un Amargo entrega en todo Montevideo por cadetería, con tres zonas de precio: ${precios}. La entrega se coordina por WhatsApp al ${SITE.whatsappLegible} después de armar el pedido.`,
  },
  {
    pregunta: "¿Se puede retirar sin costo?",
    respuesta: `Sí, hay tres puntos de retiro sin costo: ${retiros}. Se coordina un punto de encuentro y podés ver el producto en persona antes de pagar.`,
  },
  {
    pregunta: "¿Cómo hago un pedido?",
    respuesta:
      "Se arma el pedido desde la tienda de la web y se envía por WhatsApp con un toque. No hay pasarela de pago online: el pago y la entrega se coordinan directamente por ese chat.",
  },
  {
    pregunta: "¿Hacen mates personalizados?",
    respuesta:
      "Sí. Un Amargo hace grabado láser sobre mates y trabajos artesanales en virola. Sirve para regalar o para personalizar un mate que ya tenés.",
  },
  {
    pregunta: "¿Trabajan con empresas?",
    respuesta:
      "Sí, se hacen pedidos por cantidad para empresas, con grabado del logo en cada mate. Se cotiza por WhatsApp según la cantidad y el tipo de mate.",
  },
  {
    pregunta: "¿Qué venden además de mates?",
    respuesta:
      "El catálogo tiene mates, bombillas, combos de mate con posamate y accesorios como materas, yerberos, bases y secadores. Todo se ve con precio en la tienda de esta misma página.",
  },
];
