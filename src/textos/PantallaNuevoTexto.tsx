import { useMemo, useState } from 'react'
import { TEXTO_EJEMPLO } from '../contenido/ejemplo'
import { useRepositorios } from '../datos/DatosProvider'
import { crearTexto } from '../datos/inicio'
import type { PerfilNino, Texto } from '../dominio/tipos'
import { FUENTES, type IdFuente } from '../fuentes/entradas'
import { extraerPdf, tieneTexto, type PdfExtraido } from '../fuentes/pdf'
import { nivelSugerido } from '../lenguaje/dificultad'
import { dividirConParrafos } from '../lenguaje/frases'
import { frasesDelLibro, procesarPaginas } from '../lenguaje/libro'
import { separarSilabas } from '../lenguaje/silabas'
import { BotonPrincipal, Encabezado, MensajeError, Portada } from '../ui/comunes'

interface Props {
  /** Usuario que sube el texto (queda como su dueño). */
  usuarioId: string
  perfiles: PerfilNino[]
  /** Si viene, el texto se agrega solo a la biblioteca de este niño (preseleccionado). */
  paraPerfilId?: string
  fuenteInicial: IdFuente
  alGuardar: (texto: Texto) => void
  alVolver: () => void
}

/** Agregar un texto pegado o un libro en PDF, revisarlo y dejarlo en la biblioteca de los niños. */
export function PantallaNuevoTexto({ usuarioId, perfiles, paraPerfilId, fuenteInicial, alGuardar, alVolver }: Props) {
  const repos = useRepositorios()
  const cuentaId = usuarioId
  const [fuente, setFuente] = useState<IdFuente>(fuenteInicial)
  const [paraNinos, setParaNinos] = useState(() => new Set(paraPerfilId ? [paraPerfilId] : perfiles.map((p) => p.id)))
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async (texto: Texto) => {
    setGuardando(true)
    setError(null)
    try {
      const guardado = await repos.textos.guardar(texto)
      // Queda en el nivel sugerido; después se puede cambiar por niño.
      const nivel = nivelSugerido(guardado.frases, guardado.parrafos)
      await Promise.all([...paraNinos].map((id) => repos.asignaciones.asignar(id, guardado.id, nivel)))
      alGuardar(guardado)
    } catch (e) {
      setError((e as Error).message)
      setGuardando(false)
    }
  }

  const elegirNinos = perfiles.length > 0 && (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-1 font-bold">Agregar a la biblioteca de</legend>
      <div className="flex flex-wrap gap-2">
        {perfiles.map((p) => {
          const marcado = paraNinos.has(p.id)
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={marcado}
              onClick={() =>
                setParaNinos((s) => {
                  const n = new Set(s)
                  if (marcado) n.delete(p.id)
                  else n.add(p.id)
                  return n
                })
              }
              className={`flex items-center gap-2 rounded-full px-4 py-2 font-bold ${marcado ? 'bg-petroleo text-white' : 'bg-white text-tinta-suave'}`}
            >
              <span aria-hidden>{p.icono}</span> {p.apodo} {marcado && '✓'}
            </button>
          )
        })}
      </div>
    </fieldset>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Encabezado alVolver={alVolver} titulo="Agregar texto o libro" />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-5 pb-8 pt-2">
        <div className="flex gap-2" role="tablist">
          {FUENTES.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={fuente === f.id}
              onClick={() => setFuente(f.id)}
              className={`rounded-full px-4 py-1.5 font-bold ${fuente === f.id ? 'bg-petroleo text-white' : 'border-2 border-petroleo text-petroleo'}`}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>

        {fuente === 'pdf' ? (
          <DesdePdf cuentaId={cuentaId} guardando={guardando} alGuardar={guardar} pie={elegirNinos} />
        ) : (
          <DesdeTextoPegado cuentaId={cuentaId} guardando={guardando} alGuardar={guardar} pie={elegirNinos} />
        )}
        <MensajeError error={error} />
      </div>
    </div>
  )
}

interface PropsFuente {
  cuentaId: string
  guardando: boolean
  alGuardar: (texto: Texto) => void
  pie: React.ReactNode
}

function DesdeTextoPegado({ cuentaId, guardando, alGuardar, pie }: PropsFuente) {
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  // Una línea en blanco separa párrafos (o estrofas, en un poema).
  const { frases, parrafos } = useMemo(() => dividirConParrafos(contenido), [contenido])

  return (
    <>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold text-tinta-suave">Título</span>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="campo" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold text-tinta-suave">Texto</span>
        <textarea value={contenido} onChange={(e) => setContenido(e.target.value)} rows={7} placeholder="Pega aquí el texto…" className="campo leading-relaxed" />
      </label>
      <button
        onClick={() => {
          setTitulo(TEXTO_EJEMPLO.titulo)
          setContenido(TEXTO_EJEMPLO.texto)
        }}
        className="self-start text-sm font-bold text-petroleo underline underline-offset-4"
      >
        Usar el texto de ejemplo
      </button>

      {frases.length > 0 && <VistaFrases titulo={`${frases.length} ${frases.length === 1 ? 'frase' : 'frases'}`} frases={frases} />}
      {pie}
      <BotonPrincipal
        disabled={frases.length === 0 || guardando}
        onClick={() => alGuardar(crearTexto(cuentaId, { titulo, textoOriginal: contenido, origen: 'pegado', frases, parrafos }))}
      >
        Guardar
      </BotonPrincipal>
    </>
  )
}

function DesdePdf({ cuentaId, guardando, alGuardar, pie }: PropsFuente) {
  const [leyendo, setLeyendo] = useState<{ pagina: number; total: number } | null>(null)
  const [pdf, setPdf] = useState<PdfExtraido | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abrir = async (archivo: File) => {
    setError(null)
    setPdf(null)
    setLeyendo({ pagina: 0, total: 0 })
    try {
      const extraido = await extraerPdf(archivo, (pagina, total) => setLeyendo({ pagina, total }))
      if (!tieneTexto(extraido)) {
        setError('Este PDF no tiene texto seleccionable (parece escaneado). Por ahora solo se pueden usar PDF con texto.')
      } else {
        setPdf(extraido)
      }
    } catch (e) {
      setError(`No se pudo leer el PDF: ${(e as Error).message}`)
    } finally {
      setLeyendo(null)
    }
  }

  return (
    <>
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-petroleo bg-white px-5 py-8 text-center">
        <span className="text-4xl" aria-hidden>
          📄
        </span>
        <span className="text-lg font-bold text-petroleo">{pdf ? 'Elegir otro PDF' : 'Elegir un PDF'}</span>
        <span className="text-sm text-tinta-suave">El archivo se lee en este dispositivo; solo se guarda el texto.</span>
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

      {leyendo && (
        <p role="status" className="text-center text-tinta-suave">
          {leyendo.total ? `Leyendo página ${leyendo.pagina} de ${leyendo.total}…` : 'Abriendo PDF…'}
        </p>
      )}
      <MensajeError error={error} />
      {pdf && <RevisarLibro key={pdf.paginas.length + pdf.titulo} pdf={pdf} cuentaId={cuentaId} guardando={guardando} alGuardar={alGuardar} pie={pie} />}
    </>
  )
}

function RevisarLibro({ pdf, cuentaId, guardando, alGuardar, pie }: PropsFuente & { pdf: PdfExtraido }) {
  const total = pdf.paginas.length
  const primeraConTexto = pdf.paginas.findIndex((p) => p.lineas.join(' ').trim().length > 300) + 1 || 1
  const [titulo, setTitulo] = useState(pdf.titulo)
  const [autor, setAutor] = useState(pdf.autor)
  const [desde, setDesde] = useState(primeraConTexto)
  const [hasta, setHasta] = useState(total)

  const libro = useMemo(() => {
    const capitulos = procesarPaginas(pdf.paginas.slice(desde - 1, hasta))
    const { frases, capitulos: indice, parrafos } = frasesDelLibro(capitulos)
    return { capitulos, frases, indice, parrafos }
  }, [pdf, desde, hasta])

  const inicioDePagina = (n: number) => pdf.paginas[n - 1]?.lineas.find((l) => l.trim().length > 20)?.trim() ?? ''
  const finDePagina = (n: number) => pdf.paginas[n - 1]?.lineas.filter((l) => l.trim().length > 20).at(-1)?.trim() ?? ''

  const guardar = () =>
    alGuardar(
      crearTexto(cuentaId, {
        titulo,
        autor,
        origen: 'pdf',
        textoOriginal: libro.capitulos.map((c) => `${c.titulo}\n${c.texto}`).join('\n\n'),
        frases: libro.frases,
        capitulos: libro.indice,
        parrafos: libro.parrafos,
        portada: pdf.portada,
      }),
    )

  return (
    <section className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Portada titulo={titulo} portada={pdf.portada} className="h-36 w-26 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-tinta-suave">Título</span>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="campo" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-tinta-suave">Autor</span>
            <input value={autor} onChange={(e) => setAutor(e.target.value)} className="campo" />
          </label>
        </div>
      </div>

      <fieldset className="flex min-w-0 flex-col gap-3 rounded-2xl bg-white p-4">
        <legend className="px-1 font-bold">Páginas del cuento</legend>
        <p className="-mt-1 text-sm text-tinta-suave">Deja fuera portadas, índices o biografías del final.</p>
        <RangoPagina etiqueta="Desde la página" valor={desde} min={1} max={hasta} alCambiar={setDesde} muestra={inicioDePagina(desde)} />
        <RangoPagina etiqueta="Hasta la página" valor={hasta} min={desde} max={total} alCambiar={setHasta} muestra={finDePagina(hasta)} />
      </fieldset>

      <h2 className="text-lg font-bold">
        {libro.capitulos.length} {libro.capitulos.length === 1 ? 'capítulo' : 'capítulos'} · {libro.frases.length} frases
      </h2>
      <ul className="flex flex-col gap-2">
        {libro.capitulos.slice(0, 60).map((c, i) => {
          const desdeFrase = libro.indice[i].desdeFrase
          const hastaFrase = libro.indice[i + 1]?.desdeFrase ?? libro.frases.length
          return (
            <li key={i}>
              <details className="rounded-xl bg-white px-3 py-2">
                <summary className="cursor-pointer font-bold">
                  {c.titulo} <span className="font-normal text-tinta-suave">· pág. {c.paginaInicio} · {hastaFrase - desdeFrase} frases</span>
                </summary>
                <VistaFrases frases={libro.frases.slice(desdeFrase, Math.min(hastaFrase, desdeFrase + 12))} />
              </details>
            </li>
          )
        })}
        {libro.capitulos.length > 60 && <li className="text-sm text-tinta-suave">…y {libro.capitulos.length - 60} capítulos más</li>}
      </ul>

      {pie}
      <BotonPrincipal disabled={libro.frases.length === 0 || guardando} onClick={guardar}>
        Guardar libro
      </BotonPrincipal>
    </section>
  )
}

function RangoPagina(props: { etiqueta: string; valor: number; min: number; max: number; muestra: string; alCambiar: (n: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold">{props.etiqueta}</span>
        <input
          type="number"
          min={props.min}
          max={props.max}
          value={props.valor}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (n >= props.min && n <= props.max) props.alCambiar(n)
          }}
          className="campo w-20 py-1 text-center"
        />
      </span>
      <input type="range" min={props.min} max={props.max} value={props.valor} onChange={(e) => props.alCambiar(Number(e.target.value))} className="accent-petroleo" />
      {props.muestra && <span className="truncate text-sm italic text-tinta-suave">«{props.muestra}»</span>}
    </label>
  )
}

/** Frases con sus sílabas marcadas, para revisar el silabeo antes de guardar. */
function VistaFrases({ titulo, frases }: { titulo?: string; frases: string[] }) {
  return (
    <section className="mt-2 flex flex-col gap-1.5">
      {titulo && <h2 className="text-lg font-bold">{titulo}</h2>}
      <ol className="flex flex-col gap-1">
        {frases.map((f, i) => (
          <li key={i} className="rounded-lg bg-crema px-3 py-1.5">
            {f.split(' ').map((p, j) => (
              <span key={j} className="mr-2 inline-block">
                {separarSilabas(p).join('·')}
              </span>
            ))}
          </li>
        ))}
      </ol>
    </section>
  )
}
