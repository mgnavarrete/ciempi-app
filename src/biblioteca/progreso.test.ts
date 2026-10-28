import { describe, expect, it } from 'vitest'
import type { Asignacion, Texto } from '../dominio/tipos'
import { resumirProgreso } from './progreso'

const libro = {
  titulo: 'Libro de la terapeuta',
  frases: Array.from({ length: 100 }, (_, i) => `f${i}`),
  capitulos: [
    { titulo: 'Inicio', desdeFrase: 0 },
    { titulo: 'Enero 4', desdeFrase: 40 },
  ],
} as Texto
const cuento = { ...libro, capitulos: [{ titulo: 'Cuento', desdeFrase: 0 }] } as Texto
const asignacion = (a: Partial<Asignacion>) => ({ fraseActual: 0, estado: 'en_curso', completadaEn: null, ...a }) as Asignacion

describe('resumirProgreso', () => {
  it('sin empezar', () => {
    expect(resumirProgreso(asignacion({ estado: 'pendiente' }), libro)).toMatchObject({ fraccion: 0, accion: 'Leer', etiqueta: '2 capítulos', terminado: false })
  })

  it('un libro con capítulos sigue en el capítulo donde iba', () => {
    expect(resumirProgreso(asignacion({ fraseActual: 42, leidoHasta: 42 }), libro)).toMatchObject({ fraccion: 0.42, accion: 'Continuar', etiqueta: 'Enero 4 · 42 %' })
  })

  it('un cuento se lee desde el comienzo: muestra hasta dónde llegó', () => {
    expect(resumirProgreso(asignacion({ fraseActual: 30, leidoHasta: 25 }), cuento)).toMatchObject({ accion: 'Leer', etiqueta: 'Llegó al 25 %' })
  })

  it('terminado alguna vez: estrella, aunque lo esté releyendo', () => {
    expect(resumirProgreso(asignacion({ fraseActual: 3, completadaEn: '2026-10-01' }), cuento)).toMatchObject({ fraccion: 1, terminado: true, accion: 'Leer otra vez' })
  })
})
