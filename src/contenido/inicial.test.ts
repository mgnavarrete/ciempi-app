import { describe, expect, it } from 'vitest'
import { CUENTOS, portadaCuento } from './cuentos'
import { CUADERNOS_INICIAL, DIBUJOS_INICIAL, LETRAS_NUEVAS_INICIAL, PALABRAS_AMIGAS_INICIAL, PALABRAS_POR_CUADERNO, claveDibujo } from './inicial'
import { nivelSugerido } from '../lenguaje/dificultad'
import { dividirConParrafos } from '../lenguaje/frases'
import { silabearFrase } from '../lenguaje/silabas'
import { vistaPorNivel } from '../lenguaje/unidades'
import { REGLAS_MONEDAS, REGLAS_MONEDAS_E2, REGLAS_MONEDAS_E2R, monedasDeUnidad } from '../lectura/monedas'

const VOCALES = 'aeiouáéíóú'
const palabrasDe = (frase: string) => claveDibujo(frase).split(' ')

describe('nivel Inicial: «Mis primeras palabras»', () => {
  it('nueve cuadernos de nivel -1 entre los cuentos de Ciempi, con ids únicos y su portada', () => {
    expect(CUADERNOS_INICIAL).toHaveLength(9)
    for (const c of CUADERNOS_INICIAL) {
      expect(c.nivel).toBe(-1)
      expect(CUENTOS).toContain(c)
      expect(portadaCuento(c.id)).toMatch(/^\/portadas\/cuento-(6[6-9]|7[0-4])\.svg$/)
    }
    expect(new Set(CUENTOS.map((c) => c.id)).size).toBe(CUENTOS.length)
  })

  it('una palabra (o frase del puente) por frase, diez por cuaderno', () => {
    CUADERNOS_INICIAL.forEach((c, i) => {
      const { frases } = dividirConParrafos(c.texto)
      expect(frases).toEqual(PALABRAS_POR_CUADERNO[i])
      expect(frases).toHaveLength(10)
    })
  })

  it('solo sílabas directas con letras ya vistas; cada palabra de los cuadernos 1 a 7 estrena su letra', () => {
    let vistas = ''
    PALABRAS_POR_CUADERNO.forEach((palabras, i) => {
      vistas += LETRAS_NUEVAS_INICIAL[i]
      const silabaDirecta = new RegExp(`^([${vistas}]?[${VOCALES}])+$`)
      for (const frase of palabras)
        for (const p of palabrasDe(frase)) {
          if (i === 8 && PALABRAS_AMIGAS_INICIAL.includes(p)) continue
          expect([i + 1, p, silabaDirecta.test(p)]).toEqual([i + 1, p, true])
          // La c solo con a, o, u (ce y ci suenan como s).
          expect([p, /c[eiéí]/.test(p)]).toEqual([p, false])
          if (i < 7) expect([p, [...LETRAS_NUEVAS_INICIAL[i]].some((l) => p.includes(l))]).toEqual([p, true])
        }
    })
  })

  it('palabras de dos sílabas hasta el cuaderno 7 (y «té», de una); de tres en el 8', () => {
    PALABRAS_POR_CUADERNO.slice(0, 7).flat().forEach((p) => expect([p, silabearFrase(p)[0].silabas.length <= 2]).toEqual([p, true]))
    PALABRAS_POR_CUADERNO[7].forEach((p) => expect([p, silabearFrase(p)[0].silabas.length]).toEqual([p, 3]))
  })

  it('cada palabra tiene su dibujo', () => {
    for (const frase of PALABRAS_POR_CUADERNO.flat()) expect([frase, DIBUJOS_INICIAL.has(claveDibujo(frase))]).toEqual([frase, true])
  })

  it('se lee sílaba por sílaba como el nivel 0, una palabra por pantalla', () => {
    for (const c of CUADERNOS_INICIAL) {
      const { unidades } = vistaPorNivel({ ...dividirConParrafos(c.texto), capitulos: [] }, -1)
      expect(unidades).toEqual(dividirConParrafos(c.texto).frases)
    }
  })

  it('una lista de palabras sueltas sugiere el Inicial; una oración corta, no', () => {
    for (const c of CUADERNOS_INICIAL.slice(0, 8)) expect([c.titulo, nivelSugerido(dividirConParrafos(c.texto).frases)]).toEqual([c.titulo, -1])
    expect(nivelSugerido(['Mi mamá me mima.'])).not.toBe(-1)
    // Una sola palabra no es una lista.
    expect(nivelSugerido(['Hola.'])).toBe(1)
  })

  it('paga exactamente lo mismo que el nivel 0, en todas las economías', () => {
    for (const r of [REGLAS_MONEDAS, REGLAS_MONEDAS_E2, REGLAS_MONEDAS_E2R]) {
      expect(r.porUnidad[-1]).toBe(r.porUnidad[0])
      expect(r.topePorLibro[-1]).toBe(r.topePorLibro[0])
      expect(r.hitos[-1]).toEqual(r.hitos[0])
      expect(r.relectura[-1]).toBe(r.relectura[0])
      expect(r.esfuerzo?.tasaPorMinuto.relectura[-1]).toBe(r.esfuerzo?.tasaPorMinuto.relectura[0])
      expect(r.esfuerzo?.silabasPorMinutoReferencia[-1]).toBe(r.esfuerzo?.silabasPorMinutoReferencia[0])
      expect(r.esfuerzo?.nuevas[-1]).toEqual(r.esfuerzo?.nuevas[0])
    }
    for (let k = 1; k <= 10; k++) expect(monedasDeUnidad(-1, k, 10)).toBe(monedasDeUnidad(0, k, 10))
  })
})
