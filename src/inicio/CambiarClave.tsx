import { useState } from 'react'
import { useRepositorios } from '../datos/DatosProvider'
import { BotonPrincipal, MensajeError } from '../ui/comunes'

/**
 * Formulario para que el adulto elija una contraseña nueva: al llegar desde
 * el enlace de "recuperar contraseña" o desde Ajustes de su cuenta.
 */
export function CambiarClave({ alTerminar, alCancelar }: { alTerminar: () => void; alCancelar?: () => void }) {
  const repos = useRepositorios()
  const [clave, setClave] = useState('')
  const [repetida, setRepetida] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (clave !== repetida) return setError('Las dos contraseñas no son iguales.')
        setGuardando(true)
        setError(null)
        repos.auth
          .cambiarMiClave(clave)
          .then(alTerminar)
          .catch((err: Error) => {
            setError(err.message)
            setGuardando(false)
          })
      }}
      className="flex flex-col gap-3"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold text-tinta-suave">Contraseña nueva</span>
        <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} required minLength={8} autoComplete="new-password" className="campo" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold text-tinta-suave">Repítela</span>
        <input type="password" value={repetida} onChange={(e) => setRepetida(e.target.value)} required minLength={8} autoComplete="new-password" className="campo" />
      </label>
      <MensajeError error={error} />
      <div className="flex gap-3">
        {alCancelar && (
          <button type="button" onClick={alCancelar} className="px-3 font-bold text-tinta-suave">
            Cancelar
          </button>
        )}
        <BotonPrincipal type="submit" disabled={guardando || clave.length < 8} className="flex-1">
          Guardar contraseña
        </BotonPrincipal>
      </div>
    </form>
  )
}

/** Pantalla completa al volver desde el enlace del correo. */
export function PantallaNuevaClave({ alTerminar }: { alTerminar: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-8">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <img src="/ciempi-long.svg" alt="Ciempi" className="mx-auto w-full max-w-[14rem]" />
        <h1 className="text-center text-3xl font-bold">Crea tu contraseña nueva</h1>
        <p className="-mt-2 text-center text-tinta-suave">Mínimo 8 caracteres. Después entras directo a tu panel.</p>
        <CambiarClave alTerminar={alTerminar} />
      </div>
    </div>
  )
}
