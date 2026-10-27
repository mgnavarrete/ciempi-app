import type { Capitulo } from '../dominio/tipos'
import { dividirEnFrases } from './frases'

/**
 * Convierte las páginas extraídas de un PDF en capítulos y frases listas
 * para leer. Es lógica pura: la extracción con pdf.js está en fuentes/pdf.ts.
 *
 * Limpieza:
 *  - Quita números de página, URLs y encabezados que se repiten en casi
 *    todas las páginas (título del libro, nombre del autor…).
 *  - Une las líneas que el PDF corta en medio de una oración y repara las
 *    palabras partidas con guion al final de línea ("es-" + "perando").
 *  - Convierte los guiones de diálogo en raya ("-Hola -dijo-." → "—Hola —dijo—.").
 *  - Detecta títulos de capítulo: "Capítulo 3", "Parte II", números romanos
 *    solos y fechas de diario ("Enero 4", como en Papelucho).
 */

export interface PaginaExtraida {
  /** Número de página en el PDF (desde 1). */
  numero: number
  lineas: string[]
}

export interface CapituloLibro {
  titulo: string
  paginaInicio: number
  texto: string
}


const MESES = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre'
const RE_FECHA = new RegExp(`^(${MESES})\\s*(\\d{1,2})\\.?$`, 'i')
const RE_CAPITULO = /^(cap[ií]tulo|parte)\s+[\p{L}\d]+\.?(\s*[:.-]\s*.{0,60})?$/iu
const RE_ROMANO = /^[IVXLC]{1,6}\.?$/
const RE_NUMERO_PAGINA = /^[-–—\s]*\d{1,4}[-–—\s]*$/
const RE_URL = /(https?:\/\/|www\.)\S+/i

/** Si la línea es un título de capítulo, lo devuelve normalizado. */
export function tituloDeCapitulo(linea: string): string | null {
  const t = linea.trim()
  const fecha = t.match(RE_FECHA)
  if (fecha) {
    const mes = fecha[1][0].toUpperCase() + fecha[1].slice(1).toLowerCase()
    return `${mes} ${fecha[2]}`
  }
  if (RE_CAPITULO.test(t) && t.split(/\s+/).length <= 8) return t.replace(/\.$/, '')
  if (RE_ROMANO.test(t)) return t.replace(/\.$/, '')
  return null
}

/** Líneas cortas que aparecen en muchas páginas: encabezados o pies. */
function lineasRepetidas(paginas: PaginaExtraida[]): Set<string> {
  if (paginas.length < 4) return new Set()
  const conteo = new Map<string, number>()
  for (const p of paginas) {
    for (const l of new Set(p.lineas.map((x) => x.trim()))) {
      if (l && l.length <= 60) conteo.set(l, (conteo.get(l) ?? 0) + 1)
    }
  }
  const minimo = Math.max(3, Math.ceil(paginas.length * 0.4))
  return new Set([...conteo].filter(([, n]) => n >= minimo).map(([l]) => l))
}

/** Une una línea al texto acumulado reparando las palabras cortadas con guion. */
function unirLinea(acumulado: string, linea: string): string {
  if (!acumulado) return linea
  if (/\p{L}[-‐]$/u.test(acumulado) && /^\p{Ll}/u.test(linea)) return acumulado.slice(0, -1) + linea
  return `${acumulado} ${linea}`
}

/** Guiones de diálogo → raya, comillas y espacios normalizados. */
export function normalizarTexto(texto: string): string {
  return (
    texto
      // Raya de apertura: "-Hola" o "–Hola" al inicio o tras espacio.
      .replace(/(^|[\s(«"“])[-–](?=[\p{L}¿¡"“«])/gu, '$1—')
      // Raya de cierre de inciso: "dije-." o "dije- y".
      .replace(/(\p{L})[-–](?=[.,;:!?…]|\s)/gu, '$1—')
      .replace(/\.{3}/g, '…')
      // Comillas sueltas que deja el PDF ("como las ' sillas").
      .replace(/(^|\s)['’‘"](?=\s|$)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

export function procesarPaginas(paginas: PaginaExtraida[]): CapituloLibro[] {
  const repetidas = lineasRepetidas(paginas)
  const capitulos: CapituloLibro[] = []
  let actual: CapituloLibro | null = null

  for (const pagina of paginas) {
    for (const cruda of pagina.lineas) {
      const linea = cruda.replace(/\s+/g, ' ').trim()
      if (!linea || RE_NUMERO_PAGINA.test(linea) || repetidas.has(linea)) continue
      if (RE_URL.test(linea) && linea.replace(RE_URL, '').trim().length < 3) continue

      const titulo = tituloDeCapitulo(linea)
      if (titulo) {
        actual = { titulo, paginaInicio: pagina.numero, texto: '' }
        capitulos.push(actual)
        continue
      }
      if (!actual) {
        actual = { titulo: 'Inicio', paginaInicio: pagina.numero, texto: '' }
        capitulos.push(actual)
      }
      actual.texto = unirLinea(actual.texto, linea)
    }
  }

  return capitulos
    .map((c) => ({ ...c, texto: normalizarTexto(c.texto) }))
    .filter((c) => c.texto.length > 0)
}

/**
 * Capítulos → frases planas + índice de capítulos. El título de cada
 * capítulo se lee como primera frase ("Enero 4"), igual que en el libro.
 */
export function frasesDelLibro(capitulos: CapituloLibro[]): { frases: string[]; capitulos: Capitulo[] } {
  const frases: string[] = []
  const indice: Capitulo[] = []
  for (const c of capitulos) {
    indice.push({ titulo: c.titulo, desdeFrase: frases.length })
    if (c.titulo !== 'Inicio') frases.push(c.titulo)
    frases.push(...dividirEnFrases(c.texto))
  }
  return { frases, capitulos: indice }
}

/** Índice del capítulo que contiene la frase. */
export function capituloDeFrase(capitulos: Capitulo[], frase: number): number {
  let i = 0
  while (i + 1 < capitulos.length && capitulos[i + 1].desdeFrase <= frase) i++
  return i
}

/** "MARCELA PAZ" → "Marcela Paz" (nombres propios). */
const aNombrePropio = (s: string) =>
  s.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, espacio: string, letra: string) => espacio + letra.toUpperCase())

/** "GUÍA DE LENGUAJE" → "Guía de lenguaje" (en español, mayúscula solo al inicio). */
const aTituloEspanol = (s: string) => {
  const minus = s.toLowerCase()
  return minus.charAt(0).toUpperCase() + minus.slice(1)
}

/**
 * Título y autor sugeridos. Los metadatos del PDF suelen traer basura
 * ("Microsoft Word - libro.doc"), así que se prefiere la portada: si la
 * primera página tiene poco texto, su primera línea es el título y la
 * segunda, el autor.
 */
export function sugerirTituloYAutor(
  paginas: PaginaExtraida[],
  meta: { titulo?: string; autor?: string } = {},
): { titulo: string; autor: string } {
  const basura = /microsoft|\.docx?$|\.pdf$|untitled|sin t[ií]tulo/i
  const portada = paginas[0]?.lineas.map((l) => l.trim()).filter((l) => l && !RE_URL.test(l) && !RE_NUMERO_PAGINA.test(l)) ?? []
  const esPortada = portada.join(' ').length < 300

  const titulo = meta.titulo && !basura.test(meta.titulo) ? meta.titulo : esPortada && portada[0] ? portada[0] : ''
  const autor = meta.autor && meta.autor.length > 3 && !basura.test(meta.autor) ? meta.autor : esPortada && portada[1] ? portada[1] : ''
  const enMayusculas = (s: string) => s === s.toUpperCase()
  return {
    titulo: (enMayusculas(titulo) ? aTituloEspanol(titulo) : titulo).trim(),
    autor: (enMayusculas(autor) ? aNombrePropio(autor) : autor).trim(),
  }
}
