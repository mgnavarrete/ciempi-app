import { describe, expect, it } from 'vitest'
import { comprarItem } from './catalogo'
import { desglose } from './TiendaCriaturas'

describe('desglose de la compra (lo que se muestra antes de confirmar)', () => {
  it('especie + variante, con el total exacto que se cobra', () => {
    const d = desglose('variante:dragon-fuego', [])
    expect(d.texto).toBe('Dragón 80 + Dragón de Fuego 24 = 104 🪙')
    expect(d.total).toBe(comprarItem([], 999, 'variante:dragon-fuego').precio)
    expect(desglose('variante:dragon-fuego', ['especie:dragon']).texto).toBe('Dragón de Fuego 24 🪙')
  })

  it('paquete parcial: total y ahorro iguales a lo cobrado', () => {
    const inv = ['especie:serpiente', 'variante:serpiente-noche']
    const d = desglose('paquete:serpiente', inv)
    expect(d).toMatchObject({ total: 39, ahorro: 48 - 39 })
    expect(d.partes).toEqual([{ nombre: '2 colores de Serpiente', precio: 39 }])
    expect(comprarItem(inv, 999, 'paquete:serpiente', d.total).precio).toBe(39)
    // Sin la especie: la especie entera aparte.
    expect(desglose('paquete:serpiente', []).partes).toEqual([
      { nombre: 'Serpiente', precio: 60 },
      { nombre: '3 colores de Serpiente', precio: 58 },
    ])
  })
})
