import { describe, expect, it } from 'vitest'
import { etiquetar, NINGUNO, resolver, tipoDe, type Apariencia } from './compatibilidad'

const BASE: Apariencia = { ...NINGUNO }
const CON_TODO: Apariencia = {
  ...BASE, paleta: 'paleta:oceano', gesto: 'gesto:b03-guino', cabeza: 'cabeza:b06-ia-mago', pelo: 'pelo:b05-coletas', cara: 'cara:b04-redondos',
  cuello: 'cuello:bufanda-calco32', espalda: 'espalda:b08-ia-heroica', pies: 'pies:b10-deportiva', textura: 'textura:b11-draco',
}

describe('compatibilidad de accesorios por especie', () => {
  it('en Ciempi todo es universal y visible, sin rasgos ocultos', () => {
    const r = resolver(CON_TODO, 'ciempi')
    expect(r.visibles).toEqual(CON_TODO)
    expect(r.ocultos).toEqual([])
    expect(r.rasgosOcultos).toEqual([])
    for (const et of Object.values(r.etiquetas)) expect(et!.tipo).toBe('universal')
  })

  it('cabeza, cara, pelo, cuello y gesto son universales; pies, espalda, paleta y textura adaptables', () => {
    for (const e of ['dragon', 'cuncuna'] as const) {
      for (const p of ['cabeza', 'cara', 'pelo', 'cuello', 'gesto', 'ojos', 'detalle'] as const) expect(tipoDe(p, `${p}:x`, e)).toBe('universal')
      for (const p of ['pies', 'espalda', 'paleta', 'textura'] as const) expect(tipoDe(p, `${p}:x`, e)).toBe('adaptable')
      // «Sin nada» no se etiqueta como adaptación.
      expect(tipoDe('pies', NINGUNO.pies!, e)).toBe('universal')
      expect(etiquetar('pies', 'pies:b10-deportiva', e).motivo).toMatch(/pata propia/)
    }
  })

  it('resolver no modifica la apariencia ni pierde lo equipado', () => {
    const a = { ...CON_TODO, espalda: 'espalda:dragon-alas' }
    const copia = structuredClone(a)
    for (const e of ['ciempi', 'dragon', 'cuncuna'] as const) resolver(a, e)
    expect(a).toEqual(copia)
  })

  it('las alitas son exclusivas del Dragón: ocultas (no desequipadas) en Ciempi y Cuncuna', () => {
    const a = { ...BASE, espalda: 'espalda:dragon-alas' }
    const d = resolver(a, 'dragon')
    expect(d.visibles.espalda).toBe('espalda:dragon-alas')
    expect(d.etiquetas.espalda).toMatchObject({ tipo: 'exclusivo', visible: true })
    for (const e of ['ciempi', 'cuncuna'] as const) {
      const r = resolver(a, e)
      expect(r.visibles.espalda).toBe('espalda:espalda-nada')
      expect(r.ocultos).toHaveLength(1)
      expect(r.ocultos[0]).toMatchObject({ parte: 'espalda', id: 'espalda:dragon-alas', tipo: 'exclusivo', visible: false })
      expect(r.ocultos[0].motivo).toMatch(/Dragón/)
    }
    // Un exclusivo en una parte que no le corresponde no se dibuja.
    expect(etiquetar('cabeza', 'espalda:dragon-alas', 'dragon').visible).toBe(false)
  })

  it('rasgos propios que se guardan bajo una pieza puesta y vuelven al quitarla', () => {
    expect(resolver(BASE, 'dragon').rasgosOcultos).toEqual([])
    expect(resolver({ ...BASE, cabeza: 'cabeza:b06-ia-mago' }, 'dragon').rasgosOcultos).toEqual([])
    expect(resolver({ ...BASE, cabeza: 'cabeza:b07-ia-robot' }, 'dragon').rasgosOcultos.sort()).toEqual(['cuernos', 'hocico'])
    expect(resolver({ ...BASE, cabeza: 'cabeza:b07-ia-gatita' }, 'dragon').rasgosOcultos).toEqual([])
    expect(resolver(BASE, 'cuncuna').rasgosOcultos).toEqual([])
    expect(resolver({ ...BASE, cabeza: 'cabeza:b06-ia-jockey' }, 'cuncuna').rasgosOcultos).toEqual(['penacho'])
    expect(resolver({ ...BASE, pelo: 'pelo:b05-coletas' }, 'cuncuna').rasgosOcultos).toEqual(['penacho'])
    expect(resolver({ ...BASE, cara: 'cara:b04-redondos' }, 'cuncuna').rasgosOcultos).toEqual([])
    expect(resolver({ ...BASE, cabeza: 'cabeza:b07-ia-robot' }, 'ciempi').rasgosOcultos).toEqual([])
  })

  it('las partes no equipadas no aparecen y una especie desconocida es Ciempi', () => {
    const r = resolver({ cabeza: 'cabeza:b06-ia-mago' }, 'dragon')
    expect(Object.keys(r.visibles)).toEqual(['cabeza'])
    expect(resolver({ espalda: 'espalda:dragon-alas' }, 'x' as never).especie).toBe('ciempi')
  })
})
