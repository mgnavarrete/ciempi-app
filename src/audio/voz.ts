import { Capacitor } from '@capacitor/core'
import { instalarVozDelTelefono } from '../plataforma/telefono'

/**
 * Voz con la Web Speech API. Dice palabras completas (nunca sílabas sueltas).
 * Es la voz de Ciempi: de hombre si Ciempi es niño, de mujer si es niña.
 * Preferencia de voz: es-CL → español latinoamericano → cualquier español.
 */

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

/** Quita signos para que la voz no cambie la entonación ("perro," → "perro"). */
export function limpiarParaVoz(palabra: string): string {
  return palabra.replace(/[^\p{L}\p{N}]/gu, '')
}

// ── Motores de voz ─────────────────────────────────────────────────────────
// En el navegador se usa la Web Speech API. Dentro de la app Android
// (Capacitor) esa API no existe en el WebView: se usa el motor de voz nativo
// del teléfono con el plugin @capacitor-community/text-to-speech.

interface VozDelMotor extends VozMinima {
  /** Índice de la voz en el motor nativo (el plugin las identifica así). */
  indice?: number
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
  }
}

function motorNativo(): MotorVoz | null {
  if (!Capacitor.isNativePlatform()) return null
  // Se carga recién en el teléfono: en la web no se incluye en el arranque.
  const plugin = import('@capacitor-community/text-to-speech').then((m) => m.TextToSpeech)
  let pendientes = 0
  /** El primer español que acepta el teléfono: se usa si no se pudo elegir una voz. */
  let espanolDelTelefono: string | null = null
  return {
    async voces() {
      const { voices } = await (await plugin).getSupportedVoices()
      return voices.map((v, indice) => ({ ...v, indice }))
    },
    async hayEspanol() {
      // Sin los datos de voz en español, Android rechaza cada palabra y no suena nada.
      const tts = await plugin
      for (const lang of ['es-US', 'es-MX', 'es-ES', 'es']) {
        if ((await tts.isLanguageSupported({ lang })).supported) {
          espanolDelTelefono = lang
          return true
        }
      }
      return false
    },
    alCambiarVoces(fn) {
      // El motor de voz de Android tarda en arrancar: al principio no entrega voces.
      for (const ms of [500, 1500, 4000]) setTimeout(fn, ms)
      // Al volver de instalar una voz en los ajustes del teléfono.
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && fn())
    },
    hablar(texto, o) {
      pendientes = o.encolar ? pendientes + 1 : 1
      void plugin
        .then((tts) =>
          tts.speak({
            text: texto,
            lang: o.voz ? idiomaDeVoz(o.voz.lang) : (espanolDelTelefono ?? 'es-US'),
            voice: o.voz?.indice,
            rate: o.velocidad,
            pitch: o.tono,
            queueStrategy: o.encolar ? 1 : 0,
          }),
        )
        .catch(() => {})
        .finally(() => {
          pendientes = Math.max(0, pendientes - 1)
        })
    },
    callar() {
      pendientes = 0
      void plugin.then((tts) => tts.stop()).catch(() => {})
    },
    hablando: () => pendientes > 0,
    enCola: () => pendientes > 1,
  }
}

class Voz {
  private motor: MotorVoz | null = motorNativo() ?? motorWeb()
  private voz: VozDelMotor | null = null
  private genero: GeneroVoz | null = null
  private tono = 1
  private sinEspanol = false
  private conteo = { total: 0, espanol: 0 }
  private desbloqueada = false
  private alCambiar = new Set<() => void>()

  constructor() {
    if (!this.motor) return
    void this.actualizarVoces()
    this.motor.alCambiarVoces(() => void this.actualizarVoces())
  }

  get disponible() {
    return this.motor !== null
  }

  /** Hay voz, pero no en español: hay que instalarla en el teléfono. */
  get faltaEspanol(): boolean {
    return this.sinEspanol
  }

  /** Abre la descarga de voces del teléfono (solo en la APK de Android). */
  instalarEspanol() {
    void instalarVozDelTelefono().catch(() => {})
  }

  /** Para revisar en Ajustes qué encontró la app en el teléfono. */
  get resumenVoces(): string {
    return `${this.conteo.total} voces en el equipo, ${this.conteo.espanol} en español`
  }

  get nombreVoz(): string | null {
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
    this.conteo = { total: voces.length, espanol: voces.filter((v) => esEspanol(v.lang)).length }
    this.voz = elegirVoz(voces, this.genero)
    this.tono = tonoPara(this.voz, this.genero)
    this.sinEspanol = (await this.motor.hayEspanol(voces).catch(() => null)) === false
    this.alCambiar.forEach((fn) => fn())
  }

  /** iOS y algunos navegadores solo permiten hablar después de un gesto del usuario. */
  desbloquear() {
    if (!this.motor || this.desbloqueada) return
    this.desbloqueada = true
    if ('speechSynthesis' in globalThis) {
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      speechSynthesis.speak(u)
    }
  }

  decir(texto: string, velocidad: number) {
    if (!this.motor) return
    const limpio = limpiarParaVoz(texto)
    if (!limpio) return
    // Si hay palabras esperando en la cola, el niño va más rápido que la voz:
    // se descarta lo atrasado para que lo que suena coincida con el dedo.
    const encolar = !this.motor.enCola()
    this.motor.hablar(limpio.toLowerCase(), { voz: this.voz, velocidad, tono: this.tono, encolar })
  }

  /** Dice una frase completa (para que Ciempi hable). Sin emojis, que la voz leería en voz alta. */
  decirFrase(texto: string, velocidad = 1) {
    if (!this.motor) return
    const limpio = texto.replace(/[\p{Extended_Pictographic}️‍]/gu, '').replace(/\s+/g, ' ').trim()
    if (!limpio) return
    this.motor.hablar(limpio, { voz: this.voz, velocidad, tono: this.tono, encolar: false })
  }

  callar() {
    this.motor?.callar()
  }

  /** Resuelve cuando la voz termina de hablar lo que tiene en cola (o tras `maximoMs`). */
  esperarSilencio(maximoMs = 1500): Promise<void> {
    return new Promise((resolver) => {
      const motor = this.motor
      if (!motor) return resolver()
      const inicio = performance.now()
      const revisar = () => {
        if (!motor.hablando() || performance.now() - inicio > maximoMs) resolver()
        else setTimeout(revisar, 80)
      }
      revisar()
    })
  }
}

export const voz = new Voz()
