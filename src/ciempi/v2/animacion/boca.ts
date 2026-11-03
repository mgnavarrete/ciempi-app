import type { Pieza } from '../seleccion'

/**
 * ¿La pieza de cabeza equipada tapa la boca? Se decide con el dato del
 * catálogo (`ocultaRostro`: el compositor vacía `#mouth` y `#eyes` y marca
 * `data-hidden="costume"`), nunca por el nombre. Hoy: Robot Lumen, Espíritu de
 * los cuentos y Máscara AraLuz. Gatita, Draco, Búho y Ratón dejan la boca a la vista.
 */
export function tapaBoca(env: { hats?: Pieza[]; masks?: Pieza[] } | null | undefined, cabeza: string | number | undefined): boolean {
  if (!env || cabeza === undefined) return false
  const pieza = [...(env.masks ?? []), ...(env.hats ?? [])].find((x) => x.id === String(cabeza))
  return pieza?.ocultaRostro === true
}
