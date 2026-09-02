# Plan: feedback del cliente sobre la web

Revisión del 26/08/2026. Cada punto se contrastó contra tres fuentes: el
código actual, la demo original del cliente (`claude code unamargo/index.html`)
y los datos que hoy devuelve el ERP en producción.

---

## 0. Lo que hay que destrabar primero (y no es código)

**En producción, los 34 productos tienen stock 0.**

```
GET https://erp-unamargo.vercel.app/api/public/v1/stock
-> 34 productos · con stock > 0: 0 · agotados: 34
```

La web tiene una salvaguarda a propósito: si NINGÚN producto tiene stock, no
muestra disponibilidad, porque marcar los 34 como agotados le dice al visitante
que no compre nada. Por eso hoy no se ve ni "agotado" ni "en stock" en ningún
lado.

**Nada de lo que el cliente pide sobre productos agotados se puede ver hasta
que hagan el primer conteo de stock en el ERP** (Stock → Conteo). No es un
cambio de código: es un dato que falta. Va primero en la lista de pedidos para
ellos.

---

## 1. Restaurar lo que se perdió de la demo original

El cliente dice "no están idénticas a la web anterior". Tiene razón en los
cuatro casos, y en tres de ellos la diferencia fue una decisión nuestra que
ahora se revierte.

### 1.1 Los videos de producto no existen

La demo original tenía **dos productos con video**, que se cargaban al entrar en
pantalla y se reproducían en loop dentro de la tarjeta y dentro de la ficha:

- `Base Reposamate` → `base-reposamate.mp4`
- `Secador para Mate y Bombilla` → `secamate.mp4`

La web nueva no tiene ninguno, y el ERP **no tiene dónde guardar un video**: el
contrato de `/api/public/v1/stock` solo trae `images: string[]`.

Dos caminos:

| | Rápido | Correcto |
|---|---|---|
| Dónde vive el video | `public/videos/` en la web, mapeado por SKU | Campo `video` en el producto del ERP |
| Cuánto es | 1 archivo, medio día | ERP (columna + subida + API) + web, 2 días |
| Cuando quieran sumar otro | pide un deploy | lo suben ellos |

**Recomiendo el correcto**, porque el cliente ya tiene dos videos y va a querer
más; pero si urge mostrarles algo, el rápido sirve de puente.

Archivos: `src/lib/catalog.ts` (tipo `Producto`), `src/components/Tienda.tsx`
(tarjeta), `src/components/FichaProducto.tsx` (galería). En el ERP:
`schema.ts`, `stock/[id]`, `api/public/v1/stock`.

### 1.2 Los íconos no son los del cliente

Hoy usamos los de Phosphor (`InstagramLogo`, `SpotifyLogo`, `WhatsappLogo`). El
cliente mandó los SVG originales y quiere esos, en particular el de Instagram.
Además **falta Pinterest**, que en la demo original estaba y en la web nueva no.

Cambio: un componente `Sociales` con los cuatro SVG tal cual vienen del archivo
del cliente. Afecta `Hero.tsx`, `Footer.tsx`, `Contacto.tsx`.

### 1.3 La tira de fotos va lenta y se frena con el mouse

Confirmado, y las dos cosas fueron decisiones nuestras:

| | Demo original | Web nueva | Queda |
|---|---|---|---|
| Vuelta completa | 20s | **46s** | 20s |
| Al pasar el cursor | sigue | **se pausa** | sigue |
| Fotos | 11 | **6** | a confirmar |

Las 46s y la pausa están escritas en `globals.css` (`.tira`) y comentadas en
`Tira.tsx`. Se revierten las dos.

Lo de las 6 fotos fue otra decisión nuestra: las 5 que sacamos son piezas
gráficas **con texto encima** ("MATE CAMIONERO", "ME / YOU"), y un texto que
pasa de largo en una tira que corre no se llega a leer. El cliente no lo
mencionó. Lo pregunto antes de tocarlo.

### 1.4 Los modales de imagen salen cuadrados

Confirmado. Hoy la foto vive en un contenedor `aspect-square` fijo, así que una
foto vertical u horizontal queda con aire arriba y abajo dentro de un cuadrado.

La demo original no forzaba proporción: la galería era una columna flexible y
la foto ocupaba el alto disponible con `object-fit: contain`.

Cambio: sacar el `aspect-square` de `FichaProducto.tsx` y usar un contenedor de
alto flexible con máximo, para que la foto mande la proporción. Se revisa en
las tres proporciones que hay en el catálogo (cuadradas, verticales de mate,
horizontales de combo).

---

## 2. La tienda: que se entienda sin entrar al producto

> **FUERA DE ALCANCE POR AHORA (26/08).** Decisión nuestra: la sección "La tienda"
> queda como está, gusta así. Todo este bloque -agotados visibles, badge "Nuevo",
> más vendidos y filtros- no se toca en esta tanda. Se deja escrito porque el
> cliente lo pidió y va a volver.
>
> Lo único de este bloque que sigue en pie es el **eje de clasificación en el
> ERP** (ver 2.5): se hace igual, para clasificar mejor por dentro, aunque la
> tienda todavía no lo use.


### 2.1 Agotados visibles en la grilla

Hoy el agotado se marca con una pastillita gris "Sin stock" donde va el botón
de agregar. Es demasiado sutil: la foto se ve igual que la de un producto
disponible.

Cambio: foto atenuada (opacidad + desaturación leve), cinta "Agotado" sobre la
imagen, y la tarjeta deja de invitar al clic de agregar. Que se lea de un
vistazo, recorriendo el estante.

Depende del punto 0: sin stock cargado no se ve nada.

### 2.2 Productos nuevos

La demo original tenía un badge `Nuevo` en **6 productos** y `Más vendido` en 1,
puestos a mano.

El ERP tiene `created_at` en cada producto, así que se puede calcular. Pero
recomiendo **un interruptor explícito** ("Mostrar como nuevo") en la ficha del
producto del ERP, en vez de una regla por fecha: si es por fecha, un producto
importado hace dos meses aparece como nuevo y uno que reingresó no, y no hay
forma de que el cliente lo arregle sin llamarnos.

Trabajo: columna en el ERP + campo en la API + badge en la web.

### 2.3 Orden por más vendidos

Ahora es posible: desde el cambio de la semana pasada, cada venta registra
**qué producto y a qué precio** (`stock_movements` con `unit_price`). Se puede
sumar por producto y devolver un `sold_count` de los últimos 90 días.

**Advertencia honesta:** hay muy poca historia todavía. Los primeros meses el
ranking va a ser ruido o va a estar vacío. Sugiero implementarlo pero mostrarlo
recién cuando haya un mínimo de ventas registradas, para no publicar un "más
vendidos" con tres productos al azar.

### 2.4 Los filtros

El cliente dice que desaparecieron en mobile. En realidad **desaparecieron del
todo**: la web nueva reemplazó los filtros por estantes horizontales, uno por
rubro.

La demo original tenía tres filas de filtros, con scroll horizontal en mobile:

- **Tipo**: Todo / Mates / Bombillas / Accesorios / Combos
- **Material**: Madera / Calabaza / Combinado
- **Precio**: Hasta $1.000 / $1.000-$2.000 / +$2.000

De esos, Tipo y Precio salen de datos que ya tenemos. **Material no existe en el
ERP**: los subtipos de hoy son formas (Camionero, Imperial, Porongo, Torpedo),
no materiales.

Propongo:

1. Volver a poner la barra de filtros arriba de la tienda, con scroll
   horizontal en mobile como en la demo.
2. Tipo y Precio con los datos actuales, más un filtro por **forma** (los
   subtipos que ya existen), que para quien compra un mate es más útil que el
   material.
3. Material queda para después, y solo si lo piden: es una columna nueva en el
   ERP y clasificar 34 productos a mano.

Los estantes por rubro pueden convivir con los filtros: sin filtro activo se
ven los estantes, con filtro activo se muestra una grilla del resultado.

### 2.5 El eje de clasificación, genérico

Se hace, aunque la tienda no lo use todavía.

La condición es que **no sea una columna `material`**: este ERP se va a reusar
con otros clientes y "material" solo le sirve a una materia. Lo que se agrega es
un **tercer eje de clasificación cuyo nombre elige cada instancia**:

| Instancia | Cómo se llama el eje | Valores |
|---|---|---|
| Un Amargo | Material | Madera · Calabaza · Combinado |
| Una tienda de ropa | Talle | S · M · L |
| Una de comida | Sabor | … |

O sea: una tabla de valores que el cliente administra desde Configuración, más
la **etiqueta del eje** guardada en los settings de la instancia. Un valor por
producto: el original resolvía lo mixto con "Combinado", así que no hace falta
muchos a muchos.

Sale en la API pública como campo nuevo (el contrato es aditivo) junto con su
etiqueta, porque sin la etiqueta el que consume no sabe cómo titular el filtro.

Los productos los clasifica el cliente: son sus datos.

---

## 3. WhatsApp solo con el pedido armado

Pedido claro: WhatsApp queda **únicamente para recibir pedidos**.

Hoy hay accesos directos en cinco lugares:

| Dónde | Qué es | Qué se hace |
|---|---|---|
| `Hero.tsx` | ícono en la portada | se saca |
| `Footer.tsx` | número con ícono | se saca |
| `Nosotros.tsx` | botón "consulta" | se saca |
| `Personalizados.tsx` | texto "coordinamos por WhatsApp" | se reescribe |
| `Contacto.tsx` | sección entera: formulario + botón directo | **decisión, ver abajo** |
| `Tienda.tsx` | mensaje de "no cargó el catálogo" | apunta a Instagram |
| `cart/CartDrawer.tsx` | enviar pedido | **queda, es el único** |

**Decidido (26/08):** la sección Contacto conserva su lugar y su diseño pero
deja de ser un formulario. Pasa a ser "dónde encontrar respuesta": las preguntas
frecuentes que ya están en la página, Instagram y el mail. Es exactamente lo que
dijo el cliente ("el resto de las dudas deberían estar respondidas en la web o
aclararse previamente por Instagram"), y es fácil de revertir si al verlo no les
cierra.

---

## 4. Logística: pickups, días y horarios

### 4.1 Tres pickups pasan a uno

Hoy `zonas.ts` declara tres retiros: Pocitos/Punta Carretas, Cordón Sur/Centro
y Ciudad de la Costa. El cliente quiere **solo Cordón**, con una aclaración del
tipo "coordinar entrega previa".

Cambio chico: `src/lib/zonas.ts`, más el mapa (`MapaMontevideo.tsx`) y los
textos de `Envios.tsx`, que hoy hablan de "los tres retiros".

### 4.2 Días de envío, días de pedido y horario de retiro

**Falta el dato.** El cliente lo pone como tema de Meet y tiene razón: sin días
definidos, la web no puede prometer nada y las preguntas se las van a hacer
igual por WhatsApp, que es justo lo que quieren evitar.

Cuando esté definido, va en tres lugares a la vez y no puede divergir:

1. La sección Envíos.
2. Las preguntas frecuentes (`src/lib/faq.ts`), que alimentan la sección
   visible **y** el schema que lee Google.
3. El mensaje que arma el carrito, para que el pedido salga ya sabiendo el día.

---

## 5. Mobile

El cliente lo revisó desde el celular y encontró la mitad de los problemas ahí.
Corresponde una pasada completa en un teléfono real, no en el emulador: Chrome
en macOS **recorta las ventanas headless a 500px de ancho mínimo**, así que un
`--window-size=390` miente.

Se revisa: barra de filtros, estantes, ficha de producto, cajón del carrito,
videos y la tira.

---

## Orden propuesto

**Tanda 1 — arreglos visuales, sin dependencias** (2-3 días)
Íconos · tira (velocidad y hover) · modal con proporción real · agotados
visibles en la grilla · pasada de mobile.

**Tanda 2 — necesita tocar el ERP** (3-4 días)
Videos de producto · badge "Nuevo" · filtros · más vendidos.

**Tanda 3 — necesita decisiones del cliente** (1-2 días una vez definido)
WhatsApp solo en el carrito · pickup único · días y horarios.

---

## Para el Meet: lo que necesitamos de ellos

1. **Cargar el stock en el ERP.** Sin eso no hay agotados. Es lo más
   importante de esta lista.
2. Días de envío, días en que se toman pedidos y horario de retiro.
3. La tira, ¿con las 6 fotos actuales o con las 11 originales, incluidas las
   que llevan texto encima?
4. Los videos, ¿son solo esos dos o van a subir más? De la respuesta depende si
   el video se guarda en el ERP o queda fijo en la web.
5. Los valores del eje de clasificación (para ellos, "Material"): ¿cuáles son, y
   quién clasifica los 34 productos?
6. Ver la sección Contacto sin formulario y confirmar que les cierra.
