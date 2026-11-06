import { ENVIO_GRATIS_EXCEPCION, ENVIO_GRATIS_TEXTO, PICKUPS, ZONAS_ENVIO } from "@/lib/zonas";
import { FORMAS_PAGO, enumerar } from "@/lib/pedido";

/**
 * Las preguntas que llegan por WhatsApp, contestadas en la pagina.
 *
 * **De aca salen las DOS cosas: la seccion visible y el marcado `FAQPage`.**
 * No es una comodidad, es un requisito: marcar respuestas que el visitante no
 * puede leer es motivo de penalizacion manual. Como los dos usos leen este
 * archivo, no pueden divergir.
 *
 * Ninguna respuesta inventa un dato. Los precios de envio y el punto de retiro
 * se arman con los mismos datos que dibuja el mapa, asi que cambiar una zona
 * cambia la respuesta sola y nunca quedan contradiciendose.
 *
 * El formato apunta a que sea citable: cada respuesta se entiende sola, sin
 * leer la anterior ni el resto de la pagina. Es lo que necesita un asistente
 * para poder repetirla, y tambien lo que necesita alguien que cayo directo
 * desde una busqueda.
 *
 * **Aca no va el numero de telefono.** Escrito como texto suelto invita a la
 * consulta previa al pedido igual que un enlace, que es lo que el cliente
 * pidio sacar; y como este archivo tambien alimenta el `FAQPage`, el numero
 * quedaba ademas indexable. Lo que se cuenta es que la entrega y el retiro se
 * coordinan AL CONFIRMAR el pedido, en el chat que abre el carrito.
 */
export type Pregunta = { pregunta: string; respuesta: string };

/** Los precios, uno por zona. La frase que los usa NO dice cuantas zonas hay:
 *  decia "tres" a mano sobre una lista derivada, que es el mismo defecto que
 *  ya habia mentido en la seccion de envios cuando los retiros bajaron de tres
 *  a uno. Aca ademas es peor, porque esta respuesta alimenta el `FAQPage` del
 *  JSON-LD: un numero desactualizado no queda en la pagina, queda indexado.
 *  La enumeracion se cuenta sola, asi que el numero sobra. */
const precios = ZONAS_ENVIO.map((z) => `${z.titulo} ${z.precio}`).join(", ");
/** Hoy es uno solo, pero se arma igual desde la lista para que el nombre del
 *  punto no quede escrito dos veces. La redaccion de la respuesta si asume que
 *  hay uno: si vuelven a ser varios hay que reescribirla, no alcanza con
 *  agregar la zona. */
const retiros = PICKUPS.map((p) => p.titulo).join(", ");
/** Las mismas que ofrece el checkout: si se agrega una, la respuesta la
 *  nombra sola. */
const pagos = enumerar(
  FORMAS_PAGO.map((f) => f.etiqueta.toLowerCase()),
  "o",
);

export const FAQ: Pregunta[] = [
  {
    pregunta: "¿Hacen envíos en Montevideo?",
    respuesta: `Sí. Un Amargo entrega en todo Montevideo por cadetería, con precio por zona: ${precios}. En compras desde ${ENVIO_GRATIS_TEXTO} el envío en Montevideo es gratis${ENVIO_GRATIS_EXCEPCION ? ` ${ENVIO_GRATIS_EXCEPCION}` : ""}. El pedido se arma en la tienda de esta misma página: en el carrito se elige el barrio y el envío se suma solo al total. El día y la hora se coordinan al confirmarlo, en el chat de WhatsApp que se abre desde el carrito.`,
  },
  {
    pregunta: "¿Se puede retirar sin costo?",
    respuesta: `Sí, el retiro no tiene costo. Es en ${retiros}, y el punto exacto y el horario se arreglan al confirmar el pedido, en el mismo chat en el que se manda. Podés ver el producto en persona antes de pagar.`,
  },
  {
    pregunta: "¿Cómo hago un pedido?",
    respuesta:
      `Se arma el pedido desde la tienda de la web. En el carrito se elige retiro o envío a domicilio y la forma de pago (${pagos}), y el pedido sale por WhatsApp con un toque, con todos esos datos. No hay pasarela de pago online: el pago se coordina directamente por ese chat.`,
  },
  {
    pregunta: "¿Hacen mates personalizados?",
    respuesta:
      "Sí. Un Amargo hace grabado láser sobre mates y trabajos artesanales en virola. Sirve para regalar o para personalizar un mate que ya tenés.",
  },
  {
    pregunta: "¿Trabajan con empresas?",
    respuesta:
      "Sí, se hacen pedidos por cantidad para empresas, con grabado del logo en cada mate. La propuesta se cotiza por mail según la cantidad y el tipo de mate.",
  },
  {
    pregunta: "¿Qué venden además de mates?",
    respuesta:
      "El catálogo tiene mates, bombillas, combos de mate con posamate y accesorios como materas, yerberos, bases y secadores. Todo se ve con precio en la tienda de esta misma página.",
  },
  // Las dos que siguen resumen las guias interactivas del cliente, con sus
  // tiempos y sus temperaturas: no se inventa ninguno. Son texto suelto y sin
  // enlace porque tambien van al `FAQPage`; las guias estan a la vista en la
  // seccion de arriba. Si el cliente cambia un paso, hay que repasarlas: el
  // importador lo recuerda.
  {
    pregunta: "¿Cómo curo un mate nuevo?",
    respuesta:
      "Depende del mate. El de calabaza se llena con yerba usada de otro mate y se mantiene húmeda; a las 24 horas se saca la yerba, se raspa el interior para quitar las impurezas y se seca bien con servilletas. El de algarrobo primero se unta por dentro con manteca o grasa, que se deja actuar 6 horas; después se llena con yerba usada apenas húmeda, sin llegar al borde, se deja reposar de 12 a 24 horas y se limpia con un paño húmedo. Los dos curados están paso a paso en la guía de esta web.",
  },
  {
    pregunta: "¿Cómo se ceba un mate amargo?",
    respuesta:
      "Se llena el mate con yerba hasta tres cuartas partes, se tapa la boca con la mano, se agita y se deja de costado para que se forme la montañita. El hueco que queda se moja con un poco de agua fría y se deja reposar unos minutos. Después se clava la bombilla, tapada con el dedo, en la parte húmeda y hasta el fondo, y no se mueve más. Se ceba con agua a 70 u 80 °C, nunca hervida, despacio y siempre en el mismo lugar, junto a la bombilla.",
  },
];
