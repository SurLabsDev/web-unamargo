import { ImageResponse } from "next/og";
import { GUIAS, type IdGuia } from "@/lib/guias";
import { SITE } from "@/lib/site";

/**
 * La imagen que aparece cuando alguien manda el enlace de una guia.
 *
 * Las guias son de lo que mas se comparte por WhatsApp ("mira como se cura"),
 * y ahi la vista previa es la primera impresion. Es la misma composicion que
 * la de la home (`app/opengraph-image.tsx`) para que se lea como la misma
 * marca, con el titulo de la guia en lugar del de la tienda.
 */
export const TAMANO_OG = { width: 1200, height: 630 };

export function imagenGuia(id: IdGuia) {
  const { og } = GUIAS[id];
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
          {SITE.nombre.toUpperCase()}
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
          <span>{og.linea}</span>
          <span style={{ color: "#8a8a8a" }}>{og.bajada}</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#a8a8a8" }}>{og.pie}</div>
      </div>
    ),
    TAMANO_OG,
  );
}
