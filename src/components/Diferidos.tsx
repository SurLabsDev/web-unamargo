"use client";

import dynamic from "next/dynamic";
import type { Popup } from "@/lib/popup";

/* LO QUE NO HACE FALTA PARA VER LA PAGINA SE BAJA DESPUES DEL PRIMER PINTADO:
   el cajon del pedido, el pop-up y la playlist. Los tres viven en un portal y
   en el servidor no dibujan nada (ver `useMontado`), asi que el HTML es el
   mismo; lo que cambia es que su codigo ya no se baja ni se evalua antes de
   que aparezca la pagina, que en un celular lento es justo lo que mide
   PageSpeed.

   `ssr: false` no se puede usar desde un componente de servidor como la
   pagina: por eso este envoltorio de cliente. El cajon arranca a bajarse en
   la hidratacion, asi que cuando alguien toca "Agregar" ya esta; si llegara
   a tocarlo antes, el cajon se abre apenas llega. */
const CartDrawer = dynamic(
  () => import("./cart/CartDrawer").then((m) => m.CartDrawer),
  { ssr: false },
);
const PopupAviso = dynamic(
  () => import("./PopupAviso").then((m) => m.PopupAviso),
  { ssr: false },
);
const Playlist = dynamic(() => import("./Playlist").then((m) => m.Playlist), {
  ssr: false,
});

export function Diferidos({ popup }: { popup: Popup | null }) {
  return (
    <>
      <CartDrawer />
      <PopupAviso popup={popup} />
      <Playlist />
    </>
  );
}
