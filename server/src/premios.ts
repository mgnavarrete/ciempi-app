import { createHash, randomUUID } from 'node:crypto'
import type pg from 'pg'
import type { NivelLectura } from '../../src/dominio/tipos.ts'
import { REGLAS_MONEDAS } from '../../src/lectura/monedas.ts'
import { calcularPremio, combinarEstados, normalizarParaHuella, revisarRitmo, type EstadoPremios, type SolicitudPremio } from '../../src/lectura/premios.ts'
import { vistaPorNivel, type VistaPorNivel } from '../../src/lenguaje/unidades.ts'

/**
 * Registro de premios (ledger). Las monedas por leer las calcula el servidor
 * con src/lectura/monedas.ts y src/lectura/premios.ts: la app solo dice hasta
 * dónde leyó. Cada pedido trae un `operationId` (lo genera la app); el mismo
 * pedido dos veces responde lo mismo y paga una sola vez.
 *
 * Todo en una transacción y con la fila del niño bloqueada (FOR UPDATE): dos
 * dispositivos del mismo niño, un premio y una compra a la vez, se atienden de
 * a uno y el saldo nunca queda negativo (además lo asegura la base).
 */

/** Pedir de nuevo más tarde: se pidió más rápido de lo que se puede leer. */
export class Esperar extends Error {
  segundos: number
  constructor(segundos: number) {
    super('Más rápido de lo que se puede leer: se pagará en un momento')
    this.segundos = segundos
  }
}

/** La asignación ya no existe (quitaron el libro). */
export class SinAsignacion extends Error {
  constructor() {
    super('Ese libro ya no está en la biblioteca')
  }
}

export const huellaDe = (frases: string[]) => createHash('sha256').update(normalizarParaHuella(frases)).digest('hex')

/** AAAA-MM-DD en UTC: la relectura acepta la fecha del dispositivo si es de estos días (ver diaValido). */
export const diaUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** Una columna date como AAAA-MM-DD (pg la entrega como Date a medianoche local). */
export const fechaDia = (d: Date | string | null | undefined): string | null => {
  if (!d) return null
  if (typeof d === 'string') return d.slice(0, 10)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Fila = Record<string, any>

// Las unidades de un libro en un nivel (un libro largo tarda en armarse): las últimas, guardadas.
const vistas = new Map<string, VistaPorNivel>()
function vistaDe(t: Fila, nivel: NivelLectura): VistaPorNivel {
  const clave = `${t.id}:${new Date(t.actualizado_en).getTime()}:${nivel}`
  let v = vistas.get(clave)
  if (!v) {
    v = vistaPorNivel({ frases: t.frases, capitulos: t.capitulos ?? [], parrafos: t.parrafos ?? undefined }, nivel)
    vistas.set(clave, v)
    if (vistas.size > 100) vistas.delete(vistas.keys().next().value!)
  }
  return v
}

/**
 * Con qué se recuerda lo ya pagado de un texto para un niño, aunque se borre
 * la asignación o el texto: un cuento de Ciempi por su id; lo demás, por la
 * huella de su contenido (subir de nuevo el mismo texto no vuelve a pagar).
 */
export async function claveDe(c: pg.PoolClient, t: Fila): Promise<string> {
  if (t.origen === 'ciempi') return `texto:${t.id}`
  let h = t.huella as string | null
  if (!h) {
    h = huellaDe(t.frases)
    await c.query('update textos set huella = $1 where id = $2 and huella is null', [h, t.id])
  }
  return `huella:${h}`
}

const estadoDeAsignacion = (a: Fila): EstadoPremios => ({
  pagadoHasta: a.pagado_hasta ?? 0,
  hitosHasta: a.premio_hasta ?? 0,
  relecturaDia: fechaDia(a.relectura_premiada_en),
})

/** Guarda (sin bajar nada) lo ya pagado de un texto para un niño. */
async function recordar(c: pg.PoolClient, perfilId: string, clave: string, e: EstadoPremios) {
  await c.query(
    `insert into lecturas_premiadas (perfil_id, clave, pagado_hasta, hitos_hasta, relectura_dia) values ($1, $2, $3, $4, $5::date)
     on conflict (perfil_id, clave) do update set
       pagado_hasta = greatest(lecturas_premiadas.pagado_hasta, excluded.pagado_hasta),
       hitos_hasta = greatest(lecturas_premiadas.hitos_hasta, excluded.hitos_hasta),
       relectura_dia = greatest(lecturas_premiadas.relectura_dia, excluded.relectura_dia),
       actualizado_en = now()`,
    [perfilId, clave, e.pagadoHasta, e.hitosHasta, e.relecturaDia],
  )
}

/**
 * Antes de borrar un texto, una asignación o cambiar el contenido de un texto:
 * lo ya pagado queda recordado por texto (ver claveDe).
 */
export async function recordarLecturas(c: pg.PoolClient, filtro: { textoId: string } | { asignacionId: string }) {
  const { rows } = await c.query(
    `select a.perfil_id, a.pagado_hasta, a.premio_hasta, a.relectura_premiada_en, t.id, t.origen, t.frases, t.huella
       from asignaciones a join textos t on t.id = a.texto_id
      where ${'textoId' in filtro ? 'a.texto_id' : 'a.id'} = $1`,
    ['textoId' in filtro ? filtro.textoId : filtro.asignacionId],
  )
  for (const f of rows) {
    if (!f.pagado_hasta && !f.premio_hasta && !f.relectura_premiada_en) continue
    await recordar(c, f.perfil_id, await claveDe(c, f), estadoDeAsignacion(f))
  }
}

export interface PedidoPremio {
  perfilId: string
  asignacionId: string
  usuarioId: string
  operationId: string
  solicitud: SolicitudPremio
  /** Lo que la app creía que ganaba (solo queda anotado). */
  solicitadas: number | null
  /** 'app': POST /premios; 'legado': derivado del progreso que manda una app anterior. */
  origen: 'app' | 'legado'
}

export interface RespuestaPremio {
  /** 'repetido': ese operationId ya se había atendido (se responde lo mismo, no se paga otra vez). */
  estado: 'otorgado' | 'repetido'
  otorgadas: number
  /** Saldo del niño después del premio. */
  monedas: number
  motivo: string
  asignacion: Fila
}

/**
 * Atiende un pedido de premio dentro de la transacción `c`. Lanza `Esperar`
 * si se pide más rápido de lo que se puede leer (la app lo reintenta después)
 * y `SinAsignacion` si el libro ya no está.
 */
export async function otorgarPremio(c: pg.PoolClient, p: PedidoPremio, ahora: number): Promise<RespuestaPremio> {
  // Un premio (o una compra) a la vez por niño.
  const { rows: perfiles } = await c.query('select monedas, premios_reloj from perfiles_ninos where id = $1 for update', [p.perfilId])
  const perfil = perfiles[0]
  if (!perfil) throw new SinAsignacion()

  const { rows: antes } = await c.query('select monedas, detalle from premios where perfil_id = $1 and operation_id = $2', [p.perfilId, p.operationId])
  if (antes[0]) {
    const { rows } = await c.query('select * from asignaciones where id = $1', [p.asignacionId])
    return { estado: 'repetido', otorgadas: antes[0].monedas, monedas: perfil.monedas, motivo: antes[0].detalle?.motivo ?? '', asignacion: rows[0] ?? {} }
  }

  const { rows: asignaciones } = await c.query('select * from asignaciones where id = $1 and perfil_id = $2 for update', [p.asignacionId, p.perfilId])
  const a = asignaciones[0]
  if (!a) throw new SinAsignacion()
  const { rows: textos } = await c.query('select id, origen, frases, capitulos, parrafos, huella, actualizado_en from textos where id = $1', [a.texto_id])
  const t = textos[0]
  const clave = await claveDe(c, t)
  const { rows: lecturas } = await c.query('select * from lecturas_premiadas where perfil_id = $1 and clave = $2 for update', [p.perfilId, clave])
  const l = lecturas[0]
  const previo = combinarEstados(
    estadoDeAsignacion(a),
    l && { pagadoHasta: l.pagado_hasta, hitosHasta: l.hitos_hasta, relecturaDia: fechaDia(l.relectura_dia) },
  )

  const nivel = a.nivel as NivelLectura
  const calculo = calcularPremio(t as never, nivel, previo, p.solicitud, { hoy: diaUtc(ahora), vista: vistaDe(t, nivel) })

  let reloj: number | null = perfil.premios_reloj ? new Date(perfil.premios_reloj).getTime() : null
  if (calculo.monedas > 0) {
    const r = revisarRitmo(reloj, ahora, calculo.costoSegundos)
    if (!r.ok) throw new Esperar(r.esperarSegundos)
    reloj = r.reloj
  }

  const saldo = perfil.monedas + calculo.monedas
  await c.query('update perfiles_ninos set monedas = $1, premios_reloj = $2 where id = $3', [saldo, reloj === null ? null : new Date(reloj), p.perfilId])
  const e = calculo.estado
  const { rows: actualizada } = await c.query(
    `update asignaciones set pagado_hasta = greatest(pagado_hasta, $2), leido_hasta = greatest(leido_hasta, $2),
       premio_hasta = greatest(premio_hasta, $3), relectura_premiada_en = greatest(relectura_premiada_en, $4::date)
     where id = $1 returning *`,
    [a.id, e.pagadoHasta, e.hitosHasta, e.relecturaDia],
  )
  await recordar(c, p.perfilId, clave, e)
  await c.query(
    `insert into premios (perfil_id, operation_id, asignacion_id, usuario_id, tipo, nivel, hasta, solicitadas, monedas, saldo, detalle)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      p.perfilId,
      p.operationId,
      a.id,
      p.usuarioId,
      p.solicitud.tipo,
      nivel,
      p.solicitud.tipo === 'avance' ? Math.max(0, Math.floor(p.solicitud.hasta)) : null,
      p.solicitadas,
      calculo.monedas,
      saldo,
      {
        motivo: calculo.motivo,
        origen: p.origen,
        reglas: REGLAS_MONEDAS.version,
        unidades: calculo.unidades,
        hitos: calculo.hitos.map((h) => h.porcentaje),
        costoSegundos: Math.round(calculo.costoSegundos * 10) / 10,
        ...(p.solicitud.tipo === 'relectura' ? { dia: p.solicitud.dia } : {}),
        ...(p.solicitud.tipo === 'avance' && !p.solicitud.conPremio ? { sinPremioUltima: true } : {}),
      },
    ],
  )
  return { estado: 'otorgado', otorgadas: calculo.monedas, monedas: saldo, motivo: calculo.motivo, asignacion: actualizada[0] }
}

/**
 * Un adulto del niño suma o resta monedas a mano, con un motivo. Nunca deja
 * el saldo bajo cero: se resta lo que hay (y queda anotado lo que se restó).
 */
export async function ajustarMonedas(
  c: pg.PoolClient,
  datos: { perfilId: string; usuarioId: string; cantidad: number; motivo: string; operationId?: string },
): Promise<{ monedas: number; otorgadas: number }> {
  const { rows } = await c.query('select monedas from perfiles_ninos where id = $1 for update', [datos.perfilId])
  const operationId = datos.operationId ?? `ajuste-${randomUUID()}`
  const { rows: antes } = await c.query('select monedas from premios where perfil_id = $1 and operation_id = $2', [datos.perfilId, operationId])
  if (antes[0]) return { monedas: rows[0].monedas, otorgadas: antes[0].monedas }
  const saldo = Math.max(0, rows[0].monedas + datos.cantidad)
  const real = saldo - rows[0].monedas
  await c.query('update perfiles_ninos set monedas = $1 where id = $2', [saldo, datos.perfilId])
  await c.query(
    `insert into premios (perfil_id, operation_id, usuario_id, tipo, solicitadas, monedas, saldo, detalle) values ($1, $2, $3, 'ajuste', $4, $5, $6, $7)`,
    [datos.perfilId, operationId, datos.usuarioId, datos.cantidad, real, saldo, { motivo: datos.motivo }],
  )
  return { monedas: saldo, otorgadas: real }
}

/** Una app anterior pidió monedas con el endpoint viejo: no se pagan (salen de su progreso), pero se anota para saber cuántas quedan. */
export async function anotarLegado(c: pg.PoolClient, datos: { perfilId: string; usuarioId: string; cantidad: number }): Promise<number> {
  const { rows } = await c.query('select monedas from perfiles_ninos where id = $1', [datos.perfilId])
  await c.query(
    `insert into premios (perfil_id, operation_id, usuario_id, tipo, solicitadas, monedas, saldo, detalle) values ($1, $2, $3, 'legado', $4, 0, $5, '{}')`,
    [datos.perfilId, `legado-${randomUUID()}`, datos.usuarioId, datos.cantidad, rows[0].monedas],
  )
  return rows[0].monedas
}
