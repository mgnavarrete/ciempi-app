import { useEffect, useLayoutEffect, useRef } from 'react'
import { ANIMACIONES, type Pose } from './animacion/animaciones.js'
import { Reproductor } from './animacion/motor.js'
import { crearRig, type Rig } from './animacion/rig.js'
import type { EscenaViva } from './Vestuario'

/** Una animación que se juega una vez; `n` cambia para repetir la misma. */
export interface EventoCiempi {
  id: string
  n: number
}

interface Props {
  escena: EscenaViva
  /** Segmentos del cuerpo (en lectura, las palabras leídas). */
  segmentos: number
  /** Animación de fondo, en bucle: reposo, caminar, dormir… */
  base?: string
  /** Animación que se juega una vez y vuelve a la de fondo. */
  evento?: EventoCiempi | null
  /** Modo tranquilo: movimientos más suaves y sin partículas. */
  tranquilo?: boolean
}

const MOVIMIENTO_SUAVE = 0.35
const porId = (id: string) => ANIMACIONES.find((a) => a.id === id) ?? ANIMACIONES[0]
const sinMovimiento = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Ciempi animado por partes (ver animacion/ y el laboratorio de animaciones):
 * la escena de `pose.ts` se reparte en cabeza, antenas, ojos, segmentos, patas,
 * cuello y espalda, y solo se mueven; los dibujos aprobados no cambian. Los
 * accesorios siguen a la parte donde están sujetos.
 */
export function CiempiVivo({ escena, segmentos, base = 'A01', evento = null, tranquilo = false }: Props) {
  const grupo = useRef<SVGGElement>(null)
  const rig = useRef<Rig | null>(null)
  const estado = useRef({ base, enEvento: false })
  // Cada cuadro usa la escena actual (con su expresión), aunque el reproductor sea siempre el mismo.
  const dibujar = useRef((pose: Pose) => void pose)
  dibujar.current = (pose) => {
    const r = rig.current
    if (!r) return
    r.cambiarRostro(pose.expresion ?? escena.expresion)
    r.aplicar(pose)
  }
  const reproductor = useRef<Reproductor | null>(null)
  if (!reproductor.current) {
    reproductor.current = new Reproductor((pose) => dibujar.current(pose))
    reproductor.current.suelo = false
  }
  const rep = reproductor.current
  rep.segmentos = segmentos
  rep.movimiento = tranquilo ? MOVIMIENTO_SUAVE : 1

  // La escena cambia con el vestuario o con cada palabra (un segmento más): se rearma el rig.
  useLayoutEffect(() => {
    const g = grupo.current
    if (!g) return
    g.innerHTML = escena.html
    try {
      rig.current = crearRig(g, { cabeza: escena.cabeza, expresion: escena.expresion }, escena.rostro, { prefijo: escena.prefijo })
    } catch (e) {
      console.error('Animación de Ciempi:', e)
      rig.current = null
    }
    if (rep.anim) rep.dibujar()
  }, [escena, rep])

  // Animación de fondo (si no se está jugando un evento).
  useEffect(() => {
    estado.current.base = base
    if (sinMovimiento()) return
    if (!estado.current.enEvento || !rep.reproduciendo) {
      rep.cargar({ ...porId(base), bucle: true })
      rep.bucle = true
      rep.reproducir()
    }
  }, [base, rep])

  // Evento: se juega una vez y se vuelve a la animación de fondo.
  useEffect(() => {
    if (!evento || sinMovimiento()) return
    const anim = porId(evento.id)
    for (const id of anim.expresiones) rig.current?.precargarRostro(id)
    estado.current.enEvento = true
    rep.alTerminar = () => {
      estado.current.enEvento = false
      rep.alTerminar = null
      rep.cargar({ ...porId(estado.current.base), bucle: true })
      rep.bucle = true
      rep.reproducir()
    }
    rep.cargar({ ...anim, bucle: false })
    rep.bucle = false
    rep.reproducir()
  }, [evento?.id, evento?.n, rep])

  // Prepara en segundo plano las expresiones de fondo, para que el primer cambio no demore un cuadro.
  useEffect(() => {
    const t = window.setTimeout(() => {
      for (const id of porId(base).expresiones) rig.current?.precargarRostro(id)
    }, 400)
    return () => window.clearTimeout(t)
  }, [escena, base])

  useEffect(() => () => rep.pausar(), [rep])

  return <g ref={grupo} />
}
