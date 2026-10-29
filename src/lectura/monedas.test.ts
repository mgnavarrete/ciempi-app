import { describe, expect, it } from 'vitest'
import { contarPalabras, monedasDeUnidad, hitosNuevos, hoy, porcentajeLeido, premioRelectura } from './monedas'

describe('contarPalabras', () => {
  it('cuenta palabras con letras o números, no signos sueltos', () => {
    expect(contarPalabras('Yo hice una promesa')).toBe(4)
    expect(contarPalabras('—¿Dónde estás? —le dije—.')).toBe(4)
    expect(contarPalabras('Enero 4')).toBe(2)
    expect(contarPalabras('Y entonces — …')).toBe(2)
  })
})

describe('hitos', () => {
  it('niveles 0 y 1: una moneda por frase, hasta 10 por cuento (repartidas parejo)', () => {
    const del = (nivel: 0 | 1 | 3, total: number) => Array.from({ length: total }, (_, i) => monedasDeUnidad(nivel, i + 1, total))
    expect(del(0, 7)).toEqual([1, 1, 1, 1, 1, 1, 1])
    expect(del(1, 10).reduce((a, b) => a + b)).toBe(10)
    // 15 frases: 10 monedas, más o menos una cada frase y media, y la última frase siempre paga.
    const quince = del(1, 15)
    expect(quince.reduce((a, b) => a + b)).toBe(10)
    expect(Math.max(...quince)).toBe(1)
    expect(quince.at(-1)).toBe(1)
    expect(del(1, 40).reduce((a, b) => a + b)).toBe(10)
  })

  it('nivel 3: hasta 4 por párrafo y 15 por libro', () => {
    const del = (total: number) => Array.from({ length: total }, (_, i) => monedasDeUnidad(3, i + 1, total))
    expect(del(3)).toEqual([4, 4, 4])
    expect(del(4).reduce((a, b) => a + b)).toBe(15)
    expect(del(10).reduce((a, b) => a + b)).toBe(15)
    expect(del(30).reduce((a, b) => a + b)).toBe(15)
  })

  it('sin premio extra al terminar en 0, 1 y 3 (el tope ya es el total)', () => {
    expect(hitosNuevos(0, 0, 100)).toEqual([])
    expect(hitosNuevos(1, 0, 100)).toEqual([])
    expect(hitosNuevos(3, 0, 100)).toEqual([])
    expect(hitosNuevos(2, 0, 100)).toEqual([{ porcentaje: 100, monedas: 5 }])
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
