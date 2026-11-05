import type { AparienciaCiempi, Baile } from './catalogo'
import { CiempiPersonaje } from './CiempiPersonaje'
import { Precio, SelloNuevo, esNuevo } from './tiendaUi'

/**
 * Bailes en la tienda y el ropero (2.7). Cada tarjeta muestra a su Ciempi
 * haciendo el baile en bucle (en modo tranquilo, quieto y con el ícono). En la
 * tienda, tocarla lo baila en grande y ofrece comprarlo; en el ropero, también
 * lo baila y «⭐ Para celebrar» lo elige para el final de los cuentos.
 */
export function GrillaBailes(props: {
  bailes: Baile[]
  apariencia: AparienciaCiempi
  enTienda: boolean
  tranquilo: boolean
  monedas: number
  /** El que se está mirando (marcado). */
  elegido: string | null
  /** El de celebrar (solo en el ropero). */
  celebracion: string
  fondo: string
  ocupado: boolean
  alElegir: (b: Baile) => void
  alCelebrar: (b: Baile) => void
}) {
  const animar = props.tranquilo ? '' : 'transition active:scale-95'
  return (
    <ul className={`grid shrink-0 grid-cols-3 content-start gap-2.5 rounded-3xl p-2.5 ${props.fondo} apaisado:gap-2 apaisado:p-2 @xl:grid-cols-4`}>
      {props.bailes.map((b) => {
        const celebra = props.celebracion === b.id
        const alcanza = props.monedas >= b.precio
        return (
          <li key={b.id} className={`relative flex flex-col items-center gap-1 rounded-2xl bg-white p-1.5 pb-2 shadow-md ${props.elegido === b.id ? 'ring-4 ring-petroleo' : ''}`}>
            {props.enTienda && esNuevo(b.id) && <SelloNuevo />}
            <button onClick={() => props.alElegir(b)} aria-pressed={props.elegido === b.id} aria-label={`Ver ${b.nombre}`} className={`flex w-full flex-col items-center gap-1 ${animar}`}>
              <MiniaturaBaile baile={b} apariencia={props.apariencia} tranquilo={props.tranquilo} />
              <span className="text-center text-sm font-bold leading-tight">{b.nombre}</span>
            </button>
            {props.enTienda ? (
              <>
                <Precio precio={b.precio} alcanza={alcanza} />
                {!alcanza && <span className="-mt-0.5 text-[11px] font-bold leading-tight text-tinta-suave">Te faltan {b.precio - props.monedas}</span>}
              </>
            ) : (
              <button
                onClick={() => props.alCelebrar(b)}
                disabled={props.ocupado}
                aria-pressed={celebra}
                className={`mt-auto min-h-11 rounded-full px-2 py-1 text-xs font-bold leading-tight shadow-sm ${celebra ? 'bg-amarillo text-tinta' : 'bg-arena text-petroleo'} ${animar}`}
              >
                {celebra ? '⭐ Celebra' : '⭐ Para celebrar'}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Su Ciempi haciendo el baile en bucle, en chico (en modo tranquilo, quieto), con el ícono del baile. */
export function MiniaturaBaile({ baile, apariencia, tranquilo }: { baile: Baile; apariencia: AparienciaCiempi; tranquilo: boolean }) {
  return (
    <div className="relative flex h-24 w-full items-end justify-center overflow-hidden rounded-xl bg-crema apaisado:h-[4.5rem]" aria-hidden>
      <div className="mb-1 w-[92%] apaisado:w-[62%]">
        <CiempiPersonaje apariencia={apariencia} ancho="100%" animado={!tranquilo} base={baile.animacion} />
      </div>
      <span className="absolute right-1 top-0.5 text-xl apaisado:text-lg">{baile.emoji}</span>
    </div>
  )
}
