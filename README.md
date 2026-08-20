# web-unamargo

Web publica de **Un Amargo**, tienda de mates y accesorios en Montevideo.
Producto de [Surlabs](https://www.surlabs.tech).

El catalogo NO vive en este repo: sale del ERP por su API publica, asi que el
cliente carga productos, precios y fotos desde el ERP y la web se actualiza
sola.

## Comandos

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de produccion (tambien es el unico typecheck real)
npm run lint
npm start        # sirve el build
```

## De donde sale el catalogo

`GET https://erp-unamargo.vercel.app/api/public/v1/stock` (ver `src/lib/catalog.ts`).
Se puede apuntar a otra instancia con `NEXT_PUBLIC_ERP_API`, sin tocar codigo.

Tres cosas que conviene saber antes de cambiar algo ahi:

- **El contrato es aditivo.** El ERP puede agregar campos, nunca renombrarlos ni
  sacarlos. No hace falta defenderse de que desaparezca `price`.
- **La pagina se revalida cada 5 minutos** y el propio endpoint cachea 60s en su
  CDN con `stale-while-revalidate` de 300. O sea que un cambio de catalogo tarda
  hasta unos 6 minutos en verse. Bajar el `revalidate` de la pagina no lo acelera:
  el techo lo pone el CDN del ERP.
- **Si el ERP no contesta, la pagina igual se dibuja.** `getCatalogo` devuelve un
  catalogo vacio con `caido: true` y la tienda muestra un aviso con el WhatsApp.
  Una caida del ERP no puede tumbar la web del cliente.

## Stock: por que hoy no se muestra

El import inicial creo los 34 productos con stock 0 a proposito, para no meter
movimientos en el libro mayor del ERP y que los SKU sigan siendo editables hasta
el primer conteo real.

Si la web respetara ese stock, los 34 productos dirian "Sin stock" y le estaria
diciendo al cliente que no compre. Por eso `catalog.ts` calcula `siguiendoStock`:
**si ningun producto tiene stock, el ERP todavia no lo esta llevando y la web no
muestra disponibilidad**. Apenas alguien carga el primer stock real desde el ERP,
esto se da vuelta solo y los agotados empiezan a marcarse. No hay que tocar nada.

El pedido se confirma por WhatsApp igual, asi que nadie termina comprando lo que
no hay.

## Como se cierra una venta

No hay pasarela de pago: el carrito arma un mensaje y abre WhatsApp, que es por
donde el negocio atiende. Los totales se suman en centavos con `BigInt`
(`src/lib/centavos.ts`), nunca con floats, porque un total con un centavo de mas
se lee como un error del negocio.

Si el navegador bloquea la ventana emergente, se ofrece el link a mano: un envio
que se traga el bloqueador es un pedido perdido.

## Diseño

- **La paleta es la del cliente.** Su verde claro (`#128A64`) da 3.95:1 contra
  texto claro y no pasa WCAG AA, asi que el acento operativo es su verde oscuro
  (`#0E6E50`), que da 5.69:1. El claro queda solo como hover, donde aclarar sube
  el contraste en vez de bajarlo.
- **Un solo cambio de tema en toda la pagina**: el hero y el pie en verde
  profundo sostienen los extremos, y todo lo del medio respira en claro para que
  comprar sea comodo. No agregar una tercera franja oscura.
- **Un solo radio** (`--radius-brand`, 4px) para botones, tarjetas, inputs e
  imagenes. Los circulos estan exentos porque son circulos.
- **Archivo con su eje de ancho.** El caracter de los titulos sale de condensar,
  no de engordar.
- Las fotos del catalogo vienen recortadas sobre blanco, por eso las tarjetas de
  producto son blancas: si no, se ve una caja dentro de otra.
- Copia en español rioplatense. Sin emojis y sin rayas largas.

## Nada de datos inventados

El telefono, el mail y las zonas de entrega salen de la demo que armo el
cliente. Si hace falta un dato nuevo del negocio, se pregunta; no se inventa.
