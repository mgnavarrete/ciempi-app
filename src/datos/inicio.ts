import { TEXTO_EJEMPLO } from '../contenido/ejemplo'
import { nuevoId } from '../dominio/ids'
import type { Capitulo, Id, Texto } from '../dominio/tipos'
import { dividirEnFrases } from '../lenguaje/frases'
import type { Repositorios } from './repositorios'

/**
 * Primera vez en una cuenta: crea un niño y le deja el cuento de ejemplo
 * en su biblioteca, para que se pueda probar la lectura de inmediato.
 */
export async function prepararCuentaNueva(repos: Repositorios, usuarioId: Id): Promise<void> {
  const perfiles = await repos.perfiles.listar()
  if (perfiles.length > 0) return
  const perfil = await repos.perfiles.crear({ apodo: 'Lector', icono: '🐛' })
  const texto =
    (await repos.textos.listar())[0] ??
    (await repos.textos.guardar(crearTexto(usuarioId, { titulo: TEXTO_EJEMPLO.titulo, textoOriginal: TEXTO_EJEMPLO.texto, origen: 'ejemplo' })))
  await repos.asignaciones.asignar(perfil.id, texto.id)
}

export function crearTexto(
  subidoPor: Id,
  datos: {
    titulo: string
    textoOriginal: string
    origen: Texto['origen']
    autor?: string | null
    frases?: string[]
    capitulos?: Capitulo[]
    portada?: string | null
  },
): Texto {
  const fecha = new Date().toISOString()
  const titulo = datos.titulo.trim() || 'Sin título'
  return {
    id: nuevoId(),
    subidoPor,
    titulo,
    autor: datos.autor?.trim() || null,
    textoOriginal: datos.textoOriginal,
    frases: datos.frases ?? dividirEnFrases(datos.textoOriginal),
    capitulos: datos.capitulos ?? [{ titulo, desdeFrase: 0 }],
    portada: datos.portada ?? null,
    origen: datos.origen,
    creadoEn: fecha,
    actualizadoEn: fecha,
  }
}
