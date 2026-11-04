import { describe, expect, it } from 'vitest'
import { ESPECIES, FORMA_CAMALEON, FORMA_SERPIENTE, MASCARAS_COMPLETAS } from './especie'
import { etiquetar, NINGUNO, resolver, tipoDe, type Apariencia } from './compatibilidad'
import { posiciones, roles } from './pose'

// LABORATORIO V4: T03 Serpiente y T04 Camaleón. Dragón, Cuncuna y Ciempi se prueban en especie.test.ts.
const LARGOS = [0, 1, 2, 3, 4, 5, 6, 8, 12, 22, 40, 100]
const NUEVAS = { serpiente: FORMA_SERPIENTE, camaleon: FORMA_CAMALEON } as const

describe('especies V4 (T03 Serpiente, T04 Camaleón)', () => {
  for (const [id, forma] of Object.entries(NUEVAS)) {
    it(`${id}: entrada en ESPECIES con su forma, pendiente de aprobación`, () => {
      const e = ESPECIES[id as keyof typeof NUEVAS]
      expect(e.id).toBe(id)
      expect(e.item).toBe(`especie:${id}`)
      expect(e.forma).toBe(forma)
      expect(e.estado).toMatch(/pendiente/)
      expect(e.exclusivos).toEqual([])
      expect(e.manifiesto).toBe(`docs/rediseno-ciempi/laboratorio-transformaciones/recursos/${id}/manifiesto.json`)
    })

    it(`${id}: cola y frente únicos; los centrales repiten A→B→C→D`, () => {
      expect(new Set(forma.ciclo)).toEqual(new Set([1, 2, 3, 5]))
      for (const n of LARGOS) {
        const r = roles(n, forma)
        expect(r).toHaveLength(n)
        expect(r.filter((x) => x === 4)).toHaveLength(n ? 1 : 0)
        expect(r.filter((x) => x === 0)).toHaveLength(n > 1 ? 1 : 0)
        for (let i = 1; i < n - 1; i++) expect(r[i]).toBe(forma.ciclo[(i - 1) % 4])
      }
    })

    it(`${id}: crece hacia atrás desde el frente fijo (x = 558), con separación constante`, () => {
      for (const n of LARGOS.filter((x) => x > 0)) {
        const p = posiciones(n, forma)
        expect(p[n - 1]).toMatchObject({ role: 4, x: 558, y: forma.y[4] })
        for (let i = 0; i < n - 1; i++) expect(p[i + 1].x - p[i].x).toBe(forma.separacion[p[i].role])
      }
      // Con N = 40 la cola queda a la izquierda y nunca se superponen dos segmentos en el mismo x.
      const xs = posiciones(40, forma).map((q) => q.x)
      expect(new Set(xs).size).toBe(40)
      for (const rol of [0, 1, 2, 3, 4, 5]) {
        expect(forma.xMaestro[rol]).toBeTypeOf('number')
        expect(forma.pieDeRol[rol]).toBeGreaterThanOrEqual(0)
        expect(forma.pieDeRol[rol]).toBeLessThan(5)
      }
      expect(forma.siempreClonar).toBe(true)
      expect(forma.margenCola).toBeGreaterThan(110)
    })
  }

  it('serpiente: apoya en el suelo (más baja que Ciempi) y el frente sube como cuello', () => {
    const f = FORMA_SERPIENTE
    for (const r of [1, 2, 3, 5]) expect(f.y[r]).toBeGreaterThan(ESPECIES.ciempi.forma.y[3])
    expect(f.y[4]).toBeLessThan(f.y[1])
    // Todas las patas salen de la misma pata (vacía) del maestro.
    expect(new Set(Object.values(f.pieDeRol))).toEqual(new Set([1]))
  })

  it('no altera Ciempi, Dragón ni Cuncuna', () => {
    expect(Object.keys(ESPECIES)).toEqual(['ciempi', 'dragon', 'cuncuna', 'serpiente', 'camaleon'])
    for (const id of ['ciempi', 'dragon', 'cuncuna'] as const) expect(ESPECIES[id].partesOcultas).toBeUndefined()
  })
})

describe('compatibilidad V4', () => {
  const TODO: Apariencia = {
    ...NINGUNO, paleta: 'paleta:oceano', gesto: 'gesto:b03-guino', cabeza: 'cabeza:b06-ia-mago', cara: 'cara:b04-redondos',
    cuello: 'cuello:bufanda-calco32', espalda: 'espalda:b09-aventura', pies: 'pies:b10-deportiva', textura: 'textura:b11-draco',
  }

  it('serpiente: el calzado se oculta (guardado, no desequipado) y vuelve en otra especie', () => {
    const copia = structuredClone(TODO)
    const r = resolver(TODO, 'serpiente')
    expect(TODO).toEqual(copia)
    expect(r.visibles.pies).toBe(NINGUNO.pies)
    expect(r.ocultos.map((o) => o.id)).toEqual(['pies:b10-deportiva'])
    expect(r.etiquetas.pies).toMatchObject({ visible: false, motivo: expect.stringMatching(/no tiene patas/) })
    expect(resolver(TODO, 'dragon').visibles.pies).toBe('pies:b10-deportiva')
    expect(resolver(TODO, 'camaleon').visibles.pies).toBe('pies:b10-deportiva')
    // «Sin calzado» no cuenta como oculto.
    expect(etiquetar('pies', NINGUNO.pies!, 'serpiente').visible).toBe(true)
  })

  it('serpiente: cabeza, cara, cuello, gesto y espalda se ven; espalda y textura son adaptables', () => {
    const r = resolver(TODO, 'serpiente')
    for (const p of ['cabeza', 'cara', 'cuello', 'gesto', 'espalda', 'textura', 'paleta'] as const) expect(r.visibles[p]).toBe(TODO[p])
    expect(tipoDe('espalda', 'espalda:b09-aventura', 'serpiente')).toBe('adaptable')
    expect(tipoDe('cabeza', 'cabeza:b06-ia-mago', 'serpiente')).toBe('universal')
  })

  it('serpiente: lengüita y narinas se guardan solo bajo máscaras completas', () => {
    for (const m of MASCARAS_COMPLETAS) expect(resolver({ ...NINGUNO, cabeza: m }, 'serpiente').rasgosOcultos).toEqual(['lengua', 'narinas'])
    expect(resolver({ ...NINGUNO, cabeza: 'cabeza:b06-ia-mago' }, 'serpiente').rasgosOcultos).toEqual([])
    expect(resolver({ ...NINGUNO }, 'serpiente').rasgosOcultos).toEqual([])
  })

  it('camaleón: casco bajo gorros/peinados; torretas solo bajo máscaras completas', () => {
    expect(resolver({ ...NINGUNO, cabeza: 'cabeza:b06-ia-mago' }, 'camaleon').rasgosOcultos).toEqual(['casco'])
    expect(resolver({ ...NINGUNO, pelo: 'pelo:b05-coletas' }, 'camaleon').rasgosOcultos).toEqual(['casco'])
    expect(resolver({ ...NINGUNO, cabeza: 'cabeza:b07-ia-robot' }, 'camaleon').rasgosOcultos.sort()).toEqual(['casco', 'torretas'])
    expect(resolver({ ...NINGUNO }, 'camaleon').rasgosOcultos).toEqual([])
    expect(etiquetar('paleta', 'paleta:oceano', 'camaleon').motivo).toMatch(/Camuflaje/)
    expect(etiquetar('pies', 'pies:b10-deportiva', 'camaleon').motivo).toMatch(/pata propia/)
  })
})
