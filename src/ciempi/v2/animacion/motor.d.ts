import type { Animacion, Pose } from './animaciones'
export class Reproductor {
  constructor(alCuadro: (pose: Pose, t: number) => void)
  anim: Animacion | null
  t: number
  velocidad: number
  bucle: boolean
  reproduciendo: boolean
  /** 1 = completo; menos de 1 = movimiento reducido (sin efectos). */
  movimiento: number
  segmentos: number
  suelo: boolean
  alTerminar: (() => void) | null
  cargar(anim: Animacion): void
  pose(t?: number): Pose
  reproducir(): void
  pausar(): void
  reiniciar(): void
  irA(t: number): void
  dibujar(): void
  costo(): number
}
export function poseConInercia(anim: Animacion, t: number, segmentos?: number): Pose
export function reducir(p: Pose, m: number): Pose
