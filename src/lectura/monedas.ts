import type { NivelLectura } from '../dominio/tipos.ts'

/**
 * Monedas por leer. Cada libro se lee siempre desde el comienzo (o, en un
 * libro con capítulos, desde el capítulo donde iba).
 *
 * Niveles 0 a 3: cada frase (oración o párrafo) leída por primera vez y a
 * buen ritmo da monedas en el momento, para mantener las ganas de seguir; al
 * terminar el libro hay un premio. Nivel 4 (páginas largas): por hitos de
 * avance, al llegar al 25, 50, 75 o 100 % del libro.
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

/** Monedas por cada frase (u oración, o párrafo en el nivel 3) leída por primera vez. El nivel 4 va por hitos. */
export const MONEDAS_POR_UNIDAD: Record<NivelLectura, number> = { 0: 1, 1: 1, 2: 1, 3: 2, 4: 0 }

/** Niveles 0 a 3: el premio por terminar el libro (además de lo de cada frase). Nivel 4: por avance. */
export const HITOS: Record<NivelLectura, Hito[]> = {
  0: [{ porcentaje: 100, monedas: 3 }],
  1: [{ porcentaje: 100, monedas: 5 }],
  2: [{ porcentaje: 100, monedas: 5 }],
  3: [{ porcentaje: 100, monedas: 10 }],
  4: [
    { porcentaje: 25, monedas: 5 },
    { porcentaje: 50, monedas: 10 },
    { porcentaje: 75, monedas: 10 },
    { porcentaje: 100, monedas: 15 },
  ],
}

/** Al menos esta parte de lo leído en la sesión tiene que ser a buen ritmo para que los hitos cuenten. */
export const MINIMO_A_BUEN_RITMO = 0.8

/** Volver a terminar un libro ya premiado: un quinto del premio de terminarlo, una vez al día. */
export function premioRelectura(nivel: NivelLectura): number {
  return Math.ceil(HITOS[nivel][HITOS[nivel].length - 1].monedas / 5)
}

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
