import { useEffect, useRef, useState } from 'react'
import { voz } from '../audio/voz'
import type { PerfilNino } from '../dominio/tipos'
import { CiempiPersonaje } from './CiempiPersonaje'
import type { EventoCiempi } from './v2/CiempiVivo'
import { Comida, FondoTema } from './dibujos'
import { useVozDeCiempi } from './vozDeCiempi'

interface Props {
  perfil: PerfilNino
  /** Abre la tienda o su ropero. Sin esto (un adulto mirando), no se muestran los botones. */
  alAbrir?: (modo: 'tienda' | 'ropero') => void
}

/**
 * Lo que hace Ciempi cada tanto (animaciones del laboratorio, ver
 * ciempi/v2/animacion/animaciones.js). El Ciempi clásico solo sabe saludar,
 * saltar y bailar; las demás las juega únicamente el nuevo.
 */
const ACCIONES = ['A04', 'A03', 'E02', 'E05', 'A08', 'A12', 'E03', 'E01']
const SALUDAR = 'A04'

/**
 * Ciempi del niño sobre su fondo, arriba de "Mis libros". Está vivo: ondula y
 * pestañea, y cada tanto salta, saluda o baila. Si el niño lo toca, lo saluda.
 */
export function PortadaCiempi({ perfil, alAbrir }: Props) {
  const { ciempi } = perfil
  const tranquilo = perfil.ajustes.modoTranquilo
  useVozDeCiempi(ciempi.genero)
  const [accion, setAccion] = useState<EventoCiempi | null>(null)
  const veces = useRef(0)
  const hacer = (id: string) => setAccion({ id, n: ++veces.current })

  useEffect(() => {
    if (tranquilo) return
    const intervalo = window.setInterval(() => hacer(ACCIONES[Math.floor(Math.random() * ACCIONES.length)]), 7000)
    const primera = window.setTimeout(() => hacer(SALUDAR), 700)
    return () => {
      window.clearInterval(intervalo)
      window.clearTimeout(primera)
    }
  }, [tranquilo])

  const presentacion =
    ciempi.genero === 'nina' ? `Soy ${ciempi.nombre}, tu amiga lectora.` : ciempi.genero === 'nino' ? `Soy ${ciempi.nombre}, tu amigo lector.` : `Soy ${ciempi.nombre}.`

  return (
    <section className="relative mb-5 h-80 overflow-hidden rounded-3xl shadow-sm apaisado:h-56" aria-label={`${ciempi.nombre}, tu Ciempi`}>
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
        <div className="absolute right-3 top-3 z-10 flex w-36 flex-col gap-2 apaisado:w-40">
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
      {/* Sus frutas (la comida que eligió en la tienda), en el pasto delante de Ciempi. */}
      <svg viewBox="0 0 120 40" className="pointer-events-none absolute bottom-1 right-[3%] z-0 w-[34%] max-w-[170px] apaisado:right-[7%] apaisado:w-[19%]" aria-hidden>
        {[
          [22, 26, 11, 0],
          [56, 29, 13, 0.6],
          [90, 25, 10, 1.2],
        ].map(([x, y, t, d], i) => (
          <g key={i} className={tranquilo ? undefined : 'fruta-portada'} style={{ animationDelay: `${d}s`, transformOrigin: `${x}px ${y + t}px` }}>
            <Comida comida={ciempi.comida} x={x} y={y} tamano={t} />
          </g>
        ))}
      </svg>
      {/* Tocar a Ciempi: saluda. Queda debajo de los botones (z-0) para no taparlos. */}
      <button
        onClick={() => {
          voz.desbloquear()
          voz.decirFrase(`¡Hola, ${perfil.apodo}!`, perfil.ajustes.velocidadVoz)
          if (!tranquilo) hacer(SALUDAR)
        }}
        aria-label={`Saludar a ${ciempi.nombre}`}
        className="absolute inset-x-0 bottom-1 z-0 mx-auto block w-[min(94%,450px)] apaisado:w-[min(52%,380px)]"
      >
        <CiempiPersonaje apariencia={ciempi} ancho="100%" animado={!tranquilo} accion={accion} />
      </button>
    </section>
  )
}
