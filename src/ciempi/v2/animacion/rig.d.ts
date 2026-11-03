import type { Pose } from './animaciones'
export interface Rig {
  svg: SVGElement
  prefijo: string
  /** Segmentos compuestos (en una escena creciente, el máximo que puede mostrar). */
  capacidad: number
  tieneAntenas: boolean
  ojosVisibles(): boolean
  /** Escena creciente: muestra n segmentos como `escena(svg, n)`, sin recomponer. false si n supera la capacidad. */
  crecer(n: number, posiciones: (n: number) => { role: number; x: number; y: number }[]): boolean
  precargarRostro(id: string): void
  cambiarRostro(id: string | null | undefined): void
  aplicar(pose: Pose): void
}
export function crearRig(
  fuente: string | SVGElement,
  info?: { cabeza?: string; expresion?: string | null },
  obtenerRostro?: ((id: string) => string) | null,
  /** `dibujos`: SVG de efectos propios del juego (p. ej. `comida`, la del niño), centrados en 0,0. */
  opciones?: { prefijo?: string; dibujos?: Record<string, string> },
): Rig
export const PIVOTES: Record<string, [number, number]>
export const VISTA: number[]
export const DIBUJOS: Record<string, string>
