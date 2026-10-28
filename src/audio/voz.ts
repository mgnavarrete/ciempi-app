import { Capacitor } from '@capacitor/core'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { instalarVozDelTelefono } from '../plataforma/telefono'
import { dividirEnFragmentos } from '../lenguaje/frases'
import { fraseParaLaVoz, palabraParaLaVoz, silabaParaMicrosoft } from './pronunciacion'
import { VozServidor } from './vozServidor'

/**
 * Voz de Ciempi. Dice palabras, frases y, en el nivel 0, sílabas sueltas. Con cuenta
 * en línea la genera el servidor (vozServidor.ts); si no, la del teléfono o
 * navegador (Web Speech API o el motor nativo de Android).
 * Es la voz de Ciempi: de hombre si Ciempi es niño, de mujer si es niña.
 * Preferencia de voz: es-CL → español latinoamericano → cualquier español.
 */

/** La voz nunca habla más rápido que esto, aunque se pida (en Ajustes o al seguir al dedo): más rápido no se entiende bien. */
export const VELOCIDAD_MAXIMA_VOZ = 1.2

const PREFERENCIA_REGIONES = ['es-cl', 'es-419', 'es-us', 'es-mx', 'es-ar', 'es-co', 'es-pe']

export type GeneroVoz = 'masculina' | 'femenina'

/**
 * La Web Speech API no dice si una voz es de hombre o de mujer: se deduce
 * por el nombre de las voces más comunes (Android, iOS, Windows, macOS).
 */
const MASCULINAS = /\b(male|hombre|masculin\w*|jorge|pablo|diego|juan|carlos|ra[uú]l|[aá]lvaro|enrique|andr[eé]s|gonzalo|lorenzo|tom[aá]s|federico|jos[eé]|miguel|jaime|gerardo|alonso|eddy|reed|rocko|grandpa)\b/i
const FEMENINAS = /\b(female|mujer|femenin\w*|paulina|m[oó]nica|francisca|helena|laura|sabina|dalia|lupe|paloma|elvira|marisol|soledad|ang[eé]lica|isabela|camila|valentina|catalina|flo|sandy|shelley|grandma|google)\b/i

export function generoDeVoz(nombre: string): GeneroVoz | null {
  if (MASCULINAS.test(nombre)) return 'masculina'
  if (FEMENINAS.test(nombre)) return 'femenina'
  return null
}

type VozMinima = Pick<SpeechSynthesisVoice, 'lang' | 'name' | 'localService'>

const REGIONES_ISO3: Record<string, string> = { usa: 'us', mex: 'mx', esp: 'es', chl: 'cl', arg: 'ar', col: 'co', per: 'pe' }

/**
 * Idioma de una voz como "es-cl". Algunos motores de Android (Samsung) usan
 * códigos de tres letras: "spa-USA" o "spa_MEX" → "es-us", "es-mx".
 */
export function idiomaDeVoz(lang: string): string {
  const [idioma = '', region] = lang.toLowerCase().replace(/_/g, '-').split('-')
  const base = idioma === 'spa' ? 'es' : idioma
  return region ? `${base}-${REGIONES_ISO3[region] ?? region}` : base
}

export const esEspanol = (lang: string) => idiomaDeVoz(lang).split('-')[0] === 'es'

/**
 * Elige la voz: primero una del género pedido en la región preferida (o en
 * cualquier español); si no hay, la mejor voz de la región aunque sea del
 * otro género (y el tono se ajusta, ver `tonoPara`).
 */
export function elegirVoz<V extends VozMinima>(voces: V[], genero: GeneroVoz | null = null): V | null {
  const idioma = (v: V) => idiomaDeVoz(v.lang)
  const espanol = voces.filter((v) => esEspanol(v.lang))
  const mejor = (lista: V[]) => {
    for (const region of PREFERENCIA_REGIONES) {
      const candidatas = lista.filter((v) => idioma(v) === region)
      // Las voces locales responden más rápido que las de red.
      const voz = candidatas.find((v) => v.localService) ?? candidatas[0]
      if (voz) return voz
    }
    return lista[0] ?? null
  }
  if (genero) {
    const delGenero = mejor(espanol.filter((v) => generoDeVoz(v.name) === genero))
    if (delGenero) return delGenero
  }
  return mejor(espanol)
}

/** Si no hay voz del género pedido, se acerca subiendo o bajando el tono. */
export function tonoPara(voz: VozMinima | null, genero: GeneroVoz | null): number {
  if (!voz || !genero) return 1
  const real = generoDeVoz(voz.name)
  if (real === genero) return 1
  if (genero === 'masculina') return real === 'femenina' ? 0.7 : 0.85
  return real === 'masculina' ? 1.35 : 1.15
}

export { limpiarParaVoz } from './pronunciacion'

/** Hasta este largo se le pide un texto a la voz del servidor de una vez; si es más largo, por oraciones. */
const LARGO_DE_UNA_VEZ = 280

/** Un texto ya listo para la voz, en partes que el servidor acepta (y que coinciden con lo grabado). */
function partesParaLaVoz(texto: string): string[] {
  const limpio = fraseParaLaVoz(texto)
  if (limpio.length <= LARGO_DE_UNA_VEZ) return limpio ? [limpio] : []
  return dividirEnFragmentos(limpio, { porOracion: true }).flatMap((o) => (o.length <= LARGO_DE_UNA_VEZ ? [o] : dividirEnFragmentos(o)))
}

// ── Motores de voz ─────────────────────────────────────────────────────────
// En el navegador se usa la Web Speech API. Dentro de la app Android
// (Capacitor) esa API no existe en el WebView: se usa el motor de voz nativo
// del teléfono con el plugin @capacitor-community/text-to-speech.

interface VozDelMotor extends VozMinima {
  /** Índice de la voz en el motor nativo (el plugin las identifica así). */
  indice?: number
  /** Identificador único de la voz en el motor (el nombre puede repetirse). */
  voiceURI?: string
}

/**
 * Qué voz usar, elegida en Ajustes y guardada en este dispositivo (las voces
 * del teléfono cambian de un equipo a otro):
 * - "auto": la voz de Ciempi del servidor (Lorenzo si Ciempi es niño,
 *   Catalina si es niña) y, si no está, la mejor del teléfono;
 * - "ciempi:<voz>": una de las voces de Ciempi (Lorenzo, Catalina, Paloma o Alonso);
 * - "ciempi-nino" / "ciempi-nina": como se guardaba antes (Lorenzo y Catalina);
 * - "equipo:<id>": una voz del teléfono o navegador, de cualquier idioma.
 */
export type EleccionVoz = 'auto' | 'ciempi-nino' | 'ciempi-nina' | `ciempi:${VozConNombre}` | `equipo:${string}`

/** Las voces de Ciempi (de Microsoft, en el servidor), en el orden en que se ofrecen. */
export const VOCES_CIEMPI = [
  { id: 'lorenzo', nombre: 'Lorenzo', detalle: 'hombre, Chile' },
  { id: 'catalina', nombre: 'Catalina', detalle: 'mujer, Chile' },
  { id: 'paloma', nombre: 'Paloma', detalle: 'mujer, latinoamericana' },
  { id: 'alonso', nombre: 'Alonso', detalle: 'hombre, latinoamericano' },
] as const
export type VozConNombre = (typeof VOCES_CIEMPI)[number]['id']

export interface OpcionVoz {
  id: EleccionVoz
  nombre: string
  espanol: boolean
}

const CLAVE_ELECCION = 'ciempi:voz-elegida'
const idDeVoz = (v: VozDelMotor) => v.voiceURI || `${v.name}|${v.lang}`

function leerEleccion(): EleccionVoz {
  try {
    return (localStorage.getItem(CLAVE_ELECCION) as EleccionVoz | null) ?? 'auto'
  } catch {
    return 'auto'
  }
}

interface OpcionesHablar {
  voz: VozDelMotor | null
  velocidad: number
  tono: number
  /** true: se encola detrás de lo que esté sonando; false: corta lo anterior. */
  encolar: boolean
}

interface MotorVoz {
  voces(): Promise<VozDelMotor[]>
  /** ¿El teléfono o navegador puede hablar en español? null: todavía no se sabe. */
  hayEspanol(voces: VozDelMotor[]): Promise<boolean | null>
  alCambiarVoces(fn: () => void): void
  hablar(texto: string, o: OpcionesHablar): void
  callar(): void
  hablando(): boolean
  /** Hay palabras esperando que todavía no empiezan a sonar. */
  enCola(): boolean
  /** Lo último que falló (para mostrarlo en Ajustes), o null. */
  ultimoError(): string | null
}

function motorWeb(): MotorVoz | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  return {
    async voces() {
      return speechSynthesis.getVoices()
    },
    async hayEspanol(voces) {
      // La lista llega vacía mientras el navegador la carga.
      return voces.length ? voces.some((v) => esEspanol(v.lang)) : null
    },
    alCambiarVoces(fn) {
      speechSynthesis.addEventListener?.('voiceschanged', fn)
    },
    hablar(texto, o) {
      if (!o.encolar) speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(texto)
      u.lang = o.voz?.lang ?? 'es-CL'
      const nativa = speechSynthesis.getVoices().find((v) => v.name === o.voz?.name)
      if (nativa) u.voice = nativa
      u.rate = o.velocidad
      u.pitch = o.tono
      speechSynthesis.speak(u)
    },
    callar: () => speechSynthesis.cancel(),
    hablando: () => speechSynthesis.speaking || speechSynthesis.pending,
    enCola: () => speechSynthesis.pending,
    ultimoError: () => null,
  }
}

function motorNativo(): MotorVoz | null {
  if (!Capacitor.isNativePlatform()) return null
  // Ojo: el plugin nunca se devuelve desde una promesa (ni con await). Es un Proxy de
  // Capacitor que "tiene" cualquier método, también then(): la promesa lo confundía con
  // otra promesa, llamaba a un then() nativo que no existe y la voz del teléfono fallaba siempre.
  const tts = TextToSpeech
  // Lo que está sonando o en cola, cada cosa con su número. Al cortar (decir algo
  // nuevo sin encolar, o callar) se olvida lo anterior: si su aviso de «terminé»
  // llega tarde, ya no cuenta, y lo nuevo sigue contando como «hablando».
  const pendientes = new Set<number>()
  let ultimo = 0
  let error: string | null = null
  /** El primer español que acepta el teléfono: se usa si no se pudo elegir una voz. */
  let espanolDelTelefono: string | null = null
  const ESPANOLES = ['es-US', 'es-MX', 'es-ES', 'es']
  const mensaje = (e: unknown) => (e instanceof Error ? e.message : String(e))

  return {
    async voces() {
      try {
        const { voices } = await tts.getSupportedVoices()
        return voices.map((v, indice) => ({ ...v, indice }))
      } catch (e) {
        // Antes de que el motor de voz de Android termine de arrancar, falla.
        error = `el motor de voz todavía no responde (${mensaje(e)})`
        return []
      }
    },
    async hayEspanol(voces) {
      // Mientras el motor arranca no entrega voces y dice que no hay ningún idioma: todavía no se sabe.
      if (!voces.length) return null
      for (const lang of ESPANOLES) {
        if ((await tts.isLanguageSupported({ lang })).supported) {
          espanolDelTelefono = lang
          return true
        }
      }
      return false
    },
    alCambiarVoces(fn) {
      // El motor de voz de Android tarda en arrancar (a veces varios segundos):
      // se pregunta cada segundo hasta que entregue voces, por hasta un minuto.
      let intentos = 0
      const esperarMotor = async () => {
        const listo = await tts
          .getSupportedVoices()
          .then(({ voices }) => voices.length > 0)
          .catch(() => false)
        if (listo) {
          error = null
          return fn()
        }
        if (++intentos < 60) setTimeout(() => void esperarMotor(), 1000)
      }
      void esperarMotor()
      // Al volver de instalar una voz en los ajustes del teléfono.
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && fn())
    },
    hablar(texto, o) {
      if (!o.encolar) pendientes.clear()
      const mio = ++ultimo
      pendientes.add(mio)
      const decirEn = (lang: string, conVoz: boolean) =>
        tts.speak({ text: texto, lang, voice: conVoz ? o.voz?.indice : undefined, rate: o.velocidad, pitch: o.tono, queueStrategy: o.encolar ? 1 : 0 })
      void (async () => {
          const primero = o.voz ? idiomaDeVoz(o.voz.lang) : (espanolDelTelefono ?? 'es-US')
          try {
            await decirEn(primero, true)
          } catch (e) {
            // El teléfono rechazó ese idioma o esa voz: se prueba con otras variantes de español.
            error = `no pudo decir "${texto}" en ${primero}: ${mensaje(e)}`
            for (const lang of ESPANOLES.filter((l) => l !== primero)) {
              try {
                await decirEn(lang, false)
                espanolDelTelefono = lang
                return
              } catch {
                // Sigue con la próxima.
              }
            }
          }
        })().finally(() => {
          pendientes.delete(mio)
        })
    },
    callar() {
      pendientes.clear()
      void tts.stop().catch(() => {})
    },
    hablando: () => pendientes.size > 0,
    enCola: () => pendientes.size > 1,
    ultimoError: () => error,
  }
}

class Voz {
  private motor: MotorVoz | null = motorNativo() ?? motorWeb()
  /** Voz de Ciempi generada en el servidor; si no está, se usa la del teléfono (`motor`). */
  private servidor: VozServidor | null = null
  private voz: VozDelMotor | null = null
  private vocesDelEquipo: VozDelMotor[] = []
  private eleccionActual: EleccionVoz = leerEleccion()
  private genero: GeneroVoz | null = null
  private tono = 1
  private velocidadActual = 1
  private sinEspanol = false
  private conteo = { total: 0, espanol: 0 }
  private desbloqueada = false
  private alCambiar = new Set<() => void>()

  constructor() {
    if (!this.motor) return
    void this.actualizarVoces()
    this.motor.alCambiarVoces(() => void this.actualizarVoces())
  }

  /** Con cuenta en línea, la voz sale del servidor de Ciempi (ver DatosProvider). */
  usarServidor(base: string, token: () => string | null) {
    this.servidor = new VozServidor(base, token, (texto) => this.motor?.hablar(texto, this.opcionesMotor(true)))
    this.alCambiar.forEach((fn) => fn())
    void this.comprobarServidor()
  }

  /** Al abrir la app y al iniciar sesión: ¿la voz de Ciempi del servidor está funcionando? */
  async comprobarServidor() {
    await this.servidor?.comprobar()
    this.alCambiar.forEach((fn) => fn())
  }

  /** Se está usando la voz de Ciempi del servidor (y no la del teléfono). */
  get conServidor(): boolean {
    return !this.eleccionActual.startsWith('equipo:') && !!this.servidor?.disponible
  }

  private get vozCiempi(): VozConNombre {
    if (this.eleccionActual.startsWith('ciempi:')) return this.eleccionActual.slice(7) as VozConNombre
    if (this.eleccionActual === 'ciempi-nino') return 'lorenzo'
    if (this.eleccionActual === 'ciempi-nina') return 'catalina'
    return this.genero === 'femenina' ? 'catalina' : 'lorenzo'
  }

  get eleccion(): EleccionVoz {
    return this.eleccionActual
  }

  /** Las voces que se pueden elegir en Ajustes: las de Ciempi y todas las del equipo (español primero). */
  get opciones(): OpcionVoz[] {
    const ciempi: OpcionVoz[] = this.servidor
      ? [
          ...VOCES_CIEMPI.map((v) => ({ id: `ciempi:${v.id}` as EleccionVoz, nombre: `Voz de Ciempi: ${v.nombre} (${v.detalle})`, espanol: true })),
        ]
      : []
    const equipo = this.vocesDelEquipo
      .map((v) => ({
        id: `equipo:${idDeVoz(v)}` as EleccionVoz,
        nombre: v.voiceURI && v.voiceURI !== v.name ? `${v.name} · ${v.voiceURI}` : `${v.name} (${v.lang})`,
        espanol: esEspanol(v.lang),
      }))
      .sort((a, b) => Number(b.espanol) - Number(a.espanol) || a.nombre.localeCompare(b.nombre))
    return [{ id: 'auto', nombre: 'Automática (recomendada)', espanol: true }, ...ciempi, ...equipo]
  }

  /** Revisa si la voz de Ciempi del servidor funciona (null) o qué falla. undefined: no hay servidor. */
  async diagnosticarServidor(): Promise<string | null | undefined> {
    if (!this.servidor) return undefined
    const resultado = await this.servidor.diagnosticar(this.vozCiempi)
    this.alCambiar.forEach((fn) => fn())
    return resultado
  }

  /** Vuelve a pedir las voces del equipo (al abrir Ajustes, como Kuentu: el motor ya está listo). */
  refrescarVoces() {
    void this.actualizarVoces()
  }

  /** Cambia la voz y la recuerda en este dispositivo. */
  elegir(eleccion: EleccionVoz) {
    this.eleccionActual = eleccion
    try {
      localStorage.setItem(CLAVE_ELECCION, eleccion)
    } catch {
      // Sin almacenamiento: vale mientras la app esté abierta.
    }
    this.callar()
    void this.actualizarVoces()
  }

  private opcionesMotor(encolar: boolean): OpcionesHablar {
    return { voz: this.voz, velocidad: this.velocidadActual, tono: this.tono, encolar }
  }

  get disponible() {
    return this.motor !== null || this.servidor !== null
  }

  /** No hay voz del servidor y el teléfono no tiene español: hay que instalarla (salvo que se eligiera una voz a mano). */
  get faltaEspanol(): boolean {
    return !this.eleccionActual.startsWith('equipo:') && !this.conServidor && this.sinEspanol
  }

  /** Abre la descarga de voces del teléfono (solo en la APK de Android). */
  instalarEspanol() {
    void instalarVozDelTelefono().catch(() => {})
  }

  /** Para revisar en Ajustes qué encontró la app en el teléfono (y lo último que falló). */
  get resumenVoces(): string {
    const error = this.motor?.ultimoError()
    return `${this.conteo.total} voces en el equipo, ${this.conteo.espanol} en español${error ? `. Último error: ${error}` : ''}`
  }

  get nombreVoz(): string | null {
    if (this.conServidor) return `Voz de Ciempi: ${VOCES_CIEMPI.find((v) => v.id === this.vozCiempi)?.nombre}`
    return this.voz ? `${this.voz.name} (${this.voz.lang})` : null
  }

  suscribir(fn: () => void) {
    this.alCambiar.add(fn)
    return () => void this.alCambiar.delete(fn)
  }

  /** Voz de hombre o de mujer según si Ciempi es niño o niña. */
  usarGenero(genero: GeneroVoz | null) {
    if (genero === this.genero) return
    this.genero = genero
    void this.actualizarVoces()
  }

  private async actualizarVoces() {
    if (!this.motor) return
    // Android carga las voces de forma asíncrona: al principio la lista viene vacía.
    const voces = await this.motor.voces().catch(() => [])
    // El motor puede responder vacío un momento (por ejemplo al volver a la app): no se pierde lo ya encontrado.
    if (!voces.length && this.vocesDelEquipo.length) return
    this.vocesDelEquipo = voces
    this.conteo = { total: voces.length, espanol: voces.filter((v) => esEspanol(v.lang)).length }
    // Una voz del equipo elegida a mano se usa tal cual (sin cambiarle el tono).
    const elegida = this.eleccionActual.startsWith('equipo:') ? voces.find((v) => `equipo:${idDeVoz(v)}` === this.eleccionActual) : undefined
    this.voz = elegida ?? elegirVoz(voces, this.genero)
    this.tono = elegida ? 1 : tonoPara(this.voz, this.genero)
    this.sinEspanol = (await this.motor.hayEspanol(voces).catch(() => null)) === false
    this.alCambiar.forEach((fn) => fn())
  }

  /** iOS, Android y algunos navegadores solo permiten sonar después de un gesto del usuario. */
  desbloquear() {
    this.servidor?.desbloquear()
    if (!this.motor || this.desbloqueada) return
    this.desbloqueada = true
    if ('speechSynthesis' in globalThis) {
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      speechSynthesis.speak(u)
    }
  }

  /** Pide de antemano el audio de estas palabras (o sílabas), para que suenen sin demora. */
  precargar(palabras: string[]) {
    if (!this.conServidor) return
    this.servidor!.precargar(palabras.map(palabraParaLaVoz).filter(Boolean), this.vozCiempi)
  }

  /** Lo mismo para las sílabas del nivel 0 (ver `decirSilaba`). */
  precargarSilabas(silabas: string[]) {
    if (!this.conServidor) return
    this.servidor!.precargar(silabas.map((s) => silabaParaMicrosoft(palabraParaLaVoz(s))).filter(Boolean), this.vozCiempi)
  }

  /** Lo mismo para frases y oraciones. */
  precargarFrases(frases: string[]) {
    if (!this.conServidor) return
    this.servidor!.precargar(frases.flatMap(partesParaLaVoz), this.vozCiempi)
  }

  decir(texto: string, velocidadPedida: number) {
    const limpio = palabraParaLaVoz(texto)
    if (!limpio) return
    const velocidad = Math.min(VELOCIDAD_MAXIMA_VOZ, velocidadPedida)
    this.velocidadActual = velocidad
    // Si hay palabras esperando en la cola, el niño va más rápido que la voz:
    // se descarta lo atrasado para que lo que suena coincida con el dedo.
    if (this.conServidor) return this.servidor!.hablar(limpio, this.vozCiempi, velocidad, !this.servidor!.enCola())
    if (!this.motor) return
    this.motor.hablar(limpio, this.opcionesMotor(!this.motor.enCola()))
  }

  /**
   * Una sílaba suelta (nivel 0, ya pasada por `silabaParaLaVoz`). La voz de
   * Ciempi la pide escrita para que no la deletree (ver `silabaParaMicrosoft`).
   */
  decirSilaba(silaba: string, velocidadPedida: number) {
    this.decir(this.conServidor ? silabaParaMicrosoft(palabraParaLaVoz(silaba)) : silaba, velocidadPedida)
  }

  /**
   * Dice un texto de corrido (sin emojis, que la voz leería en voz alta). Con
   * `encolar`, después de lo que esté sonando; si no, lo corta.
   */
  decirFrase(texto: string, velocidadPedida = 1, encolar = false) {
    const limpio = fraseParaLaVoz(texto)
    if (!limpio) return
    const velocidad = Math.min(VELOCIDAD_MAXIMA_VOZ, velocidadPedida)
    this.velocidadActual = velocidad
    if (this.conServidor) {
      // Un texto largo (un párrafo, una página) se pide oración por oración.
      partesParaLaVoz(limpio).forEach((parte, i) => this.servidor!.hablar(parte, this.vozCiempi, velocidad, encolar || i > 0))
      return
    }
    this.motor?.hablar(limpio, this.opcionesMotor(encolar))
  }

  // ── Seguir al dedo (niveles 2 y 4) ──────────────────────────────────────
  // Solo con la voz de Ciempi del servidor: es un audio, y se le puede cambiar
  // la velocidad, pausar o retomar mientras habla. Con la voz del teléfono no.

  get sigueAlDedo(): boolean {
    return this.conServidor
  }

  /** Dice una oración empezando desde esta parte (0..1), para retomar donde está el dedo. */
  decirDesde(texto: string, velocidadPedida: number, desde: number) {
    if (!this.conServidor) return this.decirFrase(texto, velocidadPedida)
    this.servidor!.hablar(fraseParaLaVoz(texto), this.vozCiempi, Math.min(VELOCIDAD_MAXIMA_VOZ, velocidadPedida), false, desde)
  }

  ajustarVelocidad(velocidadPedida: number) {
    this.servidor?.ajustarVelocidad(Math.min(VELOCIDAD_MAXIMA_VOZ, velocidadPedida))
  }

  pausar() {
    this.servidor?.pausar()
  }

  reanudar() {
    this.servidor?.reanudar()
  }

  /** Qué parte de lo que suena ya se dijo (0..1), o null. */
  progreso(): number | null {
    return this.servidor?.progreso() ?? null
  }

  buscar(fraccion: number) {
    this.servidor?.buscar(fraccion)
  }

  /** Hay algo sonando o por sonar. */
  hablando(): boolean {
    return !!this.servidor?.hablando() || !!this.motor?.hablando()
  }

  callar() {
    this.servidor?.callar()
    this.motor?.callar()
  }

  /** Resuelve cuando la voz termina de hablar lo que tiene en cola (o tras `maximoMs`). */
  esperarSilencio(maximoMs = 1500): Promise<void> {
    return new Promise((resolver) => {
      const inicio = performance.now()
      const revisar = () => {
        const hablando = !!this.servidor?.hablando() || !!this.motor?.hablando()
        if (!hablando || performance.now() - inicio > maximoMs) resolver()
        else setTimeout(revisar, 80)
      }
      revisar()
    })
  }
}

export const voz = new Voz()
