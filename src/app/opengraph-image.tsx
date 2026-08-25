import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

/**
 * La imagen que se ve cuando alguien manda el link por WhatsApp.
 *
 * Este negocio vende asi: el link viaja por WhatsApp y por mensaje directo, y
 * ahi la previsualizacion ES la primera impresion. Sin imagen, el enlace sale
 * como una linea de texto gris.
 *
 * Se genera desde el codigo y no es un archivo: asi no puede quedar
 * desactualizada respecto del nombre o la descripcion, y no hay que abrir un
 * editor de imagenes para cambiar una palabra.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE.nombre}, mates y accesorios en Montevideo`;

export default function Imagen() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          color: "#ffffff",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, letterSpacing: "0.22em" }}>
          UN AMARGO
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 92,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: "-0.035em",
          }}
        >
          <span>Mates y accesorios</span>
          <span style={{ color: "#8a8a8a" }}>en Montevideo</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#a8a8a8" }}>
          Envíos en todo Montevideo · Retiro sin costo · Grabado láser
        </div>
      </div>
    ),
    size,
  );
}
