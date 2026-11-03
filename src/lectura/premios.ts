import type { NivelLectura, Texto } from '../dominio/tipos.ts'
import { fraseDeUnidad, vistaPorNivel, type VistaPorNivel } from '../lenguaje/unidades.ts'
import {
  REGLAS_MONEDAS,
  REGLAS_MONEDAS_E2,
  RITMO_PLAUSIBLE,
  contarPalabras,
  contarSilabas,
  hitosNuevos,
  monedasDeUnidad,
  porcentajeLeido,
  segundosEsperados,
  type Hito,
  type ReglasEsfuerzo,
  type ReglasMonedas,
  type RitmoPlausible,
} from './monedas.ts'
import { separarSilabas } from '../lenguaje/silabas.ts'

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
  /** Último día (AAAA-MM-DD) en que se pagó una relectura (en E2: una relectura con mejora). */
  relecturaDia: string | null
  // ── Solo E2 (opcionales: con 2.4.1 no se usan ni cambian) ──
  /** Fracción de moneda acumulada en el libro (se paga al juntar una entera). */
  fraccion?: number
  /** Ya se pagó (o ya se decidió) el premio por terminarlo la primera vez. En textos propios, por huella. */
  libroPremiado?: boolean
  /** Segundos pagados en la primera lectura (para exigir ≥ 50 % de lo esperado al terminar). */
  activoLibroSegundos?: number
  /** Menos tropiezos en una lectura completa (para «relectura con mejora»). */
  mejorTropiezos?: number | null
}

export const ESTADO_INICIAL: EstadoPremios = { pagadoHasta: 0, hitosHasta: 0, relecturaDia: null }

export type SolicitudPremio =
  /**
   * Leyó de corrido hasta la frase `hasta`; `conPremio` falso: la última frase fue muy rápida (avanza, pero esa no paga).
   * `segundosActivos` (desde el pedido anterior, sin pausas largas) y `tropiezos` (al terminar el libro) los mide la app:
   * con 2.4.1 no cambian nada; con E2 el servidor los acota (tope por unidad y reloj).
   */
  | { tipo: 'avance'; hasta: number; conPremio: boolean; segundosActivos?: number; tropiezos?: number }
  /** Volvió a leer entero un libro ya terminado; `dia`: su fecha local. En E2, `tropiezos` decide la «relectura con mejora». */
  | { tipo: 'relectura'; dia: string; tropiezos?: number }
  /** Releyó la unidad que termina en la frase `hasta` (ya pagada antes). Con 2.4.1 no paga; con E2 paga por tiempo a la tasa de relectura. */
  | { tipo: 'releida'; hasta: number; conPremio: boolean; segundosActivos?: number }

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
  /** Releyó una unidad (con 2.4.1 no paga, pero cuenta como lectura para los logros). */
  | 'releida'
  /** Una relectura de algo que todavía no se leía (o no se pagó): primero va el avance. */
  | 'no_leida'
  /** `hasta` no es el final de ninguna unidad del libro (E2). */
  | 'unidad_inexistente'
  /** Relectura completa sin menos tropiezos que la mejor (E2). */
  | 'sin_mejora'
  /** Relectura completa con menos tropiezos que la mejor (E2). */
  | 'mejora'
  /** «Releí el libro entero», pero el servidor no registró esa relectura (E2). */
  | 'sin_relectura'

export interface CalculoPremio {
  monedas: number
  estado: EstadoPremios
  motivo: MotivoPremio
  /** Segundos que, como mínimo, toma leer lo que se paga (ver `revisarRitmo`). */
  costoSegundos: number
  /** Frases (u oraciones, párrafos) que pagaron (0 o 1). */
  unidades: number
  hitos: Hito[]
  /**
   * Segundos de lectura que cuentan como actividad (para los logros, en los dos
   * modelos): los activos que manda la app, hasta 2× lo esperado de lo leído.
   * El servidor además los acota con su reloj.
   */
  segundosActividad: number
  /** E2: segundos que se pagaron (adelantan el reloj del servidor). 0 con 2.4.1. */
  segundosPagados: number
  /** Las unidades leídas por primera vez en este pedido (para las sílabas o palabras nuevas). */
  unidadesNuevas: string[]
  /** Este pedido terminó el libro por primera vez. */
  terminoLibro: boolean
  /** E2: lo que vino de cada fuente (para el registro). */
  desglose?: { tiempo: number; libro: number; mejora: number }
}

/** Constantes de la actividad para los logros: las del modelo E2 (también con la economía 2.4.1). */
const ACTIVIDAD: ReglasEsfuerzo = REGLAS_MONEDAS_E2.esfuerzo

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
  const r: EstadoPremios = { ...ESTADO_INICIAL }
  for (const e of estados) {
    if (!e) continue
    r.pagadoHasta = Math.max(r.pagadoHasta, e.pagadoHasta ?? 0)
    r.hitosHasta = Math.max(r.hitosHasta, e.hitosHasta ?? 0)
    if (e.relecturaDia && (!r.relecturaDia || e.relecturaDia > r.relecturaDia)) r.relecturaDia = e.relecturaDia
    // E2: solo si alguna fuente lo trae (con 2.4.1 el estado queda igual que antes).
    if (e.fraccion !== undefined) r.fraccion = Math.max(r.fraccion ?? 0, e.fraccion)
    if (e.libroPremiado !== undefined) r.libroPremiado = !!(r.libroPremiado || e.libroPremiado)
    if (e.activoLibroSegundos !== undefined) r.activoLibroSegundos = Math.max(r.activoLibroSegundos ?? 0, e.activoLibroSegundos)
    if (e.mejorTropiezos != null) r.mejorTropiezos = r.mejorTropiezos == null ? e.mejorTropiezos : Math.min(r.mejorTropiezos, e.mejorTropiezos)
  }
  return r
}

/** Un número de la app: finito y no negativo, o `undefined`. */
const medida = (v: unknown, max = 86_400): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(v, max) : undefined

/** Las unidades de la vista que terminan después de `desde` y hasta `hasta` (con palabras). */
function unidadesEntre(vista: VistaPorNivel, totalFrases: number, desde: number, hasta: number): { i: number; fin: number; texto: string }[] {
  const r: { i: number; fin: number; texto: string }[] = []
  for (let i = 0; i < vista.unidades.length; i++) {
    const fin = fraseDeUnidad(vista, i + 1, totalFrases)
    if (fin <= desde) continue
    if (fin > hasta) break
    if (contarPalabras(vista.unidades[i]) === 0) continue
    r.push({ i, fin, texto: vista.unidades[i] })
  }
  return r
}

/** ¿`hasta` es el final de alguna unidad? (E2 no acepta avances a mitad de unidad ni más allá del libro.) */
function esFinDeUnidad(vista: VistaPorNivel, totalFrases: number, hasta: number): boolean {
  if (hasta === 0) return true
  for (let i = 0; i < vista.unidades.length; i++) if (fraseDeUnidad(vista, i + 1, totalFrases) === hasta) return true
  return false
}

/** Segundos esperados de varias unidades en el nivel de referencia. */
const esperadoDe = (unidades: string[], nivelRef: NivelLectura, e: ReglasEsfuerzo) =>
  unidades.reduce((s, u) => s + segundosEsperados(nivelRef, contarSilabas(u), e), 0)

/**
 * Los segundos activos que cuentan: los medidos, hasta `topeSobreEsperado` ×
 * lo esperado. Si la app no los manda (una app anterior o manipulada), se
 * cuenta solo lo mínimo para pasar el dedo (`minimo`, la plausibilidad: 0,1 s
 * por palabra y 0,5 s por unidad), nunca lo esperado: pagar lo esperado sin
 * medirlo es el modelo D (hasta 45/min con arrastre; ECONOMIA-V3 §18.5).
 */
const segundosQueCuentan = (activos: number | undefined, esperado: number, e: ReglasEsfuerzo, minimo: number) =>
  Math.min(e.topeSobreEsperado * esperado, activos ?? minimo)

/** Lo mínimo plausible de varias unidades (lo que cuenta si la app no mide el tiempo). */
const minimoDe = (unidades: string[], ritmo: RitmoPlausible) => unidades.reduce((s, u) => s + segundosDe(u, ritmo), 0)

/**
 * Tropiezos de una lectura completa: como mucho uno por unidad del libro. Con
 * más (una app manipulada) se podría crear una reserva sin fin de «relecturas
 * con mejora» (+2 por cuento y día bajando de a uno; ECONOMIA-V3 §18.5).
 */
const tropiezosDe = (v: unknown, unidades: number): number | undefined => {
  const t = medida(v, 10_000)
  return t === undefined ? undefined : Math.min(Math.floor(t), unidades)
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
  opciones: OpcionesPremio,
): CalculoPremio {
  const reglas = opciones.reglas ?? REGLAS_MONEDAS
  if (reglas.esfuerzo) return calcularPremioE2(texto, nivel, previo, solicitud, { ...opciones, reglas }, reglas.esfuerzo)
  const ritmo = opciones.ritmo ?? RITMO_PLAUSIBLE
  const vista = opciones.vista ?? vistaPorNivel(texto, nivel)
  const totalFrases = texto.frases.length
  const total = vista.unidades.length
  const nivelRef = opciones.nivelReferencia ?? nivel
  const nada = (motivo: MotivoPremio, estado = previo): CalculoPremio => ({
    monedas: 0, estado, motivo, costoSegundos: 0, unidades: 0, hitos: [], segundosActividad: 0, segundosPagados: 0, unidadesNuevas: [], terminoLibro: false,
  })

  // Releer una unidad: con 2.4.1 no paga (la relectura se premia al terminar el libro), pero es lectura (logros).
  if (solicitud.tipo === 'releida') {
    const hasta = Math.floor(solicitud.hasta)
    if (!(hasta > 0 && hasta <= totalFrases) || !esFinDeUnidad(vista, totalFrases, hasta)) return nada('unidad_inexistente')
    if (hasta > previo.pagadoHasta) return nada('no_leida')
    const u = unidadesEntre(vista, totalFrases, 0, hasta).at(-1)
    const actividad = u && solicitud.conPremio ? segundosQueCuentan(medida(solicitud.segundosActivos), esperadoDe([u.texto], nivelRef, ACTIVIDAD), ACTIVIDAD, minimoDe([u.texto], opciones.ritmo ?? RITMO_PLAUSIBLE)) : 0
    return { ...nada('releida'), segundosActividad: actividad }
  }

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
      segundosActividad: 0,
      segundosPagados: 0,
      unidadesNuevas: [],
      terminoLibro: false,
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
  // Lo que no cambia las monedas de 2.4.1: actividad para los logros.
  const nuevas = unidadesEntre(vista, totalFrases, previo.pagadoHasta, hasta).map((u) => u.texto)
  const actividad = solicitud.conPremio && nuevas.length ? segundosQueCuentan(medida(solicitud.segundosActivos), esperadoDe(nuevas, nivelRef, ACTIVIDAD), ACTIVIDAD, minimoDe(nuevas, ritmo)) : 0
  return {
    monedas,
    estado: { ...previo, pagadoHasta: hasta, hitosHasta: hitos.length ? hitos[hitos.length - 1].porcentaje : previo.hitosHasta },
    motivo: monedas > 0 ? 'avance' : 'ya_pagado',
    costoSegundos,
    unidades,
    hitos,
    segundosActividad: actividad,
    segundosPagados: 0,
    unidadesNuevas: nuevas,
    terminoLibro: previo.pagadoHasta < totalFrases && hasta >= totalFrases,
  }
}

export interface OpcionesPremio {
  /** Fecha (AAAA-MM-DD) de quien calcula, para validar la relectura. */
  hoy: string
  reglas?: ReglasMonedas
  ritmo?: RitmoPlausible
  /** Las unidades del texto en el nivel asignado (se calculan si no se dan). */
  vista?: VistaPorNivel
  /** Dificultad real: el nivel con que se calcula lo esperado (ver nivelDeReferencia). Por defecto, el asignado. */
  nivelReferencia?: NivelLectura
  /** E2: segundos de relectura (unidades releídas) pagados hace poco en este libro, para la relectura con mejora. */
  segundosReleidosRecientes?: number
  /**
   * E2: lo más que el reloj del servidor deja pagar en este pedido (ver
   * revisarRelojE2). Solo se usa con un pedido más grande que toda la ventana:
   * un pedido normal que no cabe recibe 429 y se paga después, entero.
   */
  maxSegundosPagables?: number
}

/**
 * Modelo E2 (experimental). Cada unidad completada paga
 * `tasa × min(activos, 2 × esperado)` por minuto (la fracción se acumula en el
 * libro); terminar por primera vez paga en proporción a lo largo que es; releer
 * paga a la tasa de relectura; releer entero con menos tropiezos, +2 una vez al
 * día. Lo que depende de la base (sílabas o palabras nuevas, nivel completo, el
 * reloj) lo agrega el servidor.
 */
function calcularPremioE2(
  texto: TextoParaPremio,
  nivel: NivelLectura,
  previo: EstadoPremios,
  solicitud: SolicitudPremio,
  opciones: OpcionesPremio & { reglas: ReglasMonedas },
  e: ReglasEsfuerzo,
): CalculoPremio {
  const ritmo = opciones.ritmo ?? RITMO_PLAUSIBLE
  const vista = opciones.vista ?? vistaPorNivel(texto, nivel)
  const totalFrases = texto.frases.length
  const nivelRef = e.dificultadReal ? (opciones.nivelReferencia ?? nivel) : nivel
  const nada = (motivo: MotivoPremio, extra: Partial<CalculoPremio> = {}): CalculoPremio => ({
    monedas: 0, estado: previo, motivo, costoSegundos: 0, unidades: 0, hitos: [], segundosActividad: 0, segundosPagados: 0, unidadesNuevas: [], terminoLibro: false, ...extra,
  })
  // Lo mide la app (sin pausas largas); el servidor no lo cree: lo acota a 2× lo esperado y con su reloj.
  const activos = solicitud.tipo === 'relectura' ? undefined : medida(solicitud.segundosActivos)
  /** Suma minutos pagados a la fracción del libro: devuelve las monedas enteras y la fracción que queda. */
  const acumular = (segundos: number, tasa: number) => {
    const acarreo = (previo.fraccion ?? 0) + (tasa * segundos) / 60
    const monedas = Math.floor(acarreo + 1e-9)
    return { monedas, fraccion: Math.max(0, acarreo - monedas) }
  }
  const esperadoLibro = () => esperadoDe(vista.unidades.filter((u) => contarPalabras(u) > 0), nivelRef, e)
  const unidadesConPalabras = vista.unidades.filter((u) => contarPalabras(u) > 0).length
  /** Los segundos pagables: los activos (o lo esperado), hasta 2× lo esperado y hasta lo que deja el reloj del servidor. */
  const pagablesDe = (textos: string[]) =>
    Math.max(0, Math.min(opciones.maxSegundosPagables ?? Infinity, segundosQueCuentan(activos, esperadoDe(textos, nivelRef, e), e, minimoDe(textos, ritmo))))

  if (solicitud.tipo === 'relectura') {
    if (!diaValido(solicitud.dia, opciones.hoy)) return nada('dia_invalido')
    if (previo.pagadoHasta < totalFrases) return nada('no_terminado')
    if (previo.relecturaDia && solicitud.dia <= previo.relecturaDia) return nada('relectura_repetida')
    const t = tropiezosDe(solicitud.tropiezos, unidadesConPalabras)
    if (t === undefined) return nada('sin_mejora')
    // Como el premio de terminar: solo libros de al menos 1 min esperado.
    if (esperadoLibro() / 60 < e.libroTerminado.minutosEsperadosMinimos) return nada('sin_mejora')
    // Tiene que haberse releído de verdad (unidades releídas pagadas en estas horas), no solo decirlo.
    if ((opciones.segundosReleidosRecientes ?? 0) < e.libroTerminado.fraccionActivaMinima * esperadoLibro()) return nada('sin_relectura')
    if (previo.mejorTropiezos == null || t >= previo.mejorTropiezos) {
      return nada('sin_mejora', { estado: { ...previo, mejorTropiezos: previo.mejorTropiezos == null ? t : previo.mejorTropiezos } })
    }
    const monedas = e.relecturaConMejora.monedas
    return nada('mejora', { monedas, estado: { ...previo, mejorTropiezos: t, relecturaDia: solicitud.dia }, desglose: { tiempo: 0, libro: 0, mejora: monedas } })
  }

  const hasta = Math.floor(solicitud.hasta)
  // Las unidades deben existir: nada más allá del libro ni a mitad de una unidad.
  if (!(hasta >= 0 && hasta <= totalFrases) || !esFinDeUnidad(vista, totalFrases, hasta)) return nada('unidad_inexistente')

  if (solicitud.tipo === 'releida') {
    if (hasta === 0) return nada('unidad_inexistente')
    if (hasta > previo.pagadoHasta) return nada('no_leida')
    const u = unidadesEntre(vista, totalFrases, 0, hasta).at(-1)
    if (!u || !solicitud.conPremio) return nada('releida', { costoSegundos: 0 })
    const pagados = pagablesDe([u.texto])
    const { monedas, fraccion } = acumular(pagados, e.tasaPorMinuto.relectura[nivel])
    return {
      ...nada('releida'),
      monedas,
      estado: { ...previo, fraccion },
      costoSegundos: Math.max(segundosDe(u.texto, ritmo), pagados),
      segundosActividad: pagados,
      segundosPagados: pagados,
      desglose: { tiempo: monedas, libro: 0, mejora: 0 },
    }
  }

  if (hasta <= previo.pagadoHasta) return nada('ya_pagado')
  const nuevas = unidadesEntre(vista, totalFrases, previo.pagadoHasta, hasta)
  const textos = nuevas.map((u) => u.texto)
  const plausible = textos.reduce((s, u) => s + segundosDe(u, ritmo), 0)
  // La frase «muy rápida» (conPremio falso) no paga; el tropiezo ya no quita la moneda.
  const pagados = solicitud.conPremio && nuevas.length ? pagablesDe(textos) : 0
  const tiempo = acumular(pagados, e.tasaPorMinuto.primeraLectura)
  const activoLibro = (previo.activoLibroSegundos ?? 0) + pagados
  const estado: EstadoPremios = { ...previo, pagadoHasta: hasta, fraccion: tiempo.fraccion, activoLibroSegundos: activoLibro }
  const terminoLibro = previo.pagadoHasta < totalFrases && hasta >= totalFrases
  let libro = 0
  if (terminoLibro) {
    if (!previo.libroPremiado) {
      const minutos = esperadoLibro() / 60
      const lt = e.libroTerminado
      if (minutos >= lt.minutosEsperadosMinimos && activoLibro / 60 >= lt.fraccionActivaMinima * minutos) libro = Math.min(lt.maximo, Math.floor(minutos * lt.porMinuto))
      // Una sola vez: aunque no alcance (texto corto, arrastrado), ya no se vuelve a evaluar.
      estado.libroPremiado = true
    }
    const t = tropiezosDe(solicitud.tropiezos, unidadesConPalabras)
    if (t !== undefined) estado.mejorTropiezos = previo.mejorTropiezos == null ? t : Math.min(previo.mejorTropiezos, t)
  }
  const monedas = tiempo.monedas + libro
  return {
    monedas,
    estado,
    // Avanzó aunque no junte todavía una moneda entera (la fracción queda en el libro).
    motivo: 'avance',
    costoSegundos: Math.max(plausible, pagados),
    unidades: tiempo.monedas > 0 ? 1 : 0,
    hitos: [],
    segundosActividad: pagados,
    segundosPagados: pagados,
    unidadesNuevas: textos,
    terminoLibro,
    desglose: { tiempo: tiempo.monedas, libro, mejora: 0 },
  }
}

/**
 * Sílabas (nivel 0) o palabras (nivel 1) de unas unidades, normalizadas (sin
 * mayúsculas, tildes ni signos): las que el niño ve por primera vez dan monedas en E2.
 */
export function piezasDe(unidades: string[], cuenta: 'silabas' | 'palabras'): string[] {
  const limpiar = (x: string) => x.normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
  const r = new Set<string>()
  for (const u of unidades) {
    for (const palabra of u.split(/\s+/)) {
      if (!/[\p{L}\p{N}]/u.test(palabra)) continue
      const piezas = cuenta === 'silabas' ? separarSilabas(palabra) : [palabra]
      for (const p of piezas) {
        const l = limpiar(p)
        if (l && l.length <= 60) r.add(l)
      }
    }
  }
  return [...r]
}

/** Monedas por piezas nuevas: cada `cada` piezas distintas vistas, `monedas`. */
export const monedasPorNuevas = (antes: number, despues: number, regla: { cada: number; monedas: number }) =>
  (Math.floor(despues / regla.cada) - Math.floor(antes / regla.cada)) * regla.monedas

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
 * El reloj del servidor con E2: los segundos pagados (no solo el mínimo para
 * pasar el dedo) adelantan el reloj del niño. Así no se cobra más tiempo del
 * que pasó de verdad: lo acumulado sin pedir premios vale como mucho una hora
 * (`ventanaSegundos`: una lectura sin conexión se paga de golpe al volver),
 * y después, al ritmo del reloj. No hay tope diario ni media tasa: solo el
 * tiempo real. No demuestra que hubo lectura (no hay audio).
 *
 * - Cabe: se paga entero.
 * - No cabe y es un pedido normal (≤ la ventana): 429, se paga entero después.
 * - Un solo pedido más grande que toda la ventana (ningún lector lo manda: la
 *   app pide por unidad): espera a tener la ventana entera y paga solo lo que
 *   cabe en ella; el resto se pierde.
 */
export function revisarRelojE2(
  reloj: number | null,
  ahora: number,
  plausibleSegundos: number,
  pagadosSegundos: number,
  ritmo: RitmoPlausible = RITMO_PLAUSIBLE,
): { ok: true; reloj: number; pagables: number } | { ok: false; esperarSegundos: number } {
  const base = Math.max(reloj ?? -Infinity, ahora - ritmo.ventanaSegundos * 1000)
  const cabe = (ahora + ritmo.toleranciaSegundos * 1000 - base) / 1000
  const costo = Math.max(plausibleSegundos, pagadosSegundos)
  if (costo <= cabe) return { ok: true, reloj: base + costo * 1000, pagables: pagadosSegundos }
  if (costo <= ritmo.ventanaSegundos) return { ok: false, esperarSegundos: Math.max(1, Math.ceil(costo - cabe)) }
  if (cabe < ritmo.ventanaSegundos) return { ok: false, esperarSegundos: Math.max(1, Math.ceil(ritmo.ventanaSegundos - cabe)) }
  return { ok: true, reloj: base + cabe * 1000, pagables: Math.min(pagadosSegundos, cabe) }
}

/**
 * Reloj de actividad (para los logros): acredita los segundos de lectura que
 * caben en el tiempo real, con la misma ventana de una hora. A diferencia de
 * `revisarRitmo` no rechaza: lo que no cabe simplemente no se acredita (no
 * hay monedas en juego, y un lector real nunca lee más que el tiempo que pasa).
 */
export function acreditarActividad(
  reloj: number | null,
  ahora: number,
  segundos: number,
  ritmo: RitmoPlausible = RITMO_PLAUSIBLE,
): { acreditados: number; reloj: number | null } {
  if (!(segundos > 0)) return { acreditados: 0, reloj }
  const base = Math.max(reloj ?? -Infinity, ahora - ritmo.ventanaSegundos * 1000)
  const cabe = Math.max(0, (ahora + ritmo.toleranciaSegundos * 1000 - base) / 1000)
  const acreditados = Math.min(segundos, cabe)
  return { acreditados, reloj: base + acreditados * 1000 }
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
