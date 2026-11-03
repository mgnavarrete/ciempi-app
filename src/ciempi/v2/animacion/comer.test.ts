import { describe, expect, it } from 'vitest'
import { ANIMACIONES, COMER, comer, poseNeutra } from './animaciones.js'
import { ColaComer, Reproductor, poseConInercia, reducir } from './motor.js'

const E08 = ANIMACIONES.find((a) => a.id === 'E08')!
const fruta = (p: ReturnType<typeof poseNeutra>) => p.efectos.find((e) => (e as { tipo: string }).tipo === 'comida') as { x: number; y: number; s: number } | undefined
const cola = () => new ColaComer(COMER, comer)
/** Avanza la cola en pasos de un cuadro (60 cuadros/s). */
const correr = (c: ColaComer, segundos: number) => {
  for (let i = 0; i < Math.round(segundos * 60); i++) c.avanzar(1 / 60)
}

describe('E08 Comer', () => {
  it('es determinista: el mismo instante da la misma pose', () => {
    for (const t of [0, 0.1, COMER.mordisco, 0.5, COMER.duracion])
      expect(JSON.stringify(E08.pose(t, 7))).toBe(JSON.stringify(E08.pose(t, 7)))
  })

  it('dura ~0,8 s, abre la boca antes del mordisco y después vuelve la expresión vigente', () => {
    expect(E08.duracion).toBeCloseTo(0.8)
    expect(E08.pose(0.05).expresion).toBeNull()
    expect(E08.pose(COMER.abre + 0.05).expresion).toBe(COMER.bocaAbierta)
    expect(E08.pose(COMER.mordisco + 0.01).expresion).toBeNull()
    expect(E08.expresiones).toContain(COMER.bocaAbierta)
  })

  it('no fuerza la expresión de la animación de fondo fuera de la ventana de boca abierta', () => {
    const p = poseNeutra(5)
    p.expresion = 'b03-dormilon'
    comer(p, 0.6, 5)
    expect(p.expresion).toBe('b03-dormilon')
  })

  it('la fruta va del origen a la boca en arco y desaparece al morder', () => {
    const inicio = fruta(E08.pose(0.02))!
    const medio = fruta(E08.pose(0.23))!
    const antes = fruta(E08.pose(COMER.mordisco - 0.005))!
    expect(inicio.x).toBeCloseTo(COMER.origen[0], 0)
    // Arco bajo: sube por sobre la recta entre origen y boca, pero poco (no tapa los ojos).
    expect(medio.y).toBeLessThan(Math.min(COMER.origen[1], COMER.boca[1]) - 20)
    expect(medio.y).toBeGreaterThan(Math.min(COMER.origen[1], COMER.boca[1]) - 50)
    // Se achica al acercarse a la boca y parte del tamaño de la comida de la pista.
    expect(inicio.s).toBeCloseTo(1, 1)
    expect(antes.s).toBeLessThan(0.5)
    expect(Math.hypot(antes.x - COMER.boca[0], antes.y - COMER.boca[1])).toBeLessThan(6)
    expect(fruta(E08.pose(COMER.mordisco + 0.1))).toBeUndefined()
  })

  it('el segmento nuevo (el que sigue al frente) hace pop después del mordisco', () => {
    const n = 6
    const k = n - 2
    expect(E08.pose(0.2, n).segmentos[k].sx).toBeLessThan(1)
    expect(E08.pose(COMER.mordisco + 0.13, n).segmentos[k].sx).toBeGreaterThan(1.05)
    expect(E08.pose(COMER.duracion, n).segmentos[k].sx).toBeCloseTo(1, 1)
    expect(E08.pose(0.2, 1).segmentos[0].sx).toBeLessThan(1) // con uno solo, el frente
  })

  it('con cualquier largo y en movimiento reducido da números válidos y sin partículas', () => {
    for (const n of [0, 1, 2, 5, 40])
      for (let k = 0; k <= 16; k++) {
        const p = reducir(E08.pose((E08.duracion * k) / 16, n), 0.35)
        expect(p.efectos).toHaveLength(0)
        expect(Object.values(p.cabeza).every(Number.isFinite)).toBe(true)
      }
  })

  it('como capa se suma a caminar: las patas siguen caminando', () => {
    const A02 = ANIMACIONES.find((a) => a.id === 'A02')!
    const solo = poseConInercia(A02, 0.3, 5)
    const conCapa = comer(poseConInercia(A02, 0.3, 5), 0.3, 5)
    expect(conCapa.patas.map((q) => q.rot)).toEqual(solo.patas.map((q) => q.rot))
    expect(conCapa.cabeza.rot).not.toBe(solo.cabeza.rot)
  })
})

describe('Cola de E08 (interrumpible, sin acumular)', () => {
  it('una fruta: empieza, termina y queda libre', () => {
    const c = cola()
    expect(c.llega()).toBe('inicia')
    correr(c, 0.5)
    expect(c.activa).toBe(true)
    correr(c, 0.4)
    expect(c.activa).toBe(false)
  })

  it('si llega otra antes del mordisco, salta al mordisco y deja una pendiente', () => {
    const c = cola()
    c.llega()
    correr(c, 0.1)
    expect(c.llega()).toBe('adelanta')
    expect(c.t).toBe(COMER.mordisco)
    expect(c.pendiente).not.toBeNull()
  })

  it('nunca hay más de una pendiente: las demás se funden', () => {
    const c = cola()
    c.llega()
    c.llega()
    for (let i = 0; i < 20; i++) expect(c.llega({ origen: [900, 400 + i] })).toBe('funde')
    expect(c.pendiente?.origen).toEqual([900, 419])
    // Termina la actual (desde el mordisco), sigue la pendiente y luego se vacía.
    correr(c, COMER.reanudar - COMER.mordisco + 0.02)
    expect(c.pendiente).toBeNull()
    expect(c.activa).toBe(true)
    correr(c, COMER.duracion + 0.05)
    expect(c.activa).toBe(false)
  })

  it('con unidades muy rápidas (cada 100 ms durante 4 s) no se acumula atraso', () => {
    const c = cola()
    for (let i = 0; i < 40; i++) {
      c.llega()
      correr(c, 0.1)
      expect(c.activa).toBe(true)
    }
    // Al dejar de llegar, termina en menos de una animación y media.
    correr(c, COMER.duracion * 1.5)
    expect(c.activa).toBe(false)
    expect(c.pendiente).toBeNull()
  })

  it('el reproductor aplica la capa sobre la animación de fondo', () => {
    const r = new Reproductor(() => {})
    r.segmentos = 5
    r.suelo = false
    r.cargar(ANIMACIONES.find((a) => a.id === 'A01')!)
    const sin = r.pose(0)
    const c = cola()
    r.capa = c
    c.llega()
    c.avanzar(0.2)
    const con = r.pose(0)
    expect(con.expresion).toBe(COMER.bocaAbierta)
    expect(con.cabeza.rot).toBeGreaterThan(sin.cabeza.rot)
  })
})
