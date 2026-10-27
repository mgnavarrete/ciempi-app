import { describe, expect, it } from 'vitest'
import type { Asignacion, Texto } from '../dominio/tipos'
import { resumirProgreso } from './progreso'

const libro = {
  titulo: 'Papelucho',
  frases: Array.from({ length: 100 }, (_, i) => `f${i}`),
  capitulos: [
    { titulo: 'Inicio', desdeFrase: 0 },
    { titulo: 'Enero 4', desdeFrase: 40 },
  ],
} as Texto
const asignacion = (fraseActual: number, estado: Asignacion['estado'] = 'en_curso') => ({ fraseActual, estado }) as Asignacion

describe('resumirProgreso', () => {
  it('sin empezar', () => {
    expect(resumirProgreso(asignacion(0, 'pendiente'), libro)).toMatchObject({ fraccion: 0, accion: 'Empezar', etiqueta: '2 capítulos' })
  })

  it('a mitad de libro muestra el capítulo y el porcentaje', () => {
    expect(resumirProgreso(asignacion(42), libro)).toMatchObject({ fraccion: 0.42, accion: 'Continuar', etiqueta: 'Enero 4 · 42 %' })
  })

  it('terminado', () => {
    expect(resumirProgreso(asignacion(100, 'completada'), libro)).toMatchObject({ fraccion: 1, accion: 'Leer otra vez' })
  })

  it('un texto corto (un capítulo) muestra solo el porcentaje', () => {
    const corto = { ...libro, capitulos: [{ titulo: 'Cuento', desdeFrase: 0 }] } as Texto
    expect(resumirProgreso(asignacion(25), corto).etiqueta).toBe('25 %')
  })
})
