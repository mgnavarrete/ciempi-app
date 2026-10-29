import { useState } from 'react'
import type { Id, NivelLectura, PerfilNino } from '../dominio/tipos'
import type { IdFuente } from '../fuentes/entradas'
import { NIVELES } from '../lenguaje/unidades'
import { BotonPrincipal } from '../ui/comunes'
import { useCargasDeLibros, type CargaDeLibro } from './cargas'

/** El avance de un libro que se está agregando: «Cargando…» y después «¡Listo para leer!». */
export function TarjetaCarga({ carga, alDescartar }: { carga: CargaDeLibro; alDescartar: () => void }) {
  const color = carga.estado === 'listo' ? 'bg-verde-claro' : carga.estado === 'error' ? 'bg-coral/15' : 'bg-white'
  return (
    <li className={`flex items-center gap-3 rounded-2xl p-3 shadow-sm ${color}`} role="status">
      <span className={`text-3xl ${carga.estado === 'cargando' ? 'animate-pulse' : ''}`} aria-hidden>
        {carga.estado === 'listo' ? '✅' : carga.estado === 'error' ? '⚠️' : '⏳'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{carga.titulo}</span>
        <span className="block text-sm text-tinta-suave">
          {carga.estado === 'cargando' ? `Cargando… ${carga.detalle}` : carga.estado === 'listo' ? '¡Listo para leer! Ya está en la biblioteca de los alumnos.' : carga.error}
        </span>
      </span>
      {carga.estado !== 'cargando' && (
        <button onClick={alDescartar} className="shrink-0 rounded-full px-3 py-1.5 font-bold text-tinta-suave" aria-label="Quitar aviso">
          ✕
        </button>
      )}
    </li>
  )
}

/** Agregar un libro (PDF o escrito) en pocos pasos: se elige y se vuelve atrás mientras se carga. */
export function AgregarLibro({
  perfiles,
  elegidos,
  usuarioId,
  alListo,
  alAvanzado,
}: {
  /** A quiénes se les puede dejar (si es uno solo, no se pregunta). */
  perfiles: PerfilNino[]
  /** Los marcados al abrir (por defecto, todos). */
  elegidos?: Id[]
  usuarioId: Id
  alListo: () => void
  /** Elegir páginas y revisar antes de agregar (pantalla completa); sin esto no se ofrece. */
  alAvanzado?: (f: IdFuente) => void
}) {
  const { agregarPdf, agregarPegado } = useCargasDeLibros()
  const [forma, setForma] = useState<'pdf' | 'pegar' | null>(null)
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [nivel, setNivel] = useState<NivelLectura | null>(null)
  const [para, setPara] = useState(() => new Set(elegidos ?? perfiles.map((p) => p.id)))
  const pedido = () => ({ usuarioId, perfiles: [...para], nivel })

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Agregar libro</h2>
        <button onClick={alListo} className="font-bold text-tinta-suave">
          Cancelar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 p-4 text-center font-bold ${forma === 'pdf' ? 'border-petroleo bg-petroleo-claro' : 'border-[#e2d6bf]'}`}>
          <span className="text-4xl" aria-hidden>
            📄
          </span>
          Subir PDF
          <span className="text-xs font-normal text-tinta-suave">Se carga solo</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => {
              const archivo = e.target.files?.[0]
              if (!archivo) return
              agregarPdf(archivo, pedido())
              alListo()
            }}
          />
        </label>
        <button onClick={() => setForma('pegar')} className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-4 font-bold ${forma === 'pegar' ? 'border-petroleo bg-petroleo-claro' : 'border-[#e2d6bf]'}`}>
          <span className="text-4xl" aria-hidden>
            ✍️
          </span>
          Escribir o pegar
          <span className="text-xs font-normal text-tinta-suave">Un cuento o una frase</span>
        </button>
      </div>

      {forma === 'pegar' && (
        <div className="flex flex-col gap-2">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" className="campo" />
          <textarea value={contenido} onChange={(e) => setContenido(e.target.value)} rows={6} placeholder="Escribe o pega aquí el texto… (una línea en blanco separa párrafos)" className="campo leading-relaxed" />
          <BotonPrincipal
            disabled={!contenido.trim() || para.size === 0}
            onClick={() => {
              agregarPegado(titulo.trim(), contenido, pedido())
              alListo()
            }}
          >
            Agregar
          </BotonPrincipal>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-tinta-suave">Nivel</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setNivel(null)} aria-pressed={nivel === null} className={`rounded-full px-3 py-1.5 font-bold ${nivel === null ? 'bg-petroleo text-white' : 'bg-crema'}`}>
            Automático
          </button>
          {NIVELES.map((n) => (
            <button key={n.nivel} onClick={() => setNivel(n.nivel)} aria-pressed={nivel === n.nivel} className={`rounded-full px-3 py-1.5 font-bold ${nivel === n.nivel ? 'bg-petroleo text-white' : 'bg-crema'}`}>
              {n.nivel} · {n.nombre}
            </button>
          ))}
        </div>
      </div>

      {perfiles.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-tinta-suave">
            Para {para.size === perfiles.length ? 'todos los alumnos' : `${para.size} de ${perfiles.length} alumnos`}
          </p>
          <div className="flex flex-wrap gap-2">
            {perfiles.map((p) => (
              <button
                key={p.id}
                aria-pressed={para.has(p.id)}
                onClick={() => {
                  const s = new Set(para)
                  if (s.has(p.id)) s.delete(p.id)
                  else s.add(p.id)
                  setPara(s)
                }}
                className={`rounded-full px-3 py-1.5 font-bold ${para.has(p.id) ? 'bg-verde text-white' : 'bg-crema text-tinta-suave'}`}
              >
                {p.icono} {p.apodo}
              </button>
            ))}
          </div>
        </div>
      )}

      {alAvanzado && (
        <button onClick={() => alAvanzado('pdf')} className="self-start text-sm font-bold text-petroleo underline underline-offset-4">
          Elegir páginas y revisar antes de agregar (opciones avanzadas)
        </button>
      )}
    </div>
  )
}
