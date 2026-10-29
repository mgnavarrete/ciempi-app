import { useEffect, useRef, useState } from 'react'
import { voz } from '../audio/voz'
import type { PerfilNino } from '../dominio/tipos'
import { CiempiPersonaje } from './CiempiPersonaje'
import type { EventoCiempi } from './v2/CiempiVivo'
import { FondoTema } from './dibujos'
import { useVozDeCiempi } from './vozDeCiempi'

interface Props {
  perfil: PerfilNino
  /** Sin esto (un adulto mirando), no se muestra el botón de personalizar. */
  alPersonalizar?: () => void
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
export function PortadaCiempi({ perfil, alPersonalizar }: Props) {
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
    <section className="relative mb-5 h-52 overflow-hidden rounded-3xl shadow-sm apaisado:h-36" aria-label={`${ciempi.nombre}, tu Ciempi`}>
      <FondoTema fondo={ciempi.fondo} />
      <p className="absolute left-3 top-3 z-10 max-w-[calc(100%-12rem)] rounded-2xl rounded-bl-sm bg-white/95 px-3 py-2 text-sm leading-snug shadow-sm">
        <span className="font-bold">¡Hola, {perfil.apodo}!</span> {presentacion}
      </p>
      {alPersonalizar && (
        <button onClick={alPersonalizar} className="absolute right-3 top-3 z-10 rounded-full bg-white/95 px-4 py-2 font-bold text-petroleo shadow-md active:scale-95">
          🎨 Personalizar
        </button>
      )}
      {/* Tocar a Ciempi: saluda. Queda debajo de los botones (z-0) para no taparlos. */}
      <button
        onClick={() => {
          voz.desbloquear()
          voz.decirFrase(`¡Hola, ${perfil.apodo}!`, perfil.ajustes.velocidadVoz)
          if (!tranquilo) hacer(SALUDAR)
        }}
        aria-label={`Saludar a ${ciempi.nombre}`}
        className="absolute inset-x-0 bottom-1 z-0 mx-auto block w-[min(72%,320px)] apaisado:w-[min(40%,260px)]"
      >
        <CiempiPersonaje apariencia={ciempi} ancho="100%" animado={!tranquilo} accion={accion} />
      </button>
    </section>
  )
}
