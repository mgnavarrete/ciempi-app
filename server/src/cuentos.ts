import { AUTOR_CUENTOS, CUENTOS } from '../../src/contenido/cuentos.ts'
import { dividirConParrafos } from '../../src/lenguaje/frases.ts'
import type pg from 'pg'
import { pool } from './db.ts'


/**
 * Deja los cuentos de Ciempi al día en la base (se llama al arrancar). Un
 * cuento que llega por primera vez se agrega a la biblioteca de todos los
 * niños que ya existen, en su nivel; si un adulto se lo quita a alguien, no
 * vuelve a aparecer.
 */
export async function sembrarCuentos(): Promise<void> {
  for (const c of CUENTOS) {
    const { frases, parrafos } = dividirConParrafos(c.texto)
    const capitulos = [{ titulo: c.titulo, desdeFrase: 0 }]
    const { rows } = await pool.query(
      `insert into textos (id, subido_por, titulo, autor, texto_original, frases, capitulos, parrafos, origen)
       values ($1, null, $2, $3, $4, $5, $6, $7, 'ciempi')
       on conflict (id) do update set titulo = excluded.titulo, autor = excluded.autor, texto_original = excluded.texto_original,
         frases = excluded.frases, capitulos = excluded.capitulos, parrafos = excluded.parrafos, actualizado_en = now()
       where textos.texto_original is distinct from excluded.texto_original or textos.titulo is distinct from excluded.titulo
       returning (xmax = 0) as nuevo`,
      [c.id, c.titulo, AUTOR_CUENTOS, c.texto, frases, JSON.stringify(capitulos), parrafos ?? null],
    )
    if (rows[0]?.nuevo) {
      await pool.query(
        `insert into asignaciones (asignada_por, perfil_id, texto_id, nivel)
         select creado_por, id, $1, $2 from perfiles_ninos on conflict (perfil_id, texto_id) do nothing`,
        [c.id, c.nivel],
      )
    }
  }
}

/** Un niño recién creado recibe todos los cuentos de Ciempi, cada uno en su nivel. */
export async function darCuentos(c: pg.PoolClient, perfilId: string, asignadaPor: string): Promise<void> {
  for (const cuento of CUENTOS) {
    await c.query(
      `insert into asignaciones (asignada_por, perfil_id, texto_id, nivel)
       select $1, $2, id, $4 from textos where id = $3 and origen = 'ciempi' on conflict (perfil_id, texto_id) do nothing`,
      [asignadaPor, perfilId, cuento.id, cuento.nivel],
    )
  }
}
