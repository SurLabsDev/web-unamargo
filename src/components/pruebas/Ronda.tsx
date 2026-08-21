"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Plus, ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";
import { precio, type Producto } from "@/lib/catalog";

/** LA RONDA. El mate va girando y vuelve: es el ritual de la marca, asi que el
 *  catalogo gira igual. Arrastras para girar y el de arriba es el elegido.
 *
 *  Nada de esto pasa por el estado de React salvo el indice elegido, que cambia
 *  como mucho 34 veces por vuelta. El angulo vive en un ref y se escribe directo
 *  sobre el nodo: si estuviera en el estado, cada cuadro redibujaria las 34
 *  piezas y en el celular se cae a pedazos. */
/** La preferencia de movimiento reducido leida como lo que es: un dato de
 *  afuera de React. Asi no hay que setear estado dentro de un efecto, y en el
 *  servidor se asume que hay movimiento para que el HTML coincida. */
function movimientoReducido(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", avisar);
      return () => m.removeEventListener("change", avisar);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function Ronda({ productos }: { productos: Producto[] }) {
  const ruedaRef = useRef<HTMLDivElement>(null);
  const angulo = useRef(0);
  const velocidad = useRef(0.06);
  const arrastrando = useRef(false);
  const ultimoX = useRef(0);
  const [elegido, setElegido] = useState(0);
  const quieta = movimientoReducido();

  const n = productos.length;
  const paso = 360 / Math.max(n, 1);

  const aplicar = useCallback(() => {
    const el = ruedaRef.current;
    if (el) el.style.transform = `rotate(${angulo.current}deg)`;
    // El de arriba es el elegido. Solo se toca el estado si de verdad cambio.
    const idx = ((Math.round(-angulo.current / paso) % n) + n) % n;
    setElegido((prev) => (prev === idx ? prev : idx));
  }, [n, paso]);

  useEffect(() => {
    if (quieta) {
      aplicar();
      return;
    }
    let raf = 0;
    const tick = () => {
      if (!arrastrando.current) {
        angulo.current += velocidad.current;
        // Inercia tras soltar: vuelve al giro suave de fondo.
        if (Math.abs(velocidad.current) > 0.06) velocidad.current *= 0.95;
      }
      aplicar();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [aplicar, quieta]);

  function abajo(e: React.PointerEvent) {
    arrastrando.current = true;
    ultimoX.current = e.clientX;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }
  function mover(e: React.PointerEvent) {
    if (!arrastrando.current) return;
    const d = e.clientX - ultimoX.current;
    ultimoX.current = e.clientX;
    angulo.current += d * 0.28;
    velocidad.current = d * 0.28;
    aplicar();
  }
  function arriba() {
    arrastrando.current = false;
  }

  const p = productos[elegido];

  return (
    <div className="relative">
      <div className="relative mx-auto aspect-square w-full max-w-[560px] touch-pan-y select-none">
        {/* El aro guia y la marca de arriba, que es donde se sirve. */}
        <div
          aria-hidden
          className="absolute inset-[12%] rounded-full border border-linea"
        />
        <div
          aria-hidden
          className="absolute left-1/2 top-[3%] h-2 w-2 -translate-x-1/2 rounded-full bg-tinta"
        />

        <div
          ref={ruedaRef}
          onPointerDown={abajo}
          onPointerMove={mover}
          onPointerUp={arriba}
          onPointerCancel={arriba}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{ willChange: "transform" }}
        >
          {productos.map((prod, i) => {
            const a = i * paso;
            return (
              <div
                key={prod.sku}
                className="absolute left-1/2 top-1/2 h-[15%] w-[15%]"
                style={{
                  // OJO: translateY con porcentaje es relativo al PROPIO
                  // elemento, no al contenedor. La pieza mide 15% del aro y el
                  // radio buscado es 37,5%, asi que hay que correrla 2,5 veces
                  // su propio alto. Con un valor chico quedan todas apiladas
                  // en el centro.
                  transform: `translate(-50%,-50%) rotate(${a}deg) translateY(-250%)`,
                  transformOrigin: "center",
                }}
              >
                <div
                  className="relative h-full w-full transition-transform duration-300"
                  style={{
                    transform: `rotate(${-a}deg) scale(${i === elegido ? 1.75 : 0.9})`,
                  }}
                >
                  {prod.images[0] && (
                    <Image
                      src={prod.images[0]}
                      alt=""
                      fill
                      sizes="110px"
                      className={`object-contain transition-opacity duration-300 ${
                        i === elegido ? "opacity-100" : "opacity-25"
                      }`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* El centro: el producto que quedo arriba. */}
        {p && (
          <div className="pointer-events-none absolute inset-[30%] flex flex-col items-center justify-center text-center">
            {p.subtype && (
              <p className="text-[11px] uppercase tracking-[0.16em] text-tinta-suave">
                {p.subtype.name}
              </p>
            )}
            <p className="type-display mt-2 text-[clamp(1.1rem,2.4vw,1.6rem)]">
              {p.name}
            </p>
            <p className="mt-2 text-xl font-semibold tabular-nums">
              {precio(p.price_final)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        {p && (
          <button className="inline-flex items-center gap-2 rounded-pill bg-tinta px-6 py-3 text-sm font-semibold text-papel transition-transform duration-300 hover:scale-[1.03]">
            <Plus size={14} weight="bold" />
            Agregar {p.name}
          </button>
        )}
        <p className="flex items-center gap-1.5 text-xs text-tinta-suave">
          <ArrowsClockwise size={13} />
          {quieta ? "Tocá una pieza para elegirla" : "Arrastrá para girar la ronda"}
        </p>
      </div>
    </div>
  );
}
