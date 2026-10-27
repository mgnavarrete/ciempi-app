import { describe, expect, it } from 'vitest'
import { APARIENCIA_INICIAL, CATALOGO, CATEGORIAS, PALETAS, loTiene, normalizarApariencia, variante } from './catalogo'

describe('catálogo de Ciempi', () => {
  it('los ids son únicos y cada categoría tiene al menos una cosa gratis', () => {
    expect(new Set(CATALOGO.map((i) => i.id)).size).toBe(CATALOGO.length)
    for (const c of CATEGORIAS) {
      expect(CATALOGO.some((i) => i.categoria === c.id && i.precio === 0)).toBe(true)
    }
  })

  it('cada color del catálogo tiene su paleta', () => {
    for (const i of CATALOGO.filter((x) => x.categoria === 'paleta')) expect(PALETAS[variante(i.id)]).toBeDefined()
  })

})

describe('normalizarApariencia', () => {
  it('completa lo que falta y descarta ids desconocidos o de otra categoría', () => {
    expect(normalizarApariencia(null)).toEqual(APARIENCIA_INICIAL)
    expect(normalizarApariencia({ nombre: '  Rayito  ', cabeza: 'cabeza-corona', pies: 'cabeza-mago', fondo: 'fondo-inventado' })).toEqual({
      ...APARIENCIA_INICIAL,
      nombre: 'Rayito',
      cabeza: 'cabeza-corona',
    })
  })

  it('un nombre vacío vuelve a "Ciempi"', () => {
    expect(normalizarApariencia({ nombre: '   ' }).nombre).toBe('Ciempi')
  })
})

describe('loTiene', () => {
  it('lo gratis siempre; lo pagado solo si está en el inventario', () => {
    expect(loTiene([], 'cabeza-jockey')).toBe(true)
    expect(loTiene([], 'cabeza-corona')).toBe(false)
    expect(loTiene(['cabeza-corona'], 'cabeza-corona')).toBe(true)
    expect(loTiene([], 'no-existe')).toBe(false)
  })
})
