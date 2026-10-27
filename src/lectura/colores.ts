/**
 * Dos colores que se alternan por palabra. Dentro de la palabra, las
 * sílabas se distinguen apenas con dos tonos del mismo fondo.
 */
export const COLORES_PALABRA = [
  { texto: 'text-petroleo', fondo: 'bg-petroleo-claro', fondoAlterno: 'bg-[#c3e2e8]', relleno: '#3a9fb1' },
  { texto: 'text-naranjo', fondo: 'bg-naranjo-claro', fondoAlterno: 'bg-[#fbd2b3]', relleno: '#ef9129' },
] as const

export const colorDePalabra = (indice: number) => COLORES_PALABRA[indice % 2]
