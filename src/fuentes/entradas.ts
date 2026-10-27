/**
 * Puntos de entrada de texto: pegar texto o subir un PDF (fuentes/pdf.ts).
 */

export type IdFuente = 'pegar' | 'pdf'

export interface FuenteDeTexto {
  id: IdFuente
  etiqueta: string
}

export const FUENTES: FuenteDeTexto[] = [
  { id: 'pdf', etiqueta: 'Subir PDF' },
  { id: 'pegar', etiqueta: 'Pegar texto' },
]
