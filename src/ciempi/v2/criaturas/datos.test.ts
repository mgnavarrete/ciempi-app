import { describe, expect, it } from 'vitest'
import { BANDAS, ROSTRO, VARIANTES, idVariante, varianteDatos } from './datos'

// Contrato 2.5 (PLAN-2.5): exactamente estos ids, una base por especie.
const IDS = 'dragon-clasico dragon-fuego dragon-hielo dragon-nocturno dragon-tierra dragon-blanco dragon-esmeralda cuncuna-clasica cuncuna-primavera cuncuna-frutilla cuncuna-arcoiris cuncuna-lavanda cuncuna-bosque cuncuna-dorada serpiente-caramelo serpiente-jardin serpiente-noche serpiente-hoja camaleon-lima camaleon-arcoiris camaleon-tropical camaleon-atardecer camaleon-pastel'.split(' ')

describe('datos de las criaturas', () => {
  it('tiene las 23 variantes del contrato, en orden', () => expect(VARIANTES.map((v) => v.id)).toEqual(IDS))
  it('una variante base por especie y la especie en el prefijo', () => {
    for (const e of ['dragon', 'cuncuna', 'serpiente', 'camaleon'] as const) expect(VARIANTES.filter((v) => v.especie === e && v.base).map((v) => v.id)).toEqual([IDS.find((x) => x.startsWith(e))])
    for (const v of VARIANTES) expect(v.id.startsWith(v.especie + '-')).toBe(true)
  })
  it('acepta ids con y sin prefijo de la tienda', () => {
    expect(varianteDatos('variante:dragon-fuego')?.especie).toBe('dragon')
    expect(varianteDatos('dragon-fuego')).toBe(varianteDatos('variante:dragon-fuego'))
    expect(varianteDatos(null)).toBeNull()
    expect(varianteDatos('variante:no-existe')).toBeNull()
    expect(idVariante('variante:cuncuna-dorada')).toBe('cuncuna-dorada')
  })
  it('rostros aprobados: Dragón v4 (AD-021) y Cuncuna v4b (AD-020)', () => expect(ROSTRO).toMatchObject({ dragon: 'v4', cuncuna: 'v4b' }))
  it('cada clave de color tiene banda en su especie', () => {
    for (const v of VARIANTES) {
      const claves = new Set(BANDAS[v.especie].map((b) => b[2]))
      for (const k of Object.keys(v.colores ?? {})) expect(claves.has(k), `${v.id}: ${k}`).toBe(true)
    }
  })
})
