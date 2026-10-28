/**
 * Motor de la lectura con deslizador. Es lógica pura (sin DOM ni audio):
 * recibe posiciones del dedo (0 = inicio de la pista, 1 = final) y devuelve
 * el nuevo estado más los efectos que la pantalla debe ejecutar
 * (decir una palabra, mostrar el tropiezo, terminar la frase).
 *
 * Todo va por palabras: cada palabra tiene una manzana en la pista, justo
 * debajo de ella. Cuando el dedo (y la cabeza de Ciempi) llega a una
 * manzana, la palabra se enciende y se dice. La frase termina al comer la
 * última manzana, que siempre va al borde derecho: hay que recorrer la pista
 * completa (la pantalla espera a que la voz termine antes de seguir).
 */

/** Para pistas repartidas parejo (sin medir la pantalla): primera manzana. */
export const INICIO_PISTA = 0.14
/** La última manzana: en el borde derecho de la pista (dejando lugar a la cabeza de Ciempi). */
export const FIN_PISTA = 0.96
/** Siempre se puede retomar tocando hasta esto más adelante (el ancho de la cabeza de Ciempi). */
const RETOMAR_MINIMO = 0.04

export interface ConfigMotor {
  umbralPalabrasPorSegundo: number
  /** Cuántas palabras adelante de donde quedó se acepta volver a poner el dedo. */
  toleranciaRetomar: number
  /** Ventana de tiempo sobre la que se mide la velocidad. */
  ventanaMs: number
  /** Tiempo mínimo para calcular la velocidad: evita picos por ruido, y atrapa los "zarpazos". */
  dtMinimoMs: number
  /**
   * Sin «más despacito»: el dedo va a la velocidad que quiera (niveles 2 a 4;
   * ahí el ritmo se revisa al terminar la oración o el párrafo, sin detenerlo).
   */
  sinLimite?: boolean
}

export const CONFIG_MOTOR_BASE: Omit<ConfigMotor, 'umbralPalabrasPorSegundo'> = {
  toleranciaRetomar: 0.6,
  ventanaMs: 700,
  dtMinimoMs: 300,
}

export type Fase = 'esperando' | 'arrastrando' | 'tropiezo' | 'completada'

/** Dónde está la manzana de cada palabra (0..1) y dónde termina la frase. */
export interface Pista {
  manzanas: number[]
  fin: number
}

export interface EstadoMotor {
  fase: Fase
  /** Máximo avance alcanzado (0..1). Nunca retrocede salvo por un tropiezo. */
  progreso: number
  /** Palabras ya encendidas y dichas (siempre las primeras N). */
  palabrasLeidas: number
  tuvoTropiezo: boolean
  muestras: { t: number; p: number }[]
}

export type Entrada =
  | { tipo: 'tocar'; pos: number; t: number }
  | { tipo: 'mover'; pos: number; t: number }
  | { tipo: 'soltar' }
  | { tipo: 'recuperar' }

export type Efecto =
  | { tipo: 'decir'; palabra: number }
  | { tipo: 'tropiezo' }
  | { tipo: 'lejos' }
  | { tipo: 'completada'; aBuenRitmo: boolean }

export function estadoInicial(): EstadoMotor {
  return { fase: 'esperando', progreso: 0, palabrasLeidas: 0, tuvoTropiezo: false, muestras: [] }
}

/**
 * Manzanas repartidas parejo entre `inicio` y FIN_PISTA (cuando no se puede
 * medir la pantalla, o en un párrafo: una manzana por palabra a lo largo de la pista).
 */
export function calcularPista(cantidadPalabras: number, inicio = INICIO_PISTA): Pista {
  if (cantidadPalabras <= 0) return { manzanas: [], fin: FIN_PISTA }
  if (cantidadPalabras === 1) return { manzanas: [FIN_PISTA], fin: FIN_PISTA }
  const paso = (FIN_PISTA - inicio) / (cantidadPalabras - 1)
  return { manzanas: Array.from({ length: cantidadPalabras }, (_, i) => inicio + i * paso), fin: FIN_PISTA }
}

/**
 * Pista a partir de dónde está cada palabra (o sílaba) en pantalla (inicio y
 * fin, 0..1): la manzana va al centro de la palabra, salvo la primera, que va
 * al comienzo (un poco adentro), y la última, que va al borde derecho: ahí
 * termina la frase.
 */
export function pistaDesdePalabras(palabras: { inicio: number; fin: number }[]): Pista {
  if (palabras.length === 0) return { manzanas: [], fin: 1 }
  const manzanas = palabras.map((p, i) => (i === 0 ? p.inicio + Math.min(0.2 * (p.fin - p.inicio), 0.02) : (p.inicio + p.fin) / 2))
  manzanas[manzanas.length - 1] = Math.max(manzanas[manzanas.length - 1], FIN_PISTA)
  return { manzanas, fin: manzanas[manzanas.length - 1] }
}

/** Distancia (en la pista) que equivale a "una palabra": la distancia promedio entre manzanas. */
function largoPalabra(pista: Pista): number {
  const m = pista.manzanas
  // Con una sola palabra no hay distancia entre manzanas: se toma el camino hasta su manzana.
  return m.length > 1 ? (m[m.length - 1] - m[0]) / (m.length - 1) : Math.max(0.1, m[0] ?? 0)
}

function contarEncendidas(pista: Pista, pos: number): number {
  let n = 0
  while (n < pista.manzanas.length && pos >= pista.manzanas[n]) n++
  return n
}

const limitar = (x: number) => Math.min(1, Math.max(0, x))

export function paso(estado: EstadoMotor, entrada: Entrada, pista: Pista, config: ConfigMotor): { estado: EstadoMotor; efectos: Efecto[] } {
  const sinCambio = { estado, efectos: [] as Efecto[] }
  const largo = largoPalabra(pista)

  switch (entrada.tipo) {
    case 'soltar':
      return estado.fase === 'arrastrando' ? { estado: { ...estado, fase: 'esperando' }, efectos: [] } : sinCambio

    case 'recuperar':
      return estado.fase === 'tropiezo' ? { estado: { ...estado, fase: 'esperando' }, efectos: [] } : sinCambio

    case 'tocar': {
      if (estado.fase !== 'esperando') return sinCambio
      const pos = limitar(entrada.pos)
      // Con muchas manzanas juntas (un párrafo) basta con tocar la cabeza de Ciempi.
      if (pos - estado.progreso > Math.max(config.toleranciaRetomar * largo, RETOMAR_MINIMO)) return { estado, efectos: [{ tipo: 'lejos' }] }
      // El punto donde se apoya el dedo es la línea base: ese pequeño adelanto no cuenta como velocidad.
      const base = Math.max(estado.progreso, pos)
      const tocado = { ...estado, fase: 'arrastrando' as const, muestras: [{ t: entrada.t, p: base }] }
      return avanzarHasta(tocado, base, pista)
    }

    case 'mover': {
      if (estado.fase !== 'arrastrando') return sinCambio
      const t = entrada.t
      const candidato = Math.max(estado.progreso, limitar(entrada.pos))
      const muestras = [...estado.muestras, { t, p: candidato }]
      while (muestras.length > 2 && t - muestras[1].t >= config.ventanaMs) muestras.shift()

      if (candidato > estado.progreso && !config.sinLimite) {
        const origen = muestras[0]
        const dt = Math.max(t - origen.t, config.dtMinimoMs) / 1000
        const palabrasPorSegundo = (candidato - origen.p) / largo / dt
        if (palabrasPorSegundo > config.umbralPalabrasPorSegundo) return tropezar(estado, origen.p, pista)
      }
      return avanzarHasta({ ...estado, muestras }, candidato, pista)
    }
  }
}

function avanzarHasta(estado: EstadoMotor, progreso: number, pista: Pista): { estado: EstadoMotor; efectos: Efecto[] } {
  const palabrasLeidas = Math.max(estado.palabrasLeidas, contarEncendidas(pista, progreso))
  const efectos: Efecto[] = []
  for (let p = estado.palabrasLeidas; p < palabrasLeidas; p++) efectos.push({ tipo: 'decir', palabra: p })

  // Termina al comer la última manzana: todas las palabras dichas.
  const total = pista.manzanas.length
  const completa = total > 0 && palabrasLeidas === total && progreso >= pista.fin - 1e-9
  if (completa) efectos.push({ tipo: 'completada', aBuenRitmo: !estado.tuvoTropiezo })

  return {
    estado: { ...estado, progreso, palabrasLeidas, fase: completa ? 'completada' : estado.fase },
    efectos,
  }
}

/** Demasiado rápido: se vuelve a donde empezó el arrebato y se pausa. */
function tropezar(estado: EstadoMotor, volverA: number, pista: Pista) {
  const progreso = Math.min(estado.progreso, volverA)
  return {
    estado: {
      ...estado,
      fase: 'tropiezo' as const,
      progreso,
      palabrasLeidas: contarEncendidas(pista, progreso),
      tuvoTropiezo: true,
      muestras: [],
    },
    efectos: [{ tipo: 'tropiezo' } as Efecto],
  }
}
