import type { NivelLectura, Texto } from '../dominio/tipos.ts'
import { fraseDeUnidad, vistaPorNivel, type VistaPorNivel } from '../lenguaje/unidades.ts'
import {
  REGLAS_MONEDAS,
  RITMO_PLAUSIBLE,
  contarPalabras,
  hitosNuevos,
  monedasDeUnidad,
  porcentajeLeido,
  type Hito,
  type ReglasMonedas,
  type RitmoPlausible,
} from './monedas.ts'

/**
 * Cuánto se paga por leer: el cálculo que hace el servidor (server/src/app.ts)
 * y, sin conexión, el repositorio local. Es puro (sin red ni base de datos)
 * para que los dos den lo mismo. La app no decide cuánto gana el niño: pide
 * el premio («leí hasta la frase N») y usa la respuesta.
 */

/** Lo ya pagado de un libro para un niño. Solo sube. */
export interface EstadoPremios {
  /** Frase hasta la que ya se pagaron (o se dieron por leídas) las frases. */
  pagadoHasta: number
  /** Porcentaje del libro hasta el que ya se pagaron los hitos. */
  hitosHasta: number
  /** Último día (AAAA-MM-DD) en que se pagó una relectura. */
  relecturaDia: string | null
}

export const ESTADO_INICIAL: EstadoPremios = { pagadoHasta: 0, hitosHasta: 0, relecturaDia: null }

export type SolicitudPremio =
  /** Leyó de corrido hasta la frase `hasta`; `conPremio` falso: la última frase fue muy rápida (avanza, pero esa no paga). */
  | { tipo: 'avance'; hasta: number; conPremio: boolean }
  /** Volvió a leer entero un libro ya terminado; `dia`: su fecha local. */
  | { tipo: 'relectura'; dia: string }

export type MotivoPremio =
  | 'avance'
  /** Todo eso ya estaba pagado (otro dispositivo, o se reinstaló la app). */
  | 'ya_pagado'
  | 'relectura'
  /** Ese día (o uno posterior) ya se pagó una relectura de este libro. */
  | 'relectura_repetida'
  /** Para una relectura, el libro tiene que estar terminado antes. */
  | 'no_terminado'
  /** La fecha de la relectura no es de estos días. */
  | 'dia_invalido'

export interface CalculoPremio {
  monedas: number
  estado: EstadoPremios
  motivo: MotivoPremio
  /** Segundos que, como mínimo, toma leer lo que se paga (ver `revisarRitmo`). */
  costoSegundos: number
  /** Frases (u oraciones, párrafos) que pagaron (0 o 1). */
  unidades: number
  hitos: Hito[]
}

type TextoParaPremio = Pick<Texto, 'frases' | 'capitulos' | 'parrafos'>

/** Lo mínimo que toma leer una unidad (para la plausibilidad, no para la economía). */
function segundosDe(unidad: string, ritmo: RitmoPlausible): number {
  const palabras = contarPalabras(unidad)
  return palabras === 0 ? 0 : Math.max(ritmo.segundosMinimosPorUnidad, palabras * ritmo.segundosPorPalabra)
}

/** Suma, día por día, `dias` a una fecha AAAA-MM-DD (en UTC, sin horas). */
export function sumarDias(dia: string, dias: number): string {
  const d = new Date(`${dia}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/**
 * Una relectura llega con la fecha local del dispositivo: se acepta si es de
 * estos días (puede venir de la cola, sin conexión, o de otra zona horaria).
 */
export function diaValido(dia: string, hoy: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || Number.isNaN(Date.parse(`${dia}T00:00:00Z`))) return false
  return dia >= sumarDias(hoy, -3) && dia <= sumarDias(hoy, 1)
}

/** Lo ya pagado según varias fuentes (la asignación y el mismo texto leído antes): lo mayor de cada una. */
export function combinarEstados(...estados: (Partial<EstadoPremios> | null | undefined)[]): EstadoPremios {
  const r = { ...ESTADO_INICIAL }
  for (const e of estados) {
    if (!e) continue
    r.pagadoHasta = Math.max(r.pagadoHasta, e.pagadoHasta ?? 0)
    r.hitosHasta = Math.max(r.hitosHasta, e.hitosHasta ?? 0)
    if (e.relecturaDia && (!r.relecturaDia || e.relecturaDia > r.relecturaDia)) r.relecturaDia = e.relecturaDia
  }
  return r
}

/**
 * Monedas de una solicitud, con las reglas vigentes. Nunca paga dos veces lo
 * mismo: las frases ya pagadas (hasta `previo.pagadoHasta`) y los hitos ya
 * pagados no cuentan, y la relectura es una por día.
 *
 * @param vista las unidades del texto en `nivel` (se calculan si no se dan).
 * @param hoy fecha (AAAA-MM-DD) de quien calcula, para validar la relectura.
 */
export function calcularPremio(
  texto: TextoParaPremio,
  nivel: NivelLectura,
  previo: EstadoPremios,
  solicitud: SolicitudPremio,
  opciones: { hoy: string; reglas?: ReglasMonedas; ritmo?: RitmoPlausible; vista?: VistaPorNivel },
): CalculoPremio {
  const reglas = opciones.reglas ?? REGLAS_MONEDAS
  const ritmo = opciones.ritmo ?? RITMO_PLAUSIBLE
  const vista = opciones.vista ?? vistaPorNivel(texto, nivel)
  const totalFrases = texto.frases.length
  const total = vista.unidades.length
  const nada = (motivo: MotivoPremio, estado = previo): CalculoPremio => ({ monedas: 0, estado, motivo, costoSegundos: 0, unidades: 0, hitos: [] })

  if (solicitud.tipo === 'relectura') {
    if (!diaValido(solicitud.dia, opciones.hoy)) return nada('dia_invalido')
    if (previo.pagadoHasta < totalFrases) return nada('no_terminado')
    if (previo.relecturaDia && solicitud.dia <= previo.relecturaDia) return nada('relectura_repetida')
    const monedas = reglas.relectura[nivel]
    return {
      monedas,
      estado: { ...previo, relecturaDia: solicitud.dia },
      motivo: 'relectura',
      // Releer es leer el libro entero otra vez.
      costoSegundos: vista.unidades.reduce((s, u) => s + segundosDe(u, ritmo), 0),
      unidades: 0,
      hitos: [],
    }
  }

  const hasta = Math.max(0, Math.min(Math.floor(solicitud.hasta), totalFrases))
  if (hasta <= previo.pagadoHasta) return nada('ya_pagado')

  // Las unidades que terminan después de lo ya pagado y no más allá de `hasta`.
  // Paga solo la última (la que se acaba de leer), como en la app: si el
  // avance se salta unidades es porque esas se leyeron sin buen ritmo y quedan
  // dadas por leídas sin moneda. Pero el tiempo mínimo cuenta todas.
  let costoSegundos = 0
  let ultima = -1
  for (let i = 0; i < total; i++) {
    const fin = fraseDeUnidad(vista, i + 1, totalFrases)
    if (fin <= previo.pagadoHasta) continue
    if (fin > hasta) break
    // Una unidad vacía (solo una raya) se salta sola en la app: no paga ni cuenta.
    if (contarPalabras(vista.unidades[i]) === 0) continue
    costoSegundos += segundosDe(vista.unidades[i], ritmo)
    ultima = i
  }
  let monedas = ultima >= 0 && solicitud.conPremio ? monedasDeUnidad(nivel, ultima + 1, total, reglas) : 0
  const unidades = monedas > 0 ? 1 : 0
  const hitos = hitosNuevos(nivel, previo.hitosHasta, porcentajeLeido(hasta, totalFrases), reglas)
  monedas += hitos.reduce((s, h) => s + h.monedas, 0)
  return {
    monedas,
    estado: { ...previo, pagadoHasta: hasta, hitosHasta: hitos.length ? hitos[hitos.length - 1].porcentaje : previo.hitosHasta },
    motivo: monedas > 0 ? 'avance' : 'ya_pagado',
    costoSegundos,
    unidades,
    hitos,
  }
}

/**
 * ¿Pudo leerse esto en el tiempo que pasó? Cada niño tiene un «reloj» de
 * lectura: cada premio lo adelanta en lo mínimo que toma leer lo premiado.
 * Si el reloj se adelanta más allá de ahora (más la tolerancia), es más rápido
 * de lo posible: se pide esperar. Lo no usado se acumula hasta `ventanaSegundos`
 * (una lectura sin conexión se paga de golpe al volver la conexión).
 *
 * @param reloj milisegundos (epoch) del reloj guardado, o null si nunca se premió.
 */
export function revisarRitmo(
  reloj: number | null,
  ahora: number,
  costoSegundos: number,
  ritmo: RitmoPlausible = RITMO_PLAUSIBLE,
): { ok: true; reloj: number } | { ok: false; esperarSegundos: number } {
  const base = Math.max(reloj ?? -Infinity, ahora - ritmo.ventanaSegundos * 1000)
  const nuevo = base + costoSegundos * 1000
  const exceso = nuevo - (ahora + ritmo.toleranciaSegundos * 1000)
  if (exceso > 0) return { ok: false, esperarSegundos: Math.ceil(exceso / 1000) }
  return { ok: true, reloj: nuevo }
}

/**
 * El texto sin lo que no cambia lo que se lee (mayúsculas, tildes, signos,
 * espacios): borrar un texto y volver a subirlo igual (o con otra puntuación)
 * no vuelve a pagar. Su huella (sha256) la calcula el servidor.
 */
export function normalizarParaHuella(frases: string[]): string {
  return frases
    .join(' ')
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}
