import type { NivelLectura } from '../dominio/tipos'

/**
 * Monedas por leer. Cada libro se lee siempre desde el comienzo (o, en un
 * libro con capítulos, desde el capítulo donde iba), y las monedas se ganan
 * por hitos de avance: al llegar al 25, 50, 75 o 100 % del libro. Cada hito
 * paga una sola vez por libro; después, volver a terminarlo da un premio
 * menor, una vez al día.
 *
 * Un hito cuenta cuando el niño leyó de verdad hasta ahí: de corrido desde
 * lo que ya tenía leído, y a buen ritmo (ver `MINIMO_A_BUEN_RITMO`).
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

/** Niveles 0 y 1: cuentos cortos, todo al terminar. Desde el 2, también por avance. */
export const HITOS: Record<NivelLectura, Hito[]> = {
  0: [{ porcentaje: 100, monedas: 5 }],
  1: [{ porcentaje: 100, monedas: 10 }],
  2: [
    { porcentaje: 50, monedas: 5 },
    { porcentaje: 100, monedas: 10 },
  ],
  3: [
    { porcentaje: 25, monedas: 5 },
    { porcentaje: 50, monedas: 5 },
    { porcentaje: 75, monedas: 5 },
    { porcentaje: 100, monedas: 10 },
  ],
  4: [
    { porcentaje: 25, monedas: 5 },
    { porcentaje: 50, monedas: 10 },
    { porcentaje: 75, monedas: 10 },
    { porcentaje: 100, monedas: 15 },
  ],
}

/** En los niveles 0 y 1 no se muestra el porcentaje: el cuento es corto y se lee entero. */
export const conPorcentaje = (nivel: NivelLectura) => nivel >= 2

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
