import type { FastifyInstance, FastifyReply, FastifyRequest, RouteShorthandOptions } from 'fastify'
import { nivelSugerido } from '../../src/lenguaje/dificultad.ts'
import { estaBloqueado, limpiarFallos, registrarFallo, verificarClave, type UsuarioSesion } from './auth.ts'
import { PIN_VALIDO, cifrarPin, pinDebil, revisarPin } from './autorizacion.ts'
import { enTransaccion, pool } from './db.ts'
import { exigirVerNino } from './permisos.ts'

/**
 * Rutas del PIN del adulto y de la autorización de textos propios del niño.
 * La lógica está en autorizacion.ts; app.ts solo registra estas rutas.
 *
 * - GET  /api/mi-pin                       ¿tengo PIN? (adulto)
 * - PUT  /api/mi-pin                       crear o cambiar el PIN, con la contraseña (adulto)
 * - GET  /api/autorizaciones               libros pendientes (los de sus niños, o los propios del niño)
 * - POST /api/asignaciones/:id/autorizar   { pin, nivel? } aprobar
 * - POST /api/asignaciones/:id/rechazar    { pin } rechazar (se sigue pudiendo leer; no paga)
 *
 * Respuestas de error: 403 { error, intentosRestantes } PIN incorrecto;
 * 429 { error, reintentarEnSegundos } + Retry-After; 409 { error, sinPin }
 * ningún adulto del niño tiene PIN todavía.
 */

type Fila = Record<string, any>

export interface DependenciasPin {
  conUsuario: RouteShorthandOptions
  conAdulto: RouteShorthandOptions
  aAsignacion: (f: Fila) => unknown
  /** Lanza un error 400 si el nivel no es válido. */
  nivelValido: (v: unknown) => number
  ahora: () => number
}

/** Error con código HTTP (lo responde el manejador de errores general). */
const error = (mensaje: string, statusCode: number) => Object.assign(new Error(mensaje), { statusCode })

export function registrarRutasPin(app: FastifyInstance, d: DependenciasPin) {
  const yo = (req: FastifyRequest) => req.usuario as UsuarioSesion
  const cuerpo = (req: FastifyRequest) => (req.body ?? {}) as Fila
  const idDe = (req: FastifyRequest) => (req.params as Record<string, string>).id

  app.get('/api/mi-pin', d.conAdulto, async (req) => {
    const { rows } = await pool.query('select pin_hash is not null as tiene, pin_cambiado_en from cuentas where id = $1', [yo(req).id])
    return { tienePin: !!rows[0]?.tiene, cambiadoEn: rows[0]?.pin_cambiado_en ?? null }
  })

  /**
   * Crear o cambiar el PIN. Pide la contraseña de la cuenta: alguien con el
   * teléfono del adulto abierto no basta. Las familias que todavía no tienen
   * PIN lo crean aquí cuando quieran; sus libros pendientes siguen ahí.
   * Cambiarlo también desbloquea los intentos de sus niños.
   */
  app.put('/api/mi-pin', d.conAdulto, async (req) => {
    const b = cuerpo(req)
    if (typeof b.pin !== 'string' || typeof b.clave !== 'string' || b.pin.length > 20 || b.clave.length > 200) throw error('Faltan el PIN o la contraseña', 400)
    const bloqueo = `pin-clave:${yo(req).id}`
    if (estaBloqueado(bloqueo)) throw error('Demasiados intentos. Espera 5 minutos e inténtalo de nuevo.', 429)
    const { rows } = await pool.query('select clave_hash from usuarios where id = $1', [yo(req).id])
    if (!rows[0] || !(await verificarClave(b.clave, rows[0].clave_hash))) {
      registrarFallo(bloqueo)
      throw error('La contraseña no es correcta.', 403)
    }
    limpiarFallos(bloqueo)
    if (!PIN_VALIDO.test(b.pin)) throw error('El PIN debe tener de 4 a 8 números.', 400)
    if (pinDebil(b.pin)) throw error('Ese PIN es muy fácil de adivinar (como 1111 o 1234). Elige otro.', 400)
    const hash = await cifrarPin(b.pin)
    await enTransaccion(async (c) => {
      await c.query('update cuentas set pin_hash = $1, pin_cambiado_en = now() where id = $2', [hash, yo(req).id])
      await c.query('delete from intentos_pin where perfil_id in (select perfil_id from miembros_nino where cuenta_id = $1)', [yo(req).id])
    })
    return { tienePin: true }
  })

  /** Libros pendientes de autorizar: los de sus niños (adulto) o los propios (niño). */
  app.get('/api/autorizaciones', d.conUsuario, async (req) => {
    const u = yo(req)
    const { rows } = await pool.query(
      `select a.*, t.titulo, t.frases, t.parrafos, t.origen, p.apodo, p.icono,
              (select bool_or(c.pin_hash is not null) from miembros_nino m join cuentas c on c.id = m.cuenta_id where m.perfil_id = a.perfil_id) as hay_pin
         from asignaciones a join textos t on t.id = a.texto_id join perfiles_ninos p on p.id = a.perfil_id
        where a.autorizacion = 'pendiente' and ${
          u.tipo === 'nino' ? 'p.usuario_id = $1' : 'exists (select 1 from miembros_nino m where m.perfil_id = a.perfil_id and m.cuenta_id = $1)'
        }
        order by a.asignada_en desc limit 100`,
      [u.id],
    )
    return rows.map((f) => ({
      asignacion: d.aAsignacion(f),
      perfil: { id: f.perfil_id, apodo: f.apodo, icono: f.icono },
      texto: { id: f.texto_id, titulo: f.titulo, frases: (f.frases as string[]).length, muestra: (f.frases as string[]).slice(0, 3), origen: f.origen },
      nivelSugerido: nivelSugerido(f.frases, f.parrafos ?? undefined),
      hayPin: !!f.hay_pin,
    }))
  })

  /**
   * Revisa el PIN y, si es correcto, aplica `cambio` en la misma transacción.
   * Se puede pedir desde la sesión del niño (el adulto escribe el PIN en su
   * dispositivo) o desde la del adulto: en los dos casos se manda el PIN.
   */
  async function conPin(req: FastifyRequest, reply: FastifyReply, cambio: (c: Parameters<Parameters<typeof enTransaccion>[0]>[0], adultoId: string) => Promise<Fila | undefined>) {
    const id = idDe(req)
    const { rows } = await pool.query('select * from asignaciones where id = $1', [id])
    if (!rows[0]) throw error('No existe', 404)
    await exigirVerNino(yo(req), rows[0].perfil_id)
    const b = cuerpo(req)
    const pin = typeof b.pin === 'string' ? b.pin.slice(0, 20) : ''
    const r = await enTransaccion(async (c) => {
      const v = await revisarPin(c, rows[0].perfil_id, yo(req).id, pin, d.ahora())
      if (v.tipo !== 'ok') return { v, fila: undefined }
      const fila = (await cambio(c, v.adultoId)) ?? (await c.query('select * from asignaciones where id = $1', [id])).rows[0]
      return { v, fila }
    })
    const v = r.v
    if (v.tipo === 'sin_pin') return reply.code(409).send({ error: 'Todavía ningún adulto creó su PIN. Se crea en el panel de adultos, en «Cuenta».', sinPin: true })
    const espera = v.tipo === 'bloqueado' || v.tipo === 'incorrecto' ? v.esperaSegundos : 0
    if (espera) {
      return reply
        .code(429)
        .header('Retry-After', String(espera))
        .send({ error: 'Demasiados intentos con el PIN. Hay que esperar un poco para volver a probar.', reintentarEnSegundos: espera })
    }
    if (v.tipo === 'incorrecto') return reply.code(403).send({ error: 'Ese PIN no es. Prueba otra vez.', intentosRestantes: v.intentosRestantes })
    return d.aAsignacion(r.fila!)
  }

  /**
   * Aprobar. Desde ese momento el libro paga como uno nuevo: lo leído mientras
   * estaba pendiente no se pagó y su avance vuelve a lo pagado (que se lea
   * otra vez). Lo ya pagado de ese mismo contenido (por huella) no se paga de
   * nuevo. Aprobar dos veces no hace nada.
   */
  app.post('/api/asignaciones/:id/autorizar', d.conUsuario, async (req, reply) => {
    const b = cuerpo(req)
    const nivel = b.nivel === undefined || b.nivel === null ? null : d.nivelValido(b.nivel)
    return conPin(req, reply, async (c, adultoId) => {
      const { rows } = await c.query(
        `update asignaciones set autorizacion = 'autorizada', autorizada_por = $2, autorizada_en = now(), actualizada_en = now(),
           leido_hasta = pagado_hasta, nivel = coalesce($3, nivel)
         where id = $1 and autorizacion <> 'autorizada' returning *`,
        [idDe(req), adultoId, nivel],
      )
      return rows[0]
    })
  })

  /** Rechazar: el niño lo puede seguir leyendo, pero no paga. Se puede aprobar después. */
  app.post('/api/asignaciones/:id/rechazar', d.conUsuario, async (req, reply) =>
    conPin(req, reply, async (c, adultoId) => {
      const { rows } = await c.query(
        `update asignaciones set autorizacion = 'rechazada', autorizada_por = $2, autorizada_en = now(), actualizada_en = now()
         where id = $1 and autorizacion = 'pendiente' returning *`,
        [idDe(req), adultoId],
      )
      return rows[0]
    }),
  )
}
