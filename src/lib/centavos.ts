/** La plata se suma en centavos con BigInt, nunca con floats: 349.90 + 0.1 en
 *  coma flotante no da 350.00, y un total con un centavo de mas en una web de
 *  ventas se ve como un error del negocio. Entra string decimal, sale string
 *  decimal, y en el medio solo hay enteros. */
export function aCentavos(valor: string): bigint {
  const limpio = valor.trim();
  const negativo = limpio.startsWith("-");
  const [entero, decimal = ""] = limpio.replace("-", "").split(".");
  const centavos =
    BigInt(entero || "0") * 100n + BigInt((decimal + "00").slice(0, 2));
  return negativo ? -centavos : centavos;
}

export function desdeCentavos(centavos: bigint): string {
  const negativo = centavos < 0n;
  const abs = negativo ? -centavos : centavos;
  const entero = abs / 100n;
  const resto = (abs % 100n).toString().padStart(2, "0");
  return `${negativo ? "-" : ""}${entero}.${resto}`;
}
