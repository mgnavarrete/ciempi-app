/**
 * Efectos de sonido sintetizados con Web Audio: no requieren archivos,
 * pesan cero y funcionan offline. Volumen bajo y tonos suaves.
 */

let contexto: AudioContext | null = null

/** El contexto de audio compartido por efectos y música (null si el equipo no tiene Web Audio). */
export function obtenerContexto(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  contexto ??= new AudioContext()
  return contexto
}

/** Llamar en el primer toque: los navegadores bloquean el audio sin gesto. */
export function desbloquearSonidos() {
  const ctx = obtenerContexto()
  if (ctx?.state === 'suspended') void ctx.resume()
}

function nota(ctx: AudioContext, frecuencia: number, inicio: number, duracion: number, volumen = 0.12, tipo: OscillatorType = 'triangle') {
  const osc = ctx.createOscillator()
  const gan = ctx.createGain()
  osc.type = tipo
  osc.frequency.setValueAtTime(frecuencia, inicio)
  gan.gain.setValueAtTime(0, inicio)
  gan.gain.linearRampToValueAtTime(volumen, inicio + 0.02)
  gan.gain.exponentialRampToValueAtTime(0.001, inicio + duracion)
  osc.connect(gan).connect(ctx.destination)
  osc.start(inicio)
  osc.stop(inicio + duracion + 0.05)
  return osc
}

/** Arpegio alegre: do-mi-sol-do. */
export function sonarCelebracion() {
  const ctx = obtenerContexto()
  if (!ctx) return
  const t = ctx.currentTime + 0.02
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => nota(ctx, f, t + i * 0.11, 0.35))
}

/** "Boing" descendente y suave para el tropiezo. */
export function sonarTropiezo() {
  const ctx = obtenerContexto()
  if (!ctx) return
  const t = ctx.currentTime + 0.02
  const osc = nota(ctx, 330, t, 0.45, 0.1, 'sine')
  osc.frequency.exponentialRampToValueAtTime(140, t + 0.4)
}

/** "Clin" de moneda. */
export function sonarMoneda() {
  const ctx = obtenerContexto()
  if (!ctx) return
  const t = ctx.currentTime + 0.02
  nota(ctx, 1318.5, t, 0.12, 0.08, 'square')
  nota(ctx, 1760, t + 0.08, 0.3, 0.08, 'square')
}
