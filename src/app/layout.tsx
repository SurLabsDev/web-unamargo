import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { OPEN_GRAPH_BASE } from "@/lib/metadatos";
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
  /* SIN canonical NI og:url: cada pagina declara la suya. La home los pone en
     "/" en su propio `metadata` (`page.tsx`); las guias, en el <head> que arma
     `src/guias/servir.ts`, porque son `route.ts` y no pasan por este layout;
     la 404 no tiene, porque no es una direccion.

     Aca estaban en "./", que Next resuelve contra la ruta con la que se dibuja
     la pagina (`resolveRelativeUrl` en next/dist/lib/metadata/resolvers) y
     solo colapsa al dominio pelado cuando esa ruta es exactamente "/". Vercel
     regenera la home (ISR) dibujandola como "/index": pasados los primeros
     5 minutos, la home le decia a Google que su direccion canonica era
     https://unamargo.com/index. */
  openGraph: OPEN_GRAPH_BASE,
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
