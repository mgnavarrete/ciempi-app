import { describe, expect, it } from 'vitest'
import type { NivelLectura } from '../dominio/tipos'
import { HITOS, MINIMO_A_BUEN_RITMO, MONEDAS_POR_UNIDAD, REGLAS_MONEDAS, RITMO_PLAUSIBLE, TOPE_POR_LIBRO, premioRelectura } from './monedas'
import { ESTADO_INICIAL, calcularPremio, combinarEstados, diaValido, normalizarParaHuella, revisarRitmo, sumarDias, type EstadoPremios } from './premios'

const texto = (frases: string[]) => ({ frases, capitulos: [], parrafos: undefined })
const TRES = texto(['Mi gato duerme.', 'El sol sale.', 'Ciempi come una manzana roja.'])
const VEINTE = texto(Array.from({ length: 20 }, (_, i) => `Frase número ${i + 1}.`))
const HOY = '2026-11-03'

const avance = (hasta: number, conPremio = true) => ({ tipo: 'avance' as const, hasta, conPremio })
const pagar = (t: ReturnType<typeof texto>, nivel: NivelLectura, previo: EstadoPremios, hasta: number, conPremio = true) =>
  calcularPremio(t, nivel, previo, avance(hasta, conPremio), { hoy: HOY })

describe('reglas de monedas', () => {
  it('son las de 2.4.1 (esta tarea no cambia la economía; el Inicial, -1, paga como el 0)', () => {
    expect(REGLAS_MONEDAS.version).toBe('2.4.1')
    expect(MONEDAS_POR_UNIDAD).toEqual({ [-1]: 1, 0: 1, 1: 1, 2: 1, 3: 4, 4: 0 })
    expect(TOPE_POR_LIBRO).toEqual({ [-1]: 10, 0: 10, 1: 10, 2: Infinity, 3: 15, 4: 0 })
    expect(HITOS).toEqual({
      [-1]: [],
      0: [],
      1: [],
      2: [{ porcentaje: 100, monedas: 5 }],
      3: [],
      4: [
        { porcentaje: 25, monedas: 5 },
        { porcentaje: 50, monedas: 10 },
        { porcentaje: 75, monedas: 10 },
        { porcentaje: 100, monedas: 15 },
      ],
    })
    expect(([0, 1, 2, 3, 4] as NivelLectura[]).map((n) => premioRelectura(n))).toEqual([1, 1, 1, 2, 3])
    expect(MINIMO_A_BUEN_RITMO).toBe(0.8)
  })
})

describe('calcularPremio: avance', () => {
  it('paga la frase recién leída y avanza lo pagado', () => {
    const r = pagar(TRES, 1, ESTADO_INICIAL, 1)
    expect(r).toMatchObject({ monedas: 1, motivo: 'avance', unidades: 1, estado: { pagadoHasta: 1, hitosHasta: 0 } })
    expect(r.costoSegundos).toBeCloseTo(0.5)
  })

  it('lo ya pagado no vuelve a pagar (repetido, otro dispositivo, reinstalación)', () => {
    const previo = pagar(TRES, 1, ESTADO_INICIAL, 2).estado
    expect(pagar(TRES, 1, previo, 2)).toMatchObject({ monedas: 0, motivo: 'ya_pagado', estado: previo })
    expect(pagar(TRES, 1, previo, 1).monedas).toBe(0)
  })

  it('si se salta frases paga solo la última (las otras fueron sin buen ritmo), pero el tiempo mínimo cuenta todas', () => {
    const r = pagar(TRES, 1, ESTADO_INICIAL, 3)
    expect(r).toMatchObject({ monedas: 1, unidades: 1, estado: { pagadoHasta: 3 } })
    // 3 + 3 + 5 palabras: 0,5 + 0,5 + 0,5 s.
    expect(r.costoSegundos).toBeCloseTo(1.5)
  })

  it('una frase muy rápida avanza sin moneda (y después ya no se paga)', () => {
    const r = pagar(TRES, 1, ESTADO_INICIAL, 1, false)
    expect(r).toMatchObject({ monedas: 0, motivo: 'ya_pagado', estado: { pagadoHasta: 1 } })
    expect(pagar(TRES, 1, r.estado, 1).monedas).toBe(0)
  })

  it('un avance más allá del final se recorta al libro; uno negativo no paga', () => {
    expect(pagar(TRES, 1, ESTADO_INICIAL, 999).estado.pagadoHasta).toBe(3)
    expect(pagar(TRES, 1, ESTADO_INICIAL, -5)).toMatchObject({ monedas: 0, estado: ESTADO_INICIAL })
  })

  it('respeta el tope por libro: 20 frases en el nivel 1 dan 10 monedas en total', () => {
    let e = ESTADO_INICIAL
    let total = 0
    for (let i = 1; i <= 20; i++) {
      const r = pagar(VEINTE, 1, e, i)
      total += r.monedas
      e = r.estado
    }
    expect(total).toBe(10)
  })

  it('nivel 2: una por oración (sin tope) y +5 al terminar, una sola vez', () => {
    let e = ESTADO_INICIAL
    let total = 0
    for (let i = 1; i <= 20; i++) {
      const r = pagar(VEINTE, 2, e, i)
      total += r.monedas
      e = r.estado
    }
    expect(total).toBe(20 + 5)
    expect(e.hitosHasta).toBe(100)
  })

  it('nivel 4: hitos al 25, 50, 75 y 100 %; saltar hasta el final paga los que faltan una vez', () => {
    expect(pagar(VEINTE, 4, ESTADO_INICIAL, 5)).toMatchObject({ monedas: 5, estado: { hitosHasta: 25 } })
    const r = pagar(VEINTE, 4, { pagadoHasta: 5, hitosHasta: 25, relecturaDia: null }, 20)
    expect(r.monedas).toBe(10 + 10 + 15)
    expect(r.hitos.map((h) => h.porcentaje)).toEqual([50, 75, 100])
    expect(pagar(VEINTE, 4, r.estado, 20).monedas).toBe(0)
  })
})

describe('calcularPremio: relectura', () => {
  const terminado: EstadoPremios = { pagadoHasta: 3, hitosHasta: 0, relecturaDia: null }
  const releer = (previo: EstadoPremios, dia: string, nivel: NivelLectura = 1) => calcularPremio(TRES, nivel, previo, { tipo: 'relectura', dia }, { hoy: HOY })

  it('exige el libro terminado (en todos los niveles, también sin hitos)', () => {
    expect(releer({ ...terminado, pagadoHasta: 2 }, HOY)).toMatchObject({ monedas: 0, motivo: 'no_terminado' })
    for (const nivel of [0, 1, 2, 3, 4] as NivelLectura[]) expect(releer(terminado, HOY, nivel).monedas).toBe(premioRelectura(nivel))
  })

  it('una vez por día; al día siguiente vuelve a pagar', () => {
    const r = releer(terminado, HOY)
    expect(r).toMatchObject({ monedas: 1, motivo: 'relectura', estado: { relecturaDia: HOY } })
    expect(releer(r.estado, HOY)).toMatchObject({ monedas: 0, motivo: 'relectura_repetida' })
    // Una fecha anterior a la ya pagada (otra zona horaria, la cola) tampoco.
    expect(releer(r.estado, sumarDias(HOY, -1)).motivo).toBe('relectura_repetida')
    expect(calcularPremio(TRES, 1, r.estado, { tipo: 'relectura', dia: sumarDias(HOY, 1) }, { hoy: sumarDias(HOY, 1) }).monedas).toBe(1)
  })

  it('la fecha tiene que ser de estos días (hoy −3 a hoy +1) y válida', () => {
    expect(releer(terminado, sumarDias(HOY, -4)).motivo).toBe('dia_invalido')
    expect(releer(terminado, sumarDias(HOY, 2)).motivo).toBe('dia_invalido')
    expect(releer(terminado, '2026-13-45').motivo).toBe('dia_invalido')
    expect(releer(terminado, 'mañana').motivo).toBe('dia_invalido')
    expect(diaValido(sumarDias(HOY, -3), HOY)).toBe(true)
    expect(diaValido(sumarDias(HOY, 1), HOY)).toBe(true)
  })

  it('el tiempo mínimo de una relectura es el del libro entero', () => {
    expect(releer(terminado, HOY).costoSegundos).toBeCloseTo(1.5)
  })
})

describe('revisarRitmo', () => {
  const T0 = Date.UTC(2026, 10, 3, 12)
  const { toleranciaSegundos: tol, ventanaSegundos: ventana } = RITMO_PLAUSIBLE

  it('a ritmo humano siempre pasa', () => {
    let reloj: number | null = null
    for (let i = 0; i < 100; i++) {
      const r = revisarRitmo(reloj, T0 + i * 3000, 2)
      expect(r.ok).toBe(true)
      if (r.ok) reloj = r.reloj
    }
  })

  it('más rápido de lo posible: pide esperar lo que falta', () => {
    // Recién creado no tiene lectura «ahorrada» más allá de la ventana; se gasta y luego pide esperar.
    const lleno = revisarRitmo(null, T0, ventana + tol)
    expect(lleno.ok).toBe(true)
    const r = revisarRitmo(lleno.ok ? lleno.reloj : null, T0, 10)
    expect(r).toEqual({ ok: false, esperarSegundos: 10 })
    // Pasado ese tiempo, entra.
    expect(revisarRitmo(lleno.ok ? lleno.reloj : null, T0 + 10_000, 10).ok).toBe(true)
  })

  it('lo no usado se acumula hasta una hora (lectura sin conexión que llega de golpe), no más', () => {
    const antes = T0 - 24 * 3600_000
    expect(revisarRitmo(antes, T0, ventana).ok).toBe(true)
    expect(revisarRitmo(antes, T0, ventana + tol + 1)).toEqual({ ok: false, esperarSegundos: 1 })
  })
})

describe('combinarEstados y huella', () => {
  it('combina lo ya pagado de varias fuentes quedándose con lo mayor', () => {
    expect(
      combinarEstados({ pagadoHasta: 4, hitosHasta: 25, relecturaDia: '2026-11-01' }, null, { pagadoHasta: 2, hitosHasta: 50, relecturaDia: '2026-11-02' }, undefined),
    ).toEqual({ pagadoHasta: 4, hitosHasta: 50, relecturaDia: '2026-11-02' })
    expect(combinarEstados()).toEqual(ESTADO_INICIAL)
  })

  it('el mismo texto con otra puntuación, mayúsculas o tildes tiene la misma huella', () => {
    expect(normalizarParaHuella(['¡Canción de Don Ciempiés!', 'Él   come.'])).toBe(normalizarParaHuella(['cancion de don ciempies', 'el come']))
    expect(normalizarParaHuella(['Uno dos'])).not.toBe(normalizarParaHuella(['Uno tres']))
  })
})
