import { useCallback, useEffect, useState } from 'react'
import { resumirProgreso } from '../biblioteca/progreso'
import { useRepositorios } from '../datos/DatosProvider'
import type { Asignacion, Cuenta, InvitacionNino, PerfilNino, SesionLectura, Texto } from '../dominio/tipos'
import type { IdFuente } from '../fuentes/entradas'
import { CambiarClave } from '../inicio/CambiarClave'
import { NuevoPerfil } from '../inicio/PantallaPerfiles'
import { BarraProgreso, BotonPrincipal, BotonSecundario, Encabezado, Icono, MensajeError, Portada } from '../ui/comunes'

interface Props {
  cuenta: Cuenta
  perfiles: PerfilNino[]
  /** Sin conexión: volver a "¿Quién va a leer?". En línea es la pantalla de inicio del adulto. */
  alVolver?: () => void
  alSalir?: () => void
  alAgregarTexto: (fuente: IdFuente, paraPerfil?: PerfilNino) => void
  alAjustesDe: (perfil: PerfilNino) => void
  alVerLibros: (perfil: PerfilNino) => void
  /** Se creó un lector nuevo o se vinculó uno existente con código. */
  alCambiarNinos: () => void
}

/** Para la terapeuta o el apoderado: sus lectores, su avance, los textos y la cuenta. */
export function PantallaAdultos({ cuenta, perfiles, alVolver, alSalir, alAgregarTexto, alAjustesDe, alVerLibros, alCambiarNinos }: Props) {
  const repos = useRepositorios()
  const [textos, setTextos] = useState<Texto[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [sesiones, setSesiones] = useState<SesionLectura[]>([])
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    const [t, a, s] = await Promise.all([
      repos.textos.listar(),
      Promise.all(perfiles.map((p) => repos.asignaciones.listarPorPerfil(p.id))).then((x) => x.flat()),
      Promise.all(perfiles.map((p) => repos.sesiones.listarPorPerfil(p.id))).then((x) => x.flat()),
    ])
    // Textos asignados por otra cuenta (p. ej. la terapeuta) también se muestran en el avance.
    const ajenos = await Promise.all(
      [...new Set(a.map((x) => x.textoId))].filter((id) => !t.some((x) => x.id === id)).map((id) => repos.textos.obtener(id)),
    )
    setTextos([...t, ...ajenos.filter((x): x is Texto => x !== null)])
    setAsignaciones(a)
    setSesiones(s)
  }, [repos, perfiles])

  useEffect(() => {
    void recargar()
  }, [recargar])

  const accion = async (fn: () => Promise<unknown>) => {
    setError(null)
    try {
      await fn()
      await recargar()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const propios = textos.filter((t) => t.subidoPor === cuenta.id)
  const [creando, setCreando] = useState(false)
  const [cambiandoClave, setCambiandoClave] = useState(false)
  const [avisoCuenta, setAvisoCuenta] = useState<string | null>(null)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Encabezado alVolver={alVolver} titulo={repos.enLinea ? `Hola, ${cuenta.nombreVisible || 'adulto'}` : 'Zona de adultos'} />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 overflow-y-auto px-5 pb-10 pt-2">
        <MensajeError error={error} />

        {/* ── Niños ───────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl font-bold">Lectores</h2>
            {!creando && <BotonSecundario onClick={() => setCreando(true)}>+ Crear lector</BotonSecundario>}
          </div>
          {creando && (
            <NuevoPerfil
              alCrear={() => {
                setCreando(false)
                alCambiarNinos()
              }}
              alCancelar={() => setCreando(false)}
            />
          )}
          {perfiles.length === 0 && !creando && (
            <p className="text-tinta-suave">Crea el primer lector: le das un usuario y una clave y entra a Ciempi desde su teléfono.</p>
          )}
          {perfiles.map((p) => (
            <TarjetaNino
              key={p.id}
              perfil={p}
              textos={textos}
              asignaciones={asignaciones.filter((a) => a.perfilId === p.id)}
              sesiones={sesiones.filter((s) => s.perfilId === p.id)}
              enLinea={repos.enLinea}
              alAjustes={() => alAjustesDe(p)}
              alVerLibros={() => alVerLibros(p)}
              alAgregarLibro={() => alAgregarTexto('pdf', p)}
              alInvitar={() => repos.perfiles.crearInvitacion(p.id)}
              alCambiarClave={(clave) => repos.perfiles.cambiarClave(p.id, clave)}
            />
          ))}
          {repos.enLinea && <CanjearCodigo alVincular={alCambiarNinos} />}
        </section>

        {/* ── Textos ──────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl font-bold">Textos y libros</h2>
            <div className="flex gap-2">
              <BotonSecundario onClick={() => alAgregarTexto('pdf')}>Subir PDF</BotonSecundario>
              <BotonSecundario onClick={() => alAgregarTexto('pegar')}>Pegar texto</BotonSecundario>
            </div>
          </div>
          <p className="-mt-2 text-sm text-tinta-suave">Los que subiste tú. Toca un lector para agregarlo o quitarlo de su biblioteca.</p>
          {propios.length === 0 && <p className="text-tinta-suave">Aún no hay textos. Sube un PDF o pega un texto.</p>}
          <ul className="flex flex-col gap-3">
            {propios.map((t) => (
              <li key={t.id} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
                <Portada titulo={t.titulo} portada={t.portada} className="h-24 w-18 shrink-0 text-2xl" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{t.titulo}</p>
                      <p className="text-sm text-tinta-suave">
                        {t.autor ? `${t.autor} · ` : ''}
                        {t.capitulos.length > 1 ? `${t.capitulos.length} capítulos · ` : ''}
                        {t.frases.length} frases
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar «${t.titulo}»? También se quita de la biblioteca de los niños y se pierde su avance.`)) {
                          void accion(() => repos.textos.eliminar(t.id))
                        }
                      }}
                      aria-label={`Eliminar ${t.titulo}`}
                      className="shrink-0 rounded-full p-2 text-tinta-suave hover:text-coral"
                    >
                      <Icono nombre="basura" className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {perfiles.map((p) => {
                      const asignada = asignaciones.find((a) => a.perfilId === p.id && a.textoId === t.id)
                      return (
                        <button
                          key={p.id}
                          aria-pressed={!!asignada}
                          onClick={() => void accion(() => (asignada ? repos.asignaciones.quitar(asignada.id) : repos.asignaciones.asignar(p.id, t.id)))}
                          className={`rounded-full px-3 py-1 text-sm font-bold ${asignada ? 'bg-petroleo text-white' : 'bg-crema text-tinta-suave'}`}
                        >
                          {p.icono} {p.apodo} {asignada ? '✓' : '+'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Cuenta ──────────────────────────────────────────── */}
        <section className="flex flex-col gap-2 rounded-2xl bg-white p-4">
          <h2 className="text-lg font-bold">Cuenta</h2>
          {repos.enLinea ? (
            <>
              <p>
                {cuenta.nombreVisible} · <span className="text-tinta-suave">{cuenta.correo}</span>
              </p>
              {cambiandoClave ? (
                <CambiarClave
                  alTerminar={() => {
                    setCambiandoClave(false)
                    setAvisoCuenta('Listo: tu contraseña quedó cambiada.')
                  }}
                  alCancelar={() => setCambiandoClave(false)}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  <BotonSecundario onClick={() => setCambiandoClave(true)}>Cambiar mi contraseña</BotonSecundario>
                  {alSalir && (
                    <button
                      onClick={() => confirm('¿Cerrar sesión en este dispositivo?') && alSalir()}
                      className="flex items-center gap-2 rounded-full border-2 border-coral px-4 py-2 font-bold text-coral"
                    >
                      <Icono nombre="salir" className="h-5 w-5" /> Cerrar sesión
                    </button>
                  )}
                </div>
              )}
              {avisoCuenta && <p className="rounded-xl bg-verde-claro px-3 py-2 text-sm">{avisoCuenta}</p>}
            </>
          ) : (
            <p className="text-sm text-tinta-suave">
              Modo sin conexión: los datos quedan guardados solo en este dispositivo. Para compartir niños entre la terapeuta y la casa
              se necesita conectar la app al servidor de Ciempi (ver README).
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

function TarjetaNino(props: {
  perfil: PerfilNino
  textos: Texto[]
  asignaciones: Asignacion[]
  sesiones: SesionLectura[]
  enLinea: boolean
  alAjustes: () => void
  alVerLibros: () => void
  alAgregarLibro: () => void
  alInvitar: () => Promise<InvitacionNino>
  alCambiarClave: (clave: string) => Promise<void>
}) {
  const { perfil, sesiones } = props
  const [invitacion, setInvitacion] = useState<InvitacionNino | null>(null)
  const [nuevaClave, setNuevaClave] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hace7Dias = Date.now() - 7 * 24 * 3600 * 1000
  const semana = sesiones.filter((s) => new Date(s.iniciadaEn).getTime() > hace7Dias)
  const minutos = Math.round(semana.reduce((n, s) => n + s.duracionSegundos, 0) / 60)
  const frases = semana.reduce((n, s) => n + s.frasesCompletadas, 0)
  const rapidas = semana.reduce((n, s) => n + s.frasesMuyRapido, 0)
  const segundos = semana.reduce((n, s) => n + s.duracionSegundos, 0)
  const velocidad = segundos ? (semana.reduce((n, s) => n + s.silabasLeidas, 0) / segundos).toFixed(1) : '–'

  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-4xl" aria-hidden>
          {perfil.icono}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">{perfil.apodo}</p>
          <p className="text-sm text-tinta-suave">
            🪙 {perfil.monedas}
            {perfil.usuario && (
              <>
                {' · '}usuario <span className="font-mono font-bold text-tinta">{perfil.usuario}</span>
              </>
            )}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <BotonPrincipal onClick={props.alVerLibros} className="px-4 py-1.5 text-base">
          Leer con {perfil.apodo}
        </BotonPrincipal>
        <BotonSecundario onClick={props.alAgregarLibro} className="px-3 py-1.5 text-sm">
          Agregar libro
        </BotonSecundario>
        <BotonSecundario onClick={props.alAjustes} className="px-3 py-1.5 text-sm">
          Ajustes
        </BotonSecundario>
      </div>

      <p className="rounded-xl bg-crema px-3 py-2 text-sm">
        <span className="font-bold">Últimos 7 días:</span> {minutos} min · {frases} frases · {rapidas} 🐢 · {velocidad} síl/s
      </p>

      {props.asignaciones.length > 0 && (
        <ul className="flex flex-col gap-2">
          {props.asignaciones.map((a) => {
            const texto = props.textos.find((t) => t.id === a.textoId)
            if (!texto) return null
            const r = resumirProgreso(a, texto)
            return (
              <li key={a.id} className="flex flex-col gap-1">
                <span className="flex justify-between gap-2 text-sm">
                  <span className="truncate font-bold">{texto.titulo}</span>
                  <span className="shrink-0 text-tinta-suave">{r.etiqueta}</span>
                </span>
                <BarraProgreso valor={r.fraccion} />
              </li>
            )
          })}
        </ul>
      )}

      {props.enLinea && perfil.tieneCuenta && (
        <div className="flex flex-col gap-2">
          {nuevaClave === null ? (
            <button onClick={() => setNuevaClave('')} className="self-start text-sm font-bold text-petroleo underline underline-offset-4">
              Cambiar su clave
            </button>
          ) : (
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                setError(null)
                props
                  .alCambiarClave(nuevaClave)
                  .then(() => {
                    setAviso(`Listo: la nueva clave de ${perfil.apodo} es «${nuevaClave}».`)
                    setNuevaClave(null)
                  })
                  .catch((err: Error) => setError(err.message))
              }}
            >
              <input
                value={nuevaClave}
                onChange={(e) => setNuevaClave(e.target.value)}
                minLength={6}
                required
                placeholder="Nueva clave"
                autoComplete="off"
                className="campo w-44 py-1.5"
              />
              <BotonPrincipal type="submit" disabled={nuevaClave.length < 6} className="px-4 py-1.5 text-base">
                Guardar
              </BotonPrincipal>
              <button type="button" onClick={() => setNuevaClave(null)} className="text-sm font-bold text-tinta-suave">
                Cancelar
              </button>
            </form>
          )}
          {aviso && <p className="rounded-xl bg-verde-claro px-3 py-2 text-sm">{aviso}</p>}
        </div>
      )}

      {props.enLinea && (
        <div className="flex flex-col gap-2">
          {invitacion ? (
            <p className="rounded-xl bg-petroleo-claro px-3 py-2 text-sm">
              Código para vincular otra cuenta: <span className="font-mono text-lg font-bold tracking-widest">{invitacion.codigo}</span>
              <br />
              Vence el {new Date(invitacion.expiraEn).toLocaleDateString('es-CL')}. Se ingresa en «Zona de adultos → Vincular con código».
            </p>
          ) : (
            <button
              onClick={() =>
                props
                  .alInvitar()
                  .then(setInvitacion)
                  .catch((e: Error) => setError(e.message))
              }
              className="self-start text-sm font-bold text-petroleo underline underline-offset-4"
            >
              Invitar a otro adulto (apoderado o terapeuta)
            </button>
          )}
          <MensajeError error={error} />
        </div>
      )}
    </article>
  )
}

function CanjearCodigo({ alVincular }: { alVincular: (perfil: PerfilNino) => void }) {
  const repos = useRepositorios()
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)
        repos.perfiles
          .canjearInvitacion(codigo.trim().toUpperCase())
          .then((p) => {
            setCodigo('')
            alVincular(p)
          })
          .catch((err: Error) => setError(err.message))
      }}
      className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-[#d8cfbd] p-4"
    >
      <label htmlFor="codigo" className="font-bold">
        Vincular con código
      </label>
      <p className="-mt-1 text-sm text-tinta-suave">Si otro adulto ya creó el perfil del niño, ingresa el código que te dio.</p>
      <div className="flex gap-2">
        <input
          id="codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="ABC123"
          autoCapitalize="characters"
          className="campo w-40 font-mono uppercase tracking-widest"
        />
        <BotonPrincipal type="submit" disabled={codigo.trim().length < 6} className="py-2">
          Vincular
        </BotonPrincipal>
      </div>
      <MensajeError error={error} />
    </form>
  )
}
