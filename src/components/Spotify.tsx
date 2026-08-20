"use client";

import { useState } from "react";
import { SpotifyLogo, X } from "@phosphor-icons/react/dist/ssr";

/** El widget de la playlist, tal como lo penso el cliente: un boton fijo abajo
 *  a la izquierda que despliega el reproductor. Es de las cosas mas suyas que
 *  tiene la marca, asi que se queda con su lugar y su texto.
 *  El iframe se monta recien al abrir: si no, Spotify carga en cada visita
 *  aunque nadie lo toque. */
export function Spotify() {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="fixed bottom-6 left-5 z-40 flex flex-col items-start gap-2.5 sm:left-6">
      {abierto && (
        <div className="w-[300px] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.22)]">
          <iframe
            src="https://open.spotify.com/embed/playlist/2e3Gb1Cfnrop9ZJS6OBLrE?utm_source=generator&theme=0"
            width="300"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Playlist de Un Amargo en Spotify"
            className="block w-full"
          />
        </div>
      )}

      <div className="group relative inline-flex">
        <button
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-label={abierto ? "Cerrar la playlist" : "Escuchar nuestra playlist"}
          className="flex h-12 w-12 items-center justify-center rounded-pill bg-verde-vivo text-papel shadow-[0_2px_12px_rgba(0,0,0,0.22)] transition-all duration-200 hover:scale-105 hover:bg-verde"
        >
          {abierto ? <X size={20} weight="bold" /> : <SpotifyLogo size={23} weight="fill" />}
        </button>

        {!abierto && (
          <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 hidden -translate-y-1/2 translate-x-[-6px] whitespace-nowrap rounded-[6px] bg-tinta px-3.5 py-2 text-xs font-semibold text-papel opacity-0 shadow-[0_2px_12px_rgba(0,0,0,0.22)] transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 md:block">
            Conocé y escuchá nuestra playlist
          </span>
        )}
      </div>
    </div>
  );
}
