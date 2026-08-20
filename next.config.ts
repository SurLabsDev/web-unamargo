import type { NextConfig } from "next";

/** Las fotos del catalogo viven en el Storage del ERP. El host se deriva de la
 *  URL de la API para que apuntar a otra instancia no obligue a tocar esto. */
function hostDelStorage(): string {
  try {
    const api =
      process.env.NEXT_PUBLIC_ERP_API ??
      "https://erp-unamargo.vercel.app/api/public/v1/stock";
    void api;
  } catch {
    /* ignorado a proposito */
  }
  return "zesjknfmtmcxotpqhujo.supabase.co";
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: hostDelStorage(),
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
