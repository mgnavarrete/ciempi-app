import { useSyncExternalStore } from 'react'
import { enAndroid } from '../plataforma/telefono'
import { voz } from './voz'

/**
 * Aviso cuando el teléfono no tiene voz en español: sin ella Ciempi no puede
 * leer en voz alta. En la APK, el botón abre la descarga de la voz.
 */
export function AvisoVoz({ className = '' }: { className?: string }) {
  const falta = useSyncExternalStore(
    (fn) => voz.suscribir(fn),
    () => voz.faltaEspanol,
  )
  if (!falta) return null
  return (
    <div role="alert" className={`flex items-center gap-3 rounded-2xl bg-amarillo/30 px-4 py-2 ${className}`}>
      <span aria-hidden className="text-2xl">🔇</span>
      <p className="min-w-0 flex-1 text-sm leading-snug">
        <span className="font-bold">Este teléfono no tiene voz en español.</span>{' '}
        {enAndroid
          ? 'Pídele a un adulto que la instale: es gratis y funciona sin internet.'
          : 'Un adulto puede instalarla en los ajustes de "Texto a voz" del equipo.'}
      </p>
      {enAndroid && (
        <button onClick={() => voz.instalarEspanol()} className="shrink-0 rounded-full bg-petroleo px-4 py-2 text-sm font-bold text-white">
          Instalar voz
        </button>
      )}
    </div>
  )
}
