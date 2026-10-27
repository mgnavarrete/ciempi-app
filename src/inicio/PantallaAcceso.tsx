import { useState } from 'react'
import { useRepositorios } from '../datos/DatosProvider'
import type { RolCuenta } from '../dominio/tipos'
import { BotonPrincipal, MensajeError } from '../ui/comunes'

type Modo = 'lector' | 'adulto' | 'registro' | 'recuperar'

/**
 * Entrada a la app. Lo normal es que entre el niño (su usuario y clave, sin
 * correo); los adultos entran o crean su cuenta en la otra pestaña.
 */
export function PantallaAcceso() {
  const repos = useRepositorios()
  const [modo, setModo] = useState<Modo>('lector')
  const [usuario, setUsuario] = useState('')
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState<RolCuenta>('apoderado')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const enviar = async () => {
    setEnviando(true)
    setError(null)
    try {
      if (modo === 'recuperar') {
        await repos.auth.enviarRecuperacion(correo)
        setAviso(`Listo: te mandamos un correo a ${correo.trim()} con un enlace para crear una contraseña nueva (si no llega, revisa la carpeta de spam).`)
        setEnviando(false)
        return
      }
      if (modo === 'lector') await repos.auth.iniciarSesionNino(usuario, clave)
      else if (modo === 'adulto') await repos.auth.iniciarSesionAdulto(correo, clave)
      else await repos.auth.registrarse({ correo: correo.trim(), clave, nombreVisible: nombre.trim(), rol })
      // La sesión nueva llega por auth.alCambiar y la app cambia de pantalla.
    } catch (e) {
      setError((e as Error).message)
      setEnviando(false)
    }
  }

  const cambiarModo = (m: Modo) => {
    setModo(m)
    setError(null)
    setAviso(null)
    setClave('')
  }

  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-8">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void enviar()
        }}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <img src="/ciempi-long.svg" alt="Ciempi" className="mx-auto w-full max-w-[18rem] apaisado:max-w-[11rem]" />

        <div className="grid grid-cols-2 gap-1 rounded-full bg-arena p-1" role="tablist">
          {(
            [
              ['lector', 'Soy lector'],
              ['adulto', 'Soy adulto'],
            ] as const
          ).map(([m, etiqueta]) => {
            const activo = modo === m || (m === 'adulto' && (modo === 'registro' || modo === 'recuperar'))
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => cambiarModo(m)}
                className={`rounded-full py-2 font-bold ${activo ? 'bg-white text-petroleo shadow-sm' : 'text-tinta-suave'}`}
              >
                {etiqueta}
              </button>
            )
          })}
        </div>

        <h1 className="text-center text-3xl font-bold">
          {modo === 'lector'
            ? '¡Hola! ¿Quién eres?'
            : modo === 'adulto'
              ? 'Entrar como adulto'
              : modo === 'recuperar'
                ? 'Recuperar contraseña'
                : 'Crear cuenta de adulto'}
        </h1>
        {modo === 'recuperar' && (
          <p className="-mt-2 text-center text-tinta-suave">Escribe tu correo y te mandamos un enlace para crear una contraseña nueva.</p>
        )}

        {modo === 'lector' ? (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-tinta-suave">Tu usuario</span>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="campo text-2xl"
            />
          </label>
        ) : (
          <>
            {modo === 'registro' && (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-tinta-suave">Tu nombre</span>
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoComplete="name" className="campo" />
                </label>
                <fieldset className="flex min-w-0 gap-2">
                  <legend className="mb-1 text-sm font-bold text-tinta-suave">Soy</legend>
                  {(['apoderado', 'terapeuta'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={rol === r}
                      onClick={() => setRol(r)}
                      className={`flex-1 rounded-full px-3 py-2 text-sm font-bold ${rol === r ? 'bg-petroleo text-white' : 'bg-white text-tinta-suave'}`}
                    >
                      {r === 'apoderado' ? 'Mamá, papá o apoderado' : 'Terapeuta o profesor'}
                    </button>
                  ))}
                </fieldset>
              </>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-bold text-tinta-suave">Correo</span>
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required autoComplete="email" className="campo" />
            </label>
          </>
        )}

        {modo !== 'recuperar' && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-tinta-suave">{modo === 'lector' ? 'Tu clave' : 'Contraseña'}</span>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              minLength={6}
              autoComplete={modo === 'registro' ? 'new-password' : 'current-password'}
              className={`campo ${modo === 'lector' ? 'text-2xl' : ''}`}
            />
          </label>
        )}

        <MensajeError error={error} />
        {aviso && (
          <p role="status" className="rounded-xl bg-verde-claro px-4 py-3">
            {aviso}
          </p>
        )}
        <BotonPrincipal type="submit" disabled={enviando}>
          {modo === 'registro' ? 'Crear cuenta' : modo === 'recuperar' ? 'Enviar enlace' : 'Entrar'}
        </BotonPrincipal>

        {modo === 'lector' && (
          <p className="text-center text-sm text-tinta-suave">
            ¿No tienes usuario o se te olvidó la clave? Pídele ayuda a tu mamá, papá o profe.
          </p>
        )}
        {modo === 'adulto' && (
          <button type="button" onClick={() => cambiarModo('recuperar')} className="text-sm font-bold text-tinta-suave underline underline-offset-4">
            ¿Olvidaste tu contraseña?
          </button>
        )}
        {modo !== 'lector' && (
          <button
            type="button"
            onClick={() => cambiarModo(modo === 'adulto' ? 'registro' : 'adulto')}
            className="font-bold text-petroleo underline underline-offset-4"
          >
            {modo === 'adulto' ? 'No tengo cuenta: crear una' : 'Ya tengo cuenta: entrar'}
          </button>
        )}
      </form>
    </div>
  )
}
