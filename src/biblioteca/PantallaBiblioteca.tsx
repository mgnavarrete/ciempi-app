import { useCallback, useEffect, useState } from 'react'
import { DialogoCompartir, DialogoNivel } from '../adultos/LectoresDelLibro'
import { AvisoVoz } from '../audio/AvisoVoz'
import { PortadaCiempi } from '../ciempi/PortadaCiempi'
import { useRepositorios } from '../datos/DatosProvider'
import type { Asignacion, Id, PerfilNino, Texto } from '../dominio/tipos'
import { NIVELES } from '../lenguaje/unidades'
import { BarraProgreso, BotonIcono, Encabezado, Icono, Monedas, Portada } from '../ui/comunes'
import { resumirProgreso } from './progreso'

export interface LibroEnBiblioteca {
  asignacion: Asignacion
  texto: Texto
}

interface Props {
  perfil: PerfilNino
  /** Usuario con sesión iniciada: puede borrar los libros que él subió. */
  usuarioId: Id
  /**
   * - nino: la app del niño (agregar libros, salir);
   * - admin: un adulto mirando los libros del niño (puede quitar cualquiera).
   */
  modo: 'nino' | 'admin'
  /** vistaPrevia: un adulto solo mira (no cambia el avance ni da monedas). */
  alLeer: (libro: LibroEnBiblioteca, vistaPrevia?: boolean) => void
  alAjustes: () => void
  alAgregarLibro?: () => void
  /** Abrir la tienda/armario de Ciempi (no se ofrece a un adulto mirando). */
  alPersonalizar?: () => void
  /** Volver (admin o sin conexión). En la app del niño no hay: salir está en Ajustes. */
  alVolver?: () => void
  /** Modo admin: los niños del adulto, para compartirles un libro. */
  ninosDelAdulto?: PerfilNino[]
}

/** Los libros y textos del niño, con su avance. */
export function PantallaBiblioteca({ perfil, usuarioId, modo, alLeer, alAjustes, alAgregarLibro, alPersonalizar, alVolver, ninosDelAdulto = [] }: Props) {
  const repos = useRepositorios()
  const [libros, setLibros] = useState<LibroEnBiblioteca[] | null>(null)
  // Adulto: cambiar el nivel de un libro o compartirlo con otro niño.
  const [cambiandoNivel, setCambiandoNivel] = useState<LibroEnBiblioteca | null>(null)
  const [compartiendo, setCompartiendo] = useState<Texto | null>(null)

  const cargar = useCallback(async () => {
    const asignaciones = await repos.asignaciones.listarPorPerfil(perfil.id)
    const conTexto = await Promise.all(
      asignaciones.filter((a) => a.estado !== 'archivada').map(async (asignacion) => ({ asignacion, texto: await repos.textos.obtener(asignacion.textoId) })),
    )
    return conTexto.filter((l): l is LibroEnBiblioteca => l.texto !== null)
  }, [repos, perfil.id])

  useEffect(() => {
    let vigente = true
    void cargar().then((l) => vigente && setLibros(l))
    return () => {
      vigente = false
    }
  }, [cargar])

  const quitar = async (libro: LibroEnBiblioteca) => {
    const propio = libro.texto.subidoPor === usuarioId
    const pregunta = propio ? `¿Borrar «${libro.texto.titulo}»?` : `¿Quitar «${libro.texto.titulo}» de la biblioteca de ${perfil.apodo}?`
    if (!confirm(pregunta)) return
    // Si lo subió quien lo borra, se elimina el texto; si no, solo se saca de la biblioteca.
    if (propio) await repos.textos.eliminar(libro.texto.id)
    else await repos.asignaciones.quitar(libro.asignacion.id)
    setLibros(await cargar())
  }

  const puedeQuitar = (l: LibroEnBiblioteca) => modo === 'admin' || l.texto.subidoPor === usuarioId

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Encabezado
        alVolver={alVolver}
        titulo={
          <span className="flex items-center gap-2">
            <span aria-hidden>{perfil.icono}</span> {modo === 'admin' ? `Libros de ${perfil.apodo}` : perfil.apodo}
          </span>
        }
      >
        <Monedas cantidad={perfil.monedas} />
        <BotonIcono etiqueta="Ajustes de lectura" icono="ajustes" onClick={alAjustes} />
      </Encabezado>

      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-5 pb-8 pt-3">
        <AvisoVoz className="mb-3" />
        <PortadaCiempi perfil={perfil} alPersonalizar={alPersonalizar} />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{modo === 'admin' ? 'Su biblioteca' : 'Mis libros'}</h1>
          {alAgregarLibro && (
            <button onClick={alAgregarLibro} className="flex items-center gap-1 rounded-full bg-naranjo px-4 py-2 font-bold text-white shadow-md active:scale-95">
              <Icono nombre="mas" className="h-5 w-5" /> Agregar libro
            </button>
          )}
        </div>

        {libros?.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center">
            <img src="/ciempi.svg" alt="" className="h-24 w-24 rounded-2xl" />
            <p className="text-lg">{modo === 'admin' ? `${perfil.apodo} todavía no tiene libros.` : 'Todavía no tienes libros.'}</p>
            {alAgregarLibro && modo === 'nino' && (
              <button onClick={alAgregarLibro} className="font-bold text-petroleo underline underline-offset-4">
                Agrega tu primer libro
              </button>
            )}
          </div>
        )}

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 apaisado:grid-cols-2">
          {libros?.map((libro) => {
            const resumen = resumirProgreso(libro.asignacion, libro.texto)
            return (
              <li key={libro.asignacion.id} className="relative">
                <button
                  onClick={() => alLeer(libro)}
                  className="flex w-full items-stretch gap-4 rounded-3xl bg-white p-3 text-left shadow-sm transition active:scale-[0.98]"
                >
                  <Portada titulo={libro.texto.titulo} portada={libro.texto.portada} className="h-32 w-24 shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1 py-1 pr-8">
                    <span className="line-clamp-2 text-lg font-bold leading-tight">{libro.texto.titulo}</span>
                    {libro.texto.autor && <span className="truncate text-sm text-tinta-suave">{libro.texto.autor}</span>}
                    <span className="mt-auto flex flex-wrap items-center gap-x-2 text-sm text-tinta-suave">
                      <span className="rounded-full bg-amarillo/40 px-2 font-bold text-tinta">
                        Nivel {libro.asignacion.nivel} · {NIVELES[libro.asignacion.nivel - 1].nombre}
                      </span>
                      {resumen.etiqueta}
                    </span>
                    <BarraProgreso valor={resumen.fraccion} />
                    <span className="mt-1 self-start rounded-full bg-petroleo px-4 py-1.5 font-bold text-white">
                      {modo === 'admin' ? `Leer con ${perfil.apodo}` : resumen.accion} →
                    </span>
                  </span>
                </button>
                {modo === 'admin' && (
                  <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm font-bold">
                    <button onClick={() => setCambiandoNivel(libro)} className="text-petroleo underline underline-offset-4">
                      Cambiar nivel
                    </button>
                    {ninosDelAdulto.length > 1 && (
                      <button onClick={() => setCompartiendo(libro.texto)} className="text-petroleo underline underline-offset-4">
                        Compartir con otro niño
                      </button>
                    )}
                    <button onClick={() => alLeer(libro, true)} className="text-tinta-suave underline underline-offset-4">
                      Solo mirar
                    </button>
                  </div>
                )}
                {puedeQuitar(libro) && (
                  <button
                    onClick={() => void quitar(libro)}
                    aria-label={`Quitar ${libro.texto.titulo}`}
                    className="absolute right-3 top-3 rounded-full p-2 text-tinta-suave hover:text-coral"
                  >
                    <Icono nombre="basura" className="h-5 w-5" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>
      {cambiandoNivel && (
        <DialogoNivel
          texto={cambiandoNivel.texto}
          perfil={perfil}
          asignacion={cambiandoNivel.asignacion}
          alCerrar={() => setCambiandoNivel(null)}
          alCambiar={() => {
            setCambiandoNivel(null)
            void cargar().then(setLibros)
          }}
        />
      )}
      {compartiendo && (
        <DialogoCompartir
          texto={compartiendo}
          perfiles={ninosDelAdulto}
          alCerrar={() => setCompartiendo(null)}
          alCambiar={() => void cargar().then(setLibros)}
        />
      )}
    </div>
  )
}
