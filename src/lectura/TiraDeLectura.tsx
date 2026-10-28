import { forwardRef, memo, useLayoutEffect, useRef, useState } from 'react'
import type { AparienciaCiempi } from '../ciempi/catalogo'
import type { PalabraSilabeada } from '../lenguaje/silabas'
import { Ciempi } from './Ciempi'
import { colorDePalabra } from './colores'
import { pistaDesdePalabras, type Entrada, type EstadoMotor, type Pista } from './motor'
import { PistaDeslizador } from './PistaDeslizador'

interface Props {
  palabras: PalabraSilabeada[]
  motor: EstadoMotor
  pista: Pista
  /** Entrega dónde quedó cada palabra en pantalla (para poner la comida debajo). */
  alMedir: (pista: Pista) => void
  tamanoLetra: number
  tranquilo: boolean
  apariencia: AparienciaCiempi
  alEntrar: (entrada: Entrada) => void
  /** Tocar una palabra (sin deslizar): la app la dice. */
  alTocarPalabra?: (indice: number) => void
  /** Solo la comida del final de la línea (nivel 2). */
  soloUltimaManzana?: boolean
  /**
   * Nivel 0: cada sílaba es una unidad, con su manzana (el motor las cuenta
   * como palabras). Las sílabas de una palabra van separadas por un guion.
   */
  porSilaba?: boolean
}

/** Espacio a la izquierda para la cabeza de Ciempi: la primera palabra parte a su lado. */
const MARGEN_IZQ = '3.6rem'
const MARGEN_DER = '1rem'
const ESTILO_LINEA = { letterSpacing: '0.04em', columnGap: '0.6em' }
const LETRA_MINIMA = 16

/**
 * La frase en una sola línea, con las palabras repartidas de punta a punta
 * (mismo espacio entre ellas), y justo debajo el carril de Ciempi con la comida bajo cada
 * palabra. El niño desliza el dedo por debajo de las palabras (como cuando
 * se lee siguiendo con el dedo) y Ciempi lo sigue.
 */
export function TiraDeLectura({ palabras, motor, pista, alMedir, tamanoLetra, tranquilo, apariencia, alEntrar, alTocarPalabra, soloUltimaManzana, porSilaba = false }: Props) {
  const zona = useRef<HTMLDivElement>(null)
  const linea = useRef<HTMLParagraphElement>(null)
  const medidor = useRef<HTMLSpanElement>(null)
  const [letra, setLetra] = useState(tamanoLetra)
  const alMedirRef = useRef(alMedir)
  alMedirRef.current = alMedir

  // 1) Tamaño de letra para que la frase quepa en una línea con un espacio
  //    mínimo entre palabras (sin pasar del ajuste del niño). Lo que sobra se
  //    reparte parejo entre las palabras, de punta a punta.
  useLayoutEffect(() => {
    const ajustar = () => {
      const l = linea.current
      const m = medidor.current
      if (!l || !m) return
      const estilo = getComputedStyle(l)
      const disponible = l.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight)
      const natural = m.scrollWidth
      if (natural > 0) setLetra(Math.max(LETRA_MINIMA, Math.min(tamanoLetra, Math.floor((tamanoLetra * disponible) / natural))))
    }
    ajustar()
    const obs = new ResizeObserver(ajustar)
    if (linea.current) obs.observe(linea.current)
    void document.fonts?.ready.then(ajustar)
    return () => obs.disconnect()
  }, [palabras, tamanoLetra, porSilaba])

  // 2) Dónde quedó cada palabra, en proporción al ancho de la zona del dedo.
  useLayoutEffect(() => {
    const medir = () => {
      const z = zona.current
      if (!z) return
      const caja = z.getBoundingClientRect()
      if (caja.width === 0) return
      const posiciones = [...z.querySelectorAll<HTMLElement>('[data-palabra]')].map((el) => {
        const r = el.getBoundingClientRect()
        return { inicio: (r.left - caja.left) / caja.width, fin: (r.right - caja.left) / caja.width }
      })
      alMedirRef.current(pistaDesdePalabras(posiciones))
    }
    medir()
    const obs = new ResizeObserver(medir)
    if (zona.current) obs.observe(zona.current)
    return () => obs.disconnect()
  }, [palabras, letra, porSilaba])

  const esperando = motor.fase === 'esperando'

  return (
    <PistaDeslizador ref={zona} alEntrar={alEntrar} className="w-full select-none">
      {/* Medidor invisible: el ancho natural de cada palabra con la letra del ajuste */}
      <span ref={medidor} aria-hidden className="font-lectura invisible absolute left-0 top-0 flex whitespace-nowrap" style={{ ...ESTILO_LINEA, fontSize: tamanoLetra }}>
        {palabras.map((p, i) => (
          <span key={i}>{porSilaba ? p.silabas.join('-') : p.texto}</span>
        ))}
      </span>

      <FraseEncendida
        ref={linea}
        palabras={palabras}
        leidas={motor.palabrasLeidas}
        porSilaba={porSilaba}
        letra={letra}
        tranquilo={tranquilo}
        alTocarPalabra={alTocarPalabra}
      />

      {/* Carril de Ciempi, justo debajo de las palabras: aquí va el dedo */}
      <div className="relative mt-1 rounded-[2rem] border-2 border-[#e2d6bf] bg-arena/70 pt-1">
        <Ciempi pista={pista} palabrasLeidas={motor.palabrasLeidas} progreso={motor.progreso} fase={motor.fase} tranquilo={tranquilo} apariencia={apariencia} soloUltima={soloUltimaManzana} />
        {esperando && motor.progreso === 0 && (
          <span className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-0.5 text-sm text-tinta-suave">
            <span className="pointer-fine:hidden">Pon el dedo en Ciempi y desliza →</span>
            <span className="hidden pointer-fine:inline">Arrastra a Ciempi con el mouse →</span>
          </span>
        )}
      </div>
    </PistaDeslizador>
  )
}

interface PropsFrase {
  palabras: PalabraSilabeada[]
  /** Unidades ya leídas: palabras o, con `porSilaba`, sílabas. */
  leidas: number
  porSilaba: boolean
  letra: number
  tranquilo: boolean
  alTocarPalabra?: (indice: number) => void
}

/**
 * La frase con las palabras (o sílabas) ya leídas encendidas. Solo se vuelve
 * a dibujar cuando se enciende una, no con cada movimiento del dedo.
 */
const FraseEncendida = memo(
  forwardRef<HTMLParagraphElement, PropsFrase>(function FraseEncendida({ palabras, leidas, porSilaba, letra, tranquilo, alTocarPalabra }, ref) {
    let antes = 0
    return (
      <p
        ref={ref}
        aria-label={palabras.map((p) => p.texto).join(' ')}
        // Palabras de punta a punta con el mismo espacio entre ellas (una sola: al centro).
        className={`font-lectura flex whitespace-nowrap leading-tight text-tinta ${palabras.length > 1 ? 'justify-between' : 'justify-center'}`}
        style={{ ...ESTILO_LINEA, fontSize: letra, paddingLeft: MARGEN_IZQ, paddingRight: MARGEN_DER }}
      >
        {palabras.map((palabra, p) => {
          const desde = antes
          antes += porSilaba ? palabra.silabas.length : 1
          // Tocar la palabra la dice; no empieza a deslizar (eso es en el carril de Ciempi).
          const tocar = (e: React.PointerEvent) => {
            if (!alTocarPalabra) return
            e.stopPropagation()
            alTocarPalabra(p)
          }
          if (!porSilaba) return <PalabraEncendida key={p} palabra={palabra} indice={p} encendida={desde < leidas} tranquilo={tranquilo} medir onPointerDown={tocar} />
          return (
            <span key={p} aria-hidden onPointerDown={tocar} className="inline-flex items-baseline">
              {palabra.silabas.map((silaba, s) => {
                const color = colorDePalabra(p)
                const encendida = desde + s < leidas
                return (
                  <span key={s} className="inline-flex items-baseline">
                    {s > 0 && <span className="px-[0.06em] text-tinta-suave/50">-</span>}
                    <span
                      data-palabra
                      className={[
                        'palabra inline-block rounded-[0.22em] transition-colors duration-200',
                        encendida ? `encendida ${color.texto} ${s % 2 === 0 ? color.fondo : color.fondoAlterno}` : '',
                        tranquilo ? 'tranquilo' : '',
                      ].join(' ')}
                    >
                      {silaba}
                    </span>
                  </span>
                )
              })}
            </span>
          )
        })}
      </p>
    )
  }),
)

/** Una palabra: encendida, sus sílabas con dos tonos del color de la palabra. */
export function PalabraEncendida({
  palabra,
  indice,
  encendida,
  tranquilo,
  medir = false,
  actual = false,
  onPointerDown,
}: {
  palabra: PalabraSilabeada
  indice: number
  encendida: boolean
  tranquilo: boolean
  /** Marca la palabra para medir dónde quedó (la manzana va debajo). */
  medir?: boolean
  /** La que sigue: subrayada suave, para que el ojo sepa por dónde va. */
  actual?: boolean
  onPointerDown?: (e: React.PointerEvent) => void
}) {
  const color = colorDePalabra(indice)
  return (
    <span
      data-palabra={medir || undefined}
      aria-hidden
      onPointerDown={onPointerDown}
      className={[
        'palabra inline-flex rounded-[0.22em]',
        encendida ? `encendida ${color.texto}` : '',
        actual ? 'underline decoration-amarillo decoration-[0.12em] underline-offset-[0.2em]' : '',
        tranquilo ? 'tranquilo' : '',
      ].join(' ')}
    >
      {palabra.silabas.map((silaba, s) => (
        <span
          key={s}
          className={[
            'inline-block transition-colors duration-200',
            encendida ? (s % 2 === 0 ? color.fondo : color.fondoAlterno) : '',
            s === 0 ? 'rounded-l-[0.22em]' : '',
            s === palabra.silabas.length - 1 ? 'rounded-r-[0.22em]' : '',
          ].join(' ')}
        >
          {silaba}
        </span>
      ))}
    </span>
  )
}
