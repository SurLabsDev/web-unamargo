import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* Las fotos del catalogo viven en el Storage del ERP, que es un proyecto de
     * Supabase. Se permite CUALQUIER proyecto y no uno escrito a mano porque
     * cada instancia del ERP tiene el suyo: produccion y el ambiente de prueba
     * son proyectos distintos, con hosts distintos.
     *
     * La version anterior tenia una funcion que decia derivar el host de
     * `NEXT_PUBLIC_ERP_API`, pero calculaba la variable, la tiraba con `void` y
     * devolvia el host de produccion fijo. O sea que no derivaba nada: el
     * ambiente de prueba mostraba TODAS las fotos rotas, con las URLs
     * respondiendo 200, porque el optimizador de Next se niega a tocar un host
     * que no esta en esta lista. Y no se podia derivar aunque se quisiera: el
     * host del storage no sale del host de la API, son dominios distintos.
     *
     * El comodin va acotado por `pathname` al prefijo publico del storage, que
     * es lo unico que este sitio necesita servir. */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
