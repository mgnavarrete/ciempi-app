import { useCallback, useEffect, useMemo, useState } from 'react'
import { AjustesSonido } from '../audio/AjustesSonido'
import { resumirProgreso } from '../biblioteca/progreso'
import { CiempiPersonaje } from '../ciempi/CiempiPersonaje'
import { FondoTema } from '../ciempi/dibujos'
import { MiniaturaCiempi } from '../ciempi/v2/Miniatura'
import { CUENTOS } from '../contenido/cuentos'
import { useRepositorios } from '../datos/DatosProvider'
import type { Asignacion, Cuenta, Id, InvitacionNino, NivelLectura, PerfilNino, SesionLectura, Texto } from '../dominio/tipos'
import type { IdFuente } from '../fuentes/entradas'
import { CambiarClave } from '../inicio/CambiarClave'
import { NuevoPerfil } from '../inicio/PantallaPerfiles'
import { nivelSugerido } from '../lenguaje/dificultad'
import { NIVELES } from '../lenguaje/unidades'
import { BarraProgreso, BotonPrincipal, BotonSecundario, Encabezado, Icono, MensajeError, Portada } from '../ui/comunes'
import { AgregarLibro, TarjetaCarga } from './AgregarLibro'
import { useCargasDeLibros } from './cargas'
import { LectoresDelLibro } from './LectoresDelLibro'

interface Props {
  cuenta: Cuenta
  perfiles: PerfilNino[]
  /** Sin conexión: volver a "¿Quién va a leer?". En línea es la pantalla de inicio del adulto. */
  alVolver?: () => void
  alSalir?: () => void
  /** Agregar un texto revisándolo página por página (opciones avanzadas). */
  alAgregarTexto: (fuente: IdFuente, paraPerfil?: PerfilNino) => void
  alAjustesDe: (perfil: PerfilNino) => void
  /** Sus libros y niveles (la biblioteca del alumno vista por el adulto). */
  alVerLibros: (perfil: PerfilNino) => void
  /** Entrar a la sesión del alumno, como si fuera él. */
  alLeerCon: (perfil: PerfilNino) => void
  /** Se creó un lector nuevo o se vinculó uno existente con código. */
  alCambiarNinos: () => void
}

type Pestana = 'alumnos' | 'libros' | 'cuenta'
const PESTANAS: { id: Pestana; nombre: string; emoji: string }[] = [
  { id: 'alumnos', nombre: 'Alumnos', emoji: '🧒' },
  { id: 'libros', nombre: 'Libros', emoji: '📚' },
  { id: 'cuenta', nombre: 'Cuenta', emoji: '⚙️' },
]

const SEMANA_MS = 7 * 24 * 3600 * 1000

/** Para la terapeuta o el apoderado: sus alumnos en tarjetas, los libros por nivel y la cuenta. */
export function PantallaAdultos({ cuenta, perfiles, alVolver, alSalir, alAgregarTexto, alAjustesDe, alVerLibros, alLeerCon, alCambiarNinos }: Props) {
  const repos = useRepositorios()
  const { cargas } = useCargasDeLibros()
  const [pestana, setPestana] = useState<Pestana>('alumnos')
  const [abierto, setAbierto] = useState<Id | null>(null)
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

  // Al terminar de cargar un libro, aparece en la lista (y en las bibliotecas).
  const listos = cargas.filter((c) => c.estado === 'listo').length
  useEffect(() => {
    void recargar().catch((e: Error) => setError(e.message))
  }, [recargar, listos])

  const alumno = perfiles.find((p) => p.id === abierto)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Encabezado alVolver={alumno ? () => setAbierto(null) : alVolver} titulo={alumno ? alumno.apodo : repos.enLinea ? `Hola, ${cuenta.nombreVisible || 'adulto'}` : 'Zona de adultos'} />
      {!alumno && (
        <nav className="mx-auto grid w-full max-w-3xl shrink-0 grid-cols-3 gap-2 px-5 pb-2" role="tablist" aria-label="Secciones">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={pestana === p.id}
              onClick={() => setPestana(p.id)}
              className={`flex items-center justify-center gap-2 rounded-2xl py-2.5 text-lg font-bold ${pestana === p.id ? 'bg-petroleo text-white shadow-md' : 'bg-white text-tinta shadow-sm'}`}
            >
              <span aria-hidden>{p.emoji}</span> {p.nombre}
              {p.id === 'libros' && cargas.some((c) => c.estado === 'cargando') && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-naranjo" aria-label="cargando" />}
            </button>
          ))}
        </nav>
      )}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 overflow-y-auto px-5 pb-10 pt-2">
        <MensajeError error={error} />
        {alumno ? (
          <PerfilAlumno
            perfil={alumno}
            perfiles={perfiles}
            usuarioId={cuenta.id}
            textos={textos}
            asignaciones={asignaciones.filter((a) => a.perfilId === alumno.id)}
            sesiones={sesiones.filter((s) => s.perfilId === alumno.id)}
            enLinea={repos.enLinea}
            alLeer={() => alLeerCon(alumno)}
            alAjustes={() => alAjustesDe(alumno)}
            alVerLibros={() => alVerLibros(alumno)}
            alInvitar={() => repos.perfiles.crearInvitacion(alumno.id)}
            alCambiarClave={(clave) => repos.perfiles.cambiarClave(alumno.id, clave)}
          />
        ) : pestana === 'alumnos' ? (
          <Alumnos perfiles={perfiles} sesiones={sesiones} asignaciones={asignaciones} enLinea={repos.enLinea} alAbrir={(p) => setAbierto(p.id)} alLeerCon={alLeerCon} alCambiarNinos={alCambiarNinos} />
        ) : pestana === 'libros' ? (
          <Libros
            cuenta={cuenta}
            perfiles={perfiles}
            textos={textos}
            asignaciones={asignaciones}
            alAvanzado={(f) => alAgregarTexto(f)}
            alCambiar={() => void recargar()}
            alEliminar={(t) => {
              setError(null)
              repos.textos
                .eliminar(t.id)
                .then(recargar)
                .catch((e: Error) => setError(e.message))
            }}
          />
        ) : (
          <CuentaAdulto cuenta={cuenta} alSalir={alSalir} enLinea={repos.enLinea} />
        )}
      </div>
    </div>
  )
}

// ── Alumnos ─────────────────────────────────────────────────────────────

function Alumnos(props: {
  perfiles: PerfilNino[]
  sesiones: SesionLectura[]
  asignaciones: Asignacion[]
  enLinea: boolean
  alAbrir: (p: PerfilNino) => void
  alLeerCon: (p: PerfilNino) => void
  alCambiarNinos: () => void
}) {
  const [creando, setCreando] = useState(false)
  const desde = Date.now() - SEMANA_MS
  return (
    <section className="flex flex-col gap-4">
      {creando ? (
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-xl font-bold">Nuevo alumno</h2>
          <NuevoPerfil
            alCrear={() => {
              setCreando(false)
              props.alCambiarNinos()
            }}
            alCancelar={() => setCreando(false)}
          />
        </div>
      ) : (
        props.perfiles.length === 0 && <p className="text-lg text-tinta-suave">Crea tu primer alumno: le das un usuario y una clave y entra a Ciempi desde su teléfono.</p>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {props.perfiles.map((p) => {
          const minutos = Math.round(props.sesiones.filter((s) => s.perfilId === p.id && new Date(s.iniciadaEn).getTime() > desde).reduce((n, s) => n + s.duracionSegundos, 0) / 60)
          const libros = props.asignaciones.filter((a) => a.perfilId === p.id).length
          return (
            <li key={p.id} className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm">
              <button onClick={() => props.alAbrir(p)} className="flex flex-col text-left active:scale-[0.98]" aria-label={`Ver a ${p.apodo}`}>
                <div className="relative h-28 overflow-hidden">
                  <FondoTema fondo={p.ciempi.fondo} />
                  <MiniaturaCiempi apariencia={p.ciempi} categoria="conjunto" className="absolute inset-x-2 bottom-1 h-24" />
                </div>
                <div className="flex flex-col px-3 pt-2">
                  <span className="truncate text-lg font-bold">
                    <span aria-hidden>{p.icono}</span> {p.apodo}
                  </span>
                  <span className="text-sm text-tinta-suave">
                    🪙 {p.monedas} · ⏱ {minutos} min · 📚 {libros}
                  </span>
                </div>
              </button>
              <button onClick={() => props.alLeerCon(p)} className="m-3 mt-2 rounded-full bg-petroleo py-2 font-bold text-white active:scale-95">
                ▶ Leer con {p.apodo}
              </button>
            </li>
          )
        })}
        {!creando && (
          <li>
            <button
              onClick={() => setCreando(true)}
              className="flex h-full min-h-48 w-full flex-col items-center justify-center gap-2 rounded-3xl border-4 border-dashed border-petroleo/40 bg-white/60 p-4 font-bold text-petroleo active:scale-95"
            >
              <span className="text-5xl" aria-hidden>
                ＋
              </span>
              Agregar alumno
            </button>
          </li>
        )}
      </ul>
      {props.enLinea && <CanjearCodigo alVincular={props.alCambiarNinos} />}
    </section>
  )
}

function PerfilAlumno(props: {
  perfil: PerfilNino
  perfiles: PerfilNino[]
  usuarioId: Id
  textos: Texto[]
  asignaciones: Asignacion[]
  sesiones: SesionLectura[]
  enLinea: boolean
  alLeer: () => void
  alAjustes: () => void
  alVerLibros: () => void
  alInvitar: () => Promise<InvitacionNino>
  alCambiarClave: (clave: string) => Promise<void>
}) {
  const { perfil, sesiones } = props
  const [invitacion, setInvitacion] = useState<InvitacionNino | null>(null)
  const [nuevaClave, setNuevaClave] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [agregando, setAgregando] = useState(false)
  const { cargas, descartar } = useCargasDeLibros()

  const desde = Date.now() - SEMANA_MS
  const semana = sesiones.filter((s) => new Date(s.iniciadaEn).getTime() > desde)
  const segundos = semana.reduce((n, s) => n + s.duracionSegundos, 0)
  const frases = semana.reduce((n, s) => n + s.frasesCompletadas, 0)
  const rapidas = semana.reduce((n, s) => n + s.frasesMuyRapido, 0)
  const velocidad = segundos ? (semana.reduce((n, s) => n + s.silabasLeidas, 0) / segundos).toFixed(1) : '–'

  return (
    <section className="flex flex-col gap-4">
      <div className="relative h-56 shrink-0 overflow-hidden rounded-3xl shadow-sm">
        <FondoTema fondo={perfil.ciempi.fondo} />
        <div className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto w-[min(80%,380px)]">
          <CiempiPersonaje apariencia={perfil.ciempi} ancho="100%" animado={!perfil.ajustes.modoTranquilo} accion={{ id: 'A04', n: 1 }} />
        </div>
        <p className="absolute left-3 top-3 rounded-2xl bg-white/95 px-3 py-1.5 shadow-sm">
          <span className="font-bold">
            {perfil.icono} {perfil.apodo}
          </span>
          <span className="text-tinta-suave"> · 🪙 {perfil.monedas}</span>
          {perfil.usuario && <span className="block text-sm text-tinta-suave">usuario <span className="font-mono font-bold text-tinta">{perfil.usuario}</span></span>}
        </p>
      </div>

      <BotonPrincipal onClick={props.alLeer} className="py-4 text-xl">
        ▶ Leer con {perfil.apodo}
      </BotonPrincipal>
      <p className="-mt-2 text-center text-sm text-tinta-suave">Entras a su sesión: lee, personaliza a su Ciempi, ve el tutorial y cambia sus ajustes, igual que él.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <BotonSecundario onClick={() => setAgregando(!agregando)}>＋ Agregar libro</BotonSecundario>
        <BotonSecundario onClick={props.alVerLibros}>📚 Sus libros y niveles</BotonSecundario>
        <BotonSecundario onClick={props.alAjustes}>⚙️ Sus ajustes</BotonSecundario>
      </div>
      {agregando && <AgregarLibro perfiles={props.perfiles} elegidos={[perfil.id]} usuarioId={props.usuarioId} alListo={() => setAgregando(false)} />}
      {cargas
        .filter((c) => c.perfiles.includes(perfil.id))
        .map((c) => (
          <ul key={c.id}>
            <TarjetaCarga carga={c} alDescartar={() => descartar(c.id)} />
          </ul>
        ))}

      <div className="grid grid-cols-4 gap-2 rounded-2xl bg-white p-3 text-center shadow-sm">
        <p className="col-span-4 text-left text-sm font-bold text-tinta-suave">Últimos 7 días</p>
        {[
          [Math.round(segundos / 60), 'minutos'],
          [frases, 'frases'],
          [rapidas, '🐢 rápidas'],
          [velocidad, 'sílabas/s'],
        ].map(([n, etiqueta]) => (
          <p key={etiqueta} className="flex flex-col">
            <span className="text-2xl font-bold text-petroleo">{n}</span>
            <span className="text-xs text-tinta-suave">{etiqueta}</span>
          </p>
        ))}
      </div>

      {props.asignaciones.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-sm font-bold text-tinta-suave">Cómo va en sus libros</p>
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
        </div>
      )}

      {props.enLinea && (
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm">
          {perfil.tieneCuenta &&
            (nuevaClave === null ? (
              <button onClick={() => setNuevaClave('')} className="self-start font-bold text-petroleo underline underline-offset-4">
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
                <input value={nuevaClave} onChange={(e) => setNuevaClave(e.target.value)} minLength={6} required placeholder="Nueva clave" autoComplete="off" className="campo w-44 py-1.5" />
                <BotonPrincipal type="submit" disabled={nuevaClave.length < 6} className="px-4 py-1.5 text-base">
                  Guardar
                </BotonPrincipal>
                <button type="button" onClick={() => setNuevaClave(null)} className="text-sm font-bold text-tinta-suave">
                  Cancelar
                </button>
              </form>
            ))}
          {aviso && <p className="rounded-xl bg-verde-claro px-3 py-2 text-sm">{aviso}</p>}
          {invitacion ? (
            <p className="rounded-xl bg-petroleo-claro px-3 py-2 text-sm">
              Código para vincular otra cuenta: <span className="font-mono text-lg font-bold tracking-widest">{invitacion.codigo}</span>
              <br />
              Vence el {new Date(invitacion.expiraEn).toLocaleDateString('es-CL')}. Se ingresa en «Alumnos → Vincular con código».
            </p>
          ) : (
            <button
              onClick={() =>
                props
                  .alInvitar()
                  .then(setInvitacion)
                  .catch((e: Error) => setError(e.message))
              }
              className="self-start font-bold text-petroleo underline underline-offset-4"
            >
              Invitar a otro adulto (apoderado o terapeuta)
            </button>
          )}
          <MensajeError error={error} />
        </div>
      )}
    </section>
  )
}

// ── Libros ──────────────────────────────────────────────────────────────

/** El nivel con que se lee un libro: el de la mayoría de sus alumnos, o el sugerido. */
function nivelDe(t: Texto, asignaciones: Asignacion[]): NivelLectura {
  const cuento = CUENTOS.find((c) => c.id === t.id)
  if (cuento) return cuento.nivel
  const conteo = new Map<NivelLectura, number>()
  for (const a of asignaciones) if (a.textoId === t.id && a.nivel !== undefined) conteo.set(a.nivel, (conteo.get(a.nivel) ?? 0) + 1)
  const masUsado = [...conteo].sort((x, y) => y[1] - x[1])[0]
  return masUsado ? masUsado[0] : nivelSugerido(t.frases, t.parrafos)
}

function Libros(props: {
  cuenta: Cuenta
  perfiles: PerfilNino[]
  textos: Texto[]
  asignaciones: Asignacion[]
  alAvanzado: (fuente: IdFuente) => void
  alCambiar: () => void
  alEliminar: (t: Texto) => void
}) {
  const { cargas, descartar } = useCargasDeLibros()
  const [agregando, setAgregando] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'mios' | NivelLectura>('todos')
  const [elegido, setElegido] = useState<Id | null>(null)
  const libros = useMemo(
    () =>
      props.textos
        .map((t) => ({ texto: t, nivel: nivelDe(t, props.asignaciones), lectores: props.asignaciones.filter((a) => a.textoId === t.id).length }))
        .sort((a, b) => Number(b.texto.origen !== 'ciempi') - Number(a.texto.origen !== 'ciempi') || a.nivel - b.nivel),
    [props.textos, props.asignaciones],
  )
  const visibles = libros.filter((l) => (filtro === 'todos' ? true : filtro === 'mios' ? l.texto.subidoPor === props.cuenta.id && l.texto.origen !== 'ciempi' : l.nivel === filtro))
  const abierto = libros.find((l) => l.texto.id === elegido)

  return (
    <section className="flex flex-col gap-4">
      {agregando ? (
        <AgregarLibro perfiles={props.perfiles} usuarioId={props.cuenta.id} alListo={() => setAgregando(false)} alAvanzado={props.alAvanzado} />
      ) : (
        <button onClick={() => setAgregando(true)} className="flex items-center justify-center gap-2 rounded-3xl bg-naranjo py-4 text-xl font-bold text-white shadow-md active:scale-95">
          <span aria-hidden>＋</span> Agregar libro
        </button>
      )}

      {cargas.length > 0 && (
        <ul className="flex flex-col gap-2">
          {cargas.map((c) => (
            <TarjetaCarga key={c.id} carga={c} alDescartar={() => descartar(c.id)} />
          ))}
        </ul>
      )}

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="Filtrar libros">
        {[
          ['todos', 'Todos'],
          ['mios', 'Subidos por mí'],
          ...NIVELES.map((n) => [n.nivel, `Nivel ${n.nivel}`] as const),
        ].map(([id, nombre]) => (
          <button
            key={String(id)}
            aria-pressed={filtro === id}
            onClick={() => setFiltro(id as typeof filtro)}
            className={`shrink-0 rounded-full px-4 py-2 font-bold ${filtro === id ? 'bg-petroleo text-white' : 'bg-white text-tinta shadow-sm'}`}
          >
            {nombre}
          </button>
        ))}
      </div>
      {typeof filtro === 'number' && <p className="-mt-2 text-sm text-tinta-suave">{NIVELES.find((n) => n.nivel === filtro)?.descripcion}</p>}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visibles.map(({ texto: t, nivel, lectores }) => (
          <li key={t.id}>
            <button onClick={() => setElegido(t.id)} className="flex h-full w-full flex-col gap-2 rounded-3xl bg-white p-3 text-left shadow-sm active:scale-[0.98]">
              <Portada titulo={t.titulo} portada={t.portada} className="h-32 w-full text-3xl" />
              <span className="line-clamp-2 font-bold leading-tight">{t.titulo}</span>
              <span className="mt-auto flex flex-wrap gap-1 text-xs font-bold">
                <span className="rounded-full bg-amarillo px-2 py-0.5">Nivel {nivel}</span>
                <span className="rounded-full bg-crema px-2 py-0.5 text-tinta-suave">
                  {lectores} {lectores === 1 ? 'alumno' : 'alumnos'}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {visibles.length === 0 && <p className="text-tinta-suave">No hay libros con este filtro.</p>}

      {abierto && (
        <DetalleLibro
          texto={abierto.texto}
          nivel={abierto.nivel}
          propio={abierto.texto.subidoPor === props.cuenta.id && abierto.texto.origen !== 'ciempi'}
          perfiles={props.perfiles}
          asignaciones={props.asignaciones}
          alCambiar={props.alCambiar}
          alEliminar={() => {
            props.alEliminar(abierto.texto)
            setElegido(null)
          }}
          alCerrar={() => setElegido(null)}
        />
      )}
    </section>
  )
}

function DetalleLibro(props: {
  texto: Texto
  nivel: NivelLectura
  propio: boolean
  perfiles: PerfilNino[]
  asignaciones: Asignacion[]
  alCambiar: () => void
  alEliminar: () => void
  alCerrar: () => void
}) {
  const t = props.texto
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-tinta/40 sm:items-center" onClick={props.alCerrar}>
      <div className="aparecer flex max-h-[85dvh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-t-3xl bg-crema p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t.titulo}>
        <div className="flex gap-3">
          <Portada titulo={t.titulo} portada={t.portada} className="h-28 w-20 shrink-0 text-2xl" />
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold leading-tight">{t.titulo}</p>
            <p className="text-sm text-tinta-suave">
              {t.origen === 'ciempi' ? 'Cuento de Ciempi' : t.autor || 'Subido'} · Nivel {props.nivel} · {t.frases.length} frases
              {t.capitulos.length > 1 ? ` · ${t.capitulos.length} capítulos` : ''}
            </p>
          </div>
          <button onClick={props.alCerrar} className="h-10 w-10 shrink-0 rounded-full bg-white font-bold" aria-label="Cerrar">
            ✕
          </button>
        </div>
        <p className="text-sm text-tinta-suave">Toca un alumno para darle el libro en un nivel, cambiárselo o quitárselo.</p>
        <LectoresDelLibro texto={t} perfiles={props.perfiles} asignaciones={props.asignaciones} alCambiar={props.alCambiar} />
        {props.propio && (
          <button
            onClick={() => confirm(`¿Eliminar «${t.titulo}»? También se quita de la biblioteca de los alumnos y se pierde su avance.`) && props.alEliminar()}
            className="flex items-center gap-2 self-start rounded-full border-2 border-coral px-4 py-2 font-bold text-coral"
          >
            <Icono nombre="basura" className="h-5 w-5" /> Eliminar libro
          </button>
        )}
      </div>
    </div>
  )
}

// ── Cuenta ──────────────────────────────────────────────────────────────

function CuentaAdulto({ cuenta, alSalir, enLinea }: { cuenta: Cuenta; alSalir?: () => void; enLinea: boolean }) {
  const [cambiandoClave, setCambiandoClave] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm">
      {enLinea ? (
        <>
          <p className="text-lg">
            <span className="font-bold">{cuenta.nombreVisible}</span> · <span className="text-tinta-suave">{cuenta.correo}</span>
          </p>
          {cambiandoClave ? (
            <CambiarClave
              alTerminar={() => {
                setCambiandoClave(false)
                setAviso('Listo: tu contraseña quedó cambiada.')
              }}
              alCancelar={() => setCambiandoClave(false)}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              <BotonSecundario onClick={() => setCambiandoClave(true)}>Cambiar mi contraseña</BotonSecundario>
              {alSalir && (
                <button onClick={() => confirm('¿Cerrar sesión en este dispositivo?') && alSalir()} className="flex items-center gap-2 rounded-full border-2 border-coral px-4 py-2 font-bold text-coral">
                  <Icono nombre="salir" className="h-5 w-5" /> Cerrar sesión
                </button>
              )}
            </div>
          )}
          {aviso && <p className="rounded-xl bg-verde-claro px-3 py-2 text-sm">{aviso}</p>}
        </>
      ) : (
        <p className="text-sm text-tinta-suave">
          Modo sin conexión: los datos quedan guardados solo en este dispositivo. Para compartir alumnos entre la terapeuta y la casa se necesita conectar la app al servidor de Ciempi (ver README).
        </p>
      )}
      <div className="mt-2 flex flex-col gap-3 border-t border-[#ece3d1] pt-3">
        <p className="font-bold">🎵 Música y sonidos en este dispositivo</p>
        <AjustesSonido />
      </div>
    </section>
  )
}

function CanjearCodigo({ alVincular }: { alVincular: () => void }) {
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
          .then(() => {
            setCodigo('')
            alVincular()
          })
          .catch((err: Error) => setError(err.message))
      }}
      className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-[#d8cfbd] p-4"
    >
      <label htmlFor="codigo" className="font-bold">
        Vincular con código
      </label>
      <p className="-mt-1 text-sm text-tinta-suave">Si otro adulto ya creó el perfil del alumno, ingresa el código que te dio.</p>
      <div className="flex gap-2">
        <input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="ABC123" autoCapitalize="characters" className="campo w-40 font-mono uppercase tracking-widest" />
        <BotonPrincipal type="submit" disabled={codigo.trim().length < 6} className="py-2">
          Vincular
        </BotonPrincipal>
      </div>
      <MensajeError error={error} />
    </form>
  )
}
