import { describe, expect, it } from 'vitest'
import { VELOCIDAD_MAXIMA, VELOCIDAD_MINIMA, acomodarVoz, encolarOracion, velocidadPara } from './vozAlDedo'

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

  it('si el dedo se adelanta, la voz sigue desde donde iba (sin saltarse palabras) y más rápido', () => {
    const v = acomodarVoz(null, 0, null, 0)!
    const adelante = acomodarVoz(v, 6, 5, 1000)!
    // Al segundo, la voz iba por la palabra 2: sigue desde ahí, no desde la 6.
    expect(adelante.desde).toBe(2)
    expect(adelante.velocidad).toBeGreaterThan(velocidadPara(5) - 0.01)
  })

  it('si el dedo se atrasa, la voz va más lenta para esperarlo', () => {
    const v = acomodarVoz(null, 0, null, 0)!
    const atras = acomodarVoz(v, 1, 0.8, 2000)!
    expect(atras.velocidad).toBeLessThan(1)
  })

  it('si el dedo se detuvo, la voz sigue desde donde se calló', () => {
    expect(acomodarVoz(null, 7, 2.5, 0, 4)?.desde).toBe(4)
    expect(acomodarVoz(null, 7, 2.5, 0, 4)!.velocidad).toBeGreaterThan(1)
  })
})

describe('nivel 4: oración por oración', () => {
  it('la primera va al ritmo del dedo y queda en fila', () => {
    const r = encolarOracion([], 10, 2.5, 0)
    expect(r.velocidad).toBe(1)
    expect(r.terminan).toEqual([4000])
  })

  it('las oraciones ya dichas no cuentan como atraso', () => {
    expect(encolarOracion([1000, 2000], 5, 2.5, 3000).velocidad).toBe(1)
  })

  it('con dos oraciones esperando, la voz acelera (y no se salta ninguna)', () => {
    const r = encolarOracion([4000, 8000], 10, 2.5, 1000)
    expect(r.velocidad).toBeGreaterThan(1)
    expect(r.terminan).toHaveLength(3)
    expect(r.terminan[2]).toBeGreaterThan(8000)
  })
})
