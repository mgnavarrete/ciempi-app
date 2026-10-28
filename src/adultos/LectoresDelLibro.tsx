import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRepositorios } from '../datos/DatosProvider'
import type { Asignacion, NivelLectura, PerfilNino, Texto } from '../dominio/tipos'
import { nivelSugerido } from '../lenguaje/dificultad'
import { NIVELES } from '../lenguaje/unidades'
import { MensajeError } from '../ui/comunes'

interface Props {
  texto: Texto
  /** Los niños del adulto: a cada uno se le puede dar el libro en un nivel. */
  perfiles: PerfilNino[]
  /** Asignaciones de este libro (de cualquiera de esos niños). */
  asignaciones: Asignacion[]
  alCambiar: () => void
}

/**
 * Un botón por niño: muestra si tiene el libro y en qué nivel. Al tocarlo se
 * elige el nivel (o se quita el libro). Sirve para asignar y para compartir un
 * libro con otro niño sin volver a subirlo.
 */
export function LectoresDelLibro({ texto, perfiles, asignaciones, alCambiar }: Props) {
  const [eligiendo, setEligiendo] = useState<PerfilNino | null>(null)
  const asignacionDe = (p: PerfilNino) => asignaciones.find((a) => a.perfilId === p.id && a.textoId === texto.id)

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {perfiles.map((p) => {
          const a = asignacionDe(p)
          return (
            <button
              key={p.id}
              onClick={() => setEligiendo(p)}
              className={`rounded-full px-3 py-1 text-sm font-bold ${a ? 'bg-petroleo text-white' : 'bg-crema text-tinta-suave'}`}
            >
              {p.icono} {p.apodo} {a ? `· Nivel ${a.nivel}` : '+'}
            </button>
          )
        })}
      </div>
      {eligiendo && (
        <DialogoNivel
          texto={texto}
          perfil={eligiendo}
          asignacion={asignacionDe(eligiendo) ?? null}
          alCerrar={() => setEligiendo(null)}
          alCambiar={() => {
            setEligiendo(null)
            alCambiar()
          }}
        />
      )}
    </>
  )
}

/** Elegir en qué nivel lee un niño este libro, o quitárselo. */
export function DialogoNivel(props: { texto: Texto; perfil: PerfilNino; asignacion: Asignacion | null; alCerrar: () => void; alCambiar: () => void }) {
  const { texto, perfil, asignacion, alCerrar, alCambiar } = props
  const repos = useRepositorios()
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const sugerido = useMemo(() => nivelSugerido(texto.frases, texto.parrafos), [texto])

  const hacer = async (fn: () => Promise<unknown>) => {
    setOcupado(true)
    setError(null)
    try {
      await fn()
      alCambiar()
    } catch (e) {
      setError((e as Error).message)
      setOcupado(false)
    }
  }
  const elegir = (nivel: NivelLectura) =>
    void hacer(() => (asignacion ? repos.asignaciones.cambiarNivel(asignacion.id, nivel) : repos.asignaciones.asignar(perfil.id, texto.id, nivel)))

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-tinta/30 sm:items-center" onClick={alCerrar}>
      <div
        role="dialog"
        aria-label={`Nivel de ${texto.titulo} para ${perfil.apodo}`}
        onClick={(e) => e.stopPropagation()}
        className="aparecer flex max-h-[90dvh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-t-3xl bg-crema p-5 shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">«{texto.titulo}»</h2>
            <p className="text-sm text-tinta-suave">
              {asignacion ? `${perfil.apodo} lo tiene en nivel ${asignacion.nivel}. Elige otro nivel o quítalo.` : `¿En qué nivel lo lee ${perfil.apodo}?`}
            </p>
          </div>
          <button onClick={alCerrar} className="rounded-full px-3 py-1 font-bold text-tinta-suave">
            Cerrar
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {NIVELES.map((n) => {
            const actual = asignacion?.nivel === n.nivel
            return (
              <li key={n.nivel}>
                <button
                  disabled={ocupado || actual}
                  onClick={() => elegir(n.nivel)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ${actual ? 'bg-petroleo text-white' : 'bg-white'} disabled:cursor-default`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amarillo font-bold text-tinta">{n.nivel}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{n.nombre}</span>
                    <span className={`block text-sm ${actual ? 'text-white/85' : 'text-tinta-suave'}`}>{n.descripcion}</span>
                  </span>
                  {actual && <span className="text-sm font-bold">✓ Ahora</span>}
                  {!actual && n.nivel === sugerido && <span className="rounded-full bg-verde-claro px-2 py-0.5 text-xs font-bold text-tinta">Sugerido</span>}
                </button>
              </li>
            )
          })}
        </ul>

        {asignacion && (
          <button
            disabled={ocupado}
            onClick={() => {
              if (confirm(`¿Quitar «${texto.titulo}» de la biblioteca de ${perfil.apodo}? Se pierde su avance en este libro.`)) {
                void hacer(() => repos.asignaciones.quitar(asignacion.id))
              }
            }}
            className="self-start font-bold text-coral underline underline-offset-4"
          >
            Quitar de su biblioteca
          </button>
        )}
        <MensajeError error={error} />
      </div>
    </div>
  )
}

/** Compartir un libro con otros niños del adulto (desde la biblioteca de uno de ellos). */
export function DialogoCompartir(props: { texto: Texto; perfiles: PerfilNino[]; alCerrar: () => void; alCambiar: () => void }) {
  const { texto, perfiles, alCerrar, alCambiar } = props
  const repos = useRepositorios()
  const [asignaciones, setAsignaciones] = useState<Asignacion[] | null>(null)
  const cargar = useCallback(
    () => void Promise.all(perfiles.map((p) => repos.asignaciones.listarPorPerfil(p.id))).then((l) => setAsignaciones(l.flat())),
    [repos, perfiles],
  )
  useEffect(cargar, [cargar])

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-tinta/30 sm:items-center" onClick={alCerrar}>
      <div
        role="dialog"
        aria-label={`Compartir ${texto.titulo}`}
        onClick={(e) => e.stopPropagation()}
        className="aparecer flex w-full max-w-lg flex-col gap-3 rounded-t-3xl bg-crema p-5 shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Compartir «{texto.titulo}»</h2>
            <p className="text-sm text-tinta-suave">Toca a un niño para darle el libro en un nivel. No hay que volver a subirlo.</p>
          </div>
          <button onClick={alCerrar} className="rounded-full px-3 py-1 font-bold text-tinta-suave">
            Listo
          </button>
        </div>
        {asignaciones && (
          <LectoresDelLibro
            texto={texto}
            perfiles={perfiles}
            asignaciones={asignaciones}
            alCambiar={() => {
              cargar()
              alCambiar()
            }}
          />
        )}
      </div>
    </div>
  )
}
