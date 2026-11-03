import { useState } from 'react'
import { useRepositorios } from '../datos/DatosProvider'
import type { Asignacion, Id } from '../dominio/tipos'
import { BotonPrincipal, MensajeError } from '../ui/comunes'

/**
 * Un adulto aprueba (o no) con su PIN un libro que agregó el niño. Sirve en
 * el dispositivo del niño y en el panel del adulto: el PIN lo verifica el
 * servidor, que también limita los intentos. Mismo estilo que DialogoNivel.
 */
export function DialogoPin(props: {
  asignacionId: Id
  titulo: string
  apodo: string
  /** Las primeras frases, para que el adulto vea qué está aprobando. */
  muestra?: string[]
  alCerrar: () => void
  alListo: (a: Asignacion) => void
}) {
  const repos = useRepositorios()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const autorizaciones = repos.autorizaciones
  if (!autorizaciones) return null

  const hacer = (fn: () => Promise<Asignacion>) => {
    setOcupado(true)
    setError(null)
    fn()
      .then(props.alListo)
      .catch((e: Error) => {
        setError(e.message)
        setPin('')
        setOcupado(false)
      })
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-tinta/30 sm:items-center" onClick={props.alCerrar}>
      <form
        role="dialog"
        aria-label={`Aprobar «${props.titulo}»`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          hacer(() => autorizaciones.autorizar(props.asignacionId, pin))
        }}
        className="aparecer flex max-h-[90dvh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-t-3xl bg-crema p-5 shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">«{props.titulo}»</h2>
            <p className="text-sm text-tinta-suave">Lo agregó {props.apodo}. Se puede leer desde ya; da monedas cuando un adulto lo aprueba con su PIN.</p>
          </div>
          <button type="button" onClick={props.alCerrar} className="rounded-full px-3 py-1 font-bold text-tinta-suave">
            Cerrar
          </button>
        </div>
        {props.muestra && props.muestra.length > 0 && <blockquote className="rounded-2xl bg-white px-4 py-3 text-sm leading-relaxed text-tinta">{props.muestra.join(' ')}…</blockquote>}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold text-tinta-suave">PIN del adulto</span>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="campo w-44 text-center font-mono text-2xl tracking-[0.4em]"
          />
        </label>
        <MensajeError error={error} />
        <div className="flex flex-wrap items-center gap-3">
          <BotonPrincipal type="submit" disabled={ocupado || pin.length < 4} className="flex-1">
            Aprobar
          </BotonPrincipal>
          <button
            type="button"
            disabled={ocupado || pin.length < 4}
            onClick={() => hacer(() => autorizaciones.rechazar(props.asignacionId, pin))}
            className="px-3 font-bold text-coral disabled:opacity-40"
          >
            No aprobar
          </button>
        </div>
        <p className="text-xs text-tinta-suave">¿Sin PIN todavía? Se crea en el panel de adultos, en «Cuenta», con tu contraseña.</p>
      </form>
    </div>
  )
}
