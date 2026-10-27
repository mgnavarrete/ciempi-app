import { readFile, readdir } from 'node:fs/promises'
import pg from 'pg'

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://ciempi:ciempi@localhost:5434/ciempi',
})

/**
 * Aplica, en orden y una sola vez, los archivos de server/sql/ (001_…, 002_…).
 * Cada uno corre en una transacción: si falla, no queda a medias.
 */
export async function migrar(): Promise<void> {
  await pool.query('create table if not exists migraciones (archivo text primary key, aplicada_en timestamptz not null default now())')
  const carpeta = new URL('../sql/', import.meta.url)
  const archivos = (await readdir(carpeta)).filter((f) => f.endsWith('.sql')).sort()
  const { rows } = await pool.query<{ archivo: string }>('select archivo from migraciones')
  const aplicadas = new Set(rows.map((r) => r.archivo))
  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) continue
    const sql = await readFile(new URL(archivo, carpeta), 'utf8')
    const cliente = await pool.connect()
    try {
      await cliente.query('begin')
      await cliente.query(sql)
      await cliente.query('insert into migraciones (archivo) values ($1)', [archivo])
      await cliente.query('commit')
    } catch (e) {
      await cliente.query('rollback')
      throw new Error(`Falló la migración ${archivo}: ${(e as Error).message}`)
    } finally {
      cliente.release()
    }
  }
}

/** Ejecuta `fn` dentro de una transacción. */
export async function enTransaccion<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const cliente = await pool.connect()
  try {
    await cliente.query('begin')
    const r = await fn(cliente)
    await cliente.query('commit')
    return r
  } catch (e) {
    await cliente.query('rollback')
    throw e
  } finally {
    cliente.release()
  }
}
