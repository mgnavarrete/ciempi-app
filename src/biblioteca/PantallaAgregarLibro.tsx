import { AgregarLibro } from '../adultos/AgregarLibro'
import type { Id, PerfilNino } from '../dominio/tipos'
import { Encabezado } from '../ui/comunes'

/**
 * Agregar un libro a la biblioteca de un niño (él mismo, o un adulto en su
 * sesión): un PDF o un texto escrito. Se vuelve a la biblioteca de inmediato
 * y el libro aparece como «Cargando…» hasta quedar listo.
 */
export function PantallaAgregarLibro({ perfil, usuarioId, alVolver }: { perfil: PerfilNino; usuarioId: Id; alVolver: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Encabezado alVolver={alVolver} titulo={`Libro para ${perfil.apodo}`} />
      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-5 pb-8 pt-2">
        <AgregarLibro perfiles={[perfil]} usuarioId={usuarioId} alListo={alVolver} />
      </div>
    </div>
  )
}
