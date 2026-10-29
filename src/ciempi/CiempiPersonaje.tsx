import { useEffect, useRef, useState } from 'react'
import { CiempiVivo, type EventoCiempi } from './v2/CiempiVivo'
import { useEscena } from './v2/Vestuario'
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
export function CiempiClasico({ apariencia, segmentos = 5, ancho, animado = true, className = '' }: Props) {
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

/** Equivalencias de las animaciones nuevas con las acciones CSS del Ciempi clásico. */
const ACCION_CLASICA: Record<string, string> = { A04: 'saludar', A03: 'saltar', A12: 'saltar', E02: 'bailar' }

/**
 * Ciempi nuevo (pose aprobada y vestuario, animado por partes) o, si su
 * apariencia guardada no tiene equivalencia, el clásico.
 */
export function CiempiPersonaje({ accion = null, festejarCambios = false, ...props }: Props & {
  /** Acción que juega una vez (A04 saludar, A03 saltar…; ver animacion/animaciones.js). */
  accion?: EventoCiempi | null
  /** Celebra cada cambio de vestuario (Estrenar ropa). */
  festejarCambios?: boolean
}) {
  const art = useEscena(props.apariencia, props.segmentos ?? 5)
  const [evento, setEvento] = useState<EventoCiempi | null>(null)
  const contador = useRef(0)
  useEffect(() => {
    if (accion) setEvento({ id: accion.id, n: ++contador.current })
  }, [accion?.id, accion?.n])
  const clave = art?.clave
  const previa = useRef(clave)
  useEffect(() => {
    if (festejarCambios && clave && previa.current && clave !== previa.current) setEvento({ id: 'A09', n: ++contador.current })
    previa.current = clave
  }, [clave, festejarCambios])

  if (!art) {
    const clasica = accion && ACCION_CLASICA[accion.id]
    return <CiempiClasico {...props} className={`${props.className ?? ''} ${clasica ? `accion-${clasica}` : ''}`} />
  }
  const segmentos = props.segmentos ?? 5
  return (
    <svg width={props.ancho} viewBox={art.viewBox} className={`overflow-visible ${props.className ?? ''}`} aria-hidden data-ciempi="v2" data-segments={segmentos}>
      {props.animado === false ? <g dangerouslySetInnerHTML={{ __html: art.html }} /> : <CiempiVivo escena={art} segmentos={segmentos} evento={evento} />}
    </svg>
  )
}
