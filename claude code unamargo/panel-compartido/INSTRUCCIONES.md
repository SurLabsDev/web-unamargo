# Un Amargo — Panel interno compartido

Panel de gestión (stock, ventas, gastos, dinero en cuenta) para usar entre
los 3, desde la compu o el celular. Los datos viven en una planilla de
Google Sheets de la cuenta de ustedes: gratis, sin servidores propios.

## Instalación (una sola vez, ~10 minutos)

1. **Crear la planilla.** Entrá a [sheets.new](https://sheets.new) con la
   cuenta de Google de la marca y poné de nombre `Un Amargo — Datos`.

2. **Abrir el editor de código.** En la planilla: menú **Extensiones →
   Apps Script**. Se abre una pestaña nueva con un proyecto vacío.

3. **Pegar el backend.** En el archivo `Código.gs` que aparece abierto,
   borrá lo que tenga y pegá TODO el contenido de [`Code.gs`](Code.gs).

4. **Pegar la interfaz.** Arriba a la izquierda, botón **+ → HTML**.
   Nombralo exactamente `Index` (Apps Script le agrega el `.html` solo).
   Borrá lo que tenga y pegá TODO el contenido de [`Index.html`](Index.html).

5. **Guardar** (ícono de disquete o Ctrl+S).

6. **Publicar.** Botón azul **Implementar → Nueva implementación**.
   - Tipo (engranaje): **Aplicación web**
   - Descripción: `Panel interno`
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario** (la URL es larguísima e
     imposible de adivinar; no la compartan fuera del equipo). Si los 3
     tienen cuenta de Google y quieren una capa más de seguridad, elijan
     **Cualquier usuario con cuenta de Google**.
   - **Implementar** → Google pide autorizar permisos la primera vez:
     *Autorizar acceso* → elegí tu cuenta → si aparece "Google no verificó
     esta app", tocá *Configuración avanzada → Ir a … (no seguro)* → *Permitir*.
     (Es normal: la "app" es este código, que solo toca esta planilla.)

7. **Copiar la URL** que termina en `/exec` y pasársela a los 3.

## Uso en el celular

Abran la URL en el navegador del teléfono y agréguenla a la pantalla de
inicio para que quede como una app:
- **iPhone (Safari):** botón compartir → *Agregar a pantalla de inicio*.
- **Android (Chrome):** menú ⋮ → *Agregar a pantalla principal*.

## Primeros pasos después de instalar

1. En **Stock**: cargar el stock real y el costo unitario de cada producto
   (se edita directo en la tabla).
2. En **Cuenta**: registrar un "Ingreso / aporte" con el saldo actual real
   de la cuenta.
3. Listo — a cargar ventas y gastos a medida que pasan.

## Cosas a saber

- **La planilla es la base de datos.** Pueden mirarla cuando quieran
  (queda en el Drive de la cuenta), pero eviten editar las filas a mano:
  todo se carga desde el panel. Sirve también para hacer análisis extra
  o exportar a Excel.
- **Si dos cargan a la vez**, no pasa nada: el sistema procesa de a uno.
- **El panel se actualiza solo** al volver a abrirlo y cada 2 minutos;
  el botón "↻ Actualizar" trae lo último al instante.
- **Respaldo:** en la planilla, Archivo → Historial de versiones permite
  volver atrás ante cualquier error. Google guarda todo.

## Si más adelante cambian el código

Después de editar `Code.gs` o `Index.html` en Apps Script:
**Implementar → Administrar implementaciones → (lápiz) → Versión: Nueva
versión → Implementar**. La URL no cambia.
