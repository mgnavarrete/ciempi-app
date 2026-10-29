// Animaciones de Ciempi: cada una es una función del tiempo (y del largo del
// cuerpo) que devuelve una pose (desplazamientos y giros sobre la base aprobada). Son deterministas:
// el mismo instante da siempre la misma pose, así se pueden pausar, adelantar
// y revisar cuadro a cuadro. Las expresiones son las B03 aprobadas.

// ── Pose ────────────────────────────────────────────────────────────────
/**
 * Pose sin desplazamientos para un Ciempi de `n` segmentos (el maestro tiene 5)
 * y n + 1 patas: una por segmento y la de la cabeza. Índice 0 = cola.
 */
export function poseNeutra(n = 5) {
  return {
    raiz: { x: 0, y: 0, rot: 0, giroCentro: 0, sx: 1, sy: 1 },
    segmentos: Array.from({ length: n }, () => ({ x: 0, y: 0, rot: 0, sx: 1, sy: 1 })),
    patas: Array.from({ length: n + 1 }, () => ({ x: 0, y: 0, rot: 0, pie: 0 })),
    cabeza: { x: 0, y: 0, rot: 0, s: 1 },
    antenas: [0, 0],
    espalda: { rot: 0 },
    ojos: { parpadeo: [0, 0], mirarX: 0, mirarY: 0, escala: 1 },
    cejas: 0,
    rubor: 1,
    expresion: null,
    efectos: [],
    suelo: null,
  }
}

// ── Curvas ──────────────────────────────────────────────────────────────
const PI2 = Math.PI * 2
export const curvas = {
  lineal: (u) => u,
  suave: (u) => 0.5 - Math.cos(Math.PI * u) / 2,
  entra: (u) => u * u,
  sale: (u) => 1 - (1 - u) * (1 - u),
  rebote: (u) => { const c = 1.7; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2 },
  elastico: (u) => (u === 0 || u === 1 ? u : 2 ** (-9 * u) * Math.sin((u * 10 - 0.75) * (PI2 / 3)) + 1),
}
/** Valor en `t` de una pista de claves [[tiempo, valor, curva del tramo que llega a esa clave]]. */
export function kf(t, claves) {
  if (t <= claves[0][0]) return claves[0][1]
  for (let i = 1; i < claves.length; i++) {
    const [t1, v1, curva = 'suave'] = claves[i]
    if (t <= t1) {
      const [t0, v0] = claves[i - 1]
      const u = t1 === t0 ? 1 : (t - t0) / (t1 - t0)
      return v0 + (v1 - v0) * curvas[curva](u)
    }
  }
  return claves[claves.length - 1][1]
}
const onda = (t, periodo, fase = 0) => Math.sin(PI2 * (t / periodo + fase))
const frac = (x) => x - Math.floor(x)
const entre = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)))
/** Cierre del párpado (0..1) para parpadeos que empiezan en estos instantes. */
function parpadeo(t, momentos, largo = 1) {
  let v = 0
  for (const m of momentos) {
    const u = (t - m) / largo
    if (u >= 0 && u < 0.07) v = Math.max(v, u / 0.07)
    else if (u >= 0.07 && u < 0.11) v = 1
    else if (u >= 0.11 && u < 0.22) v = Math.max(v, 1 - (u - 0.11) / 0.11)
  }
  return v
}
/** Expresión vigente en `t`: [[desde, id]]. */
function expresionEn(t, tramos) {
  let id = null
  for (const [desde, e] of tramos) if (t >= desde) id = e
  return id
}
function azar(semilla) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const COLORES_CONFETI = ['#ff9e32', '#83cda4', '#ffd137', '#4fbab8', '#f58b78', '#fffbe3']
/** Ráfaga de partículas que sale de (x, y) en t0. */
function rafaga(t, t0, { x, y, n = 12, tipo = 'confeti', semilla = 1, fuerza = 260, gravedad = 520, vida = 1.6, escala = 1 }) {
  const dt = t - t0
  if (dt < 0 || dt > vida) return []
  const r = azar(semilla)
  return Array.from({ length: n }, () => {
    const ang = -Math.PI / 2 + (r() - 0.5) * Math.PI * 1.25
    const v = fuerza * (0.55 + r() * 0.6)
    const giro = (r() - 0.5) * 900
    const color = COLORES_CONFETI[Math.floor(r() * COLORES_CONFETI.length)]
    const s = escala * (0.75 + r() * 0.5)
    return {
      tipo, color,
      x: x + Math.cos(ang) * v * dt,
      y: y + Math.sin(ang) * v * dt + 0.5 * gravedad * dt * dt,
      rot: giro * dt,
      s: s * Math.min(1, dt / 0.12),
      opacidad: 1 - entre(dt, vida * 0.65, vida),
    }
  })
}
/** Un efecto que aparece con rebote, se queda y se desvanece. */
function aparece(t, t0, t1, e) {
  if (t < t0 || t > t1) return []
  const s = kf(t, [[t0, 0], [t0 + 0.22, 1.15, 'sale'], [t0 + 0.36, 1, 'suave']])
  return [{ ...e, s: (e.s ?? 1) * s, opacidad: 1 - entre(t, t1 - 0.3, t1) }]
}
/** Respiración: los segmentos se inflan uno tras otro, de la cola a la cabeza. */
function respirar(p, t, periodo, amp = 1) {
  p.segmentos.forEach((s, i) => {
    const b = onda(t, periodo, -i * 0.04)
    s.sy *= 1 + 0.014 * amp * b
    s.sx *= 1 + 0.008 * amp * b
    s.y += -1.6 * amp * b
  })
  p.cabeza.y += -2.4 * amp * onda(t, periodo, -0.25)
}
/** El k-ésimo contando desde la cabeza (0 = el más cercano); si el cuerpo es más corto, uno sin efecto. */
const desdeCabeza = (lista, k = 0) => lista[lista.length - 1 - k] ?? { x: 0, y: 0, rot: 0, sx: 1, sy: 1, pie: 0 }
/** Posición a lo largo del cuerpo: 0 en la cola, 1 junto a la cabeza. */
const aLoLargo = (i, total) => (total > 1 ? i / (total - 1) : 1)
/** Arco del cuerpo en el aire: alto al centro, bajo en los extremos (0,2 → 1 → 0,2 con cinco segmentos). */
const arcoCuerpo = (f) => 0.2 + 0.8 * Math.sin(Math.PI * f)

// ── Animaciones ─────────────────────────────────────────────────────────
// duracion en segundos; bucle: si por defecto se repite; expresiones: las B03 que usa.
export const ANIMACIONES = [
  {
    id: 'A01', nombre: 'Reposo', duracion: 4, bucle: true,
    nota: 'Respira, parpadea y mueve un poquito las antenas.',
    expresiones: [],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      respirar(p, t, 2)
      p.cabeza.rot = 1.2 * onda(t, 4)
      p.antenas = [3 * onda(t, 4, 0.1), -3.5 * onda(t, 4, 0.35)]
      p.ojos.parpadeo = Array(2).fill(parpadeo(t, [1.3, 3.15, 3.42]))
      p.ojos.mirarX = kf(t, [[1.8, 0], [2.05, 5], [2.85, 5], [3.1, 0]])
      p.ojos.mirarY = kf(t, [[1.8, 0], [2.05, -2], [2.85, -2], [3.1, 0]])
      return p
    },
  },
  {
    id: 'A02', nombre: 'Caminar', duracion: 2.2, bucle: true,
    nota: 'Tres pies apoyados siempre; el cuerpo ondula y el suelo avanza al ritmo del paso (sin patinar).',
    expresiones: [],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      const T = 1.1, apoyo = 0.56, A = 16, L = 86
      p.patas.forEach((q, i) => {
        const u = frac(t / T + (i % 2) * 0.5 + i * 0.045)
        let x
        if (u < apoyo) x = A - (2 * A * u) / apoyo
        else {
          const s = (u - apoyo) / (1 - apoyo)
          x = -A + 2 * A * curvas.suave(s)
          q.y = -19 * Math.sin(Math.PI * s)
          q.pie = -12 * Math.sin(Math.PI * Math.min(1, s * 1.3))
        }
        q.rot = (-Math.asin(x / L) * 180) / Math.PI
      })
      p.segmentos.forEach((s, i) => {
        s.y = -3 * onda(t, T / 2, -i * 0.13)
        s.rot = 1.6 * onda(t, T, -i * 0.12)
      })
      p.cabeza.y = -3.5 * onda(t, T / 2, -0.7)
      p.cabeza.rot = 1.8 * onda(t, T, -0.6)
      p.raiz.y = -1.5 * onda(t, T / 2, -0.4)
      p.ojos.parpadeo = Array(2).fill(parpadeo(t, [1.5]))
      p.suelo = { velocidad: (2 * A) / (apoyo * T) }
      return p
    },
  },
  {
    id: 'A03', nombre: 'Celebración', duracion: 2.3, bucle: false,
    nota: 'Se agacha, salta con las patas abiertas, cae con rebote y se mueve de alegría.',
    expresiones: ['b03-carcajada'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      p.raiz.y = kf(t, [[0.28, 0], [0.52, -118, 'sale'], [0.76, 0, 'entra'], [0.9, 3], [1.02, 0]])
      p.raiz.sy = kf(t, [[0, 1], [0.26, 0.88], [0.36, 1.08, 'sale'], [0.6, 1], [0.76, 1.02], [0.84, 0.86, 'sale'], [1.0, 1.03], [1.14, 1]])
      p.raiz.sx = 2 - p.raiz.sy
      p.cabeza.y = kf(t, [[0, 0], [0.26, 10], [0.4, -6, 'sale'], [0.76, 0], [0.86, 9], [1.05, 0]])
      p.cabeza.rot = kf(t, [[0, 0], [0.26, 5], [0.45, -7, 'sale'], [0.8, -3], [1.0, 0]]) + (t > 1 ? 5 * Math.sin(PI2 * 3.2 * (t - 1)) * (1 - entre(t, 1, 1.9)) : 0)
      const abre = kf(t, [[0.3, 0], [0.45, 1, 'sale'], [0.7, 1], [0.8, 0, 'suave']])
      p.patas.forEach((q, i) => {
        const f = aLoLargo(i, p.patas.length)
        q.rot = abre * (f < 0.5 ? 16 : -16) * (0.6 + 0.4 * Math.abs(2 * f - 1))
        q.pie = abre * (f < 0.5 ? 10 : -14)
      })
      p.segmentos.forEach((s, i) => {
        s.rot = t > 1 ? 4 * Math.sin(PI2 * 3.2 * (t - 1) - i * 0.6) * (1 - entre(t, 1, 1.9)) : 0
        s.y = kf(t, [[0, 0], [0.26, 4], [0.4, -3], [0.76, 0], [0.86, 4 - 4 * aLoLargo(i, p.segmentos.length)], [1.05, 0]])
      })
      p.expresion = expresionEn(t, [[0, null], [0.3, 'b03-carcajada'], [2.0, null]])
      p.ojos.parpadeo = Array(2).fill(t < 0.3 ? parpadeo(t, [0.12]) : 0)
      p.efectos = [
        ...rafaga(t, 0.5, { x: 560, y: 40, n: 14, semilla: 3, fuerza: 320 }),
        ...rafaga(t, 0.54, { x: 420, y: 90, n: 4, tipo: 'estrella', semilla: 8, fuerza: 260, escala: 0.9 }),
      ]
      return p
    },
  },
  {
    id: 'A04', nombre: 'Saludar', duracion: 2.6, bucle: false,
    nota: 'Levanta la pata delantera y la mueve como una mano; guiña un ojo.',
    expresiones: ['b03-guino'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      respirar(p, t, 2.6, 0.6)
      const sube = kf(t, [[0.15, 0], [0.5, 1, 'sale'], [1.85, 1], [2.3, 0, 'suave']])
      const ola = t > 0.5 && t < 1.95 ? Math.sin(PI2 * 2.1 * (t - 0.5)) * kf(t, [[0.5, 0], [0.65, 1], [1.7, 1], [1.95, 0]]) : 0
      // La cadera avanza, todavía oculta tras la cabeza, para que la pata se vea junto a la cara.
      const q = desdeCabeza(p.patas)
      q.x = 34 * sube
      q.y = -52 * sube
      q.rot = -84 * sube + 16 * ola
      q.pie = -22 * sube + 12 * ola
      desdeCabeza(p.patas, 1).rot = 4 * sube
      p.raiz.rot = -1.4 * sube
      desdeCabeza(p.segmentos).y = -4 * sube
      desdeCabeza(p.segmentos, 1).y = -2 * sube
      p.cabeza.rot = kf(t, [[0, 0], [0.4, -5], [1.9, -4], [2.3, 0]]) + 2 * ola
      p.cabeza.x = 4 * sube
      p.antenas = [-4 * ola, 9 * ola]
      p.expresion = expresionEn(t, [[0, null], [0.95, 'b03-guino'], [1.45, null]])
      p.ojos.parpadeo = Array(2).fill(parpadeo(t, [2.35]))
      return p
    },
  },
  {
    id: 'A05', nombre: 'Sorpresa', duracion: 2.1, bucle: false,
    nota: 'Pequeño amago, salto de sorpresa, ojos grandes y antenas que se disparan.',
    expresiones: ['b03-sorprendido'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      p.raiz.y = kf(t, [[0, 0], [0.12, 4], [0.24, -24, 'sale'], [0.42, 0, 'entra'], [0.5, 2], [0.6, 0]])
      p.raiz.sy = kf(t, [[0, 1], [0.12, 0.95], [0.2, 1.07, 'sale'], [0.4, 1], [0.46, 0.95], [0.6, 1]])
      p.raiz.sx = 2 - p.raiz.sy
      p.cabeza.y = kf(t, [[0, 0], [0.12, 5], [0.24, -10, 'sale'], [0.6, -3], [1.6, -3], [2.0, 0]])
      p.cabeza.rot = kf(t, [[0, 0], [0.12, 3], [0.26, -7, 'sale'], [1.5, -5], [2.0, 0]])
      const tiembla = t > 0.55 && t < 1.05 ? 1.6 * Math.sin(PI2 * 14 * t) * (1 - entre(t, 0.55, 1.05)) : 0
      p.cabeza.x = tiembla
      p.ojos.escala = kf(t, [[0.12, 1], [0.24, 1.14, 'sale'], [0.6, 1.06], [1.7, 1.06], [2.0, 1]])
      p.cejas = kf(t, [[0.12, 0], [0.24, -9, 'sale'], [1.6, -6], [2.0, 0]])
      p.antenas = [kf(t, [[0.12, 0], [0.26, 12, 'sale'], [1.6, 6], [2.0, 0]]), kf(t, [[0.12, 0], [0.26, -12, 'sale'], [1.6, -6], [2.0, 0]])]
      p.expresion = expresionEn(t, [[0, null], [0.16, 'b03-sorprendido'], [1.85, null]])
      p.efectos = aparece(t, 0.2, 1.7, { tipo: 'exclamacion', x: 880, y: 150, rot: 12, s: 1.6 })
      return p
    },
  },
  {
    id: 'A06', nombre: 'Dormir', duracion: 5, bucle: true,
    nota: 'Ojos cerrados, respiración lenta y profunda, cabeza y antenas caídas, zetas que suben.',
    expresiones: ['b03-dormilon'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      const b = onda(t, 2.5)
      respirar(p, t, 2.5, 1.9)
      p.raiz.sy = 1 - 0.006 * b
      p.cabeza.y += 12
      p.cabeza.rot = 8 + 1.8 * onda(t, 2.5, -0.15)
      p.antenas = [-20 + 3 * onda(t, 2.5, -0.3), 21 - 3 * onda(t, 2.5, -0.35)]
      p.cejas = 3
      // Dormilón aporta cejas y boca relajadas; los ojos quedan cerrados.
      p.ojos.parpadeo = [1, 1]
      p.expresion = 'b03-dormilon'
      p.efectos = [0, 1, 2].flatMap((k) => {
        const u = frac(t / 2.5 + k / 3)
        return [{ tipo: 'zeta', x: 850 + 40 * u + 8 * Math.sin(PI2 * u), y: 190 - 110 * u, s: 0.5 + 0.7 * u, rot: -10 + 14 * u, opacidad: Math.min(1, u * 5) * (1 - entre(u, 0.7, 1)) }]
      })
      return p
    },
  },
  {
    id: 'A07', nombre: 'Tristeza', duracion: 4.2, bucle: true,
    nota: 'Cabeza baja, antenas caídas y un suspiro lento. Tierna, sin dramatismo.',
    expresiones: ['b03-triste'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      const suspiro = kf(t, [[0.9, 0], [1.7, 1], [2.8, -0.6, 'suave'], [3.6, 0]])
      p.segmentos.forEach((s, i) => {
        s.sy = 0.985 + 0.025 * suspiro
        s.y = 3 - 3 * suspiro + 1.6 * aLoLargo(i, p.segmentos.length)
      })
      p.raiz.y = 4
      p.cabeza.y = 14 - 7 * suspiro
      p.cabeza.rot = 9 - 3 * suspiro + 0.8 * onda(t, 4.2)
      p.antenas = [-24 + 2 * onda(t, 4.2, 0.2) + 5 * suspiro, 25 - 2 * onda(t, 4.2, 0.4) - 5 * suspiro]
      p.ojos.mirarY = 4
      p.ojos.mirarX = -2
      p.ojos.parpadeo = Array(2).fill(parpadeo(t, [3.3], 1.8))
      p.expresion = 'b03-triste'
      return p
    },
  },
  {
    id: 'A08', nombre: 'Curiosidad', duracion: 3.3, bucle: false,
    nota: 'Inclina la cabeza, mueve una antena, mira de un lado a otro y se acerca a mirar.',
    expresiones: ['b03-curioso'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      respirar(p, t, 2.2, 0.6)
      const inclina = kf(t, [[0, 0], [0.45, 1, 'rebote'], [2.7, 1], [3.2, 0]])
      const acerca = kf(t, [[1.5, 0], [1.9, 1, 'sale'], [2.5, 1], [2.9, 0]])
      p.cabeza.rot = -9 * inclina + 3 * acerca
      p.cabeza.x = 8 * inclina + 14 * acerca
      p.cabeza.y = -4 * inclina
      desdeCabeza(p.segmentos).x = 6 * acerca
      desdeCabeza(p.segmentos, 1).x = 3 * acerca
      p.raiz.rot = 1.2 * acerca
      const tic = t > 0.55 && t < 1.5 ? Math.sin(PI2 * 7 * t) * (1 - entre(t, 1.1, 1.5)) : 0
      p.antenas = [-3 * inclina, -13 * inclina + 5 * tic]
      p.ojos.mirarX = kf(t, [[0.4, 0], [0.6, 6], [1.0, 6], [1.15, -5], [1.45, -5], [1.6, 6], [2.7, 6], [3.0, 0]])
      p.ojos.mirarY = -2 * inclina
      p.cejas = -4 * inclina
      p.ojos.parpadeo = Array(2).fill(parpadeo(t, [1.08]))
      p.expresion = expresionEn(t, [[0, null], [0.25, 'b03-curioso'], [3.0, null]])
      p.efectos = aparece(t, 1.75, 2.9, { tipo: 'pregunta', x: 885, y: 155, rot: 10, s: 1.5 })
      return p
    },
  },
  {
    id: 'A09', nombre: 'Estrenar ropa', duracion: 3.1, bucle: false,
    nota: 'Aparece un brillo en su accesorio nuevo; lo mira, se sorprende, da saltitos y posa orgulloso.',
    expresiones: ['b03-sorprendido', 'b03-carcajada', 'b03-orgulloso'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      const mira = kf(t, [[0.2, 0], [0.55, 1], [0.9, 1], [1.1, 0]])
      p.cabeza.rot = -7 * mira + kf(t, [[2.2, 0], [2.5, -6, 'sale'], [3.0, -5]])
      p.ojos.mirarY = -7 * mira
      p.ojos.mirarX = -3 * mira
      p.raiz.y = kf(t, [[0.6, 0], [0.72, -10, 'sale'], [0.86, 0], [1.0, 0], [1.16, -38, 'sale'], [1.34, 0, 'entra'], [1.44, 0], [1.6, -38, 'sale'], [1.78, 0, 'entra']])
      p.raiz.sy = kf(t, [[0.95, 1], [1.0, 0.93], [1.08, 1.05], [1.34, 0.94], [1.42, 1.04], [1.78, 0.94], [1.92, 1], [2.25, 1], [2.45, 1.03], [3.1, 1.02]])
      p.raiz.sx = 2 - p.raiz.sy
      const sacude = t > 1.0 && t < 2.15 ? Math.sin(PI2 * 5.5 * (t - 1)) * (1 - entre(t, 1.9, 2.15)) : 0
      p.segmentos.forEach((s, i) => (s.rot = 4 * sacude * (i % 2 ? 1 : -1)))
      desdeCabeza(p.segmentos).sx = kf(t, [[2.2, 1], [2.5, 1.03], [3.1, 1.02]])
      p.ojos.escala = kf(t, [[0.6, 1], [0.72, 1.1, 'sale'], [0.95, 1]])
      p.expresion = expresionEn(t, [[0, null], [0.62, 'b03-sorprendido'], [0.98, 'b03-carcajada'], [2.25, 'b03-orgulloso']])
      const brillos = [[700, 190, 0.15], [790, 205, 0.3], [640, 240, 0.45], [760, 160, 2.3], [600, 330, 2.4]]
      p.efectos = brillos.flatMap(([x, y, t0], k) => aparece(t, t0, t0 + 0.75, { tipo: 'brillo', x, y, rot: 15 * k, s: 1.1 }))
      return p
    },
  },
  {
    id: 'A10', nombre: 'Victoria', duracion: 3.4, bucle: false,
    nota: 'Dos saltitos de impulso y un gran salto en arco con las patas abiertas; aterriza y levanta la pata como un puño de campeón.',
    expresiones: ['b03-carcajada', 'b03-orgulloso'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      p.raiz.y = kf(t, [[0, 0], [0.14, -22, 'sale'], [0.28, 0, 'entra'], [0.42, -22, 'sale'], [0.56, 0, 'entra'], [0.66, 0], [0.98, -150, 'sale'], [1.32, 0, 'entra'], [1.44, 4], [1.6, 0]])
      p.raiz.sy = kf(t, [[0, 1], [0.28, 0.93], [0.34, 1], [0.56, 0.9], [0.66, 0.84], [0.76, 1.1, 'sale'], [1.0, 1], [1.3, 1.02], [1.4, 0.84, 'sale'], [1.6, 1.04], [1.75, 1]])
      p.raiz.sx = 2 - p.raiz.sy
      // En el aire el cuerpo se arquea: el centro sube y la cabeza mira al cielo.
      const arco = kf(t, [[0.7, 0], [0.95, 1, 'sale'], [1.2, 1], [1.35, 0]])
      p.segmentos.forEach((s, i) => (s.y = -30 * arcoCuerpo(aLoLargo(i, p.segmentos.length)) * arco))
      p.patas.forEach((q, i) => {
        const f = aLoLargo(i, p.patas.length)
        q.y = -30 * arcoCuerpo(f) * arco
        q.rot = arco * (f < 0.5 ? 22 : -22)
        q.pie = arco * (f < 0.5 ? 12 : -16)
      })
      const puno = kf(t, [[1.5, 0], [1.8, 1, 'rebote'], [2.75, 1], [3.15, 0]])
      const bombea = t > 1.85 && t < 2.7 ? Math.sin(PI2 * 2.4 * (t - 1.85)) : 0
      const q = desdeCabeza(p.patas)
      q.x += 34 * puno
      q.y += -72 * puno
      q.rot += -70 * puno + 10 * bombea
      q.pie += -30 * puno
      p.raiz.rot = -2 * puno
      desdeCabeza(p.segmentos).y += -6 * puno
      desdeCabeza(p.segmentos, 1).y += -3 * puno
      p.cabeza.rot = kf(t, [[0, 0], [0.62, 5], [0.95, -12], [1.3, -4], [1.45, 4], [1.6, -7], [2.8, -6], [3.3, 0]]) + 2 * bombea
      p.cabeza.y = -20 * arco - 4 * puno + 3 * bombea
      p.expresion = expresionEn(t, [[0, null], [0.62, 'b03-carcajada'], [2.3, 'b03-orgulloso'], [3.25, null]])
      p.efectos = [
        ...rafaga(t, 0.95, { x: 480, y: 20, n: 22, semilla: 11, fuerza: 340, vida: 2 }),
        ...rafaga(t, 1.38, { x: 470, y: 560, n: 5, tipo: 'estrella', semilla: 5, fuerza: 300, vida: 1.4 }),
        ...aparece(t, 1.8, 3.1, { tipo: 'estrella', x: 960, y: 250, rot: 15, s: 1.3 }),
      ]
      return p
    },
  },
  {
    id: 'A11', nombre: 'Cariño', duracion: 3.2, bucle: false,
    nota: 'Inclina la cabeza, se sonroja, manda un besito, dibuja círculos tímidos con el pie y suben corazones.',
    expresiones: ['b03-besito'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      respirar(p, t, 3.2, 0.7)
      const abrazo = kf(t, [[0.1, 0], [0.5, 1, 'sale'], [2.4, 1], [2.9, 0]])
      p.raiz.sx = 1 - 0.025 * abrazo
      p.raiz.sy = 1 + 0.02 * abrazo
      p.raiz.rot = 1.4 * onda(t, 1.6) * abrazo
      p.cabeza.rot = 7 * abrazo + 1.5 * onda(t, 1.6, 0.1) * abrazo
      p.cabeza.y = 3 * abrazo
      // Pie tímido: la pata delantera dibuja círculos con la punta del zapato.
      const timido = kf(t, [[0.4, 0], [0.7, 1], [2.3, 1], [2.7, 0]])
      const q = desdeCabeza(p.patas)
      q.y = -6 * timido
      q.rot = 7 * Math.sin(PI2 * 1.3 * t) * timido
      q.pie = (-12 + 9 * Math.cos(PI2 * 1.3 * t)) * timido
      p.segmentos.forEach((s, i) => (s.rot = 2.2 * onda(t, 1.6, -i * 0.08) * abrazo))
      p.rubor = 1 + 0.16 * abrazo
      p.antenas = [5 * abrazo + 2 * onda(t, 1.6), -5 * abrazo - 2 * onda(t, 1.6, 0.2)]
      p.expresion = expresionEn(t, [[0, null], [0.35, 'b03-besito'], [1.55, null]])
      p.ojos.parpadeo = Array(2).fill(parpadeo(t, [2.05], 1.6))
      p.efectos = [0.5, 0.85, 1.2, 1.55].flatMap((t0, k) => {
        const u = (t - t0) / 1.5
        if (u < 0 || u > 1) return []
        return [{ tipo: 'corazon', x: 905 + 25 * k + 14 * Math.sin(PI2 * u * 1.2 + k), y: 300 - 190 * u, s: (0.7 + 0.25 * (k % 2)) * Math.min(1, u * 6), rot: 10 * Math.sin(PI2 * u), opacidad: 1 - entre(u, 0.7, 1) }]
      })
      return p
    },
  },
  {
    id: 'A12', nombre: 'Jugar', duracion: 2.4, bucle: true,
    nota: 'Se mece como un caballito y sus segmentos rebotan uno tras otro, como un resorte.',
    expresiones: ['b03-carcajada'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      const T = 0.6
      p.raiz.rot = 2.6 * onda(t, 1.2)
      p.segmentos.forEach((s, i) => {
        const v = Math.max(0, Math.sin(PI2 * (t / T - i * 0.12)))
        s.y = -12 * v
        s.sy = 1 + 0.03 * v
        s.sx = 1 - 0.02 * v
      })
      p.patas.forEach((q, i) => {
        const v = Math.max(0, Math.sin(PI2 * (t / T - i * 0.12 - 0.04)))
        q.y = -10 * v
        q.pie = -8 * v
      })
      const vc = Math.max(0, Math.sin(PI2 * (t / T - 0.62)))
      p.cabeza.y = -14 * vc
      p.cabeza.rot = -3 * vc + 2 * onda(t, 1.2, 0.25)
      p.expresion = expresionEn(t, [[0, null], [1.2, 'b03-carcajada']])
      return p
    },
  },
  // ── Propuestas adicionales (mismo sistema) ──
  {
    id: 'E01', nombre: 'Reír', duracion: 2.4, bucle: true, extra: true,
    nota: 'Carcajada: cabeza hacia atrás, cuerpo que tiembla de risa y mejillas encendidas.',
    expresiones: ['b03-carcajada'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      const risa = kf(t, [[0, 0.4], [0.3, 1], [2.1, 1], [2.4, 0.4]])
      p.raiz.y = -5 * Math.abs(Math.sin(PI2 * 2.5 * t)) * risa
      p.segmentos.forEach((s, i) => {
        s.sy = 1 + 0.025 * Math.sin(PI2 * 5 * t + i) * risa
        s.y = -2 * Math.sin(PI2 * 5 * t + i * 0.8) * risa
      })
      p.cabeza.rot = (-8 + 3 * Math.sin(PI2 * 5 * t)) * risa
      p.cabeza.y = -3 * risa
      p.rubor = 1 + 0.12 * risa
      p.expresion = 'b03-carcajada'
      return p
    },
  },
  {
    id: 'E02', nombre: 'Bailar', duracion: 2, bucle: true, extra: true,
    nota: 'Balanceo al compás, golpecitos de patas alternados y notas musicales.',
    expresiones: ['b03-guino'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      const beat = 0.5
      p.raiz.x = 12 * onda(t, 1)
      p.raiz.rot = -2.5 * onda(t, 1)
      p.cabeza.rot = 7 * onda(t, 1, 0.08)
      p.cabeza.y = -5 * Math.abs(onda(t, 1, 0.08))
      p.segmentos.forEach((s, i) => {
        s.rot = 3 * onda(t, 1, -i * 0.07)
        s.y = -4 * Math.abs(onda(t, 1, -i * 0.07))
      })
      p.patas.forEach((q, i) => {
        const golpe = Math.max(0, Math.sin(PI2 * (t / (2 * beat) + (i % 2) * 0.5)))
        q.y = -16 * golpe ** 2
        q.pie = -12 * golpe ** 2
      })
      p.expresion = expresionEn(t, [[0, null], [1, 'b03-guino']])
      p.efectos = [0, 1].flatMap((k) => {
        const u = frac(t / 2 + k * 0.5)
        return [{ tipo: 'nota', x: 860 + 30 * k + 16 * Math.sin(PI2 * u), y: 230 - 120 * u, s: 1.1 * Math.min(1, u * 5), rot: 12 * Math.sin(PI2 * u), opacidad: 1 - entre(u, 0.65, 1) }]
      })
      return p
    },
  },
  {
    id: 'E03', nombre: 'Pensar', duracion: 3.6, bucle: false, extra: true,
    nota: 'Pata bajo la barbilla, mirada hacia arriba, antena que tamborilea y puntos de pensamiento.',
    expresiones: ['b03-pensativo'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      respirar(p, t, 2.4, 0.6)
      const piensa = kf(t, [[0.1, 0], [0.55, 1, 'sale'], [3.0, 1], [3.5, 0]])
      const q = desdeCabeza(p.patas)
      q.y = -46 * piensa
      q.rot = -38 * piensa
      q.pie = -20 * piensa
      p.cabeza.rot = -6 * piensa
      p.ojos.mirarY = -6 * piensa
      p.ojos.mirarX = -4 * piensa
      const tamborilea = t > 0.9 && t < 2.9 ? Math.max(0, Math.sin(PI2 * 4 * t)) : 0
      p.antenas = [-3 * piensa, -6 * piensa - 9 * tamborilea]
      p.expresion = expresionEn(t, [[0, null], [0.3, 'b03-pensativo'], [3.3, null]])
      p.efectos = [0, 1, 2].flatMap((k) => aparece(t, 1.0 + k * 0.35, 3.0, { tipo: 'brillo', x: 870 + k * 34, y: 200 - k * 34, s: 0.45 + k * 0.2 }))
      return p
    },
  },
  {
    id: 'E04', nombre: 'Tropezar y recuperarse', duracion: 2.6, bucle: false, extra: true,
    nota: 'La pata delantera resbala, se inclina hacia delante, se recupera y se ríe con vergüenza.',
    expresiones: ['b03-asustado'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      const cae = kf(t, [[0.15, 0], [0.38, 1, 'entra'], [0.62, 1], [0.95, -0.25, 'sale'], [1.2, 0]])
      p.raiz.rot = 7 * cae
      desdeCabeza(p.patas).rot = -26 * Math.max(0, cae)
      desdeCabeza(p.patas).pie = -15 * Math.max(0, cae)
      desdeCabeza(p.patas, 1).rot = -10 * Math.max(0, cae)
      p.cabeza.y = 14 * Math.max(0, cae)
      p.cabeza.rot = 10 * cae
      p.segmentos.forEach((s, i) => (s.y = 3 * cae * aLoLargo(i, p.segmentos.length)))
      const niega = t > 1.4 && t < 1.95 ? 5 * Math.sin(PI2 * 4 * (t - 1.4)) : 0
      p.cabeza.rot += niega
      p.rubor = 1 + 0.16 * kf(t, [[1.1, 0], [1.3, 1], [2.3, 1], [2.6, 0]])
      p.expresion = expresionEn(t, [[0, null], [0.22, 'b03-asustado'], [1.15, null]])
      p.ojos.escala = kf(t, [[0.2, 1], [0.32, 1.1, 'sale'], [1.1, 1]])
      p.efectos = aparece(t, 0.3, 1.6, { tipo: 'gota', x: 615, y: 255, rot: -15, s: 1 })
      return p
    },
  },
  {
    id: 'E05', nombre: 'Mirar alrededor', duracion: 4.2, bucle: true, extra: true,
    nota: 'Mira hacia atrás, hacia arriba y hacia delante, parpadeando en cada cambio.',
    expresiones: [],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      respirar(p, t, 2.1, 0.8)
      p.ojos.mirarX = kf(t, [[0.4, 0], [0.6, -8], [1.6, -8], [1.85, 0], [2.7, 0], [2.95, 7], [3.7, 7], [3.95, 0]])
      p.ojos.mirarY = kf(t, [[1.6, 0], [1.85, -7], [2.6, -7], [2.85, 0]])
      p.cabeza.rot = kf(t, [[0.4, 0], [0.7, -4], [1.6, -4], [1.9, -8], [2.6, -8], [2.95, 2], [3.7, 2], [4.0, 0]])
      p.cabeza.x = kf(t, [[2.7, 0], [3.0, 6], [3.7, 6], [4.0, 0]])
      p.antenas = [kf(t, [[0.4, 0], [0.75, 6], [1.6, 6], [1.9, -3], [2.7, -3], [3.0, 0]]), kf(t, [[1.6, 0], [1.95, -8], [2.6, -8], [2.95, 0]])]
      p.ojos.parpadeo = Array(2).fill(parpadeo(t, [1.7, 2.75]))
      return p
    },
  },
  {
    id: 'E06', nombre: 'Estirarse', duracion: 3.2, bucle: false, extra: true,
    nota: 'Estira la parte delantera hacia arriba y la cola hacia atrás, aprieta los ojos y se sacude.',
    expresiones: ['b03-concentrado'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      const e = kf(t, [[0.2, 0], [1.0, 1, 'sale'], [1.7, 1], [2.1, 0, 'suave']])
      p.segmentos.forEach((s, i) => {
        const f = aLoLargo(i, p.segmentos.length)
        s.x = (f - 0.5) * 18 * e
        s.y = -f * 9 * e
        s.sy = 1 + 0.02 * e
      })
      p.patas.forEach((q, i) => (q.rot = (aLoLargo(i, p.patas.length) < 0.5 ? 9 : -9) * e))
      p.cabeza.x = 16 * e
      p.cabeza.y = -14 * e
      p.cabeza.rot = -9 * e
      p.antenas = [-10 * e, 10 * e]
      const sacude = t > 2.1 && t < 2.7 ? Math.sin(PI2 * 9 * t) * (1 - entre(t, 2.1, 2.7)) : 0
      p.segmentos.forEach((s, i) => (s.rot += 3 * sacude * (i % 2 ? 1 : -1)))
      p.cabeza.rot += 3 * sacude
      p.expresion = expresionEn(t, [[0, null], [0.6, 'b03-concentrado'], [1.9, null]])
      return p
    },
  },
  {
    id: 'E07', nombre: 'Recompensa', duracion: 2.6, bucle: false, extra: true,
    nota: 'Aparece una moneda sobre su cabeza; la mira, salta de alegría y la moneda brilla.',
    expresiones: ['b03-sorprendido', 'b03-carcajada'],
    pose(t, n = 5) {
      const p = poseNeutra(n)
      p.ojos.mirarY = kf(t, [[0.15, 0], [0.35, -7], [1.6, -7], [1.9, 0]])
      p.cabeza.rot = kf(t, [[0.15, 0], [0.4, -6], [1.6, -5], [1.9, 0]])
      p.raiz.y = kf(t, [[0.6, 0], [0.85, -52, 'sale'], [1.1, 0, 'entra'], [1.2, 2], [1.3, 0]])
      p.raiz.sy = kf(t, [[0.5, 1], [0.6, 0.9], [0.7, 1.07], [1.0, 1], [1.12, 0.9], [1.3, 1]])
      p.raiz.sx = 2 - p.raiz.sy
      p.expresion = expresionEn(t, [[0, null], [0.3, 'b03-sorprendido'], [0.6, 'b03-carcajada'], [2.3, null]])
      const moneda = t > 0.05 && t < 2.2 ? [{ tipo: 'moneda', x: 760, y: kf(t, [[0.05, 150], [0.35, 85, 'sale'], [1.8, 80], [2.2, 40]]), s: kf(t, [[0.05, 0], [0.3, 1.5, 'sale'], [0.45, 1.3]]), rot: 0, opacidad: 1 - entre(t, 1.9, 2.2) }] : []
      p.efectos = [...moneda, ...rafaga(t, 0.9, { x: 760, y: 85, n: 6, tipo: 'brillo', semilla: 21, fuerza: 220, gravedad: 260, vida: 1.1, escala: 0.6 })]
      return p
    },
  },
]
