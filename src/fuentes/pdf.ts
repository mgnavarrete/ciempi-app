import { sugerirTituloYAutor, type PaginaExtraida } from '../lenguaje/libro'

export interface PdfExtraido {
  paginas: PaginaExtraida[]
  titulo: string
  autor: string
  /** Miniatura de la primera página (JPEG en data URL, ~20 KB). */
  portada: string | null
}

/**
 * Lee un PDF en el navegador con pdf.js. El archivo nunca sale del
 * dispositivo: solo se guarda el texto extraído y una miniatura.
 * pdf.js se carga recién al usarlo, para no pesar en el inicio de la app.
 */
export async function extraerPdf(archivo: File, alProgreso?: (pagina: number, total: number) => void): Promise<PdfExtraido> {
  const pdfjs = await import('pdfjs-dist')
  const { default: urlWorker } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = urlWorker

  const doc = await pdfjs.getDocument({ data: new Uint8Array(await archivo.arrayBuffer()) }).promise
  try {
    const paginas: PaginaExtraida[] = []
    for (let n = 1; n <= doc.numPages; n++) {
      const contenido = await (await doc.getPage(n)).getTextContent()
      let linea = ''
      const lineas: string[] = []
      for (const item of contenido.items) {
        if (!('str' in item)) continue
        linea += item.str
        if (item.hasEOL) {
          lineas.push(linea)
          linea = ''
        }
      }
      if (linea) lineas.push(linea)
      paginas.push({ numero: n, lineas })
      alProgreso?.(n, doc.numPages)
    }

    const { info } = (await doc.getMetadata().catch(() => ({ info: {} }))) as { info: { Title?: string; Author?: string } }
    const { titulo, autor } = sugerirTituloYAutor(paginas, { titulo: info.Title, autor: info.Author })
    const sinExtension = archivo.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim()

    return {
      paginas,
      titulo: titulo || sinExtension,
      autor,
      portada: await dibujarPortada(doc).catch(() => null),
    }
  } finally {
    void doc.loadingTask.destroy()
  }
}

async function dibujarPortada(doc: import('pdfjs-dist').PDFDocumentProxy): Promise<string> {
  const pagina = await doc.getPage(1)
  const base = pagina.getViewport({ scale: 1 })
  const viewport = pagina.getViewport({ scale: 240 / base.width })
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(viewport.width)
  canvas.height = Math.round(viewport.height)
  await pagina.render({ canvas, viewport }).promise
  return canvas.toDataURL('image/jpeg', 0.72)
}

/** El texto tiene que tener contenido real: un PDF escaneado (solo imágenes) no sirve. */
export function tieneTexto(pdf: PdfExtraido): boolean {
  const caracteres = pdf.paginas.reduce((n, p) => n + p.lineas.join('').trim().length, 0)
  return caracteres > 50 * Math.min(pdf.paginas.length, 5)
}
