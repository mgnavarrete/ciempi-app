import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { pool } from './db.ts'

const scryptAsync = promisify(scrypt) as (clave: string, sal: Buffer, largo: number, opciones: object) => Promise<Buffer>
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }

/** Clave → "scrypt$<sal>$<hash>" (scrypt viene en Node, sin dependencias nativas). */
export async function cifrarClave(clave: string): Promise<string> {
  const sal = randomBytes(16)
  const hash = await scryptAsync(clave, sal, 32, SCRYPT)
  return `scrypt$${sal.toString('base64')}$${hash.toString('base64')}`
}

export async function verificarClave(clave: string, guardada: string): Promise<boolean> {
  const [algoritmo, sal, hash] = guardada.split('$')
  if (algoritmo !== 'scrypt' || !sal || !hash) return false
  const esperado = Buffer.from(hash, 'base64')
  const real = await scryptAsync(clave, Buffer.from(sal, 'base64'), esperado.length, SCRYPT)
  return timingSafeEqual(real, esperado)
}

/** Claves de niños: cortas para que las recuerden. Adultos: más largas. */
export const MIN_CLAVE_NINO = 6
export const MIN_CLAVE_ADULTO = 8

export const normalizarUsuario = (u: string) => u.trim().toLowerCase()
export const usuarioValido = (u: string) => /^[a-z0-9][a-z0-9._-]{2,19}$/.test(u)
export const normalizarCorreo = (c: string) => c.trim().toLowerCase()
export const correoValido = (c: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) && c.length <= 200

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

// ── Sesiones ────────────────────────────────────────────────────────────
// Un niño no debería tener que escribir su clave seguido: 90 días, renovados con el uso.
export const DIAS_SESION = 90

export async function crearSesion(usuarioId: string, userAgent: string): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await pool.query(
    `insert into sesiones (token_hash, usuario_id, expira_en, user_agent) values ($1, $2, now() + make_interval(days => $3), $4)`,
    [sha256(token), usuarioId, DIAS_SESION, userAgent.slice(0, 300)],
  )
  await pool.query('update usuarios set ultimo_ingreso = now() where id = $1', [usuarioId])
  return token
}

export interface UsuarioSesion {
  id: string
  tipo: 'adulto' | 'nino'
  correo: string | null
  usuario: string | null
}

/** Dueño del token, o null si no existe o venció. */
export async function usuarioDeSesion(token: string | undefined): Promise<UsuarioSesion | null> {
  if (!token) return null
  const { rows } = await pool.query<UsuarioSesion & { expira_en: Date }>(
    `select u.id, u.tipo, u.correo, u.usuario, s.expira_en from sesiones s join usuarios u on u.id = s.usuario_id
      where s.token_hash = $1 and s.expira_en > now()`,
    [sha256(token)],
  )
  const fila = rows[0]
  if (!fila) return null
  // Renueva la sesión cuando le queda menos de la mitad.
  if (fila.expira_en.getTime() - Date.now() < (DIAS_SESION / 2) * 86400_000) {
    await pool.query('update sesiones set expira_en = now() + make_interval(days => $2) where token_hash = $1', [sha256(token), DIAS_SESION])
  }
  return { id: fila.id, tipo: fila.tipo, correo: fila.correo, usuario: fila.usuario }
}

export async function borrarSesion(token: string | undefined): Promise<void> {
  if (token) await pool.query('delete from sesiones where token_hash = $1', [sha256(token)])
}

/** Al cambiar una clave se cierran las demás sesiones de ese usuario. */
export async function cerrarOtrasSesiones(usuarioId: string, salvoToken?: string): Promise<void> {
  await pool.query('delete from sesiones where usuario_id = $1 and token_hash <> $2', [usuarioId, salvoToken ? sha256(salvoToken) : ''])
}

// ── Recuperar contraseña (adultos) ──────────────────────────────────────

export async function crearRecuperacion(usuarioId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await pool.query(`insert into recuperaciones (token_hash, usuario_id, expira_en) values ($1, $2, now() + interval '1 hour')`, [sha256(token), usuarioId])
  return token
}

/** Consume el enlace (un solo uso) y devuelve de quién era, o null si no sirve. */
export async function usarRecuperacion(token: string): Promise<string | null> {
  const { rows } = await pool.query<{ usuario_id: string }>(
    `update recuperaciones set usada = true where token_hash = $1 and not usada and expira_en > now() returning usuario_id`,
    [sha256(token)],
  )
  return rows[0]?.usuario_id ?? null
}

// ── Límite de intentos (en memoria; basta para un solo servidor) ────────

const fallos = new Map<string, { cuenta: number; hasta: number }>()
const MAX_FALLOS = 5
const BLOQUEO_MS = 5 * 60_000

export function estaBloqueado(clave: string): boolean {
  const f = fallos.get(clave)
  return !!f && f.cuenta >= MAX_FALLOS && f.hasta > Date.now()
}

export function registrarFallo(clave: string): void {
  const f = fallos.get(clave)
  const cuenta = f && f.hasta > Date.now() ? f.cuenta + 1 : 1
  fallos.set(clave, { cuenta, hasta: Date.now() + BLOQUEO_MS })
}

export function limpiarFallos(clave: string): void {
  fallos.delete(clave)
}
