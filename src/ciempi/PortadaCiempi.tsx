import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { voz } from '../audio/voz'
import type { PerfilNino } from '../dominio/tipos'
import { bailesDe, type Baile } from './catalogo'
import { CiempiPersonaje } from './CiempiPersonaje'
import { ANIMACIONES } from './v2/animacion/animaciones.js'
import type { EventoCiempi } from './v2/CiempiVivo'
import { Comida, FondoTema } from './dibujos'
import { useVozDeCiempi } from './vozDeCiempi'

interface Props {
  perfil: PerfilNino
  /** Abre la tienda o su ropero (y, si se indica, en una sección). Sin esto (un adulto mirando), no se muestran los botones. */
  alAbrir?: (modo: 'tienda' | 'ropero', seccion?: string) => void
}

/**
 * Lo que hace Ciempi cada tanto (animaciones del laboratorio, ver
 * ciempi/v2/animacion/animaciones.js). El Ciempi clásico solo sabe saludar,
 * saltar y bailar; las demás las juega únicamente el nuevo.
 */
const ACCIONES = ['A04', 'A03', 'E02', 'E05', 'A08', 'A12', 'E03', 'E01']
const SALUDAR = 'A04'

/** Una opción de la rueda: un baile suyo o «+ Más bailes» (abre la tienda). */
type Opcion = { baile: Baile } | { mas: true }

/** Caja de cada opción (círculo y nombre), en px, y margen alrededor de los botones. */
const OPCION = { ancho: 68, alto: 74 }
const MARGEN = 6

interface Caja {
  x: number
  y: number
  ancho: number
  alto: number
}
const seCruzan = (a: Caja, b: Caja) => a.x < b.x + b.ancho && b.x < a.x + a.ancho && a.y < b.y + b.alto && b.y < a.y + a.alto

/**
 * Dónde va cada opción de la rueda (centro, relativo a la portada): en una
 * elipse alrededor de Ciempi, repartidas a la par, dentro del ancho de la
 * portada, sin pasar por encima de ella y sin tapar los botones Tienda / Mi
 * ropero (si los alcanzaría, la rueda deja un hueco ahí). Abajo puede salir de
 * la portada (sobre «Mis libros», que queda oscurecido). Con pocas opciones se
 * juntan arriba a la izquierda, sobre Ciempi.
 */
export function posicionesRueda(n: number, portada: Caja, ciempi: Caja, botones: Caja | null): { x: number; y: number }[] {
  if (n <= 0) return []
  // Centrada en la portada (Ciempi ocupa casi todo el ancho y en vertical va un poco corrido).
  const cx = portada.ancho / 2
  const cy = ciempi.y + ciempi.alto * 0.55
  const rx = Math.min(portada.ancho / 2 - OPCION.ancho / 2 - 2, Math.max(ciempi.ancho * 0.62, 140))
  const ry = Math.min(135, Math.max(110, ciempi.alto * 0.75))
  const arriba = Math.min(ry, cy - OPCION.alto / 2 - 4)
  const evitar = botones && { x: botones.x - MARGEN, y: botones.y - MARGEN, ancho: botones.ancho + 2 * MARGEN, alto: botones.alto + 2 * MARGEN }
  const punto = (g: number) => {
    const r = (g * Math.PI) / 180
    return { x: cx + rx * Math.cos(r), y: cy - (Math.sin(r) > 0 ? arriba : ry) * Math.sin(r) }
  }
  const libre = (g: number) => {
    const { x, y } = punto(g)
    const caja = { x: x - OPCION.ancho / 2, y: y - OPCION.alto / 2, ancho: OPCION.ancho, alto: OPCION.alto }
    return caja.x >= 0 && caja.x + caja.ancho <= portada.ancho && caja.y >= 0 && !(evitar && seCruzan(caja, evitar))
  }
  // El arco libre más largo (cada 5°, en sentido antihorario). Sin nada que esquivar, la vuelta entera.
  const libres = Array.from({ length: 72 }, (_, i) => libre(i * 5))
  let desde = 0
  let tramo = 360
  if (!libres.every(Boolean)) {
    tramo = -5
    for (let i = 0; i < 72; i++) {
      if (!libres[i] || libres[(i + 71) % 72]) continue
      let largo = 0
      while (largo < 72 && libres[(i + largo) % 72]) largo++
      if ((largo - 1) * 5 > tramo) {
        tramo = (largo - 1) * 5
        desde = i * 5
      }
    }
    if (tramo < 0) return []
  }
  const completa = tramo === 360
  // Con muchas opciones se reparten en todo el arco; con pocas, a 40° entre sí,
  // lo más cerca posible de arriba a la izquierda (150°, sobre Ciempi).
  const paso = Math.min(40, completa ? 360 / n : n > 1 ? tramo / (n - 1) : 0)
  const ancho = (n - 1) * paso
  const centrado = 150 - ancho / 2
  const inicio = completa ? centrado : Math.max(desde, Math.min(centrado < desde ? centrado + 360 : centrado, desde + tramo - ancho))
  return Array.from({ length: n }, (_, i) => punto(inicio + i * paso))
}

const relativa = (r: DOMRect, base: DOMRect): Caja => ({ x: r.left - base.left, y: r.top - base.top, ancho: r.width, alto: r.height })
const duracionDe = (animacion: string) => ANIMACIONES.find((a) => a.id === animacion)?.duracion ?? 3

/**
 * Ciempi del niño sobre su fondo, arriba de "Mis libros". Está vivo: ondula y
 * pestañea, y cada tanto salta, saluda o baila. Si el niño lo toca, se abre la
 * rueda con sus bailes (2.7): elige uno y Ciempi lo baila y lo saluda.
 */
export function PortadaCiempi({ perfil, alAbrir }: Props) {
  const { ciempi } = perfil
  const tranquilo = perfil.ajustes.modoTranquilo
  useVozDeCiempi(ciempi.genero)
  const [accion, setAccion] = useState<EventoCiempi | null>(null)
  const veces = useRef(0)
  const hacer = (id: string) => setAccion({ id, n: ++veces.current })
  const [rueda, setRueda] = useState(false)
  // Modo tranquilo: Ciempi está quieto, pero baila (suave) lo que el niño elige.
  const [bailando, setBailando] = useState(false)
  const finBaile = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (tranquilo) return
    const intervalo = window.setInterval(() => {
      // Con la rueda abierta no se interrumpe lo que eligió.
      if (!ruedaAbierta.current) hacer(ACCIONES[Math.floor(Math.random() * ACCIONES.length)])
    }, 7000)
    const primera = window.setTimeout(() => hacer(SALUDAR), 700)
    return () => {
      window.clearInterval(intervalo)
      window.clearTimeout(primera)
    }
  }, [tranquilo])
  const ruedaAbierta = useRef(false)
  ruedaAbierta.current = rueda
  useEffect(() => () => window.clearTimeout(finBaile.current), [])

  const bailes = bailesDe(perfil.inventario)
  const soloGratis = bailes.every((b) => b.precio === 0)
  const opciones: Opcion[] = [...bailes.map((baile) => ({ baile })), ...(soloGratis && alAbrir ? [{ mas: true as const }] : [])]

  // Posiciones de la rueda: se miden la portada, Ciempi y los botones (cambian con el ancho y al girar).
  const portada = useRef<HTMLDivElement>(null)
  const botonCiempi = useRef<HTMLButtonElement>(null)
  const botones = useRef<HTMLDivElement>(null)
  const [puntos, setPuntos] = useState<{ x: number; y: number }[]>([])
  const centro = useRef({ x: 0, y: 0 })
  useLayoutEffect(() => {
    if (!rueda) return
    const medir = () => {
      const p = portada.current?.getBoundingClientRect()
      const c = botonCiempi.current?.getBoundingClientRect()
      if (!p || !c) return
      const cajaCiempi = relativa(c, p)
      centro.current = { x: cajaCiempi.x + cajaCiempi.ancho / 2, y: cajaCiempi.y + cajaCiempi.alto * 0.55 }
      const b = botones.current?.getBoundingClientRect()
      setPuntos(posicionesRueda(opciones.length, relativa(p, p), cajaCiempi, b ? relativa(b, p) : null))
    }
    medir()
    const obs = new ResizeObserver(medir)
    if (portada.current) obs.observe(portada.current)
    return () => obs.disconnect()
  }, [rueda, opciones.length])

  const presentacion =
    ciempi.genero === 'nina' ? `Soy ${ciempi.nombre}, tu amiga lectora.` : ciempi.genero === 'nino' ? `Soy ${ciempi.nombre}, tu amigo lector.` : `Soy ${ciempi.nombre}.`

  const bailar = (b: Baile) => {
    setRueda(false)
    voz.desbloquear()
    voz.decirFrase(`¡Hola, ${perfil.apodo}!`, perfil.ajustes.velocidadVoz)
    if (tranquilo) {
      setBailando(true)
      window.clearTimeout(finBaile.current)
      finBaile.current = window.setTimeout(() => setBailando(false), duracionDe(b.animacion) * 1000 + 400)
    }
    hacer(b.animacion)
  }

  return (
    <div ref={portada} className="relative mb-5">
      <section className="relative h-80 overflow-hidden rounded-3xl shadow-sm apaisado:h-56" aria-label={`${ciempi.nombre}, tu Ciempi`}>
        <FondoTema fondo={ciempi.fondo} />
        <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-10.5rem)] flex-col items-start gap-2">
          <p className="rounded-2xl rounded-bl-sm bg-white/95 px-3 py-2 text-sm leading-snug shadow-sm">
            <span className="font-bold">¡Hola, {perfil.apodo}!</span> {presentacion}
          </p>
          {/* Su cartel: cómo se llama su Ciempi y cuántas monedas tiene. */}
          <p className="flex max-w-full items-center gap-2 rounded-xl border-2 border-[#8a5a2b] bg-[#c98e52] px-3 py-1 font-bold text-white shadow-md [text-shadow:0_1px_0_#8a5a2b]">
            <span className="truncate">{ciempi.nombre}</span>
            <span className="shrink-0 rounded-full bg-white/95 px-2 text-naranjo [text-shadow:none]" aria-label={`${perfil.monedas} monedas`}>
              🪙 {perfil.monedas}
            </span>
          </p>
        </div>
        {alAbrir && (
          <div ref={botones} className="absolute right-3 top-3 z-30 flex w-36 flex-col gap-2 apaisado:w-40">
            <button
              onClick={() => alAbrir('tienda')}
              className="flex items-center gap-2 rounded-2xl border-b-4 border-[#a34b18] bg-naranjo px-3 py-2 text-left font-bold text-white shadow-md transition active:translate-y-0.5 active:border-b-2"
            >
              <span className="text-2xl" aria-hidden>
                🛍️
              </span>
              Tienda
            </button>
            <button
              onClick={() => alAbrir('ropero')}
              className="flex items-center gap-2 rounded-2xl border-b-4 border-[#1a5966] bg-petroleo px-3 py-2 text-left font-bold text-white shadow-md transition active:translate-y-0.5 active:border-b-2"
            >
              <span className="text-2xl" aria-hidden>
                👕
              </span>
              Mi ropero
            </button>
          </div>
        )}
        {/*
          Sus frutas (la comida que eligió en la tienda), apoyadas en el pasto delante de Ciempi (2.7: más grandes).
          El viewBox deja margen para el tamaño de la imagen y el vaivén: ninguna se corta.
          En vertical Ciempi se corre un poco a la izquierda para dejarles lugar.
        */}
        <svg
          viewBox="0 0 104 76"
          className="pointer-events-none absolute bottom-0 right-[1%] z-0 w-[29%] max-w-[150px] apaisado:right-[6%] apaisado:w-[17%]"
          aria-hidden
        >
          {[
            [56, 41, 15, 1.2],
            [27, 49, 19, 0],
            [78, 52, 16, 0.6],
          ].map(([x, y, t, d], i) => (
            <g key={i} className={tranquilo ? undefined : 'fruta-portada'} style={{ animationDelay: `${d}s`, transformOrigin: `${x}px ${y + t * 1.2}px` }}>
              <Comida comida={ciempi.comida} x={x} y={y} tamano={t} />
            </g>
          ))}
        </svg>
        {/* Tocar a Ciempi abre la rueda de bailes. Queda debajo de los botones para no taparlos. */}
        <button
          ref={botonCiempi}
          onClick={() => {
            voz.desbloquear()
            setRueda(!rueda)
          }}
          aria-label={`Elegir un baile para ${ciempi.nombre}`}
          aria-expanded={rueda}
          className={`absolute inset-x-0 bottom-1 mx-auto block w-[min(94%,450px)] -translate-x-[8%] apaisado:w-[min(52%,380px)] apaisado:translate-x-0 ${rueda ? 'z-20' : 'z-0'}`}
        >
          <CiempiPersonaje apariencia={ciempi} ancho="100%" animado={!tranquilo || bailando} tranquilo={tranquilo} accion={accion} />
        </button>
      </section>

      {rueda && (
        <>
          {/* Tocar fuera cierra la rueda (los botones Tienda / Mi ropero quedan encima y siguen funcionando). */}
          <button aria-label="Cerrar los bailes" onClick={() => setRueda(false)} className={`fixed inset-0 z-10 cursor-default bg-tinta/30 ${tranquilo ? '' : 'aparecer-suave'}`} />
          <ul className="pointer-events-none absolute inset-0 z-20" aria-label="Bailes">
            {opciones.map((o, i) => {
              const p = puntos[i]
              if (!p) return null
              const estilo = {
                left: p.x - OPCION.ancho / 2,
                top: p.y - OPCION.alto / 2,
                width: OPCION.ancho,
                height: OPCION.alto,
                '--desde-x': `${centro.current.x - p.x}px`,
                '--desde-y': `${centro.current.y - p.y}px`,
                animationDelay: `${i * 35}ms`,
              } as CSSProperties
              const mas = 'mas' in o
              return (
                <li key={mas ? 'mas' : o.baile.id} className={`pointer-events-auto absolute ${tranquilo ? '' : 'rueda-aparecer'}`} style={estilo}>
                  <button
                    onClick={() => {
                      if (mas) {
                        setRueda(false)
                        alAbrir?.('tienda', 'bailes')
                      } else bailar(o.baile)
                    }}
                    className="flex h-full w-full flex-col items-center gap-0.5 active:scale-95"
                  >
                    <span
                      className={`flex h-[52px] w-[52px] items-center justify-center rounded-full border-4 text-[26px] shadow-lg ${mas ? 'border-[#a34b18] bg-naranjo font-bold text-white' : 'border-amarillo bg-white'}`}
                      aria-hidden
                    >
                      {mas ? '+' : o.baile.emoji}
                    </span>
                    <span className="w-max max-w-[86px] rounded-xl bg-white/95 px-1.5 text-center text-[11px] font-bold leading-[13px] text-tinta shadow-sm">{mas ? 'Más bailes' : o.baile.nombre}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
