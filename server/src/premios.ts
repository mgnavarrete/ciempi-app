import { createHash, randomUUID } from 'node:crypto'
import type pg from 'pg'
import type { NivelLectura } from '../../src/dominio/tipos.ts'
import { reglasDe, type ModeloEconomia } from '../../src/lectura/monedas.ts'
import {
  acreditarActividad,
  calcularPremio,
  combinarEstados,
  normalizarParaHuella,
  revisarRelojE2,
  revisarRitmo,
  type CalculoPremio,
  type EstadoPremios,
  type OpcionesPremio,
  type SolicitudPremio,
} from '../../src/lectura/premios.ts'
import { nivelSugerido } from '../../src/lenguaje/dificultad.ts'
import { vistaPorNivel, type VistaPorNivel } from '../../src/lenguaje/unidades.ts'
import { revisarCuncuna } from './desbloqueos.ts'

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

/**
 * Guarda (sin bajar nada) lo ya pagado de un texto para un niño. Los campos E2
 * solo cambian si vienen (con 2.4.1 quedan como estaban); la fracción es la
 * única que puede bajar (se pagó una moneda entera). `actividad`: segundos de
 * lectura activa que se suman (vía del lector lento a la Cuncuna).
 */
async function recordar(c: pg.PoolClient, perfilId: string, clave: string, e: EstadoPremios, actividad = 0) {
  await c.query(
    `insert into lecturas_premiadas (perfil_id, clave, pagado_hasta, hitos_hasta, relectura_dia,
       fraccion, libro_premiado, activo_libro_segundos, mejor_tropiezos, segundos_actividad)
     values ($1, $2, $3, $4, $5::date, coalesce($6, 0), coalesce($7, false), coalesce($8, 0), $9, $10)
     on conflict (perfil_id, clave) do update set
       pagado_hasta = greatest(lecturas_premiadas.pagado_hasta, excluded.pagado_hasta),
       hitos_hasta = greatest(lecturas_premiadas.hitos_hasta, excluded.hitos_hasta),
       relectura_dia = greatest(lecturas_premiadas.relectura_dia, excluded.relectura_dia),
       fraccion = coalesce($6, lecturas_premiadas.fraccion),
       libro_premiado = lecturas_premiadas.libro_premiado or excluded.libro_premiado,
       activo_libro_segundos = greatest(lecturas_premiadas.activo_libro_segundos, excluded.activo_libro_segundos),
       mejor_tropiezos = least(lecturas_premiadas.mejor_tropiezos, excluded.mejor_tropiezos),
       segundos_actividad = lecturas_premiadas.segundos_actividad + excluded.segundos_actividad,
       actualizado_en = now()`,
    [
      perfilId,
      clave,
      e.pagadoHasta,
      e.hitosHasta,
      e.relecturaDia,
      e.fraccion ?? null,
      e.libroPremiado ?? null,
      e.activoLibroSegundos ?? null,
      e.mejorTropiezos ?? null,
      actividad,
    ],
  )
}

/** Lo guardado por texto (incluido el estado E2) como EstadoPremios. */
const estadoDeLectura = (l: Fila | undefined): Partial<EstadoPremios> | null =>
  l
    ? {
        pagadoHasta: l.pagado_hasta,
        hitosHasta: l.hitos_hasta,
        relecturaDia: fechaDia(l.relectura_dia),
        fraccion: l.fraccion ?? 0,
        libroPremiado: !!l.libro_premiado,
        activoLibroSegundos: l.activo_libro_segundos ?? 0,
        mejorTropiezos: l.mejor_tropiezos ?? null,
      }
    : null

// La dificultad real de un texto que no es de la biblioteca (nivel sugerido), guardada por versión.
const sugeridos = new Map<string, NivelLectura>()
function nivelDelTexto(t: Fila): NivelLectura {
  const clave = `${t.id}:${new Date(t.actualizado_en).getTime()}`
  let n = sugeridos.get(clave)
  if (n === undefined) {
    n = nivelSugerido(t.frases, t.parrafos ?? undefined) as NivelLectura
    sugeridos.set(clave, n)
    if (sugeridos.size > 200) sugeridos.delete(sugeridos.keys().next().value!)
  }
  return n
}

/** E2: con qué nivel se calcula lo esperado. Los cuentos de Ciempi tienen el nivel curado; lo demás, el más exigente. */
export function nivelDeReferencia(t: Fila, asignado: NivelLectura): NivelLectura {
  if (t.origen === 'ciempi') return asignado
  return Math.max(asignado, nivelDelTexto(t)) as NivelLectura
}

/** E2: la ventana en que se busca la relectura de verdad (unidades releídas) antes de «releí el libro entero». */
const HORAS_RELECTURA = 6

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
  /** Qué economía pagó ('actual' = 2.4.1). */
  economia: ModeloEconomia
  /** Lo que este premio desbloqueó (por ejemplo, la Cuncuna), para celebrarlo. */
  desbloqueos: string[]
}

/**
 * Atiende un pedido de premio dentro de la transacción `c`. Lanza `Esperar`
 * si se pide más rápido de lo que se puede leer (la app lo reintenta después)
 * y `SinAsignacion` si el libro ya no está.
 */
export async function otorgarPremio(c: pg.PoolClient, p: PedidoPremio, ahora: number, economia: ModeloEconomia = 'actual'): Promise<RespuestaPremio> {
  const reglas = reglasDe(economia)
  // Un premio (o una compra) a la vez por niño.
  const { rows: perfiles } = await c.query('select monedas, premios_reloj, actividad_reloj from perfiles_ninos where id = $1 for update', [p.perfilId])
  const perfil = perfiles[0]
  if (!perfil) throw new SinAsignacion()

  const { rows: antes } = await c.query('select monedas, detalle from premios where perfil_id = $1 and operation_id = $2', [p.perfilId, p.operationId])
  if (antes[0]) {
    const { rows } = await c.query('select * from asignaciones where id = $1', [p.asignacionId])
    return { estado: 'repetido', otorgadas: antes[0].monedas, monedas: perfil.monedas, motivo: antes[0].detalle?.motivo ?? '', asignacion: rows[0] ?? {}, economia, desbloqueos: [] }
  }

  const { rows: asignaciones } = await c.query('select * from asignaciones where id = $1 and perfil_id = $2 for update', [p.asignacionId, p.perfilId])
  const a = asignaciones[0]
  if (!a) throw new SinAsignacion()
  const { rows: textos } = await c.query('select id, origen, frases, capitulos, parrafos, huella, actualizado_en from textos where id = $1', [a.texto_id])
  const t = textos[0]
  const clave = await claveDe(c, t)
  const { rows: lecturas } = await c.query('select * from lecturas_premiadas where perfil_id = $1 and clave = $2 for update', [p.perfilId, clave])
  const l = lecturas[0]
  const previo = combinarEstados(estadoDeAsignacion(a), estadoDeLectura(l))

  const nivel = a.nivel as NivelLectura
  const opciones: OpcionesPremio = { hoy: diaUtc(ahora), vista: vistaDe(t, nivel), reglas }
  if (economia === 'e2') {
    opciones.nivelReferencia = nivelDeReferencia(t, nivel)
    if (p.solicitud.tipo === 'relectura') opciones.segundosReleidosRecientes = await segundosReleidos(c, p.perfilId, a.id, ahora)
  }
  let calculo = calcularPremio(t as never, nivel, previo, p.solicitud, opciones)

  let reloj: number | null = perfil.premios_reloj ? new Date(perfil.premios_reloj).getTime() : null
  if (economia === 'e2') {
    // E2: lo pagado por tiempo adelanta el reloj (no se cobra más tiempo del que pasó).
    if (calculo.monedas > 0 || calculo.segundosPagados > 0) {
      const r = revisarRelojE2(reloj, ahora, calculo.costoSegundos, calculo.segundosPagados)
      if (!r.ok) throw new Esperar(r.esperarSegundos)
      if (r.pagables < calculo.segundosPagados) calculo = calcularPremio(t as never, nivel, previo, p.solicitud, { ...opciones, maxSegundosPagables: r.pagables })
      reloj = r.reloj
    }
  } else if (calculo.monedas > 0) {
    const r = revisarRitmo(reloj, ahora, calculo.costoSegundos)
    if (!r.ok) throw new Esperar(r.esperarSegundos)
    reloj = r.reloj
  }
  // Lectura activa (no da monedas): solo la que cabe en el tiempo real.
  const actividad = acreditarActividad(perfil.actividad_reloj ? new Date(perfil.actividad_reloj).getTime() : null, ahora, calculo.segundosActividad)

  const saldo = perfil.monedas + calculo.monedas
  await c.query('update perfiles_ninos set monedas = $1, premios_reloj = $2, actividad_reloj = $3 where id = $4', [
    saldo,
    reloj === null ? null : new Date(reloj),
    actividad.reloj === null ? null : new Date(actividad.reloj),
    p.perfilId,
  ])
  const e = calculo.estado
  const { rows: actualizada } = await c.query(
    `update asignaciones set pagado_hasta = greatest(pagado_hasta, $2), leido_hasta = greatest(leido_hasta, $2),
       premio_hasta = greatest(premio_hasta, $3), relectura_premiada_en = greatest(relectura_premiada_en, $4::date)
     where id = $1 returning *`,
    [a.id, e.pagadoHasta, e.hitosHasta, e.relecturaDia],
  )
  await recordar(c, p.perfilId, clave, e, actividad.acreditados)
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
      p.solicitud.tipo !== 'relectura' ? Math.max(0, Math.floor(p.solicitud.hasta)) : null,
      p.solicitadas,
      calculo.monedas,
      saldo,
      {
        motivo: calculo.motivo,
        origen: p.origen,
        reglas: reglas.version,
        unidades: calculo.unidades,
        hitos: calculo.hitos.map((h) => h.porcentaje),
        costoSegundos: Math.round(calculo.costoSegundos * 10) / 10,
        ...(p.solicitud.tipo === 'relectura' ? { dia: p.solicitud.dia } : {}),
        ...(p.solicitud.tipo !== 'relectura' && !p.solicitud.conPremio ? { sinPremioUltima: true } : {}),
        ...(actividad.acreditados > 0 ? { actividad: Math.round(actividad.acreditados * 10) / 10 } : {}),
        ...detalleE2(economia, calculo, p.solicitud, ahora),
      },
    ],
  )
  // La Cuncuna se gana con cuentos de Ciempi (no con textos propios): se revisa en la misma transacción.
  const desbloqueos: string[] = []
  if (t.origen === 'ciempi') {
    const nuevo = await revisarCuncuna(c, p.perfilId)
    if (nuevo) desbloqueos.push(nuevo)
  }
  return { estado: 'otorgado', otorgadas: calculo.monedas, monedas: saldo, motivo: calculo.motivo, asignacion: actualizada[0], economia, desbloqueos }
}

/** E2: lo que se anota de más en el registro (para auditar el tiempo pagado). */
function detalleE2(economia: ModeloEconomia, calculo: CalculoPremio, s: SolicitudPremio, ahora: number): Record<string, unknown> {
  if (economia !== 'e2') return {}
  const r = (x: number) => Math.round(x * 10) / 10
  return {
    economia,
    ahora,
    segundosPagados: r(calculo.segundosPagados),
    ...(s.tipo !== 'relectura' && typeof s.segundosActivos === 'number' ? { segundosDeclarados: r(Math.min(s.segundosActivos, 86_400)) } : {}),
    ...(typeof (s as { tropiezos?: unknown }).tropiezos === 'number' ? { tropiezos: (s as { tropiezos: number }).tropiezos } : {}),
    ...(calculo.desglose ? { desglose: calculo.desglose } : {}),
    ...(calculo.terminoLibro ? { terminoLibro: true } : {}),
  }
}

/** E2: segundos de unidades releídas (pagadas) de este libro en las últimas horas. */
async function segundosReleidos(c: pg.PoolClient, perfilId: string, asignacionId: string, ahora: number): Promise<number> {
  const { rows } = await c.query(
    `select coalesce(sum((detalle->>'segundosPagados')::real), 0)::real as s from premios
      where perfil_id = $1 and asignacion_id = $2 and tipo = 'releida' and (detalle->>'ahora')::bigint > $3`,
    [perfilId, asignacionId, ahora - HORAS_RELECTURA * 3600 * 1000],
  )
  return rows[0].s
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
