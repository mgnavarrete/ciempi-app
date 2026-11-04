import type { ReactNode } from 'react'
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
