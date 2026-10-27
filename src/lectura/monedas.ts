/**
 * Premios durante la lectura: una moneda cada PALABRAS_POR_MONEDA palabras
 * leídas a buen ritmo (las frases con "más despacito" no suman). Lo que
 * sobra pasa a la siguiente moneda.
 */

export const PALABRAS_POR_MONEDA = 20

/** Palabras con letras o números ("—", "…" sueltos no cuentan). */
export function contarPalabras(frase: string): number {
  return frase.split(/\s+/).filter((p) => /[\p{L}\p{N}]/u.test(p)).length
}

export function acumularPalabras(acumuladas: number, nuevas: number, porMoneda = PALABRAS_POR_MONEDA) {
  const total = acumuladas + nuevas
  return { monedas: Math.floor(total / porMoneda), resto: total % porMoneda }
}

/**
 * Lo acumulado hacia la próxima moneda se guarda en el dispositivo, para que
 * no se pierda si el niño cierra la app a mitad de camino.
 */
const clave = (perfilId: string) => `ciempi:hacia-moneda:${perfilId}`

export function leerHaciaMoneda(perfilId: string): number {
  try {
    const n = Number(localStorage.getItem(clave(perfilId)))
    return Number.isFinite(n) && n >= 0 && n < PALABRAS_POR_MONEDA ? n : 0
  } catch {
    return 0
  }
}

export function guardarHaciaMoneda(perfilId: string, palabras: number) {
  try {
    localStorage.setItem(clave(perfilId), String(palabras))
  } catch {
    // Sin almacenamiento (modo privado): solo se pierde el avance parcial.
  }
}
