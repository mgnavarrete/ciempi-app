import { useId } from 'react'
import { paletaDe, type AparienciaClasica as AparienciaCiempi } from './clasico'

/**
 * Piezas de Ciempi dibujadas en SVG (sin imágenes: livianas, offline y
 * combinables). La cabeza se dibuja en coordenadas locales de radio 20,
 * mirando a la derecha; quien la usa la traslada y escala.
 */

export const CONTORNO = '#223d5d'

// ── Cabeza ─────────────────────────────────────────────────────────────────

export function Cabeza({ apariencia }: { apariencia: AparienciaCiempi }) {
  const color = paletaDe(apariencia).cabeza
  const recorte = useId()
  const { cabeza, cara, ojos } = apariencia
  return (
    <g>
      {/* Lo que va detrás de la cabeza */}
      {cabeza === 'cabeza-antenas' && <Antenas />}
      {cabeza === 'cabeza-orejas-gato' && <OrejasGato color={color} />}
      {cabeza === 'cabeza-audifonos' && <rect x={-23} y={-8} width={7} height={13} rx={3} fill="#ea6444" stroke={CONTORNO} strokeWidth={2} />}

      <defs><clipPath id={recorte}><circle r={20} /></clipPath></defs>
      <circle r={20} fill={color} />
      <g clipPath={`url(#${recorte})`}>
        {/* Sombras ilustradas: el color base sigue siendo personalizable. */}
        <path d="M-18 -12 C-24 9 -5 26 16 10 L24 27 L-27 27 L-27 -18Z" fill={CONTORNO} opacity={0.14} />
        <path d="M-15 -8 Q-12 -17 -3 -17" fill="none" stroke="#fff" strokeOpacity={0.48} strokeWidth={3} strokeLinecap="round" />
        <ellipse cx={-7.5} cy={7} rx={4} ry={2.5} fill="#ea6444" opacity={0.65} transform="rotate(15 -7.5 7)" />
        <ellipse cx={16} cy={7} rx={3} ry={2.3} fill="#ea6444" opacity={0.65} />
      </g>
      <circle r={20} fill="none" stroke={CONTORNO} strokeWidth={2.6} />

      <Ojos ojos={ojos} colorCabeza={color} />
      <path d="M-2 -11 Q1 -13 3 -11 M10 -11 Q13 -13 15 -11" fill="none" stroke={CONTORNO} strokeWidth={1.6} strokeLinecap="round" />
      <path d="M1 8 Q8 11 16 7 C14 17 4 18 1 8Z" fill={CONTORNO} stroke={CONTORNO} strokeWidth={1.4} strokeLinejoin="round" />
      <path d="M5 13 Q9 10.5 12 13 Q9 16 5 13Z" fill="#f48780" />

      <Cara cara={cara} />
      <Gorro cabeza={cabeza} />
    </g>
  )
}

const COLOR_IRIS: Record<string, string> = {
  'ojos-azules': '#3a9fb1',
  'ojos-verdes': '#62954c',
  'ojos-miel': '#c98a2e',
}

/** Ojos: el de atrás (x≈1) y el de adelante (x≈12.5). */
function Ojos({ ojos, colorCabeza }: { ojos: string; colorCabeza: string }) {
  const ojo = (cx: number, rx: number, ry: number, delantero: boolean) => {
    const esclera = <ellipse cx={cx} cy={-2} rx={rx} ry={ry} fill="#fff" stroke={CONTORNO} strokeWidth={1.5} />
    const pupilaX = cx + rx * 0.35
    if (ojos === 'ojos-guino' && delantero) {
      return <path d={`M${cx - rx} -2 Q${cx} -${ry + 2} ${cx + rx} -2`} stroke={CONTORNO} strokeWidth={2.2} fill="none" strokeLinecap="round" />
    }
    if (ojos === 'ojos-estrellas') {
      const s = rx * 0.8
      return (
        <g>
          {esclera}
          <path
            transform={`translate(${pupilaX - 0.5} -1.5) scale(${s / 10})`}
            d="M0 -10 L2.9 -4 L9.5 -3.1 L4.7 1.5 L5.9 8.1 L0 5 L-5.9 8.1 L-4.7 1.5 L-9.5 -3.1 L-2.9 -4 Z"
            fill="#efc31d"
            stroke={CONTORNO}
            strokeWidth={1.6}
          />
        </g>
      )
    }
    if (ojos === 'ojos-corazones') {
      const s = rx * 0.8
      return (
        <g>
          {esclera}
          <path
            transform={`translate(${pupilaX - 0.5} -1.5) scale(${s / 10})`}
            d="M0 8 C-12 0 -10 -10 -4 -10 C-1 -10 0 -7 0 -6 C0 -7 1 -10 4 -10 C10 -10 12 0 0 8 Z"
            fill="#ea6444"
            stroke={CONTORNO}
            strokeWidth={1.4}
          />
        </g>
      )
    }
    const iris = COLOR_IRIS[ojos]
    return (
      <g>
        {esclera}
        {iris ? (
          <>
            <circle cx={pupilaX} cy={-1} r={rx * 0.62} fill={iris} />
            <circle cx={pupilaX} cy={-1} r={rx * 0.32} fill={CONTORNO} />
          </>
        ) : (
          <circle cx={pupilaX} cy={-1} r={rx * 0.55} fill={CONTORNO} />
        )}
        <circle cx={pupilaX + rx * 0.2} cy={-2.8} r={rx * 0.2} fill="#fff" />
        <circle cx={pupilaX - rx * 0.25} cy={0.4} r={rx * 0.09} fill="#fff" />
        {ojos === 'ojos-dormilones' && (
          <path d={`M${cx - rx - 0.5} -2 A${rx + 0.5} ${ry + 0.5} 0 0 1 ${cx + rx + 0.5} -2 Z`} fill={colorCabeza} stroke={CONTORNO} strokeWidth={1.5} />
        )}
      </g>
    )
  }
  return (
    <g className="ciempi-ojos">
      {ojo(1, 5.5, 6.5, false)}
      {ojo(12.8, 5, 6, true)}
    </g>
  )
}

function Antenas() {
  return (
    <g stroke={CONTORNO} strokeWidth={2.5} strokeLinecap="round" fill="none">
      <path d="M-6 -17 Q-10 -30 -15 -34" />
      <path d="M5 -18 Q7 -31 11 -36" />
      <circle cx={-15} cy={-35} r={3.5} fill="#3a9fb1" strokeWidth={1.5} />
      <circle cx={11} cy={-37} r={3.5} fill="#3a9fb1" strokeWidth={1.5} />
      <path d="M-16 -36 l1 -1 M10 -38 l1 -1" stroke="#fff" strokeOpacity={0.65} strokeWidth={1.3} />
    </g>
  )
}

function OrejasGato({ color }: { color: string }) {
  return (
    <g stroke={CONTORNO} strokeWidth={2.5} strokeLinejoin="round">
      <path d="M-17 -8 L-15 -31 L-3 -18 Z" fill={color} />
      <path d="M3 -18 L15 -31 L17 -8 Z" fill={color} />
      <path d="M-13 -13 L-12.5 -25 L-6 -18 Z" fill="#f6a5b8" stroke="none" />
      <path d="M6 -18 L12.5 -25 L13 -13 Z" fill="#f6a5b8" stroke="none" />
    </g>
  )
}

function Cara({ cara }: { cara: string }) {
  switch (cara) {
    case 'cara-lentes':
      return (
        <g stroke={CONTORNO} strokeWidth={2} fill="#fff" fillOpacity={0.15}>
          <circle cx={1} cy={-2} r={7.6} />
          <circle cx={12.8} cy={-2} r={7} />
          <path d="M8.6 -3 L5.8 -3 M-6.6 -3 L-15 -6" fill="none" />
        </g>
      )
    case 'cara-lentes-sol':
      return (
        <g stroke={CONTORNO} strokeWidth={1.8}>
          <rect x={-5.5} y={-8} width={13} height={10} rx={3.5} fill="#2d3b52" />
          <rect x={8} y={-8} width={11.5} height={10} rx={3.5} fill="#2d3b52" />
          <path d="M7.5 -4.5 L8 -4.5 M-5.5 -4.5 L-15 -7" fill="none" />
          <path d="M-2.5 -6 L0.5 -6 M10.5 -6 L13 -6" stroke="#fff" strokeOpacity={0.6} strokeLinecap="round" />
        </g>
      )
    case 'cara-lentes-corazon':
      return (
        <g stroke={CONTORNO} strokeWidth={1.6} strokeLinejoin="round">
          {[1, 12.8].map((cx) => (
            <path
              key={cx}
              transform={`translate(${cx} -2.5) scale(0.82)`}
              d="M0 8 C-12 0 -10 -10 -4 -10 C-1 -10 0 -7 0 -6 C0 -7 1 -10 4 -10 C10 -10 12 0 0 8 Z"
              fill="#ea6444"
              fillOpacity={0.85}
            />
          ))}
          <path d="M7.3 -5 L6.5 -5 M-7 -5 L-15 -7" fill="none" />
        </g>
      )
    case 'cara-antifaz':
      return (
        <g>
          <path d="M-9 -7 Q6 -12 21 -6 L20 3 Q14 0 7 3 Q0 0 -8 3 Z" fill="#36384f" stroke={CONTORNO} strokeWidth={1.5} strokeLinejoin="round" />
          <path d="M-9 -4 L-19 -9 M-9 -1 L-18 2" stroke="#36384f" strokeWidth={2.5} strokeLinecap="round" />
          <ellipse cx={1.5} cy={-2} rx={3.6} ry={3.2} fill="#fff" />
          <ellipse cx={13.5} cy={-2} rx={3.3} ry={3} fill="#fff" />
          <circle cx={2.5} cy={-1.6} r={1.8} fill={CONTORNO} />
          <circle cx={14.3} cy={-1.6} r={1.6} fill={CONTORNO} />
        </g>
      )
    default:
      return null
  }
}

function Gorro({ cabeza }: { cabeza: string }) {
  const trazo = { stroke: CONTORNO, strokeWidth: 2.5, strokeLinejoin: 'round' as const }
  switch (cabeza) {
    case 'cabeza-jockey':
      return (
        <g {...trazo}>
          <path d="M-18.5 -7 C-19 -27 15 -29 18.5 -9 C6 -12 -8 -11 -18.5 -7Z" fill="#8eb743" strokeWidth={3} />
          <path d="M-18 -8 Q-20 -22 -5 -24 Q-12 -20 -9 -10Z" fill="#3a9fb1" strokeWidth={1.5} />
          <path d="M-4 -23 Q5 -20 7 -11" fill="none" stroke="#62954c" strokeWidth={1.2} />
          <path d="M12 -10.5 C21 -16 31 -14 31 -9.5 C25 -7 17 -7 12 -8.5Z" fill="#247586" />
          <path d="M17 -11 Q23 -13 28 -11" fill="none" stroke="#73bfcc" strokeWidth={1.2} strokeLinecap="round" />
          <circle cx={-1} cy={-23.5} r={2.6} fill="#247586" strokeWidth={1.5} />
        </g>
      )
    case 'cabeza-flor':
      return (
        <g {...trazo} strokeWidth={1.4}>
          {[0, 72, 144, 216, 288].map((g) => (
            <circle key={g} cx={-8 + 5.5 * Math.cos((g * Math.PI) / 180)} cy={-23 + 5.5 * Math.sin((g * Math.PI) / 180)} r={4.2} fill="#f6a5b8" />
          ))}
          <circle cx={-8} cy={-23} r={3.4} fill="#efc31d" />
        </g>
      )
    case 'cabeza-lazo':
      return (
        <g {...trazo} strokeWidth={1.8}>
          <path d="M-7 -19 L-20 -28 L-19 -11 Z" fill="#ea6444" />
          <path d="M-7 -19 L5 -30 L6 -13 Z" fill="#ea6444" />
          <circle cx={-7} cy={-19} r={3.6} fill="#f6a5b8" />
        </g>
      )
    case 'cabeza-cumpleanos':
      return (
        <g {...trazo} strokeWidth={2}>
          <path d="M-11 -16 L1 -44 L12 -15 Z" fill="#8f6fcf" />
          <path d="M-6 -27 L8 -25 M-2 -36 L5 -35" stroke="#efc31d" strokeWidth={2.4} />
          <circle cx={1} cy={-45} r={4.2} fill="#efc31d" strokeWidth={1.5} />
        </g>
      )
    case 'cabeza-gorro-lana':
      return (
        <g {...trazo}>
          <path d="M-20 -10 C-23 -24 -13 -33 -3 -31 C9 -31 18 -22 19 -12 Z" fill="#3a9fb1" />
          <path d="M-13 -15 Q-17 -24 -10 -29 M-6 -15 Q-9 -25 -5 -30 M2 -15 Q2 -24 -2 -29 M10 -15 Q10 -23 3 -28" fill="none" stroke="#247586" strokeWidth={1.3} />
          <path d="M-20 -13 Q-1 -19 20 -13 L20 -7 Q0 -12 -20 -6Z" fill="#73bfcc" strokeWidth={2} />
          {[-15, -10, -5, 0, 5, 10, 15].map((x) => <path key={x} d={`M${x} ${-13 - (1 - Math.abs(x) / 20) * 2} v4`} stroke="#247586" strokeWidth={1} />)}
          <circle cx={-6} cy={-34} r={5.5} fill="#73bfcc" strokeWidth={1.8} />
          <path d="M-9 -37 l2 3 M-4 -38 l-1 4 M-2 -34 l-3 1 M-8 -31 l2 -2" stroke="#247586" strokeWidth={1} strokeLinecap="round" />
          <rect x={9} y={-12} width={4} height={4} rx={0.8} fill="#fff3ce" strokeWidth={0.9} />
        </g>
      )
    case 'cabeza-vaquero':
      return (
        <g {...trazo} strokeWidth={2}>
          <path d="M-13 -16 C-14 -36 14 -36 13 -16 Z" fill="#b07a45" />
          <rect x={-13} y={-21} width={26} height={4} fill="#ea6444" strokeWidth={1.4} />
          <ellipse cx={0} cy={-16} rx={27} ry={5} fill="#9a6a3a" />
        </g>
      )
    case 'cabeza-mago':
      return (
        <g {...trazo} strokeWidth={2}>
          <path d="M-14 -17 L-3 -52 L15 -17 Z" fill="#36384f" />
          <ellipse cx={0} cy={-17} rx={24} ry={4.5} fill="#36384f" />
          <path d="M-3 -38 l1.4 3 3.2 .4 -2.4 2.2 .7 3.2 -2.9 -1.6 -2.9 1.6 .7 -3.2 -2.4 -2.2 3.2 -.4z" fill="#efc31d" stroke="none" />
          <circle cx={6} cy={-27} r={1.8} fill="#efc31d" stroke="none" />
          <circle cx={-7} cy={-24} r={1.3} fill="#efc31d" stroke="none" />
        </g>
      )
    case 'cabeza-corona':
      return (
        <g {...trazo} strokeWidth={2}>
          <path d="M-14 -15 L-15 -33 L-7 -24 L0 -37 L7 -24 L15 -33 L14 -15 Z" fill="#efc31d" />
          <circle cx={0} cy={-21} r={2.6} fill="#ea6444" strokeWidth={1.2} />
          <circle cx={-8} cy={-19} r={1.8} fill="#3a9fb1" strokeWidth={1.2} />
          <circle cx={8} cy={-19} r={1.8} fill="#3a9fb1" strokeWidth={1.2} />
        </g>
      )
    case 'cabeza-astronauta':
      return (
        <g>
          <path d="M0 -27 L0 -37" stroke={CONTORNO} strokeWidth={2.2} />
          <circle cx={0} cy={-39} r={3.4} fill="#ea6444" stroke={CONTORNO} strokeWidth={1.5} />
          <circle r={27} fill="#c6e3f3" fillOpacity={0.3} stroke="#73bfcc" strokeWidth={3} />
          <path d="M-18 -12 A20 20 0 0 1 -6 -22" stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.85} />
        </g>
      )
    case 'cabeza-audifonos':
      return (
        <g>
          <path d="M-19 -4 C-21 -30 19 -32 19 -6" stroke="#36384f" strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <path d="M-19 -4 C-21 -30 19 -32 19 -6" stroke="#5d6b80" strokeWidth={1.5} fill="none" strokeLinecap="round" />
        </g>
      )
    case 'cabeza-pirata':
      return (
        <g {...trazo} strokeWidth={2}>
          <path d="M-18 -16 L-27 -11 L-24 -5 Z M-18 -15 L-26 -20 L-27 -13 Z" fill="#ea6444" />
          <path d="M-19.5 -6 C-19 -28 19 -28 19.5 -8 C8 -12 -8 -11 -19.5 -6Z" fill="#ea6444" />
          {[
            [-9, -18],
            [0, -22],
            [9, -17],
            [-2, -13],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={1.6} fill="#fff" stroke="none" />
          ))}
        </g>
      )
    case 'cabeza-unicornio':
      return (
        <g {...trazo} strokeWidth={2}>
          <path d="M1 -18 L7 -46 L12 -16 Z" fill="#efc31d" />
          <path d="M3 -24 L10.5 -26 M4.5 -31 L9.5 -33 M5.8 -38 L8.6 -39" stroke="#c98a2e" strokeWidth={1.6} strokeLinecap="round" />
          <circle cx={-7} cy={-19} r={2.6} fill="#f6a5b8" strokeWidth={1.2} />
          <circle cx={-12} cy={-15} r={2.2} fill="#cdb8f2" strokeWidth={1.2} />
        </g>
      )
    default:
      return null
  }
}

// ── Segmentos del cuerpo ───────────────────────────────────────────────────

/** Contorno del segmento según la forma elegida (centrado en x, y, de "radio" r). */
function FormaSegmento({ forma, x, y, r, ...props }: { forma: string; x: number; y: number; r: number } & React.SVGProps<SVGPathElement>) {
  const pts = (lista: [number, number][]) => 'M' + lista.map(([px, py]) => `${x + px * r} ${y + py * r}`).join(' L') + ' Z'
  const poligono = (n: number, radio: number, giro: number) =>
    pts(Array.from({ length: n }, (_, i) => [radio * Math.cos(giro + (i * 2 * Math.PI) / n), radio * Math.sin(giro + (i * 2 * Math.PI) / n)]))
  let d: string
  switch (forma) {
    case 'forma-cuadrado':
      d = `M${x - 0.88 * r} ${y - 0.88 * r + 0.32 * r} q0 ${-0.32 * r} ${0.32 * r} ${-0.32 * r} h${1.12 * r} q${0.32 * r} 0 ${0.32 * r} ${0.32 * r} v${1.12 * r} q0 ${0.32 * r} ${-0.32 * r} ${0.32 * r} h${-1.12 * r} q${-0.32 * r} 0 ${-0.32 * r} ${-0.32 * r} Z`
      break
    case 'forma-triangulo':
      d = pts([
        [0, -1.1],
        [1.05, 0.78],
        [-1.05, 0.78],
      ])
      break
    case 'forma-rombo':
      d = pts([
        [0, -1.12],
        [0.98, 0],
        [0, 1.12],
        [-0.98, 0],
      ])
      break
    case 'forma-hexagono':
      d = poligono(6, 1.02, 0)
      break
    case 'forma-estrella':
      d = pts(Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 5
        const rad = i % 2 === 0 ? 1.2 : 0.58
        return [rad * Math.cos(a), rad * Math.sin(a) + 0.08] as [number, number]
      }))
      break
    case 'forma-corazon':
      d = `M${x} ${y + 0.95 * r} C${x - 1.3 * r} ${y + 0.05 * r} ${x - 1.15 * r} ${y - 1.05 * r} ${x - 0.55 * r} ${y - 1.05 * r} C${x - 0.2 * r} ${y - 1.05 * r} ${x} ${y - 0.85 * r} ${x} ${y - 0.6 * r} C${x} ${y - 0.85 * r} ${x + 0.2 * r} ${y - 1.05 * r} ${x + 0.55 * r} ${y - 1.05 * r} C${x + 1.15 * r} ${y - 1.05 * r} ${x + 1.3 * r} ${y + 0.05 * r} ${x} ${y + 0.95 * r} Z`
      break
    case 'forma-nube': {
      // Borde de "nube": arcos hacia afuera entre puntos de un círculo.
      const n = 7
      const p = Array.from({ length: n }, (_, i) => {
        const a = (i * 2 * Math.PI) / n - Math.PI / 2
        return [x + 0.85 * r * Math.cos(a), y + 0.85 * r * Math.sin(a)]
      })
      const radio = 0.45 * r
      d = `M${p[0][0]} ${p[0][1]} ` + p.map((_, i) => `A${radio} ${radio} 0 0 1 ${p[(i + 1) % n][0]} ${p[(i + 1) % n][1]}`).join(' ') + ' Z'
      break
    }
    default:
      d = `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`
  }
  return <path d={d} {...props} />
}

interface PropsSegmento {
  x: number
  y: number
  r: number
  color: string
  indice: number
  apariencia: AparienciaCiempi
  className?: string
  /** La patita delantera de este segmento saluda (para la animación de la portada). */
  saluda?: boolean
}

/** Un segmento con sus dos patitas, su forma, su diseño y sus zapatos. */
export function Segmento({ x, y, r, color, indice, apariencia, className = '', saluda = false }: PropsSegmento) {
  const recorte = useId()
  const pata = (dx: number, par: boolean, extra = '') => (
    <g className={`ciempi-pata ${par ? 'par' : ''} ${extra}`}>
      <line x1={x + dx} y1={y + r * 0.6} x2={x + dx} y2={y + r + 9} stroke={CONTORNO} strokeWidth={2.5} strokeLinecap="round" />
      <Zapato x={x + dx} y={y + r + 10} pies={apariencia.pies} par={par} />
    </g>
  )
  return (
    <g className={className}>
      {pata(-r * 0.45, indice % 2 === 0)}
      {pata(r * 0.45, indice % 2 === 1, saluda ? 'pata-saludo' : '')}
      <defs>
        <clipPath id={recorte}>
          <FormaSegmento forma={apariencia.forma} x={x} y={y} r={r} />
        </clipPath>
      </defs>
      <FormaSegmento forma={apariencia.forma} x={x} y={y} r={r} fill={color} />
      {/* Diseño y brillo recortados dentro de la forma */}
      <g clipPath={`url(#${recorte})`}>
        <path d={`M${x - r} ${y - r * 0.45} Q${x - r * 0.65} ${y + r * 0.95} ${x + r} ${y + r * 0.2} V${y + r * 1.3} H${x - r * 1.3} V${y - r}Z`} fill={CONTORNO} opacity={0.14} />
        <Diseno x={x} y={y} r={r} diseno={apariencia.diseno} indice={indice} />
        <path d={`M${x - r * 0.66} ${y - r * 0.25} Q${x - r * 0.5} ${y - r * 0.72} ${x - r * 0.08} ${y - r * 0.7}`} stroke="#fff" strokeOpacity={0.55} strokeWidth={r * 0.16} strokeLinecap="round" fill="none" />
      </g>
      <FormaSegmento forma={apariencia.forma} x={x} y={y} r={r} fill="none" stroke={CONTORNO} strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  )
}

function Zapato({ x, y, pies, par }: { x: number; y: number; pies: string; par: boolean }) {
  const borde = { stroke: CONTORNO, strokeWidth: 1.2, strokeLinejoin: 'round' as const }
  switch (pies) {
    case 'pies-zapatillas':
      return (
        <g {...borde} transform={`translate(${x} ${y})`}>
          <path d="M-3.5 -4 L0 -4 L1.5 -2 Q5 -2 5.5 0.5 L5.5 2 L-4 2 L-4 -1Z" fill="#3a9fb1" />
          <path d="M-4 0.5 Q0 1.5 5.5 0.5 L5.5 2.5 L-4 2.5Z" fill="#fff8e8" strokeWidth={0.8} />
          <path d="M2 -1.5 Q5 -1.5 5 0.4 L1.5 0.4Z" fill="#fff8e8" strokeWidth={0.65} />
          <path d="M-1.8 -2.5 l2 0.5 M-2 -1 l2 0.5" stroke="#fff8e8" strokeWidth={0.9} strokeLinecap="round" />
        </g>
      )
    case 'pies-botas':
      return <rect x={x - 2.8} y={y - 4} width={6.5} height={6} rx={1.5} fill="#efc31d" {...borde} />
    case 'pies-brillantes':
      return (
        <g className="brillo">
          <path d={`M${x} ${y - 4} L${x + 1.3} ${y - 1.3} L${x + 4} ${y} L${x + 1.3} ${y + 1.3} L${x} ${y + 4} L${x - 1.3} ${y + 1.3} L${x - 4} ${y} L${x - 1.3} ${y - 1.3} Z`} fill="#efc31d" {...borde} strokeWidth={1} />
        </g>
      )
    case 'pies-patines':
      return (
        <g {...borde}>
          <path d={`M${x - 2.5} ${y - 4} h4 v2 h2 a1.5 1.5 0 0 1 1.5 1.5 v1.2 h-7.5 z`} fill="#8f6fcf" />
          <circle cx={x - 1.2} cy={y + 2.6} r={1.4} fill="#efc31d" />
          <circle cx={x + 3.2} cy={y + 2.6} r={1.4} fill="#efc31d" />
        </g>
      )
    case 'pies-payaso':
      return (
        <g {...borde}>
          <ellipse cx={x + 2.5} cy={y} rx={6} ry={3} fill="#ea6444" />
          <circle cx={x + 0.5} cy={y - 2.5} r={1.4} fill="#efc31d" />
        </g>
      )
    case 'pies-pantuflas':
      return (
        <g {...borde} strokeWidth={1}>
          <ellipse cx={x - 1.5} cy={y - 4.5} rx={1} ry={2.6} fill="#fff" transform={`rotate(-15 ${x - 1.5} ${y - 4.5})`} />
          <ellipse cx={x + 1.2} cy={y - 4.5} rx={1} ry={2.6} fill="#fff" transform={`rotate(15 ${x + 1.2} ${y - 4.5})`} />
          <ellipse cx={x + 1} cy={y} rx={4.6} ry={3} fill="#f6a5b8" />
        </g>
      )
    case 'pies-futbol':
      return (
        <g {...borde}>
          <path d={`M${x - 3} ${y - 2.5} h5 a2.5 2.5 0 0 1 2.5 2.5 v1 h-7.5 z`} fill="#36384f" />
          <path d={`M${x - 1} ${y - 2.3} l2 3`} stroke="#fff" strokeWidth={1.1} />
          <path d={`M${x - 2} ${y + 1.2} v1.4 M${x + 0.5} ${y + 1.2} v1.4 M${x + 3} ${y + 1.2} v1.4`} strokeWidth={1.1} />
        </g>
      )
    default:
      return <circle cx={x} cy={y} r={2.6} fill={par ? '#ea6444' : '#efc31d'} {...borde} />
  }
}

/** Dibujos sobre el cuerpo, en coordenadas de 10 unidades escaladas al segmento. */
function Diseno({ x, y, r, diseno, indice }: { x: number; y: number; r: number; diseno: string; indice: number }) {
  const en = (escala: number, dy = 0, giro = 0) => `translate(${x} ${y + dy * r}) scale(${(r * escala) / 10}) rotate(${giro})`
  const borde = { stroke: CONTORNO, strokeWidth: 1.3, strokeLinejoin: 'round' as const }
  switch (diseno) {
    case 'diseno-puntos':
      return (
        <g fill="#fff" fillOpacity={0.8}>
          <circle cx={x - r * 0.35} cy={y + r * 0.2} r={r * 0.14} />
          <circle cx={x + r * 0.3} cy={y - r * 0.05} r={r * 0.17} />
          <circle cx={x + r * 0.05} cy={y + r * 0.5} r={r * 0.11} />
        </g>
      )
    case 'diseno-rayas':
      return (
        <g stroke="#fff" strokeOpacity={0.6} strokeWidth={r * 0.22}>
          <line x1={x - r * 0.35} y1={y - r * 1.3} x2={x - r * 0.35} y2={y + r * 1.3} />
          <line x1={x + r * 0.35} y1={y - r * 1.3} x2={x + r * 0.35} y2={y + r * 1.3} />
        </g>
      )
    case 'diseno-estrellas':
      return <path transform={en(0.55, 0.08, indice * 17)} d="M0 -10 L2.9 -4 L9.5 -3.1 L4.7 1.5 L5.9 8.1 L0 5 L-5.9 8.1 L-4.7 1.5 L-9.5 -3.1 L-2.9 -4 Z" fill="#fff8d6" {...borde} />
    case 'diseno-corazones':
      return <path transform={en(0.5, 0.1)} d="M0 8 C-12 0 -10 -10 -4 -10 C-1 -10 0 -7 0 -6 C0 -7 1 -10 4 -10 C10 -10 12 0 0 8 Z" fill="#ea6444" {...borde} />
    case 'diseno-flores':
      return (
        <g transform={en(0.5, 0.05, indice * 25)}>
          {[0, 72, 144, 216, 288].map((g) => (
            <circle key={g} cx={5 * Math.cos((g * Math.PI) / 180)} cy={5 * Math.sin((g * Math.PI) / 180)} r={4} fill="#fff" {...borde} />
          ))}
          <circle r={3.2} fill="#efc31d" {...borde} />
        </g>
      )
    case 'diseno-huellitas':
      return (
        <g transform={en(0.5, 0.1, -15 + (indice % 2) * 30)} fill="#fff" fillOpacity={0.85}>
          <ellipse cx={0} cy={3} rx={5} ry={4} />
          <circle cx={-5.5} cy={-3} r={2.2} />
          <circle cx={-2} cy={-6.5} r={2.2} />
          <circle cx={2} cy={-6.5} r={2.2} />
          <circle cx={5.5} cy={-3} r={2.2} />
        </g>
      )
    case 'diseno-rayos':
      return <path transform={en(0.62, 0.02)} d="M2 -10 L-5 1 L0 1 L-2 10 L6 -2 L1 -2 Z" fill="#efc31d" {...borde} />
    case 'diseno-llamas':
      return (
        <g transform={en(0.85, 0.25)}>
          <path d="M0 9 C-6 9 -8 3 -5 -2 C-4 2 -2 2 -2 0 C-3 -5 0 -8 2 -10 C2 -6 7 -4 6 2 C6 6 3 9 0 9Z" fill="#ef9129" {...borde} />
          <path d="M0 8 C-3 8 -4 4 -2 1 C-1 3 1 2 1 0 C3 2 4 5 3 6.5 C2 8 1 8 0 8Z" fill="#efc31d" />
        </g>
      )
    case 'diseno-autos':
      return (
        <g transform={en(0.55, 0.12)} {...borde}>
          <path d="M-9 2 L-9 -1 Q-8 -3 -5 -3 L-3 -6.5 L3.5 -6.5 L5.5 -3 Q9 -3 9 0 L9 2 Z" fill="#ea6444" />
          <path d="M-2.3 -5.5 L-0.3 -5.5 L-0.3 -3 L-3.8 -3 Z M0.8 -5.5 L3 -5.5 L4.4 -3 L0.8 -3 Z" fill="#c6e3f3" strokeWidth={0.8} />
          <circle cx={-5} cy={2.5} r={2.3} fill="#36384f" />
          <circle cx={5} cy={2.5} r={2.3} fill="#36384f" />
        </g>
      )
    default:
      return null
  }
}

// ── Comida (lo que Ciempi se come en la pista) ────────────────────────────

/** Una comida centrada en (x, y); `tamano` es su radio aproximado. */
export function Comida({ comida, x, y, tamano }: { comida: string; x: number; y: number; tamano: number }) {
  const borde = { stroke: CONTORNO, strokeWidth: 1.6, strokeLinejoin: 'round' as const }
  const dibujo = (() => {
    switch (comida) {
      case 'comida-frutilla':
        return (
          <>
            <path d="M0 10 C-9 5 -10 -4 -6 -7 C-3 -9 0 -7 0 -7 C0 -7 3 -9 6 -7 C10 -4 9 5 0 10Z" fill="#ea6444" {...borde} />
            {[[-4, -2], [3, -3], [0, 2], [-3, 5], [4, 3]].map(([sx, sy], i) => (
              <ellipse key={i} cx={sx} cy={sy} rx={0.8} ry={1.1} fill="#fff3b0" />
            ))}
            <path d="M0 -7 L-5 -10 L-2 -7.5 L-3 -12 L0 -8.5 L3 -12 L2 -7.5 L5 -10 Z" fill="#62954c" {...borde} strokeWidth={1.1} />
          </>
        )
      case 'comida-platano':
        return (
          <>
            <path d="M-10 -3 C-7 9 7 10 11 -4 C6 3 -4 4 -10 -3Z" fill="#efc31d" {...borde} />
            <path d="M-8 -1 C-4 4 4 5 8 0" stroke="#c98a2e" strokeWidth={1} fill="none" />
            <path d="M11 -4 L12.5 -6.5" stroke="#6b4a2b" strokeWidth={2.4} strokeLinecap="round" />
          </>
        )
      case 'comida-sandia':
        return (
          <>
            <path d="M-11 -3 A11 11 0 0 0 11 -3 Z" fill="#62954c" {...borde} />
            <path d="M-8.8 -3 A8.8 8.8 0 0 0 8.8 -3 Z" fill="#ea6444" />
            {[[-4, 0], [0, 2.5], [4, 0]].map(([sx, sy], i) => (
              <ellipse key={i} cx={sx} cy={sy} rx={0.9} ry={1.4} fill="#223d5d" />
            ))}
          </>
        )
      case 'comida-galleta':
        return (
          <>
            <circle r={9.5} fill="#d9a066" {...borde} />
            {[[-4, -3], [3, -4], [-1, 3], [5, 3], [-5, 4]].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={1.5} fill="#6b4a2b" />
            ))}
          </>
        )
      case 'comida-dona':
        return (
          <>
            <circle r={9.5} fill="#d9a066" {...borde} />
            <path d="M-8.5 -2 C-8 -8 8 -9 8.8 -1 C8 4 4 2 2 5 C-1 7 -4 3 -8.5 -2Z" fill="#f6a5b8" />
            <circle r={3} fill="#fdf8ee" {...borde} />
            {[[-5, -4, 30], [4, -5, -20], [6, 0, 60], [-2, -7, 80]].map(([cx, cy, g], i) => (
              <rect key={i} x={cx - 1.2} y={cy - 0.4} width={2.4} height={0.8} rx={0.4} fill={['#3a9fb1', '#efc31d', '#8eb743', '#fff'][i]} transform={`rotate(${g} ${cx} ${cy})`} />
            ))}
          </>
        )
      case 'comida-cupcake':
        return (
          <>
            <path d="M-7 1 L-5 10 L5 10 L7 1 Z" fill="#3a9fb1" {...borde} />
            <path d="M-3 2 L-2.4 9.5 M0 2 V9.5 M3 2 L2.4 9.5" stroke="#223d5d" strokeOpacity={0.35} strokeWidth={1} />
            <path d="M-8.5 2 C-10 -3 -5 -6 -2 -5 C-1 -9 4 -9 5 -5 C9 -5 10 0 8.5 2 Z" fill="#f6a5b8" {...borde} />
            <circle cx={1} cy={-8.5} r={2.3} fill="#ea6444" {...borde} strokeWidth={1.1} />
          </>
        )
      case 'comida-pizza':
        return (
          <>
            <path d="M-9 -7 Q0 -11 9 -7 L0 11 Z" fill="#efc31d" {...borde} />
            <path d="M-9 -7 Q0 -11 9 -7 L8 -5 Q0 -9 -8 -5 Z" fill="#d9a066" {...borde} strokeWidth={1.1} />
            <circle cx={-2.5} cy={-2} r={2} fill="#ea6444" />
            <circle cx={2.5} cy={-1} r={1.8} fill="#ea6444" />
            <circle cx={0} cy={4} r={1.6} fill="#ea6444" />
          </>
        )
      case 'comida-helado':
        return (
          <>
            <path d="M-5.5 0 L0 11 L5.5 0 Z" fill="#d9a066" {...borde} />
            <path d="M-3.5 2 L2 8 M3.5 2 L-1 9" stroke="#b07a45" strokeWidth={0.9} />
            <circle cx={-2.5} cy={-3} r={4.5} fill="#f6a5b8" {...borde} />
            <circle cx={2.8} cy={-3.5} r={4.3} fill="#c6e3f3" {...borde} />
            <circle cx={0} cy={-7.5} r={4} fill="#fdf8ee" {...borde} />
          </>
        )
      case 'comida-pelota':
        return (
          <>
            <circle r={9.5} fill="#fff" {...borde} />
            <path d="M0 -9.5 A9.5 9.5 0 0 1 9.5 0 L0 0 Z" fill="#ea6444" />
            <path d="M0 9.5 A9.5 9.5 0 0 1 -9.5 0 L0 0 Z" fill="#3a9fb1" />
            <path d="M-9.5 0 A9.5 9.5 0 0 1 0 -9.5 L0 0 Z" fill="#efc31d" />
            <circle r={9.5} fill="none" {...borde} />
            <circle r={1.8} fill="#fff" {...borde} strokeWidth={1} />
          </>
        )
      default: // manzana
        return (
          <>
            <path d="M0 -8 Q1 -11 3 -12" fill="none" stroke="#6b4a2b" strokeWidth={2} strokeLinecap="round" />
            <path d="M1 -9 Q7 -14 10 -8 Q5 -6 1 -9Z" fill="#8eb743" {...borde} strokeWidth={1.2} />
            <path d="M0 -4 C-4 -8 -11 -6 -11 2 C-11 10 -5 15 0 13 C5 15 11 10 11 2 C11 -6 4 -8 0 -4Z" fill="#ea6444" {...borde} />
            <ellipse cx={-5} cy={0} rx={2.2} ry={3.2} fill="#fff" opacity={0.5} transform="rotate(-20 -5 0)" />
          </>
        )
    }
  })()
  return <g transform={`translate(${x} ${y}) scale(${tamano / 10})`}>{dibujo}</g>
}

// ── Fondos temáticos ───────────────────────────────────────────────────────

/** Escena de fondo (llena el contenedor, recortando lo que sobre). */
export function FondoTema({ fondo, className = '' }: { fondo: string; className?: string }) {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" className={`absolute inset-0 h-full w-full ${className}`} aria-hidden>
      <Escena fondo={fondo} />
    </svg>
  )
}

function Escena({ fondo }: { fondo: string }) {
  const id = useId()
  const degradado = (arriba: string, abajo: string) => (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={arriba} />
        <stop offset="1" stopColor={abajo} />
      </linearGradient>
    </defs>
  )
  const cielo = <rect width={400} height={200} fill={`url(#${id})`} />
  switch (fondo) {
    case 'fondo-mar':
      return (
        <>
          {degradado('#9fd7e3', '#247586')}
          {cielo}
          <path d="M0 60 Q25 52 50 60 T100 60 T150 60 T200 60 T250 60 T300 60 T350 60 T400 60 V0 H0Z" fill="#c6e3f3" />
          {[[40, 120, 5], [60, 95, 3], [330, 110, 6], [350, 80, 3.5], [200, 140, 4]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={1.5} />
          ))}
          <path d="M0 175 Q100 160 200 172 T400 168 V200 H0Z" fill="#f3ead8" />
          <path d="M70 175 q-6 -18 0 -30 q6 12 0 30 M78 175 q8 -14 4 -26" stroke="#62954c" strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d="M320 172 l10 -8 l10 8 l-10 6z" fill="#ef9129" />
        </>
      )
    case 'fondo-selva':
      return (
        <>
          {degradado('#d6ecc1', '#8eb743')}
          {cielo}
          {[[0, 0, 1], [400, 0, -1]].map(([x, y, d], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${d} 1)`} fill="#62954c">
              <path d="M0 10 Q60 20 70 70 Q30 50 0 60Z" />
              <path d="M0 70 Q50 80 55 130 Q20 110 0 120Z" fill="#4f7d3c" />
            </g>
          ))}
          <path d="M120 0 Q125 40 115 70 M280 0 Q275 30 288 55" stroke="#4f7d3c" strokeWidth={3} fill="none" />
          <path d="M0 180 Q200 160 400 180 V200 H0Z" fill="#62954c" />
          <circle cx={300} cy={150} r={6} fill="#ea6444" />
          <circle cx={90} cy={160} r={5} fill="#efc31d" />
        </>
      )
    case 'fondo-dulces':
      return (
        <>
          {degradado('#fde3ef', '#f6a5b8')}
          {cielo}
          {[[60, 50], [330, 40], [210, 30]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <circle r={14} fill="#fff" />
              <path d="M-14 0 A14 14 0 0 1 14 0" fill="#ea6444" />
              <path d="M0 14 V55" stroke="#fff" strokeWidth={3} />
            </g>
          ))}
          <path d="M0 178 Q50 165 100 178 T200 178 T300 178 T400 178 V200 H0Z" fill="#fff" />
          {[30, 120, 260, 370].map((x, i) => (
            <circle key={i} cx={x} cy={188} r={4} fill={['#3a9fb1', '#efc31d', '#8f6fcf', '#8eb743'][i]} />
          ))}
        </>
      )
    case 'fondo-nieve':
      return (
        <>
          {degradado('#eaf6fb', '#c6e3f3')}
          {cielo}
          <path d="M40 170 L120 70 L200 170Z" fill="#fff" />
          <path d="M180 170 L280 50 L380 170Z" fill="#f4fbff" />
          <path d="M100 95 L120 70 L140 95 L130 90 L120 98 L110 90Z M258 76 L280 50 L302 76 L290 70 L280 80 L270 70Z" fill="#c6e3f3" />
          <path d="M0 170 Q200 155 400 170 V200 H0Z" fill="#fff" />
          {[[30, 30], [90, 50], [170, 25], [240, 40], [340, 28], [370, 90], [20, 110]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.5} fill="#fff" />
          ))}
        </>
      )
    case 'fondo-espacio':
      return (
        <>
          {degradado('#1b2440', '#36384f')}
          {cielo}
          {[[20, 20], [70, 60], [130, 25], [180, 80], [240, 15], [300, 55], [370, 30], [50, 140], [350, 130], [160, 150], [270, 120]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2 : 1.2} fill="#fff" opacity={0.9} />
          ))}
          <circle cx={330} cy={60} r={22} fill="#ef9129" />
          <ellipse cx={330} cy={60} rx={36} ry={7} fill="none" stroke="#efc31d" strokeWidth={3} transform="rotate(-15 330 60)" />
          <circle cx={60} cy={45} r={12} fill="#c6e3f3" />
          <circle cx={55} cy={42} r={2.5} fill="#9fb6c4" />
          <path d="M0 180 Q200 165 400 182 V200 H0Z" fill="#5d6b80" />
        </>
      )
    default: // jardín
      return (
        <>
          {degradado('#c6e3f3', '#eaf6fb')}
          {cielo}
          <circle cx={340} cy={40} r={20} fill="#efc31d" />
          <ellipse cx={90} cy={45} rx={30} ry={11} fill="#fff" />
          <ellipse cx={115} cy={38} rx={18} ry={10} fill="#fff" />
          <path d="M0 165 Q100 145 200 162 T400 158 V200 H0Z" fill="#a9c670" />
          {[[40, 170, '#ea6444'], [150, 175, '#f6a5b8'], [260, 168, '#efc31d'], [360, 176, '#8f6fcf']].map(([x, y, c], i) => (
            <g key={i}>
              <path d={`M${x} ${y} v12`} stroke="#62954c" strokeWidth={2} />
              <circle cx={x as number} cy={y as number} r={4.5} fill={c as string} />
            </g>
          ))}
        </>
      )
  }
}
