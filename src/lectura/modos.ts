import type { ModoLectura } from '../dominio/tipos'

/**
 * Comportamiento de cada modo de lectura. La pantalla de lectura consulta
 * estas banderas en vez de preguntar por el nombre del modo.
 */
export interface DefinicionModo {
  id: ModoLectura
  nombre: string
  descripcion: string
  disponible: boolean
  /** Decir cada palabra cuando el dedo llega a ella. */
  vozAlDeslizar: boolean
  /** Leer la frase completa antes de que el niño deslice (eco). */
  leerFraseAntes: boolean
}

export const MODOS: Record<ModoLectura, DefinicionModo> = {
  coro: {
    id: 'coro',
    nombre: 'A coro',
    descripcion: 'El niño desliza y la app lee junto con él.',
    disponible: true,
    vozAlDeslizar: true,
    leerFraseAntes: false,
  },
  eco: {
    id: 'eco',
    nombre: 'Eco',
    descripcion: 'La app lee la frase y luego el niño la repite.',
    disponible: false,
    vozAlDeslizar: false,
    leerFraseAntes: true,
  },
  solo: {
    id: 'solo',
    nombre: 'Solo',
    descripcion: 'Solo se iluminan las sílabas, sin voz.',
    disponible: false,
    vozAlDeslizar: false,
    leerFraseAntes: false,
  },
}
