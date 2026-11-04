import { describe, expect, it } from 'vitest'
import type { NivelLectura } from '../dominio/tipos'
import { modeloDeCompilacion } from '../datos/economia'
import { vistaPorNivel } from '../lenguaje/unidades'
import {
  REGLAS_MONEDAS,
  REGLAS_MONEDAS_E2,
  REGLAS_MONEDAS_E2R,
  contarSilabas,
  leerModeloEconomia,
  pagaPorEsfuerzo,
  reglasDe,
  segundosEsperados,
} from './monedas'
import { ESTADO_INICIAL, calcularPremio, revisarRelojE2, type EstadoPremios, type SolicitudPremio } from './premios'

const HOY = '2026-11-03'
const E = REGLAS_MONEDAS_E2.esfuerzo
const texto = (frases: string[]) => ({ frases, capitulos: [], parrafos: undefined })
// Frases de nivel 1 de verdad (un cuento de Ciempi): 8 unidades.
const CUENTO = texto([
  'Don Ciempiés tiene cien pies.',
  'Cada mañana se pone sus zapatos.',
  'Se pone uno, dos, tres, cuatro.',
  'Tarda mucho en salir de casa.',
  'Sus amigos lo esperan en el parque.',
  'Hoy juegan a la pelota.',
  'Don Ciempiés corre con todos sus pies.',
  'Al final ganan juntos el partido.',
])
const esperado = (u: string, n: NivelLectura = 1) => segundosEsperados(n, contarSilabas(u), E)

describe('bandera de economía', () => {
  it('por defecto (sin bandera, vacía o desconocida en el cliente) es 2.4.1, también en el cálculo', () => {
    expect(leerModeloEconomia(undefined)).toBe('actual')
    expect(reglasDe('actual')).toBe(REGLAS_MONEDAS)
    expect(modeloDeCompilacion(undefined)).toBe('actual')
    expect(modeloDeCompilacion('cualquier-cosa')).toBe('actual')
    expect(modeloDeCompilacion('e2')).toBe('e2')
    // Mismo resultado sin reglas y con las de 'actual', aunque el pedido traiga segundos y tropiezos.
    let a: EstadoPremios = ESTADO_INICIAL
    let b: EstadoPremios = ESTADO_INICIAL
    for (let h = 1; h <= 8; h++) {
      const s: SolicitudPremio = { tipo: 'avance', hasta: h, conPremio: h !== 4, segundosActivos: 9999, tropiezos: 50 }
      const sinReglas = calcularPremio(CUENTO, 1, a, { tipo: 'avance', hasta: h, conPremio: h !== 4 }, { hoy: HOY })
      const conActual = calcularPremio(CUENTO, 1, b, s, { hoy: HOY, reglas: reglasDe('actual') })
      expect(conActual.monedas).toBe(sinReglas.monedas)
      expect(conActual.estado).toEqual(sinReglas.estado)
      expect(conActual.segundosPagados).toBe(0)
      a = sinReglas.estado
      b = conActual.estado
    }
  })

  it('E2R (relectura 1,5/min en todos los niveles) existe pero está apagada: solo con ECONOMIA=e2r', () => {
    expect(leerModeloEconomia('e2r')).toBe('e2r')
    expect(pagaPorEsfuerzo('e2r') && pagaPorEsfuerzo('e2') && !pagaPorEsfuerzo('actual')).toBe(true)
    expect(REGLAS_MONEDAS_E2.esfuerzo.tasaPorMinuto.relectura).toEqual({ 0: 1.5, 1: 1.5, 2: 1, 3: 1, 4: 1 })
    expect(REGLAS_MONEDAS_E2R.esfuerzo.tasaPorMinuto.relectura).toEqual({ 0: 1.5, 1: 1.5, 2: 1.5, 3: 1.5, 4: 1.5 })
    // Todo lo demás, igual que E2.
    expect({ ...REGLAS_MONEDAS_E2R.esfuerzo, tasaPorMinuto: null }).toEqual({ ...REGLAS_MONEDAS_E2.esfuerzo, tasaPorMinuto: null })
  })
})

describe('E2: cálculo', () => {
  const opciones = { hoy: HOY, reglas: REGLAS_MONEDAS_E2 }
  const v = vistaPorNivel(CUENTO, 1)

  it('sin segundosActivos (app anterior o manipulada) cuenta solo el mínimo plausible, no lo esperado', () => {
    const sin = calcularPremio(CUENTO, 1, ESTADO_INICIAL, { tipo: 'avance', hasta: 1, conPremio: true }, opciones)
    // 5 palabras × 0,1 s = 0,5 s, frente a ~17 s esperados.
    expect(sin.segundosPagados).toBeCloseTo(0.5, 5)
    expect(esperado(v.unidades[0])).toBeGreaterThan(10)
    const con = calcularPremio(CUENTO, 1, ESTADO_INICIAL, { tipo: 'avance', hasta: 1, conPremio: true, segundosActivos: 15 }, opciones)
    expect(con.segundosPagados).toBe(15)
  })

  it('segundos inflados: tope de 2× lo esperado; el reloj del servidor puede bajar más el tope', () => {
    const r = calcularPremio(CUENTO, 1, ESTADO_INICIAL, { tipo: 'avance', hasta: 1, conPremio: true, segundosActivos: 86_400 }, opciones)
    expect(r.segundosPagados).toBeCloseTo(2 * esperado(v.unidades[0]), 5)
    const recortado = calcularPremio(CUENTO, 1, ESTADO_INICIAL, { tipo: 'avance', hasta: 1, conPremio: true, segundosActivos: 86_400 }, { ...opciones, maxSegundosPagables: 3 })
    expect(recortado.segundosPagados).toBe(3)
  })

  it('tropiezos: como mucho uno por unidad (no hay reserva sin fin de «relecturas con mejora»)', () => {
    let e: EstadoPremios = ESTADO_INICIAL
    for (let h = 1; h <= 8; h++) {
      e = calcularPremio(CUENTO, 1, e, { tipo: 'avance', hasta: h, conPremio: true, segundosActivos: esperado(v.unidades[h - 1]), ...(h === 8 ? { tropiezos: 10_000 } : {}) }, opciones).estado
    }
    expect(e.mejorTropiezos).toBe(8)
    // Una relectura con 9 999 tropiezos tampoco sube nada; con 7 (menos que 8) sí mejora.
    const releido = { ...opciones, segundosReleidosRecientes: 10_000 }
    expect(calcularPremio(CUENTO, 1, e, { tipo: 'relectura', dia: HOY, tropiezos: 9_999 }, releido).motivo).toBe('sin_mejora')
    const mejora = calcularPremio(CUENTO, 1, e, { tipo: 'relectura', dia: HOY, tropiezos: 7 }, releido)
    expect(mejora).toMatchObject({ monedas: 2, motivo: 'mejora', estado: { mejorTropiezos: 7 } })
  })

  it('relectura con mejora solo en libros de al menos 1 minuto esperado', () => {
    const corto = texto(['Sol.', 'Pan.'])
    let e: EstadoPremios = ESTADO_INICIAL
    e = calcularPremio(corto, 1, e, { tipo: 'avance', hasta: 2, conPremio: true, segundosActivos: 5, tropiezos: 2 }, opciones).estado
    expect(e.pagadoHasta).toBe(2)
    const r = calcularPremio(corto, 1, e, { tipo: 'relectura', dia: HOY, tropiezos: 0 }, { ...opciones, segundosReleidosRecientes: 1000 })
    expect(r).toMatchObject({ monedas: 0, motivo: 'sin_mejora' })
  })

  it('releer una unidad paga a la tasa de relectura (E2: 1 en N3; E2R: 1,5)', () => {
    const previo: EstadoPremios = { ...ESTADO_INICIAL, pagadoHasta: 8 }
    const s: SolicitudPremio = { tipo: 'releida', hasta: 8, conPremio: true, segundosActivos: 600 }
    const e2 = calcularPremio(CUENTO, 3, previo, s, opciones)
    const e2r = calcularPremio(CUENTO, 3, previo, s, { ...opciones, reglas: REGLAS_MONEDAS_E2R })
    expect(e2.segundosPagados).toBe(e2r.segundosPagados)
    expect(e2r.monedas + (e2r.estado.fraccion ?? 0)).toBeCloseTo(1.5 * (e2.monedas + (e2.estado.fraccion ?? 0)), 5)
  })
})

describe('revisarRelojE2 (reloj del servidor sobre los segundos pagados)', () => {
  const t0 = Date.parse('2026-11-03T12:00:00Z')
  it('acepta lo que cabe en el tiempo real, con una ventana de 1 h', () => {
    expect(revisarRelojE2(null, t0, 1, 600)).toMatchObject({ ok: true, pagables: 600 })
    const lleno = revisarRelojE2(null, t0, 1, 3600)
    expect(lleno.ok).toBe(true)
    // Recién pagada una hora: lo siguiente espera lo que cuesta.
    const r = revisarRelojE2(lleno.ok ? lleno.reloj : 0, t0, 1, 60)
    expect(r).toEqual({ ok: false, esperarSegundos: 55 })
  })
  it('un pedido mayor que toda la ventana espera la ventana entera y paga solo una hora', () => {
    const relojLleno = t0
    expect(revisarRelojE2(relojLleno, t0, 1, 10_000)).toMatchObject({ ok: false })
    const r = revisarRelojE2(null, t0, 1, 10_000)
    expect(r).toMatchObject({ ok: true })
    if (r.ok) expect(r.pagables).toBeCloseTo(3605, 0)
  })
  it('sin tope diario ni media tasa: una lectura de 8 h al ritmo real pasa entera', () => {
    let reloj: number | null = null
    let t = t0
    let pagados = 0
    for (let i = 0; i < 8 * 60; i++) {
      t += 60_000
      const r = revisarRelojE2(reloj, t, 1, 60)
      expect(r.ok).toBe(true)
      if (r.ok) {
        reloj = r.reloj
        pagados += r.pagables
      }
    }
    expect(pagados).toBe(8 * 3600)
  })
})
