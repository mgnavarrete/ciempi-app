import { describe, expect, it } from 'vitest'
import { VELOCIDAD_MAXIMA, VELOCIDAD_MINIMA, acomodarVoz, velocidadPara } from './vozAlDedo'

describe('voz al ritmo del dedo', () => {
  it('rápido si el dedo va rápido, lento si va lento', () => {
    expect(velocidadPara(2.5)).toBe(1)
    expect(velocidadPara(4)).toBeGreaterThan(1)
    expect(velocidadPara(1.5)).toBeLessThan(1)
    expect(velocidadPara(20)).toBe(VELOCIDAD_MAXIMA)
    expect(velocidadPara(0.1)).toBe(VELOCIDAD_MINIMA)
    expect(velocidadPara(null)).toBe(1)
  })

  it('empieza al llegar el dedo y no se acomoda mientras van juntos', () => {
    const v = acomodarVoz(null, 0, null, 0)!
    expect(v).toEqual({ desde: 0, t: 0, velocidad: 1 })
    // A 2,5 palabras por segundo, al segundo va por la palabra 2,5: el dedo en la 3 va junto.
    expect(acomodarVoz(v, 3, 2.5, 1000)).toBeNull()
  })

  it('si el dedo se adelanta o se atrasa, la voz vuelve a empezar desde el dedo a otra velocidad', () => {
    const v = acomodarVoz(null, 0, null, 0)!
    const adelante = acomodarVoz(v, 6, 5, 1000)
    expect(adelante?.desde).toBe(6)
    expect(adelante!.velocidad).toBeGreaterThan(1)
    const atras = acomodarVoz(v, 1, 0.8, 2000)
    expect(atras?.desde).toBe(1)
    expect(atras!.velocidad).toBeLessThan(1)
  })
})
