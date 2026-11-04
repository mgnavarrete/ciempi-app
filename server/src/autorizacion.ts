import type pg from 'pg'
import { cifrarClave, verificarClave, type UsuarioSesion } from './auth.ts'

/**
 * Textos propios del niño autorizados por un adulto con su PIN.
 *
 * - El niño agrega un texto suyo: queda en su biblioteca como `pendiente`. Lo
 *   puede leer para practicar, pero no paga monedas (ver `sinAutorizar`).
 * - Un adulto del niño escribe su PIN (en el dispositivo del niño o en su
 *   panel) y el servidor lo verifica aquí: hash scrypt con sal, límite de
 *   intentos guardado en la base y espera creciente.
 * - El PIN nunca se guarda ni se anota en claro (ni en logs ni en el registro).
 *
 * Las rutas están en rutasPin.ts. Ver docs/expansion-ciempi/seguridad/PIN-TEXTOS.md.
 */

export type Autorizacion = 'pendiente' | 'autorizada' | 'rechazada'

/** 4 a 8 dígitos: fácil de escribir para un adulto, difícil de adivinar con el límite de intentos. */
export const PIN_VALIDO = /^\d{4,8}$/

/** Un PIN que se adivina al primer intento (1111, 1234, 4321…) no sirve. */
export function pinDebil(pin: string): boolean {
  const d = [...pin].map(Number)
  const pasos = d.slice(1).map((n, i) => n - d[i])
  return pasos.every((p) => p === 0) || pasos.every((p) => p === 1) || pasos.every((p) => p === -1)
}

/** El mismo formato y costo que las contraseñas: "scrypt$<sal>$<hash>" (sal aleatoria de 16 bytes). */
export const cifrarPin = (pin: string) => cifrarClave(pin)

/** Intentos fallidos sin espera; después, 1 min, 2, 4, 8… hasta 24 horas por intento. */
export const INTENTOS_LIBRES = 5
export const ESPERA_INICIAL_S = 60
export const ESPERA_MAXIMA_S = 24 * 3600
/** Los fallos se olvidan después de una semana sin fallar (más que la espera máxima). */
export const OLVIDO_FALLOS_MS = 7 * 24 * 3600_000

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
 * transacción `c`. Los intentos se cuentan por niño y por quien prueba
 * (`usuarioId`: la sesión del niño o la de un adulto), así un niño que prueba
 * PINs se bloquea a sí mismo, pero no al adulto en su panel.
 *
 * La fila de intentos queda bloqueada (FOR UPDATE): pedidos simultáneos se
 * atienden de a uno, así que no se pueden probar muchos PIN a la vez. No lanza
 * por un PIN incorrecto: el fallo tiene que quedar guardado (si lanzara, la
 * transacción se desharía).
 */
export async function revisarPin(c: pg.PoolClient, perfilId: string, usuarioId: string, pin: string, ahora: number): Promise<ResultadoPin> {
  const { rows: adultos } = await c.query<{ id: string; pin_hash: string }>(
    `select c.id, c.pin_hash from miembros_nino m join cuentas c on c.id = m.cuenta_id where m.perfil_id = $1 and c.pin_hash is not null order by c.id`,
    [perfilId],
  )
  if (!adultos.length) return { tipo: 'sin_pin' }

  await c.query('insert into intentos_pin (perfil_id, usuario_id) values ($1, $2) on conflict do nothing', [perfilId, usuarioId])
  const { rows } = await c.query('select fallos, ultimo_fallo, bloqueado_hasta from intentos_pin where perfil_id = $1 and usuario_id = $2 for update', [perfilId, usuarioId])
  const fila = rows[0]
  const bloqueadoHasta = fila.bloqueado_hasta ? new Date(fila.bloqueado_hasta).getTime() : 0
  // Bloqueado: no se revisa el PIN (ni siquiera el correcto), así no hay forma de saber si acertó.
  if (bloqueadoHasta > ahora) return { tipo: 'bloqueado', esperaSegundos: Math.ceil((bloqueadoHasta - ahora) / 1000) }

  if (PIN_VALIDO.test(pin)) {
    // Se revisan todos (no se corta al primero): el tiempo no dice cuál adulto es.
    let acierto: string | null = null
    for (const a of adultos) if ((await verificarClave(pin, a.pin_hash)) && !acierto) acierto = a.id
    if (acierto) {
      await c.query('update intentos_pin set fallos = 0, ultimo_fallo = null, bloqueado_hasta = null where perfil_id = $1 and usuario_id = $2', [perfilId, usuarioId])
      return { tipo: 'ok', adultoId: acierto }
    }
  }
  const ultimo = fila.ultimo_fallo ? new Date(fila.ultimo_fallo).getTime() : 0
  const fallos = (ahora - ultimo > OLVIDO_FALLOS_MS ? 0 : fila.fallos) + 1
  const espera = esperaTrasFallos(fallos)
  await c.query('update intentos_pin set fallos = $3, ultimo_fallo = $4, bloqueado_hasta = $5 where perfil_id = $1 and usuario_id = $2', [
    perfilId,
    usuarioId,
    fallos,
    new Date(ahora),
    espera ? new Date(ahora + espera * 1000) : null,
  ])
  return { tipo: 'incorrecto', intentosRestantes: Math.max(0, INTENTOS_LIBRES - fallos), esperaSegundos: espera }
}

/**
 * ¿Queda pendiente un libro que se agrega a la biblioteca del niño? Solo si lo
 * agrega alguien que no es su adulto (el propio niño) y el texto no es un
 * cuento de Ciempi ni lo subió uno de sus adultos. Lo decide el servidor:
 * lo que diga la app no cuenta.
 */
/**
 * 2.5.1: los textos que agrega el niño ya no esperan la aprobación del adulto
 * (decisión de la usuaria). Toda asignación nueva queda autorizada; las columnas
 * y las rutas del PIN se conservan sin uso.
 */
export async function autorizacionAlAgregar(_c: pg.Pool | pg.PoolClient, _datos: { perfilId: string; textoId: string; esAdulto: boolean }): Promise<Autorizacion> {
  return 'autorizada'
}

/** Las columnas de autorización para el insert de una asignación nueva. */
export async function columnasAlAgregar(c: pg.Pool | pg.PoolClient, u: UsuarioSesion, datos: { perfilId: string; textoId: string; esAdulto: boolean }) {
  const autorizacion = await autorizacionAlAgregar(c, datos)
  const porAdulto = autorizacion === 'autorizada' && datos.esAdulto
  return { autorizacion, autorizadaPor: porAdulto ? u.id : null, autorizadaEn: porAdulto ? new Date() : null }
}

/**
 * Un niño cambia el contenido de un texto suyo ya autorizado: vuelve a quedar
 * pendiente (si no, bastaría con autorizar un texto corto y después
 * reemplazarlo por uno largo). Cambiar solo el título no cuenta.
 */
export async function pendienteSiCambiaContenido(_c: pg.PoolClient, _u: UsuarioSesion, _textoId: string) {
  // 2.5.1: sin aprobación de textos, cambiar el contenido ya no lo deja pendiente.
}

/**
 * Un pedido de premio de un libro pendiente o rechazado: no paga ni marca nada
 * como pagado (al autorizarse, se lee y se paga como un libro nuevo). Con la
 * app actual queda anotado en el registro (0 monedas, `sin_autorizar`) con su
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
        { motivo: 'sin_autorizar', origen: p.origen, autorizacion: a.autorizacion },
      ],
    )
  }
  return { estado: 'otorgado' as const, otorgadas: 0, monedas: saldo, motivo: 'sin_autorizar', asignacion: a }
}
