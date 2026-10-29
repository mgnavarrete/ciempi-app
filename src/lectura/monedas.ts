import type { NivelLectura } from '../dominio/tipos.ts'

/**
 * Monedas por leer. Cada libro se lee siempre desde el comienzo (o, en un
 * libro con capítulos, desde el capítulo donde iba).
 *
 * Niveles 0 a 3: cada frase (oración o párrafo) leída por primera vez y a
 * buen ritmo da monedas en el momento, para mantener las ganas de seguir,
 * hasta un tope por libro (ver `monedasDeUnidad`). Nivel 4 (páginas largas):
 * por hitos de avance, al llegar al 25, 50, 75 o 100 % del libro.
 *
 * Todo paga una sola vez por libro; después, volver a terminarlo da un premio
 * menor, una vez al día. Cuenta lo leído de verdad: de corrido desde lo que
 * ya tenía leído, y a buen ritmo (ver `MINIMO_A_BUEN_RITMO`).
 */

/** Palabras con letras o números ("—", "…" sueltos no cuentan). */
export function contarPalabras(frase: string): number {
  return frase.split(/\s+/).filter((p) => /[\p{L}\p{N}]/u.test(p)).length
}

export interface Hito {
  /** Porcentaje del libro (25, 50, 75, 100). */
  porcentaje: number
  monedas: number
}

/** Monedas por cada frase (u oración; en el nivel 3, hasta 4 por párrafo, que es largo) leída por primera vez. El nivel 4 va por hitos. */
export const MONEDAS_POR_UNIDAD: Record<NivelLectura, number> = { 0: 1, 1: 1, 2: 1, 3: 4, 4: 0 }

/** Lo más que dan las frases de un libro: si tiene más frases, las monedas se reparten parejo. */
export const TOPE_POR_LIBRO: Record<NivelLectura, number> = { 0: 10, 1: 10, 2: Infinity, 3: 15, 4: 0 }

/**
 * Monedas que da la frase `k` (1, 2, …) de un libro de `total` frases. Con
 * pocas frases, lo de cada una; con más, el tope repartido parejo: 15 frases
 * en el nivel 1 dan 10 monedas, más o menos una cada frase y media. Siempre
 * se pagan al terminar una frase.
 */
export function monedasDeUnidad(nivel: NivelLectura, k: number, total: number): number {
  if (total <= 0 || k < 1 || k > total) return 0
  const delLibro = Math.min(TOPE_POR_LIBRO[nivel], total * MONEDAS_POR_UNIDAD[nivel])
  return Math.floor((delLibro * k) / total) - Math.floor((delLibro * (k - 1)) / total)
}

/** Premios por avance (nivel 4) o por terminar el libro (nivel 2). En 0, 1 y 3 todo va por frase, con su tope. */
export const HITOS: Record<NivelLectura, Hito[]> = {
  0: [],
  1: [],
  2: [{ porcentaje: 100, monedas: 5 }],
  3: [],
  4: [
    { porcentaje: 25, monedas: 5 },
    { porcentaje: 50, monedas: 10 },
    { porcentaje: 75, monedas: 10 },
    { porcentaje: 100, monedas: 15 },
  ],
}

/** Al menos esta parte de lo leído en la sesión tiene que ser a buen ritmo para que los hitos cuenten. */
export const MINIMO_A_BUEN_RITMO = 0.8

/** Volver a terminar un libro ya premiado: un premio menor, una vez al día. */
const RELECTURA: Record<NivelLectura, number> = { 0: 1, 1: 1, 2: 1, 3: 2, 4: 3 }
export const premioRelectura = (nivel: NivelLectura) => RELECTURA[nivel]

/** Hitos que se alcanzan al pasar de `premiadoHasta` a `porcentaje` (los ya premiados no vuelven a pagar). */
export function hitosNuevos(nivel: NivelLectura, premiadoHasta: number, porcentaje: number): Hito[] {
  return HITOS[nivel].filter((h) => h.porcentaje > premiadoHasta && h.porcentaje <= porcentaje)
}

/** Porcentaje del libro (0..100) leído hasta la frase `hasta`, sin redondear hacia arriba. */
export function porcentajeLeido(hasta: number, totalFrases: number): number {
  return totalFrases > 0 ? Math.floor((Math.min(hasta, totalFrases) / totalFrases) * 100) : 0
}

/** Fecha local AAAA-MM-DD (la relectura se premia una vez por día). */
export function hoy(fecha = new Date()): string {
  const d = (n: number) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${d(fecha.getMonth() + 1)}-${d(fecha.getDate())}`
}
