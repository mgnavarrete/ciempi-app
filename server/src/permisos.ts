import { pool } from './db.ts'
import type { UsuarioSesion } from './auth.ts'

/**
 * Reglas de acceso. Cada ruta del servidor las consulta antes de leer o escribir.
 *
 * - Un adulto es "admin" de los niños a los que está vinculado (miembros_nino).
 * - Un niño solo ve su propio perfil.
 * - Un texto lo ve quien lo subió y los que pueden ver a un niño que lo tiene en su biblioteca.
 *   Los cuentos de Ciempi los ve cualquiera.
 */

export class Prohibido extends Error {
  constructor(mensaje = 'No tienes acceso a esto') {
    super(mensaje)
  }
}

export async function esAdminDe(u: UsuarioSesion, perfilId: string): Promise<boolean> {
  if (u.tipo !== 'adulto') return false
  const { rowCount } = await pool.query('select 1 from miembros_nino where perfil_id = $1 and cuenta_id = $2', [perfilId, u.id])
  return (rowCount ?? 0) > 0
}

/** El propio niño o uno de sus adultos. */
export async function puedeVerNino(u: UsuarioSesion, perfilId: string): Promise<boolean> {
  if (u.tipo === 'nino') {
    const { rowCount } = await pool.query('select 1 from perfiles_ninos where id = $1 and usuario_id = $2', [perfilId, u.id])
    return (rowCount ?? 0) > 0
  }
  return esAdminDe(u, perfilId)
}

export async function puedeVerTexto(u: UsuarioSesion, textoId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `select 1 from textos t where t.id = $1 and (
       t.subido_por = $2
       or t.origen = 'ciempi'
       or exists (
         select 1 from asignaciones a
           left join miembros_nino m on m.perfil_id = a.perfil_id and m.cuenta_id = $2
           left join perfiles_ninos p on p.id = a.perfil_id and p.usuario_id = $2
          where a.texto_id = t.id and (m.cuenta_id is not null or p.id is not null)
       ))`,
    [textoId, u.id],
  )
  return (rowCount ?? 0) > 0
}

export async function exigirVerNino(u: UsuarioSesion, perfilId: string) {
  if (!(await puedeVerNino(u, perfilId))) throw new Prohibido('No tienes acceso a este niño')
}

export async function exigirAdminDe(u: UsuarioSesion, perfilId: string) {
  if (!(await esAdminDe(u, perfilId))) throw new Prohibido('Solo un adulto de este niño puede hacer esto')
}
