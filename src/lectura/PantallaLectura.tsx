import { useEffect, useMemo, useRef, useState } from 'react'
import { AvisoVoz } from '../audio/AvisoVoz'
import { desbloquearSonidos, sonarCelebracion, sonarMoneda, sonarTropiezo } from '../audio/sonidos'
import { voz } from '../audio/voz'
import { useVozDeCiempi } from '../ciempi/vozDeCiempi'
import { useRepositorios } from '../datos/DatosProvider'
import { nuevoId } from '../dominio/ids'
import type { Asignacion, EstadoAsignacion, Id, PerfilNino, SesionLectura, Texto } from '../dominio/tipos'
import { quitarGuiones } from '../lenguaje/frases'
import { capituloDeFrase } from '../lenguaje/libro'
import { silabearFrase } from '../lenguaje/silabas'
import { BotonIcono, BotonPrincipal, Encabezado, Icono, Monedas } from '../ui/comunes'
import { MODOS } from './modos'
import { PALABRAS_POR_MONEDA, acumularPalabras, contarPalabras, guardarHaciaMoneda, leerHaciaMoneda } from './monedas'
import { CONFIG_MOTOR_BASE, calcularPista, estadoInicial, paso, type Efecto, type Entrada, type EstadoMotor, type Pista } from './motor'
import { TiraDeLectura } from './TiraDeLectura'

export const MONEDAS_POR_CAPITULO = 2
export const MONEDAS_POR_TEXTO = 3
const MS_TROPIEZO = 1500
/** Respiro breve al terminar una frase (la frase queda encendida) antes de pasar a la siguiente. */
const MS_PASO_FRASE = 450
/** Pausas más largas que esto no cuentan como tiempo leyendo. */
const MAX_PAUSA_ACTIVA_MS = 10_000

export interface Progreso {
  fraseActual: number
  fraseMaxima: number
  estado: EstadoAsignacion
}

interface Props {
  perfil: PerfilNino
  /** Usuario con sesión iniciada (queda registrado en la sesión de lectura). */
  usuarioId: Id
  /** Un adulto mirando el libro del niño: no mueve su avance ni le da monedas. */
  vistaPrevia?: boolean
  texto: Texto
  asignacion: Asignacion
  alGanarMonedas: (cantidad: number) => void
  /** Se llama después de cada frase y al saltar: el progreso queda guardado aunque se cierre la app. */
  alProgreso: (progreso: Progreso) => void
  alVolver: () => void
  alAjustes: () => void
}

export function PantallaLectura(props: Props) {
  const { perfil, usuarioId, texto, asignacion, vistaPrevia = false, alVolver, alAjustes } = props
  // En vista previa no se registra nada: ni progreso, ni monedas, ni sesión.
  const alGanarMonedas = vistaPrevia ? () => {} : props.alGanarMonedas
  const alProgreso = vistaPrevia ? () => {} : props.alProgreso
  const repos = useRepositorios()
  const { ajustes } = perfil
  const modo = asignacion.modo
  const definicionModo = MODOS[modo]
  const tranquilo = ajustes.modoTranquilo
  const total = texto.frases.length
  useVozDeCiempi(perfil.ciempi.genero)

  // Retoma donde quedó; un libro terminado parte de nuevo.
  const [indice, setIndice] = useState(() => (asignacion.estado === 'completada' ? 0 : Math.min(asignacion.fraseActual, Math.max(0, total - 1))))
  // Hasta dónde llegó alguna vez: solo las frases nuevas dan monedas.
  const maximaRef = useRef(Math.max(asignacion.fraseMaxima ?? 0, asignacion.fraseActual))
  const [maxima, setMaxima] = useState(maximaRef.current)
  const yaTerminoLibro = useRef(asignacion.completadaEn != null || asignacion.estado === 'completada')

  const [pausa, setPausa] = useState<{ tipo: 'capitulo' | 'libro'; titulo: string; premio: number; siguiente: number } | null>(null)
  const [indiceAbierto, setIndiceAbierto] = useState(false)
  // Sin rayas ni guiones de diálogo, que confunden al leer.
  const frase = quitarGuiones(texto.frases[indice] ?? '')

  const conCapitulos = texto.capitulos.length > 1
  const numCapitulo = capituloDeFrase(texto.capitulos, indice)
  const capitulo = texto.capitulos[numCapitulo]
  const finDelCapitulo = texto.capitulos[numCapitulo + 1]?.desdeFrase ?? total
  const avanceCapitulo = (indice - capitulo.desdeFrase) / Math.max(1, finDelCapitulo - capitulo.desdeFrase)
  // Arriba se ve lo que ya leyó (no lo que viene): hasta dos frases del capítulo.
  const yaLeidas = texto.frases.slice(Math.max(capitulo.desdeFrase, indice - 2), indice).map(quitarGuiones)
  const palabras = useMemo(() => silabearFrase(frase), [frase])
  // La pista se mide en pantalla (dónde quedó cada palabra); mientras, una pareja.
  const [pistaMedida, setPistaMedida] = useState<Pista | null>(null)
  const pista = pistaMedida && pistaMedida.manzanas.length === palabras.length ? pistaMedida : calcularPista(palabras.length)
  const repasando = indice < maxima

  const [motor, setMotor] = useState<EstadoMotor>(estadoInicial)
  const motorRef = useRef(motor)
  const [aviso, setAviso] = useState<string | null>(null)
  // Palabras acumuladas hacia la próxima moneda (y un contador para animar cada moneda nueva).
  const [haciaMoneda, setHaciaMoneda] = useState(() => (vistaPrevia ? 0 : leerHaciaMoneda(perfil.id)))
  const haciaMonedaRef = useRef(haciaMoneda)
  const [monedasNuevas, setMonedasNuevas] = useState(0)

  const temporizadores = useRef<number[]>([])
  const programar = (fn: () => void, ms: number) => {
    temporizadores.current.push(window.setTimeout(fn, ms))
  }
  const cancelarProgramados = () => {
    temporizadores.current.forEach(clearTimeout)
    temporizadores.current = []
  }
  useEffect(() => () => temporizadores.current.forEach(clearTimeout), [])

  // ── Sesión de lectura ─────────────────────────────────────────────────
  const sesion = useRef<SesionLectura | null>(null)
  const tiempoActivo = useRef({ ms: 0, ultimo: 0 })

  const registrarActividad = (t: number) => {
    const ta = tiempoActivo.current
    if (ta.ultimo) ta.ms += Math.min(t - ta.ultimo, MAX_PAUSA_ACTIVA_MS)
    ta.ultimo = t
  }

  const guardarSesion = (cambios: Partial<SesionLectura>) => {
    const actual: SesionLectura = sesion.current ?? {
      id: nuevoId(),
      usuarioId,
      perfilId: perfil.id,
      textoId: texto.id,
      asignacionId: asignacion.id,
      modo,
      iniciadaEn: new Date().toISOString(),
      duracionSegundos: 0,
      frasesCompletadas: 0,
      frasesMuyRapido: 0,
      silabasLeidas: 0,
      monedasGanadas: 0,
    }
    sesion.current = { ...actual, ...cambios, duracionSegundos: Math.round(tiempoActivo.current.ms / 1000) }
    if (!vistaPrevia) void repos.sesiones.guardar(sesion.current)
  }

  // ── Movimiento por el libro ───────────────────────────────────────────
  const guardarProgreso = (fraseActual: number, estado: EstadoAsignacion = 'en_curso') =>
    alProgreso({ fraseActual, fraseMaxima: maximaRef.current, estado })

  const reiniciarMotor = () => {
    motorRef.current = estadoInicial()
    setMotor(motorRef.current)
  }

  // Cada cambio de frase invalida los pasos automáticos que estaban esperando.
  const cambiosDeFrase = useRef(0)

  const irAFrase = (i: number, { callarVoz = true } = {}) => {
    cambiosDeFrase.current++
    cancelarProgramados()
    if (callarVoz) voz.callar()
    setAviso(null)
    setPausa(null)
    setIndice(i)
    reiniciarMotor()
  }

  /** Saltar a otra frase (volver atrás, repetir un capítulo o el libro). Las monedas no se tocan. */
  const saltarA = (i: number) => {
    setIndiceAbierto(false)
    irAFrase(Math.max(0, Math.min(i, total - 1)))
    guardarProgreso(Math.max(0, Math.min(i, total - 1)))
  }

  const premiar = (monedas: number) => {
    if (!monedas) return
    alGanarMonedas(monedas)
    const s = sesion.current
    guardarSesion({ monedasGanadas: (s?.monedasGanadas ?? 0) + monedas })
    if (!tranquilo) programar(sonarCelebracion, 200)
  }

  const siguienteFrase = (eraNueva: boolean) => {
    const sig = indice + 1
    if (sig >= total) {
      guardarProgreso(total, 'completada')
      // El premio del libro se da solo la primera vez que se termina.
      const premio = yaTerminoLibro.current ? 0 : MONEDAS_POR_TEXTO
      yaTerminoLibro.current = true
      setPausa({ tipo: 'libro', titulo: texto.titulo, premio, siguiente: 0 })
      premiar(premio)
      return
    }
    guardarProgreso(sig)
    // En un libro, cada capítulo terminado es un buen lugar para descansar.
    if (conCapitulos && sig === finDelCapitulo) {
      const premio = eraNueva ? MONEDAS_POR_CAPITULO : 0
      setPausa({ tipo: 'capitulo', titulo: capitulo.titulo, premio, siguiente: sig })
      premiar(premio)
      return
    }
    irAFrase(sig, { callarVoz: false })
  }

  /**
   * Frase terminada: sin pausa ni cartel, se pasa a la siguiente. Las
   * palabras leídas a buen ritmo, en frases nuevas, suman hacia la próxima moneda.
   */
  const completar = (aBuenRitmo: boolean) => {
    const eraNueva = indice >= maximaRef.current
    maximaRef.current = Math.max(maximaRef.current, indice + 1)
    setMaxima(maximaRef.current)

    let ganadas = 0
    if (aBuenRitmo && eraNueva && !vistaPrevia) {
      const r = acumularPalabras(haciaMonedaRef.current, contarPalabras(frase))
      ganadas = r.monedas
      haciaMonedaRef.current = r.resto
      setHaciaMoneda(r.resto)
      guardarHaciaMoneda(perfil.id, r.resto)
    }
    const s = sesion.current
    guardarSesion({
      frasesCompletadas: (s?.frasesCompletadas ?? 0) + 1,
      frasesMuyRapido: (s?.frasesMuyRapido ?? 0) + (aBuenRitmo ? 0 : 1),
      silabasLeidas: (s?.silabasLeidas ?? 0) + (aBuenRitmo ? palabras.reduce((n, p) => n + p.silabas.length, 0) : 0),
      monedasGanadas: (s?.monedasGanadas ?? 0) + ganadas,
    })
    if (ganadas) {
      alGanarMonedas(ganadas)
      setMonedasNuevas((n) => n + 1)
      if (!tranquilo) programar(sonarMoneda, 120)
    }
    // Se pasa a la siguiente frase recién cuando la voz terminó de decir la última palabra.
    const cambio = cambiosDeFrase.current
    programar(async () => {
      await voz.esperarSilencio(4000)
      if (cambio === cambiosDeFrase.current) siguienteFrase(eraNueva)
    }, MS_PASO_FRASE)
  }

  // Una frase que quedó vacía (era solo una raya) se salta sola.
  useEffect(() => {
    if (palabras.length === 0 && !pausa && total > 0) {
      const t = window.setTimeout(() => siguienteFrase(indice >= maximaRef.current), 0)
      return () => window.clearTimeout(t)
    }
  }, [indice, palabras.length, pausa])

  const ejecutar = (efecto: Efecto) => {
    switch (efecto.tipo) {
      case 'decir':
        if (definicionModo.vozAlDeslizar) voz.decir(palabras[efecto.palabra].texto, ajustes.velocidadVoz)
        break
      case 'tropiezo':
        voz.callar()
        if (!tranquilo) sonarTropiezo()
        setAviso('Más despacito 🐢')
        programar(() => {
          setAviso(null)
          entrar({ tipo: 'recuperar' })
        }, MS_TROPIEZO)
        break
      case 'lejos':
        setAviso('Pon el dedo donde está Ciempi 👆')
        programar(() => setAviso((a) => (a?.startsWith('Pon') ? null : a)), 1400)
        break
      case 'completada':
        completar(efecto.aBuenRitmo)
        break
    }
  }

  const entrar = (entrada: Entrada) => {
    if (entrada.tipo === 'tocar') {
      // El primer toque habilita el audio (requisito de iOS y Chrome).
      voz.desbloquear()
      desbloquearSonidos()
    }
    if (entrada.tipo === 'tocar' || entrada.tipo === 'mover') registrarActividad(entrada.t)

    const config = { ...CONFIG_MOTOR_BASE, umbralPalabrasPorSegundo: ajustes.umbralPalabrasPorSegundo }
    const { estado, efectos } = paso(motorRef.current, entrada, pista, config)
    if (estado !== motorRef.current) {
      motorRef.current = estado
      setMotor(estado)
    }
    efectos.forEach(ejecutar)
  }

  const encabezado = (
    <Encabezado
      alVolver={alVolver}
      titulo={
        <span className="flex flex-col leading-tight">
          <span className="truncate">{conCapitulos ? capitulo.titulo : texto.titulo}</span>
          <span className="truncate text-sm font-normal text-tinta-suave apaisado:text-xs">
            {conCapitulos ? texto.titulo : `Frase ${indice + 1} de ${total}`}
          </span>
        </span>
      }
    >
      <Monedas cantidad={perfil.monedas} />
      <BotonIcono etiqueta="Índice: volver atrás o repetir" icono="indice" onClick={() => setIndiceAbierto(true)} />
      <BotonIcono etiqueta="Ajustes de lectura" icono="ajustes" onClick={alAjustes} />
    </Encabezado>
  )

  const panelIndice = indiceAbierto && (
    <PanelIndice
      texto={texto}
      indice={indice}
      maxima={maxima}
      alSaltar={saltarA}
      alCerrar={() => setIndiceAbierto(false)}
    />
  )

  if (pausa) {
    const esLibro = pausa.tipo === 'libro'
    return (
      <>
        {encabezado}
        {panelIndice}
        <Pausa
          titulo={esLibro ? '¡Leíste todo!' : '¡Terminaste un capítulo!'}
          subtitulo={pausa.titulo}
          premio={pausa.premio}
          tranquilo={tranquilo}
          principal={esLibro ? { texto: 'Volver a mis libros', accion: alVolver } : { texto: 'Seguir leyendo', accion: () => irAFrase(pausa.siguiente) }}
          secundaria={
            esLibro
              ? {
                  texto: 'Leer otra vez',
                  accion: () => {
                    sesion.current = null
                    tiempoActivo.current = { ms: 0, ultimo: 0 }
                    saltarA(0)
                  },
                }
              : { texto: 'Descansar', accion: alVolver }
          }
        />
      </>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {encabezado}
      {panelIndice}
      {vistaPrevia && (
        <div className="mx-5 rounded-xl bg-petroleo-claro px-3 py-1 text-center text-sm text-petroleo">
          Vista previa: no cambia el avance ni las monedas de {perfil.apodo}
        </div>
      )}
      <div className="flex flex-col gap-1.5 px-5 pt-1 apaisado:flex-row apaisado:items-center apaisado:gap-5 apaisado:pt-0">
        <div className="flex flex-1 items-center gap-2 text-sm text-tinta-suave">
          <button
            onClick={() => saltarA(indice - 1)}
            disabled={indice === 0 || motor.fase === 'arrastrando'}
            aria-label="Frase anterior"
            title="Frase anterior"
            className="-ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-petroleo active:bg-petroleo-claro disabled:text-[#cfc6b4]"
          >
            <Icono nombre="anterior" className="h-5 w-5" />
          </button>
          <BarraCapitulo valor={avanceCapitulo} tranquilo={tranquilo} />
        </div>
        {!vistaPrevia &&
          (repasando ? (
            <p className="text-sm text-tinta-suave">📖 Repasando: las monedas siguen desde donde ibas</p>
          ) : (
            <MedidorMoneda acumuladas={haciaMoneda} monedasNuevas={monedasNuevas} tranquilo={tranquilo} />
          ))}
      </div>

      <AvisoVoz className="mx-5 mt-1 apaisado:py-1" />
      <p className="mx-5 mt-1 rounded-xl bg-amarillo/25 px-3 py-1 text-center text-sm text-tinta-suave vertical-angosto:block hidden">
        📱 Gira el teléfono: se lee mejor en horizontal
      </p>

      {/* Lectura centrada en la pantalla: lo ya leído arriba, la frase y el carril de Ciempi abajo. */}
      <div className="flex min-h-0 flex-1 flex-col justify-center">
      {/* Lo que ya leyó, chico y tenue: da contexto sin adelantar lo que viene. */}
      <div className="flex min-h-0 shrink flex-col items-center justify-end gap-1 overflow-hidden px-6 pb-3" aria-hidden>
        {yaLeidas.map((f, i) => (
          <p
            key={`${indice}-${i}`}
            className={`subir font-lectura line-clamp-1 text-center leading-snug text-tinta-suave ${i === yaLeidas.length - 1 ? 'opacity-70' : 'opacity-40'} ${tranquilo ? 'tranquilo' : ''}`}
            style={{ fontSize: `min(${Math.round(ajustes.tamanoLetra * 0.5)}px, 6dvh, 5vw)`, letterSpacing: '0.04em' }}
          >
            {f}
          </p>
        ))}
      </div>

      {/* La frase, y justo debajo el carril de Ciempi: ahí se desliza el dedo. */}
      <div className="relative px-4 pb-4 apaisado:px-10 apaisado:pb-2">
        {aviso && (
          <div role="alert" className="aparecer absolute inset-x-5 -top-16 z-20 rounded-2xl bg-amarillo px-4 py-3 text-center text-2xl font-bold text-tinta shadow-md">
            {aviso}
          </div>
        )}
        <div key={indice} className={`subir ${tranquilo ? 'tranquilo' : ''}`}>
          <TiraDeLectura
            palabras={palabras}
            motor={motor}
            pista={pista}
            alMedir={setPistaMedida}
            tamanoLetra={ajustes.tamanoLetra}
            tranquilo={tranquilo}
            apariencia={perfil.ciempi}
            alEntrar={entrar}
          />
        </div>
      </div>
      </div>
    </div>
  )
}

/** Avance del capítulo: barra gruesa con brillo, una meta 🏁 y el porcentaje destacado. */
function BarraCapitulo({ valor, tranquilo }: { valor: number; tranquilo: boolean }) {
  const pct = Math.round(Math.min(1, Math.max(0, valor)) * 100)
  return (
    <div className="flex flex-1 items-center gap-2">
      <div
        className="relative h-6 flex-1 overflow-hidden rounded-full border-2 border-[#d9cdb4] bg-white shadow-inner"
        role="progressbar"
        aria-label="Avance del capítulo"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`relative h-full rounded-full bg-gradient-to-r from-[#8eb743] via-[#a9c670] to-[#efc31d] ${tranquilo ? '' : 'transition-[width] duration-500 ease-out'}`}
          style={{ width: `${Math.max(pct, 4)}%` }}
        >
          <span className="absolute inset-x-2 top-1 h-1.5 rounded-full bg-white/45" />
        </div>
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-sm" aria-hidden>
          🏁
        </span>
      </div>
      <span className="shrink-0 rounded-full bg-verde px-2.5 py-0.5 text-sm font-bold text-white tabular-nums shadow-sm">{pct} %</span>
    </div>
  )
}

/** "🪙 Te faltan 7 palabras", con una barrita que se llena y un "+1" al ganar. */
function MedidorMoneda({ acumuladas, monedasNuevas, tranquilo }: { acumuladas: number; monedasNuevas: number; tranquilo: boolean }) {
  const faltan = PALABRAS_POR_MONEDA - acumuladas
  return (
    <div className="relative flex items-center gap-2 text-sm" aria-live="polite">
      <span key={monedasNuevas} className={`text-lg ${monedasNuevas && !tranquilo ? 'moneda-pop' : ''}`} aria-hidden>
        🪙
      </span>
      <span className="shrink-0 text-tinta-suave">
        Te {faltan === 1 ? 'falta' : 'faltan'} <span className="font-bold text-naranjo tabular-nums">{faltan}</span> {faltan === 1 ? 'palabra' : 'palabras'}
      </span>
      <div className="h-2 w-16 overflow-hidden rounded-full bg-arena apaisado:w-24" aria-hidden>
        <div className="h-full rounded-full bg-amarillo transition-[width] duration-300" style={{ width: `${(acumuladas / PALABRAS_POR_MONEDA) * 100}%` }} />
      </div>
      {monedasNuevas > 0 && (
        <span key={`+${monedasNuevas}`} className="moneda-sube pointer-events-none absolute -top-6 left-0 font-bold text-naranjo">
          +1 🪙
        </span>
      )}
    </div>
  )
}

/**
 * Índice del libro: volver a un capítulo ya leído, repetir el actual o
 * empezar de nuevo. Los capítulos que todavía no alcanza quedan con candado.
 */
function PanelIndice(props: { texto: Texto; indice: number; maxima: number; alSaltar: (frase: number) => void; alCerrar: () => void }) {
  const { texto, indice, maxima, alSaltar, alCerrar } = props
  const total = texto.frases.length
  const conCapitulos = texto.capitulos.length > 1
  const actual = capituloDeFrase(texto.capitulos, indice)
  const hastaDonde = Math.min(maxima, total - 1)

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-tinta/30 sm:items-center" onClick={alCerrar}>
      <div
        role="dialog"
        aria-label="Índice"
        onClick={(e) => e.stopPropagation()}
        className="aparecer flex max-h-[85dvh] w-full max-w-lg flex-col gap-3 overflow-hidden rounded-t-3xl bg-crema p-5 shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{texto.titulo}</h2>
          <button onClick={alCerrar} className="rounded-full px-3 py-1 font-bold text-tinta-suave">
            Cerrar
          </button>
        </div>
        <p className="-mt-2 text-sm text-tinta-suave">Puedes volver atrás o repetir: tus monedas no se pierden.</p>

        <div className="flex flex-wrap gap-2">
          {indice < hastaDonde && (
            <button onClick={() => alSaltar(hastaDonde)} className="rounded-full bg-petroleo px-4 py-2 font-bold text-white">
              Ir a donde iba →
            </button>
          )}
          {conCapitulos && (
            <button onClick={() => alSaltar(texto.capitulos[actual].desdeFrase)} className="flex items-center gap-1 rounded-full border-2 border-petroleo px-4 py-2 font-bold text-petroleo">
              <Icono nombre="repetir" className="h-5 w-5" /> Repetir este capítulo
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('¿Empezar de nuevo desde el principio? Tus monedas no se pierden.')) alSaltar(0)
            }}
            className="flex items-center gap-1 rounded-full border-2 border-petroleo px-4 py-2 font-bold text-petroleo"
          >
            <Icono nombre="repetir" className="h-5 w-5" /> Empezar {conCapitulos ? 'el libro' : ''} de nuevo
          </button>
        </div>

        {conCapitulos && (
          <ol className="-mx-2 flex flex-col gap-1 overflow-y-auto px-2 pb-2">
            {texto.capitulos.map((c, i) => {
              const fin = texto.capitulos[i + 1]?.desdeFrase ?? total
              const leido = maxima >= fin
              const bloqueado = c.desdeFrase > maxima
              const esActual = i === actual
              return (
                <li key={i}>
                  <button
                    disabled={bloqueado}
                    onClick={() => alSaltar(c.desdeFrase)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${esActual ? 'bg-petroleo-claro' : 'bg-white'} disabled:bg-transparent disabled:text-tinta-suave/60`}
                  >
                    <span className="w-6 text-center" aria-hidden>
                      {bloqueado ? '🔒' : leido ? '✓' : esActual ? '📖' : '•'}
                    </span>
                    <span className="flex-1 font-bold">{c.titulo}</span>
                    <span className="text-sm text-tinta-suave">{esActual ? 'Aquí vas' : leido ? 'Leído' : bloqueado ? '' : 'Empezado'}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}

/** Pantalla de logro: fin de capítulo o de libro. */
function Pausa(props: {
  titulo: string
  subtitulo: string
  premio: number
  tranquilo: boolean
  principal: { texto: string; accion: () => void }
  secundaria: { texto: string; accion: () => void }
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-6 py-4 text-center apaisado:flex-row apaisado:gap-10">
      <img src="/ciempi.svg" alt="" className={`h-36 w-36 rounded-[2rem] apaisado:h-28 apaisado:w-28 ${props.tranquilo ? '' : 'feliz'}`} />
      <div className="flex flex-col items-center gap-4">
        <div>
          <p className="text-3xl font-bold text-petroleo">{props.titulo}</p>
          <p className="mt-1 text-lg text-tinta-suave">{props.subtitulo}</p>
        </div>
        {props.premio > 0 ? (
          <p className="aparecer text-3xl font-bold text-naranjo">+{props.premio} 🪙 de premio</p>
        ) : (
          <p className="aparecer text-xl font-bold text-verde">¡Muy bien repasado! 📖</p>
        )}
        <BotonPrincipal onClick={props.principal.accion} className="px-8 py-4 text-xl">
          {props.principal.texto}
        </BotonPrincipal>
        <button onClick={props.secundaria.accion} className="font-bold text-petroleo underline underline-offset-4">
          {props.secundaria.texto}
        </button>
      </div>
    </div>
  )
}
