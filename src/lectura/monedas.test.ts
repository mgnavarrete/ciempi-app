import { describe, expect, it } from 'vitest'
import { acumularPalabras, contarPalabras } from './monedas'

describe('contarPalabras', () => {
  it('cuenta palabras con letras o números, no signos sueltos', () => {
    expect(contarPalabras('Yo hice una promesa')).toBe(4)
    expect(contarPalabras('—¿Dónde estás? —le dije—.')).toBe(4)
    expect(contarPalabras('Enero 4')).toBe(2)
    expect(contarPalabras('Y entonces — …')).toBe(2)
  })
})

describe('acumularPalabras', () => {
  it('no da moneda antes de llegar a 20', () => {
    expect(acumularPalabras(10, 6)).toEqual({ monedas: 0, resto: 16 })
  })

  it('da una moneda al pasar 20 y lo que sobra queda para la siguiente', () => {
    expect(acumularPalabras(16, 6)).toEqual({ monedas: 1, resto: 2 })
  })

  it('puede dar más de una si la frase es larga o el umbral es bajo', () => {
    expect(acumularPalabras(18, 5, 3)).toEqual({ monedas: 7, resto: 2 })
  })
})
