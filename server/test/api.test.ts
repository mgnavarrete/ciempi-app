/**
 * Pruebas del servidor contra un PostgreSQL real (DATABASE_URL). Recorren los
 * escenarios de permisos: terapeuta, apoderado, niño y extraño. Sin base de datos configurada, se saltan.
 *
 *   npm run test:servidor
 */
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const HAY_BASE = !!process.env.DATABASE_URL

describe.skipIf(!HAY_BASE)('servidor de Ciempi', async () => {
  process.env.NODE_ENV = 'test'
  const { pool, migrar } = await import('../src/db.ts')
  const { crearApp } = await import('../src/app.ts')
  let app: Awaited<ReturnType<typeof crearApp>>

  beforeAll(async () => {
    // Base limpia en cada corrida.
    await pool.query('drop schema public cascade; create schema public')
    await migrar()
    app = await crearApp()
  })
  afterAll(async () => {
    await app?.close()
    await pool.end()
  })

  type Respuesta = { status: number; body: any }
  const pedir = async (metodo: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, token?: string, payload?: object): Promise<Respuesta> => {
    const r = await app.inject({ method: metodo, url, payload, headers: token ? { authorization: `Bearer ${token}` } : {} })
    return { status: r.statusCode, body: r.body ? JSON.parse(r.body) : null }
  }
  const registrar = async (correo: string, rol = 'apoderado') => {
    const r = await pedir('POST', '/api/registro', undefined, { correo, clave: 'clave-segura', nombreVisible: correo.split('@')[0], rol })
    expect(r.status).toBe(200)
    return r.body.token as string
  }

  let T: string, A: string, X: string, N: string
  let perfilId: string, libroT: string, guia: string, asigGuia: string, asigT: string

  it('una terapeuta se registra y crea a un niño con usuario y clave', async () => {
    T = await registrar('terapeuta@test.cl', 'terapeuta')
    const r = await pedir('POST', '/api/perfiles', T, { apodo: 'Tomi', icono: '🦊', usuario: 'Tomi', clave: 'tomi123' })
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ apodo: 'Tomi', usuario: 'tomi', tieneCuenta: true, monedas: 0 })
    perfilId = r.body.id
    const sesion = await pedir('GET', '/api/sesion', T)
    expect(sesion.body.sesion).toMatchObject({ tipo: 'adulto', cuenta: { rol: 'terapeuta', correo: 'terapeuta@test.cl' } })
  })

  it('no deja repetir correo ni usuario de niño', async () => {
    expect((await pedir('POST', '/api/registro', undefined, { correo: 'TERAPEUTA@test.cl', clave: 'otra-clave-1' })).status).toBe(400)
    expect((await pedir('POST', '/api/perfiles', T, { apodo: 'Otro', icono: '🐼', usuario: 'tomi', clave: 'otra12' })).body.error).toMatch(/ya existe/)
  })

  it('el niño entra con su usuario (sin importar mayúsculas) y ve solo su perfil', async () => {
    expect((await pedir('POST', '/api/entrar-nino', undefined, { usuario: 'tomi', clave: 'mala' })).status).toBe(401)
    const r = await pedir('POST', '/api/entrar-nino', undefined, { usuario: 'TOMI', clave: 'tomi123' })
    expect(r.status).toBe(200)
    N = r.body.token
    expect(r.body.sesion).toEqual({ tipo: 'nino', usuarioId: expect.any(String), perfilId })
    const perfiles = await pedir('GET', '/api/perfiles', N)
    expect(perfiles.body.map((p: { id: string }) => p.id)).toEqual([perfilId])
  })

  it('el niño cambia sus ajustes y gana monedas, pero no crea niños ni invita adultos', async () => {
    expect((await pedir('PUT', `/api/perfiles/${perfilId}/ajustes`, N, { ajustes: { tamanoLetra: 50 } })).body.ajustes).toEqual({ tamanoLetra: 50 })
    expect((await pedir('POST', `/api/perfiles/${perfilId}/monedas`, N, { cantidad: 2 })).body.monedas).toBe(2)
    expect((await pedir('POST', '/api/perfiles', N, { apodo: 'x', icono: 'x' })).status).toBe(403)
    expect((await pedir('POST', `/api/perfiles/${perfilId}/invitaciones`, N)).status).toBe(403)
    expect((await pedir('POST', `/api/perfiles/${perfilId}/clave`, N, { clave: 'nueva123' })).status).toBe(403)
  })

  it('el niño sube su guía, la agrega a su biblioteca y guarda progreso', async () => {
    guia = randomUUID()
    const t = await pedir('PUT', `/api/textos/${guia}`, N, { titulo: 'Guía de lenguaje', textoOriginal: 'x', frases: ['Hola.', 'Chao.'], capitulos: [], origen: 'pdf' })
    expect(t.status).toBe(200)
    const a = await pedir('POST', `/api/perfiles/${perfilId}/asignaciones`, N, { textoId: guia })
    expect(a.status).toBe(200)
    asigGuia = a.body.id
    const p = await pedir('PUT', `/api/asignaciones/${asigGuia}/progreso`, N, { fraseActual: 1, fraseMaxima: 1, estado: 'en_curso' })
    expect(p.body).toMatchObject({ fraseActual: 1, fraseMaxima: 1 })
    const s = await pedir('PUT', `/api/sesiones-lectura/${randomUUID()}`, N, { perfilId, modo: 'coro', frasesCompletadas: 1 })
    expect(s.status).toBe(200)
  })

  it('el máximo leído nunca baja, aunque vuelva atrás', async () => {
    const p = await pedir('PUT', `/api/asignaciones/${asigGuia}/progreso`, N, { fraseActual: 0, fraseMaxima: 0, estado: 'en_curso' })
    expect(p.body).toMatchObject({ fraseActual: 0, fraseMaxima: 1 })
  })

  it('la terapeuta le asigna un libro; el niño lo ve pero no lo borra ni lo edita', async () => {
    libroT = randomUUID()
    expect((await pedir('PUT', `/api/textos/${libroT}`, T, { titulo: 'Papelucho', textoOriginal: 'x', frases: ['a'], capitulos: [] })).status).toBe(200)
    asigT = (await pedir('POST', `/api/perfiles/${perfilId}/asignaciones`, T, { textoId: libroT })).body.id
    const biblioteca = await pedir('GET', `/api/perfiles/${perfilId}/asignaciones`, N)
    expect(biblioteca.body).toHaveLength(2)
    expect((await pedir('GET', `/api/textos/${libroT}`, N)).body.titulo).toBe('Papelucho')
    expect((await pedir('DELETE', `/api/asignaciones/${asigT}`, N)).status).toBe(403)
    expect((await pedir('PUT', `/api/textos/${libroT}`, N, { titulo: 'x', textoOriginal: 'x', frases: [], capitulos: [] })).status).toBe(403)
    expect((await pedir('DELETE', `/api/textos/${libroT}`, N)).status).toBe(403)
  })

  it('la terapeuta ve el progreso, la guía y las sesiones del niño', async () => {
    const asig = (await pedir('GET', `/api/perfiles/${perfilId}/asignaciones`, T)).body
    expect(asig.find((a: { id: string }) => a.id === asigGuia).fraseMaxima).toBe(1)
    expect((await pedir('GET', `/api/textos/${guia}`, T)).body.titulo).toBe('Guía de lenguaje')
    expect((await pedir('GET', `/api/perfiles/${perfilId}/sesiones-lectura`, T)).body).toHaveLength(1)
  })

  it('el niño borra su propia guía', async () => {
    expect((await pedir('DELETE', `/api/textos/${guia}`, N)).status).toBe(200)
    expect((await pedir('GET', `/api/perfiles/${perfilId}/asignaciones`, N)).body).toHaveLength(1)
  })

  it('tienda: no compra sin monedas, compra con monedas, no cobra dos veces y solo deja ponerse lo comprado', async () => {
    expect((await pedir('POST', `/api/perfiles/${perfilId}/comprar`, N, { itemId: 'cabeza-corona' })).body.error).toMatch(/Te faltan 23 monedas/)
    expect((await pedir('PUT', `/api/perfiles/${perfilId}/ciempi`, N, { apariencia: { cabeza: 'cabeza-corona' } })).status).toBe(403)
    const ok = await pedir('PUT', `/api/perfiles/${perfilId}/ciempi`, N, { apariencia: { nombre: 'Rayito', genero: 'nino', cabeza: 'cabeza-antenas' } })
    expect(ok.body.ciempi).toMatchObject({ nombre: 'Rayito', cabeza: 'cabeza-antenas' })
    await pedir('POST', `/api/perfiles/${perfilId}/monedas`, T, { cantidad: 28 })
    expect((await pedir('POST', `/api/perfiles/${perfilId}/comprar`, N, { itemId: 'cabeza-corona' })).body).toEqual({ monedas: 5, inventario: ['cabeza-corona'] })
    expect((await pedir('POST', `/api/perfiles/${perfilId}/comprar`, N, { itemId: 'cabeza-corona' })).body).toEqual({ monedas: 5, inventario: ['cabeza-corona'] })
    expect((await pedir('PUT', `/api/perfiles/${perfilId}/ciempi`, N, { apariencia: { nombre: 'Rayito', cabeza: 'cabeza-corona' } })).body.ciempi.cabeza).toBe('cabeza-corona')
    expect((await pedir('POST', `/api/perfiles/${perfilId}/comprar`, N, { itemId: 'cabeza-dragon' })).status).toBe(400)
    expect((await pedir('PUT', `/api/perfiles/${perfilId}/ciempi`, N, { apariencia: { nombre: 'x'.repeat(25) } })).status).toBe(400)
  })

  it('la terapeuta cambia la clave del niño: la vieja deja de servir y se cierran sus sesiones', async () => {
    expect((await pedir('POST', `/api/perfiles/${perfilId}/clave`, T, { clave: 'nueva456' })).status).toBe(200)
    expect((await pedir('GET', '/api/perfiles', N)).status).toBe(401)
    expect((await pedir('POST', '/api/entrar-nino', undefined, { usuario: 'tomi', clave: 'tomi123' })).status).toBe(401)
    N = (await pedir('POST', '/api/entrar-nino', undefined, { usuario: 'tomi', clave: 'nueva456' })).body.token
    expect(N).toBeTruthy()
  })

  it('el apoderado se suma con un código y ve la biblioteca del niño', async () => {
    A = await registrar('apoderado@test.cl')
    expect((await pedir('GET', '/api/perfiles', A)).body).toHaveLength(0)
    const inv = await pedir('POST', `/api/perfiles/${perfilId}/invitaciones`, T)
    expect(inv.body.codigo).toMatch(/^[A-Z2-9]{6}$/)
    expect((await pedir('POST', '/api/invitaciones/canjear', N, { codigo: inv.body.codigo })).status).toBe(403)
    expect((await pedir('POST', '/api/invitaciones/canjear', A, { codigo: inv.body.codigo.toLowerCase() })).body.id).toBe(perfilId)
    expect((await pedir('GET', `/api/perfiles/${perfilId}/asignaciones`, A)).body).toHaveLength(1)
    expect((await pedir('POST', '/api/invitaciones/canjear', A, { codigo: inv.body.codigo })).status).toBe(400)
  })

  it('un extraño no ve ni puede hacer nada', async () => {
    X = await registrar('extrano@test.cl')
    expect((await pedir('GET', '/api/perfiles', X)).body).toHaveLength(0)
    expect((await pedir('GET', `/api/perfiles/${perfilId}`, X)).status).toBe(403)
    expect((await pedir('GET', `/api/textos/${libroT}`, X)).status).toBe(403)
    expect((await pedir('GET', `/api/perfiles/${perfilId}/asignaciones`, X)).status).toBe(403)
    expect((await pedir('POST', `/api/perfiles/${perfilId}/monedas`, X, { cantidad: 100 })).status).toBe(403)
    expect((await pedir('POST', `/api/perfiles/${perfilId}/comprar`, X, { itemId: 'cabeza-mago' })).status).toBe(403)
    expect((await pedir('POST', `/api/perfiles/${perfilId}/asignaciones`, X, { textoId: libroT })).status).toBe(403)
    expect((await pedir('PUT', `/api/asignaciones/${asigT}/progreso`, X, { fraseActual: 0 })).status).toBe(403)
    expect((await pedir('PUT', `/api/sesiones-lectura/${randomUUID()}`, X, { perfilId, modo: 'coro' })).status).toBe(403)
    expect((await pedir('GET', '/api/perfiles')).status).toBe(401)
  })

  it('recuperar contraseña: el enlace sirve una sola vez y cierra las sesiones viejas', async () => {
    expect((await pedir('POST', '/api/recuperar', undefined, { correo: 'nadie@test.cl' })).status).toBe(200)
    const { crearRecuperacion } = await import('../src/auth.ts')
    const { rows } = await pool.query(`select id from usuarios where correo = 'apoderado@test.cl'`)
    const enlace = await crearRecuperacion(rows[0].id)
    const r = await pedir('POST', '/api/recuperar/confirmar', undefined, { token: enlace, clave: 'clave-nueva-2' })
    expect(r.status).toBe(200)
    expect(r.body.sesion.tipo).toBe('adulto')
    expect((await pedir('GET', '/api/perfiles', A)).status).toBe(401)
    expect((await pedir('POST', '/api/recuperar/confirmar', undefined, { token: enlace, clave: 'otra-clave-3' })).status).toBe(400)
    expect((await pedir('POST', '/api/entrar', undefined, { correo: 'apoderado@test.cl', clave: 'clave-nueva-2' })).status).toBe(200)
  })

  it('bloquea después de 5 intentos fallidos', async () => {
    for (let i = 0; i < 5; i++) await pedir('POST', '/api/entrar', undefined, { correo: 'extrano@test.cl', clave: 'mala-mala' })
    expect((await pedir('POST', '/api/entrar', undefined, { correo: 'extrano@test.cl', clave: 'clave-segura' })).status).toBe(429)
  })

  it('voz de Ciempi: pide el audio al servicio de voz, lo guarda y avisa si no está', async () => {
    // Servicio de voz falso (el real es server/voz, con Piper).
    const pedidos: string[] = []
    const falso = createServer((req, res) => {
      pedidos.push(req.url!)
      res.writeHead(200, { 'Content-Type': 'audio/wav' }).end(Buffer.from('RIFF-falso'))
    })
    await new Promise<void>((ok) => falso.listen(0, '127.0.0.1', ok))
    process.env.VOZ_URL = `http://127.0.0.1:${(falso.address() as { port: number }).port}`
    const voz = (url: string, tok?: string) => app.inject({ method: 'GET', url, headers: tok ? { authorization: `Bearer ${tok}` } : {} })
    try {
      expect((await voz('/api/voz?texto=hola')).statusCode).toBe(401)
      const r = await voz('/api/voz?texto=despacio&voz=nina&velocidad=0.93', N)
      expect(r.statusCode).toBe(200)
      expect(r.headers['content-type']).toBe('audio/wav')
      expect(r.rawPayload.toString()).toBe('RIFF-falso')
      expect(pedidos).toEqual(['/voz?texto=despacio&voz=nina&velocidad=0.95'])
      // La segunda vez sale de la base, sin volver a generarla.
      expect((await voz('/api/voz?texto=despacio&voz=nina&velocidad=0.95', N)).statusCode).toBe(200)
      expect(pedidos).toHaveLength(1)
      expect((await voz(`/api/voz?texto=${'a'.repeat(301)}`, N)).statusCode).toBe(400)
    } finally {
      await new Promise((ok) => falso.close(ok))
    }
    // Servicio de voz apagado: la app usa la voz del teléfono.
    expect((await voz('/api/voz?texto=otra', N)).statusCode).toBe(503)
  })
})
