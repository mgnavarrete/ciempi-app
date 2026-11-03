import { describe, expect, it } from 'vitest'
import { MAX_PAUSA_ACTIVA_MS, registrarGesto, segundosDesdeElUltimoPremio, tiempoActivoInicial } from './tiempoActivo'

describe('tiempo activo (lo que la app manda como segundosActivos)', () => {
  it('cada pausa cuenta como máximo 10 s', () => {
    const ta = tiempoActivoInicial()
    registrarGesto(ta, 1_000)
    registrarGesto(ta, 3_000) // 2 s leyendo
    registrarGesto(ta, 63_000) // pausa de 60 s: cuenta 10
    registrarGesto(ta, 64_000) // 1 s
    expect(MAX_PAUSA_ACTIVA_MS).toBe(10_000)
    expect(ta.ms).toBe(13_000)
    // Una hora con la app abierta sin tocar nada: 10 s.
    registrarGesto(ta, 64_000 + 3_600_000)
    expect(ta.ms).toBe(23_000)
  })

  it('el primer gesto no suma y un reloj que retrocede no resta', () => {
    const ta = tiempoActivoInicial()
    registrarGesto(ta, 50_000)
    expect(ta.ms).toBe(0)
    registrarGesto(ta, 40_000)
    expect(ta.ms).toBe(0)
  })

  it('cada premio lleva solo los segundos desde el anterior', () => {
    const ta = tiempoActivoInicial()
    registrarGesto(ta, 1_000)
    registrarGesto(ta, 5_000)
    expect(segundosDesdeElUltimoPremio(ta)).toBe(4)
    registrarGesto(ta, 31_000)
    expect(segundosDesdeElUltimoPremio(ta)).toBe(10)
    expect(segundosDesdeElUltimoPremio(ta)).toBe(0)
  })
})
