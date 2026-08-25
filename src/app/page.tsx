import { getCatalogo } from "@/lib/catalog";
import { construirSchema } from "@/lib/schema";
import { FAQ } from "@/lib/faq";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Tira } from "@/components/Tira";
import { Tienda } from "@/components/Tienda";
import { Nosotros } from "@/components/Nosotros";
import { Personalizados } from "@/components/Personalizados";
import { Empresas } from "@/components/Empresas";
import { Envios } from "@/components/Envios";
import { Preguntas } from "@/components/Preguntas";
import { Contacto } from "@/components/Contacto";
import { Footer } from "@/components/Footer";

/** El catalogo del ERP se revalida cada 5 minutos. Su propio endpoint ya
 *  cachea 60s en CDN con stale-while-revalidate 300, asi que esto no agrega
 *  desfasaje real. */
export const revalidate = 300;


export default async function Home() {
  const catalogo = await getCatalogo();

  const schema = construirSchema(catalogo, FAQ);

  return (
    <CartProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ScrollReveal />
      <Header />
      <main>
        <Hero />
        <Tira />
        <Tienda catalogo={catalogo} />
        <Nosotros />
        <Personalizados />
        <Empresas />
        <Envios />
        <Preguntas />
        <Contacto />
      </main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
