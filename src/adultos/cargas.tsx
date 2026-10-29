import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { useRepositorios } from '../datos/DatosProvider'
import { crearTexto } from '../datos/inicio'
import type { Id, NivelLectura, Texto } from '../dominio/tipos'
import { extraerPdf, tieneTexto } from '../fuentes/pdf'
import { nivelSugerido } from '../lenguaje/dificultad'
import { dividirConParrafos } from '../lenguaje/frases'
import { frasesDelLibro, procesarPaginas } from '../lenguaje/libro'

/** Un libro que se está agregando: aparece en el panel como «Cargando…» hasta quedar listo. */
export interface CargaDeLibro {
  id: string
  titulo: string
  estado: 'cargando' | 'listo' | 'error'
  /** Qué está haciendo («Leyendo página 3 de 40»…). */
  detalle: string
  error?: string
  texto?: Texto
}

interface Pedido {
  /** Quién lo sube (queda como su dueño). */
  usuarioId: Id
  /** A qué alumnos se les deja (por defecto, todos). */
  perfiles: Id[]
  /** Nivel elegido; si no, el sugerido según el texto. */
  nivel: NivelLectura | null
}

interface Cargas {
  cargas: CargaDeLibro[]
  agregarPdf: (archivo: File, pedido: Pedido) => void
  agregarPegado: (titulo: string, contenido: string, pedido: Pedido) => void
  descartar: (id: string) => void
}

const Contexto = createContext<Cargas>({ cargas: [], agregarPdf: () => {}, agregarPegado: () => {}, descartar: () => {} })
export const useCargasDeLibros = () => useContext(Contexto)

/**
 * Agrega libros en segundo plano: el adulto vuelve al panel apenas los elige
 * y la tarjeta del libro muestra el avance. Vive sobre todas las pantallas,
 * así la carga sigue aunque cambie de pantalla (pero no si cierra la app).
 */
export function CargasProvider({ children }: { children: ReactNode }) {
  const repos = useRepositorios()
  const [cargas, setCargas] = useState<CargaDeLibro[]>([])
  const siguiente = useRef(0)

  const actualizar = useCallback((id: string, cambios: Partial<CargaDeLibro>) => setCargas((cs) => cs.map((c) => (c.id === id ? { ...c, ...cambios } : c))), [])

  const procesar = useCallback(
    (titulo: string, pedido: Pedido, preparar: (avance: (detalle: string) => void) => Promise<Texto>) => {
      const id = `carga-${++siguiente.current}`
      setCargas((cs) => [{ id, titulo, estado: 'cargando', detalle: 'Preparando…' }, ...cs])
      void (async () => {
        try {
          const texto = await preparar((detalle) => actualizar(id, { detalle }))
          actualizar(id, { titulo: texto.titulo, detalle: 'Guardando…' })
          const guardado = await repos.textos.guardar(texto)
          const nivel = pedido.nivel ?? nivelSugerido(guardado.frases, guardado.parrafos)
          actualizar(id, { detalle: 'Dejándolo en las bibliotecas…' })
          await Promise.all(pedido.perfiles.map((p) => repos.asignaciones.asignar(p, guardado.id, nivel)))
          actualizar(id, { estado: 'listo', detalle: 'Listo para leer', texto: guardado })
        } catch (e) {
          actualizar(id, { estado: 'error', detalle: 'No se pudo agregar', error: (e as Error).message })
        }
      })()
    },
    [repos, actualizar],
  )

  const agregarPdf = useCallback(
    (archivo: File, pedido: Pedido) =>
      procesar(archivo.name.replace(/\.pdf$/i, ''), pedido, async (avance) => {
        const pdf = await extraerPdf(archivo, (pagina, total) => avance(`Leyendo página ${pagina} de ${total}`))
        if (!tieneTexto(pdf)) throw new Error('Este PDF no tiene texto seleccionable (parece escaneado).')
        avance('Separando capítulos y frases…')
        // Desde la primera página con texto de verdad (se saltan portada e índice).
        const primera = pdf.paginas.findIndex((p) => p.lineas.join(' ').trim().length > 300)
        const capitulos = procesarPaginas(pdf.paginas.slice(Math.max(0, primera)))
        const { frases, capitulos: indice, parrafos } = frasesDelLibro(capitulos)
        if (!frases.length) throw new Error('No se encontraron frases en el PDF.')
        return crearTexto(pedido.usuarioId, {
          titulo: pdf.titulo || archivo.name.replace(/\.pdf$/i, ''),
          autor: pdf.autor,
          origen: 'pdf',
          textoOriginal: capitulos.map((c) => `${c.titulo}\n${c.texto}`).join('\n\n'),
          frases,
          capitulos: indice,
          parrafos,
          portada: pdf.portada,
        })
      }),
    [procesar],
  )

  const agregarPegado = useCallback(
    (titulo: string, contenido: string, pedido: Pedido) =>
      procesar(titulo || 'Texto sin título', pedido, async (avance) => {
        avance('Separando frases…')
        const { frases, parrafos } = dividirConParrafos(contenido)
        if (!frases.length) throw new Error('El texto está vacío.')
        return crearTexto(pedido.usuarioId, { titulo: titulo || frases[0].slice(0, 40), textoOriginal: contenido, origen: 'pegado', frases, parrafos })
      }),
    [procesar],
  )

  const descartar = useCallback((id: string) => setCargas((cs) => cs.filter((c) => c.id !== id)), [])

  return <Contexto.Provider value={{ cargas, agregarPdf, agregarPegado, descartar }}>{children}</Contexto.Provider>
}
