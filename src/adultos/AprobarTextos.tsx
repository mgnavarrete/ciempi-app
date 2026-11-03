import { useCallback, useEffect, useState } from 'react'
import { useRepositorios } from '../datos/DatosProvider'
import type { PendienteDeAutorizar } from '../datos/repositorios'
import { BotonPrincipal, BotonSecundario, MensajeError } from '../ui/comunes'
import { DialogoPin } from './DialogoPin'

/**
 * Panel de adultos, pestaña «Alumnos»: los libros que agregaron sus niños y
 * esperan su aprobación. No se muestra si no hay ninguno (o sin servidor).
 */
export function TextosPorAprobar({ alCambiar, alIrACuenta }: { alCambiar: () => void; alIrACuenta: () => void }) {
  const repos = useRepositorios()
  const [lista, setLista] = useState<PendienteDeAutorizar[]>([])
  const [abierto, setAbierto] = useState<PendienteDeAutorizar | null>(null)
  const cargar = useCallback(async () => {
    if (repos.autorizaciones) setLista(await repos.autorizaciones.pendientes())
  }, [repos])
  useEffect(() => {
    void cargar().catch(() => {})
  }, [cargar])
  if (!lista.length) return null
  const sinPin = lista.some((p) => !p.hayPin)

  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm" aria-label="Textos por aprobar">
      <h2 className="text-xl font-bold">
        ⏳ Textos por aprobar <span className="text-base font-normal text-tinta-suave">({lista.length})</span>
      </h2>
      <p className="-mt-2 text-sm text-tinta-suave">Los agregaron tus alumnos. Ya los pueden leer; dan monedas cuando los apruebas con tu PIN.</p>
      {sinPin && (
        <p className="rounded-xl bg-amarillo/30 px-3 py-2 text-sm">
          Para aprobarlos necesitas un PIN.{' '}
          <button onClick={alIrACuenta} className="font-bold text-petroleo underline underline-offset-4">
            Créalo en «Cuenta»
          </button>
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {lista.map((p) => (
          <li key={p.asignacion.id} className="flex items-center gap-3 rounded-2xl bg-crema p-3">
            <span className="text-2xl" aria-hidden>
              {p.perfil.icono}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">«{p.texto.titulo}»</span>
              <span className="block text-sm text-tinta-suave">
                De {p.perfil.apodo} · {p.texto.frases} frases
              </span>
            </span>
            <BotonSecundario onClick={() => setAbierto(p)} className="shrink-0 px-4 py-1.5 text-base">
              Revisar
            </BotonSecundario>
          </li>
        ))}
      </ul>
      {abierto && (
        <DialogoPin
          asignacionId={abierto.asignacion.id}
          titulo={abierto.texto.titulo}
          apodo={abierto.perfil.apodo}
          muestra={abierto.texto.muestra}
          alCerrar={() => setAbierto(null)}
          alListo={() => {
            setAbierto(null)
            void cargar()
            alCambiar()
          }}
        />
      )}
    </section>
  )
}

/** Pestaña «Cuenta»: crear o cambiar el PIN con el que se aprueban los textos de los niños. */
export function PinDelAdulto() {
  const repos = useRepositorios()
  const [tienePin, setTienePin] = useState<boolean | null>(null)
  const [editando, setEditando] = useState(false)
  const [pin, setPin] = useState('')
  const [repetido, setRepetido] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  useEffect(() => {
    void repos.autorizaciones
      ?.miPin()
      .then((r) => setTienePin(r.tienePin))
      .catch(() => {})
  }, [repos])
  if (!repos.autorizaciones || tienePin === null) return null
  const autorizaciones = repos.autorizaciones
  const soloNumeros = (v: string) => v.replace(/\D/g, '')

  return (
    <div className="mt-2 flex flex-col gap-3 border-t border-[#ece3d1] pt-3">
      <p className="font-bold">🔒 PIN de adulto</p>
      <p className="-mt-2 text-sm text-tinta-suave">
        {tienePin
          ? 'Con este PIN apruebas los textos que agregan tus alumnos, aquí o en su teléfono.'
          : 'Todavía no tienes PIN. Créalo para aprobar los textos que agregan tus alumnos (mientras tanto, los pueden leer, pero no dan monedas).'}
      </p>
      {editando ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (pin !== repetido) return setError('Los dos PIN no son iguales.')
            setError(null)
            autorizaciones
              .definirPin(pin, clave)
              .then(() => {
                setTienePin(true)
                setEditando(false)
                setPin('')
                setRepetido('')
                setClave('')
                setAviso('Listo: tu PIN quedó guardado.')
              })
              .catch((err: Error) => setError(err.message))
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold text-tinta-suave">PIN nuevo (4 a 8 números)</span>
              <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={8} autoComplete="off" value={pin} onChange={(e) => setPin(soloNumeros(e.target.value))} className="campo w-40 font-mono tracking-widest" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold text-tinta-suave">Repítelo</span>
              <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={8} autoComplete="off" value={repetido} onChange={(e) => setRepetido(soloNumeros(e.target.value))} className="campo w-40 font-mono tracking-widest" />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-tinta-suave">Tu contraseña (para confirmar que eres tú)</span>
            <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" className="campo" />
          </label>
          <MensajeError error={error} />
          <div className="flex gap-3">
            <button type="button" onClick={() => setEditando(false)} className="px-3 font-bold text-tinta-suave">
              Cancelar
            </button>
            <BotonPrincipal type="submit" disabled={pin.length < 4 || !clave} className="flex-1">
              Guardar PIN
            </BotonPrincipal>
          </div>
        </form>
      ) : (
        <BotonSecundario onClick={() => setEditando(true)} className="self-start">
          {tienePin ? 'Cambiar mi PIN' : 'Crear mi PIN'}
        </BotonSecundario>
      )}
      {aviso && <p className="rounded-xl bg-verde-claro px-3 py-2 text-sm">{aviso}</p>}
    </div>
  )
}
