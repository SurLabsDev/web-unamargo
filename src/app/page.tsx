import { getCatalogo } from "@/lib/catalog";
import { getPopup } from "@/lib/popup";
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
import { Guias } from "@/components/Guias";
import { Preguntas } from "@/components/Preguntas";
import { Contacto } from "@/components/Contacto";
import { Footer } from "@/components/Footer";
import { PopupAviso } from "@/components/PopupAviso";
import { Playlist } from "@/components/Playlist";

/** El catalogo del ERP se revalida cada 5 minutos. Su propio endpoint ya
 *  cachea 60s en CDN con stale-while-revalidate 300, asi que esto no agrega
 *  desfasaje real. */
export const revalidate = 300;


export default async function Home() {
  // En paralelo: son dos pedidos al mismo ERP y ninguno depende del otro.
  const [catalogo, popup] = await Promise.all([getCatalogo(), getPopup()]);

  const schema = construirSchema(catalogo, FAQ);

  return (
    <CartProvider>
      <script
        type="application/ld+json"
        // `<` escapado: los textos de los productos vienen del ERP, y un
        // "</script>" adentro de una descripcion cerraria esta etiqueta y lo
        // que sigue se ejecutaria como codigo. Es lo que indica la guia de
        // JSON-LD de Next.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
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
        <Guias />
        <Preguntas />
        <Contacto />
      </main>
      <Footer />
      <CartDrawer />
      <PopupAviso popup={popup} />
      <Playlist />
    </CartProvider>
  );
}
