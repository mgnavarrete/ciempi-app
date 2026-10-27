import { randomInt } from 'node:crypto'
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import type pg from 'pg'
import { PARTES, buscarItem, loTiene, normalizarApariencia } from '../../src/ciempi/catalogo.ts'
import {
  MIN_CLAVE_ADULTO,
  MIN_CLAVE_NINO,
  borrarSesion,
  cerrarOtrasSesiones,
  cifrarClave,
  correoValido,
  crearRecuperacion,
  crearSesion,
  estaBloqueado,
  limpiarFallos,
  normalizarCorreo,
  normalizarUsuario,
  registrarFallo,
  usarRecuperacion,
  usuarioDeSesion,
  usuarioValido,
  verificarClave,
  type UsuarioSesion,
} from './auth.ts'
import { enviarRecuperacion } from './correo.ts'
import { fuentesDeVoz, vozDisponible } from './voz.ts'
import { enTransaccion, pool } from './db.ts'
import { Prohibido, esAdminDe, exigirAdminDe, exigirVerNino, puedeVerNino, puedeVerTexto } from './permisos.ts'

/** Error con mensaje para mostrarle al usuario (400 por defecto). */
class Problema extends Error {
  codigo: number
  constructor(mensaje: string, codigo = 400) {
    super(mensaje)
    this.codigo = codigo
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    usuario?: UsuarioSesion
  }
}

type Fila = Record<string, unknown>
const texto = (v: unknown, campo: string, max = 200): string => {
  if (typeof v !== 'string') throw new Problema(`Falta ${campo}`)
  if (v.length > max) throw new Problema(`${campo} es demasiado largo`)
  return v
}
const entero = (v: unknown, campo: string): number => {
  if (typeof v !== 'number' || !Number.isInteger(v)) throw new Problema(`${campo} debe ser un número entero`)
  return v
}
const nivelValido = (v: unknown): number => {
  if (v === undefined) return 1
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 4) throw new Problema('El nivel debe ser 1, 2, 3 o 4')
  return v
}
const objeto = (v: unknown, campo: string): Fila => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Problema(`${campo} debe ser un objeto`)
  return v as Fila
}

// ── Filas → JSON (camelCase, como src/dominio/tipos.ts) ───────────────────

const COLUMNAS_PERFIL = `p.id, p.creado_por, p.apodo, p.icono, p.ajustes, p.monedas, p.ciempi, p.inventario, p.creado_en,
  u.usuario, (p.usuario_id is not null) as tiene_cuenta`
const DESDE_PERFIL = 'perfiles_ninos p left join usuarios u on u.id = p.usuario_id'

const aPerfil = (f: Fila) => ({
  id: f.id,
  creadoPor: f.creado_por,
  usuario: f.usuario ?? null,
  tieneCuenta: f.tiene_cuenta,
  apodo: f.apodo,
  icono: f.icono,
  pinHash: null,
  ajustes: f.ajustes,
  monedas: f.monedas,
  ciempi: normalizarApariencia(f.ciempi as object),
  inventario: f.inventario,
  creadoEn: f.creado_en,
})

const aTexto = (f: Fila) => ({
  id: f.id,
  subidoPor: f.subido_por,
  titulo: f.titulo,
  autor: f.autor ?? null,
  textoOriginal: f.texto_original ?? '',
  frases: f.frases,
  capitulos: f.capitulos,
  portada: f.portada ?? null,
  origen: f.origen,
  creadoEn: f.creado_en,
  actualizadoEn: f.actualizado_en,
})

const aAsignacion = (f: Fila) => ({
  id: f.id,
  asignadaPor: f.asignada_por,
  perfilId: f.perfil_id,
  textoId: f.texto_id,
  modo: f.modo,
  nivel: f.nivel,
  estado: f.estado,
  fraseActual: f.frase_actual,
  fraseMaxima: f.frase_maxima,
  asignadaEn: f.asignada_en,
  actualizadaEn: f.actualizada_en,
  completadaEn: f.completada_en ?? null,
})

const aSesionLectura = (f: Fila) => ({
  id: f.id,
  usuarioId: f.usuario_id,
  perfilId: f.perfil_id,
  textoId: f.texto_id ?? null,
  asignacionId: f.asignacion_id ?? null,
  modo: f.modo,
  nivel: f.nivel,
  iniciadaEn: f.iniciada_en,
  duracionSegundos: f.duracion_segundos,
  frasesCompletadas: f.frases_completadas,
  frasesMuyRapido: f.frases_muy_rapido,
  silabasLeidas: f.silabas_leidas,
  monedasGanadas: f.monedas_ganadas,
})

/** La sesión tal como la entiende la app (ver Sesion en src/dominio/tipos.ts). */
async function sesionDe(u: UsuarioSesion) {
  if (u.tipo === 'nino') {
    const { rows } = await pool.query('select id from perfiles_ninos where usuario_id = $1', [u.id])
    if (!rows[0]) return null
    return { tipo: 'nino' as const, usuarioId: u.id, perfilId: rows[0].id as string }
  }
  const { rows } = await pool.query('select c.rol, c.nombre_visible, us.creado_en from cuentas c join usuarios us on us.id = c.id where c.id = $1', [u.id])
  const c = rows[0]
  return {
    tipo: 'adulto' as const,
    usuarioId: u.id,
    cuenta: { id: u.id, correo: u.correo, rol: c?.rol ?? 'apoderado', nombreVisible: c?.nombre_visible ?? '', creadaEn: c?.creado_en },
  }
}

async function perfilPorId(id: string, c: pg.PoolClient | pg.Pool = pool) {
  const { rows } = await c.query(`select ${COLUMNAS_PERFIL} from ${DESDE_PERFIL} where p.id = $1`, [id])
  if (!rows[0]) throw new Problema('Ese niño no existe', 404)
  return aPerfil(rows[0])
}

const ALFABETO_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const codigoInvitacion = () => Array.from({ length: 6 }, () => ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)]).join('')

const LIMITE_LIBRO = 8 * 1024 * 1024
/** La voz dice palabras y frases de Ciempi; las palabras (cortas) se guardan. */
const LARGO_VOZ = 300
const LARGO_PALABRA = 40

export async function crearApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : { level: process.env.LOG_LEVEL ?? 'info' },
    // Detrás de Nginx: la IP real llega en X-Forwarded-For.
    trustProxy: true,
    // Un libro (PDF ya convertido a frases) puede pesar algunos cientos de KB.
    bodyLimit: LIMITE_LIBRO,
  })

  // La web y la APK se identifican con un token (Authorization: Bearer), nunca
  // con cookies. Por eso CORS abierto sin credenciales es seguro: otro sitio
  // puede hacer la petición, pero sin token no está autenticada.
  app.addHook('onRequest', async (req, reply) => {
    if (!req.headers.origin) return
    reply.header('Access-Control-Allow-Origin', '*')
    reply.header('Vary', 'Origin')
    if (req.method === 'OPTIONS') {
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
      reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
      reply.header('Access-Control-Max-Age', '86400')
      return reply.code(204).send()
    }
  })

  app.setErrorHandler((error, req, reply) => {
    if (error instanceof Prohibido) return reply.code(403).send({ error: error.message })
    if (error instanceof Problema) return reply.code(error.codigo).send({ error: error.message })
    const e = error as { statusCode?: number; message: string }
    if (e.statusCode && e.statusCode < 500) return reply.code(e.statusCode).send({ error: e.message })
    req.log.error(error)
    return reply.code(500).send({ error: 'Algo falló en el servidor. Inténtalo de nuevo.' })
  })

  const token = (req: FastifyRequest) => {
    const a = req.headers.authorization
    return a?.startsWith('Bearer ') ? a.slice(7) : undefined
  }

  async function requiereUsuario(req: FastifyRequest, reply: FastifyReply) {
    const u = await usuarioDeSesion(token(req))
    if (!u) return reply.code(401).send({ error: 'Inicia sesión' })
    req.usuario = u
  }
  async function requiereAdulto(req: FastifyRequest, reply: FastifyReply) {
    await requiereUsuario(req, reply)
    if (reply.sent) return
    if (req.usuario!.tipo !== 'adulto') return reply.code(403).send({ error: 'Solo una cuenta de adulto puede hacer esto' })
  }
  const conUsuario = { preHandler: requiereUsuario }
  const conAdulto = { preHandler: requiereAdulto }
  const yo = (req: FastifyRequest) => req.usuario!
  const cuerpo = (req: FastifyRequest) => (req.body ?? {}) as Fila
  const param = (req: FastifyRequest, nombre: string) => (req.params as Record<string, string>)[nombre]

  const responderSesion = async (u: UsuarioSesion, tok: string) => ({ token: tok, sesion: await sesionDe(u) })

  app.get('/api/salud', async () => ({ ok: true }))

  // ── Voz de Ciempi ───────────────────────────────────────────────────────
  // El audio lo genera Azure, xAI o Kokoro en este servidor (server/voz), ver
  // voz.ts, y se guarda en audios_voz: las palabras se repiten mucho entre libros y niños.

  // Para el diagnóstico de Ajustes: ¿alguna voz responde? (lo guardado no cuenta).
  app.get('/api/voz/estado', conUsuario, async () => {
    const proveedor = await vozDisponible()
    if (!proveedor) throw new Problema('el servicio de voz (ciempi-voz) no está funcionando en el servidor', 503)
    return { ok: true, proveedor }
  })

  app.get('/api/voz', conUsuario, async (req, reply) => {
    const q = req.query as Record<string, string | undefined>
    const dicho = (q.texto ?? '').trim()
    if (!dicho || dicho.length > LARGO_VOZ) throw new Problema('Texto inválido para la voz')
    const voz = q.voz === 'nina' ? 'nina' : 'nino'
    // Pasos de 0,05 (como el ajuste de la app) para que lo guardado sirva.
    const velocidad = Math.min(1.5, Math.max(0.5, Math.round((Number(q.velocidad) || 1) * 20) / 20))
    const guardar = dicho.length <= LARGO_PALABRA

    // La primera fuente que tenga el audio guardado o lo pueda generar (las de pago, si hay clave, antes que Kokoro).
    for (const fuente of fuentesDeVoz(voz)) {
      const clave = `${fuente.id}|${velocidad}|${dicho}`
      if (guardar) {
        const { rows } = await pool.query<{ audio: Buffer }>('select audio from audios_voz where clave = $1', [clave])
        if (rows[0]) return enviarAudio(reply, rows[0].audio)
      }
      try {
        const audio = await fuente.generar(dicho, velocidad)
        if (guardar) await pool.query('insert into audios_voz (clave, audio) values ($1, $2) on conflict do nothing', [clave, audio])
        return enviarAudio(reply, audio)
      } catch (e) {
        req.log.warn({ fuente: fuente.id, error: (e as Error).message }, 'la voz falló; se prueba la siguiente')
      }
    }
    throw new Problema('La voz de Ciempi no está disponible', 503)
  })
  const enviarAudio = (reply: FastifyReply, audio: Buffer) =>
    reply.type('audio/wav').header('Cache-Control', 'private, max-age=31536000, immutable').send(audio)

  // ── Sesión ──────────────────────────────────────────────────────────────

  app.get('/api/sesion', async (req) => {
    const u = await usuarioDeSesion(token(req))
    return { sesion: u ? await sesionDe(u) : null }
  })

  app.post('/api/registro', async (req) => {
    const b = cuerpo(req)
    const correo = normalizarCorreo(texto(b.correo, 'el correo'))
    const clave = texto(b.clave, 'la contraseña')
    const nombre = texto(b.nombreVisible ?? '', 'el nombre', 80).trim()
    const rol = b.rol === 'terapeuta' ? 'terapeuta' : 'apoderado'
    if (!correoValido(correo)) throw new Problema('Revisa el correo.')
    if (clave.length < MIN_CLAVE_ADULTO) throw new Problema(`La contraseña debe tener al menos ${MIN_CLAVE_ADULTO} caracteres.`)
    const clave_hash = await cifrarClave(clave)
    const u = await enTransaccion(async (c) => {
      const existe = await c.query('select 1 from usuarios where correo = $1', [correo])
      if (existe.rowCount) throw new Problema('Ya existe una cuenta con ese correo.')
      const { rows } = await c.query(`insert into usuarios (tipo, correo, clave_hash) values ('adulto', $1, $2) returning id`, [correo, clave_hash])
      await c.query('insert into cuentas (id, rol, nombre_visible) values ($1, $2, $3)', [rows[0].id, rol, nombre])
      return { id: rows[0].id as string, tipo: 'adulto' as const, correo, usuario: null }
    })
    return responderSesion(u, await crearSesion(u.id, req.headers['user-agent'] ?? ''))
  })

  /** Inicio de sesión de adulto (correo) o de niño (usuario). */
  async function entrar(req: FastifyRequest, tipo: 'adulto' | 'nino') {
    const b = cuerpo(req)
    const id = tipo === 'adulto' ? normalizarCorreo(texto(b.correo, 'el correo')) : normalizarUsuario(texto(b.usuario, 'el usuario'))
    const clave = texto(b.clave, 'la clave')
    const clave_bloqueo = `${tipo}:${id}:${req.ip}`
    if (estaBloqueado(clave_bloqueo)) throw new Problema('Demasiados intentos. Espera 5 minutos e inténtalo de nuevo.', 429)
    const { rows } = await pool.query(`select id, tipo, correo, usuario, clave_hash from usuarios where tipo = $1 and ${tipo === 'adulto' ? 'correo' : 'usuario'} = $2`, [tipo, id])
    const fila = rows[0]
    if (!fila || !(await verificarClave(clave, fila.clave_hash))) {
      registrarFallo(clave_bloqueo)
      throw new Problema(tipo === 'adulto' ? 'Correo o contraseña incorrectos.' : 'Usuario o clave incorrectos.', 401)
    }
    limpiarFallos(clave_bloqueo)
    const u: UsuarioSesion = { id: fila.id, tipo: fila.tipo, correo: fila.correo, usuario: fila.usuario }
    return responderSesion(u, await crearSesion(u.id, req.headers['user-agent'] ?? ''))
  }
  app.post('/api/entrar', async (req) => entrar(req, 'adulto'))
  app.post('/api/entrar-nino', async (req) => entrar(req, 'nino'))

  app.post('/api/salir', async (req) => {
    await borrarSesion(token(req))
    return { ok: true }
  })

  // Siempre responde lo mismo, exista o no la cuenta (no revela qué correos están registrados).
  app.post('/api/recuperar', async (req) => {
    const correo = normalizarCorreo(texto(cuerpo(req).correo, 'el correo'))
    const clave_bloqueo = `recuperar:${req.ip}`
    if (estaBloqueado(clave_bloqueo)) throw new Problema('Espera unos minutos antes de pedir otro correo.', 429)
    registrarFallo(clave_bloqueo)
    const { rows } = await pool.query(`select id from usuarios where tipo = 'adulto' and correo = $1`, [correo])
    if (rows[0]) {
      const tok = await crearRecuperacion(rows[0].id)
      await enviarRecuperacion(correo, tok, (m) => req.log.warn(m))
    }
    return { ok: true }
  })

  app.post('/api/recuperar/confirmar', async (req) => {
    const b = cuerpo(req)
    const clave = texto(b.clave, 'la contraseña')
    if (clave.length < MIN_CLAVE_ADULTO) throw new Problema(`La contraseña debe tener al menos ${MIN_CLAVE_ADULTO} caracteres.`)
    const usuarioId = await usarRecuperacion(texto(b.token, 'el enlace', 200))
    if (!usuarioId) throw new Problema('El enlace ya se usó o venció. Pide uno nuevo.')
    await pool.query('update usuarios set clave_hash = $1 where id = $2', [await cifrarClave(clave), usuarioId])
    await cerrarOtrasSesiones(usuarioId)
    const { rows } = await pool.query('select id, tipo, correo, usuario from usuarios where id = $1', [usuarioId])
    return responderSesion(rows[0], await crearSesion(usuarioId, req.headers['user-agent'] ?? ''))
  })

  app.post('/api/mi-clave', conAdulto, async (req) => {
    const clave = texto(cuerpo(req).clave, 'la contraseña')
    if (clave.length < MIN_CLAVE_ADULTO) throw new Problema(`La contraseña debe tener al menos ${MIN_CLAVE_ADULTO} caracteres.`)
    await pool.query('update usuarios set clave_hash = $1 where id = $2', [await cifrarClave(clave), yo(req).id])
    await cerrarOtrasSesiones(yo(req).id, token(req))
    return { ok: true }
  })

  // ── Niños ───────────────────────────────────────────────────────────────

  app.get('/api/perfiles', conUsuario, async (req) => {
    const u = yo(req)
    const { rows } =
      u.tipo === 'nino'
        ? await pool.query(`select ${COLUMNAS_PERFIL} from ${DESDE_PERFIL} where p.usuario_id = $1`, [u.id])
        : await pool.query(`select ${COLUMNAS_PERFIL} from ${DESDE_PERFIL} join miembros_nino m on m.perfil_id = p.id where m.cuenta_id = $1 order by p.creado_en`, [u.id])
    return rows.map(aPerfil)
  })

  app.get('/api/perfiles/:id', conUsuario, async (req) => {
    await exigirVerNino(yo(req), param(req, 'id'))
    return perfilPorId(param(req, 'id'))
  })

  /** Crea al niño; con usuario y clave le crea además su acceso propio. */
  app.post('/api/perfiles', conAdulto, async (req) => {
    const b = cuerpo(req)
    const apodo = texto(b.apodo, 'el apodo', 30).trim()
    const icono = texto(b.icono, 'el ícono', 16)
    if (!apodo) throw new Problema('Falta el apodo.')
    const usuario = typeof b.usuario === 'string' && b.usuario.trim() ? normalizarUsuario(b.usuario) : null
    const clave = typeof b.clave === 'string' ? b.clave : ''
    if (usuario && !usuarioValido(usuario)) throw new Problema('El usuario debe tener entre 3 y 20 letras o números, sin espacios.')
    if (usuario && clave.length < MIN_CLAVE_NINO) throw new Problema(`La clave debe tener al menos ${MIN_CLAVE_NINO} caracteres.`)
    const clave_hash = usuario ? await cifrarClave(clave) : null
    const id = await enTransaccion(async (c) => {
      let usuarioId: string | null = null
      if (usuario) {
        const existe = await c.query('select 1 from usuarios where usuario = $1', [usuario])
        if (existe.rowCount) throw new Problema('Ese usuario ya existe, prueba con otro.')
        const { rows } = await c.query(`insert into usuarios (tipo, usuario, clave_hash) values ('nino', $1, $2) returning id`, [usuario, clave_hash])
        usuarioId = rows[0].id
      }
      const { rows } = await c.query('insert into perfiles_ninos (creado_por, usuario_id, apodo, icono) values ($1, $2, $3, $4) returning id', [yo(req).id, usuarioId, apodo, icono])
      await c.query('insert into miembros_nino (perfil_id, cuenta_id, rol) select $1, id, rol from cuentas where id = $2', [rows[0].id, yo(req).id])
      return rows[0].id as string
    })
    return perfilPorId(id)
  })

  app.put('/api/perfiles/:id/ajustes', conUsuario, async (req) => {
    await exigirVerNino(yo(req), param(req, 'id'))
    const ajustes = objeto(cuerpo(req).ajustes, 'ajustes')
    if (JSON.stringify(ajustes).length > 2000) throw new Problema('Ajustes demasiado grandes')
    await pool.query('update perfiles_ninos set ajustes = $1 where id = $2', [ajustes, param(req, 'id')])
    return perfilPorId(param(req, 'id'))
  })

  // Las gana el niño al leer (desde su dispositivo) o las da un adulto.
  app.post('/api/perfiles/:id/monedas', conUsuario, async (req) => {
    await exigirVerNino(yo(req), param(req, 'id'))
    const cantidad = entero(cuerpo(req).cantidad, 'cantidad')
    if (Math.abs(cantidad) > 100) throw new Problema('Cantidad no válida')
    const { rows } = await pool.query('update perfiles_ninos set monedas = greatest(0, monedas + $1) where id = $2 returning monedas', [cantidad, param(req, 'id')])
    return { monedas: rows[0].monedas }
  })

  /** Cómo se ve su Ciempi: solo puede ponerse lo gratis o lo comprado. */
  app.put('/api/perfiles/:id/ciempi', conUsuario, async (req) => {
    const id = param(req, 'id')
    await exigirVerNino(yo(req), id)
    const pedido = objeto(cuerpo(req).apariencia, 'apariencia')
    if (typeof pedido.nombre === 'string' && pedido.nombre.trim().length > 20) throw new Problema('El nombre de Ciempi puede tener hasta 20 letras')
    const apariencia = normalizarApariencia(pedido)
    const { rows } = await pool.query('select inventario from perfiles_ninos where id = $1', [id])
    for (const parte of PARTES) {
      if (!loTiene(rows[0].inventario, apariencia[parte])) throw new Problema('Primero hay que comprarlo', 403)
    }
    await pool.query('update perfiles_ninos set ciempi = $1 where id = $2', [apariencia, id])
    return perfilPorId(id)
  })

  /** Compra atómica: descuenta monedas, agrega al inventario y lo registra. */
  app.post('/api/perfiles/:id/comprar', conUsuario, async (req) => {
    const id = param(req, 'id')
    await exigirVerNino(yo(req), id)
    const item = buscarItem(texto(cuerpo(req).itemId, 'itemId', 60))
    if (!item) throw new Problema('Eso no está en la tienda')
    return enTransaccion(async (c) => {
      const { rows } = await c.query('select monedas, inventario from perfiles_ninos where id = $1 for update', [id])
      const p = rows[0]
      if (loTiene(p.inventario, item.id)) return { monedas: p.monedas, inventario: p.inventario }
      if (p.monedas < item.precio) throw new Problema(`Te faltan ${item.precio - p.monedas} monedas`)
      const r = await c.query('update perfiles_ninos set monedas = monedas - $1, inventario = array_append(inventario, $2) where id = $3 returning monedas, inventario', [
        item.precio,
        item.id,
        id,
      ])
      await c.query('insert into compras (usuario_id, perfil_id, item_id, precio_pagado) values ($1, $2, $3, $4)', [yo(req).id, id, item.id, item.precio])
      return { monedas: r.rows[0].monedas, inventario: r.rows[0].inventario }
    })
  })

  /** Un adulto del niño le cambia la clave (por si la olvida). */
  app.post('/api/perfiles/:id/clave', conAdulto, async (req) => {
    const id = param(req, 'id')
    await exigirAdminDe(yo(req), id)
    const clave = texto(cuerpo(req).clave, 'la clave')
    if (clave.length < MIN_CLAVE_NINO) throw new Problema(`La clave debe tener al menos ${MIN_CLAVE_NINO} caracteres.`)
    const { rows } = await pool.query('select usuario_id from perfiles_ninos where id = $1', [id])
    if (!rows[0]?.usuario_id) throw new Problema('Este niño todavía no tiene cuenta')
    await pool.query('update usuarios set clave_hash = $1 where id = $2', [await cifrarClave(clave), rows[0].usuario_id])
    await cerrarOtrasSesiones(rows[0].usuario_id)
    return { ok: true }
  })

  /** Código para que otro adulto se sume como admin del niño. */
  app.post('/api/perfiles/:id/invitaciones', conAdulto, async (req) => {
    const id = param(req, 'id')
    await exigirAdminDe(yo(req), id)
    for (let intento = 0; intento < 10; intento++) {
      const { rows } = await pool.query(
        `insert into invitaciones_nino (codigo, perfil_id, creada_por) values ($1, $2, $3) on conflict do nothing returning codigo, perfil_id, creada_por, expira_en`,
        [codigoInvitacion(), id, yo(req).id],
      )
      if (rows[0]) return { codigo: rows[0].codigo, perfilId: rows[0].perfil_id, creadaPor: rows[0].creada_por, expiraEn: rows[0].expira_en }
    }
    throw new Error('No se pudo generar un código')
  })

  app.post('/api/invitaciones/canjear', conAdulto, async (req) => {
    const codigo = texto(cuerpo(req).codigo, 'el código', 10).trim().toUpperCase()
    const perfilId = await enTransaccion(async (c) => {
      const { rows } = await c.query('select perfil_id from invitaciones_nino where codigo = $1 and usada_por is null and expira_en > now() for update', [codigo])
      if (!rows[0]) throw new Problema('Código inválido o vencido')
      await c.query('insert into miembros_nino (perfil_id, cuenta_id, rol) select $1, id, rol from cuentas where id = $2 on conflict do nothing', [rows[0].perfil_id, yo(req).id])
      await c.query('update invitaciones_nino set usada_por = $1, usada_en = now() where codigo = $2', [yo(req).id, codigo])
      return rows[0].perfil_id as string
    })
    return perfilPorId(perfilId)
  })

  // ── Textos y libros ─────────────────────────────────────────────────────

  // Los que subió quien pregunta (sin el texto original, que es grande y la lista no lo usa).
  app.get('/api/textos', conUsuario, async (req) => {
    const { rows } = await pool.query(
      'select id, subido_por, titulo, autor, frases, capitulos, portada, origen, creado_en, actualizado_en from textos where subido_por = $1 order by actualizado_en desc',
      [yo(req).id],
    )
    return rows.map(aTexto)
  })

  app.get('/api/textos/:id', conUsuario, async (req) => {
    if (!(await puedeVerTexto(yo(req), param(req, 'id')))) throw new Prohibido('No tienes acceso a este texto')
    const { rows } = await pool.query('select * from textos where id = $1', [param(req, 'id')])
    return rows[0] ? aTexto(rows[0]) : null
  })

  app.put('/api/textos/:id', conUsuario, async (req) => {
    const id = param(req, 'id')
    const b = cuerpo(req)
    const frases = b.frases
    if (!Array.isArray(frases) || frases.some((f) => typeof f !== 'string')) throw new Problema('Las frases no son válidas')
    if (!Array.isArray(b.capitulos)) throw new Problema('Los capítulos no son válidos')
    const { rows: existente } = await pool.query('select subido_por from textos where id = $1', [id])
    if (existente[0] && existente[0].subido_por !== yo(req).id) throw new Prohibido('Solo quien subió el texto puede cambiarlo')
    const portada = typeof b.portada === 'string' ? texto(b.portada, 'la portada', 200000) : null
    const { rows } = await pool.query(
      `insert into textos (id, subido_por, titulo, autor, texto_original, frases, capitulos, portada, origen)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       on conflict (id) do update set titulo = excluded.titulo, autor = excluded.autor, texto_original = excluded.texto_original,
         frases = excluded.frases, capitulos = excluded.capitulos, portada = excluded.portada, actualizado_en = now()
       returning *`,
      [
        id,
        yo(req).id,
        texto(b.titulo, 'el título').trim() || 'Sin título',
        typeof b.autor === 'string' ? b.autor.slice(0, 200) : null,
        texto(b.textoOriginal ?? '', 'el texto', LIMITE_LIBRO),
        frases,
        JSON.stringify(b.capitulos),
        portada,
        ['pegado', 'pdf', 'ejemplo'].includes(b.origen as string) ? b.origen : 'pegado',
      ],
    )
    return aTexto(rows[0])
  })

  app.delete('/api/textos/:id', conUsuario, async (req) => {
    const { rowCount } = await pool.query('delete from textos where id = $1 and subido_por = $2', [param(req, 'id'), yo(req).id])
    if (!rowCount) throw new Prohibido('Solo quien subió el texto puede borrarlo')
    return { ok: true }
  })

  // ── Biblioteca del niño y progreso ──────────────────────────────────────

  app.get('/api/perfiles/:id/asignaciones', conUsuario, async (req) => {
    await exigirVerNino(yo(req), param(req, 'id'))
    const { rows } = await pool.query('select * from asignaciones where perfil_id = $1 order by actualizada_en desc', [param(req, 'id')])
    return rows.map(aAsignacion)
  })

  app.post('/api/perfiles/:id/asignaciones', conUsuario, async (req) => {
    const perfilId = param(req, 'id')
    const b = cuerpo(req)
    const textoId = texto(b.textoId, 'el texto', 60)
    await exigirVerNino(yo(req), perfilId)
    if (!(await puedeVerTexto(yo(req), textoId))) throw new Prohibido('No tienes acceso a este texto')
    const modo = ['coro', 'eco', 'solo'].includes(b.modo as string) ? b.modo : 'coro'
    // El nivel lo elige un adulto del niño; si el niño agrega un libro, parte en el 1.
    const nivel = (await esAdminDe(yo(req), perfilId)) ? nivelValido(b.nivel) : 1
    await pool.query(
      'insert into asignaciones (asignada_por, perfil_id, texto_id, modo, nivel) values ($1, $2, $3, $4, $5) on conflict (perfil_id, texto_id) do nothing',
      [yo(req).id, perfilId, textoId, modo, nivel],
    )
    const { rows } = await pool.query('select * from asignaciones where perfil_id = $1 and texto_id = $2', [perfilId, textoId])
    return aAsignacion(rows[0])
  })

  async function asignacionPorId(id: string) {
    const { rows } = await pool.query('select a.*, t.subido_por from asignaciones a join textos t on t.id = a.texto_id where a.id = $1', [id])
    if (!rows[0]) throw new Problema('No existe', 404)
    return rows[0]
  }

  app.put('/api/asignaciones/:id/nivel', conAdulto, async (req) => {
    const a = await asignacionPorId(param(req, 'id'))
    await exigirAdminDe(yo(req), a.perfil_id)
    const { rows } = await pool.query('update asignaciones set nivel = $1, actualizada_en = now() where id = $2 returning *', [
      nivelValido(cuerpo(req).nivel),
      param(req, 'id'),
    ])
    return aAsignacion(rows[0])
  })

  app.put('/api/asignaciones/:id/progreso', conUsuario, async (req) => {
    const a = await asignacionPorId(param(req, 'id'))
    await exigirVerNino(yo(req), a.perfil_id)
    const b = cuerpo(req)
    const fraseActual = Math.max(0, entero(b.fraseActual, 'fraseActual'))
    const fraseMaxima = Math.max(0, entero(b.fraseMaxima ?? fraseActual, 'fraseMaxima'))
    const estado = ['pendiente', 'en_curso', 'completada', 'archivada'].includes(b.estado as string) ? b.estado : 'en_curso'
    const { rows } = await pool.query(
      `update asignaciones set frase_actual = $1, frase_maxima = $2, estado = $3, actualizada_en = now(),
         completada_en = case when $3 = 'completada' then coalesce(completada_en, now()) else completada_en end
       where id = $4 returning *`,
      [fraseActual, fraseMaxima, estado, param(req, 'id')],
    )
    return aAsignacion(rows[0])
  })

  // Un adulto puede quitar cualquier libro; el niño, solo lo que subió él.
  app.delete('/api/asignaciones/:id', conUsuario, async (req) => {
    const a = await asignacionPorId(param(req, 'id'))
    const u = yo(req)
    const puede = (await esAdminDe(u, a.perfil_id)) || ((await puedeVerNino(u, a.perfil_id)) && a.subido_por === u.id)
    if (!puede) throw new Prohibido('Solo un adulto puede quitar este libro')
    await pool.query('delete from asignaciones where id = $1', [param(req, 'id')])
    return { ok: true }
  })

  // ── Sesiones de lectura ─────────────────────────────────────────────────

  app.put('/api/sesiones-lectura/:id', conUsuario, async (req) => {
    const id = param(req, 'id')
    const b = cuerpo(req)
    const perfilId = texto(b.perfilId, 'el niño', 60)
    await exigirVerNino(yo(req), perfilId)
    const { rows: existente } = await pool.query('select usuario_id from sesiones_lectura where id = $1', [id])
    if (existente[0] && existente[0].usuario_id !== yo(req).id) throw new Prohibido()
    const n = (v: unknown) => Math.max(0, Math.min(1_000_000, Math.round(Number(v) || 0)))
    const { rows } = await pool.query(
      `insert into sesiones_lectura (id, usuario_id, perfil_id, texto_id, asignacion_id, modo, iniciada_en, duracion_segundos,
         frases_completadas, frases_muy_rapido, silabas_leidas, monedas_ganadas, nivel)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       on conflict (id) do update set duracion_segundos = excluded.duracion_segundos, frases_completadas = excluded.frases_completadas,
         frases_muy_rapido = excluded.frases_muy_rapido, silabas_leidas = excluded.silabas_leidas, monedas_ganadas = excluded.monedas_ganadas
       returning *`,
      [
        id,
        yo(req).id,
        perfilId,
        typeof b.textoId === 'string' ? b.textoId : null,
        typeof b.asignacionId === 'string' ? b.asignacionId : null,
        ['coro', 'eco', 'solo'].includes(b.modo as string) ? b.modo : 'coro',
        typeof b.iniciadaEn === 'string' ? b.iniciadaEn : new Date().toISOString(),
        n(b.duracionSegundos),
        n(b.frasesCompletadas),
        n(b.frasesMuyRapido),
        n(b.silabasLeidas),
        n(b.monedasGanadas),
        // Sesiones de una app anterior a los niveles: nivel 1.
        [1, 2, 3, 4].includes(b.nivel as number) ? b.nivel : 1,
      ],
    )
    return aSesionLectura(rows[0])
  })

  app.get('/api/perfiles/:id/sesiones-lectura', conUsuario, async (req) => {
    await exigirVerNino(yo(req), param(req, 'id'))
    const { rows } = await pool.query('select * from sesiones_lectura where perfil_id = $1 order by iniciada_en desc limit 200', [param(req, 'id')])
    return rows.map(aSesionLectura)
  })

  return app
}
