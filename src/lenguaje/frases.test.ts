import { describe, expect, it } from 'vitest'
import { dividirConParrafos, dividirEnFrases, dividirEnOraciones, quitarGuiones, trocearOracion } from './frases'

describe('dividirEnOraciones', () => {
  it('corta por puntuación y conserva ¿? ¡!', () => {
    expect(dividirEnOraciones('Hola, Ciempi. ¿Cómo estás? ¡Muy bien!')).toEqual([
      'Hola, Ciempi.',
      '¿Cómo estás?',
      '¡Muy bien!',
    ])
  })

  it('corta por saltos de línea e ignora líneas vacías', () => {
    expect(dividirEnOraciones('El sol\n\n  La luna  \n...')).toEqual(['El sol', 'La luna'])
  })

  it('conserva los puntos suspensivos', () => {
    expect(dividirEnOraciones('Y entonces... llegó.')).toEqual(['Y entonces...', 'llegó.'])
  })
})

describe('trocearOracion', () => {
  it('no toca oraciones cortas', () => {
    expect(trocearOracion('Mi perro come pan.')).toEqual(['Mi perro come pan.'])
  })

  it('reparte parejo y nunca pasa del máximo', () => {
    const trozos = trocearOracion('uno dos tres cuatro cinco seis siete ocho', 6)
    expect(trozos).toEqual(['uno dos tres cuatro', 'cinco seis siete ocho'])
  })

  it('prefiere cortar en una coma', () => {
    expect(trocearOracion('Un día encontró una hoja, verde y brillante, junto al árbol.')).toEqual([
      'Un día encontró una hoja,',
      'verde y brillante,',
      'junto al árbol.',
    ])
  })

  it('por defecto las frases llegan hasta 8 palabras', () => {
    expect(trocearOracion('uno dos tres cuatro cinco seis siete ocho')).toEqual(['uno dos tres cuatro cinco seis siete ocho'])
  })

  it('oraciones muy largas quedan en trozos de máximo 8', () => {
    const larga = Array.from({ length: 23 }, (_, i) => `p${i}`).join(' ')
    const trozos = trocearOracion(larga)
    expect(trozos.every((t) => t.split(' ').length <= 8)).toBe(true)
    expect(trozos.join(' ')).toBe(larga)
  })
})

describe('cortes naturales', () => {
  it('no deja pronombres ni conjunciones colgando al final', () => {
    expect(trocearOracion('Muy terrible y anoche me he pasado la noche sin dormir pensando en esto.', 6)).toEqual([
      'Muy terrible y anoche',
      'me he pasado la noche',
      'sin dormir pensando en esto.',
    ])
  })

  it('corta antes de un inciso de diálogo', () => {
    expect(trocearOracion('—Entonces, escríbaselo a nadie —me dijo, y soltó la risa.')).toEqual([
      '—Entonces, escríbaselo a nadie',
      '—me dijo,',
      'y soltó la risa.',
    ])
  })
})

describe('dividirEnFrases', () => {
  it('combina ambos pasos', () => {
    expect(dividirEnFrases('Ciempi camina. Ciempi camina muy despacito por el jardín de flores.')).toEqual([
      'Ciempi camina.',
      'Ciempi camina muy despacito',
      'por el jardín de flores.',
    ])
  })
})

describe('quitarGuiones', () => {
  it('quita rayas y guiones de diálogo', () => {
    expect(quitarGuiones('—Hola —dijo—.')).toBe('Hola dijo.')
    expect(quitarGuiones('-¿Dónde estás? -le dije-.')).toBe('¿Dónde estás? le dije.')
    expect(quitarGuiones('tarde… –suspiró.')).toBe('tarde… suspiró.')
    expect(quitarGuiones('Y entonces — se fue.')).toBe('Y entonces se fue.')
  })

  it('conserva los guiones dentro de una palabra', () => {
    expect(quitarGuiones('un amigo franco-chileno')).toBe('un amigo franco-chileno')
  })
})

describe('dividirConParrafos', () => {
  it('una línea en blanco separa párrafos; cada verso es una frase', () => {
    const r = dividirConParrafos('Cien zapatitos tengo yo,\ncien zapatitos de color.\n\nUno, dos, tres y cuatro,\nme pongo a contar.')
    expect(r.frases).toEqual(['Cien zapatitos tengo yo,', 'cien zapatitos de color.', 'Uno, dos, tres y cuatro,', 'me pongo a contar.'])
    expect(r.parrafos).toEqual([0, 2])
  })

  it('un solo párrafo no marca párrafos', () => {
    expect(dividirConParrafos('Sale el sol. Sale la luna.')).toEqual({ frases: ['Sale el sol.', 'Sale la luna.'] })
  })
})
