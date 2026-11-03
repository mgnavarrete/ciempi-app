import { describe, expect, it } from 'vitest'
import { crearCuentaDeLectura, libroTerminado } from './PantallaLectura'

describe('libroTerminado (¿terminar otra vez es una relectura?)', () => {
  it('mira lo leído, no los hitos: sirve en todos los niveles', () => {
    expect(libroTerminado({ leidoHasta: 10 }, 10)).toBe(true)
    expect(libroTerminado({ leidoHasta: 12 }, 10)).toBe(true)
    expect(libroTerminado({ leidoHasta: 9 }, 10)).toBe(false)
    expect(libroTerminado({}, 10)).toBe(false)
    // Un libro vacío nunca está «terminado».
    expect(libroTerminado({ leidoHasta: 0 }, 0)).toBe(false)
  })
})

describe('crearCuentaDeLectura (lo ganado en la pantalla final)', () => {
  it('suma todo lo de esta lectura, no solo la última frase', () => {
    const cuenta = crearCuentaDeLectura()
    cuenta.pedir('a', 1)
    cuenta.pedir('b', 1)
    cuenta.pedir('c', 6)
    expect(cuenta.total()).toBe(8)
  })

  it('se corrige con lo que responde el servidor; ignora pedidos de otras lecturas', () => {
    const cuenta = crearCuentaDeLectura()
    cuenta.pedir('a', 2)
    cuenta.pedir('b', 1)
    expect(cuenta.resolver('a', 0)).toBe(true)
    expect(cuenta.resolver('otro-libro', 5)).toBe(false)
    expect(cuenta.total()).toBe(1)
  })

  it('«Leer otra vez» empieza de cero', () => {
    const cuenta = crearCuentaDeLectura()
    cuenta.pedir('a', 3)
    cuenta.reiniciar()
    expect(cuenta.total()).toBe(0)
    expect(cuenta.resolver('a', 3)).toBe(false)
  })
})
