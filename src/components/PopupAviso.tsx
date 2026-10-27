"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "@phosphor-icons/react/dist/ssr";
import { useDialogo, useMontado } from "./useDialogo";
import type { Popup } from "@/lib/popup";

/** Lo que el visitante ya vio: la `version` del ultimo pop-up mostrado. */
const CLAVE = "unamargo:popup-visto";
/** Lo mismo que esperaba el de la demo del cliente antes de aparecer. */
const ESPERA_MS = 4000;
/** Si a los 4 segundos hay otro dialogo abierto, se reintenta cada tanto. */
const REINTENTO_MS = 1500;

/** El pop-up que el cliente arma en el ERP.
 *
 *  Aparece una sola vez por visitante. Si lo cierra no vuelve, hasta que el
 *  cliente lo edite o prenda otro: ahi cambia la `version` y se muestra de
 *  nuevo. Nunca aparece encima del pedido ni del menu: si a los 4 segundos hay
 *  uno abierto, espera a que se cierre. Interrumpir a alguien que esta
 *  armando un pedido es la forma mas rapida de perderlo. */
export function PopupAviso({ popup }: { popup: Popup | null }) {
  const [abierto, setAbierto] = useState(false);
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const montado = useMontado();

  // El foco va al dialogo y no a la X: el pop-up aparece solo, sin que nadie
  // haya tocado nada, y ahi el navegador le pinta el aro de foco al boton
  // como si lo hubieran elegido con el teclado. Con el foco en el dialogo,
  // el lector de pantalla lee el titulo y el primer Tab ya cae adentro.
  useDialogo(dialogoRef, abierto, {
    alAbrir: () => dialogoRef.current?.focus(),
  });

  useEffect(() => {
    if (!popup) return;
    try {
      if (localStorage.getItem(CLAVE) === popup.version) return;
    } catch {
      /* sin storage (modo privado): se muestra, una vez por carga */
    }

    let t: ReturnType<typeof setTimeout>;
    const intentar = () => {
      if (document.querySelector("dialog[open]")) {
        t = setTimeout(intentar, REINTENTO_MS);
        return;
      }
      // Se marca visto al MOSTRARLO y no al cerrarlo: el que lo vio y siguio
      // de largo sin tocar la X tampoco lo quiere ver en cada visita.
      try {
        localStorage.setItem(CLAVE, popup.version);
      } catch {
        /* idem */
      }
      setAbierto(true);
    };
    t = setTimeout(intentar, ESPERA_MS);
    return () => clearTimeout(t);
  }, [popup]);

  if (!popup || !montado) return null;

  const cta = popup.cta;
  const interno = cta?.url.startsWith("#") ?? false;

  return createPortal(
    <dialog
      ref={dialogoRef}
      aria-label={popup.title}
      tabIndex={-1}
      onCancel={(e) => {
        e.preventDefault();
        setAbierto(false);
      }}
      onClick={(e) => {
        if (e.target === dialogoRef.current) setAbierto(false);
      }}
      className="aviso"
    >
      <div
        className={`relative grid bg-papel ${popup.image ? "sm:grid-cols-2" : ""}`}
      >
        {popup.image && (
          <div className="relative h-48 sm:h-auto sm:min-h-[320px]">
            <Image
              src={popup.image}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 390px"
              className="object-cover"
            />
          </div>
        )}
        <div className="flex flex-col justify-center gap-4 px-6 py-9 sm:px-9 sm:py-10">
          <h2 className="pr-8 text-2xl font-extrabold leading-tight tracking-[-0.03em]">
            {popup.title}
          </h2>
          {popup.body && (
            <p className="type-body whitespace-pre-line text-sm leading-relaxed text-tinta-media">
              {popup.body}
            </p>
          )}
          {cta && (
            <a
              href={cta.url}
              {...(interno
                ? {
                    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.preventDefault();
                      setAbierto(false);
                      document.querySelector(cta.url)?.scrollIntoView();
                      history.replaceState(null, "", cta.url);
                    },
                  }
                : {
                    target: "_blank",
                    rel: "noopener noreferrer",
                    onClick: () => setAbierto(false),
                  })}
              className="mt-2 self-start rounded-pill bg-tinta px-6 py-3 text-sm font-semibold text-papel transition-transform duration-300 hover:scale-[1.03]"
            >
              {cta.label}
            </a>
          )}
        </div>
        {/* Sobre la foto en el celular va con fondo, para que se vea sobre
            cualquier imagen. */}
        <button
          onClick={() => setAbierto(false)}
          aria-label="Cerrar"
          className="absolute right-3 top-3 rounded-pill bg-papel/85 p-2 text-tinta-media transition-colors hover:text-tinta"
        >
          <X size={18} weight="bold" />
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
