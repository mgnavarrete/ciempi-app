import { CUENTOS, CUENTOS_ORIGINALES } from '../contenido/cuentos'
import type { Desbloqueo } from './repositorios'

/**
 * La regla de la Cuncuna para el modo sin cuenta (repositoriosLocales). Es la
 * misma condición que decide el servidor (server/src/desbloqueos.ts y la
 * función SQL `cuncuna_motivo` de la migración 013), con lo que se puede
 * verificar en el dispositivo:
 *
 * - `nivel0`: 6 de los 8 cuentos originales de nivel 0 pagados enteros; si un
 *   adulto quitó algunos de la biblioteca, todos los que tenga (mínimo 4).
 * - `cuentos`: 6 cuentos de Ciempi distintos pagados enteros, de cualquier nivel.
 *
 * Diferencias con el servidor (documentadas en docs/expansion-v5/tienda/):
 * - No existe la vía del lector lento (60 min y 30 frases de N0): en local no
 *   hay un reloj confiable que acredite los segundos.
 * - Lo pagado se cuenta por asignación (tabla local de premios): si se quita
 *   un cuento de la biblioteca, lo leído de él deja de contar (el servidor lo
 *   recuerda en `lecturas_premiadas`).
 * - No hay regalo de un adulto (necesita cuenta en línea).
 */
export const CUNCUNA = 'especie:cuncuna'
/** Los 8 de siempre (los cuentos con su Ciempi de nivel 0 no cambian la regla, igual que en el servidor). */
export const ORIGINALES_N0 = CUENTOS_ORIGINALES.filter((c) => c.nivel === 0).map((c) => c.id)
export const REGLA_CUNCUNA_LOCAL = { cuentosMinimos: 6, minimoSiQuitaron: 4 }

/** Un cuento de Ciempi en la biblioteca del niño: cuántas frases tiene y hasta cuál está pagado. */
export interface CuentoLeido {
  textoId: string
  total: number
  pagado: number
}

export function motivoCuncuna(cuentos: CuentoLeido[]): Desbloqueo['motivo'] | null {
  const R = REGLA_CUNCUNA_LOCAL
  const terminado = (c: CuentoLeido) => c.total > 0 && c.pagado >= c.total
  const deCiempi = cuentos.filter((c) => CUENTOS.some((x) => x.id === c.textoId))
  const n0 = deCiempi.filter((c) => ORIGINALES_N0.includes(c.textoId))
  const n0Asignados = new Set(n0.map((c) => c.textoId)).size
  const n0Terminados = new Set(n0.filter(terminado).map((c) => c.textoId)).size
  const terminados = new Set(deCiempi.filter(terminado).map((c) => c.textoId)).size
  if (n0Terminados >= Math.min(R.cuentosMinimos, Math.max(R.minimoSiQuitaron, n0Asignados))) return 'nivel0'
  if (terminados >= R.cuentosMinimos) return 'cuentos'
  return null
}

/** 2.5.2: la Cuncuna se compra con monedas; leyendo ya no se regala (igual que server/src/desbloqueos.ts). */
export const CUNCUNA_POR_LECTURA = false
