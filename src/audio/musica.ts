/**
 * Música de fondo y sonido de los botones, sintetizados con Web Audio (sin
 * archivos ni derechos de autor). La música es una melodía alegre y suave en
 * escala pentatónica; suena en las pantallas del niño, nunca mientras lee
 * (taparía la voz). Las preferencias son de este dispositivo.
 */
import { obtenerContexto } from './sonidos'

const CLAVE = 'ciempi:sonido'
export interface PreferenciasSonido {
  musica: boolean
  botones: boolean
}
const POR_DEFECTO: PreferenciasSonido = { musica: true, botones: true }

export function leerPreferencias(): PreferenciasSonido {
  try {
    return { ...POR_DEFECTO, ...JSON.parse(localStorage.getItem(CLAVE) ?? '{}') }
  } catch {
    return POR_DEFECTO
  }
}

export function guardarPreferencias(p: PreferenciasSonido) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(p))
  } catch {
    // Sin almacenamiento: vale para esta sesión.
  }
  window.dispatchEvent(new CustomEvent(CLAVE))
}

/** Avisa cuando cambian las preferencias (para encender o apagar la música). */
export function alCambiarPreferencias(fn: () => void) {
  window.addEventListener(CLAVE, fn)
  return () => window.removeEventListener(CLAVE, fn)
}

/** «Pop» suave al tocar un botón. */
export function sonarToque() {
  const ctx = obtenerContexto()
  if (!ctx || ctx.state !== 'running') return
  const t = ctx.currentTime + 0.005
  const osc = ctx.createOscillator()
  const gan = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(720, t)
  osc.frequency.exponentialRampToValueAtTime(420, t + 0.07)
  gan.gain.setValueAtTime(0, t)
  gan.gain.linearRampToValueAtTime(0.07, t + 0.008)
  gan.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
  osc.connect(gan).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.12)
}

// ── Música ──────────────────────────────────────────────────────────────
// Cuatro compases en corcheas (100 pulsos por minuto): do – la menor – fa – sol.
const DO = 261.63, RE = 293.66, MI = 329.63, SOL = 392, LA = 440, DO2 = 523.25, RE2 = 587.33, MI2 = 659.25
const MELODIA = [
  MI, 0, SOL, 0, LA, SOL, MI, 0, //
  DO2, 0, LA, 0, SOL, 0, MI, RE,
  DO, 0, MI, 0, SOL, LA, SOL, 0,
  RE2, 0, DO2, LA, SOL, 0, RE, 0,
  MI, 0, SOL, 0, LA, SOL, MI, 0,
  DO2, 0, RE2, 0, MI2, 0, DO2, 0,
  LA, 0, SOL, 0, MI, SOL, LA, 0,
  SOL, 0, MI, 0, DO, 0, 0, 0,
]
const BAJOS = [DO / 2, LA / 4, 349.23 / 4, SOL / 4, DO / 2, LA / 4, 349.23 / 4, SOL / 4]
const CORCHEA = 0.3
const VOLUMEN = 0.05

let maestro: GainNode | null = null
let reloj: number | undefined
let paso = 0
let proximo = 0

function tono(ctx: AudioContext, destino: AudioNode, f: number, t: number, dur: number, vol: number, tipo: OscillatorType) {
  const osc = ctx.createOscillator()
  const gan = ctx.createGain()
  osc.type = tipo
  osc.frequency.setValueAtTime(f, t)
  gan.gain.setValueAtTime(0, t)
  gan.gain.linearRampToValueAtTime(vol, t + 0.015)
  gan.gain.exponentialRampToValueAtTime(0.001, t + dur)
  osc.connect(gan).connect(destino)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

function programar() {
  const ctx = obtenerContexto()
  if (!ctx || !maestro) return
  while (proximo < ctx.currentTime + 0.25) {
    const nota = MELODIA[paso % MELODIA.length]
    // Melodía como de marimba: ataque rápido y se apaga sola.
    if (nota) {
      tono(ctx, maestro, nota, proximo, 0.5, 0.5, 'sine')
      tono(ctx, maestro, nota * 2, proximo, 0.18, 0.08, 'triangle')
    }
    // Un bajo suave en el primer y el quinto tiempo de cada compás.
    if (paso % 4 === 0) tono(ctx, maestro, BAJOS[Math.floor(paso / 8) % BAJOS.length], proximo, 0.9, 0.35, 'triangle')
    proximo += CORCHEA
    paso = (paso + 1) % MELODIA.length
  }
}

/** Enciende (con un fundido) o apaga la música. Si el audio todavía está bloqueado, empieza con el próximo toque. */
export function ponerMusica(encendida: boolean) {
  const ctx = obtenerContexto()
  if (!ctx) return
  if (encendida) {
    if (maestro || ctx.state !== 'running') return
    maestro = ctx.createGain()
    maestro.gain.setValueAtTime(0, ctx.currentTime)
    maestro.gain.linearRampToValueAtTime(VOLUMEN, ctx.currentTime + 1.5)
    maestro.connect(ctx.destination)
    proximo = ctx.currentTime + 0.1
    reloj = window.setInterval(programar, 100)
    programar()
  } else if (maestro) {
    const m = maestro
    maestro = null
    window.clearInterval(reloj)
    m.gain.cancelScheduledValues(ctx.currentTime)
    m.gain.setValueAtTime(m.gain.value, ctx.currentTime)
    m.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6)
    window.setTimeout(() => m.disconnect(), 800)
  }
}

export const musicaSonando = () => maestro !== null
