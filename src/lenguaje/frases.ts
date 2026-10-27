export const MAX_PALABRAS_POR_FRASE = 8

/**
 * Palabras que abren lo que sigue (artículos, preposiciones, pronombres
 * átonos, conjunciones): al final de un trozo suenan cortadas, así que se
 * pasan al siguiente. "y anoche me / he pasado" → "y anoche / me he pasado".
 */
const PALABRAS_DE_ENLACE = new Set([
  'a', 'al', 'con', 'de', 'del', 'el', 'en', 'la', 'las', 'lo', 'los', 'mi', 'mis',
  'o', 'para', 'por', 'que', 'se', 'su', 'sus', 'tu', 'tus', 'un', 'una', 'y',
  'me', 'te', 'le', 'les', 'nos', 'no', 'ni', 'sin', 'muy', 'más', 'tan', 'como',
  'cuando', 'si', 'porque', 'pero', 'hasta', 'desde', 'sobre', 'entre',
])

/**
 * Divide un texto en oraciones según la puntuación (. ! ? … ; : y saltos de
 * línea). Los signos de apertura ¿ ¡ quedan con su oración.
 */
export function dividirEnOraciones(texto: string): string[] {
  const limpio = texto.replace(/\r/g, '').replace(/[ \t]+/g, ' ')
  const oraciones = limpio.match(/[^.!?…;:\n]+[.!?…;:]*["»”’)]*/g) ?? []
  return oraciones.map((o) => o.trim()).filter((o) => /\p{L}|\p{N}/u.test(o))
}

/**
 * Corta una oración larga en trozos de máximo `max` palabras, sin romper
 * palabras. Reparte parejo (10 palabras → 5 + 5, no 8 + 2) y aprovecha las
 * comas como punto de corte natural.
 */
export function trocearOracion(oracion: string, max = MAX_PALABRAS_POR_FRASE): string[] {
  const palabras = oracion.split(/\s+/).filter(Boolean)
  if (palabras.length <= max) return palabras.length ? [palabras.join(' ')] : []

  const trozos: string[] = []
  let actual: string[] = []
  for (let i = 0; i < palabras.length; i++) {
    actual.push(palabras[i])
    const restantes = palabras.length - i - 1
    if (restantes === 0) break

    // Tamaño ideal para repartir parejo lo que queda (incluido el trozo actual).
    const pendientes = actual.length + restantes
    const ideal = Math.ceil(pendientes / Math.ceil(pendientes / max))

    // Pausas naturales: tras una coma, o antes de un inciso de diálogo ("—me dijo").
    const terminaEnComa = /[,—–]$/.test(palabras[i])
    const siguienteAbreInciso = /^[—–]/.test(palabras[i + 1])
    const cortarEnComa = (terminaEnComa || siguienteAbreInciso) && actual.length >= 2 && restantes >= 2
    if (cortarEnComa) {
      trozos.push(actual.join(' '))
      actual = []
    } else if (actual.length >= ideal) {
      const ultima = palabras[i].toLowerCase().replace(/^[—–¿¡"«“]+/, '')
      if (PALABRAS_DE_ENLACE.has(ultima) && actual.length > 2) {
        trozos.push(actual.slice(0, -1).join(' '))
        actual = [palabras[i]]
      } else {
        trozos.push(actual.join(' '))
        actual = []
      }
    }
  }
  if (actual.length) trozos.push(actual.join(' '))
  return trozos
}

/** Texto libre → lista de frases cortas listas para leer. */
export function dividirEnFrases(texto: string, max = MAX_PALABRAS_POR_FRASE): string[] {
  return dividirEnOraciones(texto).flatMap((o) => trocearOracion(o, max))
}

/**
 * Quita rayas y guiones de diálogo para no confundir al niño al leer
 * ("—Hola —dijo—." → "Hola dijo."). Se conservan los guiones dentro de una
 * palabra compuesta ("franco-chileno").
 */
export function quitarGuiones(texto: string): string {
  return texto
    .replace(/[—–]/g, ' ')
    .replace(/(^|\s)-+|-+(?=\s|$|[.,;:!?…»”"')])/g, '$1')
    .replace(/\s+([.,;:!?…])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}
