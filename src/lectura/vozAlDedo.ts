/**
 * Nivel 2: la voz lee la oración al ritmo del dedo. Rápido si desliza
 * rápido, lento si desliza lento, y se calla si el dedo se detiene. La voz
 * del teléfono no se puede acelerar mientras habla: cuando el dedo y la voz
 * se separan, la voz sigue desde la palabra en que iba ella (nunca se salta
 * palabras), más rápido para alcanzar al dedo o más lento para esperarlo.
 */

/** Palabras por segundo que dice la voz a velocidad 1 (aprox., en español). */
export const PALABRAS_POR_SEGUNDO_VOZ = 2.5
/** Cuántas palabras pueden separarse la voz y el dedo antes de acomodar la voz. */
const DESFASE_MAXIMO = 2
/** No se acomoda la voz más seguido que esto (cada arranque se nota). */
const MS_ENTRE_ARRANQUES = 900
export const VELOCIDAD_MINIMA = 0.6
export const VELOCIDAD_MAXIMA = 2.2

export interface VozEnCurso {
  /** Palabra donde empezó a leer. */
  desde: number
  /** Cuándo empezó (ms). */
  t: number
  /** Velocidad de la voz (1 = normal). */
  velocidad: number
}

/** Velocidad de la voz para acompañar un dedo que va a tantas palabras por segundo. */
export function velocidadPara(palabrasPorSegundo: number | null): number {
  if (palabrasPorSegundo == null || !Number.isFinite(palabrasPorSegundo)) return 1
  return Math.min(VELOCIDAD_MAXIMA, Math.max(VELOCIDAD_MINIMA, palabrasPorSegundo / PALABRAS_POR_SEGUNDO_VOZ))
}

/** Por qué palabra va la voz (estimado). */
export function palabraDeLaVoz(v: VozEnCurso, t: number): number {
  return v.desde + ((t - v.t) / 1000) * v.velocidad * PALABRAS_POR_SEGUNDO_VOZ
}

/** Cuánto más rápido (o lento) va la voz cuando tiene que alcanzar al dedo (o esperarlo). */
const ALCANZAR = 1.3

const limitar = (v: number) => Math.min(VELOCIDAD_MAXIMA, Math.max(VELOCIDAD_MINIMA, v))

/**
 * El dedo llegó a la palabra `palabra`: ¿hay que (re)empezar la voz? Devuelve
 * la nueva voz en curso, o null si la actual sigue bien. `pausadaEn`: dónde
 * quedó la voz si se calló porque el dedo se detuvo (sigue desde ahí).
 */
export function acomodarVoz(
  actual: VozEnCurso | null,
  palabra: number,
  palabrasPorSegundo: number | null,
  t: number,
  pausadaEn: number | null = null,
): VozEnCurso | null {
  const ritmo = velocidadPara(palabrasPorSegundo)
  if (!actual) {
    const desde = pausadaEn == null ? palabra : Math.min(palabra, pausadaEn)
    return { desde, t, velocidad: limitar(desde < palabra ? ritmo * ALCANZAR : ritmo) }
  }
  if (t - actual.t < MS_ENTRE_ARRANQUES) return null
  const vaEn = palabraDeLaVoz(actual, t)
  if (Math.abs(vaEn - palabra) < DESFASE_MAXIMO) return null
  const desde = Math.max(actual.desde, Math.floor(vaEn))
  return { desde, t, velocidad: limitar(palabra > vaEn ? ritmo * ALCANZAR : ritmo / ALCANZAR) }
}

// ── Nivel 4: la página, oración por oración ─────────────────────────────────
// Al entrar el dedo a una oración, Ciempi la pone en fila con la velocidad
// del dedo. Nunca se salta una: si el dedo va muy adelantado, la voz acelera.

/** Cuántas oraciones puede ir atrasada la voz antes de acelerar. */
export const ORACIONES_DE_ATRASO = 2

/**
 * Velocidad para una oración nueva de `palabras` palabras. `terminan`: cuándo
 * se estima que termina cada oración que ya está en fila. Devuelve la
 * velocidad y la fila con la nueva oración.
 */
export function encolarOracion(terminan: number[], palabras: number, palabrasPorSegundo: number | null, t: number): { velocidad: number; terminan: number[] } {
  const pendientes = terminan.filter((fin) => fin > t)
  const atraso = pendientes.length
  const ritmo = velocidadPara(palabrasPorSegundo)
  const velocidad = limitar(atraso >= ORACIONES_DE_ATRASO ? Math.max(ritmo, 1) * ALCANZAR ** (atraso - 1) : ritmo)
  const empieza = Math.max(t, pendientes.at(-1) ?? t)
  const dura = (palabras / (PALABRAS_POR_SEGUNDO_VOZ * velocidad)) * 1000
  return { velocidad, terminan: [...pendientes, empieza + dura] }
}
