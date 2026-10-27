import type { ModoLectura, NivelLectura } from '../dominio/tipos'

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
    nombre: 'Leer conmigo',
    descripcion: 'Ciempi dice cada palabra cuando llegas a ella.',
    disponible: true,
    vozAlDeslizar: true,
    leerFraseAntes: false,
  },
  eco: {
    id: 'eco',
    nombre: 'Escuchar primero',
    descripcion: 'Ciempi lee la frase entera y después la lees tú.',
    disponible: true,
    vozAlDeslizar: false,
    leerFraseAntes: true,
  },
  solo: {
    id: 'solo',
    nombre: 'Sin voz',
    descripcion: 'Lees tú solo. Toca una palabra si necesitas ayuda.',
    disponible: true,
    vozAlDeslizar: false,
    leerFraseAntes: false,
  },
}

/** Cómo acompaña la voz si el niño no eligió: más ayuda en los niveles bajos. */
export const MODO_POR_NIVEL: Record<NivelLectura, ModoLectura> = { 1: 'coro', 2: 'eco', 3: 'solo', 4: 'solo' }
