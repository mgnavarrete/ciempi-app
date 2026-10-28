/**
 * Niveles 2 y 4: la voz acompaña al dedo trozo por trozo. En el 2 los trozos
 * son grupos cortos de palabras de la oración; en el 4, las oraciones de la
 * página. Cuando el dedo entra a un trozo, ese trozo se pone en fila con la
 * velocidad del dedo: si va lento, la voz va lenta; si va rápido, la voz
 * llega como máximo a 1,2× y nunca se corta ni se salta
 * nada: termina un trozo y sigue con el otro. Si el dedo vuelve atrás o se
 * levanta, la voz se corta (ver PantallaLectura).
 */

/** Palabras por segundo que dice la voz a velocidad 1 (aprox., en español). */
export const PALABRAS_POR_SEGUNDO_VOZ = 2.5
export const VELOCIDAD_MINIMA = 0.6
/** La voz nunca va más rápido que 1,2× (igual que en audio/voz.ts): si el dedo va más rápido, los trozos esperan su turno. */
export const VELOCIDAD_MAXIMA = 1.2
/** Con tantos trozos esperando, la voz va a la velocidad máxima aunque el dedo vaya más lento. */
export const TROZOS_DE_ATRASO = 2
/** Cuánto se apura por cada trozo de atraso. */
const APURAR = 1.2

const limitar = (v: number) => Math.min(VELOCIDAD_MAXIMA, Math.max(VELOCIDAD_MINIMA, v))

/** Velocidad de la voz para acompañar un dedo que va a tantas palabras por segundo. */
export function velocidadPara(palabrasPorSegundo: number | null): number {
  if (palabrasPorSegundo == null || !Number.isFinite(palabrasPorSegundo)) return 1
  return limitar(palabrasPorSegundo / PALABRAS_POR_SEGUNDO_VOZ)
}

/**
 * Velocidad para un trozo nuevo de `palabras` palabras. `terminan`: cuándo se
 * estima que termina cada trozo que ya está en fila. Devuelve la velocidad y
 * la fila con el trozo nuevo.
 */
export function encolarTrozo(terminan: number[], palabras: number, palabrasPorSegundo: number | null, t: number): { velocidad: number; terminan: number[] } {
  const pendientes = terminan.filter((fin) => fin > t)
  const atraso = pendientes.length
  const ritmo = velocidadPara(palabrasPorSegundo)
  const velocidad = limitar(atraso >= TROZOS_DE_ATRASO ? Math.max(ritmo, 1) * APURAR ** (atraso - 1) : ritmo)
  const empieza = Math.max(t, pendientes.at(-1) ?? t)
  const dura = (palabras / (PALABRAS_POR_SEGUNDO_VOZ * velocidad)) * 1000
  return { velocidad, terminan: [...pendientes, empieza + dura] }
}

/** El trozo donde está el dedo: el último que empieza antes de `pos` (`inicios` en orden, 0..1). */
export function trozoEn(inicios: number[], pos: number): number {
  let k = 0
  while (k + 1 < inicios.length && inicios[k + 1] <= pos + 1e-9) k++
  return k
}
