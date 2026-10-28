/**
 * Voz de Ciempi generada en el servidor (GET /api/voz): las voces neuronales
 * de Microsoft (Lorenzo, Catalina, Paloma y Alonso) u otra que tenga el
 * servidor. Suena igual en todos los teléfonos y navegadores.
 *
 * El audio se pide siempre a velocidad 1 y la velocidad se cambia al
 * reproducir (sin cambiar el tono): así el mismo audio guardado sirve para
 * todo, y en los niveles 2 y 4 la voz puede apurarse, ir más lenta o
 * pausarse mientras habla, siguiendo al dedo (ver PantallaLectura).
 * Lo pedido se guarda en memoria; la lectura precarga lo que viene.
 */

/** La voz de Ciempi niño o niña, o una voz con nombre (ver server/src/voz.ts). */
export type VozCiempi = 'nino' | 'nina' | 'lorenzo' | 'catalina' | 'paloma' | 'alonso'

interface Pedido {
  texto: string
  voz: VozCiempi
  velocidad: number
  /** Empezar desde esta parte del audio (0..1), para retomar a mitad de una oración. */
  desde?: number
}

const MAXIMO_EN_MEMORIA = 400
/** Un instante de silencio: tocarlo al primer toque habilita el audio en Android e iOS. */
const SILENCIO = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA='

export class VozServidor {
  /** Dirección local (blob:) del audio de cada texto ya pedido. */
  private audios = new Map<string, Promise<string>>()
  private cola: Pedido[] = []
  private sonando: HTMLAudioElement | null = null
  /** Cambia cada vez que se corta lo que suena, para descartar lo que venía en camino. */
  private turno = 0
  private fallandoHasta = 0
  private pausada = false

  /**
   * @param base dirección del servidor ("" en la web publicada)
   * @param token sesión actual; sin sesión no hay voz del servidor
   * @param alFallar se llama con lo que no se pudo decir, para decirlo con la voz del teléfono
   */
  constructor(
    private base: string,
    private token: () => string | null,
    private alFallar: (texto: string) => void,
  ) {}

  /**
   * ¿El servidor tiene voz? Si no (por ejemplo, todavía no se instalaron las
   * voces), por un rato se usa directo la del teléfono, sin intentar antes.
   */
  async comprobar(): Promise<boolean> {
    if (!this.token()) return false
    const ok = await fetch(`${this.base}/api/voz/estado`, { headers: { Authorization: `Bearer ${this.token()}` } })
      .then((r) => r.ok)
      .catch(() => false)
    this.fallandoHasta = ok ? 0 : Date.now() + 10 * 60_000
    return ok
  }

  /** Hay sesión y el servidor respondió bien la última vez (o hace rato que no se intenta). */
  get disponible(): boolean {
    return typeof Audio !== 'undefined' && !!this.token() && Date.now() > this.fallandoHasta
  }

  /** Android e iOS solo dejan sonar audio después de un toque. */
  desbloquear() {
    const a = new Audio(SILENCIO)
    void a.play().catch(() => {})
  }

  private obtener(texto: string, voz: VozCiempi): Promise<string> {
    const clave = `${voz}|${texto}`
    let audio = this.audios.get(clave)
    if (!audio) {
      const parametros = new URLSearchParams({ texto, voz, velocidad: '1' })
      audio = fetch(`${this.base}/api/voz?${parametros}`, { headers: { Authorization: `Bearer ${this.token()}` } })
        .then((r) => {
          if (!r.ok) throw new Error(`voz ${r.status}`)
          return r.blob()
        })
        .then((datos) => URL.createObjectURL(datos))
      // Si falla, se olvida para poder intentarlo otra vez más tarde.
      audio.catch(() => this.audios.delete(clave))
      this.audios.set(clave, audio)
      if (this.audios.size > MAXIMO_EN_MEMORIA) {
        const [primera, url] = this.audios.entries().next().value!
        this.audios.delete(primera)
        void url.then((u) => URL.revokeObjectURL(u)).catch(() => {})
      }
    }
    return audio
  }

  /**
   * Prueba la voz de punta a punta (para Ajustes): devuelve null si funciona,
   * o qué falla, para poder arreglarlo.
   */
  async diagnosticar(voz: VozCiempi): Promise<string | null> {
    if (typeof Audio === 'undefined') return 'este equipo no puede reproducir audio'
    if (!this.token()) return 'no hay sesión iniciada'
    const pedir = (ruta: string) => fetch(`${this.base}${ruta}`, { headers: { Authorization: `Bearer ${this.token()}` } })
    const problema = async (r: Response) => {
      const datos = (await r.json().catch(() => null)) as { error?: string } | null
      return `el servidor respondió ${r.status}${datos?.error ? `: ${datos.error}` : ''}`
    }
    let r: Response
    try {
      const estado = await pedir('/api/voz/estado')
      if (!estado.ok) return await problema(estado)
      r = await pedir(`/api/voz?${new URLSearchParams({ texto: 'hola', voz, velocidad: '1' })}`)
    } catch {
      return 'no hay conexión con el servidor'
    }
    if (!r.ok) return await problema(r)
    const url = URL.createObjectURL(await r.blob())
    const sePuedeOir = await new Promise<boolean>((resolver) => {
      const a = new Audio()
      a.onloadedmetadata = () => resolver(true)
      a.onerror = () => resolver(false)
      setTimeout(() => resolver(false), 5000)
      a.src = url
    })
    URL.revokeObjectURL(url)
    if (!sePuedeOir) return 'el audio llegó, pero este equipo no lo pudo leer'
    this.fallandoHasta = 0
    return null
  }

  /** Pide de antemano el audio de estos textos. */
  precargar(textos: string[], voz: VozCiempi) {
    if (!this.disponible) return
    for (const texto of textos) this.obtener(texto, voz).catch(() => {})
  }

  hablar(texto: string, voz: VozCiempi, velocidad: number, encolar: boolean, desde?: number) {
    if (!encolar) this.callar()
    this.cola.push({ texto, voz, velocidad, desde })
    if (!this.sonando && this.cola.length === 1) void this.siguiente()
  }

  private async siguiente() {
    const pedido = this.cola[0]
    if (!pedido) return
    const turno = this.turno
    let url: string
    try {
      url = await this.obtener(pedido.texto, pedido.voz)
    } catch {
      // Sin conexión o sin servicio de voz: por un minuto se usa la voz del teléfono.
      this.fallandoHasta = Date.now() + 60_000
      const pendientes = this.cola.splice(0)
      if (turno === this.turno) pendientes.forEach((p) => this.alFallar(p.texto))
      return
    }
    if (turno !== this.turno) return
    const audio = new Audio(url)
    audio.preservesPitch = true
    audio.playbackRate = pedido.velocidad
    const seguir = () => {
      if (this.sonando !== audio) return
      this.sonando = null
      this.cola.shift()
      void this.siguiente()
    }
    audio.onended = seguir
    audio.onerror = seguir
    if (pedido.desde) audio.addEventListener('loadedmetadata', () => (audio.currentTime = pedido.desde! * audio.duration), { once: true })
    this.sonando = audio
    if (!this.pausada) void audio.play().catch(seguir)
  }

  callar() {
    this.turno++
    this.cola = []
    this.pausada = false
    const audio = this.sonando
    this.sonando = null
    audio?.pause()
  }

  /** Detiene la voz donde va, sin perder lo que estaba diciendo (se sigue con `reanudar`). */
  pausar() {
    this.pausada = true
    this.sonando?.pause()
  }

  reanudar() {
    if (!this.pausada) return
    this.pausada = false
    void this.sonando?.play().catch(() => {})
  }

  /** Cambia la velocidad de lo que está sonando (sin cortarlo ni cambiar el tono). */
  ajustarVelocidad(velocidad: number) {
    if (this.sonando) this.sonando.playbackRate = velocidad
  }

  /** Qué parte de lo que suena ya se dijo (0..1), o null si no suena nada (o todavía no se sabe su largo). */
  progreso(): number | null {
    const a = this.sonando
    return a && Number.isFinite(a.duration) && a.duration > 0 ? a.currentTime / a.duration : null
  }

  /** Salta a esta parte de lo que suena (0..1). */
  buscar(fraccion: number) {
    const a = this.sonando
    if (a && Number.isFinite(a.duration)) a.currentTime = Math.max(0, Math.min(1, fraccion)) * a.duration
  }

  hablando(): boolean {
    return (this.sonando !== null && !this.pausada) || this.cola.length > 1 || (this.cola.length === 1 && !this.sonando)
  }

  /** Hay algo esperando detrás de lo que suena (cola[0] es lo que suena o se está cargando). */
  enCola(): boolean {
    return this.cola.length > 1
  }
}
