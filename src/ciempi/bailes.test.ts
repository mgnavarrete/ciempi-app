import { describe, expect, it } from 'vitest'
import { ANIMACIONES } from './v2/animacion/animaciones.js'
import { APARIENCIA_INICIAL, BAILES, CELEBRACION_INICIAL, PARTES, bailesDe, buscarItem, comprarItem, loTiene, normalizarApariencia, puedePonerse } from './catalogo'

describe('bailes de Ciempi (2.7)', () => {
  it('cada baile es una animación aprobada del rig, con id baile:<animación>', () => {
    for (const b of BAILES) {
      expect(ANIMACIONES.some((a) => a.id === b.animacion), b.id).toBe(true)
      expect(b.id).toBe(`baile:${b.animacion.toLowerCase()}`)
      expect(buscarItem(b.id)?.categoria).toBe('baile')
    }
    // Tropezar no es un baile.
    expect(BAILES.some((b) => b.animacion === 'E04')).toBe(false)
    expect((PARTES as readonly string[]).includes('baile')).toBe(false)
  })

  it('los gratis (Saludo, Saltito y la clásica) se tienen sin comprarlos', () => {
    expect(BAILES.filter((b) => b.precio === 0).map((b) => b.id).sort()).toEqual(['baile:a03', 'baile:a04', 'baile:a10'])
    for (const id of ['baile:a04', 'baile:a03', CELEBRACION_INICIAL]) expect(loTiene([], id)).toBe(true)
    expect(bailesDe([]).map((b) => b.nombre)).toEqual(['Saludo', 'Saltito'])
    expect(bailesDe([], true).map((b) => b.id)).toContain(CELEBRACION_INICIAL)
    expect(comprarItem([], 0, 'baile:a04')).toMatchObject({ monedas: 0, precio: 0, lineas: [] })
  })

  it('los de pago cuestan entre 15 y 25 y se compran', () => {
    const pago = BAILES.filter((b) => b.precio > 0)
    expect(pago.length).toBeGreaterThanOrEqual(5)
    for (const b of pago) {
      expect(b.precio).toBeGreaterThanOrEqual(15)
      expect(b.precio).toBeLessThanOrEqual(25)
      expect(loTiene([], b.id)).toBe(false)
    }
    const r = comprarItem(['x'], 30, 'baile:e02', 25)
    expect(r).toEqual({ monedas: 5, inventario: ['x', 'baile:e02'], precio: 25, lineas: [{ id: 'baile:e02', precio: 25 }] })
    expect(loTiene(r.inventario, 'baile:e02')).toBe(true)
    expect(() => comprarItem([], 10, 'baile:e02')).toThrow(/faltan 15/)
  })

  it('la celebración por omisión es la clásica (A10) y una ajena vuelve a ella al normalizar', () => {
    expect(APARIENCIA_INICIAL.celebracion).toBe(CELEBRACION_INICIAL)
    expect(normalizarApariencia(null).celebracion).toBe(CELEBRACION_INICIAL)
    // Lo guardado antes de 2.7 no trae el campo.
    const { celebracion: _, ...antigua } = APARIENCIA_INICIAL
    expect(normalizarApariencia(antigua).celebracion).toBe(CELEBRACION_INICIAL)
    expect(normalizarApariencia({ ...APARIENCIA_INICIAL, celebracion: 'baile:nada' }).celebracion).toBe(CELEBRACION_INICIAL)
    // Ajena: con el inventario vuelve a la inicial; propia o gratis, se conserva.
    expect(normalizarApariencia({ ...APARIENCIA_INICIAL, celebracion: 'baile:e02' }, []).celebracion).toBe(CELEBRACION_INICIAL)
    expect(normalizarApariencia({ ...APARIENCIA_INICIAL, celebracion: 'baile:e02' }, ['baile:e02']).celebracion).toBe('baile:e02')
    expect(normalizarApariencia({ ...APARIENCIA_INICIAL, celebracion: 'baile:a03' }, []).celebracion).toBe('baile:a03')
    expect(puedePonerse({ ...APARIENCIA_INICIAL, celebracion: 'baile:e02' }, [])).toBe(false)
  })
})
