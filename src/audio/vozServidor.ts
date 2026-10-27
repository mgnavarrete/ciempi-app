/**
 * Voz de Ciempi generada en el servidor (GET /api/voz, Piper): suena igual en
 * todos los teléfonos y navegadores, sin depender de las voces instaladas.
 *
 * El audio se reproduce con Web Audio (más rápido que <audio>) y se guarda en
 * memoria: la pantalla de lectura precarga las palabras de la frase para que
 * suenen justo cuando el dedo llega.
 */

export type VozCiempi = 'nino' | 'nina'

interface Pedido {
  texto: string
  voz: VozCiempi
  velocidad: number
}

const MAXIMO_EN_MEMORIA = 400

export class VozServidor {
  private contexto: AudioContext | null = null
  private audios = new Map<string, Promise<AudioBuffer>>()
  private cola: Pedido[] = []
  private sonando: AudioBufferSourceNode | null = null
  /** Cambia cada vez que se corta lo que suena, para descartar lo que venía en camino. */
  private turno = 0
  private fallandoHasta = 0

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

  /** Hay sesión y el servidor respondió bien la última vez (o hace rato que no se intenta). */
  get disponible(): boolean {
    return typeof AudioContext !== 'undefined' && !!this.token() && Date.now() > this.fallandoHasta
  }

  private ctx(): AudioContext {
    this.contexto ??= new AudioContext()
    return this.contexto
  }

  /** Android e iOS solo dejan sonar audio después de un toque. */
  desbloquear() {
    void this.ctx().resume()
  }

  private obtener({ texto, voz, velocidad }: Pedido): Promise<AudioBuffer> {
    const clave = `${voz}|${velocidad}|${texto}`
    let audio = this.audios.get(clave)
    if (!audio) {
      const parametros = new URLSearchParams({ texto, voz, velocidad: String(velocidad) })
      audio = fetch(`${this.base}/api/voz?${parametros}`, { headers: { Authorization: `Bearer ${this.token()}` } })
        .then((r) => {
          if (!r.ok) throw new Error(`voz ${r.status}`)
          return r.arrayBuffer()
        })
        .then((datos) => this.ctx().decodeAudioData(datos))
      // Si falla, se olvida para poder intentarlo otra vez más tarde.
      audio.catch(() => this.audios.delete(clave))
      this.audios.set(clave, audio)
      if (this.audios.size > MAXIMO_EN_MEMORIA) this.audios.delete(this.audios.keys().next().value!)
    }
    return audio
  }

  /**
   * Prueba la voz de punta a punta (para Ajustes): devuelve null si funciona,
   * o qué falla, para poder arreglarlo.
   */
  async diagnosticar(voz: VozCiempi): Promise<string | null> {
    if (typeof AudioContext === 'undefined') return 'este equipo no puede reproducir audio'
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
    try {
      await this.ctx().decodeAudioData(await r.arrayBuffer())
    } catch {
      return 'el audio llegó, pero este equipo no lo pudo leer'
    }
    this.fallandoHasta = 0
    return null
  }

  /** Pide de antemano el audio de estas palabras. */
  precargar(textos: string[], voz: VozCiempi, velocidad: number) {
    if (!this.disponible) return
    for (const texto of textos) this.obtener({ texto, voz, velocidad }).catch(() => {})
  }

  hablar(texto: string, voz: VozCiempi, velocidad: number, encolar: boolean) {
    if (!encolar) this.callar()
    this.cola.push({ texto, voz, velocidad })
    if (!this.sonando && this.cola.length === 1) void this.siguiente()
  }

  private async siguiente() {
    const pedido = this.cola[0]
    if (!pedido) return
    const turno = this.turno
    let audio: AudioBuffer
    try {
      audio = await this.obtener(pedido)
    } catch {
      // Sin conexión o sin servicio de voz: por un minuto se usa la voz del teléfono.
      this.fallandoHasta = Date.now() + 60_000
      const pendientes = this.cola.splice(0)
      if (turno === this.turno) pendientes.forEach((p) => this.alFallar(p.texto))
      return
    }
    if (turno !== this.turno) return
    const fuente = this.ctx().createBufferSource()
    fuente.buffer = audio
    fuente.connect(this.ctx().destination)
    fuente.onended = () => {
      if (this.sonando !== fuente) return
      this.sonando = null
      this.cola.shift()
      void this.siguiente()
    }
    this.sonando = fuente
    fuente.start()
  }

  callar() {
    this.turno++
    this.cola = []
    const fuente = this.sonando
    this.sonando = null
    try {
      fuente?.stop()
    } catch {
      // Ya había terminado.
    }
  }

  hablando(): boolean {
    return this.sonando !== null || this.cola.length > 0
  }

  /** Hay algo esperando detrás de lo que suena (cola[0] es lo que suena o se está cargando). */
  enCola(): boolean {
    return this.cola.length > 1
  }
}
