import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

/* Una sola familia, con el eje de ancho pedido: el caracter de los titulos
   sale de condensar, no de engordar. */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.nombre} | Mates y accesorios en Montevideo`,
    template: `%s | ${SITE.nombre}`,
  },
  description: SITE.descripcion,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE.url,
    locale: "es_UY",
    siteName: SITE.nombre,
    title: `${SITE.nombre} | Mates y accesorios en Montevideo`,
    description: SITE.descripcion,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-UY" className={archivo.variable}>
      <body className="font-sans antialiased">
        {/* Sin JS el revelado al scroll nunca dispara, asi que el contenido
            quedaria invisible. Esto lo devuelve a la vista. */}
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
