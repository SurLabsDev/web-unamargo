import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SE_INDEXA, SITE } from "@/lib/site";
import "./globals.css";

/* Una sola familia, con el eje de ancho pedido: el caracter de los titulos
   sale de condensar, no de engordar. */
const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

/* Todo lo de aca lo heredan las paginas que no lo pisan, y lo heredan TAL
   CUAL: Next mezcla las metadatas campo por campo y una pagina que no define
   un campo se queda con el del layout. Por eso nada de lo que va aca puede
   valer solo para la home. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    /* La palabra clave adelante y la marca al final, con la misma forma que el
       template de las paginas hijas. Google muestra el nombre del sitio aparte,
       arriba del resultado (lo toma del `WebSite` del JSON-LD), asi que
       arrancar con "Un Amargo" lo repetia y corria "mates" hacia donde el
       titulo se corta. "Grabado laser" y no "accesorios" porque la descripcion
       ya empieza diciendo accesorios, y el grabado es lo que distingue a la
       tienda. */
    default: `Mates, bombillas y grabado láser en Montevideo | ${SITE.nombre}`,
    template: `%s | ${SITE.nombre}`,
  },
  description: SITE.descripcion,
  /* "./" y no "/". Con "/", las guias (/como-curar-un-mate y
     /como-cebar-un-mate) heredaban el canonical de la home: le decian a Google
     que eran una copia de la portada, que es la forma mas rapida de que no
     indexe una pagina nueva. "./" Next lo resuelve contra la ruta de cada
     pagina (`resolveRelativeUrl` en next/dist/lib/metadata/resolvers), asi que
     cada una se declara a si misma, y en la home sigue dando
     https://unamargo.com. */
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    url: "./",
    locale: "es_UY",
    siteName: SITE.nombre,
    /* Sin `title` ni `description` a proposito: escritos aca, las guias se
       compartian por WhatsApp con el titulo y la bajada de la portada. Vacios,
       Next los completa con el title y la description de cada pagina. La
       imagen sale de `opengraph-image.tsx`. */
  },
  robots: { index: SE_INDEXA, follow: SE_INDEXA },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-UY" className={geist.variable}>
      <body className="font-sans antialiased">
        {/* Sin JS el revelado al scroll nunca dispara, asi que el contenido
            quedaria invisible. Esto lo devuelve a la vista. */}
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}.entra{animation:none !important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
