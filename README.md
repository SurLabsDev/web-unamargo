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

**El sistema visual es el que armó el cliente en su demo y le gustó.** Está en
`claude code unamargo/` (fuera del repo, nunca se modifica). Rehacerlo con otro
lenguaje fue el primer intento y estuvo mal: acá se parte del suyo.

- **Negro sobre blanco.** Titulares enormes, peso 700, interlineado 0.86 y
  tracking negativo. De ahí sale el carácter de la página.
- **Todo es pill** (`--radius-pill`, 100px): botones, filtros, campos del
  formulario. Es su firma. Las fotos usan `--radius-foto` (6px).
- **El verde es solo funcional.** Aparece únicamente en WhatsApp, en el widget
  de Spotify y en el aviso de envío gratis. Su verde claro (`#128A64`) da 3.95:1
  con texto blanco y no pasa WCAG AA, así que el que lleva texto es el oscuro
  (`#0E6E50`), 5.69:1. El claro queda para el hover, donde aclarar sube el
  contraste.
- **Los textos son los de ellos, palabra por palabra.** El hero, "¿Qué hacemos?",
  "Personalizados", "Trabajo para empresas", las tres zonas de pickup y
  "Trabajá con nosotros" salen de su demo. No se reescriben.
- **Sus assets**: el logo, las 11 fotos del marquee y las fotos de sección están
  en `public/`, copiadas de la demo.
- **El widget de Spotify no es un adorno.** La playlist la armaron ellos y es de
  las cosas más propias que tiene la marca.
- Copia en español rioplatense. Sin emojis y sin rayas largas.

### Animaciones

- **Marquee de fotos**: la tira lleva las 11 imágenes dos veces y se desplaza
  exactamente la mitad, así el ciclo cierra sin salto. Se frena al pasar el mouse.
- **Entrada del hero**: no espera al observador, entra sola al cargar, escalonada
  con `--d`.
- **Revelado al scroll**: un solo IntersectionObserver que desuscribe cada
  elemento al entrar. Nunca escuchar `scroll`: corre en cada cuadro y traba el
  celular.
- Todo se apaga bajo `prefers-reduced-motion`.


## Dominios

| host | va a | |
|---|---|---|
| `unamargo.com` | esta web | **el canónico** |
| `www.unamargo.com` | -> `unamargo.com` | redirect 308 |
| `erp.unamargo.com` | el ERP | proyecto `erp-unamargo` |

El dominio está registrado en Cloudflare y con los nameservers ahí, así que el
DNS se maneja por su API. Los tres registros son `CNAME -> cname.vercel-dns.com`
**con la nube gris (DNS only)**: proxear Vercel por detrás de Cloudflare encadena
dos CDN y rompe la emisión y la renovación del certificado.

El redirect de `www` es **308 y no 307** a propósito. El temporal deja los dos
hosts vivos para el buscador y parte las señales entre ellos; el permanente las
consolida en el apex.

Los `.vercel.app` siguen respondiendo, Vercel no los da de baja.

## Cómo se entera la web de un cambio

La página se regenera sola cada 5 minutos, y además **el ERP le avisa cuando
cambia el catálogo** (`POST /api/revalidar`, con un secreto compartido en
`REVALIDATE_SECRET`).

El aviso existe porque el revalidado por tiempo solo no alcanza: cuando la
página vence, la **primera** visita todavía sirve la versión vieja mientras
regenera por detrás. O sea que el cliente edita un precio, refresca, ve el
viejo y concluye que el ERP no guardó. Pasó, y por eso está esto.

El revalidado por tiempo se queda igual, como red: si un aviso se pierde
-un deploy en curso, la red caída-, la página se pone al día sola más tarde.

**El sello de `?v=` en el pedido al ERP no es opcional.** El endpoint del ERP
cachea 60s en su CDN; sin el sello, la regeneración disparada por el aviso
podría recibir una respuesta de hasta 59 segundos antes y guardarla otros 5
minutos, dejando el aviso sin efecto.

## El mapa de zonas

La sección de logística lleva un mapa de Montevideo por barrios, y no es un
dibujo: los límites son los oficiales de la Intendencia.

- **Datos**: `github.com/vierja/geojson_montevideo`, generado del catálogo de
  datos abiertos de la Intendencia, bajo Licencia de Datos Abiertos de Uruguay.
  63 barrios, proyectados a un viewBox en `src/lib/barrios-montevideo.ts`.
- **Precios y barrios por zona salen de la demo del cliente**, no se inventa
  ninguno (`src/lib/zonas.ts`).
- **Los nombres de uso corriente no siempre son el nombre oficial.** Por eso hay
  un diccionario: "Parque Batlle" es `PQUE BATLLE VILLA DOLORES`, "Prado" es
  `PRADO NUEVA SAVONA`, "Colón" son dos polígonos.
- **Tres barrios que nombra el cliente no tienen polígono** y se declaran en
  `SIN_POLIGONO` en vez de forzarlos contra un barrio que no es: "Paso Molino" y
  "Verdisol" no son barrios oficiales, y **"Las Piedras" queda en Canelones, no
  en Montevideo**. Se siguen listando en las etiquetas, apagados, porque el
  cliente los ofrece igual; simplemente no pintan nada en el mapa.
- Pesa 98 KB de trazos, que comprimidos viajan en unos 64 KB junto con toda la
  página. Si algún día molesta, se simplifica subiendo el umbral del generador.

## Nada de datos inventados

El telefono, el mail y las zonas de entrega salen de la demo que armo el
cliente. Si hace falta un dato nuevo del negocio, se pregunta; no se inventa.
