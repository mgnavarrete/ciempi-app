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
export function TiraDeLectura({ palabras, motor, pista, alMedir, tamanoLetra, tranquilo, apariencia, alEntrar }: Props) {
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
  }, [palabras, tamanoLetra])

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
  }, [palabras, letra])

  const esperando = motor.fase === 'esperando'

  return (
    <PistaDeslizador ref={zona} alEntrar={alEntrar} className="w-full select-none">
      {/* Medidor invisible: el ancho natural de cada palabra con la letra del ajuste */}
      <span ref={medidor} aria-hidden className="font-lectura invisible absolute left-0 top-0 flex whitespace-nowrap" style={{ ...ESTILO_LINEA, fontSize: tamanoLetra }}>
        {palabras.map((p, i) => (
          <span key={i}>{p.texto}</span>
        ))}
      </span>

      <FraseEncendida ref={linea} palabras={palabras} palabrasLeidas={motor.palabrasLeidas} letra={letra} tranquilo={tranquilo} />

      {/* Carril de Ciempi, justo debajo de las palabras: aquí va el dedo */}
      <div className="relative mt-1 rounded-[2rem] border-2 border-[#e2d6bf] bg-arena/70 pt-1">
        <Ciempi pista={pista} palabrasLeidas={motor.palabrasLeidas} progreso={motor.progreso} fase={motor.fase} tranquilo={tranquilo} apariencia={apariencia} />
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
  palabrasLeidas: number
  letra: number
  tranquilo: boolean
}

/**
 * La frase con las palabras ya leídas encendidas (sílabas de colores). Solo se
 * vuelve a dibujar cuando se enciende una palabra, no con cada movimiento del dedo.
 */
const FraseEncendida = memo(
  forwardRef<HTMLParagraphElement, PropsFrase>(function FraseEncendida({ palabras, palabrasLeidas, letra, tranquilo }, ref) {
    return (
      <p
        ref={ref}
        aria-label={palabras.map((p) => p.texto).join(' ')}
        // Palabras de punta a punta con el mismo espacio entre ellas (una sola: al centro).
        className={`font-lectura flex whitespace-nowrap leading-tight text-tinta ${palabras.length > 1 ? 'justify-between' : 'justify-center'}`}
        style={{ ...ESTILO_LINEA, fontSize: letra, paddingLeft: MARGEN_IZQ, paddingRight: MARGEN_DER }}
      >
        {palabras.map((palabra, p) => {
          const encendida = p < palabrasLeidas
          const color = colorDePalabra(p)
          return (
            <span
              key={p}
              data-palabra
              aria-hidden
              className={['palabra inline-flex rounded-[0.22em]', encendida ? `encendida ${color.texto}` : '', tranquilo ? 'tranquilo' : ''].join(' ')}
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
        })}
      </p>
    )
  }),
)
