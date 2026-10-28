import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { AvisoVoz } from '../audio/AvisoVoz'
import { silabaParaLaVoz } from '../audio/pronunciacion'
import { voz, type EleccionVoz } from '../audio/voz'
import { CUENTOS } from '../contenido/cuentos'
import { dividirConParrafos } from '../lenguaje/frases'
import { silabearFrase } from '../lenguaje/silabas'
import { MODOS } from '../lectura/modos'
import { useVozDeCiempi } from '../ciempi/vozDeCiempi'
import { useRepositorios } from '../datos/DatosProvider'
import { LIMITES_AJUSTES, type AjustesLectura, type PerfilNino, type SesionLectura } from '../dominio/tipos'
import { BotonPrincipal, Encabezado, Icono } from '../ui/comunes'

interface Props {
  perfil: PerfilNino
  alCambiar: (ajustes: AjustesLectura) => void
  alVolver: () => void
  /** Volver a ver la presentación de Ciempi. */
  alVerPresentacion?: () => void
  /** Cerrar sesión (solo en la app del niño; queda al final, lejos del dedo). */
  alSalir?: () => void
}

/** Ajustes de lectura del niño, ordenados por secciones. */
export function PantallaAjustes({ perfil, alCambiar, alVolver, alVerPresentacion, alSalir }: Props) {
  const { ajustes } = perfil
  useVozDeCiempi(perfil.ciempi.genero)
  const nombreVoz = useSyncExternalStore(
    (fn) => voz.suscribir(fn),
    () => voz.nombreVoz,
  )
  const eleccionVoz = useSyncExternalStore(
    (fn) => voz.suscribir(fn),
    () => voz.eleccion,
  )
  // La lista de voces cambia cuando el teléfono termina de cargarlas.
  const cantidadVoces = useSyncExternalStore(
    (fn) => voz.suscribir(fn),
    () => voz.opciones.length,
  )
  const opcionesVoz = useMemo(() => voz.opciones, [cantidadVoces])
  // Estado real de la voz de Ciempi: undefined = sin servidor, null = funciona, texto = qué falla.
  const [estadoVozCiempi, setEstadoVozCiempi] = useState<string | null | undefined>(undefined)
  const [, setRevision] = useState(0)
  useEffect(() => {
    void voz.diagnosticarServidor().then(setEstadoVozCiempi)
  }, [eleccionVoz])
  // Las voces del teléfono se piden de nuevo al abrir Ajustes: a esta altura el motor de voz ya arrancó.
  useEffect(() => voz.refrescarVoces(), [])
  const cambiar = <K extends keyof AjustesLectura>(clave: K, valor: AjustesLectura[K]) => alCambiar({ ...ajustes, [clave]: valor })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Encabezado alVolver={alVolver} titulo={`Ajustes de ${perfil.apodo}`} />
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 overflow-y-auto px-5 pb-8 pt-2">
        <Seccion emoji="🔤" titulo="Letra">
          <Deslizador
            etiqueta="Tamaño"
            valor={ajustes.tamanoLetra}
            mostrar={`${ajustes.tamanoLetra} px`}
            {...LIMITES_AJUSTES.tamanoLetra}
            alCambiar={(v) => cambiar('tamanoLetra', v)}
          />
          <p className="rounded-xl bg-crema px-4 py-3 text-center font-lectura" style={{ fontSize: ajustes.tamanoLetra, letterSpacing: '0.05em' }}>
            <span className="rounded-[0.2em] bg-petroleo-claro text-petroleo">Ciempi</span> lee
          </p>
        </Seccion>

        <Seccion emoji="🔊" titulo="Voz">
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1 font-bold">Cómo ayuda Ciempi al leer</legend>
            {(
              [
                [undefined, 'Según el nivel del libro', 'Nivel 1: lee contigo · nivel 2: escuchas primero · niveles 3 y 4: sin voz.'],
                ...(['coro', 'eco', 'solo'] as const).map((m) => [m, MODOS[m].nombre, MODOS[m].descripcion] as const),
              ] as const
            ).map(([m, nombre, descripcion]) => (
              <label key={m ?? 'nivel'} className="flex cursor-pointer items-start gap-3 rounded-xl bg-crema px-3 py-2">
                <input
                  type="radio"
                  name="modoVoz"
                  checked={ajustes.modoVoz === m}
                  onChange={() => alCambiar({ ...ajustes, modoVoz: m })}
                  className="mt-1 h-5 w-5 shrink-0 accent-petroleo"
                />
                <span>
                  <span className="block font-bold">{nombre}</span>
                  <span className="text-sm text-tinta-suave">{descripcion}</span>
                </span>
              </label>
            ))}
            <span className="text-xs text-tinta-suave">En cualquier modo, tocar una palabra hace que Ciempi la diga.</span>
          </fieldset>
          <AvisoVoz />
          <label className="flex flex-col gap-1">
            <span className="font-bold">Voz</span>
            <select
              // Una voz elegida en otro momento que ya no está en el equipo: se muestra "Automática".
              value={opcionesVoz.some((o) => o.id === eleccionVoz) ? eleccionVoz : 'auto'}
              onChange={(e) => {
                voz.elegir(e.target.value as EleccionVoz)
                voz.desbloquear()
                voz.decirFrase(`Hola, soy ${perfil.ciempi.nombre}.`, ajustes.velocidadVoz)
              }}
              className="campo text-base"
            >
              {opcionesVoz.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.espanol ? o.nombre : `${o.nombre} (otro idioma)`}
                </option>
              ))}
            </select>
            <span className="text-xs text-tinta-suave">Se guarda en este dispositivo. Si una voz no suena, prueba otra.</span>
            {voz.disponible && !opcionesVoz.some((o) => o.id.startsWith('equipo:')) && (
              <button type="button" onClick={() => voz.refrescarVoces()} className="self-start text-sm font-bold text-petroleo underline underline-offset-4">
                No aparecen las voces del teléfono: buscarlas de nuevo
              </button>
            )}
            {estadoVozCiempi !== undefined && (
              <span className={`text-xs font-bold ${estadoVozCiempi ? 'text-coral' : 'text-verde'}`}>
                {estadoVozCiempi ? `La voz de Ciempi no funciona: ${estadoVozCiempi}.` : 'La voz de Ciempi funciona ✓'}
              </span>
            )}
          </label>
          <Deslizador
            etiqueta="Velocidad"
            valor={ajustes.velocidadVoz}
            mostrar={`${ajustes.velocidadVoz.toFixed(2)}×`}
            {...LIMITES_AJUSTES.velocidadVoz}
            alCambiar={(v) => cambiar('velocidadVoz', v)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                voz.desbloquear()
                voz.decirFrase(`Hola, soy ${perfil.ciempi.nombre}. ¡Vamos a leer!`, ajustes.velocidadVoz)
                // Vuelve a mirar el estado de la voz cuando ya se intentó hablar.
                setTimeout(() => {
                  setRevision((r) => r + 1)
                  void voz.diagnosticarServidor().then(setEstadoVozCiempi)
                }, 2500)
              }}
              className="rounded-full border-2 border-petroleo px-4 py-1.5 font-bold text-petroleo"
            >
              ▶ Probar voz
            </button>
            <span className="text-sm text-tinta-suave">
              {!voz.disponible ? 'Este navegador no tiene voz' : (nombreVoz ?? 'Sin voz en español')}
              {voz.disponible && <span className="block text-xs opacity-70">Teléfono: {voz.resumenVoces}</span>}
            </span>
          </div>
          <ProbarSilabas velocidad={ajustes.velocidadVoz} />
        </Seccion>

        <Seccion emoji="🐢" titulo="Ritmo">
          <Deslizador
            etiqueta="«Más despacito» sobre"
            valor={ajustes.umbralPalabrasPorSegundo}
            mostrar={`${ajustes.umbralPalabrasPorSegundo.toLocaleString('es-CL')} palabras/s`}
            {...LIMITES_AJUSTES.umbralPalabrasPorSegundo}
            alCambiar={(v) => cambiar('umbralPalabrasPorSegundo', v)}
          />
          <p className="text-sm text-tinta-suave">Más bajo = exige leer más lento.</p>
        </Seccion>

        <Seccion emoji="🌙" titulo="Calma">
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block font-bold">Modo tranquilo</span>
              <span className="text-sm text-tinta-suave">Sin efectos de sonido ni animaciones intensas. La voz se mantiene.</span>
            </span>
            <input type="checkbox" checked={ajustes.modoTranquilo} onChange={(e) => cambiar('modoTranquilo', e.target.checked)} className="h-7 w-7 shrink-0 accent-petroleo" />
          </label>
        </Seccion>

        {alVerPresentacion && (
          <Seccion emoji="🐛" titulo={perfil.ciempi.nombre}>
            <button onClick={alVerPresentacion} className="self-start font-bold text-petroleo underline underline-offset-4">
              Ver la presentación de nuevo
            </button>
          </Seccion>
        )}

        <UltimasSesiones perfilId={perfil.id} />

        <BotonPrincipal onClick={alVolver} className="mt-2">
          Listo
        </BotonPrincipal>

        {alSalir && (
          <Seccion emoji="👤" titulo="Cuenta">
            {perfil.usuario && (
              <p className="text-sm text-tinta-suave">
                Entraste como <span className="font-mono font-bold text-tinta">{perfil.usuario}</span>
              </p>
            )}
            <button
              onClick={() => {
                if (confirm('¿Seguro que quieres salir? Para volver a entrar necesitas tu usuario y tu clave.')) alSalir()
              }}
              className="flex items-center gap-2 self-start rounded-full border-2 border-coral px-4 py-2 font-bold text-coral"
            >
              <Icono nombre="salir" className="h-5 w-5" /> Salir de Ciempi
            </button>
          </Seccion>
        )}
        <p className="text-center text-xs text-tinta-suave">CIEMPI versión {__VERSION_APP__}</p>
      </div>
    </div>
  )
}

function Seccion({ emoji, titulo, children }: { emoji: string; titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <span aria-hidden>{emoji}</span> {titulo}
      </h2>
      {children}
    </section>
  )
}

function Deslizador(props: { etiqueta: string; valor: number; mostrar: string; min: number; max: number; paso: number; alCambiar: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex justify-between">
        {props.etiqueta}
        <span className="text-tinta-suave tabular-nums">{props.mostrar}</span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.paso}
        value={props.valor}
        onChange={(e) => props.alCambiar(Number(e.target.value))}
        className="h-8 accent-petroleo"
      />
    </label>
  )
}

/** Resumen para el adulto: confirma que las sesiones se están registrando. */
function UltimasSesiones({ perfilId }: { perfilId: string }) {
  const repos = useRepositorios()
  const [sesiones, setSesiones] = useState<SesionLectura[]>([])
  useEffect(() => {
    void repos.sesiones.listarPorPerfil(perfilId).then((s) => setSesiones(s.slice(0, 5)))
  }, [repos, perfilId])

  if (sesiones.length === 0) return null
  return (
    <details className="rounded-2xl bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-lg font-bold">📊 Últimas lecturas</summary>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm">
        {sesiones.map((s) => {
          const minutos = s.duracionSegundos / 60
          return (
            <li key={s.id} className="flex flex-wrap justify-between gap-x-3 rounded-xl bg-crema px-3 py-2">
              <span>{new Date(s.iniciadaEn).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span className="text-tinta-suave">
                {minutos < 1 ? `${s.duracionSegundos} s` : `${minutos.toFixed(1)} min`} · {s.frasesCompletadas} frases · {s.frasesMuyRapido} 🐢 · {s.monedasGanadas} 🪙
              </span>
            </li>
          )
        })}
      </ul>
    </details>
  )
}

/**
 * Para los adultos: todas las sílabas de los cuentos del nivel 0, para
 * escuchar cómo las dice la voz de este teléfono (cada voz lee distinto las
 * sílabas sueltas; ver audio/pronunciacion.ts).
 */
function ProbarSilabas({ velocidad }: { velocidad: number }) {
  const silabas = useMemo(() => {
    const vistas = new Map<string, { silaba: string; palabra: string; dice: string }>()
    for (const c of CUENTOS.filter((c) => c.nivel === 0))
      for (const f of dividirConParrafos(c.texto).frases)
        for (const p of silabearFrase(f))
          p.silabas.forEach((s, i) => {
            const dice = silabaParaLaVoz(s, i, p.texto, p.silabas)
            const silaba = s.toLowerCase().replace(/[^\p{L}]/gu, '')
            if (!vistas.has(`${silaba}|${dice}`)) vistas.set(`${silaba}|${dice}`, { silaba, palabra: p.texto.replace(/[^\p{L}-]/gu, ''), dice })
          })
    return [...vistas.values()]
  }, [])
  return (
    <details className="rounded-2xl bg-crema p-3">
      <summary className="cursor-pointer font-bold">Probar las sílabas del nivel 0</summary>
      <p className="mt-1 text-sm text-tinta-suave">Toca una sílaba para escuchar cómo la dice la voz de este teléfono. Si alguna suena mal, anótala.</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {silabas.map((s) => (
          <button
            key={`${s.silaba}|${s.dice}`}
            type="button"
            title={`de «${s.palabra}»`}
            onClick={() => {
              voz.desbloquear()
              voz.decir(s.dice, velocidad)
            }}
            className="rounded-full bg-white px-3 py-1 font-lectura text-lg shadow-sm active:bg-amarillo/50"
          >
            {s.silaba}
            {s.dice !== s.silaba && <span className="ml-1 text-xs text-tinta-suave">({s.palabra})</span>}
          </button>
        ))}
      </div>
    </details>
  )
}
