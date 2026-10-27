import { useEffect } from 'react'
import { voz, type GeneroVoz } from '../audio/voz'
import type { Genero } from './catalogo'

export const generoDeVozPara = (genero: Genero | null): GeneroVoz | null =>
  genero === 'nino' ? 'masculina' : genero === 'nina' ? 'femenina' : null

/** La voz que lee y habla es la de Ciempi: de hombre si es niño, de mujer si es niña. */
export function useVozDeCiempi(genero: Genero | null) {
  useEffect(() => voz.usarGenero(generoDeVozPara(genero)), [genero])
}
