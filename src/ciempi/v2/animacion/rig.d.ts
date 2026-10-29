import type { Pose } from './animaciones'
export interface Rig {
  svg: SVGElement
  tieneAntenas: boolean
  ojosVisibles(): boolean
  precargarRostro(id: string): void
  cambiarRostro(id: string | null | undefined): void
  aplicar(pose: Pose): void
}
export function crearRig(
  fuente: string | SVGElement,
  info?: { cabeza?: string; expresion?: string | null },
  obtenerRostro?: ((id: string) => string) | null,
  opciones?: { prefijo?: string },
): Rig
export const PIVOTES: Record<string, [number, number]>
export const VISTA: number[]
