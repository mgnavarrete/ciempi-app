import { CiempiVivo, type EventoCiempi } from '../ciempi/v2/CiempiVivo'
import { useEscenaCreciente } from '../ciempi/v2/Vestuario'
import { COMER, type BocaComer } from '../ciempi/v2/animacion/animaciones.js'
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { AparienciaCiempi } from '../ciempi/catalogo'
import { APARIENCIA_CLASICA, paletaDe } from '../ciempi/clasico'
import { Cabeza, Comida, Segmento } from '../ciempi/dibujos'
import type { Fase, Pista } from './motor'

const ALTO = 84
const CENTRO_Y = 44

/**
 * Crecimiento sin recomponer: la escena se compone una vez con tantos segmentos
 * como manzanas tiene la pista y cada unidad leída solo muestra uno más
 * (docs/expansion-ciempi/animacion/RESULTADOS.md). `false` vuelve a recomponer
 * la escena con cada unidad, como hasta 2.4.1.
 */
export const CRECIMIENTO_REVELAR = true
/** E08 Comer al leer cada unidad: EXPERIMENTAL, apagado en el juego (solo laboratorio y demo). */
export const COMER_ANIMADO = false
/** Boca de E08 (AD-018): sorprendida por omisión; 'carcajada' (versión 1) se conserva para comparar en el laboratorio. */
export const BOCA_COMER: BocaComer = 'sorprendido'

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
  /** La frase paga: la última comida se reemplaza por la moneda que se gana al terminarla. */
  moneda?: boolean
  /** 'recomponer': la escena se recompone con cada unidad (camino anterior, para comparar). */
  crecimiento?: 'revelar' | 'recomponer'
  /** E08 Comer (experimental): la fruta salta a su boca y se la come. */
  comerAnimado?: boolean
  /** Variante de boca de E08 (laboratorio): 'sorprendido' (por omisión) o 'carcajada'. */
  bocaComer?: BocaComer
}

/**
 * Ciempi camina justo debajo de la frase: la cabeza va donde está el dedo y
 * cada palabra tiene su comida (manzana, frutilla…) debajo de su comienzo.
 * Cuando la cabeza llega a una, la palabra se enciende y suena, Ciempi se la
 * come y le crece un segmento.
 */
export function Ciempi({ pista, palabrasLeidas, progreso, fase, tranquilo, apariencia, soloUltima = false, moneda = false, crecimiento = CRECIMIENTO_REVELAR ? 'revelar' : 'recomponer', comerAnimado = COMER_ANIMADO, bocaComer = BOCA_COMER }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const [ancho, setAncho] = useState(320)
  const caminando = useCaminando(progreso)
  const vivo = useEscenaCreciente(apariencia, palabrasLeidas, crecimiento === 'revelar' ? pista.manzanas.length : null)
  const nuevo = vivo?.escena ?? null
  const idComida = useId().replace(/[^\w-]/g, '') + '-comida'
  const dibujos = useMemo(() => (comerAnimado ? { comida: `<use href="#${idComida}"/>` } : undefined), [comerAnimado, idComida])
  // Ciempi nuevo: tropieza (E04) al ir muy rápido y celebra (A03) al terminar la frase.
  const [evento, setEvento] = useState<EventoCiempi | null>(null)
  const eventos = useRef(0)
  useEffect(() => {
    if (fase === 'tropiezo') setEvento({ id: 'E04', n: ++eventos.current })
    else if (fase === 'completada') setEvento({ id: 'A03', n: ++eventos.current })
  }, [fase])

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
  const escalaNueva = vivo ? Math.min(R / 130, Math.max(0.015, (xCabeza - 2) / (736 - vivo.left))) : 1

  // El cuerpo va compacto detrás de la cabeza: un segmento por palabra leída.
  const separacionIdeal = r * 1.45
  const espacioCuerpo = xCabeza - R * 0.8 - r
  const separacion = palabrasLeidas > 1 ? Math.min(separacionIdeal, espacioCuerpo / (palabrasLeidas - 1)) : separacionIdeal
  const xSegmento = (i: number) => xCabeza - R * 0.8 - (palabrasLeidas - 1 - i) * separacion

  // La comida de cada palabra que falta, en su lugar del camino.
  const tamanoManzana = Math.min(14, Math.max(10, r * 0.85))
  // Memorizada: al mover el dedo (cada cuadro) no se vuelven a dibujar las comidas.
  // Si la frase paga, la última comida es la moneda (en su lugar y de su tamaño, sin la fruta).
  const ultima = pista.manzanas.length - 1
  const comidas = useMemo(
    () =>
      pista.manzanas
        .map((x, i) => ({ i, x: x * ancho }))
        .filter(({ i }) => i >= palabrasLeidas && (!soloUltima || i === ultima))
        .map(({ i, x }) =>
          moneda && i === ultima ? (
            <MonedaEnPista key={`m${i}`} x={x} y={CENTRO_Y + 2} tamano={tamanoManzana} tranquilo={tranquilo} />
          ) : (
            <Comida key={`m${i}`} comida={apariencia.comida} x={x} y={CENTRO_Y + 2} tamano={tamanoManzana} />
          ),
        ),
    [pista.manzanas, ancho, palabrasLeidas, soloUltima, ultima, moneda, tranquilo, apariencia.comida, tamanoManzana],
  )

  // E08 Comer: cuenta solo las frutas que se veían (con `soloUltima`, la última).
  // La fruta reaparece delante de la boca, a la altura de la pista (unidades de la base).
  const frutasComidas = soloUltima ? (palabrasLeidas >= pista.manzanas.length ? 1 : 0) : palabrasLeidas
  const xFruta = (pista.manzanas[palabrasLeidas - 1] ?? 0) * ancho
  const comer = comerAnimado && nuevo
    ? { n: frutasComidas, boca: bocaComer, origen: [Math.max(COMER.origen[0], 736 + (xFruta - xCabeza) / escalaNueva), 340 + 6 / escalaNueva] as [number, number] }
    : null

  // Mientras carga el nuevo Ciempi se dibuja el clásico (con la comida del niño).
  const clasica = { ...APARIENCIA_CLASICA, comida: apariencia.comida }
  const colores = paletaDe(clasica).cuerpo

  const clases = [
    caminando && fase === 'arrastrando' ? 'caminando' : '',
    fase === 'arrastrando' ? 'arrastrando' : '',
    fase === 'tropiezo' ? 'tropiezo' : '',
    // El saltito del clásico; el nuevo celebra con su propia animación.
    fase === 'completada' && !nuevo ? 'feliz' : '',
    tranquilo ? 'tranquilo' : '',
  ].join(' ')

  return (
    <div ref={contenedor} className="w-full" aria-hidden>
      <svg width={ancho} height={ALTO} viewBox={`0 0 ${ancho} ${ALTO}`} className={`overflow-visible ${clases}`}>
        {comidas}
        {comerAnimado && nuevo && (
          <defs>
            <g id={idComida}>
              <Comida comida={apariencia.comida} x={0} y={0} tamano={tamanoManzana / escalaNueva} />
            </g>
          </defs>
        )}

        {!nuevo && Array.from({ length: palabrasLeidas }, (_, i) => (
          <Segmento
            key={i}
            x={xSegmento(i)}
            y={CENTRO_Y}
            r={r}
            indice={i}
            color={colores[i % colores.length]}
            apariencia={clasica}
            className={`segmento-nuevo ${tranquilo ? 'tranquilo' : ''}`}
          />
        ))}

        {!nuevo && <g className="ciempi-cabeza" style={{ transform: `translate(${xCabeza}px, ${CENTRO_Y - 4}px)` }}>
          <g className="ciempi-cara" style={{ transform: `scale(${R / 20})` }}>
            <Cabeza apariencia={clasica} />
          </g>
          {fase === 'tropiezo' && (
            <text x={0} y={-R - 10} textAnchor="middle" fontSize={20} className="aparecer">
              💫
            </text>
          )}
        </g>}
        {nuevo && <g data-ciempi="v2" data-segments={palabrasLeidas} transform={`translate(${xCabeza} ${CENTRO_Y-4}) scale(${escalaNueva}) translate(-736 -340)`}>
          <CiempiVivo escena={nuevo} segmentos={palabrasLeidas} base={caminando && fase === 'arrastrando' ? 'A02' : 'A01'} evento={evento} tranquilo={tranquilo} comer={comer} dibujos={dibujos} />
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

/**
 * La moneda que se gana al terminar la frase, en lugar de la última comida y
 * de su mismo tamaño visual (las imágenes de comida miden 2,7 × `tamano` con
 * su margen; la fruta se ve de unos 2,3 × `tamano`).
 */
function MonedaEnPista({ x, y, tamano, tranquilo }: { x: number; y: number; tamano: number; tranquilo?: boolean }) {
  const r = tamano * 1.15
  return (
    <g data-moneda-meta className={tranquilo ? '' : 'moneda-meta'} transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#ffd137" stroke="#243e5b" strokeWidth={1.8} />
      <circle r={r * 0.62} fill="none" stroke="#f0b32b" strokeWidth={1.6} />
      <path d={`M${-r * 0.45} ${-r * 0.35} q${r * 0.2} ${-r * 0.3} ${r * 0.5} ${-r * 0.3}`} fill="none" stroke="#fff6c4" strokeWidth={1.6} strokeLinecap="round" />
    </g>
  )
}
