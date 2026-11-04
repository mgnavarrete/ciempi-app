import { describe, expect, it } from 'vitest'
import { ESPECIES, EXCLUSIVOS, FORMA_CIEMPI, MASCARAS_COMPLETAS, CABEZA, especie } from './especie'
import { posiciones, roles } from './pose'

const LARGOS = [0, 1, 2, 3, 5, 8, 12, 22, 40, 100]

describe('especies del laboratorio (T01/T02)', () => {
  it('FORMA_CIEMPI reproduce exactamente roles y posiciones históricos', () => {
    for (const n of LARGOS) {
      expect(roles(n, FORMA_CIEMPI)).toEqual(roles(n))
      expect(posiciones(n, FORMA_CIEMPI)).toEqual(posiciones(n))
    }
    expect(posiciones(5).map((p) => [p.x, p.y])).toEqual([[187, 386], [289, 410], [390, 414], [477, 402], [558, 402]])
    expect(FORMA_CIEMPI.siempreClonar).toBe(false)
    expect(FORMA_CIEMPI.margenCola).toBeUndefined()
  })

  it('la cabeza es la de Ciempi en todas las especies', () => {
    expect(CABEZA).toEqual({ centro: [736, 340], radio: 130 })
    for (const e of Object.values(ESPECIES)) expect(e.forma.xFrente).toBe(558)
  })

  for (const id of ['dragon', 'cuncuna'] as const) {
    const forma = ESPECIES[id].forma
    it(`${id}: frente y cola únicos, centrales repiten el ciclo A–D sin otros roles`, () => {
      for (const n of LARGOS) {
        const r = roles(n, forma)
        expect(r).toHaveLength(n)
        expect(r.filter((x) => x === 4)).toHaveLength(n ? 1 : 0)
        expect(r.filter((x) => x === 0)).toHaveLength(n > 1 ? 1 : 0)
        if (n) expect(r[n - 1]).toBe(4)
        if (n > 1) expect(r[0]).toBe(0)
        for (let i = 1; i < n - 1; i++) expect(r[i]).toBe(forma.ciclo[(i - 1) % forma.ciclo.length])
        expect(new Set(forma.ciclo)).toEqual(new Set([1, 2, 3, 5]))
      }
    })
    it(`${id}: el cuerpo crece hacia atrás con separación constante y frente fijo`, () => {
      for (const n of LARGOS.filter((x) => x > 0)) {
        const p = posiciones(n, forma)
        expect(p[n - 1].x).toBe(558)
        for (let i = 1; i < n - 1; i++) expect(p[i + 1].x - p[i].x).toBe(forma.separacion[p[i].role])
        for (const q of p) expect(Number.isFinite(q.y)).toBe(true)
      }
      // Cada rol tiene pie y x de maestro (el segmento D reutiliza la pata de A).
      for (const rol of [0, 1, 2, 3, 4, 5]) {
        expect(forma.xMaestro[rol]).toBeTypeOf('number')
        expect(forma.pieDeRol[rol]).toBeLessThan(5)
      }
      expect(forma.siempreClonar).toBe(true)
      expect(forma.margenCola).toBeGreaterThan(110)
    })
  }

  it('estado y exclusivos', () => {
    expect(ESPECIES.ciempi.estado).toBe('aprobada')
    expect(ESPECIES.dragon.estado).toMatch(/pendiente/)
    expect(ESPECIES.cuncuna.estado).toMatch(/pendiente/)
    expect(EXCLUSIVOS.map((x) => x.id)).toEqual(['espalda:dragon-alas'])
    expect(especie('desconocida').id).toBe('ciempi')
    expect(MASCARAS_COMPLETAS.every((m) => m.startsWith('cabeza:'))).toBe(true)
  })
})
