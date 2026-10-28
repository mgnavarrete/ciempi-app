import { describe, expect, it } from 'vitest'
import { VELOCIDAD_MAXIMA, VELOCIDAD_MINIMA, encolarTrozo, trozoEn, velocidadPara } from './vozAlDedo'

describe('voz al ritmo del dedo', () => {
  it('lento si el dedo va lento; nunca más rápido que lo normal (1×)', () => {
    expect(velocidadPara(2.5)).toBe(1)
    expect(velocidadPara(3.5)).toBe(1)
    expect(velocidadPara(1.5)).toBeLessThan(1)
    expect(velocidadPara(20)).toBe(VELOCIDAD_MAXIMA)
    expect(VELOCIDAD_MAXIMA).toBe(1)
    expect(velocidadPara(0.1)).toBe(VELOCIDAD_MINIMA)
    expect(velocidadPara(null)).toBe(1)
  })

  it('el primer trozo va al ritmo del dedo y queda en fila', () => {
    const r = encolarTrozo([], 10, 2.5, 0)
    expect(r.velocidad).toBe(1)
    expect(r.terminan).toEqual([4000])
  })

  it('lo ya dicho no cuenta como atraso', () => {
    expect(encolarTrozo([1000, 2000], 5, 2.5, 3000).velocidad).toBe(1)
  })

  it('con trozos esperando, la voz no pasa de 1× y no se salta ninguno', () => {
    const r = encolarTrozo([4000, 8000, 12000], 10, 10, 1000)
    expect(r.velocidad).toBe(VELOCIDAD_MAXIMA)
    expect(r.terminan).toHaveLength(4)
    expect(r.terminan[3]).toBeGreaterThan(12000)
  })

  it('el trozo donde está el dedo', () => {
    const inicios = [0, 0.3, 0.6]
    expect(trozoEn(inicios, 0)).toBe(0)
    expect(trozoEn(inicios, 0.29)).toBe(0)
    expect(trozoEn(inicios, 0.3)).toBe(1)
    expect(trozoEn(inicios, 0.95)).toBe(2)
  })
})
