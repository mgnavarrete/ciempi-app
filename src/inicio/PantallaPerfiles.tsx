import { useState } from 'react'
import { useRepositorios } from '../datos/DatosProvider'
import type { PerfilNino } from '../dominio/tipos'
import { BotonIcono, BotonPrincipal, Encabezado, ICONOS_NINO, MensajeError } from '../ui/comunes'

interface Props {
  perfiles: PerfilNino[]
  alElegir: (perfil: PerfilNino) => void
  alCrear: (perfil: PerfilNino) => void
  alIrAdultos: () => void
}

/** "¿Quién va a leer?": el niño se reconoce por su ícono, sin correo ni clave. */
export function PantallaPerfiles({ perfiles, alElegir, alCrear, alIrAdultos }: Props) {
  const [creando, setCreando] = useState(perfiles.length === 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Encabezado>
        <BotonIcono etiqueta="Zona de adultos" icono="adultos" onClick={alIrAdultos} />
      </Encabezado>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-6 overflow-y-auto px-5 py-6">
        <h1 className="text-center text-3xl font-bold">¿Quién va a leer?</h1>

        <ul className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 apaisado:grid-cols-4">
          {perfiles.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => alElegir(p)}
                className="flex w-full flex-col items-center gap-2 rounded-3xl bg-white p-5 shadow-sm transition active:scale-95"
              >
                <span className="text-6xl apaisado:text-5xl" aria-hidden>
                  {p.icono}
                </span>
                <span className="text-xl font-bold">{p.apodo}</span>
                <span className="text-sm text-naranjo">🪙 {p.monedas}</span>
              </button>
            </li>
          ))}
          {!creando && (
            <li>
              <button
                onClick={() => setCreando(true)}
                className="flex h-full min-h-40 w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-[#d8cfbd] p-5 text-tinta-suave"
              >
                <span className="text-4xl">+</span>
                <span className="font-bold">Agregar niño</span>
              </button>
            </li>
          )}
        </ul>

        {creando && (
          <NuevoPerfil
            alCrear={(p) => {
              setCreando(false)
              alCrear(p)
            }}
            alCancelar={perfiles.length ? () => setCreando(false) : undefined}
          />
        )}
      </div>
    </div>
  )
}

/** Crear un lector. En línea se le crea además su acceso (usuario + clave) para que entre solo. */
export function NuevoPerfil({ alCrear, alCancelar }: { alCrear: (p: PerfilNino) => void; alCancelar?: () => void }) {
  const repos = useRepositorios()
  const [apodo, setApodo] = useState('')
  const [icono, setIcono] = useState(ICONOS_NINO[0])
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const crear = async () => {
    setGuardando(true)
    setError(null)
    try {
      const acceso = repos.enLinea ? { usuario: usuario.trim().toLowerCase(), clave } : {}
      alCrear(await repos.perfiles.crear({ apodo: apodo.trim(), icono, ...acceso }))
    } catch (e) {
      setError((e as Error).message)
      setGuardando(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void crear()
      }}
      className="flex w-full flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm"
    >
      <h2 className="text-xl font-bold">Nuevo lector</h2>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold text-tinta-suave">Apodo (sin apellido)</span>
        <input
          value={apodo}
          onChange={(e) => setApodo(e.target.value)}
          maxLength={30}
          required
          autoFocus
          className="rounded-xl border-2 border-[#e2d6bf] px-3 py-2 text-lg outline-none focus:border-petroleo"
        />
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-tinta-suave">Su ícono</legend>
        <div className="flex flex-wrap gap-2">
          {ICONOS_NINO.map((i) => (
            <button
              type="button"
              key={i}
              onClick={() => setIcono(i)}
              aria-pressed={icono === i}
              className={`grid h-14 w-14 place-items-center rounded-2xl text-3xl ${icono === i ? 'bg-petroleo-claro ring-4 ring-petroleo' : 'bg-crema'}`}
            >
              {i}
            </button>
          ))}
        </div>
      </fieldset>
      {repos.enLinea && (
        <div className="flex flex-col gap-3 rounded-2xl bg-crema p-3">
          <p className="text-sm text-tinta-suave">Con esto el niño entra a Ciempi desde su teléfono (sin correo).</p>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-tinta-suave">Usuario (letras y números, sin espacios)</span>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value.replace(/\s/g, '').toLowerCase())}
              required
              minLength={3}
              maxLength={20}
              pattern="[a-z0-9][a-z0-9._\-]{2,19}"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="campo"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-tinta-suave">Clave (mínimo 6, que la pueda recordar)</span>
            <input value={clave} onChange={(e) => setClave(e.target.value)} required minLength={6} autoComplete="off" className="campo" />
          </label>
        </div>
      )}
      <MensajeError error={error} />
      <div className="flex gap-3">
        {alCancelar && (
          <button type="button" onClick={alCancelar} className="px-4 font-bold text-tinta-suave">
            Cancelar
          </button>
        )}
        <BotonPrincipal type="submit" disabled={!apodo.trim() || guardando || (repos.enLinea && (usuario.length < 3 || clave.length < 6))} className="flex-1">
          Crear
        </BotonPrincipal>
      </div>
    </form>
  )
}
