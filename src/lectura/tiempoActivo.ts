/**
 * Tiempo activo de lectura que mide la app (para la sesión y, con E2, para
 * los premios). Cada pausa entre dos toques o movimientos del dedo cuenta
 * como máximo `MAX_PAUSA_ACTIVA_MS` (10 s): dejar la app abierta sin leer no
 * suma más que eso. El servidor además lo acota (2× lo esperado y su reloj).
 */
export const MAX_PAUSA_ACTIVA_MS = 10_000

export interface TiempoActivo {
  /** Milisegundos activos acumulados. */
  ms: number
  /** Último toque o movimiento (performance.now()), 0 si todavía no hubo. */
  ultimo: number
  /** `ms` al pedir el último premio (lo de después es de la unidad siguiente). */
  alPedir: number
}

export const tiempoActivoInicial = (): TiempoActivo => ({ ms: 0, ultimo: 0, alPedir: 0 })

/** Suma la actividad hasta `t`: la pausa desde el último gesto cuenta como mucho 10 s. */
export function registrarGesto(ta: TiempoActivo, t: number, maxPausaMs = MAX_PAUSA_ACTIVA_MS): void {
  if (ta.ultimo) ta.ms += Math.max(0, Math.min(t - ta.ultimo, maxPausaMs))
  ta.ultimo = t
}

/** Segundos activos desde el último premio pedido (y marca este como el último). */
export function segundosDesdeElUltimoPremio(ta: TiempoActivo): number {
  const s = Math.max(0, ta.ms - ta.alPedir) / 1000
  ta.alPedir = ta.ms
  return Math.round(s * 10) / 10
}
