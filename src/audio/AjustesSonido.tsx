import { useEffect, useState } from 'react'
import { alCambiarPreferencias, guardarPreferencias, leerPreferencias } from './musica'

/** Interruptores de música de fondo y sonido de los botones (valen para este dispositivo). */
export function AjustesSonido() {
  const [p, setP] = useState(leerPreferencias)
  useEffect(() => alCambiarPreferencias(() => setP(leerPreferencias())), [])
  const cambiar = (clave: 'musica' | 'botones', valor: boolean) => guardarPreferencias({ ...p, [clave]: valor })
  return (
    <>
      {(
        [
          ['musica', 'Música de fondo', 'Una melodía suave en la biblioteca y al personalizar. No suena mientras lee.'],
          ['botones', 'Sonido de los botones', 'Un «pop» suave al tocar.'],
        ] as const
      ).map(([clave, titulo, detalle]) => (
        <label key={clave} className="flex items-center justify-between gap-4">
          <span>
            <span className="block font-bold">{titulo}</span>
            <span className="text-sm text-tinta-suave">{detalle}</span>
          </span>
          <input type="checkbox" checked={p[clave]} onChange={(e) => cambiar(clave, e.target.checked)} className="h-7 w-7 shrink-0 accent-petroleo" />
        </label>
      ))}
    </>
  )
}
