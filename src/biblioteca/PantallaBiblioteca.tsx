import { TarjetaCarga } from '../adultos/AgregarLibro'
import { useCargasDeLibros } from '../adultos/cargas'
import { useCallback, useEffect, useState } from 'react'
import { DialogoCompartir, DialogoNivel } from '../adultos/LectoresDelLibro'
import { AvisoVoz } from '../audio/AvisoVoz'
import { PortadaCiempi } from '../ciempi/PortadaCiempi'
import { useRepositorios } from '../datos/DatosProvider'
import type { Asignacion, Id, NivelLectura, PerfilNino, Texto } from '../dominio/tipos'
import { NIVELES, datosNivel } from '../lenguaje/unidades'
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
  // Ver todos los libros o solo los de un nivel.
  const [filtro, setFiltro] = useState<NivelLectura | 'todos'>('todos')

  const cargar = useCallback(async () => {
    const asignaciones = await repos.asignaciones.listarPorPerfil(perfil.id)
    const conTexto = await Promise.all(
      asignaciones.filter((a) => a.estado !== 'archivada').map(async (asignacion) => ({ asignacion, texto: await repos.textos.obtener(asignacion.textoId) })),
    )
    // Primero lo que todavía no termina (de los niveles más fáciles a los más difíciles) y al final lo terminado.
    return conTexto
      .filter((l): l is LibroEnBiblioteca => l.texto !== null)
      .sort(
        (a, b) =>
          Number(resumirProgreso(a.asignacion, a.texto).terminado) - Number(resumirProgreso(b.asignacion, b.texto).terminado) ||
          (a.asignacion.nivel ?? 1) - (b.asignacion.nivel ?? 1),
      )
  }, [repos, perfil.id])

  // Libros que se están agregando para este niño: aparecen arriba y, al quedar listos, en la lista.
  const { cargas, descartar } = useCargasDeLibros()
  const susCargas = cargas.filter((c) => c.perfiles.includes(perfil.id))
  const listos = susCargas.filter((c) => c.estado === 'listo').length

  useEffect(() => {
    let vigente = true
    void cargar().then((l) => vigente && setLibros(l))
    return () => {
      vigente = false
    }
  }, [cargar, listos])

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

        {susCargas.length > 0 && (
          <ul className="mb-4 flex flex-col gap-2">
            {susCargas.map((c) => (
              <TarjetaCarga key={c.id} carga={c} alDescartar={() => descartar(c.id)} />
            ))}
          </ul>
        )}

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

        {libros && libros.length > 0 && (
          <div role="group" aria-label="Ver por nivel" className="-mx-1 mb-4 flex flex-wrap gap-2">
            {(['todos', ...NIVELES.map((n) => n.nivel)] as const).map((f) => {
              const cuantos = f === 'todos' ? libros.length : libros.filter((l) => l.asignacion.nivel === f).length
              const elegido = filtro === f
              return (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  aria-pressed={elegido}
                  disabled={cuantos === 0 && !elegido}
                  className={`rounded-full px-4 py-1.5 font-bold shadow-sm transition active:scale-95 disabled:opacity-40 ${elegido ? 'bg-petroleo text-white' : 'bg-white text-tinta'}`}
                >
                  {f === 'todos' ? 'Todos' : `Nivel ${f}`}
                  <span className={`ml-1.5 text-sm font-normal ${elegido ? 'text-white/80' : 'text-tinta-suave'}`}>{cuantos}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Todas las tarjetas del mismo ancho y alto (la fila más alta manda), para que se vea ordenado. */}
        <ul className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 apaisado:grid-cols-2">
          {libros?.filter((l) => filtro === 'todos' || l.asignacion.nivel === filtro).map((libro) => {
            const resumen = resumirProgreso(libro.asignacion, libro.texto)
            // Niveles 0 y 1: cuentos cortos, sin porcentaje; solo si ya lo terminó.
            const conAvance = !resumen.terminado && (libro.asignacion.nivel >= 2 || resumen.capitulo !== null)
            return (
              <li key={libro.asignacion.id} className="relative flex flex-col">
                <button
                  onClick={() => alLeer(libro)}
                  className="flex w-full flex-1 items-stretch gap-4 rounded-3xl bg-white p-3 text-left shadow-sm transition active:scale-[0.98]"
                >
                  <span className="relative shrink-0">
                    <Portada titulo={libro.texto.titulo} portada={libro.texto.portada} className="h-32 w-24" />
                    {resumen.terminado && (
                      <span
                        title="¡Lo terminaste!"
                        className="absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full bg-amarillo text-xl shadow-md ring-2 ring-white"
                      >
                        ⭐
                      </span>
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1 py-1 pr-8">
                    <span className="line-clamp-2 text-lg font-bold leading-tight">{libro.texto.titulo}</span>
                    {libro.texto.autor && <span className="truncate text-sm text-tinta-suave">{libro.texto.autor}</span>}
                    <span className="mt-auto flex flex-wrap items-center gap-x-2 text-sm text-tinta-suave">
                      <span className="rounded-full bg-amarillo/40 px-2 font-bold text-tinta">
                        Nivel {libro.asignacion.nivel} · {datosNivel(libro.asignacion.nivel).nombre}
                      </span>
                      {resumen.terminado ? '¡Terminado!' : conAvance && resumen.fraccion > 0 ? resumen.etiqueta : ''}
                    </span>
                    {conAvance && resumen.fraccion > 0 && <BarraProgreso valor={resumen.fraccion} />}
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
