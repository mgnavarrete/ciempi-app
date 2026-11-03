import { useEffect, useLayoutEffect, useRef } from 'react'
import { ANIMACIONES, COMER, bocaAbiertaDe, comer, type OpcionesComer, type Pose } from './animacion/animaciones.js'
import { ColaComer, Reproductor } from './animacion/motor.js'
import { crearRig, type Rig } from './animacion/rig.js'
import { posiciones } from './pose'
import type { EscenaViva, EscenaVivaCreciente } from './Vestuario'

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
  /**
   * E08 Comer como capa sobre la animación de fondo; `n` cambia con cada fruta.
   * `boca`: variante de boca abierta. Si la apariencia tapa la boca
   * (`escena.bocaTapada`) no se dibuja ninguna boca: reacción de cabeza y cuerpo.
   */
  comer?: ({ n: number } & Omit<OpcionesComer, 'bocaTapada'>) | null
  /** Dibujos SVG de efectos propios (p. ej. `comida`: la comida equipada), centrados en 0,0. */
  dibujos?: Record<string, string>
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
export function CiempiVivo({ escena, segmentos, base = 'A01', evento = null, tranquilo = false, comer: fruta = null, dibujos }: Props) {
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
  const creciente = 'nMax' in escena
  const ultimosSegmentos = useRef(segmentos)
  ultimosSegmentos.current = segmentos
  const dibujosRef = useRef(dibujos)
  dibujosRef.current = dibujos
  // Posiciones con la forma de la escena (especies) o las de Ciempi.
  const posicionesDeEscena = useRef(posiciones as (n: number) => { role: number; x: number; y: number }[])
  posicionesDeEscena.current = 'nMax' in escena ? (escena as EscenaVivaCreciente).posiciones : posiciones

  // La escena cambia con el vestuario (o, sin escena creciente, con cada palabra): se rearma el rig.
  useLayoutEffect(() => {
    const g = grupo.current
    if (!g) return
    g.innerHTML = escena.html
    try {
      rig.current = crearRig(g, { cabeza: escena.cabeza, expresion: escena.expresion }, escena.rostro, { prefijo: escena.prefijo, dibujos: dibujosRef.current })
      if ('nMax' in escena) rig.current.crecer(ultimosSegmentos.current, posicionesDeEscena.current)
    } catch (e) {
      console.error('Animación de Ciempi:', e)
      rig.current = null
    }
    if (rep.anim) rep.dibujar()
  }, [escena, rep])

  // Escena creciente: cada palabra solo muestra un segmento más (sin recomponer ni rearmar el rig).
  useLayoutEffect(() => {
    if (!creciente || !rig.current) return
    if (!rig.current.crecer(segmentos, posicionesDeEscena.current)) console.error('Ciempi: más segmentos que la escena creciente', segmentos, (escena as EscenaVivaCreciente).nMax)
    if (rep.anim) rep.dibujar()
  }, [segmentos, creciente, rep])

  // E08: opciones de la apariencia vigente, leídas por la cola en cada cuadro
  // (si el vestuario cambia a mitad de la animación, el cuadro siguiente ya usa la reacción que corresponde).
  const bocaTapada = escena.bocaTapada
  const bocaAbierta = bocaAbiertaDe(fruta?.boca)
  const comunes = useRef<OpcionesComer>({})
  comunes.current = { boca: fruta?.boca, bocaTapada }
  const cola = useRef<ColaComer | null>(null)
  if (cola.current) cola.current.comunes = comunes.current

  // E08 activo: la expresión de boca abierta se prepara en un momento libre, no en
  // la primera unidad (medición: ~35–55 ms con la CPU a 6×, una tarea larga).
  // Con la boca tapada no hay expresión que preparar.
  const comerActivo = !!fruta && !bocaTapada
  useEffect(() => {
    if (!comerActivo) return
    const preparar = () => rig.current?.precargarRostro(bocaAbierta)
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(preparar, { timeout: 1500 })
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(preparar, 300)
    return () => clearTimeout(id)
  }, [comerActivo, escena, bocaAbierta])

  // E08 Comer: una fruta por unidad, como capa (sigue caminando mientras come).
  const frutasVistas = useRef(fruta?.n ?? 0)
  useEffect(() => {
    // Solo cuando aumenta (al montar o si el cuerpo se achica no hay nada que comer).
    const nueva = !!fruta && fruta.n > frutasVistas.current
    frutasVistas.current = fruta?.n ?? 0
    if (!fruta || !nueva || sinMovimiento()) return
    if (!cola.current) cola.current = new ColaComer(COMER, comer)
    cola.current.comunes = comunes.current
    rep.capa = cola.current
    if (!comunes.current.bocaTapada) rig.current?.precargarRostro(bocaAbiertaDe(comunes.current.boca))
    const n = ultimosSegmentos.current
    const p = posicionesDeEscena.current(n)[Math.max(0, n - 2)]
    cola.current.llega({ origen: fruta.origen, segmento: fruta.segmento ?? (p ? [p.x, p.y] : undefined) })
    if (!rep.reproduciendo) rep.dibujar()
  }, [fruta?.n, rep])

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
