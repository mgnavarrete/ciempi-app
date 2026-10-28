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
export const MODO_POR_NIVEL: Record<NivelLectura, ModoLectura> = { 0: 'coro', 1: 'coro', 2: 'coro', 3: 'coro', 4: 'solo' }

/** «Leer conmigo» cambia con el nivel: sílaba, palabra, la oración al ritmo del dedo o cada fragmento. */
export function descripcionModo(modo: ModoLectura, nivel: NivelLectura): string {
  if (modo === 'coro' && nivel === 0) return 'Ciempi dice cada sílaba cuando llegas a ella.'
  if (modo === 'coro' && nivel === 2) return 'Ciempi lee la oración contigo, a la velocidad de tu dedo.'
  if (modo === 'coro' && nivel === 3) return 'Ciempi lee cada frase entera cuando llegas a su manzana.'
  if (modo === 'coro' && nivel === 4) return 'Ciempi lee cada parte cuando llegas a su manzana.'
  if (modo === 'eco' && nivel >= 2) return `Ciempi lee ${nivel === 2 ? 'la oración' : nivel === 3 ? 'el párrafo' : 'la página'} y después lo lees tú.`
  return MODOS[modo].descripcion
}
