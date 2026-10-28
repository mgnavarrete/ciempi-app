import { describe, expect, it } from 'vitest'
import { bordesDeLaVoz } from './silencio'

const FRECUENCIA = 24000

/** Un audio de `total` segundos con un tono entre `desde` y `hasta`. */
function audio(total: number, desde: number, hasta: number) {
  const m = new Float32Array(Math.round(total * FRECUENCIA))
  for (let i = Math.round(desde * FRECUENCIA); i < Math.round(hasta * FRECUENCIA); i++) m[i] = 0.5 * Math.sin(i / 5)
  return m
}

describe('bordesDeLaVoz', () => {
  it('salta el silencio de antes y de después, con un pequeño margen', () => {
    const { inicio, fin } = bordesDeLaVoz(audio(1.9, 0.18, 0.47), FRECUENCIA)
    expect(inicio).toBeGreaterThan(0.12)
    expect(inicio).toBeLessThan(0.18)
    expect(fin).toBeGreaterThan(0.47)
    expect(fin).toBeLessThan(0.6)
  })

  it('un audio sin voz se toca entero', () => {
    expect(bordesDeLaVoz(new Float32Array(FRECUENCIA), FRECUENCIA)).toEqual({ inicio: 0, fin: 1 })
  })

  it('no se sale del audio', () => {
    const { inicio, fin } = bordesDeLaVoz(audio(0.5, 0, 0.5), FRECUENCIA)
    expect(inicio).toBe(0)
    expect(fin).toBe(0.5)
  })
})
