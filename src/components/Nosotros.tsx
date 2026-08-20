/** Declaracion a ancho completo. Sin foto y sin columnas: despues de una
 *  grilla de 34 productos, el descanso es la composicion. */
export function Nosotros() {
  return (
    <section
      id="nosotros"
      className="scroll-mt-20 border-y border-tinta/10 bg-papel-hondo py-24 lg:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <div className="reveal max-w-[22ch]">
          <h2 className="type-display text-[clamp(2rem,5.5vw,4rem)] font-semibold">
            Más que vender mates, sostener la ronda.
          </h2>
        </div>
        <div className="reveal mt-10 grid gap-8 md:grid-cols-2 md:gap-16 lg:mt-14">
          <p className="type-body text-lg leading-relaxed text-tinta-media">
            Nos dedicamos a acercarte mates y accesorios seleccionados con
            dedicación. Elegimos pieza por pieza, probamos lo que vendemos y te
            decimos la verdad sobre cada material.
          </p>
          <p className="type-body text-lg leading-relaxed text-tinta-media">
            Queremos que cada mate que llevás a casa sea un compañero fiel en
            tus momentos de pausa, de charla y de tradición. Eso es todo el
            negocio.
          </p>
        </div>
      </div>
    </section>
  );
}
