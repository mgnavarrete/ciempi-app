import { useEscena } from '../ciempi/v2/Vestuario'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { paletaDe, type AparienciaCiempi } from '../ciempi/catalogo'
import { Cabeza, Comida, Segmento } from '../ciempi/dibujos'
import type { Fase, Pista } from './motor'

const ALTO = 84
const CENTRO_Y = 44

interface Props {
  /** Dónde está la comida de cada palabra (justo debajo de la palabra). */
  pista: Pista
  /** Palabras ya leídas (encendidas y dichas). */
  palabrasLeidas: number
  progreso: number
  fase: Fase
  tranquilo: boolean
  /** Colores, gorro, zapatos… que eligió el niño. */
  apariencia: AparienciaCiempi
  /** Solo se dibuja la comida del final (niveles 2 y 3): las palabras igual cuentan. */
  soloUltima?: boolean
}

/**
 * Ciempi camina justo debajo de la frase: la cabeza va donde está el dedo y
 * cada palabra tiene su comida (manzana, frutilla…) debajo de su comienzo.
 * Cuando la cabeza llega a una, la palabra se enciende y suena, Ciempi se la
 * come y le crece un segmento.
 */
export function Ciempi({ pista, palabrasLeidas, progreso, fase, tranquilo, apariencia, soloUltima = false }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const [ancho, setAncho] = useState(320)
  const caminando = useCaminando(progreso)
  const nuevo = useEscena(apariencia, palabrasLeidas)

  useLayoutEffect(() => {
    const el = contenedor.current
    if (!el) return
    const medir = () => setAncho(el.clientWidth)
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const total = Math.max(1, pista.manzanas.length)
  const r = Math.max(9, Math.min(18, ancho / (total * 1.6 + 4)))
  const R = Math.max(17, r * 1.3)
  const xCabeza = Math.max(R, Math.min(ancho - R, progreso * ancho))

  // Escala uniforme: conserva las piezas y evita recortar cuerpos largos en móvil.
  const escalaNueva = nuevo ? Math.min(R / 130, Math.max(0.015, (xCabeza - 2) / (736 - nuevo.left))) : 1

  // El cuerpo va compacto detrás de la cabeza: un segmento por palabra leída.
  const separacionIdeal = r * 1.45
  const espacioCuerpo = xCabeza - R * 0.8 - r
  const separacion = palabrasLeidas > 1 ? Math.min(separacionIdeal, espacioCuerpo / (palabrasLeidas - 1)) : separacionIdeal
  const xSegmento = (i: number) => xCabeza - R * 0.8 - (palabrasLeidas - 1 - i) * separacion

  // La comida de cada palabra que falta, en su lugar del camino.
  const tamanoManzana = Math.min(14, Math.max(10, r * 0.85))
  const manzanas = pista.manzanas.map((x, i) => ({ i, x: x * ancho })).filter(({ i }) => i >= palabrasLeidas && (!soloUltima || i === pista.manzanas.length - 1))

  const colores = paletaDe(apariencia).cuerpo

  const clases = [
    caminando && fase === 'arrastrando' ? 'caminando' : '',
    fase === 'arrastrando' ? 'arrastrando' : '',
    fase === 'tropiezo' ? 'tropiezo' : '',
    fase === 'completada' ? 'feliz' : '',
    tranquilo ? 'tranquilo' : '',
  ].join(' ')

  return (
    <div ref={contenedor} className="w-full" aria-hidden>
      <svg width={ancho} height={ALTO} viewBox={`0 0 ${ancho} ${ALTO}`} className={`overflow-visible ${clases}`}>
        {manzanas.map(({ i, x }) => (
          <Comida key={`m${i}`} comida={apariencia.comida} x={x} y={CENTRO_Y + 2} tamano={tamanoManzana} />
        ))}

        {!nuevo && Array.from({ length: palabrasLeidas }, (_, i) => (
          <Segmento
            key={i}
            x={xSegmento(i)}
            y={CENTRO_Y}
            r={r}
            indice={i}
            color={colores[i % colores.length]}
            apariencia={apariencia}
            className={`segmento-nuevo ${tranquilo ? 'tranquilo' : ''}`}
          />
        ))}

        {!nuevo && <g className="ciempi-cabeza" style={{ transform: `translate(${xCabeza}px, ${CENTRO_Y - 4}px)` }}>
          <g className="ciempi-cara" style={{ transform: `scale(${R / 20})` }}>
            <Cabeza apariencia={apariencia} />
          </g>
          {fase === 'tropiezo' && (
            <text x={0} y={-R - 10} textAnchor="middle" fontSize={20} className="aparecer">
              💫
            </text>
          )}
        </g>}
        {nuevo && <g data-ciempi="v2" data-segments={palabrasLeidas} transform={`translate(${xCabeza} ${CENTRO_Y-4}) scale(${escalaNueva}) translate(-736 -340)`}>
          <g className={tranquilo?'':'ciempi-v2-marcha'} dangerouslySetInnerHTML={{__html:nuevo.html}}/>
          {fase==='tropiezo'&&<text x="736" y="100" textAnchor="middle" fontSize="90">💫</text>}
        </g>}
      </svg>
    </div>
  )
}

/** true mientras el progreso cambió hace poco (para mover las patitas). */
function useCaminando(progreso: number) {
  const [caminando, setCaminando] = useState(false)
  const previo = useRef(progreso)
  useEffect(() => {
    if (progreso === previo.current) return
    previo.current = progreso
    setCaminando(true)
    const t = setTimeout(() => setCaminando(false), 260)
    return () => clearTimeout(t)
  }, [progreso])
  return caminando
}
