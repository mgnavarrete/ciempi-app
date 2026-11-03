export interface Pose {
  raiz: { x: number; y: number; rot: number; giroCentro: number; sx: number; sy: number }
  segmentos: { x: number; y: number; rot: number; sx: number; sy: number }[]
  patas: { x: number; y: number; rot: number; pie: number }[]
  cabeza: { x: number; y: number; rot: number; s: number }
  antenas: number[]
  espalda: { rot: number }
  ojos: { parpadeo: number[]; mirarX: number; mirarY: number; escala: number }
  cejas: number
  rubor: number
  /** Expresión B03 que pide la animación en este instante (null: la del conjunto). */
  expresion: string | null
  efectos: unknown[]
  suelo: { velocidad: number } | null
}
export interface Animacion {
  id: string
  nombre: string
  duracion: number
  bucle: boolean
  extra?: boolean
  nota: string
  /** Expresiones B03 que usa (para prepararlas de antemano). */
  expresiones: string[]
  pose(t: number, segmentos?: number): Pose
}
export const ANIMACIONES: Animacion[]
export function poseNeutra(segmentos?: number): Pose
export interface OpcionesComer {
  /** Dónde aparece la fruta (unidades de la base). */
  origen?: [number, number]
  /** Centro del segmento nuevo, para su brillo. */
  segmento?: [number, number]
}
export const COMER: {
  mordisco: number
  reanudar: number
  duracion: number
  boca: [number, number]
  origen: [number, number]
  bocaAbierta: string
  abre: number
}
/** Suma E08 Comer a una pose (capa sobre caminar o reposo). */
export function comer(p: Pose, t: number, n?: number, opciones?: OpcionesComer): Pose
