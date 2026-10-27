/**
 * Separador de sílabas para español basado en reglas ortográficas (RAE).
 *
 * Pasos:
 *  1. La palabra se parte en "unidades": vocales, consonantes simples y
 *     consonantes compuestas que nunca se separan (ch, ll, rr, y qu/gu
 *     delante de e/i, donde la u no suena).
 *  2. Las vocales seguidas se agrupan en núcleos (diptongos y triptongos)
 *     salvo que formen hiato.
 *  3. Las consonantes entre dos núcleos se reparten: una sola va a la
 *     sílaba siguiente; si hay varias, a la siguiente van las dos últimas
 *     cuando forman un grupo inseparable (pr, bl, tr…) y si no, solo la última.
 */

const FUERTES = new Set(['a', 'e', 'o', 'á', 'é', 'ó'])
const DEBILES = new Set(['i', 'u', 'ü'])
const DEBILES_TILDADAS = new Set(['í', 'ú'])
const VOCALES = new Set([...FUERTES, ...DEBILES, ...DEBILES_TILDADAS])

/** Grupos consonánticos que siempre inician sílaba juntos. "tl" se separa (uso chileno: at-las). */
const GRUPOS_INSEPARABLES = new Set([
  'pr', 'br', 'tr', 'dr', 'cr', 'kr', 'gr', 'fr',
  'pl', 'bl', 'cl', 'kl', 'gl', 'fl',
])

const DIGRAFOS = new Set(['ch', 'll', 'rr'])

type Unidad = { texto: string; tipo: 'V' | 'C'; clave: string }

const esLetra = (c: string) => /\p{L}/u.test(c)

function esVocal(clave: string) {
  return VOCALES.has(clave)
}

function partirEnUnidades(original: string[]): Unidad[] {
  const bajo = original.map((c) => c.toLowerCase())
  const unidades: Unidad[] = []
  let i = 0
  while (i < bajo.length) {
    const c = bajo[i]
    const sig = bajo[i + 1] ?? ''
    const sig2 = bajo[i + 2] ?? ''

    if (DIGRAFOS.has(c + sig)) {
      unidades.push({ texto: original[i] + original[i + 1], tipo: 'C', clave: c + sig })
      i += 2
      continue
    }
    // "que", "qui", "gue", "gui": la u es muda y va pegada a la consonante.
    if ((c === 'q' || c === 'g') && sig === 'u' && 'eiéí'.includes(sig2) && sig2 !== '') {
      unidades.push({ texto: original[i] + original[i + 1], tipo: 'C', clave: c + sig })
      i += 2
      continue
    }
    if (c === 'y') {
      // La y es vocal cuando no la sigue una vocal: "muy", "rey", "y".
      const vocal = !esVocal(sig)
      unidades.push({ texto: original[i], tipo: vocal ? 'V' : 'C', clave: vocal ? 'i' : 'y' })
      i += 1
      continue
    }
    unidades.push({ texto: original[i], tipo: esVocal(c) ? 'V' : 'C', clave: c })
    i += 1
  }
  return unidades
}

/** Dos vocales seguidas forman hiato (van en sílabas distintas). */
function esHiato(a: string, b: string) {
  if (FUERTES.has(a) && FUERTES.has(b)) return true
  if (DEBILES_TILDADAS.has(a) && FUERTES.has(b)) return true
  if (FUERTES.has(a) && DEBILES_TILDADAS.has(b)) return true
  // Dos débiles iguales: "chiita", "duunviro".
  if (a === b) return true
  return false
}

/** Separa una palabra (solo letras) en sílabas, conservando mayúsculas y tildes. */
function separarNucleo(palabra: string): string[] {
  const letras = [...palabra]
  const unidades = partirEnUnidades(letras)

  // Índices (en unidades) donde empieza cada núcleo vocálico.
  const nucleos: { inicio: number; fin: number }[] = []
  for (let i = 0; i < unidades.length; i++) {
    if (unidades[i].tipo !== 'V') continue
    const previo = nucleos.at(-1)
    if (previo && previo.fin === i - 1 && !esHiato(unidades[i - 1].clave, unidades[i].clave)) {
      previo.fin = i
    } else {
      nucleos.push({ inicio: i, fin: i })
    }
  }
  if (nucleos.length <= 1) return [palabra]

  // Para cada par de núcleos, la unidad donde empieza la sílaba siguiente.
  const cortes: number[] = []
  for (let k = 0; k < nucleos.length - 1; k++) {
    const desde = nucleos[k].fin + 1
    const hasta = nucleos[k + 1].inicio // exclusivo
    const consonantes = hasta - desde
    if (consonantes <= 1) {
      cortes.push(desde)
      continue
    }
    const penultima = unidades[hasta - 2]
    const ultima = unidades[hasta - 1]
    const grupo = penultima.clave.length === 1 && ultima.clave.length === 1
      ? penultima.clave + ultima.clave
      : ''
    cortes.push(GRUPOS_INSEPARABLES.has(grupo) ? hasta - 2 : hasta - 1)
  }

  const silabas: string[] = []
  let inicio = 0
  for (const corte of [...cortes, unidades.length]) {
    silabas.push(unidades.slice(inicio, corte).map((u) => u.texto).join(''))
    inicio = corte
  }
  return silabas
}

/**
 * Separa una palabra en sílabas. Los signos pegados a la palabra
 * ("¡Hola!", "casa,") quedan en la primera o última sílaba.
 */
export function separarSilabas(palabra: string): string[] {
  const letras = [...palabra]
  let ini = 0
  let fin = letras.length
  while (ini < fin && !esLetra(letras[ini])) ini++
  while (fin > ini && !esLetra(letras[fin - 1])) fin--

  const nucleo = letras.slice(ini, fin).join('')
  if (!nucleo) return [palabra]
  // Palabras con números o guiones internos se dejan enteras.
  if (![...nucleo].every(esLetra)) return [palabra]

  const silabas = separarNucleo(nucleo)
  silabas[0] = letras.slice(0, ini).join('') + silabas[0]
  silabas[silabas.length - 1] += letras.slice(fin).join('')
  return silabas
}

/** Una palabra de la frase con sus sílabas. */
export interface PalabraSilabeada {
  texto: string
  silabas: string[]
}

export function silabearFrase(frase: string): PalabraSilabeada[] {
  return frase
    .split(/\s+/)
    .filter(Boolean)
    .map((texto) => ({ texto, silabas: separarSilabas(texto) }))
}
