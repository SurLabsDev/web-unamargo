import { imagenGuia } from "@/guias/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Cómo cebar un buen amargo. Un Amargo.";

export default function Imagen() {
  return imagenGuia("cebar");
}
