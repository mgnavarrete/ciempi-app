import { describe, expect, it } from 'vitest'
import { HITOS, contarPalabras, hitosNuevos, hoy, porcentajeLeido, premioRelectura } from './monedas'

describe('contarPalabras', () => {
  it('cuenta palabras con letras o números, no signos sueltos', () => {
    expect(contarPalabras('Yo hice una promesa')).toBe(4)
    expect(contarPalabras('—¿Dónde estás? —le dije—.')).toBe(4)
    expect(contarPalabras('Enero 4')).toBe(2)
    expect(contarPalabras('Y entonces — …')).toBe(2)
  })
})

describe('hitos', () => {
  it('niveles 0 y 1: todo al terminar', () => {
    expect(hitosNuevos(0, 0, 99)).toEqual([])
    expect(hitosNuevos(0, 0, 100)).toEqual([{ porcentaje: 100, monedas: 5 }])
    expect(hitosNuevos(1, 0, 100)).toEqual([{ porcentaje: 100, monedas: 10 }])
  })

  it('cada hito paga una sola vez: si vuelve a llegar al 50 %, no se repite', () => {
    expect(hitosNuevos(3, 0, 60).map((h) => h.monedas)).toEqual([5, 5])
    expect(hitosNuevos(3, 50, 60)).toEqual([])
    expect(hitosNuevos(3, 50, 80)).toEqual([{ porcentaje: 75, monedas: 5 }])
  })

  it('los premios de la propuesta: más monedas en los niveles altos', () => {
    const total = (n: 0 | 1 | 2 | 3 | 4) => HITOS[n].reduce((s, h) => s + h.monedas, 0)
    expect([0, 1, 2, 3, 4].map((n) => total(n as 0))).toEqual([5, 10, 15, 25, 40])
  })

  it('releer da menos', () => {
    expect([0, 1, 2, 3, 4].map((n) => premioRelectura(n as 0))).toEqual([1, 2, 2, 2, 3])
  })

  it('porcentaje sin adelantarse', () => {
    expect(porcentajeLeido(9, 10)).toBe(90)
    expect(porcentajeLeido(10, 10)).toBe(100)
    expect(porcentajeLeido(2, 3)).toBe(66)
    expect(hoy(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
