import { useEffect, useState } from 'react'
import { abrirDescargaApk, comprobarActualizacion } from './ota'

/**
 * Arranca la comprobación de actualizaciones al abrir la app (en la web no hace nada) y, solo en
 * la APK compartida a mano (VITE_CANAL=directo), avisa cuando hay que instalar una APK nueva.
 * Va al lado de <App />: si la app no llega a dibujarse, no se confirma al plugin que la versión
 * arrancó bien y este vuelve a la anterior.
 */
export function AvisoActualizacion() {
  const [apk, setApk] = useState<{ version: string; url: string } | null>(null)

  useEffect(() => {
    let vigente = true
    void comprobarActualizacion().then((d) => {
      if (vigente && d.tipo === 'avisarApk') setApk({ version: d.version, url: d.url })
    })
    return () => {
      vigente = false
    }
  }, [])

  if (!apk) return null
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-3 z-50 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-3 rounded-2xl bg-white px-4 py-3 text-tinta shadow-lg ring-1 ring-arena"
    >
      <span className="font-bold">Hay una versión nueva de CIEMPI</span>
      <button onClick={() => abrirDescargaApk(apk.url)} className="shrink-0 rounded-full bg-petroleo px-4 py-1.5 font-bold text-white active:scale-95">
        Descargar
      </button>
      <button onClick={() => setApk(null)} className="h-8 w-8 shrink-0 rounded-full bg-crema font-bold" aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  )
}
