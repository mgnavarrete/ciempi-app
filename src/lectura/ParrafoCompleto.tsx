import { useLayoutEffect, useRef } from 'react'
import type { AparienciaCiempi } from '../ciempi/catalogo'
import type { PalabraSilabeada } from '../lenguaje/silabas'
import { Ciempi } from './Ciempi'
import type { Entrada, EstadoMotor, Pista } from './motor'
import { PistaDeslizador } from './PistaDeslizador'
import { PalabraEncendida } from './TiraDeLectura'

interface Props {
  /** Las palabras de cada línea (un verso, o un trozo de una oración). */
  lineas: PalabraSilabeada[][]
  motor: EstadoMotor
  /** Una manzana por palabra del párrafo, repartidas a lo largo del carril. */
  pista: Pista
  tamanoLetra: number
  tranquilo: boolean
  apariencia: AparienciaCiempi
  alEntrar: (entrada: Entrada) => void
  /** Tocar una palabra la dice (índice en todo el párrafo). */
  alTocarPalabra: (indice: number) => void
}

const LETRA_MINIMA = 14
/** Una línea por frase (como un poema) salvo que el texto corrido permita letra bastante más grande. */
const VENTAJA_TEXTO_CORRIDO = 1.25

/**
 * Nivel 3: el párrafo o la estrofa completa a la vista: una línea por frase
 * (cada verso en su línea) o, si así la letra queda muy chica, de corrido. Abajo, un solo carril para todo el párrafo: al deslizar a Ciempi las
 * palabras se van encendiendo de corrido, como al leer en voz alta, sin
 * levantar el dedo en cada línea. Solo se ve la manzana del final.
 */
export function ParrafoCompleto({ lineas, motor, pista, tamanoLetra, tranquilo, apariencia, alEntrar, alTocarPalabra }: Props) {
  const caja = useRef<HTMLDivElement>(null)
  const contenido = useRef<HTMLDivElement>(null)

  // La letra más grande con la que cabe todo (sin pasar del ajuste del niño),
  // con una línea por frase o de corrido: se mide en el DOM, sin volver a dibujar.
  useLayoutEffect(() => {
    const ajustar = () => {
      const c = caja.current
      const t = contenido.current
      if (!c || !t || c.clientHeight === 0) return
      const cabe = (letra: number, corrido: boolean) => {
        t.style.fontSize = `${letra}px`
        t.style.whiteSpace = corrido ? 'normal' : 'nowrap'
        t.dataset.corrido = corrido ? 'si' : ''
        return t.scrollHeight <= c.clientHeight && t.scrollWidth <= c.clientWidth
      }
      const mayor = (corrido: boolean) => {
        let [min, max] = [LETRA_MINIMA, Math.max(LETRA_MINIMA, Math.round(tamanoLetra * 0.8))]
        if (!cabe(min, corrido)) return 0
        while (max - min > 1) {
          const medio = Math.floor((min + max) / 2)
          if (cabe(medio, corrido)) min = medio
          else max = medio
        }
        return cabe(max, corrido) ? max : min
      }
      const porLinea = mayor(false)
      const corrido = mayor(true)
      if (porLinea && porLinea * VENTAJA_TEXTO_CORRIDO >= corrido) cabe(porLinea, false)
      else cabe(Math.max(corrido, LETRA_MINIMA), true)
    }
    ajustar()
    const obs = new ResizeObserver(ajustar)
    if (caja.current) obs.observe(caja.current)
    void document.fonts?.ready.then(ajustar)
    return () => obs.disconnect()
  }, [lineas, tamanoLetra])

  let indice = 0
  const esperando = motor.fase === 'esperando'

  return (
    <div className="flex min-h-0 flex-1 flex-col select-none">
      <div ref={caja} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <div
          ref={contenido}
          aria-label={lineas.map((l) => l.map((p) => p.texto).join(' ')).join(' ')}
          className="font-lectura max-w-full leading-snug text-tinta data-[corrido=si]:[&>p]:inline"
          style={{ letterSpacing: '0.03em', wordSpacing: '0.12em' }}
        >
          {lineas.map((linea, l) => (
            <p key={l}>
              {linea.map((palabra) => {
                const i = indice++
                return (
                  <span key={i}>
                    <PalabraEncendida
                      palabra={palabra}
                      indice={i}
                      encendida={i < motor.palabrasLeidas}
                      actual={i === motor.palabrasLeidas && motor.progreso > 0}
                      tranquilo={tranquilo}
                      onPointerDown={() => alTocarPalabra(i)}
                    />{' '}
                  </span>
                )
              })}
            </p>
          ))}
        </div>
      </div>

      {/* Un solo carril para todo el párrafo: aquí va el dedo. */}
      <PistaDeslizador alEntrar={alEntrar} className="mt-1 shrink-0 rounded-[2rem] border-2 border-[#e2d6bf] bg-arena/70 pt-1">
        <Ciempi pista={pista} palabrasLeidas={motor.palabrasLeidas} progreso={motor.progreso} fase={motor.fase} tranquilo={tranquilo} apariencia={apariencia} soloUltima />
        {esperando && motor.progreso === 0 && (
          <span className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-0.5 text-sm text-tinta-suave">
            Desliza a Ciempi despacio y lee todo →
          </span>
        )}
      </PistaDeslizador>
    </div>
  )
}
