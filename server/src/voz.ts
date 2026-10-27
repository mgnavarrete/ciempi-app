/**
 * Voz de Ciempi: genera el audio de una palabra o frase.
 *
 * - Con AZURE_SPEECH_KEY: voces neuronales de Microsoft (Lorenzo, de Chile,
 *   para Ciempi niño; Paloma para Ciempi niña).
 * - Con XAI_API_KEY: voces de xAI (Leo para niño, Ara para niña) en español de México.
 * - Si no hay ninguna, o si fallan: Piper en este mismo servidor (server/voz).
 *
 * El servidor guarda cada audio generado (tabla audios_voz), así que a los
 * servicios de pago se les pide cada palabra una sola vez.
 */

export type VozCiempi = 'nino' | 'nina'

export interface FuenteVoz {
  /** Identifica la voz exacta: es parte de la clave con que se guarda el audio. */
  id: string
  generar(texto: string, velocidad: number): Promise<Buffer>
}

const TIEMPO_MAXIMO = 10_000

const urlPiper = () => process.env.VOZ_URL ?? 'http://127.0.0.1:3201'
const xaiConfigurado = () => !!process.env.XAI_API_KEY
/** https://api.x.ai (XAI_URL solo para pruebas). */
const urlXai = () => process.env.XAI_URL ?? 'https://api.x.ai'
const azureConfigurado = () => !!process.env.AZURE_SPEECH_KEY
/** https://<región>.tts.speech.microsoft.com (AZURE_SPEECH_URL solo para pruebas). */
const urlAzure = () => process.env.AZURE_SPEECH_URL ?? `https://${process.env.AZURE_SPEECH_REGION ?? 'eastus'}.tts.speech.microsoft.com`

function vozAzure(voz: VozCiempi): string {
  return voz === 'nina' ? (process.env.AZURE_VOZ_NINA ?? 'es-US-PalomaNeural') : (process.env.AZURE_VOZ_NINO ?? 'es-CL-LorenzoNeural')
}

const escaparXml = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`)

function fuenteAzure(voz: VozCiempi): FuenteVoz {
  const nombre = vozAzure(voz)
  return {
    id: `azure:${nombre}`,
    async generar(texto, velocidad) {
      const rate = `${Math.round((velocidad - 1) * 100)}%`
      const ssml =
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-CL">` +
        `<voice name="${nombre}"><prosody rate="${rate}">${escaparXml(texto)}</prosody></voice></speak>`
      const r = await fetch(`${urlAzure()}/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY!,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
          'User-Agent': 'ciempi',
        },
        body: ssml,
        signal: AbortSignal.timeout(TIEMPO_MAXIMO),
      })
      if (!r.ok) throw new Error(`Azure respondió ${r.status}`)
      return recortarSilencio(Buffer.from(await r.arrayBuffer()))
    },
  }
}

function fuenteXai(voz: VozCiempi): FuenteVoz {
  const nombre = voz === 'nina' ? (process.env.XAI_VOZ_NINA ?? 'ara') : (process.env.XAI_VOZ_NINO ?? 'leo')
  const idioma = process.env.XAI_IDIOMA ?? 'es-MX'
  return {
    id: `xai:${nombre}:${idioma}`,
    async generar(texto, velocidad) {
      const r = await fetch(`${urlXai()}/v1/tts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: texto,
          voice_id: nombre,
          language: idioma,
          // xAI acepta velocidades entre 0,7 y 1,5.
          speed: Math.min(1.5, Math.max(0.7, velocidad)),
          output_format: { codec: 'wav', sample_rate: 24000 },
        }),
        signal: AbortSignal.timeout(TIEMPO_MAXIMO),
      })
      if (!r.ok) throw new Error(`xAI respondió ${r.status}`)
      return recortarSilencio(Buffer.from(await r.arrayBuffer()))
    },
  }
}

function fuentePiper(voz: VozCiempi): FuenteVoz {
  return {
    id: `piper:${voz}`,
    async generar(texto, velocidad) {
      const r = await fetch(`${urlPiper()}/voz?${new URLSearchParams({ texto, voz, velocidad: String(velocidad) })}`, {
        signal: AbortSignal.timeout(TIEMPO_MAXIMO),
      })
      if (!r.ok) throw new Error(`Piper respondió ${r.status}`)
      return Buffer.from(await r.arrayBuffer())
    },
  }
}

/** En orden de preferencia: Azure y xAI (las que tengan clave) y después Piper. */
export function fuentesDeVoz(voz: VozCiempi): FuenteVoz[] {
  return [...(azureConfigurado() ? [fuenteAzure(voz)] : []), ...(xaiConfigurado() ? [fuenteXai(voz)] : []), fuentePiper(voz)]
}

/** ¿Hay alguna voz funcionando? Devuelve cuál, o null. */
export async function vozDisponible(): Promise<string | null> {
  const responde = (url: string, init?: RequestInit) =>
    fetch(url, { ...init, signal: AbortSignal.timeout(5_000) })
      .then((r) => r.ok)
      .catch(() => false)
  if (azureConfigurado() && (await responde(`${urlAzure()}/cognitiveservices/voices/list`, { headers: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY! } }))) {
    return 'azure'
  }
  if (xaiConfigurado() && (await responde(`${urlXai()}/v1/tts/voices`, { headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}` } }))) {
    return 'xai'
  }
  return (await responde(`${urlPiper()}/salud`)) ? 'piper' : null
}

/**
 * Las voces traen silencio al inicio y al final: quitarlo hace que la palabra
 * suene justo cuando el dedo llega. Espera un WAV PCM de 16 bits.
 */
export function recortarSilencio(wav: Buffer, umbral = 300, margenMs = 15): Buffer {
  if (wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') return wav
  let pos = 12
  let fmt: Buffer | null = null
  while (pos + 8 <= wav.length) {
    const id = wav.toString('ascii', pos, pos + 4)
    const largo = wav.readUInt32LE(pos + 4)
    if (id === 'fmt ') fmt = wav.subarray(pos + 8, pos + 8 + largo)
    if (id === 'data' && fmt) {
      const canales = fmt.readUInt16LE(2)
      const frecuencia = fmt.readUInt32LE(4)
      const bits = fmt.readUInt16LE(14)
      if (bits !== 16 || canales !== 1) return wav
      const datos = wav.subarray(pos + 8, Math.min(wav.length, pos + 8 + largo))
      const muestras = datos.length >> 1
      let inicio = 0
      while (inicio < muestras && Math.abs(datos.readInt16LE(inicio * 2)) <= umbral) inicio++
      let fin = muestras - 1
      while (fin > inicio && Math.abs(datos.readInt16LE(fin * 2)) <= umbral) fin--
      if (inicio >= muestras) return wav
      const margen = Math.round((frecuencia * margenMs) / 1000)
      const recorte = datos.subarray(Math.max(0, inicio - margen) * 2, Math.min(muestras, fin + margen + 1) * 2)
      return armarWav(fmt, recorte)
    }
    pos += 8 + largo + (largo % 2)
  }
  return wav
}

function armarWav(fmt: Buffer, datos: Buffer): Buffer {
  const cabeza = Buffer.alloc(12 + 8 + fmt.length + 8)
  cabeza.write('RIFF', 0, 'ascii')
  cabeza.writeUInt32LE(cabeza.length - 8 + datos.length, 4)
  cabeza.write('WAVE', 8, 'ascii')
  cabeza.write('fmt ', 12, 'ascii')
  cabeza.writeUInt32LE(fmt.length, 16)
  fmt.copy(cabeza, 20)
  cabeza.write('data', 20 + fmt.length, 'ascii')
  cabeza.writeUInt32LE(datos.length, 24 + fmt.length)
  return Buffer.concat([cabeza, datos])
}
