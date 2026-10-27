import { useMemo, useState } from 'react'
import { useRepositorios } from '../datos/DatosProvider'
import { crearTexto } from '../datos/inicio'
import type { Id, Texto } from '../dominio/tipos'
import { extraerPdf, tieneTexto, type PdfExtraido } from '../fuentes/pdf'
import { frasesDelLibro, procesarPaginas } from '../lenguaje/libro'
import { BotonPrincipal, Encabezado, MensajeError, Portada } from '../ui/comunes'

interface Props {
  perfilId: Id
  usuarioId: Id
  alAgregar: (texto: Texto) => void
  alVolver: () => void
}

/**
 * El niño agrega un PDF a su biblioteca (por ejemplo, la guía que le dieron
 * en el colegio). Versión simple: sin rango de páginas ni revisión de
 * frases; se salta la portada y el resto queda tal cual.
 */
export function PantallaAgregarLibro({ perfilId, usuarioId, alAgregar, alVolver }: Props) {
  const repos = useRepositorios()
  const [leyendo, setLeyendo] = useState<{ pagina: number; total: number } | null>(null)
  const [pdf, setPdf] = useState<PdfExtraido | null>(null)
  const [titulo, setTitulo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const libro = useMemo(() => {
    if (!pdf) return null
    // La portada (primera página con poco texto) se salta.
    const desde = Math.max(0, pdf.paginas.findIndex((p) => p.lineas.join(' ').trim().length > 300))
    const capitulos = procesarPaginas(pdf.paginas.slice(desde))
    return { capitulos, ...renombrar(frasesDelLibro(capitulos)) }
  }, [pdf])

  const abrir = async (archivo: File) => {
    setError(null)
    setPdf(null)
    setLeyendo({ pagina: 0, total: 0 })
    try {
      const extraido = await extraerPdf(archivo, (pagina, total) => setLeyendo({ pagina, total }))
      if (!tieneTexto(extraido)) setError('Este PDF no tiene letras que Ciempi pueda leer (parece una foto). Pídele ayuda a un adulto.')
      else {
        setPdf(extraido)
        setTitulo(extraido.titulo)
      }
    } catch {
      setError('No se pudo abrir este archivo. ¿Es un PDF?')
    } finally {
      setLeyendo(null)
    }
  }

  const agregar = async () => {
    if (!pdf || !libro) return
    setGuardando(true)
    setError(null)
    try {
      const texto = await repos.textos.guardar(
        crearTexto(usuarioId, {
          titulo,
          autor: pdf.autor,
          origen: 'pdf',
          textoOriginal: libro.capitulos.map((c) => `${c.titulo}\n${c.texto}`).join('\n\n'),
          frases: libro.frases,
          capitulos: libro.indice,
          portada: pdf.portada,
        }),
      )
      await repos.asignaciones.asignar(perfilId, texto.id)
      alAgregar(texto)
    } catch (e) {
      setError((e as Error).message)
      setGuardando(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Encabezado alVolver={alVolver} titulo="Agregar un libro" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 overflow-y-auto px-5 pb-8 pt-4">
        {!pdf && (
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-3xl border-4 border-dashed border-petroleo bg-white px-5 py-10 text-center">
            <span className="text-6xl" aria-hidden>
              📄
            </span>
            <span className="text-2xl font-bold text-petroleo">Elegir un PDF</span>
            <span className="text-tinta-suave">Un libro o la guía que te dieron</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => {
                const archivo = e.target.files?.[0]
                if (archivo) void abrir(archivo)
                e.target.value = ''
              }}
            />
          </label>
        )}

        {leyendo && (
          <div role="status" className="flex flex-col items-center gap-3 text-center">
            <img src="/ciempi.svg" alt="" className="feliz h-20 w-20 rounded-2xl" />
            <p className="text-lg">{leyendo.total ? `Ciempi está leyendo la página ${leyendo.pagina} de ${leyendo.total}…` : 'Abriendo…'}</p>
          </div>
        )}

        {pdf && libro && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Portada titulo={titulo} portada={pdf.portada} className="h-52 w-40 text-6xl" />
            <label className="flex w-full flex-col gap-1 text-left">
              <span className="text-sm font-bold text-tinta-suave">¿Cómo se llama?</span>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="campo text-xl" />
            </label>
            <p className="text-tinta-suave">
              {libro.indice.length > 1 ? `${libro.indice.length} partes · ` : ''}
              {libro.frases.length} frases
            </p>
            <BotonPrincipal onClick={() => void agregar()} disabled={guardando || !titulo.trim() || libro.frases.length === 0} className="w-full py-4 text-xl">
              ¡Agregar a mis libros!
            </BotonPrincipal>
            <button onClick={() => setPdf(null)} className="font-bold text-petroleo underline underline-offset-4">
              Elegir otro
            </button>
          </div>
        )}

        <MensajeError error={error} />
      </div>
    </div>
  )
}

const renombrar = ({ frases, capitulos }: ReturnType<typeof frasesDelLibro>) => ({ frases, indice: capitulos })
