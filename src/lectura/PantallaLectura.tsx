import { useEffect, useMemo, useRef, useState } from 'react'
import { AvisoVoz } from '../audio/AvisoVoz'
import { desbloquearSonidos, sonarCelebracion, sonarMoneda, sonarTropiezo } from '../audio/sonidos'
import { silabaParaLaVoz } from '../audio/pronunciacion'
import { voz } from '../audio/voz'
import type { AparienciaCiempi } from '../ciempi/catalogo'
import { CiempiPersonaje } from '../ciempi/CiempiPersonaje'
import { useVozDeCiempi } from '../ciempi/vozDeCiempi'
import { useRepositorios } from '../datos/DatosProvider'
import type { ProgresoAsignacion } from '../datos/repositorios'
import { nuevoId } from '../dominio/ids'
import type { AjustesLectura, Asignacion, EstadoAsignacion, Id, ModoLectura, PerfilNino, SesionLectura, Texto } from '../dominio/tipos'
import { dividirEnFragmentos, quitarGuiones, trocearOracion } from '../lenguaje/frases'
import { capituloDeFrase } from '../lenguaje/libro'
import { silabearFrase } from '../lenguaje/silabas'
import { datosNivel, fraseDeUnidad, unidadDeFrase, vistaPorNivel, type NivelLectura } from '../lenguaje/unidades'
import { BotonIcono, BotonPrincipal, Encabezado, Icono, Monedas } from '../ui/comunes'
import { MODOS, MODO_POR_NIVEL, descripcionModo } from './modos'
import { HITOS, MINIMO_A_BUEN_RITMO, contarPalabras, hitosNuevos, hoy, monedasDeUnidad, porcentajeLeido, premioRelectura } from './monedas'
import { CONFIG_MOTOR_BASE, FIN_PISTA, calcularPista, estadoInicial, paso, type Efecto, type Entrada, type EstadoMotor, type Pista } from './motor'
import { ParrafoCompleto } from './ParrafoCompleto'
import { TiraDeLectura } from './TiraDeLectura'
import { TROZOS_DE_ATRASO, VELOCIDAD_MAXIMA, encolarTrozo, trozoEn, velocidadPara } from './vozAlDedo'

const MS_TROPIEZO = 1500
/** Respiro breve al terminar una frase (la frase queda encendida) antes de pasar a la siguiente. */
const MS_PASO_FRASE = 450
/** Desde el nivel 2 la voz no se corta al llegar al final: se espera a que termine (hasta esto). */
const MS_ESPERA_VOZ_LARGA = 20_000
/** Niveles 2 y 4: cuánto tiene que volver atrás el dedo para que la voz se corte. */
const RETROCESO = 0.04
/** Nivel 2 con la voz del teléfono: va en trozos de hasta tantas palabras (cortos, para que se apure de a poco). */
const PALABRAS_POR_TROZO = 3
/** Nivel 2 con la voz de Ciempi: cuántas palabras puede ir la voz delante del dedo antes de esperarlo. */
const PALABRAS_DE_VENTAJA = 3
/** Nivel 2 con la voz de Ciempi: si el dedo se queda quieto este rato, la voz se pausa. */
const MS_DEDO_QUIETO = 600
/** Niveles 3 y 4: dónde empieza la primera palabra en el carril. */
const INICIO_PISTA_PARRAFO = 0.06
/** Pausas más largas que esto no cuentan como tiempo leyendo. */
const MAX_PAUSA_ACTIVA_MS = 10_000

export type Progreso = ProgresoAsignacion

interface Props {
  perfil: PerfilNino
  /** Usuario con sesión iniciada (queda registrado en la sesión de lectura). */
  usuarioId: Id
  /** Un adulto mirando el libro del niño: no mueve su avance ni le da monedas. */
  vistaPrevia?: boolean
  /** Guarda un cambio de ajustes (el botón de la voz). */
  alCambiarAjustes: (ajustes: AjustesLectura) => void
  /** Un adulto lee junto al niño desde su cuenta: todo cuenta para el niño. */
  leyendoConAdulto?: boolean
  texto: Texto
  asignacion: Asignacion
  /** Nivel de lectura de este libro para este niño (1 si no se dice). */
  nivel?: NivelLectura
  /**
   * Frase donde seguir, si el niño no salió del libro (fue a Ajustes y
   * volvió). Si no, se empieza desde el comienzo (o desde el capítulo).
   */
  retomarEn?: number
  alGanarMonedas: (cantidad: number) => void
  /** Se llama después de cada frase y al saltar: lo leído y lo ganado quedan guardados aunque se cierre la app. */
  alProgreso: (progreso: Progreso) => void
  alVolver: () => void
  alAjustes: () => void
}

/**
 * Dónde se empieza a leer: un cuento, siempre desde el comienzo (si no, se
 * pierde el hilo). Un libro con capítulos, desde el comienzo del capítulo
 * donde iba (sin pasar de lo que ya leyó de verdad).
 */
export function fraseDeInicio(texto: Pick<Texto, 'capitulos'>, asignacion: Pick<Asignacion, 'estado' | 'fraseActual' | 'leidoHasta'>): number {
  if (texto.capitulos.length <= 1 || asignacion.estado === 'completada') return 0
  const donde = Math.min(asignacion.fraseActual, asignacion.leidoHasta ?? 0)
  return texto.capitulos[capituloDeFrase(texto.capitulos, donde)].desdeFrase
}

export function PantallaLectura(props: Props) {
  const { perfil, usuarioId, texto, asignacion, vistaPrevia = false, nivel = 1, alVolver, alAjustes } = props
  // En vista previa no se registra nada: ni progreso, ni monedas, ni sesión.
  const alGanarMonedas = vistaPrevia ? () => {} : props.alGanarMonedas
  const alProgreso = vistaPrevia ? () => {} : props.alProgreso
  const repos = useRepositorios()
  const { ajustes } = perfil
  // Cómo se lee en cada nivel (ver lenguaje/unidades.ts):
  // 0 sílaba por sílaba · 1 palabra por palabra · 2 la oración, al ritmo del
  // dedo · 3 y 4 el párrafo o la página completa, una manzana por fragmento.
  const porSilaba = nivel === 0
  const oracion = nivel === 2
  const porFragmentos = nivel === 3 || nivel === 4
  // Nivel 3: una frase por línea, una manzana por frase repartidas parejo, y la frase se lee entera.
  const porFrase = nivel === 3
  // Nivel 4: la página, oración por oración; la voz lee de corrido al ritmo del dedo.
  const pagina = nivel === 4
  // La voz: la que eligió el niño o, si no eligió, la que corresponde al nivel.
  const modo: ModoLectura = ajustes.modoVoz ?? MODO_POR_NIVEL[nivel]
  const definicionModo = MODOS[modo]
  const [menuVoz, setMenuVoz] = useState(false)
  const tranquilo = ajustes.modoTranquilo
  useVozDeCiempi(perfil.ciempi.genero)

  // Lo que se lee de una vez depende del nivel (frase, oración, párrafo, página).
  // El avance se guarda siempre en frases (las de los niveles 0 y 1): ver lenguaje/unidades.ts.
  const vista = useMemo(() => vistaPorNivel(texto, nivel), [texto, nivel])
  const { unidades, capitulos } = vista
  const total = unidades.length
  const totalFrases = texto.frases.length
  const aUnidad = (frase: number) => (frase >= totalFrases ? total : unidadDeFrase(vista, frase))
  const nombreUnidad = datosNivel(nivel).unidad

  // ── Dónde empieza y lo ya ganado ──────────────────────────────────────
  const fraseInicial = props.retomarEn ?? fraseDeInicio(texto, asignacion)
  const [indice, setIndice] = useState(() => Math.min(aUnidad(fraseInicial), Math.max(0, total - 1)))
  // Lo leído de verdad alguna vez y los hitos ya pagados (no bajan).
  const leidoHasta = useRef(asignacion.leidoHasta ?? 0)
  const premioHasta = useRef(asignacion.premioHasta ?? 0)
  const relecturaPremiadaEn = useRef(asignacion.relecturaPremiadaEn ?? null)
  // El libro ya estaba premiado entero al abrirlo: terminarlo es una relectura.
  const yaPremiadoEntero = useRef(premioHasta.current >= 100)
  // Este tramo de lectura: desde dónde empezó y cuánto se leyó a buen ritmo.
  const tramo = useRef({ desde: fraseDeUnidad(vista, indice, totalFrases), palabras: 0, aBuenRitmo: 0 })
  const [premiado, setPremiado] = useState(premioHasta.current)

  const [pausa, setPausa] = useState<{ tipo: 'capitulo' | 'libro'; titulo: string; premio: number; mensaje: string; siguiente: number } | null>(null)
  const [indiceAbierto, setIndiceAbierto] = useState(false)
  // Sin rayas ni guiones de diálogo, que confunden al leer.
  const frase = quitarGuiones(unidades[indice] ?? '')

  const conCapitulos = capitulos.length > 1
  const numCapitulo = capituloDeFrase(capitulos, indice)
  const capitulo = capitulos[numCapitulo]
  const finDelCapitulo = capitulos[numCapitulo + 1]?.desdeFrase ?? total
  // Arriba se ve lo que ya leyó: hasta dos frases (u oraciones) del capítulo.
  const yaLeidas = porFragmentos ? [] : unidades.slice(Math.max(capitulo.desdeFrase, indice - 2), indice).map(quitarGuiones)

  // Niveles 3 y 4: el párrafo (o la página) en fragmentos con sentido, uno por manzana.
  const fragmentos = useMemo(
    () => (porFragmentos ? dividirEnFragmentos(frase, { porOracion: nivel === 4 }).map((f) => silabearFrase(f)).filter((f) => f.length > 0) : []),
    [porFragmentos, frase, nivel],
  )
  const palabras = useMemo(() => (porFragmentos ? fragmentos.flat() : silabearFrase(frase)), [porFragmentos, fragmentos, frase])
  // En el nivel 0 cada sílaba es una manzana: de qué palabra es cada una.
  const silabas = useMemo(
    () => (porSilaba ? palabras.flatMap((p, i) => p.silabas.map((texto, s) => ({ palabra: i, texto, indice: s }))) : []),
    [porSilaba, palabras],
  )
  const manzanasPorLeer = porSilaba ? silabas.length : porFragmentos ? fragmentos.length : palabras.length


  // La pista se mide en pantalla (dónde quedó cada palabra); mientras, una
  // pareja. En los niveles 3 y 4 las palabras se reparten parejo a lo largo del
  // carril y cada fragmento tiene su manzana donde termina su última palabra.
  const [pistaMedida, setPistaMedida] = useState<Pista | null>(null)
  const posicionesPalabras = useMemo(
    () => (porFragmentos ? palabras.map((_, i) => INICIO_PISTA_PARRAFO + ((FIN_PISTA - INICIO_PISTA_PARRAFO) * (i + 1)) / palabras.length) : []),
    [porFragmentos, palabras],
  )
  const pistaPareja = useMemo(() => {
    if (!porFragmentos) return calcularPista(manzanasPorLeer)
    if (porFrase) {
      // Repartidas parejo: la primera después de un tramo de carril, la última en el borde derecho.
      const n = fragmentos.length
      return { manzanas: fragmentos.map((_, k) => INICIO_PISTA_PARRAFO + ((FIN_PISTA - INICIO_PISTA_PARRAFO) * (k + 1)) / n), fin: FIN_PISTA }
    }
    let fin = -1
    const manzanas = fragmentos.map((f) => posicionesPalabras[(fin += f.length)])
    return { manzanas, fin: FIN_PISTA }
  }, [porFragmentos, porFrase, manzanasPorLeer, fragmentos, posicionesPalabras])
  const pista = !porFragmentos && pistaMedida && pistaMedida.manzanas.length === manzanasPorLeer ? pistaMedida : pistaPareja

  // Niveles 2 y 4: los trozos que dice la voz, y dónde empieza cada uno en el carril.
  // En el 2, grupos cortos de palabras (empiezan en la manzana de su primera
  // palabra); en el 4, las oraciones (empiezan donde termina la anterior).
  const trozos = useMemo(() => {
    if (oracion) {
      const grupos = trocearOracion(frase, PALABRAS_POR_TROZO)
      let palabra = 0
      const inicios = grupos.map((g) => {
        const desde = palabra
        palabra += g.split(/\s+/).filter(Boolean).length
        return desde === 0 ? 0 : Math.max(0, (pista.manzanas[desde] ?? 1) - 0.02)
      })
      return { textos: grupos, palabras: grupos.map((g) => g.split(/\s+/).filter(Boolean).length), inicios }
    }
    if (pagina) {
      return {
        textos: fragmentos.map((f) => f.map((p) => p.texto).join(' ')),
        palabras: fragmentos.map((f) => f.length),
        inicios: fragmentos.map((_, k) => (k === 0 ? 0 : pista.manzanas[k - 1])),
      }
    }
    return { textos: [], palabras: [], inicios: [] }
  }, [oracion, pagina, frase, fragmentos, pista])

  // La voz del servidor se pide de antemano (lo de ahora y lo que sigue) para que suene apenas llega el dedo.
  const fraseQueViene = quitarGuiones(unidades[indice + 1] ?? '')
  useEffect(() => {
    if (modo === 'solo') return
    if (porSilaba) voz.precargarSilabas(silabas.map((s) => silabaParaLaVoz(s.texto, s.indice, palabras[s.palabra].texto, palabras[s.palabra].silabas)))
    else if (nivel === 1) voz.precargar([...palabras, ...silabearFrase(fraseQueViene)].map((p) => p.texto))
    else if (oracion) voz.precargarFrases([frase, fraseQueViene])
    else if (pagina) voz.precargarFrases(trozos.textos)
    else voz.precargarFrases(fragmentos.map((f) => f.map((p) => p.texto).join(' ')))
  }, [palabras, silabas, porSilaba, fraseQueViene, frase, fragmentos, trozos, modo, nivel, oracion, pagina])

  // Nivel 2 con la voz de Ciempi: dónde empieza cada palabra en lo que dice la voz (0..1, por letras),
  // para saber por dónde va la voz comparada con el dedo.
  const inicioDePalabra = useMemo(() => {
    const largos = palabras.map((p) => p.texto.length + 1)
    const total = largos.reduce((a, b) => a + b, 0) || 1
    let antes = 0
    return largos.map((l) => {
      const inicio = antes / total
      antes += l
      return inicio
    })
  }, [palabras])

  const [motor, setMotor] = useState<EstadoMotor>(estadoInicial)
  const motorRef = useRef(motor)
  const dibujoPendiente = useRef(0)
  useEffect(() => () => cancelAnimationFrame(dibujoPendiente.current), [])
  const [aviso, setAviso] = useState<string | null>(null)
  // Un hito alcanzado: «¡Llegaste a la mitad! +5 🪙» por un momento.
  const [festejo, setFestejo] = useState<string | null>(null)
  // La moneda de la frase recién leída, que sube hacia el contador.
  const [monedaGanada, setMonedaGanada] = useState<{ monedas: number; n: number } | null>(null)

  // Niveles 3 y 4: palabras encendidas, todas las de los fragmentos comidos y,
  // en el 4, también las que ya pasó el dedo (en el 3 la frase se enciende entera).
  const palabrasEncendidas = useMemo(() => {
    if (!porFragmentos) return 0
    let n = fragmentos.slice(0, motor.palabrasLeidas).reduce((s, f) => s + f.length, 0)
    if (!porFrase) while (n < posicionesPalabras.length && posicionesPalabras[n] <= motor.progreso + 1e-9) n++
    return n
  }, [porFragmentos, porFrase, fragmentos, posicionesPalabras, motor.palabrasLeidas, motor.progreso])

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
      nivel,
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
  const guardarProgreso = (unidad: number, estado: EstadoAsignacion = 'en_curso') =>
    alProgreso({
      fraseActual: fraseDeUnidad(vista, unidad, totalFrases),
      fraseMaxima: leidoHasta.current,
      estado,
      leidoHasta: leidoHasta.current,
      premioHasta: premioHasta.current,
      relecturaPremiadaEn: relecturaPremiadaEn.current,
    })

  // Niveles 2 y 4: la voz en fila (cuándo se estima que termina cada trozo),
  // el próximo trozo por decir y dónde iba el dedo (para notar si vuelve atrás).
  const filaVoz = useRef<number[]>([])
  const proximoTrozo = useRef(0)
  const ultimaPos = useRef(0)
  // Nivel 2 con la voz de Ciempi: la oración es un solo audio que sigue al dedo.
  const oracionAlDedo = useRef({ empezada: false, cortada: false, quieto: 0 })
  // Cuándo tocó el niño por primera vez esta unidad (para revisar el ritmo al terminar).
  const inicioUnidad = useRef<number | null>(null)

  const reiniciarMotor = () => {
    motorRef.current = estadoInicial()
    filaVoz.current = []
    proximoTrozo.current = 0
    ultimaPos.current = 0
    window.clearTimeout(oracionAlDedo.current.quieto)
    oracionAlDedo.current = { empezada: false, cortada: false, quieto: 0 }
    inicioUnidad.current = null
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

  /** Saltar a otra parte (volver atrás, un capítulo o el comienzo): empieza un tramo nuevo. Las monedas no se tocan. */
  const saltarA = (i: number) => {
    const destino = Math.max(0, Math.min(i, total - 1))
    setIndiceAbierto(false)
    tramo.current = { desde: fraseDeUnidad(vista, destino, totalFrases), palabras: 0, aBuenRitmo: 0 }
    irAFrase(destino)
    guardarProgreso(destino)
  }

  const premiar = (monedas: number) => {
    if (!monedas) return
    alGanarMonedas(monedas)
    const s = sesion.current
    guardarSesion({ monedasGanadas: (s?.monedasGanadas ?? 0) + monedas })
  }

  const siguienteFrase = (premioFinal: { monedas: number; mensaje: string }) => {
    const sig = indice + 1
    if (sig >= total) {
      guardarProgreso(total, 'completada')
      setPausa({ tipo: 'libro', titulo: texto.titulo, premio: premioFinal.monedas, mensaje: premioFinal.mensaje, siguiente: 0 })
      if (premioFinal.monedas && !tranquilo) programar(sonarCelebracion, 200)
      return
    }
    guardarProgreso(sig)
    // En un libro, cada capítulo terminado es un buen lugar para descansar.
    if (conCapitulos && sig === finDelCapitulo) {
      setPausa({ tipo: 'capitulo', titulo: capitulo.titulo, premio: 0, mensaje: '¡Muy bien leído! 📖', siguiente: sig })
      return
    }
    irAFrase(sig, { callarVoz: false })
  }

  /**
   * Frase (u oración, párrafo, página) terminada: se pasa a la siguiente.
   * Lo leído de corrido y a buen ritmo avanza `leidoHasta`; al pasar un hito
   * (25, 50, 75 o 100 %) por primera vez, se pagan sus monedas.
   */
  const completar = (aBuenRitmoMotor: boolean) => {
    const n = contarPalabras(frase)
    // Niveles 2 a 4: el dedo va libre; si la unidad se hizo más rápido de lo que se puede leer, no cuenta.
    const limite = ajustes.umbralPalabrasPorSegundo * (oracion ? 2 : 1)
    const segundos = inicioUnidad.current == null ? 0 : (performance.now() - inicioUnidad.current) / 1000
    const aTiempo = nivel < 2 || segundos >= n / limite
    const aBuenRitmo = aBuenRitmoMotor && aTiempo
    if (!aTiempo) {
      setAviso('Muy rápido 🐢 esto no suma monedas')
      programar(() => setAviso((a) => (a?.startsWith('Muy rápido') ? null : a)), 1600)
    }

    const t = tramo.current
    t.palabras += n
    if (aBuenRitmo) t.aBuenRitmo += n
    const ritmoBien = t.aBuenRitmo >= MINIMO_A_BUEN_RITMO * t.palabras
    const fin = fraseDeUnidad(vista, indice + 1, totalFrases)
    let ganadas = 0
    let mensajeFinal = '¡Muy bien leído! 📖'
    if (!vistaPrevia && ritmoBien && t.desde <= leidoHasta.current && fin > leidoHasta.current) {
      leidoHasta.current = fin
      // Niveles 0 a 3: esta frase, leída por primera vez y a su ritmo, paga en el momento (con tope por libro).
      const deEsta = monedasDeUnidad(nivel, indice + 1, total)
      if (aBuenRitmo && deEsta) {
        ganadas += deEsta
        setMonedaGanada({ monedas: deEsta, n: Date.now() })
        programar(() => setMonedaGanada(null), 1600)
      }
      const nuevos = hitosNuevos(nivel, premioHasta.current, porcentajeLeido(fin, totalFrases))
      if (nuevos.length) {
        ganadas += nuevos.reduce((s, h) => s + h.monedas, 0)
        premioHasta.current = nuevos[nuevos.length - 1].porcentaje
        setPremiado(premioHasta.current)
        if (premioHasta.current < 100) {
          setFestejo(`${premioHasta.current === 50 ? '¡Llegaste a la mitad!' : `¡Llegaste al ${premioHasta.current} %!`} +${ganadas} 🪙`)
          programar(() => setFestejo(null), 2600)
        }
      }
    }
    // Terminar otra vez un libro ya premiado (leído entero, a buen ritmo): premio menor, una vez al día.
    const terminaLibro = fin >= totalFrases
    if (terminaLibro && !vistaPrevia && yaPremiadoEntero.current) {
      if (!ritmoBien || t.desde > 0) mensajeFinal = 'Para ganar monedas al releer, lee todo a tu ritmo 🐢'
      else if (relecturaPremiadaEn.current === hoy()) mensajeFinal = 'Hoy ya ganaste monedas releyéndolo. ¡Mañana puedes volver a ganar!'
      else {
        ganadas += premioRelectura(nivel)
        relecturaPremiadaEn.current = hoy()
      }
    } else if (terminaLibro && !vistaPrevia && !ritmoBien) mensajeFinal = 'Para ganar monedas, lee a tu ritmo, sin apurarte 🐢'

    const s = sesion.current
    guardarSesion({
      frasesCompletadas: (s?.frasesCompletadas ?? 0) + 1,
      frasesMuyRapido: (s?.frasesMuyRapido ?? 0) + (aBuenRitmo ? 0 : 1),
      silabasLeidas: (s?.silabasLeidas ?? 0) + (aBuenRitmo ? palabras.reduce((m, p) => m + p.silabas.length, 0) : 0),
    })
    if (ganadas) {
      premiar(ganadas)
      if (!tranquilo && !terminaLibro) programar(sonarMoneda, 120)
    }
    // Se pasa a la siguiente recién cuando la voz terminó.
    const cambio = cambiosDeFrase.current
    programar(async () => {
      await voz.esperarSilencio(nivel >= 2 ? MS_ESPERA_VOZ_LARGA : 4000)
      if (cambio !== cambiosDeFrase.current) return
      siguienteFrase({ monedas: terminaLibro ? ganadas : 0, mensaje: mensajeFinal })
    }, MS_PASO_FRASE)
  }

  // Una frase que quedó vacía (era solo una raya) se salta sola.
  useEffect(() => {
    if (palabras.length === 0 && !pausa && total > 0) {
      const t = window.setTimeout(() => siguienteFrase({ monedas: 0, mensaje: '¡Muy bien leído! 📖' }), 0)
      return () => window.clearTimeout(t)
    }
  }, [indice, palabras.length, pausa])

  /** Niveles 2 y 4: a cuántas palabras por segundo va el dedo (con lo que guardó el motor), o null si es muy pronto. */
  const velocidadDelDedo = (): number | null => {
    const m = motorRef.current.muestras
    if (m.length < 2) return null
    const dt = m[m.length - 1].t - m[0].t
    // Lo que mide una palabra en el carril (en el 4 las manzanas son oraciones; las palabras van parejas).
    const largo = porFragmentos
      ? (FIN_PISTA - INICIO_PISTA_PARRAFO) / Math.max(1, palabras.length)
      : pista.manzanas.length > 1
        ? (pista.manzanas[pista.manzanas.length - 1] - pista.manzanas[0]) / (pista.manzanas.length - 1)
        : 0
    if (dt < 150 || largo <= 0) return null
    return (m[m.length - 1].p - m[0].p) / largo / (dt / 1000)
  }

  /**
   * Niveles 2 y 4: la voz acompaña al dedo trozo por trozo (ver vozAlDedo.ts).
   * Al entrar el dedo a un trozo, se pone en fila (y los anteriores que falten:
   * nunca se salta uno). Si el dedo vuelve atrás, la voz se corta y sigue desde ahí.
   */
  const seguirConLaVoz = (pos: number, terminada: boolean) => {
    if (oracion && voz.sigueAlDedo) return seguirOracionConElAudio(pos, terminada)
    // Volviendo atrás: se corta y no se dice nada hasta que el dedo vuelva a avanzar.
    if (pos < ultimaPos.current - RETROCESO) {
      ultimaPos.current = pos
      cortarVoz()
      return
    }
    ultimaPos.current = Math.max(ultimaPos.current, pos)
    const hasta = trozoEn(trozos.inicios, pos)
    while (proximoTrozo.current <= hasta && proximoTrozo.current < trozos.textos.length) {
      const k = proximoTrozo.current++
      const fila = encolarTrozo(filaVoz.current, trozos.palabras[k], velocidadDelDedo(), performance.now())
      filaVoz.current = fila.terminan
      // Nunca más rápido que lo normal, aunque en Ajustes la voz esté más rápida.
      voz.decirFrase(trozos.textos[k], Math.min(VELOCIDAD_MAXIMA, ajustes.velocidadVoz * fila.velocidad), true)
    }
    // Con la voz de Ciempi, la oración que suena también se apura o va más lenta según el dedo.
    if (voz.sigueAlDedo) {
      const atrasada = filaVoz.current.filter((fin) => fin > performance.now()).length >= TROZOS_DE_ATRASO
      voz.ajustarVelocidad(ajustes.velocidadVoz * (atrasada ? VELOCIDAD_MAXIMA : velocidadPara(velocidadDelDedo())))
    }
  }

  /**
   * Nivel 2 con la voz de Ciempi: la oración entera, de corrido, a la
   * velocidad de Ajustes, sin apurarse ni frenar: si el dedo va rápido, la
   * oración se pasa recién cuando la voz termina; si el dedo se queda más de
   * tres palabras atrás, la voz lo espera. Si el dedo se detiene o se levanta,
   * la voz termina hasta donde llegó el dedo y ahí se pausa (nunca se corta
   * atrasada). Si vuelve atrás, se corta y retoma desde la palabra del dedo.
   *
   * La velocidad no cambia mientras suena: al pausar y retomar un audio
   * acelerado, el navegador se salta lo que tenía preparado (casi media
   * palabra o más), y la voz se comía palabras.
   */
  const seguirOracionConElAudio = (pos: number, terminada: boolean) => {
    const o = oracionAlDedo.current
    window.clearTimeout(o.quieto)
    if (pos < ultimaPos.current - RETROCESO) {
      ultimaPos.current = pos
      voz.pausar()
      o.cortada = true
      return
    }
    ultimaPos.current = Math.max(ultimaPos.current, pos)
    const palabra = palabraEn(pos)
    const dedo = inicioDePalabra[palabra] ?? 0
    const unaPalabra = 1 / Math.max(1, palabras.length)

    if (!o.empezada) {
      o.empezada = true
      voz.decirDesde(frase, ajustes.velocidadVoz, dedo)
    } else if (o.cortada) {
      o.cortada = false
      // Retoma donde está el dedo solo si volvió a una palabra que la voz ya
      // terminó; si no (la voz venía atrasada o va en esa palabra), sigue donde iba.
      const iba = voz.progreso()
      const finDelDedo = inicioDePalabra[palabra + 1] ?? 1
      if (iba === null || finDelDedo < iba - 0.01) voz.buscar(dedo)
    }
    const va = voz.progreso()
    // La voz va más de tres palabras delante del dedo: lo espera (salvo que el dedo ya llegó al final).
    if (va !== null && va - dedo > PALABRAS_DE_VENTAJA * unaPalabra && !terminada) voz.pausar()
    else voz.reanudar()
    // Si el dedo se queda quieto, la voz termina hasta el dedo y se pausa (sigue apenas se mueva).
    if (!terminada) o.quieto = window.setTimeout(() => pausarAlLlegar(palabra), MS_DEDO_QUIETO)
  }

  /** Nivel 2: la palabra del dedo (la última cuya manzana ya pasó, o la primera). */
  const palabraEn = (pos: number) => {
    let palabra = 0
    while (palabra + 1 < pista.manzanas.length && pista.manzanas[palabra + 1] <= pos + 1e-9) palabra++
    return palabra
  }

  /**
   * Nivel 2: la voz sigue hasta terminar la palabra del dedo y ahí se pausa.
   * Si iba atrasada (el dedo fue rápido), no se corta a mitad de la oración.
   */
  const pausarAlLlegar = (palabra: number) => {
    const o = oracionAlDedo.current
    window.clearTimeout(o.quieto)
    const hasta = inicioDePalabra[palabra + 1] ?? 1
    const limite = performance.now() + MS_ESPERA_VOZ_LARGA
    const revisar = () => {
      const va = voz.progreso()
      // Todavía cargando (null pero con algo por decir) o atrasada: se espera.
      const falta = va === null ? voz.hablando() : va < hasta
      if (falta && performance.now() < limite) o.quieto = window.setTimeout(revisar, 50)
      else voz.pausar()
    }
    revisar()
  }

  /**
   * El dedo volvió atrás o se levantó: se corta la voz; al seguir, vuelve a
   * leer el trozo donde esté. En el nivel 2, al levantarse, la voz antes
   * termina lo que el dedo ya leyó.
   */
  const cortarVoz = () => {
    if (oracion && voz.sigueAlDedo) {
      oracionAlDedo.current.cortada = true
      pausarAlLlegar(palabraEn(ultimaPos.current))
      return
    }
    voz.callar()
    filaVoz.current = []
    proximoTrozo.current = trozoEn(trozos.inicios, ultimaPos.current)
  }

  const ejecutar = (efecto: Efecto) => {
    switch (efecto.tipo) {
      case 'decir': {
        if (!definicionModo.vozAlDeslizar) break
        if (porSilaba) {
          // Sílaba por sílaba: «La – u – va», reescrita para que la voz no la
          // deletree ni la lea en inglés (ver audio/pronunciacion.ts).
          const s = silabas[efecto.palabra]
          if (s) voz.decirSilaba(silabaParaLaVoz(s.texto, s.indice, palabras[s.palabra].texto, palabras[s.palabra].silabas), ajustes.velocidadVoz)
        } else if (oracion || pagina) {
          // La voz sigue al dedo por trozos (seguirConLaVoz), no por manzanas.
        } else if (porFragmentos) {
          // Cada manzana, su fragmento (si el dedo va más rápido, se dicen en orden).
          voz.decirFrase(fragmentos[efecto.palabra].map((p) => p.texto).join(' '), ajustes.velocidadVoz, true)
        } else voz.decir(palabras[efecto.palabra].texto, ajustes.velocidadVoz)
        break
      }
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
      inicioUnidad.current ??= performance.now()
      // En eco, si empieza a leer mientras Ciempi todavía habla, Ciempi se calla.
      if (definicionModo.leerFraseAntes && motorRef.current.fase === 'esperando') voz.callar()
    }
    if (entrada.tipo === 'tocar' || entrada.tipo === 'mover') registrarActividad(entrada.t)

    const config = { ...CONFIG_MOTOR_BASE, umbralPalabrasPorSegundo: ajustes.umbralPalabrasPorSegundo, sinLimite: nivel >= 2 }
    const { estado, efectos } = paso(motorRef.current, entrada, pista, config)
    // Niveles 2 y 4: la voz va donde va el dedo (si el motor lo dejó avanzar), y
    // se corta si el dedo se levanta antes de llegar al final.
    if ((oracion || pagina) && definicionModo.vozAlDeslizar) {
      if ((entrada.tipo === 'tocar' || entrada.tipo === 'mover') && estado.fase !== 'esperando' && estado.fase !== 'tropiezo') {
        seguirConLaVoz(Math.min(Math.max(entrada.pos, 0), estado.progreso), estado.fase === 'completada')
      } else if (entrada.tipo === 'soltar' && motorRef.current.fase === 'arrastrando') cortarVoz()
    }
    if (estado !== motorRef.current) {
      motorRef.current = estado
      // El dedo manda más eventos de los que el teléfono alcanza a dibujar: se
      // dibuja una vez por cuadro, siempre con la última posición (sin atrasos acumulados).
      dibujoPendiente.current ||= requestAnimationFrame(() => {
        dibujoPendiente.current = 0
        setMotor(motorRef.current)
      })
    }
    efectos.forEach(ejecutar)
  }

  const encabezado = (
    <Encabezado
      alVolver={alVolver}
      titulo={
        <span className="flex flex-col leading-tight">
          <span className="truncate">{conCapitulos ? capitulo.titulo : texto.titulo}</span>
          {(conCapitulos || total > 1) && (
            <span className="truncate text-sm font-normal text-tinta-suave apaisado:text-xs">
              {conCapitulos ? texto.titulo : `${nombreUnidad} ${indice + 1} de ${total}`}
            </span>
          )}
        </span>
      }
    >
      <Monedas cantidad={perfil.monedas} />
      <BotonIcono
        etiqueta={`Voz: ${definicionModo.nombre}`}
        icono={modo === 'solo' ? 'vozNo' : 'vozSi'}
        activo={modo === 'solo'}
        onClick={() => setMenuVoz(true)}
      />
      <BotonIcono etiqueta="Índice: volver atrás o repetir" icono="indice" onClick={() => setIndiceAbierto(true)} />
      <BotonIcono etiqueta="Ajustes de lectura" icono="ajustes" onClick={alAjustes} />
    </Encabezado>
  )

  const elegirVoz = (m: ModoLectura) => {
    setMenuVoz(false)
    voz.callar()
    props.alCambiarAjustes({ ...ajustes, modoVoz: m })
  }
  const panelVoz = menuVoz && <MenuVoz actual={modo} nivel={nivel} alElegir={elegirVoz} alCerrar={() => setMenuVoz(false)} />

  // Eco: al aparecer cada frase (u oración, párrafo…), Ciempi la lee entera antes.
  useEffect(() => {
    if (!definicionModo.leerFraseAntes || pausa || !frase) return
    const t = window.setTimeout(() => voz.decirFrase(frase, ajustes.velocidadVoz), 400)
    return () => window.clearTimeout(t)
  }, [indice, pausa, modo])

  /** Tocar una palabra la dice, en cualquier modo: es la ayuda cuando no sale. */
  const decirPalabra = (i: number) => {
    voz.desbloquear()
    voz.callar()
    if (palabras[i]) voz.decir(palabras[i].texto, ajustes.velocidadVoz)
  }

  const panelIndice = indiceAbierto && (
    <PanelIndice
      texto={{ ...texto, frases: unidades, capitulos }}
      indice={indice}
      maxima={aUnidad(leidoHasta.current)}
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
        {panelVoz}
        <Pausa
          titulo={esLibro ? '¡Leíste todo!' : '¡Terminaste un capítulo!'}
          subtitulo={pausa.titulo}
          premio={pausa.premio}
          mensaje={pausa.mensaje}
          tranquilo={tranquilo}
          apariencia={perfil.ciempi}
          principal={esLibro ? { texto: 'Volver a mis libros', accion: alVolver } : { texto: 'Seguir leyendo', accion: () => irAFrase(pausa.siguiente) }}
          secundaria={
            esLibro
              ? {
                  texto: 'Leer otra vez',
                  accion: () => {
                    sesion.current = null
                    tiempoActivo.current = { ms: 0, ultimo: 0 }
                    yaPremiadoEntero.current = premioHasta.current >= 100
                    saltarA(0)
                  },
                }
              : { texto: 'Descansar', accion: alVolver }
          }
        />
      </>
    )
  }

  const porcentaje = porcentajeLeido(fraseDeUnidad(vista, indice, totalFrases), totalFrases)
  // Al final del camino, la moneda que gana esta frase si es la primera vez que la lee (niveles 0 a 3).
  const monedaAlFinal =
    !vistaPrevia && monedasDeUnidad(nivel, indice + 1, total) > 0 && tramo.current.desde <= leidoHasta.current && fraseDeUnidad(vista, indice + 1, totalFrases) > leidoHasta.current

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {encabezado}
      {panelIndice}
      {panelVoz}
      {vistaPrevia && (
        <div className="mx-5 rounded-xl bg-petroleo-claro px-3 py-1 text-center text-sm text-petroleo">
          Vista previa: no cambia el avance ni las monedas de {perfil.apodo}
        </div>
      )}
      {props.leyendoConAdulto && (
        <div className="mx-5 rounded-xl bg-verde-claro px-3 py-1 text-center text-sm font-bold text-tinta">
          Leyendo con {perfil.apodo}: las monedas quedan en su cuenta
        </div>
      )}
      <div className="flex items-center gap-2 px-5 pt-1 text-sm text-tinta-suave apaisado:pt-0">
        <button
          onClick={() => saltarA(indice - 1)}
          disabled={indice === 0 || motor.fase === 'arrastrando'}
          aria-label="Anterior"
          title="Anterior"
          className="-ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-petroleo active:bg-petroleo-claro disabled:text-[#cfc6b4]"
        >
          <Icono nombre="anterior" className="h-5 w-5" />
        </button>
        {/* Cuánto lleva del libro y dónde están los premios. */}
        <BarraLibro porcentaje={porcentaje} nivel={nivel} premiado={premiado} tranquilo={tranquilo} />
      </div>

      <AvisoVoz className="mx-5 mt-1 apaisado:py-1" />
      <p className="mx-5 mt-1 rounded-xl bg-amarillo/25 px-3 py-1 text-center text-sm text-tinta-suave vertical-angosto:block hidden">
        📱 Gira el teléfono: se lee mejor en horizontal
      </p>
      {monedaGanada && (
        <p key={monedaGanada.n} aria-live="polite" className="moneda-sube pointer-events-none absolute right-6 top-14 z-30 rounded-full bg-amarillo px-3 py-1 text-xl font-bold text-tinta shadow-md">
          +{monedaGanada.monedas} 🪙
        </p>
      )}
      {festejo && (
        <p role="status" className="aparecer absolute inset-x-0 top-24 z-30 mx-auto w-fit rounded-full bg-naranjo px-5 py-2 text-xl font-bold text-white shadow-lg">
          {festejo}
        </p>
      )}

      {porFragmentos ? (
        <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-3 apaisado:px-10 apaisado:pb-2">
          {aviso && (
            <div role="alert" className="aparecer absolute inset-x-5 top-0 z-20 rounded-2xl bg-amarillo px-4 py-3 text-center text-2xl font-bold text-tinta shadow-md">
              {aviso}
            </div>
          )}
          <div key={indice} className={`subir flex min-h-0 flex-1 flex-col ${tranquilo ? 'tranquilo' : ''}`}>
            <ParrafoCompleto
              moneda={monedaAlFinal}
              lineas={fragmentos}
              palabrasEncendidas={palabrasEncendidas}
              porFrase={porFrase}
              motor={motor}
              pista={pista}
              tamanoLetra={ajustes.tamanoLetra}
              tranquilo={tranquilo}
              apariencia={perfil.ciempi}
              alEntrar={entrar}
              alTocarPalabra={decirPalabra}
            />
          </div>
        </div>
      ) : (
        /* Lectura centrada en la pantalla: lo ya leído arriba, la frase y el carril de Ciempi abajo. */
        <div className="flex min-h-0 flex-1 flex-col justify-center">
          {/* Lo que ya leyó, chico y tenue: da contexto sin adelantar lo que viene. */}
          <div className="flex min-h-0 shrink flex-col items-center justify-end gap-1 overflow-hidden px-6 pb-3" aria-hidden>
            {yaLeidas.map((f, i) => (
              <p
                key={indice - yaLeidas.length + i}
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
                moneda={monedaAlFinal}
                porSilaba={porSilaba}
                soloUltimaManzana={oracion}
                palabras={palabras}
                motor={motor}
                pista={pista}
                alMedir={setPistaMedida}
                tamanoLetra={ajustes.tamanoLetra}
                tranquilo={tranquilo}
                apariencia={perfil.ciempi}
                alEntrar={entrar}
                alTocarPalabra={decirPalabra}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Cuánto del libro lleva (siempre desde el 0 % al abrirlo) y dónde están los
 * premios por avance (apagados si ya los ganó); la meta del final, siempre.
 */
function BarraLibro({ porcentaje, nivel, premiado, tranquilo }: { porcentaje: number; nivel: NivelLectura; premiado: number; tranquilo: boolean }) {
  return (
    <div className="flex flex-1 items-center gap-2">
      <div
        className="relative h-6 flex-1 rounded-full border-2 border-[#d9cdb4] bg-white shadow-inner"
        role="progressbar"
        aria-label="Avance del cuento"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full overflow-hidden rounded-full">
          <div
            className={`relative h-full rounded-full bg-gradient-to-r from-[#8eb743] via-[#a9c670] to-[#efc31d] ${tranquilo ? '' : 'transition-[width] duration-500 ease-out'}`}
            style={{ width: `${Math.max(porcentaje, 4)}%` }}
          >
            <span className="absolute inset-x-2 top-1 h-1.5 rounded-full bg-white/45" />
          </div>
        </div>
        {HITOS[nivel].map((h) => (
          <span
            key={h.porcentaje}
            title={`${h.porcentaje} %: ${h.monedas} monedas`}
            className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm ${h.porcentaje <= premiado ? 'opacity-35 grayscale' : ''}`}
            style={{ left: `${Math.min(h.porcentaje, 96)}%` }}
            aria-hidden
          >
            {h.porcentaje === 100 ? '🏁' : '🪙'}
          </span>
        ))}
        {/* La meta del libro, aunque en este nivel las monedas vayan por frase. */}
        {!HITOS[nivel].some((h) => h.porcentaje === 100) && (
          <span className="absolute left-[96%] top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm" aria-hidden>
            🏁
          </span>
        )}
      </div>
      <span className="shrink-0 rounded-full bg-verde px-2.5 py-0.5 text-sm font-bold text-white tabular-nums shadow-sm">{porcentaje} %</span>
    </div>
  )
}

/** Elegir cómo acompaña la voz: con cada palabra, la frase antes, o sin voz. */
function MenuVoz({ actual, nivel, alElegir, alCerrar }: { actual: ModoLectura; nivel: NivelLectura; alElegir: (m: ModoLectura) => void; alCerrar: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-tinta/30 sm:items-center" onClick={alCerrar}>
      <div
        role="dialog"
        aria-label="Voz"
        onClick={(e) => e.stopPropagation()}
        className="aparecer flex w-full max-w-md flex-col gap-2 rounded-t-3xl bg-crema p-4 shadow-xl sm:rounded-3xl"
      >
        <p className="text-center text-lg font-bold">¿Cómo te ayuda Ciempi?</p>
        {(['coro', 'eco', 'solo'] as const).map((m) => (
          <button
            key={m}
            onClick={() => alElegir(m)}
            aria-pressed={m === actual}
            className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-left ${m === actual ? 'bg-petroleo text-white' : 'bg-white'}`}
          >
            <span className="text-2xl" aria-hidden>
              {m === 'coro' ? '🗣️' : m === 'eco' ? '👂' : '🤫'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{MODOS[m].nombre}</span>
              <span className={`block text-sm ${m === actual ? 'text-white/85' : 'text-tinta-suave'}`}>{descripcionModo(m, nivel)}</span>
            </span>
          </button>
        ))}
      </div>
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
  /** Si no hay premio: por qué (o un «¡muy bien!»). */
  mensaje: string
  tranquilo: boolean
  apariencia: AparienciaCiempi
  principal: { texto: string; accion: () => void }
  secundaria: { texto: string; accion: () => void }
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-6 py-4 text-center apaisado:flex-row apaisado:gap-10">
      {/* Su Ciempi celebra: Victoria si hubo premio, Celebración si no. */}
      <div className="w-64 shrink-0 apaisado:w-56">
        <CiempiPersonaje apariencia={props.apariencia} ancho="100%" animado={!props.tranquilo} accion={{ id: props.premio > 0 ? 'A10' : 'A03', n: 1 }} />
      </div>
      <div className="flex flex-col items-center gap-4">
        <div>
          <p className="text-3xl font-bold text-petroleo">{props.titulo}</p>
          <p className="mt-1 text-lg text-tinta-suave">{props.subtitulo}</p>
        </div>
        {props.premio > 0 ? (
          <p className="aparecer text-3xl font-bold text-naranjo">+{props.premio} 🪙 de premio</p>
        ) : (
          <p className="aparecer max-w-md text-xl font-bold text-verde">{props.mensaje}</p>
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
