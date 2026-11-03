import type pg from 'pg'
import { CUENTOS } from '../../src/contenido/cuentos.ts'

/**
 * Desbloqueo de la Cuncuna (especie `especie:cuncuna`, el id de
 * src/ciempi/v2/especie.ts en la rama de especies). Lo decide el servidor con
 * lo que él pagó, nunca con lo que dice la app. La regla vive en la función
 * SQL `cuncuna_motivo` (server/sql/013_e2_y_cuncuna.sql), que también usa la
 * migración para el desbloqueo retroactivo. Ver SEGURIDAD-MONEDAS.md §11.
 *
 * No depende de la economía (2.4.1 o E2): no da monedas.
 */
export const CUNCUNA = 'especie:cuncuna'

/** Los 8 cuentos originales de nivel 0 (los mismos que fija la migración 013). */
export const ORIGINALES_N0 = CUENTOS.filter((c) => c.nivel === 0).map((c) => c.id)

export const REGLA_CUNCUNA = {
  /** 6 de los 8 originales de N0, o 6 cuentos de Ciempi distintos de cualquier nivel. */
  cuentosMinimos: 6,
  /** Si un adulto le quitó cuentos de N0: todos los que tenga, con un mínimo de 4. */
  minimoSiQuitaron: 4,
  /** Lector muy lento: 60 min de lectura activa en N0 (acreditada con el reloj del servidor)… */
  segundosLento: 3600,
  /** …y además 30 frases distintas de N0 leídas (progreso, no solo tiempo). */
  frasesLento: 30,
}

export type MotivoDesbloqueo = 'nivel0' | 'cuentos' | 'lector_lento' | 'regalo'

export interface Desbloqueo {
  item: string
  motivo: MotivoDesbloqueo
  estado: 'por_celebrar' | 'celebrado'
  otorgadoEn: string
  celebradoEn: string | null
}

const aDesbloqueo = (f: Record<string, any>): Desbloqueo => ({
  item: f.item,
  motivo: f.motivo,
  estado: f.estado,
  otorgadoEn: f.otorgado_en,
  celebradoEn: f.celebrado_en ?? null,
})

/** Da `item` al niño (registro + inventario). Idempotente: si ya lo tenía, no hace nada y devuelve false. */
async function dar(c: pg.PoolClient | pg.Pool, perfilId: string, item: string, motivo: MotivoDesbloqueo, extra: { usuarioId?: string; detalle?: object } = {}) {
  const r = await c.query(
    `insert into desbloqueos (perfil_id, item, motivo, otorgado_por, detalle) values ($1, $2, $3, $4, $5)
     on conflict (perfil_id, item) do nothing`,
    [perfilId, item, motivo, extra.usuarioId ?? null, extra.detalle ?? {}],
  )
  await c.query('update perfiles_ninos set inventario = array_append(inventario, $2) where id = $1 and not ($2 = any (inventario))', [perfilId, item])
  return (r.rowCount ?? 0) > 0
}

/**
 * ¿Ya cumple la condición de la Cuncuna? Si recién la cumple, se la da (en la
 * transacción `c`) y devuelve el item; si no, null. Se llama después de cada
 * premio de un cuento de Ciempi y al consultar los desbloqueos.
 */
export async function revisarCuncuna(c: pg.PoolClient | pg.Pool, perfilId: string): Promise<string | null> {
  const ya = await c.query('select 1 from desbloqueos where perfil_id = $1 and item = $2', [perfilId, CUNCUNA])
  if (ya.rowCount) return null
  const R = REGLA_CUNCUNA
  const { rows } = await c.query('select cuncuna_motivo($1, $2::uuid[], $3, $4, $5, $6) as motivo', [
    perfilId,
    ORIGINALES_N0,
    R.cuentosMinimos,
    R.minimoSiQuitaron,
    R.segundosLento,
    R.frasesLento,
  ])
  const motivo = rows[0]?.motivo as MotivoDesbloqueo | null
  if (!motivo) return null
  // `dar` es idempotente: también sirve fuera de una transacción.
  return (await dar(c, perfilId, CUNCUNA, motivo)) ? CUNCUNA : null
}

/** Un adulto del niño se la regala, con un motivo (queda anotado). */
export async function regalarCuncuna(c: pg.PoolClient, perfilId: string, usuarioId: string, nota: string): Promise<boolean> {
  return dar(c, perfilId, CUNCUNA, 'regalo', { usuarioId, detalle: { nota } })
}

export async function listarDesbloqueos(c: pg.PoolClient | pg.Pool, perfilId: string): Promise<Desbloqueo[]> {
  const { rows } = await c.query('select * from desbloqueos where perfil_id = $1 order by otorgado_en', [perfilId])
  return rows.map(aDesbloqueo)
}

/** La app ya mostró la celebración especial: no se vuelve a mostrar. */
export async function marcarCelebrado(c: pg.PoolClient | pg.Pool, perfilId: string, item: string): Promise<Desbloqueo | null> {
  const { rows } = await c.query(
    `update desbloqueos set estado = 'celebrado', celebrado_en = coalesce(celebrado_en, now())
      where perfil_id = $1 and item = $2 returning *`,
    [perfilId, item],
  )
  return rows[0] ? aDesbloqueo(rows[0]) : null
}
