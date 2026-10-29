import { describe, expect, it } from 'vitest'
import { ANIMACIONES, poseNeutra } from './animaciones.js'
import { poseConInercia, reducir } from './motor.js'

const numeros = (v: unknown): number[] =>
  typeof v === 'number' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(numeros) : []

describe('animaciones de Ciempi', () => {
  it('hay 12 pedidas y 7 propuestas, con ids únicos', () => {
    expect(ANIMACIONES.filter((a) => !a.extra)).toHaveLength(12)
    expect(ANIMACIONES.filter((a) => a.extra)).toHaveLength(7)
    expect(new Set(ANIMACIONES.map((a) => a.id)).size).toBe(19)
  })

  it('funcionan con cualquier largo de cuerpo (como en lectura), siempre con números válidos', () => {
    for (const n of [0, 1, 2, 5, 12, 40])
      for (const a of ANIMACIONES)
        for (let k = 0; k <= 12; k++) {
          const p = poseConInercia(a, (a.duracion * k) / 12, n)
          expect(p.segmentos).toHaveLength(n)
          expect(p.patas).toHaveLength(n + 1)
          const { efectos, ...resto } = p
          expect(numeros(resto).every(Number.isFinite), `${a.id} n=${n} k=${k}`).toBe(true)
          expect(Array.isArray(efectos)).toBe(true)
        }
  })

  it('los bucles terminan donde empiezan (sin salto al repetirse)', () => {
    for (const a of ANIMACIONES.filter((x) => x.bucle)) {
      const inicio = a.pose(0)
      const fin = a.pose(a.duracion - 1e-4)
      const d = numeros({ ...inicio, efectos: 0 }).map((v, i) => Math.abs(v - numeros({ ...fin, efectos: 0 })[i]))
      expect(Math.max(...d), a.id).toBeLessThan(0.5)
    }
  })

  it('el movimiento reducido achica las amplitudes y quita las partículas', () => {
    const a = ANIMACIONES.find((x) => x.id === 'A03')!
    const completo = a.pose(0.52)
    const suave = reducir(a.pose(0.52), 0.35)
    expect(Math.abs(suave.raiz.y)).toBeLessThan(Math.abs(completo.raiz.y))
    expect(completo.efectos.length).toBeGreaterThan(0)
    expect(suave.efectos).toHaveLength(0)
  })

  it('la pose neutra no mueve nada', () => {
    const p = poseNeutra(5)
    expect(p.raiz).toEqual({ x: 0, y: 0, rot: 0, giroCentro: 0, sx: 1, sy: 1 })
    expect(p.patas.every((q) => q.rot === 0 && q.y === 0)).toBe(true)
  })
})
