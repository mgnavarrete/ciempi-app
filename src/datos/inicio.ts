import { nuevoId } from '../dominio/ids'
import type { Capitulo, Id, Texto } from '../dominio/tipos'
import { dividirConParrafos } from '../lenguaje/frases'
import type { Repositorios } from './repositorios'

/**
 * Primera vez sin conexión: crea un lector para probar la lectura de
 * inmediato. Al crearse, recibe los cuentos de Ciempi en su biblioteca.
 */
export async function prepararCuentaNueva(repos: Repositorios): Promise<void> {
  const perfiles = await repos.perfiles.listar()
  if (perfiles.length > 0) return
  await repos.perfiles.crear({ apodo: 'Lector', icono: '🐛' })
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
    parrafos?: number[]
    portada?: string | null
  },
): Texto {
  // Sin frases ya revisadas, se dividen respetando los párrafos (líneas en blanco).
  const division = datos.frases ? { frases: datos.frases, parrafos: datos.parrafos } : dividirConParrafos(datos.textoOriginal)
  const fecha = new Date().toISOString()
  const titulo = datos.titulo.trim() || 'Sin título'
  return {
    id: nuevoId(),
    subidoPor,
    titulo,
    autor: datos.autor?.trim() || null,
    textoOriginal: datos.textoOriginal,
    frases: division.frases,
    capitulos: datos.capitulos ?? [{ titulo, desdeFrase: 0 }],
    ...(division.parrafos ? { parrafos: division.parrafos } : {}),
    portada: datos.portada ?? null,
    origen: datos.origen,
    creadoEn: fecha,
    actualizadoEn: fecha,
  }
}
