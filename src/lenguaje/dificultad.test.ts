import { describe, expect, it } from 'vitest'
import { CUENTOS_ORIGINALES as CUENTOS } from '../contenido/cuentos'
import { nivelSugerido, medirTexto } from './dificultad'
import { dividirConParrafos } from './frases'
import { vistaPorNivel } from './unidades'

describe('nivelSugerido', () => {
  it('cada cuento de Ciempi sugiere el nivel para el que fue escrito', () => {
    for (const c of CUENTOS) {
      const { frases, parrafos } = dividirConParrafos(c.texto)
      expect([c.titulo, nivelSugerido(frases, parrafos)]).toEqual([c.titulo, c.nivel])
    }
  })

  it('mide palabras, oraciones y sílabas', () => {
    const m = medirTexto(['Sale el sol.', 'La mariposa vuela.'])
    expect(m.palabras).toBe(6)
    expect(m.palabrasPorOracion).toBe(3)
    expect(m.largas).toBeCloseTo(1 / 6)
  })
})

// Los cuentos con su Ciempi de protagonista (con el nombre que le puso) se prueban en contenido/cuentosConNombre.test.ts.
describe('cuentos de Ciempi', () => {
  it('hay ocho por nivel (cuatro de Ciempi y cuatro con personajes), con ids únicos', () => {
    for (const n of [0, 1, 2, 3, 4]) expect(CUENTOS.filter((c) => c.nivel === n)).toHaveLength(8)
    expect(new Set(CUENTOS.map((c) => c.id)).size).toBe(CUENTOS.length)
  })

  it('en su nivel, cada unidad cabe en pantalla', () => {
    for (const c of CUENTOS) {
      const texto = { ...dividirConParrafos(c.texto), capitulos: [] }
      const { unidades } = vistaPorNivel(texto, c.nivel)
      const maximo = { 0: 8, 1: 8, 2: 12, 3: 60, 4: 160 }[c.nivel]
      for (const u of unidades) expect(u.split(/\s+/).length).toBeLessThanOrEqual(maximo)
    }
  })
})
