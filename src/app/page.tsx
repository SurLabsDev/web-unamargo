import { getCatalogo, type Producto } from "@/lib/catalog";
import { SITE } from "@/lib/site";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Tienda } from "@/components/Tienda";
import { Nosotros } from "@/components/Nosotros";
import { Personalizados } from "@/components/Personalizados";
import { Empresas } from "@/components/Empresas";
import { Envios } from "@/components/Envios";
import { Contacto } from "@/components/Contacto";
import { Footer } from "@/components/Footer";

/** El catalogo del ERP se revalida cada 5 minutos. Su propio endpoint ya
 *  cachea 60s en CDN con stale-while-revalidate 300, asi que esto no agrega
 *  desfasaje real. */
export const revalidate = 300;

/** La pieza del hero se busca por SKU y no por posicion: si el catálogo cambia
 *  de orden, el hero no cambia solo. Si ese SKU desaparece, cae en la primera
 *  foto disponible en vez de quedarse sin imagen. */
function elegirDestacado(productos: Producto[]): Producto | null {
  return (
    productos.find((p) => p.sku === "MATE-RANCHERO-ALGARROBO") ??
    productos.find((p) => p.images.length > 0) ??
    null
  );
}

function fotoPersonalizados(
  productos: Producto[],
  excluir: string | undefined,
): string | null {
  const p = productos.find(
    (x) =>
      x.sku !== excluir &&
      x.images.length > 0 &&
      x.category?.slug === "mates",
  );
  return p?.images[0] ?? null;
}

export default async function Home() {
  const catalogo = await getCatalogo();
  const destacado = elegirDestacado(catalogo.productos);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${SITE.url}/#tienda`,
    name: SITE.nombre,
    description: SITE.descripcion,
    url: SITE.url,
    telephone: `+${SITE.whatsapp}`,
    email: SITE.email,
    // Sin direccion inventada: el negocio coordina puntos de encuentro, no
    // tiene local a la calle.
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.ciudad,
      addressCountry: "UY",
    },
    areaServed: SITE.pais,
    currenciesAccepted: "UYU",
  };

  return (
    <CartProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ScrollReveal />
      <Header />
      <main>
        <Hero destacado={destacado} />
        <Tienda catalogo={catalogo} />
        <Nosotros />
        <Personalizados
          foto={fotoPersonalizados(catalogo.productos, destacado?.sku)}
        />
        <Empresas />
        <Envios />
        <Contacto />
      </main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
