import { describe, expect, it } from 'vitest'
import { elegirVoz, generoDeVoz, idiomaDeVoz, limpiarParaVoz, tonoPara } from './voz'

const v = (lang: string, name = lang, localService = true) => ({ lang, name, localService })

describe('elegirVoz', () => {
  it('prefiere español de Chile', () => {
    expect(elegirVoz([v('es-ES'), v('es-MX'), v('es-CL')])?.lang).toBe('es-CL')
  })

  it('luego español latinoamericano, aunque venga con guion bajo', () => {
    expect(elegirVoz([v('es-ES'), v('es_US'), v('en-US')])?.lang).toBe('es_US')
    expect(elegirVoz([v('es-ES'), v('es-419')])?.lang).toBe('es-419')
  })

  it('si no hay, cualquier español', () => {
    expect(elegirVoz([v('en-US'), v('es-ES')])?.lang).toBe('es-ES')
  })

  it('entre voces de la misma región prefiere la local', () => {
    expect(elegirVoz([v('es-CL', 'red', false), v('es-CL', 'local', true)])?.name).toBe('local')
  })

  it('reconoce los códigos de tres letras de algunos motores (Samsung)', () => {
    expect(elegirVoz([v('eng-USA'), v('spa-ESP'), v('spa_MEX')])?.lang).toBe('spa_MEX')
    expect(idiomaDeVoz('spa-USA')).toBe('es-us')
    expect(idiomaDeVoz('es_CL')).toBe('es-cl')
    expect(idiomaDeVoz('spa')).toBe('es')
  })

  it('null si no hay español', () => {
    expect(elegirVoz([v('en-US'), v('pt-BR')])).toBeNull()
  })
})

describe('limpiarParaVoz', () => {
  it('quita signos de puntuación', () => {
    expect(limpiarParaVoz('¡Hola!')).toBe('Hola')
    expect(limpiarParaVoz('perro,')).toBe('perro')
    expect(limpiarParaVoz('cigüeña.')).toBe('cigüeña')
  })
})

describe('voz según el género de Ciempi', () => {
  const voces = [
    v('es-CL', 'Google español de Chile'),
    v('es-US', 'Paulina'),
    v('es-MX', 'Microsoft Jorge - Spanish (Mexico)'),
    v('es-ES', 'Diego'),
  ]

  it('reconoce voces de hombre y de mujer por su nombre', () => {
    expect(generoDeVoz('Microsoft Jorge - Spanish (Mexico)')).toBe('masculina')
    expect(generoDeVoz('Paulina')).toBe('femenina')
    expect(generoDeVoz('es-cl-x-esc-local')).toBeNull()
  })

  it('niño: prefiere una voz de hombre latinoamericana', () => {
    expect(elegirVoz(voces, 'masculina')?.name).toBe('Microsoft Jorge - Spanish (Mexico)')
  })

  it('niña: prefiere voz de mujer de Chile', () => {
    expect(elegirVoz(voces, 'femenina')?.name).toBe('Google español de Chile')
  })

  it('sin voz de hombre, usa la mejor y baja el tono', () => {
    const soloMujeres = [v('es-CL', 'Google español de Chile')]
    const voz = elegirVoz(soloMujeres, 'masculina')
    expect(voz?.name).toBe('Google español de Chile')
    expect(tonoPara(voz, 'masculina')).toBeLessThan(1)
    expect(tonoPara(voz, 'femenina')).toBe(1)
  })
})
