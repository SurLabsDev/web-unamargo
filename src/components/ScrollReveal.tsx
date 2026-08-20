"use client";

import { useEffect } from "react";

/** Un solo IntersectionObserver para todo el revelado de la pagina. Se
 *  desuscribe de cada elemento apenas entra, asi que no queda trabajo por
 *  frame. Nunca escuchar "scroll": corre en cada cuadro y traba el celular. */
export function ScrollReveal() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      document
        .querySelectorAll(".reveal")
        .forEach((el) => el.classList.add("in-view"));
      return;
    }

    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("in-view");
          obs.unobserve(e.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));

    // La grilla de la tienda se re-arma al filtrar: hay que tomar lo nuevo.
    const mut = new MutationObserver(() => {
      document
        .querySelectorAll(".reveal:not(.in-view)")
        .forEach((el) => obs.observe(el));
    });
    mut.observe(document.body, { childList: true, subtree: true });

    return () => {
      obs.disconnect();
      mut.disconnect();
    };
  }, []);

  return null;
}
