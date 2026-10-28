import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { pool } from './db.ts'

/**
 * Voz de Ciempi: genera el audio de una palabra o frase.
 *
 * - Voces neuronales de Microsoft, gratis y sin cuenta (edge-tts, en
 *   server/voz-microsoft): Lorenzo y Catalina (Chile), Paloma y Alonso
 *   (EE. UU.). Se usan si están instaladas (deploy/instalar-voz-microsoft.sh).
 * - Con AZURE_SPEECH_KEY: voces neuronales de Microsoft (Lorenzo, de Chile,
 *   para Ciempi niño; Paloma para Ciempi niña).
 * - Con XAI_API_KEY: voces de xAI (Leo para niño, Ara para niña) en español de México.
 * - Si no hay ninguna, o si fallan: Kokoro en este mismo servidor (server/voz),
 *   gratis y sin internet: Alex para niño y Dora para niña.
 *
 * El servidor guarda cada audio generado (tabla audios_voz), así que a los
 * servicios de pago se les pide cada palabra una sola vez.
 */

export type VozCiempi = 'nino' | 'nina'

/** Las voces de Microsoft que se pueden elegir en la app. */
export const VOCES_MICROSOFT = {
  lorenzo: 'es-CL-LorenzoNeural',
  catalina: 'es-CL-CatalinaNeural',
  paloma: 'es-US-PalomaNeural',
  alonso: 'es-US-AlonsoNeural',
} as const
export type VozMicrosoft = keyof typeof VOCES_MICROSOFT
/** Lo que pide la app: la voz de Ciempi niño o niña, o una voz con nombre. */
export type VozPedida = VozCiempi | VozMicrosoft

export function leerVozPedida(v: unknown): VozPedida {
  return v === 'nina' || (typeof v === 'string' && v in VOCES_MICROSOFT) ? (v as VozPedida) : 'nino'
}
/** Ciempi niño habla con Lorenzo y Ciempi niña con Catalina. */
const vozMicrosoftDe = (voz: VozPedida): VozMicrosoft => (voz === 'nino' ? 'lorenzo' : voz === 'nina' ? 'catalina' : voz)
/** Para las otras voces (Azure, xAI, Kokoro): de niño o de niña. */
const generoDe = (voz: VozPedida): VozCiempi => (voz === 'nina' || voz === 'catalina' || voz === 'paloma' ? 'nina' : 'nino')

export interface FuenteVoz {
  /** Identifica la voz exacta: es parte de la clave con que se guarda el audio. */
  id: string
  generar(texto: string, velocidad: number): Promise<Buffer>
}

const TIEMPO_MAXIMO = 10_000

const urlLocal = () => process.env.VOZ_URL ?? 'http://127.0.0.1:3201'
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

function fuenteLocal(voz: VozCiempi): FuenteVoz {
  return {
    id: `kokoro:${voz}`,
    async generar(texto, velocidad) {
      const r = await fetch(`${urlLocal()}/voz?${new URLSearchParams({ texto, voz, velocidad: String(velocidad) })}`, {
        signal: AbortSignal.timeout(TIEMPO_MAXIMO),
      })
      if (!r.ok) throw new Error(`La voz local respondió ${r.status}`)
      return Buffer.from(await r.arrayBuffer())
    },
  }
}

// ── Microsoft (edge-tts) ────────────────────────────────────────────────────

const SCRIPT_MICROSOFT = fileURLToPath(new URL('../voz-microsoft/decir.py', import.meta.url))
const pythonMicrosoft = () => process.env.VOZ_MICROSOFT_PYTHON ?? fileURLToPath(new URL('../voz-microsoft/.venv/bin/python', import.meta.url))
export const microsoftInstalado = () => process.env.VOZ_MICROSOFT !== 'no' && existsSync(pythonMicrosoft())

/** Cuántos audios se piden a la vez (cada uno es un proceso corto y una consulta por internet). */
const maximoALaVez = () => Number(process.env.VOZ_MICROSOFT_A_LA_VEZ) || 4
let ocupados = 0
const esperando: (() => void)[] = []
async function turno<T>(fn: () => Promise<T>): Promise<T> {
  if (ocupados >= maximoALaVez()) await new Promise<void>((r) => esperando.push(r))
  ocupados++
  try {
    return await fn()
  } finally {
    ocupados--
    esperando.shift()?.()
  }
}

export function fuenteMicrosoft(voz: VozPedida): FuenteVoz {
  const nombre = VOCES_MICROSOFT[vozMicrosoftDe(voz)]
  return {
    id: `microsoft:${nombre}`,
    generar: (texto, velocidad) =>
      turno(
        () =>
          new Promise<Buffer>((resolver, rechazar) => {
            const rate = `${velocidad >= 1 ? '+' : ''}${Math.round((velocidad - 1) * 100)}%`
            const proceso = spawn(pythonMicrosoft(), [SCRIPT_MICROSOFT, nombre, rate], { timeout: 20_000 })
            const partes: Buffer[] = []
            let error = ''
            proceso.stdout.on('data', (d: Buffer) => partes.push(d))
            proceso.stderr.on('data', (d: Buffer) => (error += d))
            proceso.on('error', rechazar)
            proceso.on('close', (codigo) => {
              const audio = Buffer.concat(partes)
              if (codigo === 0 && audio.length > 0) resolver(audio)
              else rechazar(new Error(`edge-tts terminó con ${codigo}: ${error.trim().split('\n').at(-1) ?? ''}`))
            })
            proceso.stdin.end(texto)
          }),
      ),
  }
}

/** En orden de preferencia: Microsoft (si está instalada), Azure y xAI (las que tengan clave) y después Kokoro en este servidor. */
export function fuentesDeVoz(voz: VozPedida): FuenteVoz[] {
  const g = generoDe(voz)
  return [
    ...(microsoftInstalado() ? [fuenteMicrosoft(voz)] : []),
    ...(azureConfigurado() ? [fuenteAzure(g)] : []),
    ...(xaiConfigurado() ? [fuenteXai(g)] : []),
    fuenteLocal(g),
  ]
}

/** Solo se guardan las palabras, salvo con Microsoft: ahí también las frases (son gratis, pero lentas de generar). */
const LARGO_GUARDADO = 40

/**
 * El audio de un texto con la primera voz que lo tenga guardado o lo pueda
 * generar (y queda guardado). null si ninguna funciona.
 */
export async function audioDe(texto: string, voz: VozPedida, velocidad: number, alFallar?: (fuente: string, error: Error) => void): Promise<Buffer | null> {
  for (const fuente of fuentesDeVoz(voz)) {
    const clave = `${fuente.id}|${velocidad}|${texto}`
    const guardar = texto.length <= LARGO_GUARDADO || fuente.id.startsWith('microsoft:')
    if (guardar) {
      const { rows } = await pool.query<{ audio: Buffer }>('select audio from audios_voz where clave = $1', [clave])
      if (rows[0]) return rows[0].audio
    }
    try {
      const audio = await fuente.generar(texto, velocidad)
      if (guardar) await pool.query('insert into audios_voz (clave, audio) values ($1, $2) on conflict do nothing', [clave, audio])
      return audio
    } catch (e) {
      alFallar?.(fuente.id, e as Error)
    }
  }
  return null
}

/** ¿Hay alguna voz funcionando? Devuelve cuál, o null. */
export async function vozDisponible(): Promise<string | null> {
  if (microsoftInstalado()) return 'microsoft'
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
  return (await responde(`${urlLocal()}/salud`)) ? 'kokoro' : null
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
