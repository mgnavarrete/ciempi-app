import { useEffect, useRef, useState } from 'react'
import { voz } from '../audio/voz'
import type { PerfilNino } from '../dominio/tipos'
import { CiempiPersonaje } from './CiempiPersonaje'
import { FondoTema } from './dibujos'
import { useVozDeCiempi } from './vozDeCiempi'

interface Props {
  perfil: PerfilNino
  /** Sin esto (un adulto mirando), no se muestra el botón de personalizar. */
  alPersonalizar?: () => void
}

type Accion = 'saltar' | 'saludar' | 'bailar'
const ACCIONES: Accion[] = ['saltar', 'saludar', 'bailar']
const DURACION: Record<Accion, number> = { saltar: 950, saludar: 1550, bailar: 1600 }

/**
 * Ciempi del niño sobre su fondo, arriba de "Mis libros". Está vivo: ondula y
 * pestañea, y cada tanto salta, saluda o baila. Si el niño lo toca, lo saluda.
 */
export function PortadaCiempi({ perfil, alPersonalizar }: Props) {
  const { ciempi } = perfil
  const tranquilo = perfil.ajustes.modoTranquilo
  useVozDeCiempi(ciempi.genero)
  const [accion, setAccion] = useState<Accion | null>(null)
  const fin = useRef<number | undefined>(undefined)

  const hacer = (a: Accion) => {
    window.clearTimeout(fin.current)
    setAccion(null)
    // Un cuadro sin clase para que la animación pueda repetirse.
    requestAnimationFrame(() => setAccion(a))
    fin.current = window.setTimeout(() => setAccion(null), DURACION[a])
  }

  useEffect(() => {
    if (tranquilo) return
    const intervalo = window.setInterval(() => hacer(ACCIONES[Math.floor(Math.random() * ACCIONES.length)]), 6000)
    const primera = window.setTimeout(() => hacer('saludar'), 700)
    return () => {
      window.clearInterval(intervalo)
      window.clearTimeout(primera)
      window.clearTimeout(fin.current)
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
          if (!tranquilo) hacer('saludar')
        }}
        aria-label={`Saludar a ${ciempi.nombre}`}
        className={`absolute inset-x-0 bottom-1 z-0 mx-auto block w-[min(72%,320px)] apaisado:w-[min(40%,260px)] ${accion ? `accion-${accion}` : ''}`}
      >
        <CiempiPersonaje apariencia={ciempi} ancho="100%" animado={!tranquilo} />
      </button>
    </section>
  )
}
