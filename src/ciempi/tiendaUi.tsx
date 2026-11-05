import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { BotonPrincipal } from '../ui/comunes'

/** Piezas comunes de la tienda y el ropero de Ciempi (2.6). */

/** Lo que llegó en las últimas tandas (criaturas 2.5, bailes 2.7): se marca «Nuevo» en la tienda. */
export const esNuevo = (id: string) => id.startsWith('espalda:b09-') || /^(especie|variante|paquete|baile):/.test(id)
/** La etiqueta del precio en la tienda: amarilla si le alcanza; gris si todavía no. */
export function Precio({ precio, alcanza }: { precio: number; alcanza: boolean }) {
  return (
    <span
      className={`mt-auto rounded-full px-2.5 py-0.5 text-sm font-bold shadow-sm ${alcanza ? 'bg-amarillo text-tinta' : 'bg-arena text-tinta-suave'}`}
      aria-label={`${precio} monedas${alcanza ? '' : ', todavía no te alcanza'}`}
    >
      🪙 {precio}
    </span>
  )
}

export function SelloNuevo() {
  return (
    <span className="absolute -left-1 -top-1 z-10 -rotate-12 rounded-full bg-coral px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
      Nuevo
    </span>
  )
}

/** Cuando no hay nada que mostrar: en la tienda, que ya lo tiene todo; en el ropero, ir a buscar cosas. */
export function Vacio({ fondo, enTienda, alIrALaTienda, children }: { fondo: string; enTienda: boolean; alIrALaTienda: () => void; children: ReactNode }) {
  return (
    <div className={`flex flex-col items-center gap-3 rounded-3xl p-6 text-center ${fondo}`}>
      <p className="text-lg font-bold">{children}</p>
      {!enTienda && (
        <>
          <p className="text-sm text-tinta-suave">¡Lee cuentos, junta monedas y elige algo en la tienda!</p>
          <BotonPrincipal onClick={alIrALaTienda} className="px-5 py-2 text-base">
            🛍️ Ir a la tienda
          </BotonPrincipal>
        </>
      )}
    </div>
  )
}

/** Al final del ropero: una puerta a la tienda. */
export function MasEnLaTienda({ alIrALaTienda }: { alIrALaTienda: () => void }) {
  return (
    <li>
      <button
        onClick={alIrALaTienda}
        className="flex h-full min-h-32 w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-naranjo/60 bg-white/60 p-2 text-center text-sm font-bold leading-tight text-naranjo active:scale-95 apaisado:min-h-24"
      >
        <span className="text-3xl apaisado:text-2xl" aria-hidden>
          🛍️
        </span>
        Más en la tienda
      </button>
    </li>
  )
}

/**
 * Una fila de pestañas que se desliza de lado (categorías, especies). Si hay
 * más pestañas fuera de la vista, un degradado con flecha lo indica en ese
 * borde; la elegida se trae a la vista. Cada pestaña mide al menos 44 px.
 */
export function PestanasDeslizables({ etiqueta, elegida, children }: { etiqueta: string; elegida: string; children: ReactNode }) {
  const fila = useRef<HTMLDivElement>(null)
  const [mas, setMas] = useState({ izquierda: false, derecha: false })
  const medir = useCallback(() => {
    const el = fila.current
    if (!el) return
    const izquierda = el.scrollLeft > 4
    const derecha = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
    setMas((m) => (m.izquierda === izquierda && m.derecha === derecha ? m : { izquierda, derecha }))
  }, [])
  useEffect(() => {
    medir()
    const el = fila.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [medir])
  useEffect(() => {
    const el = fila.current?.querySelector<HTMLElement>('[aria-selected="true"]')
    el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    medir()
  }, [elegida, medir])
  const desplazar = (sentido: 1 | -1) => fila.current?.scrollBy({ left: sentido * fila.current.clientWidth * 0.7, behavior: 'smooth' })
  return (
    <div className="relative shrink-0">
      <div ref={fila} onScroll={medir} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label={etiqueta}>
        {children}
      </div>
      {mas.izquierda && (
        <button
          onClick={() => desplazar(-1)}
          aria-label="Ver más pestañas a la izquierda"
          className="absolute inset-y-0 left-0 flex w-11 items-center justify-start bg-gradient-to-r from-crema via-crema/90 to-transparent pb-1 text-2xl font-bold text-petroleo"
        >
          ‹
        </button>
      )}
      {mas.derecha && (
        <button
          onClick={() => desplazar(1)}
          aria-label="Ver más pestañas a la derecha"
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-end bg-gradient-to-l from-crema via-crema/90 to-transparent pb-1 text-2xl font-bold text-petroleo"
        >
          ›
        </button>
      )}
    </div>
  )
}

/** Clases de una pestaña de la fila deslizable (≥ 44 px de alto, sin cortar el nombre). */
export const clasePestana = (elegida: boolean) =>
  `flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 font-bold apaisado:px-3 apaisado:text-sm ${elegida ? 'bg-naranjo text-white' : 'bg-white text-tinta shadow-sm'}`

/**
 * La barra de compra (o de «usar»): va en el flujo, debajo de la grilla, no
 * flotando encima. Así nunca tapa a Ciempi ni la última fila de tarjetas.
 */
export function BarraCompra({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div role="region" aria-label="Lo que te estás probando" className={`flex shrink-0 flex-col gap-1.5 rounded-2xl border border-[#e2d6bf] bg-white px-3 py-2 shadow-md ${className}`}>
      {children}
    </div>
  )
}
