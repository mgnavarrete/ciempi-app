import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from 'react'
import { protegerDelGestoAtras } from '../plataforma/telefono'
import type { Entrada } from './motor'

interface Props {
  alEntrar: (entrada: Entrada) => void
  className?: string
  children: ReactNode
}

/**
 * Zona donde el niño arrastra el dedo: la frase y el carril de Ciempi debajo.
 * La posición del dedo se mide sobre el ancho de esta misma zona, el mismo
 * con el que se miden las palabras, así que dedo y palabra calzan.
 * Funciona con touch, mouse y lápiz (pointer events), sin hacer scroll.
 */
export const PistaDeslizador = forwardRef<HTMLDivElement, Props>(function PistaDeslizador({ alEntrar, className = '', children }, ref) {
  const zona = useRef<HTMLDivElement>(null)
  const punteroActivo = useRef<number | null>(null)
  useImperativeHandle(ref, () => zona.current!)

  // En Android, deslizar cerca del borde no debe activar el gesto "atrás".
  useEffect(() => protegerDelGestoAtras(zona.current!), [])

  // iOS Safari a veces ignora touch-action: se bloquea el gesto a mano.
  useEffect(() => {
    const el = zona.current
    if (!el) return
    const bloquear = (e: TouchEvent) => e.preventDefault()
    el.addEventListener('touchmove', bloquear, { passive: false })
    el.addEventListener('touchstart', bloquear, { passive: false })
    return () => {
      el.removeEventListener('touchmove', bloquear)
      el.removeEventListener('touchstart', bloquear)
    }
  }, [])

  const posicion = (clientX: number) => {
    const rect = zona.current!.getBoundingClientRect()
    return (clientX - rect.left) / rect.width
  }

  const terminar = (e: React.PointerEvent) => {
    if (punteroActivo.current !== e.pointerId) return
    punteroActivo.current = null
    alEntrar({ tipo: 'soltar' })
  }

  return (
    <div
      ref={zona}
      role="slider"
      aria-label="Desliza el dedo bajo las palabras para leer"
      className={`pista relative cursor-grab active:cursor-grabbing ${className}`}
      onPointerDown={(e) => {
        if (punteroActivo.current !== null) return
        punteroActivo.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        alEntrar({ tipo: 'tocar', pos: posicion(e.clientX), t: performance.now() })
      }}
      onPointerMove={(e) => {
        if (punteroActivo.current !== e.pointerId) return
        alEntrar({ tipo: 'mover', pos: posicion(e.clientX), t: performance.now() })
      }}
      onPointerUp={terminar}
      onPointerCancel={terminar}
      onLostPointerCapture={terminar}
    >
      {children}
    </div>
  )
})
