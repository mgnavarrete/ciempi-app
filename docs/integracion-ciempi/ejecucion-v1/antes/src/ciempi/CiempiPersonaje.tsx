import { paletaDe, type AparienciaCiempi } from './catalogo'
import { Cabeza, Segmento } from './dibujos'

interface Props {
  apariencia: AparienciaCiempi
  /** Cantidad de segmentos del cuerpo. */
  segmentos?: number
  /** Ancho en px o CSS ("100%"); el alto se ajusta solo. */
  ancho: number | string
  /** Camina en su lugar, ondula y pestañea. */
  animado?: boolean
  className?: string
}

const R_CUERPO = 14
const R_CABEZA = 21
const SEPARACION = R_CUERPO * 1.5
const CENTRO_Y = 66
const ALTO = 104

/** Ciempi completo (cabeza + cuerpo), para la portada de la biblioteca y la tienda. */
export function CiempiPersonaje({ apariencia, segmentos = 5, ancho, animado = true, className = '' }: Props) {
  const colores = paletaDe(apariencia).cuerpo
  // Reservar espacio para la visera y el casco, incluso en previews SVG sin CSS.
  const xCabeza = R_CUERPO + segmentos * SEPARACION + R_CABEZA * 0.65
  const anchoVista = xCabeza + R_CABEZA * 1.85
  return (
    <svg
      width={ancho}
      height={typeof ancho === 'number' ? (ancho * ALTO) / anchoVista : undefined}
      viewBox={`0 0 ${anchoVista} ${ALTO}`}
      className={`overflow-visible ${animado ? 'caminando ciempi-vivo' : ''} ${className}`}
      aria-hidden
    >
      {/* Sombra en el suelo: le da peso y profundidad */}
      <ellipse className="ciempi-sombra" cx={anchoVista / 2} cy={CENTRO_Y + R_CUERPO + 12} rx={anchoVista * 0.44} ry={4.5} fill="#223d5d" opacity={0.13} />
      {Array.from({ length: segmentos }, (_, i) => (
        <g key={i} className="ciempi-ondula" style={{ animationDelay: `${-i * 120}ms` }}>
          <Segmento
            x={R_CUERPO + 2 + i * SEPARACION}
            y={CENTRO_Y}
            r={R_CUERPO}
            color={colores[i % colores.length]}
            indice={i}
            apariencia={apariencia}
            saluda={i === segmentos - 1}
          />
        </g>
      ))}
      <g className="ciempi-ondula" style={{ animationDelay: `${-segmentos * 120}ms` }}>
        <g transform={`translate(${xCabeza} ${CENTRO_Y - 6}) scale(${R_CABEZA / 20})`}>
          <g className="ciempi-cabeza-p">
            <Cabeza apariencia={apariencia} />
          </g>
        </g>
      </g>
    </svg>
  )
}
