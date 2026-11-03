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
 *
 * Las cantidades están en una sola tabla (`REGLAS_MONEDAS`) que usan la app y
 * el servidor (server/src/app.ts la importa, igual que el catálogo de la
 * tienda). Para cambiar la economía basta reemplazar esa tabla: el servidor
 * calcula lo que se paga con ella (ver premios.ts) y la app solo la usa para
 * mostrar la moneda al instante.
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

/** Todas las cantidades de la economía de lectura, por nivel. */
export interface ReglasMonedas {
  /** Nombre de esta tabla: queda anotado en cada premio que registra el servidor. */
  version: string
  /** Monedas por cada frase (u oración, párrafo) leída por primera vez. El nivel 4 va por hitos. */
  porUnidad: Record<NivelLectura, number>
  /** Lo más que dan las frases de un libro: si tiene más frases, las monedas se reparten parejo. */
  topePorLibro: Record<NivelLectura, number>
  /** Premios por avance (nivel 4) o por terminar el libro (nivel 2). */
  hitos: Record<NivelLectura, Hito[]>
  /** Volver a terminar un libro ya terminado: un premio menor, una vez al día. */
  relectura: Record<NivelLectura, number>
  /** Al menos esta parte de lo leído en la sesión tiene que ser a buen ritmo para que cuente. */
  minimoABuenRitmo: number
}

/** La economía vigente (CIEMPI 2.4.1). */
export const REGLAS_MONEDAS: ReglasMonedas = {
  version: '2.4.1',
  // En el nivel 3, hasta 4 por párrafo, que es largo.
  porUnidad: { 0: 1, 1: 1, 2: 1, 3: 4, 4: 0 },
  topePorLibro: { 0: 10, 1: 10, 2: Infinity, 3: 15, 4: 0 },
  // En 0, 1 y 3 todo va por frase, con su tope.
  hitos: {
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
  },
  relectura: { 0: 1, 1: 1, 2: 1, 3: 2, 4: 3 },
  minimoABuenRitmo: 0.8,
}

/** Monedas por cada frase leída por primera vez (de la tabla vigente). */
export const MONEDAS_POR_UNIDAD = REGLAS_MONEDAS.porUnidad
/** Tope de las frases de un libro (de la tabla vigente). */
export const TOPE_POR_LIBRO = REGLAS_MONEDAS.topePorLibro
/** Premios por avance (de la tabla vigente). */
export const HITOS = REGLAS_MONEDAS.hitos
/** Parte mínima a buen ritmo (de la tabla vigente). */
export const MINIMO_A_BUEN_RITMO = REGLAS_MONEDAS.minimoABuenRitmo

/**
 * Monedas que da la frase `k` (1, 2, …) de un libro de `total` frases. Con
 * pocas frases, lo de cada una; con más, el tope repartido parejo: 15 frases
 * en el nivel 1 dan 10 monedas, más o menos una cada frase y media. Siempre
 * se pagan al terminar una frase.
 */
export function monedasDeUnidad(nivel: NivelLectura, k: number, total: number, reglas: ReglasMonedas = REGLAS_MONEDAS): number {
  if (total <= 0 || k < 1 || k > total) return 0
  const delLibro = Math.min(reglas.topePorLibro[nivel], total * reglas.porUnidad[nivel])
  return Math.floor((delLibro * k) / total) - Math.floor((delLibro * (k - 1)) / total)
}

/** Volver a terminar un libro ya premiado: un premio menor, una vez al día. */
export const premioRelectura = (nivel: NivelLectura, reglas: ReglasMonedas = REGLAS_MONEDAS) => reglas.relectura[nivel]

/** Hitos que se alcanzan al pasar de `premiadoHasta` a `porcentaje` (los ya premiados no vuelven a pagar). */
export function hitosNuevos(nivel: NivelLectura, premiadoHasta: number, porcentaje: number, reglas: ReglasMonedas = REGLAS_MONEDAS): Hito[] {
  return reglas.hitos[nivel].filter((h) => h.porcentaje > premiadoHasta && h.porcentaje <= porcentaje)
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

/**
 * Seguridad, no economía: lo que el servidor exige para creer que algo se
 * leyó. No sabe si el niño leyó de verdad (no hay audio), pero sí cuánto
 * tiempo pasó: no paga más rápido de lo que se puede pasar el dedo por el
 * texto. Los valores son generosos a propósito (un niño rápido nunca los
 * alcanza; la app ya exige como mucho 4 palabras por segundo, 8 en el nivel 2,
 * y cada frase espera 450 ms antes de pasar a la siguiente). Lo que no
 * cumple no se pierde: queda en la cola del dispositivo y se paga más tarde.
 */
export const RITMO_PLAUSIBLE = {
  /** 10 palabras por segundo, más rápido que cualquier lectura en voz alta. */
  segundosPorPalabra: 0.1,
  /** Ninguna frase (u oración, párrafo, página) se cuenta en menos de esto. */
  segundosMinimosPorUnidad: 0.5,
  /** Lectura «ahorrada» que se acepta de golpe (por ejemplo, al volver la conexión): una hora. */
  ventanaSegundos: 3600,
  /** Holgura por relojes y redes. */
  toleranciaSegundos: 5,
}
export type RitmoPlausible = typeof RITMO_PLAUSIBLE
