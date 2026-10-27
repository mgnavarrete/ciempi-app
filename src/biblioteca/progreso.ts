import type { Asignacion, Texto } from '../dominio/tipos'
import { capituloDeFrase } from '../lenguaje/libro'

export interface ResumenProgreso {
  /** 0..1 */
  fraccion: number
  capitulo: string | null
  etiqueta: string
  accion: 'Empezar' | 'Continuar' | 'Leer otra vez'
}

export function resumirProgreso(asignacion: Asignacion, texto: Texto): ResumenProgreso {
  const total = Math.max(1, texto.frases.length)
  if (asignacion.estado === 'completada') {
    return { fraccion: 1, capitulo: null, etiqueta: '¡Terminado!', accion: 'Leer otra vez' }
  }
  const fraccion = Math.min(1, asignacion.fraseActual / total)
  const pct = `${Math.round(fraccion * 100)} %`
  const conCapitulos = texto.capitulos.length > 1
  const capitulo = conCapitulos ? texto.capitulos[capituloDeFrase(texto.capitulos, asignacion.fraseActual)].titulo : null
  if (asignacion.fraseActual === 0) {
    return { fraccion: 0, capitulo, etiqueta: conCapitulos ? `${texto.capitulos.length} capítulos` : `${texto.frases.length} frases`, accion: 'Empezar' }
  }
  return { fraccion, capitulo, etiqueta: capitulo ? `${capitulo} · ${pct}` : pct, accion: 'Continuar' }
}
