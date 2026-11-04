import { existsSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buscarItem, CATALOGO } from './catalogo'
import { FONDOS_IMAGEN, rutaFondo } from './fondos'

const NUEVOS = ['fondo-bosque', 'fondo-playa', 'fondo-ciudad', 'fondo-castillo', 'fondo-arrecife', 'fondo-nubes']

describe('fondos ilustrados (v2.7)', () => {
  it('los 6 fondos nuevos están en el catálogo como fondo, con precio de 25 a 30', () => {
    for (const id of NUEVOS) {
      const item = buscarItem(id)
      expect(item, id).toBeDefined()
      expect(item!.categoria).toBe('fondo')
      expect(item!.precio).toBeGreaterThanOrEqual(25)
      expect(item!.precio).toBeLessThanOrEqual(30)
      expect(CATALOGO.filter((i) => i.id === id)).toHaveLength(1)
    }
  })

  it('cada fondo ilustrado tiene su WebP en public/ y está en FONDOS_IMAGEN', () => {
    expect([...FONDOS_IMAGEN].sort()).toEqual([...NUEVOS].sort())
    for (const id of NUEVOS) {
      const archivo = new URL(`../../public${rutaFondo(id)}`, import.meta.url)
      expect(existsSync(archivo), id).toBe(true)
      expect(statSync(archivo).size).toBeGreaterThan(1000)
    }
  })

  it('los fondos de siempre conservan id y precio', () => {
    const antes = { 'fondo-jardin': 0, 'fondo-mar': 20, 'fondo-selva': 20, 'fondo-dulces': 20, 'fondo-nieve': 20, 'fondo-espacio': 25 }
    for (const [id, precio] of Object.entries(antes)) expect(buscarItem(id)?.precio, id).toBe(precio)
  })
})
