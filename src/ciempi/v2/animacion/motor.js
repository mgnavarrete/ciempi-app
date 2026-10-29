// Reproductor de las animaciones: tiempo, velocidad, bucle, inercia secundaria
// (antenas y capas que siguen el movimiento con retraso) y movimiento reducido.

const RETRASO = 0.09
const limitar = (v, m) => Math.max(-m, Math.min(m, v))

/** Pose con inercia: las antenas y la espalda reaccionan a cómo se movió la cabeza hace un instante. */
export function poseConInercia(anim, t, n = 5) {
  const p = anim.pose(t, n)
  const dur = anim.duracion
  const antes = anim.pose(anim.bucle ? (((t - RETRASO) % dur) + dur) % dur : Math.max(0, t - RETRASO), n)
  const giro = (q) => q.cabeza.rot + q.raiz.rot + q.raiz.giroCentro * 0.15
  const dGiro = giro(p) - giro(antes)
  // Negativo al subir: al despegar las antenas se doblan hacia abajo, al caer se levantan.
  const vy = p.raiz.y + p.cabeza.y - (antes.raiz.y + antes.cabeza.y)
  const vx = p.raiz.x + p.cabeza.x - (antes.raiz.x + antes.cabeza.x)
  p.antenas[0] += limitar(-dGiro * 0.9 + vy * 0.35, 24)
  p.antenas[1] += limitar(-dGiro * 0.9 - vy * 0.35, 24)
  p.espalda.rot += limitar(-vx * 0.5 + vy * 0.1 - dGiro * 0.3, 7)
  return p
}

/** Movimiento reducido: la misma animación con amplitudes menores y sin efectos. */
export function reducir(p, m) {
  if (m >= 1) return p
  const k = (v) => v * m
  const u = (v) => 1 + (v - 1) * m
  const r = p.raiz
  Object.assign(r, { x: k(r.x), y: k(r.y), rot: k(r.rot), giroCentro: k(r.giroCentro), sx: u(r.sx), sy: u(r.sy) })
  for (const s of p.segmentos) Object.assign(s, { x: k(s.x), y: k(s.y), rot: k(s.rot), sx: u(s.sx), sy: u(s.sy) })
  for (const q of p.patas) Object.assign(q, { x: k(q.x), y: k(q.y), rot: k(q.rot), pie: k(q.pie) })
  Object.assign(p.cabeza, { x: k(p.cabeza.x), y: k(p.cabeza.y), rot: k(p.cabeza.rot), s: u(p.cabeza.s) })
  p.antenas = p.antenas.map(k)
  p.espalda.rot = k(p.espalda.rot)
  p.ojos.escala = u(p.ojos.escala)
  p.cejas = k(p.cejas)
  p.rubor = u(p.rubor)
  p.efectos = []
  if (p.suelo) p.suelo = { velocidad: k(p.suelo.velocidad) }
  return p
}

/** Marcas del suelo que avanzan al ritmo de los pies al caminar (sin patinar). */
function marcasDeSuelo(p, t) {
  if (!p.suelo) return []
  const paso = 130
  const d = (p.suelo.velocidad * t) % paso
  return Array.from({ length: 9 }, (_, i) => ({ tipo: 'suelo', x: 40 + i * paso - d, y: 596, s: 1.4, opacidad: 1 }))
}

export class Reproductor {
  constructor(alCuadro) {
    this.alCuadro = alCuadro
    this.anim = null
    this.t = 0
    this.velocidad = 1
    this.bucle = true
    this.reproduciendo = false
    this.movimiento = 1
    /** Segmentos del cuerpo (en lectura crece con cada palabra). */
    this.segmentos = 5
    /** Marcas del suelo al caminar (en el juego el suelo es la pista de lectura). */
    this.suelo = true
    /** Al terminar una animación que no se repite (si no, se queda en su último cuadro). */
    this.alTerminar = null
    this.ultimo = 0
    this.medidas = []
    this.cuadro = this.cuadro.bind(this)
  }
  cargar(anim) {
    this.anim = anim
    this.t = 0
    this.bucle = anim.bucle
    this.dibujar()
  }
  pose(t = this.t) {
    const p = reducir(poseConInercia(this.anim, t, this.segmentos), this.movimiento)
    if (this.suelo) p.efectos = [...marcasDeSuelo(p, t), ...p.efectos]
    return p
  }
  reproducir() {
    if (this.reproduciendo) return
    if (!this.bucle && this.t >= this.anim.duracion) this.t = 0
    this.reproduciendo = true
    this.ultimo = performance.now()
    requestAnimationFrame(this.cuadro)
  }
  pausar() {
    this.reproduciendo = false
    this.dibujar()
  }
  reiniciar() {
    this.t = 0
    this.dibujar()
  }
  irA(t) {
    this.t = Math.max(0, Math.min(this.anim.duracion, t))
    this.dibujar()
  }
  cuadro(ahora) {
    if (!this.reproduciendo) return
    const dt = Math.min(0.1, (ahora - this.ultimo) / 1000)
    this.ultimo = ahora
    this.t += dt * this.velocidad
    if (this.t >= this.anim.duracion) {
      if (this.bucle) this.t %= this.anim.duracion
      else {
        this.t = this.anim.duracion
        this.reproduciendo = false
        if (this.alTerminar) {
          this.alTerminar()
          if (this.reproduciendo) return
        }
      }
    }
    const inicio = performance.now()
    this.dibujar()
    this.medidas.push(performance.now() - inicio)
    if (this.medidas.length > 120) this.medidas.shift()
    if (this.reproduciendo) requestAnimationFrame(this.cuadro)
  }
  dibujar() {
    if (this.anim) this.alCuadro(this.pose(), this.t)
  }
  /** Milisegundos promedio que toma calcular y aplicar un cuadro. */
  costo() {
    return this.medidas.length ? this.medidas.reduce((a, b) => a + b, 0) / this.medidas.length : 0
  }
}
