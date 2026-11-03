/**
 * Comprueba con el código REAL del juego (sin servidor ni datos) cuánto pagan
 * hoy algunos textos "de abuso": textos subidos que no enseñan a leer pero
 * maximizan monedas. Usa el mismo camino que la app: dividirConParrafos →
 * nivelSugerido (lo que recibe un libro que agrega el propio niño, ver
 * server/src/app.ts:555) → vistaPorNivel → monedasDeUnidad + HITOS.
 *   node --experimental-strip-types docs/expansion-ciempi/economia/simulador/verificar-abusos.mts
 * Escribe datos/abusos.json
 */
import { writeFileSync } from 'node:fs'
import { dividirConParrafos } from '../../../../src/lenguaje/frases.ts'
import { nivelSugerido } from '../../../../src/lenguaje/dificultad.ts'
import { vistaPorNivel } from '../../../../src/lenguaje/unidades.ts'
import { HITOS, monedasDeUnidad, contarPalabras } from '../../../../src/lectura/monedas.ts'
import type { NivelLectura } from '../../../../src/dominio/tipos.ts'

function pagoPrimeraLectura(texto: string, nivelForzado?: NivelLectura) {
  const { frases, parrafos } = dividirConParrafos(texto)
  const sugerido = nivelSugerido(frases, parrafos)
  const nivel = nivelForzado ?? sugerido
  const vista = vistaPorNivel({ frases, parrafos, capitulos: [{ titulo: 'x', desdeFrase: 0 }] }, nivel)
  const total = vista.unidades.length
  let monedas = 0
  for (let k = 1; k <= total; k++) monedas += monedasDeUnidad(nivel, k, total)
  monedas += HITOS[nivel].reduce((s, h) => s + h.monedas, 0)
  const palabras = vista.unidades.reduce((s, u) => s + contarPalabras(u), 0)
  return { nivelSugerido: sugerido, nivel, unidades: total, palabras, monedas }
}

const casos = [
  {
    id: 'n2-sin-tope',
    descripcion: 'El niño agrega un texto de 300 oraciones de 2 palabras largas ("Mariposa amarilla."). El nivel sugerido es 2, que no tiene tope por libro.',
    texto: Array.from({ length: 300 }, () => 'Mariposa amarilla.').join(' '),
  },
  {
    id: 'n0-corto',
    descripcion: 'El niño agrega un texto de 10 frases de una sílaba ("Sol."). Nivel 0, tope 10.',
    texto: Array.from({ length: 10 }, () => 'Sol.').join('\n'),
  },
  {
    id: 'n4-una-frase',
    descripcion: 'Un adulto asigna en nivel 4 un texto de una sola frase: pasa el 25, 50, 75 y 100 % de una vez.',
    texto: 'El sol sale.',
    nivel: 4 as NivelLectura,
  },
  {
    id: 'n3-cuatro-frases',
    descripcion: 'Un adulto asigna en nivel 3 un texto de 4 frases cortas en 4 párrafos: 4 monedas por párrafo.',
    texto: 'Sol.\n\nLuna.\n\nMar.\n\nPan.',
    nivel: 3 as NivelLectura,
  },
]

const resultados = casos.map((c) => ({ ...c, texto: c.texto.slice(0, 60) + (c.texto.length > 60 ? '…' : ''), ...pagoPrimeraLectura(c.texto, c.nivel) }))
writeFileSync(new URL('./datos/abusos.json', import.meta.url), JSON.stringify(resultados, null, 1) + '\n')
for (const r of resultados) console.log(r.id, '→ nivel', r.nivel, '(sugerido', r.nivelSugerido + ')', 'unidades', r.unidades, 'palabras', r.palabras, 'monedas', r.monedas)
