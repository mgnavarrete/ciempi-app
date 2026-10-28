import { describe, expect, it } from 'vitest'
import {
  capituloDeFrase,
  cortesDePagina,
  frasesDelLibro,
  normalizarTexto,
  procesarPaginas,
  sugerirTituloYAutor,
  tituloDeCapitulo,
  type PaginaExtraida,
} from './libro'

// Imita la estructura de un PDF real: número de página, encabezado repetido,
// líneas cortadas a mitad de oración, guion de corte y diálogos con guion.
const paginas: PaginaExtraida[] = [
  { numero: 1, lineas: ['EL LIBRO DE PRUEBA', '1', 'Hoy pasó algo muy', 'raro en el jardín.'] },
  { numero: 2, lineas: ['EL LIBRO DE PRUEBA', '2', 'Enero 4', 'Mi perro se fue a es-', 'conder bajo la cama.', '-¿Dónde estás? -le dije-.'] },
  { numero: 3, lineas: ['EL LIBRO DE PRUEBA', '3', 'Enero18', 'Volvió muy contento.', 'http://www.ejemplo.com'] },
  { numero: 4, lineas: ['EL LIBRO DE PRUEBA', '4', 'Capítulo 2', 'Fin del cuento...'] },
]

describe('tituloDeCapitulo', () => {
  it('reconoce fechas de diario, capítulos y números romanos', () => {
    expect(tituloDeCapitulo('Enero 4')).toBe('Enero 4')
    expect(tituloDeCapitulo('enero18')).toBe('Enero 18')
    expect(tituloDeCapitulo('Capítulo 3')).toBe('Capítulo 3')
    expect(tituloDeCapitulo('CAPITULO II: El viaje')).toBe('CAPITULO II: El viaje')
    expect(tituloDeCapitulo('IV')).toBe('IV')
  })

  it('no confunde líneas normales con títulos', () => {
    expect(tituloDeCapitulo('En la tarde fuimos al parque.')).toBeNull()
    expect(tituloDeCapitulo('nadie?')).toBeNull()
    expect(tituloDeCapitulo('Enero fue un mes muy largo')).toBeNull()
  })
})

describe('normalizarTexto', () => {
  it('convierte los guiones de diálogo en raya', () => {
    expect(normalizarTexto('-Se lo cuento a otra -me contestó.')).toBe('—Se lo cuento a otra —me contestó.')
    expect(normalizarTexto('-Tú no entiendes nada -le dije-. Es algo')).toBe('—Tú no entiendes nada —le dije—. Es algo')
    expect(normalizarTexto('tarde... –suspiró.')).toBe('tarde… —suspiró.')
  })

  it('quita comillas sueltas', () => {
    expect(normalizarTexto("algo como las ' sillas")).toBe('algo como las sillas')
  })

  it('respeta las palabras compuestas con guion', () => {
    expect(normalizarTexto('un amigo franco-chileno')).toBe('un amigo franco-chileno')
  })
})

describe('procesarPaginas', () => {
  const capitulos = procesarPaginas(paginas)

  it('separa por capítulos y deja el texto previo como "Inicio"', () => {
    expect(capitulos.map((c) => [c.titulo, c.paginaInicio])).toEqual([
      ['Inicio', 1],
      ['Enero 4', 2],
      ['Enero 18', 3],
      ['Capítulo 2', 4],
    ])
  })

  it('quita números de página, encabezados repetidos y URLs, y une las líneas', () => {
    expect(capitulos[0].texto).toBe('Hoy pasó algo muy raro en el jardín.')
    expect(capitulos[2].texto).toBe('Volvió muy contento.')
  })

  it('repara las palabras cortadas con guion y normaliza el diálogo', () => {
    expect(capitulos[1].texto).toBe('Mi perro se fue a esconder bajo la cama. —¿Dónde estás? —le dije—.')
  })
})

describe('frasesDelLibro', () => {
  it('arma frases planas con el título como primera frase de cada capítulo', () => {
    const { frases, capitulos } = frasesDelLibro(procesarPaginas(paginas))
    expect(frases).toEqual([
      'Hoy pasó algo muy raro en el jardín.',
      'Enero 4',
      'Mi perro se fue',
      'a esconder bajo la cama.',
      '—¿Dónde estás?',
      '—le dije—.',
      'Enero 18',
      'Volvió muy contento.',
      'Capítulo 2',
      'Fin del cuento…',
    ])
    expect(capitulos.map((c) => c.desdeFrase)).toEqual([0, 1, 6, 8])
    expect(capituloDeFrase(capitulos, 0)).toBe(0)
    expect(capituloDeFrase(capitulos, 5)).toBe(1)
    expect(capituloDeFrase(capitulos, 6)).toBe(2)
    expect(capituloDeFrase(capitulos, 999)).toBe(3)
  })
})

describe('sugerirTituloYAutor', () => {
  const portada = { numero: 1, lineas: ['PAPELUCHO', 'MARCELA PAZ', 'http://www.librodot.com'] }

  it('ignora metadatos basura y usa la portada', () => {
    expect(sugerirTituloYAutor([portada], { titulo: 'Microsoft Word - Papelucho.doc', autor: 'nm' })).toEqual({
      titulo: 'Papelucho',
      autor: 'Marcela Paz',
    })
  })

  it('usa los metadatos cuando son buenos', () => {
    expect(sugerirTituloYAutor([portada], { titulo: 'Papelucho', autor: 'Marcela Paz' })).toEqual({
      titulo: 'Papelucho',
      autor: 'Marcela Paz',
    })
  })

  it('sin portada ni metadatos, deja vacío para que el adulto lo escriba', () => {
    const larga = { numero: 1, lineas: ['Había una vez '.repeat(40)] }
    expect(sugerirTituloYAutor([larga])).toEqual({ titulo: '', autor: '' })
  })
})

describe('títulos en mayúsculas', () => {
  it('el título queda con mayúscula solo al inicio y el autor como nombre propio', () => {
    const portada = { numero: 1, lineas: ['GUÍA DE LENGUAJE', 'ANA MARÍA PÉREZ'] }
    expect(sugerirTituloYAutor([portada])).toEqual({ titulo: 'Guía de lenguaje', autor: 'Ana María Pérez' })
  })
})

describe('párrafos y versos en el PDF', () => {
  // Prosa: margen 50–550, interlineado 14. Línea corta con punto = fin de párrafo.
  const prosa = {
    numero: 1,
    lineas: ['Había una vez un ciempiés que vivía en un', 'jardín lleno de flores.', 'Un día salió a caminar por el', 'camino de tierra hasta la laguna.', 'Allí conoció a una rana.'],
    geometria: [
      { y: 700, x: 50, fin: 548 },
      { y: 686, x: 50, fin: 200 },
      { y: 672, x: 70, fin: 550 },
      { y: 658, x: 50, fin: 545 },
      { y: 630, x: 50, fin: 230 },
    ],
  }

  it('separa párrafos por línea corta con punto y por espacio mayor', () => {
    expect(cortesDePagina(prosa)).toEqual([null, null, 'parrafo', null, 'parrafo'])
    const [cap] = procesarPaginas([prosa])
    expect(cap.texto).toBe('Había una vez un ciempiés que vivía en un jardín lleno de flores.\n\nUn día salió a caminar por el camino de tierra hasta la laguna.\n\nAllí conoció a una rana.')
    expect(frasesDelLibro([cap]).parrafos).toEqual([0, 2, 4])
  })

  it('conserva los versos de un poema', () => {
    const poema = {
      numero: 1,
      lineas: ['Cien zapatitos tengo yo,', 'cien zapatitos de color,', 'camino lento por el jardín', 'saludando a cada flor.', 'Esta es una línea larga de prosa que llega hasta el margen derecho'],
      geometria: [
        { y: 700, x: 50, fin: 220 },
        { y: 686, x: 50, fin: 230 },
        { y: 672, x: 50, fin: 240 },
        { y: 658, x: 50, fin: 210 },
        { y: 630, x: 50, fin: 550 },
      ],
    }
    expect(cortesDePagina(poema)).toEqual([null, 'verso', 'verso', 'verso', 'parrafo'])
  })

  it('sin posiciones, todo sigue igual que antes', () => {
    expect(cortesDePagina({ numero: 1, lineas: prosa.lineas })).toEqual([null, null, null, null, null])
  })
})
