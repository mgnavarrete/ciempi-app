import type { NivelLectura } from '../dominio/tipos.ts'
import { silabearFrase } from './silabas.ts'

/** Lo que hace difícil un texto para un niño que empieza a leer. */
export interface MedidasTexto {
  palabras: number
  /** Promedio de palabras por oración (hasta un punto). */
  palabrasPorOracion: number
  /** Promedio de sílabas por palabra. */
  silabasPorPalabra: number
  /** Proporción de palabras de cuatro sílabas o más. */
  largas: number
}

const terminaOracion = (frase: string) => /[.!?…]["»”’)]*$/.test(frase.trim())

export function medirTexto(frases: string[]): MedidasTexto {
  let palabras = 0
  let silabas = 0
  let largas = 0
  let oraciones = 0
  frases.forEach((f, i) => {
    for (const p of silabearFrase(f)) {
      palabras++
      silabas += p.silabas.length
      if (p.silabas.length >= 4) largas++
    }
    if (terminaOracion(f) || i === frases.length - 1) oraciones++
  })
  return {
    palabras,
    palabrasPorOracion: palabras / Math.max(1, oraciones),
    silabasPorPalabra: silabas / Math.max(1, palabras),
    largas: largas / Math.max(1, palabras),
  }
}

/**
 * Nivel que se sugiere al asignar un libro: oraciones cortas y palabras
 * simples → nivel 1; textos cortos sin párrafos → 2; párrafos, poemas o
 * textos medianos → 3; textos largos con oraciones largas → 4. El adulto
 * siempre puede elegir otro.
 */
export function nivelSugerido(frases: string[], parrafos?: number[]): NivelLectura {
  const { palabras, palabrasPorOracion: oracion, silabasPorPalabra: silabas } = medirTexto(frases)
  const conParrafos = (parrafos?.length ?? 0) > 1
  if (oracion <= 6 && silabas < 2.2) return 1
  if (oracion <= 9 || (palabras <= 150 && !conParrafos)) return 2
  if (palabras <= 250 || (oracion <= 12 && silabas < 1.95)) return 3
  return 4
}
