import type pg from 'pg'
import { cifrarClave, verificarClave } from './auth.ts'

/**
 * Textos propios del niño autorizados por un adulto con su PIN.
 *
 * - El niño agrega un texto suyo: queda en su biblioteca como `pendiente`. Lo
 *   puede leer para practicar, pero no paga monedas (ver `sinAutorizar`).
 * - Un adulto del niño escribe su PIN (en el dispositivo del niño o en su
 *   panel) y el servidor lo verifica aquí: hash scrypt, límite de intentos
 *   por niño guardado en la base y espera creciente.
 * - El PIN nunca se guarda ni se anota en claro (ni en logs ni en el registro).
 *
 * Ver docs/expansion-ciempi/seguridad/PIN-TEXTOS.md.
 */

/** 4 a 8 dígitos: fácil de escribir para un adulto, difícil de adivinar con el límite de intentos. */
export const PIN_VALIDO = /^\d{4,8}$/

/** Un PIN que se adivina al primer intento (1111, 1234, 4321…) no sirve. */
export function pinDebil(pin: string): boolean {
  const d = [...pin].map(Number)
  const pasos = d.slice(1).map((n, i) => n - d[i])
  return pasos.every((p) => p === 0) || pasos.every((p) => p === 1) || pasos.every((p) => p === -1)
}

/** El PIN no es (todavía quedan intentos sin espera). */
export class PinIncorrecto extends Error {
  intentosRestantes: number
  constructor(intentosRestantes: number) {
    super('Ese PIN no es. Prueba otra vez.')
    this.intentosRestantes = intentosRestantes
  }
}

/** Demasiados intentos: hay que esperar (429). */
export class PinEnEspera extends Error {
  segundos: number
  constructor(segundos: number) {
    super('Demasiados intentos con el PIN. Hay que esperar un poco para volver a probar.')
    this.segundos = segundos
  }
}

export const cifrarPin = (pin: string) => cifrarClave(pin)

/** Intentos fallidos sin espera; después, 1 min, 2, 4, 8… hasta 1 hora por intento. */
export const INTENTOS_LIBRES = 5
export const ESPERA_INICIAL_S = 60
export const ESPERA_MAXIMA_S = 3600
/** Los fallos se olvidan después de un día sin fallar. */
export const OLVIDO_FALLOS_MS = 24 * 3600_000

export function esperaTrasFallos(fallos: number): number {
  if (fallos < INTENTOS_LIBRES) return 0
  return Math.min(ESPERA_MAXIMA_S, ESPERA_INICIAL_S * 2 ** (fallos - INTENTOS_LIBRES))
}

export type ResultadoPin =
  | { tipo: 'ok'; adultoId: string }
  | { tipo: 'incorrecto'; intentosRestantes: number; esperaSegundos: number }
  | { tipo: 'bloqueado'; esperaSegundos: number }
  /** Ningún adulto del niño tiene PIN todavía (no cuenta como intento). */
  | { tipo: 'sin_pin' }

/**
 * Revisa el PIN contra los de todos los adultos del niño, dentro de la
 * transacción `c`. La fila de intentos del niño queda bloqueada (FOR UPDATE):
 * pedidos simultáneos se atienden de a uno, así que no se pueden probar
 * muchos PIN a la vez. No lanza por un PIN incorrecto: el fallo tiene que
 * quedar guardado (si lanzara, la transacción se desharía).
 */
export async function revisarPin(c: pg.PoolClient, perfilId: string, pin: string, ahora: number): Promise<ResultadoPin> {
  await c.query('insert into intentos_pin (perfil_id) values ($1) on conflict do nothing', [perfilId])
  const { rows } = await c.query('select fallos, ultimo_fallo, bloqueado_hasta from intentos_pin where perfil_id = $1 for update', [perfilId])
  const fila = rows[0]
  const bloqueadoHasta = fila.bloqueado_hasta ? new Date(fila.bloqueado_hasta).getTime() : 0
  // Bloqueado: no se revisa el PIN (ni siquiera el correcto), así no hay forma de saber si acertó.
  if (bloqueadoHasta > ahora) return { tipo: 'bloqueado', esperaSegundos: Math.ceil((bloqueadoHasta - ahora) / 1000) }

  const { rows: adultos } = await c.query<{ id: string; pin_hash: string }>(
    `select c.id, c.pin_hash from miembros_nino m join cuentas c on c.id = m.cuenta_id where m.perfil_id = $1 and c.pin_hash is not null order by c.id`,
    [perfilId],
  )
  if (!adultos.length) return { tipo: 'sin_pin' }
  if (PIN_VALIDO.test(pin)) {
    // Se revisan todos (no se corta al primero): el tiempo no dice cuál adulto es.
    let acierto: string | null = null
    for (const a of adultos) if ((await verificarClave(pin, a.pin_hash)) && !acierto) acierto = a.id
    if (acierto) {
      await c.query('update intentos_pin set fallos = 0, ultimo_fallo = null, bloqueado_hasta = null where perfil_id = $1', [perfilId])
      return { tipo: 'ok', adultoId: acierto }
    }
  }
  const ultimo = fila.ultimo_fallo ? new Date(fila.ultimo_fallo).getTime() : 0
  const fallos = (ahora - ultimo > OLVIDO_FALLOS_MS ? 0 : fila.fallos) + 1
  const espera = esperaTrasFallos(fallos)
  await c.query('update intentos_pin set fallos = $2, ultimo_fallo = $3, bloqueado_hasta = $4 where perfil_id = $1', [
    perfilId,
    fallos,
    new Date(ahora),
    espera ? new Date(ahora + espera * 1000) : null,
  ])
  return { tipo: 'incorrecto', intentosRestantes: Math.max(0, INTENTOS_LIBRES - fallos), esperaSegundos: espera }
}

/**
 * ¿Queda pendiente un libro que agrega `usuarioId` a la biblioteca del niño?
 * Solo si lo agrega alguien que no es su adulto (el propio niño) y el texto
 * no es un cuento de Ciempi ni lo subió uno de sus adultos.
 */
export async function autorizacionAlAgregar(c: pg.Pool | pg.PoolClient, datos: { perfilId: string; textoId: string; esAdulto: boolean }): Promise<'pendiente' | 'autorizada'> {
  if (datos.esAdulto) return 'autorizada'
  const { rows } = await c.query(
    `select t.origen = 'ciempi' or exists (select 1 from miembros_nino m where m.perfil_id = $2 and m.cuenta_id = t.subido_por) as del_adulto
       from textos t where t.id = $1`,
    [datos.textoId, datos.perfilId],
  )
  return rows[0]?.del_adulto ? 'autorizada' : 'pendiente'
}

/**
 * Un pedido de premio de un libro pendiente: no paga ni marca nada como
 * pagado (al autorizarse, se lee y se paga como un libro nuevo). Con la app
 * actual queda anotado en el registro (0 monedas, `sin_autorizar`) con su
 * operationId. Lo que deduce el servidor del progreso de una app anterior no
 * se anota: su operationId es fijo y, si se anotara, después de autorizar ese
 * mismo avance ya no pagaría.
 */
export async function sinAutorizar(
  c: pg.PoolClient,
  p: { perfilId: string; operationId: string; usuarioId: string; origen: 'app' | 'legado'; solicitud: { tipo: string; hasta?: number }; solicitadas: number | null },
  saldo: number,
  a: Record<string, any>,
) {
  if (p.origen === 'app') {
    await c.query(
      `insert into premios (perfil_id, operation_id, asignacion_id, usuario_id, tipo, nivel, hasta, solicitadas, monedas, saldo, detalle)
       values ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10)`,
      [
        p.perfilId,
        p.operationId,
        a.id,
        p.usuarioId,
        p.solicitud.tipo,
        a.nivel,
        p.solicitud.tipo === 'avance' ? Math.max(0, Math.floor(p.solicitud.hasta ?? 0)) : null,
        p.solicitadas,
        saldo,
        { motivo: 'sin_autorizar', origen: p.origen },
      ],
    )
  }
  return { estado: 'otorgado' as const, otorgadas: 0, monedas: saldo, motivo: 'sin_autorizar', asignacion: a }
}
