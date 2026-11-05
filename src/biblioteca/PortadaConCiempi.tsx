import { APARIENCIA_INICIAL, type AparienciaCiempi } from '../ciempi/catalogo'
import { FondoTema } from '../ciempi/dibujos'
import { MiniaturaCiempi } from '../ciempi/v2/Miniatura'
import { PORTADA_CON_CIEMPI } from '../contenido/cuentos'

/** ¿La portada es la de un cuento con su Ciempi de protagonista (`ciempi:<fondo>:<emoji>`)? */
export const esPortadaConCiempi = (portada: string | null | undefined): portada is string => !!portada?.startsWith(PORTADA_CON_CIEMPI)

/**
 * Portada de un cuento con su Ciempi de protagonista: su Ciempi tal como lo
 * tiene vestido, sobre un fondo de la tienda acorde al cuento y con el emoji
 * del tema. Sin apariencia (un adulto mirando sus libros), el Ciempi de fábrica.
 */
export function PortadaConCiempi({ portada, apariencia, className = '' }: { portada: string; apariencia?: AparienciaCiempi | null; className?: string }) {
  const [fondo, emoji] = portada.slice(PORTADA_CON_CIEMPI.length).split(':')
  return (
    <div className={`relative overflow-hidden rounded-xl bg-crema shadow-sm ${className}`} aria-hidden>
      <FondoTema fondo={fondo} />
      {emoji && <span className="absolute right-1.5 top-1 text-[1.6em] leading-none drop-shadow">{emoji}</span>}
      <MiniaturaCiempi apariencia={apariencia ?? APARIENCIA_INICIAL} categoria="conjunto" className="absolute inset-x-0 bottom-[6%] w-full" />
    </div>
  )
}
