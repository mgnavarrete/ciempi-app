import { describe, expect, it } from 'vitest'
import { contarPalabras } from '../lectura/monedas'
import { MAX_PALABRAS_ORACION, fraseDeUnidad, unidadDeFrase, vistaPorNivel, type NivelLectura } from './unidades'

const libro = {
  frases: [
    'Enero 4',
    'Hoy fue un día raro,',
    'porque llovió todo el día.',
    'Mi mamá se enojó.',
    'Domitila hizo pan.',
    'Enero 5',
    '¡Qué frío!',
  ],
  capitulos: [
    { titulo: 'Enero 4', desdeFrase: 0 },
    { titulo: 'Enero 5', desdeFrase: 5 },
  ],
}
const palabrasDe = (unidades: string[]) => unidades.reduce((n, u) => n + contarPalabras(u), 0)

describe('vistaPorNivel', () => {
  it('niveles 0 y 1: las frases tal cual', () => {
    for (const nivel of [0, 1] as NivelLectura[]) {
      const v = vistaPorNivel(libro, nivel)
      expect(v.unidades).toEqual(libro.frases)
      expect(v.capitulos).toEqual(libro.capitulos)
    }
  })

  it('nivel 2: junta las frases de una misma oración; el título va solo', () => {
    const v = vistaPorNivel(libro, 2)
    expect(v.unidades).toEqual(['Enero 4', 'Hoy fue un día raro, porque llovió todo el día.', 'Mi mamá se enojó.', 'Domitila hizo pan.', 'Enero 5', '¡Qué frío!'])
    expect(v.desdeFrase).toEqual([0, 1, 3, 4, 5, 6])
    expect(v.capitulos).toEqual([
      { titulo: 'Enero 4', desdeFrase: 0 },
      { titulo: 'Enero 5', desdeFrase: 4 },
    ])
  })

  it('nivel 2: una oración muy larga se corta en sus frases', () => {
    const larga = { frases: ['Uno dos tres cuatro cinco seis siete,', 'ocho nueve diez once doce trece,', 'catorce quince dieciséis diecisiete.'], capitulos: [] }
    const v = vistaPorNivel(larga, 2)
    expect(v.unidades.length).toBeGreaterThan(1)
    for (const u of v.unidades) expect(contarPalabras(u)).toBeLessThanOrEqual(MAX_PALABRAS_ORACION)
  })

  it('nivel 3: usa los párrafos del libro si los tiene, sin cruzar capítulos', () => {
    const v = vistaPorNivel({ ...libro, parrafos: [1, 3, 6] }, 3)
    expect(v.unidades).toEqual(['Enero 4', 'Hoy fue un día raro, porque llovió todo el día.', 'Mi mamá se enojó. Domitila hizo pan.', 'Enero 5', '¡Qué frío!'])
  })

  it('en todos los niveles se leen las mismas palabras (las monedas cuestan lo mismo)', () => {
    for (const nivel of [0, 1, 2, 3, 4] as NivelLectura[]) expect(palabrasDe(vistaPorNivel(libro, nivel).unidades)).toBe(palabrasDe(libro.frases))
  })

  it('el avance pasa de un nivel a otro sin perder el lugar', () => {
    const v2 = vistaPorNivel(libro, 2)
    // Iba en la frase 2 del nivel 1 ("porque llovió…"): en nivel 2 retoma la oración que la contiene.
    expect(unidadDeFrase(v2, 2)).toBe(1)
    expect(fraseDeUnidad(v2, 1, libro.frases.length)).toBe(1)
    // Terminar la última unidad = todas las frases leídas.
    expect(fraseDeUnidad(v2, v2.unidades.length, libro.frases.length)).toBe(libro.frases.length)
  })
})
