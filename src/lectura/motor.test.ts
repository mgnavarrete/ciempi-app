import { describe, expect, it } from 'vitest'
import {
  CONFIG_MOTOR_BASE,
  FIN_PISTA,
  INICIO_PISTA,
  calcularPista,
  pistaDesdePalabras,
  estadoInicial,
  paso,
  type Efecto,
  type Entrada,
  type EstadoMotor,
  type Pista,
} from './motor'

// "Mi perro come el pan": 5 palabras → 5 manzanas.
const pista = calcularPista(5)
const config = { ...CONFIG_MOTOR_BASE, umbralPalabrasPorSegundo: 1.5 }

function correr(entradas: Entrada[], estado: EstadoMotor = estadoInicial(), p: Pista = pista) {
  const efectos: Efecto[] = []
  for (const e of entradas) {
    const r = paso(estado, e, p, config)
    estado = r.estado
    efectos.push(...r.efectos)
  }
  return { estado, efectos }
}

/** Deslizar de `desde` a `hasta` en `ms` milisegundos, con un evento cada 16 ms. */
function deslizar(desde: number, hasta: number, ms: number, t0 = 0): Entrada[] {
  const pasos = Math.max(1, Math.round(ms / 16))
  const entradas: Entrada[] = [{ tipo: 'tocar', pos: desde, t: t0 }]
  for (let i = 1; i <= pasos; i++) {
    entradas.push({ tipo: 'mover', pos: desde + ((hasta - desde) * i) / pasos, t: t0 + (ms * i) / pasos })
  }
  return entradas
}

const decir = (efectos: Efecto[]) => efectos.filter((e) => e.tipo === 'decir')

describe('calcularPista', () => {
  it('reparte las manzanas parejo: la primera al lado de Ciempi, la última en el borde', () => {
    expect(pista.manzanas[0]).toBe(INICIO_PISTA)
    expect(pista.manzanas.at(-1)).toBeCloseTo(FIN_PISTA)
    const distancias = pista.manzanas.slice(1).map((x, i) => x - pista.manzanas[i])
    for (const d of distancias) expect(d).toBeCloseTo(distancias[0])
  })

  it('una palabra sola: su manzana va al borde derecho', () => {
    expect(calcularPista(1).manzanas).toEqual([FIN_PISTA])
    expect(calcularPista(0).manzanas).toEqual([])
  })
})

describe('pistaDesdePalabras', () => {
  it('la primera manzana al comienzo de su palabra, las del medio al centro y la última en el borde derecho', () => {
    const p = pistaDesdePalabras([
      { inicio: 0.1, fin: 0.3 },
      { inicio: 0.35, fin: 0.5 },
      { inicio: 0.55, fin: 0.95 },
    ])
    expect(p.manzanas[0]).toBeCloseTo(0.12)
    expect(p.manzanas[1]).toBeCloseTo(0.425)
    expect(p.manzanas[2]).toBeCloseTo(FIN_PISTA)
    expect(p.fin).toBeCloseTo(FIN_PISTA)
  })

  it('las palabras se leen donde están: la manzana sigue a la palabra, aunque sean de distinto largo', () => {
    const p = pistaDesdePalabras([
      { inicio: 0.1, fin: 0.15 },
      { inicio: 0.2, fin: 0.8 },
      { inicio: 0.85, fin: 0.9 },
    ])
    const r = correr(deslizar(0, 1, 6000), estadoInicial(), p)
    expect(r.estado.fase).toBe('completada')
    expect(r.efectos).not.toContainEqual({ tipo: 'tropiezo' })
  })
})

describe('motor de lectura por palabras', () => {
  it('a buen ritmo dice cada palabra una vez, en orden, y completa con monedas', () => {
    // 5 palabras en 5 segundos ≈ 1 palabra/s
    const { estado, efectos } = correr(deslizar(0, 1, 5000))
    expect(estado.fase).toBe('completada')
    expect(decir(efectos).map((e) => (e as { palabra: number }).palabra)).toEqual([0, 1, 2, 3, 4])
    expect(efectos.at(-1)).toEqual({ tipo: 'completada', aBuenRitmo: true })
  })

  it('al partir no se dice nada: la primera manzana está al lado de Ciempi', () => {
    const { estado, efectos } = correr([{ tipo: 'tocar', pos: 0, t: 0 }])
    expect(estado.palabrasLeidas).toBe(0)
    expect(decir(efectos)).toHaveLength(0)
  })

  it('la palabra se dice justo al llegar a su manzana', () => {
    const antes = correr(deslizar(0, pista.manzanas[1] - 0.01, 2000))
    expect(antes.estado.palabrasLeidas).toBe(1)
    const despues = correr([{ tipo: 'mover', pos: pista.manzanas[1], t: 2100 }], antes.estado)
    expect(decir(despues.efectos)).toEqual([{ tipo: 'decir', palabra: 1 }])
  })

  it('un zarpazo rápido produce tropiezo y no completa', () => {
    const { estado, efectos } = correr(deslizar(0, 1, 250))
    expect(efectos).toContainEqual({ tipo: 'tropiezo' })
    expect(estado.fase).toBe('tropiezo')
    expect(estado.palabrasLeidas).toBeLessThan(5)
  })

  it('después del tropiezo se puede seguir, pero la frase ya no da monedas', () => {
    const r1 = correr(deslizar(0, 1, 250))
    const r2 = correr([{ tipo: 'recuperar' }, ...deslizar(r1.estado.progreso, 1, 6000, 5000)], r1.estado)
    expect(r2.estado.fase).toBe('completada')
    expect(r2.efectos.at(-1)).toEqual({ tipo: 'completada', aBuenRitmo: false })
  })

  it('la velocidad es en palabras: el mismo gesto da igual en frases cortas o largas', () => {
    // 1 palabra por segundo en una frase de 3 y en una de 8: ninguna tropieza.
    for (const n of [3, 8]) {
      const p = calcularPista(n)
      const { efectos, estado } = correr(deslizar(0, 1, n * 1000), estadoInicial(), p)
      expect(efectos).not.toContainEqual({ tipo: 'tropiezo' })
      expect(estado.fase).toBe('completada')
    }
  })

  it('al levantar el dedo se conserva el avance y no se repiten palabras', () => {
    const r1 = correr([...deslizar(0, pista.manzanas[2] + 0.01, 3000), { tipo: 'soltar' }])
    expect(r1.estado.fase).toBe('esperando')
    expect(r1.estado.palabrasLeidas).toBe(3)
    const r2 = correr(deslizar(r1.estado.progreso, 1, 3000, 4000), r1.estado)
    expect(r2.estado.fase).toBe('completada')
    expect(decir(r2.efectos)).toEqual([
      { tipo: 'decir', palabra: 3 },
      { tipo: 'decir', palabra: 4 },
    ])
  })

  it('tocar lejos de donde quedó no avanza', () => {
    const { estado, efectos } = correr([{ tipo: 'tocar', pos: 0.9, t: 0 }])
    expect(efectos).toEqual([{ tipo: 'lejos' }])
    expect(estado.progreso).toBe(0)
  })

  it('en un párrafo (manzanas muy juntas) se retoma tocando la cabeza de Ciempi', () => {
    const parrafo = calcularPista(50, 0.06)
    const leido = correr(deslizar(0, 0.3, 12000), estadoInicial(), parrafo).estado
    const { estado, efectos } = correr([{ tipo: 'soltar' }, { tipo: 'tocar', pos: 0.33, t: 13000 }], leido, parrafo)
    expect(efectos).not.toContainEqual({ tipo: 'lejos' })
    expect(estado.fase).toBe('arrastrando')
  })

  it('volver atrás no borra lo leído ni repite palabras', () => {
    const { estado, efectos } = correr([
      ...deslizar(0, pista.manzanas[1] + 0.01, 2000),
      { tipo: 'mover', pos: 0.05, t: 2100 },
      { tipo: 'mover', pos: pista.manzanas[1] + 0.01, t: 2400 },
    ])
    expect(estado.palabrasLeidas).toBe(2)
    expect(decir(efectos)).toHaveLength(2)
  })

  it('con una sola palabra, se dice y termina al comerse su manzana', () => {
    const una = calcularPista(1)
    const antes = correr(deslizar(0, 0.1, 500), estadoInicial(), una)
    expect(antes.estado.fase).toBe('arrastrando')
    const r = correr(deslizar(0.1, FIN_PISTA + 0.01, 1500, 600), antes.estado, una)
    expect(decir(r.efectos)).toHaveLength(1)
    expect(r.estado.fase).toBe('completada')
  })

  it('la frase termina al llegar al borde derecho, donde está la última manzana', () => {
    const pista = pistaDesdePalabras([
      { inicio: 0.1, fin: 0.3 },
      { inicio: 0.35, fin: 0.5 },
      { inicio: 0.55, fin: 0.7 },
    ])
    // Pasar por encima de la última palabra no basta: hay que llegar al borde.
    const antes = correr(deslizar(0, 0.8, 3000), estadoInicial(), pista)
    expect(decir(antes.efectos)).toHaveLength(2)
    expect(antes.estado.fase).toBe('arrastrando')
    const r = correr(deslizar(0.8, FIN_PISTA + 0.001, 800, 3100), antes.estado, pista)
    expect(decir(r.efectos)).toHaveLength(1)
    expect(r.estado.fase).toBe('completada')
  })
})

describe('sin límite de velocidad (niveles 2 a 4)', () => {
  it('un deslizar muy rápido no tropieza: termina igual', () => {
    const r = correr(deslizar(0, 1, 200), estadoInicial())
    expect(r.efectos).toContainEqual({ tipo: 'tropiezo' })
    let estado = estadoInicial()
    const efectos: Efecto[] = []
    for (const e of deslizar(0, 1, 200)) {
      const paso1 = paso(estado, e, pista, { ...config, sinLimite: true })
      estado = paso1.estado
      efectos.push(...paso1.efectos)
    }
    expect(efectos).not.toContainEqual({ tipo: 'tropiezo' })
    expect(estado.fase).toBe('completada')
  })
})
