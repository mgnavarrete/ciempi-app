import type { AparienciaCiempi } from '../ciempi/catalogo'
import { FondoTema } from '../ciempi/dibujos'
import { PORTADA_CON_CIEMPI } from '../contenido/cuentos'

/** ¿La portada es la de un cuento con su Ciempi de protagonista (`ciempi:<fondo>:<emoji>`)? */
export const esPortadaConCiempi = (portada: string | null | undefined): portada is string => !!portada?.startsWith(PORTADA_CON_CIEMPI)

/**
 * Portada de un cuento con su Ciempi de protagonista: un fondo de la tienda acorde
 * al cuento con el emoji del tema, grande. (2.8.1: ya no dibuja al Ciempi del niño;
 * componer un Ciempi por libro hacía muy lenta la biblioteca.) `apariencia` se ignora.
 */
export function PortadaConCiempi({ portada, className = '' }: { portada: string; apariencia?: AparienciaCiempi | null; className?: string }) {
  const [fondo, emoji] = portada.slice(PORTADA_CON_CIEMPI.length).split(':')
  return (
    <div className={`relative overflow-hidden rounded-xl bg-crema shadow-sm ${className}`} aria-hidden>
      <FondoTema fondo={fondo} />
      {emoji && <span className="absolute inset-0 grid place-items-center text-[3em] leading-none drop-shadow-md">{emoji}</span>}
    </div>
  )
}
