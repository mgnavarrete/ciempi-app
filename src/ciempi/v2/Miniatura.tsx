import type { AparienciaCiempi, CategoriaCiempi } from '../catalogo'
import { useEscena } from './Vestuario'

/** Encuadres sobre la base (viewBox 0 0 1000 650) para mostrar cada parte de cerca. */
const ENCUADRES: Record<string, string> = {
  completo: '30 10 950 610',
  cabeza: '540 0 420 500',
  rostro: '600 215 300 250',
  ojos: '640 255 230 150',
  cuello: '500 190 420 340',
  espalda: '250 100 620 450',
  cuerpo: '90 150 840 450',
  pies: '110 440 740 150',
}
const ENCUADRE_POR_CATEGORIA: Partial<Record<CategoriaCiempi, string>> = {
  conjunto: 'completo',
  paleta: 'completo',
  gesto: 'rostro',
  ojos: 'ojos',
  cabeza: 'cabeza',
  pelo: 'cabeza',
  cara: 'rostro',
  detalle: 'rostro',
  cuello: 'cuello',
  espalda: 'espalda',
  pies: 'pies',
  textura: 'cuerpo',
}

/** Ciempi con una pieza puesta, quieto y acercado a la parte donde va (miniaturas de la tienda). */
export function MiniaturaCiempi({ apariencia, categoria, className = '' }: { apariencia: AparienciaCiempi; categoria: CategoriaCiempi; className?: string }) {
  const art = useEscena(apariencia, 5)
  if (!art) return <div className={`${className} animate-pulse rounded-xl bg-crema`} aria-hidden />
  return (
    <svg viewBox={ENCUADRES[ENCUADRE_POR_CATEGORIA[categoria] ?? 'completo']} className={className} aria-hidden>
      <g dangerouslySetInnerHTML={{ __html: art.html }} />
    </svg>
  )
}
