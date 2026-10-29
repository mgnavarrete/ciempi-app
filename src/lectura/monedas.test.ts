import { describe, expect, it } from 'vitest'
import { MONEDAS_POR_UNIDAD, contarPalabras, hitosNuevos, hoy, porcentajeLeido, premioRelectura } from './monedas'

describe('contarPalabras', () => {
  it('cuenta palabras con letras o números, no signos sueltos', () => {
    expect(contarPalabras('Yo hice una promesa')).toBe(4)
    expect(contarPalabras('—¿Dónde estás? —le dije—.')).toBe(4)
    expect(contarPalabras('Enero 4')).toBe(2)
    expect(contarPalabras('Y entonces — …')).toBe(2)
  })
})

describe('hitos', () => {
  it('niveles 0 a 3: monedas por cada frase y un premio al terminar', () => {
    expect([0, 1, 2, 3, 4].map((n) => MONEDAS_POR_UNIDAD[n as 0])).toEqual([1, 1, 1, 2, 0])
    expect(hitosNuevos(0, 0, 99)).toEqual([])
    expect(hitosNuevos(0, 0, 100)).toEqual([{ porcentaje: 100, monedas: 3 }])
    expect(hitosNuevos(3, 0, 80)).toEqual([])
  })

  it('nivel 4: por avance, y cada hito paga una sola vez', () => {
    expect(hitosNuevos(4, 0, 60).map((h) => h.monedas)).toEqual([5, 10])
    expect(hitosNuevos(4, 50, 60)).toEqual([])
    expect(hitosNuevos(4, 50, 80)).toEqual([{ porcentaje: 75, monedas: 10 }])
  })

  it('releer da menos', () => {
    expect([0, 1, 2, 3, 4].map((n) => premioRelectura(n as 0))).toEqual([1, 1, 1, 2, 3])
  })

  it('porcentaje sin adelantarse', () => {
    expect(porcentajeLeido(9, 10)).toBe(90)
    expect(porcentajeLeido(10, 10)).toBe(100)
    expect(porcentajeLeido(2, 3)).toBe(66)
    expect(hoy(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
