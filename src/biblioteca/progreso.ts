import type { Asignacion, Texto } from '../dominio/tipos'
import { capituloDeFrase } from '../lenguaje/libro'

export interface ResumenProgreso {
  /** Lo leído de verdad alguna vez, 0..1 (para los adultos). */
  fraccion: number
  /** Ya lo terminó alguna vez: lleva su estrella en la biblioteca. */
  terminado: boolean
  capitulo: string | null
  etiqueta: string
  accion: 'Leer' | 'Continuar' | 'Leer otra vez'
}

/**
 * Un cuento se lee siempre desde el comienzo (un libro con capítulos, desde
 * el capítulo donde iba): lo que se resume es hasta dónde lo leyó alguna vez
 * y si ya lo terminó.
 */
export function resumirProgreso(asignacion: Asignacion, texto: Texto): ResumenProgreso {
  const total = Math.max(1, texto.frases.length)
  const terminado = asignacion.completadaEn != null || asignacion.estado === 'completada' || (asignacion.premioHasta ?? 0) >= 100
  if (terminado) return { fraccion: 1, terminado, capitulo: null, etiqueta: '¡Terminado!', accion: 'Leer otra vez' }
  const leido = Math.min(asignacion.leidoHasta ?? 0, total)
  const fraccion = leido / total
  const conCapitulos = texto.capitulos.length > 1
  const capitulo = conCapitulos && asignacion.fraseActual > 0 ? texto.capitulos[capituloDeFrase(texto.capitulos, asignacion.fraseActual)].titulo : null
  const pct = `${Math.floor(fraccion * 100)} %`
  if (capitulo) return { fraccion, terminado, capitulo, etiqueta: `${capitulo} · ${pct}`, accion: 'Continuar' }
  if (leido > 0) return { fraccion, terminado, capitulo, etiqueta: `Llegó al ${pct}`, accion: 'Leer' }
  return { fraccion, terminado, capitulo, etiqueta: conCapitulos ? `${texto.capitulos.length} capítulos` : `${texto.frases.length} frases`, accion: 'Leer' }
}
