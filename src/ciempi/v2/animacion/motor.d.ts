import type { Animacion, OpcionesComer, Pose } from './animaciones'
export interface Capa {
  avanzar(dt: number): void
  aplicar(p: Pose, n: number): Pose
}
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
  /** Capa que se suma a la animación (p. ej. ColaComer). */
  capa: Capa | null
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
/** Cola de E08 Comer: una en curso y como mucho una pendiente. */
export class ColaComer implements Capa {
  constructor(tiempos: { mordisco: number; reanudar: number; duracion: number }, capa: (p: Pose, t: number, n: number, opciones: OpcionesComer) => Pose)
  t: number
  activa: boolean
  pendiente: OpcionesComer | null
  opciones: OpcionesComer
  /** Opciones de la apariencia vigente (boca, bocaTapada), leídas en cada cuadro; mandan sobre las de la fruta. */
  comunes: OpcionesComer
  llega(opciones?: OpcionesComer): 'inicia' | 'adelanta' | 'espera' | 'funde'
  avanzar(dt: number): void
  aplicar(p: Pose, n: number): Pose
  detener(): void
}
