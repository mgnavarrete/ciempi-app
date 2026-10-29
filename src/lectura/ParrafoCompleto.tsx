import { useLayoutEffect, useRef } from 'react'
import type { AparienciaCiempi } from '../ciempi/catalogo'
import type { PalabraSilabeada } from '../lenguaje/silabas'
import { Ciempi } from './Ciempi'
import type { Entrada, EstadoMotor, Pista } from './motor'
import { PistaDeslizador } from './PistaDeslizador'
import { PalabraEncendida } from './TiraDeLectura'

interface Props {
  /** Las palabras de cada fragmento (un verso, o un trozo con sentido de una oración). */
  lineas: PalabraSilabeada[][]
  /** Cuántas palabras ya se leyeron (se encienden). */
  palabrasEncendidas: number
  /**
   * Nivel 3: siempre una frase por línea, cada una de un color (rojo y azul
   * alternados), y se enciende entera al comer su manzana.
   */
  porFrase?: boolean
  motor: EstadoMotor
  /** Una manzana por fragmento, donde termina su última palabra. */
  pista: Pista
  tamanoLetra: number
  /** Una moneda al final del camino: esta frase paga si la termina (niveles 0 a 3). */
  moneda?: boolean
  tranquilo: boolean
  apariencia: AparienciaCiempi
  alEntrar: (entrada: Entrada) => void
  /** Tocar una palabra la dice (índice en todo el párrafo). */
  alTocarPalabra: (indice: number) => void
}

const LETRA_MINIMA = 14
/** Nivel 3: los colores de las frases, alternados (texto, y fondo cuando ya se leyó). */
const COLORES_FRASE = [
  { texto: 'text-coral', fondo: 'bg-coral/15' },
  { texto: 'text-petroleo', fondo: 'bg-petroleo-claro' },
] as const
/** Un fragmento por línea (como un poema) salvo que el texto corrido permita letra bastante más grande. */
const VENTAJA_TEXTO_CORRIDO = 1.25

/**
 * Niveles 3 y 4: el párrafo, la estrofa o la página completa a la vista, con
 * un solo carril abajo y una manzana por fragmento; al comer cada manzana,
 * Ciempi lee ese fragmento (si el niño eligió «Leer conmigo»).
 * - Nivel 3 (`porFrase`): una frase por línea, rojo y azul alternados; la
 *   frase se enciende entera al llegar a su manzana.
 * - Nivel 4: un fragmento por línea o, si así la letra queda muy chica, de
 *   corrido; las palabras se encienden a medida que pasa el dedo.
 */
export function ParrafoCompleto({ lineas, palabrasEncendidas, porFrase = false, motor, pista, tamanoLetra, tranquilo, moneda = false, apariencia, alEntrar, alTocarPalabra }: Props) {
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
      // Nivel 3: siempre una frase por línea (si ni con la letra mínima cabe, se deja cortar).
      if (porFrase) return void (porLinea ? cabe(porLinea, false) : cabe(LETRA_MINIMA, true))
      const corrido = mayor(true)
      if (porLinea && porLinea * VENTAJA_TEXTO_CORRIDO >= corrido) cabe(porLinea, false)
      else cabe(Math.max(corrido, LETRA_MINIMA), true)
    }
    ajustar()
    const obs = new ResizeObserver(ajustar)
    if (caja.current) obs.observe(caja.current)
    void document.fonts?.ready.then(ajustar)
    return () => obs.disconnect()
  }, [lineas, tamanoLetra, porFrase])

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
          {lineas.map((linea, l) => {
            if (porFrase) {
              // La frase entera de un color; ya leída, con su fondo; la que sigue, marcada; las demás, más suaves.
              const desde = indice
              indice += linea.length
              const leida = indice <= palabrasEncendidas
              const sigue = !leida && desde === palabrasEncendidas
              const color = COLORES_FRASE[l % 2]
              return (
                <p
                  key={l}
                  className={[
                    'w-fit rounded-[0.3em] px-[0.2em] transition-colors duration-300',
                    color.texto,
                    leida ? `${color.fondo} ${tranquilo ? '' : 'frase-leida'}` : sigue ? '' : 'opacity-55',
                  ].join(' ')}
                >
                  {linea.map((palabra, j) => (
                    <span key={j} onPointerDown={() => alTocarPalabra(desde + j)} className={sigue && j === 0 ? 'underline decoration-amarillo decoration-[0.12em] underline-offset-[0.2em]' : ''}>
                      {palabra.texto}{' '}
                    </span>
                  ))}
                </p>
              )
            }
            return (
              <p key={l}>
                {linea.map((palabra) => {
                  const i = indice++
                  return (
                    <span key={i}>
                      <PalabraEncendida
                        palabra={palabra}
                        indice={i}
                        encendida={i < palabrasEncendidas}
                        actual={i === palabrasEncendidas && motor.progreso > 0}
                        tranquilo={tranquilo}
                        onPointerDown={() => alTocarPalabra(i)}
                      />{' '}
                    </span>
                  )
                })}
              </p>
            )
          })}
        </div>
      </div>

      {/* Un solo carril para todo el párrafo: aquí va el dedo. */}
      <PistaDeslizador alEntrar={alEntrar} className="mt-1 shrink-0 rounded-[2rem] border-2 border-[#e2d6bf] bg-arena/70 pt-1">
        <Ciempi pista={pista} palabrasLeidas={motor.palabrasLeidas} progreso={motor.progreso} fase={motor.fase} tranquilo={tranquilo} apariencia={apariencia} moneda={moneda} />
        {esperando && motor.progreso === 0 && (
          <span className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-0.5 text-sm text-tinta-suave">
            Desliza a Ciempi despacio y lee todo →
          </span>
        )}
      </PistaDeslizador>
    </div>
  )
}
