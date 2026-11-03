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
    await (await import('../src/cuentos.ts')).sembrarCuentos()
    app = await crearApp()
  })
  afterAll(async () => {
    await app?.close()
    await pool.end()
  })

  type Respuesta = { status: number; body: any }
  // La biblioteca sin los cuentos de Ciempi (que todo niño recibe al crearse).
  const { CUENTOS } = await import('../../src/contenido/cuentos.ts')
  const sinCuentos = (asignaciones: { textoId: string }[]) => asignaciones.filter((a) => !CUENTOS.some((c) => c.id === a.textoId))
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

  it('el niño cambia sus ajustes, pero no se suma monedas ni crea niños ni invita adultos', async () => {
    expect((await pedir('PUT', `/api/perfiles/${perfilId}/ajustes`, N, { ajustes: { tamanoLetra: 50 } })).body.ajustes).toEqual({ tamanoLetra: 50 })
    // Desde 2.5 el endpoint viejo no suma: las monedas por leer las calcula el servidor.
    expect((await pedir('POST', `/api/perfiles/${perfilId}/monedas`, N, { cantidad: 2 })).body.monedas).toBe(0)
    expect((await pedir('POST', `/api/perfiles/${perfilId}/monedas`, N, { cantidad: 2, motivo: 'me lo regalo' })).body.monedas).toBe(0)
    expect((await pedir('POST', '/api/perfiles', N, { apodo: 'x', icono: 'x' })).status).toBe(403)
    expect((await pedir('POST', `/api/perfiles/${perfilId}/invitaciones`, N)).status).toBe(403)
    expect((await pedir('POST', `/api/perfiles/${perfilId}/clave`, N, { clave: 'nueva123' })).status).toBe(403)
  })

  it('el niño sube su guía, la agrega a su biblioteca (pendiente), la terapeuta la autoriza con su PIN y guarda progreso', async () => {
    guia = randomUUID()
    const t = await pedir('PUT', `/api/textos/${guia}`, N, { titulo: 'Guía de lenguaje', textoOriginal: 'x', frases: ['Hola.', 'Chao.'], capitulos: [], origen: 'pdf' })
    expect(t.status).toBe(200)
    const a = await pedir('POST', `/api/perfiles/${perfilId}/asignaciones`, N, { textoId: guia })
    expect(a.status).toBe(200)
    expect(a.body.autorizacion).toBe('pendiente')
    asigGuia = a.body.id
    expect((await pedir('PUT', '/api/mi-pin', T, { pin: '2580', clave: 'clave-segura' })).status).toBe(200)
    expect((await pedir('POST', `/api/asignaciones/${asigGuia}/autorizar`, N, { pin: '2580' })).body.autorizacion).toBe('autorizada')
    const p = await pedir('PUT', `/api/asignaciones/${asigGuia}/progreso`, N, { fraseActual: 1, fraseMaxima: 1, estado: 'en_curso' })
    expect(p.body).toMatchObject({ fraseActual: 1, fraseMaxima: 1 })
    const s = await pedir('PUT', `/api/sesiones-lectura/${randomUUID()}`, N, { perfilId, modo: 'coro', frasesCompletadas: 1 })
    expect(s.status).toBe(200)
  })

  it('el máximo leído nunca baja, aunque vuelva atrás', async () => {
    const p = await pedir('PUT', `/api/asignaciones/${asigGuia}/progreso`, N, { fraseActual: 0, fraseMaxima: 0, estado: 'en_curso' })
    expect(p.body).toMatchObject({ fraseActual: 0, fraseMaxima: 1 })
  })

  it('lo leído no baja; los premios ya no los decide la app (una app anterior cobra por su avance)', async () => {
    const url = `/api/asignaciones/${asigGuia}/progreso`
    const p = await pedir('PUT', url, N, { fraseActual: 1, fraseMaxima: 1, estado: 'en_curso', leidoHasta: 1, premioHasta: 50, relecturaPremiadaEn: '2026-10-28' })
    // premioHasta y la relectura que manda la app no se guardan; la frase leída se paga (1 moneda) y queda pagada.
    expect(p.body).toMatchObject({ leidoHasta: 1, pagadoHasta: 1, premioHasta: 0, relecturaPremiadaEn: null })
    expect((await pedir('GET', `/api/perfiles/${perfilId}`, N)).body.monedas).toBe(1)
    // Vuelve a empezar desde el comienzo: no se pierde lo leído ni se paga otra vez.
    const otra = await pedir('PUT', url, N, { fraseActual: 0, fraseMaxima: 0, estado: 'en_curso', leidoHasta: 1, premioHasta: 0 })
    expect(otra.body).toMatchObject({ fraseActual: 0, leidoHasta: 1, pagadoHasta: 1 })
    expect((await pedir('GET', `/api/perfiles/${perfilId}`, N)).body.monedas).toBe(1)
  })

  it('la terapeuta le asigna un libro; el niño lo ve pero no lo borra ni lo edita', async () => {
    libroT = randomUUID()
    expect((await pedir('PUT', `/api/textos/${libroT}`, T, { titulo: 'Libro de la terapeuta', textoOriginal: 'x', frases: ['a'], capitulos: [] })).status).toBe(200)
    asigT = (await pedir('POST', `/api/perfiles/${perfilId}/asignaciones`, T, { textoId: libroT })).body.id
    const biblioteca = await pedir('GET', `/api/perfiles/${perfilId}/asignaciones`, N)
    expect(sinCuentos(biblioteca.body)).toHaveLength(2)
    expect((await pedir('GET', `/api/textos/${libroT}`, N)).body.titulo).toBe('Libro de la terapeuta')
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
    expect(sinCuentos((await pedir('GET', `/api/perfiles/${perfilId}/asignaciones`, N)).body)).toHaveLength(1)
  })

  it('tienda: no compra sin monedas, compra con monedas, no cobra dos veces y solo deja ponerse lo comprado', async () => {
    const corona = 'cabeza:b06-ia-corona'
    expect((await pedir('POST', `/api/perfiles/${perfilId}/comprar`, N, { itemId: corona })).body.error).toMatch(/Te faltan 24 monedas/)
    expect((await pedir('PUT', `/api/perfiles/${perfilId}/ciempi`, N, { apariencia: { cabeza: corona } })).status).toBe(403)
    const ok = await pedir('PUT', `/api/perfiles/${perfilId}/ciempi`, N, { apariencia: { nombre: 'Rayito', genero: 'nino', cabeza: 'cabeza:cabeza-nada' } })
    expect(ok.body.ciempi).toMatchObject({ nombre: 'Rayito', cabeza: 'cabeza:cabeza-nada' })
    // Un adulto del niño sí puede darle monedas a mano, con un motivo (queda anotado).
    expect((await pedir('POST', `/api/perfiles/${perfilId}/monedas`, T, { cantidad: 28, motivo: 'Terminó la guía en la consulta' })).body).toEqual({ monedas: 29, otorgadas: 28 })
    expect((await pedir('POST', `/api/perfiles/${perfilId}/comprar`, N, { itemId: corona })).body).toEqual({ monedas: 4, inventario: [corona] })
    expect((await pedir('POST', `/api/perfiles/${perfilId}/comprar`, N, { itemId: corona })).body).toEqual({ monedas: 4, inventario: [corona] })
    expect((await pedir('PUT', `/api/perfiles/${perfilId}/ciempi`, N, { apariencia: { nombre: 'Rayito', cabeza: corona } })).body.ciempi.cabeza).toBe(corona)
    // Lo de la tienda anterior ya no se vende.
    expect((await pedir('POST', `/api/perfiles/${perfilId}/comprar`, N, { itemId: 'cabeza-corona' })).status).toBe(400)
    expect((await pedir('PUT', `/api/perfiles/${perfilId}/ciempi`, N, { apariencia: { nombre: 'x'.repeat(25) } })).status).toBe(400)
  })

  it('tienda: un conjunto se compra como pack (20 % menos), trae sus piezas y no cobra más de lo mostrado', async () => {
    await pedir('POST', `/api/perfiles/${perfilId}/monedas`, T, { cantidad: 96, motivo: 'Para probar los conjuntos' })
    // Si la app mostró un precio menor (por ejemplo, una versión antigua), no se cobra.
    expect((await pedir('POST', `/api/perfiles/${perfilId}/comprar`, N, { itemId: 'conjunto:b12-set-robot', precioVisto: 60 })).body.error).toMatch(/ahora cuesta 71/)
    const r = await pedir('POST', `/api/perfiles/${perfilId}/comprar`, N, { itemId: 'conjunto:b12-set-robot', precioVisto: 71 })
    // Máscara 32 + armadura 32 + botas 24 = 88 → 71.
    expect(r.body.monedas).toBe(100 - 71)
    expect(r.body.inventario).toEqual(expect.arrayContaining(['conjunto:b12-set-robot', 'cabeza:b07-ia-robot', 'textura:b11-robot', 'pies:b10-robot']))
    const puesto = await pedir('PUT', `/api/perfiles/${perfilId}/ciempi`, N, {
      apariencia: { nombre: 'Rayito', cabeza: 'cabeza:b07-ia-robot', textura: 'textura:b11-robot', pies: 'pies:b10-robot' },
    })
    expect(puesto.body.ciempi).toMatchObject({ cabeza: 'cabeza:b07-ia-robot', pies: 'pies:b10-robot' })
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
    expect(sinCuentos((await pedir('GET', `/api/perfiles/${perfilId}/asignaciones`, A)).body)).toHaveLength(1)
    expect((await pedir('POST', '/api/invitaciones/canjear', A, { codigo: inv.body.codigo })).status).toBe(400)
  })

  it('un extraño no ve ni puede hacer nada', async () => {
    X = await registrar('extrano@test.cl')
    expect((await pedir('GET', '/api/perfiles', X)).body).toHaveLength(0)
    expect((await pedir('GET', `/api/perfiles/${perfilId}`, X)).status).toBe(403)
    expect((await pedir('GET', `/api/textos/${libroT}`, X)).status).toBe(403)
    expect((await pedir('GET', `/api/perfiles/${perfilId}/asignaciones`, X)).status).toBe(403)
    expect((await pedir('POST', `/api/perfiles/${perfilId}/monedas`, X, { cantidad: 100 })).status).toBe(403)
    expect((await pedir('POST', `/api/perfiles/${perfilId}/comprar`, X, { itemId: 'cabeza:b06-ia-mago' })).status).toBe(403)
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
    // Servicio de voz falso (el real es server/voz, con Kokoro).
    const pedidos: string[] = []
    const falso = createServer((req, res) => {
      if (req.url === '/salud') return void res.end('ok')
      pedidos.push(req.url!)
      res.writeHead(200, { 'Content-Type': 'audio/wav' }).end(Buffer.from('RIFF-falso'))
    })
    await new Promise<void>((ok) => falso.listen(0, '127.0.0.1', ok))
    process.env.VOZ_URL = `http://127.0.0.1:${(falso.address() as { port: number }).port}`
    const voz = (url: string, tok?: string) => app.inject({ method: 'GET', url, headers: tok ? { authorization: `Bearer ${tok}` } : {} })
    try {
      expect((await voz('/api/voz?texto=hola')).statusCode).toBe(401)
      expect((await voz('/api/voz/estado', N)).statusCode).toBe(200)
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
    expect((await voz('/api/voz/estado', N)).statusCode).toBe(503)
  })

  it('voz de Ciempi con Azure: Lorenzo y Paloma, sin silencio inicial, y Kokoro si Azure falla', async () => {
    // Un WAV de 24 kHz con 0,1 s de silencio, 0,05 s de sonido y 0,1 s de silencio.
    const wav = (() => {
      const muestras = new Int16Array(2400 + 1200 + 2400)
      muestras.fill(8000, 2400, 3600)
      const datos = Buffer.from(muestras.buffer)
      const c = Buffer.alloc(44)
      c.write('RIFF', 0); c.writeUInt32LE(36 + datos.length, 4); c.write('WAVE', 8); c.write('fmt ', 12)
      c.writeUInt32LE(16, 16); c.writeUInt16LE(1, 20); c.writeUInt16LE(1, 22); c.writeUInt32LE(24000, 24)
      c.writeUInt32LE(48000, 28); c.writeUInt16LE(2, 32); c.writeUInt16LE(16, 34); c.write('data', 36); c.writeUInt32LE(datos.length, 40)
      return Buffer.concat([c, datos])
    })()
    const recibido: { ssml: string; clave?: string; formato?: string }[] = []
    let azureCaido = false
    const azure = createServer((req, res) => {
      if (azureCaido) return void res.writeHead(500).end()
      if (req.url === '/cognitiveservices/voices/list') return void res.end('[]')
      let ssml = ''
      req.on('data', (d) => (ssml += d))
      req.on('end', () => {
        recibido.push({ ssml, clave: req.headers['ocp-apim-subscription-key'] as string, formato: req.headers['x-microsoft-outputformat'] as string })
        res.writeHead(200, { 'Content-Type': 'audio/wav' }).end(wav)
      })
    })
    const local = createServer((req, res) => (req.url === '/salud' ? res.end('ok') : res.writeHead(200).end(Buffer.from('RIFF-local'))))
    await Promise.all([azure, local].map((s) => new Promise<void>((ok) => s.listen(0, '127.0.0.1', ok))))
    const puerto = (s: typeof azure) => (s.address() as { port: number }).port
    Object.assign(process.env, { AZURE_SPEECH_KEY: 'clave-de-prueba', AZURE_SPEECH_URL: `http://127.0.0.1:${puerto(azure)}`, VOZ_URL: `http://127.0.0.1:${puerto(local)}` })
    const voz = (url: string) => app.inject({ method: 'GET', url, headers: { authorization: `Bearer ${N}` } })
    try {
      expect((await voz('/api/voz/estado')).json()).toEqual({ ok: true, proveedor: 'azure' })

      const nino = await voz('/api/voz?texto=jard%C3%ADn&voz=nino&velocidad=0.8')
      expect(nino.statusCode).toBe(200)
      expect(recibido[0]).toMatchObject({ clave: 'clave-de-prueba', formato: 'riff-24khz-16bit-mono-pcm' })
      expect(recibido[0].ssml).toContain('<voice name="es-CL-LorenzoNeural"><prosody rate="-20%">jardín</prosody>')
      // Se quitó el silencio: queda el sonido más 15 ms a cada lado (360 muestras).
      expect(nino.rawPayload.length).toBe(44 + (1200 + 2 * 360) * 2)

      await voz('/api/voz?texto=a%3Cb&voz=nina')
      expect(recibido[1].ssml).toContain('<voice name="es-US-PalomaNeural"><prosody rate="0%">a&#60;b</prosody>')

      // Lo ya generado no se vuelve a pedir; si Azure se cae, lo nuevo sale de Kokoro.
      azureCaido = true
      expect((await voz('/api/voz?texto=jard%C3%ADn&voz=nino&velocidad=0.8')).statusCode).toBe(200)
      const respaldo = await voz('/api/voz?texto=nuevo&voz=nino')
      expect(respaldo.rawPayload.toString()).toBe('RIFF-local')
      expect(recibido).toHaveLength(2)
      expect((await voz('/api/voz/estado')).json()).toEqual({ ok: true, proveedor: 'kokoro' })
    } finally {
      delete process.env.AZURE_SPEECH_KEY
      delete process.env.AZURE_SPEECH_URL
      await Promise.all([azure, local].map((s) => new Promise((ok) => s.close(ok))))
    }
  })

  it('voz de Ciempi con xAI: Leo y Ara en español de México', async () => {
    const recibido: { cuerpo: Record<string, unknown>; auth?: string }[] = []
    const xai = createServer((req, res) => {
      if (req.url === '/v1/tts/voices') return void res.end('{"voices":[]}')
      let cuerpo = ''
      req.on('data', (d) => (cuerpo += d))
      req.on('end', () => {
        recibido.push({ cuerpo: JSON.parse(cuerpo), auth: req.headers.authorization })
        res.writeHead(200, { 'Content-Type': 'audio/wav' }).end(Buffer.from('RIFF-xai'))
      })
    })
    await new Promise<void>((ok) => xai.listen(0, '127.0.0.1', ok))
    Object.assign(process.env, { XAI_API_KEY: 'xai-prueba', XAI_URL: `http://127.0.0.1:${(xai.address() as { port: number }).port}` })
    const voz = (url: string) => app.inject({ method: 'GET', url, headers: { authorization: `Bearer ${N}` } })
    try {
      expect((await voz('/api/voz/estado')).json()).toEqual({ ok: true, proveedor: 'xai' })
      expect((await voz('/api/voz?texto=mariposa&voz=nino&velocidad=0.6')).rawPayload.toString()).toBe('RIFF-xai')
      await voz('/api/voz?texto=mariposa&voz=nina')
      expect(recibido[0].auth).toBe('Bearer xai-prueba')
      expect(recibido[0].cuerpo).toMatchObject({ text: 'mariposa', voice_id: 'leo', language: 'es-MX', speed: 0.7, output_format: { codec: 'wav' } })
      expect(recibido[1].cuerpo).toMatchObject({ voice_id: 'ara', speed: 1 })
    } finally {
      delete process.env.XAI_API_KEY
      delete process.env.XAI_URL
      await new Promise((ok) => xai.close(ok))
    }
  })

  it('voces de Microsoft: cada voz con su nombre, frases guardadas y MP3', async () => {
    // Un «python» falso: escribe la voz y el texto que le pidieron como si fueran el audio.
    const { mkdtempSync, writeFileSync, chmodSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    const dir = mkdtempSync(`${tmpdir()}/voz-`)
    const contador = `${dir}/veces`
    writeFileSync(`${dir}/python`, `#!/bin/sh\necho x >> ${contador}\nprintf 'ID3 %s %s ' "$2" "$3"\ncat\n`)
    chmodSync(`${dir}/python`, 0o755)
    process.env.VOZ_MICROSOFT_PYTHON = `${dir}/python`
    const voz = (url: string) => app.inject({ method: 'GET', url, headers: { authorization: `Bearer ${N}` } })
    const { readFileSync } = await import('node:fs')
    const veces = () => readFileSync(contador, 'utf8').split('\n').filter(Boolean).length
    try {
      expect((await voz('/api/voz/estado')).json()).toEqual({ ok: true, proveedor: 'microsoft' })
      const frase = 'Hoy es el primer día de clases.'
      const r = await voz(`/api/voz?${new URLSearchParams({ texto: frase, voz: 'paloma', velocidad: '1' })}`)
      expect(r.headers['content-type']).toBe('audio/mpeg')
      expect(r.rawPayload.toString()).toBe(`ID3 es-US-PalomaNeural +0% ${frase}`)
      // Ciempi niño habla con Lorenzo y niña con Catalina.
      expect((await voz('/api/voz?texto=hola&voz=nino')).rawPayload.toString()).toContain('es-CL-LorenzoNeural')
      expect((await voz('/api/voz?texto=hola&voz=nina')).rawPayload.toString()).toContain('es-CL-CatalinaNeural')
      // La frase quedó guardada: la segunda vez no se vuelve a generar.
      const antes = veces()
      await voz(`/api/voz?${new URLSearchParams({ texto: frase, voz: 'paloma', velocidad: '1' })}`)
      expect(veces()).toBe(antes)
    } finally {
      delete process.env.VOZ_MICROSOFT_PYTHON
    }
  })

  it('niveles: el adulto elige el nivel del libro para cada niño; el niño no lo cambia', async () => {
    const libro = randomUUID()
    await pedir('PUT', `/api/textos/${libro}`, T, { titulo: 'Poemas', textoOriginal: 'x', frases: ['Uno.', 'Dos.'], capitulos: [], origen: 'pegado' })
    const a = await pedir('POST', `/api/perfiles/${perfilId}/asignaciones`, T, { textoId: libro, nivel: 2 })
    expect(a.body).toMatchObject({ textoId: libro, nivel: 2 })
    expect((await pedir('POST', `/api/perfiles/${perfilId}/asignaciones`, T, { textoId: libro, nivel: 7 })).status).toBe(400)
    // El niño no puede cambiar el nivel; un adulto suyo sí.
    expect((await pedir('PUT', `/api/asignaciones/${a.body.id}/nivel`, N, { nivel: 1 })).status).toBe(403)
    expect((await pedir('PUT', `/api/asignaciones/${a.body.id}/nivel`, X, { nivel: 1 })).status).toBe(403)
    expect((await pedir('PUT', `/api/asignaciones/${a.body.id}/nivel`, T, { nivel: 3 })).body.nivel).toBe(3)
    // Nivel 0 (sílabas) existe; el 5 no.
    expect((await pedir('PUT', `/api/asignaciones/${a.body.id}/nivel`, T, { nivel: 0 })).body.nivel).toBe(0)
    expect((await pedir('PUT', `/api/asignaciones/${a.body.id}/nivel`, T, { nivel: 5 })).status).toBe(400)
    // Si el niño agrega un libro, queda en el nivel sugerido (1 para una frase corta) aunque pida otro.
    const suyo = randomUUID()
    await pedir('PUT', `/api/textos/${suyo}`, N, { titulo: 'Mi guía', textoOriginal: 'x', frases: ['Hola.'], capitulos: [], origen: 'pdf' })
    expect((await pedir('POST', `/api/perfiles/${perfilId}/asignaciones`, N, { textoId: suyo, nivel: 4 })).body.nivel).toBe(1)
    // La sesión guarda el nivel; una app vieja que no lo manda queda en 1.
    const s = await pedir('PUT', `/api/sesiones-lectura/${randomUUID()}`, N, { perfilId, nivel: 3, iniciadaEn: new Date().toISOString() })
    expect(s.body.nivel).toBe(3)
    expect((await pedir('PUT', `/api/sesiones-lectura/${randomUUID()}`, N, { perfilId })).body.nivel).toBe(1)
  })

  it('cuentos de Ciempi: todo niño nuevo los tiene en su nivel, nadie los borra y los ven todos', async () => {
    const nuevo = await pedir('POST', '/api/perfiles', T, { apodo: 'Lu', icono: '🐱' })
    const biblioteca = (await pedir('GET', `/api/perfiles/${nuevo.body.id}/asignaciones`, T)).body as { textoId: string; nivel: number }[]
    expect(biblioteca).toHaveLength(CUENTOS.length)
    for (const c of CUENTOS) expect(biblioteca.find((a) => a.textoId === c.id)?.nivel).toBe(c.nivel)
    const poema = CUENTOS.find((c) => c.titulo === 'Canción de Don Ciempiés')!
    const texto = (await pedir('GET', `/api/textos/${poema.id}`, X)).body
    expect(texto).toMatchObject({ subidoPor: null, origen: 'ciempi', autor: 'Cuentos de Ciempi', parrafos: [0, 4, 8, 12] })
    expect((await pedir('GET', '/api/textos', X)).body.filter((t: { origen: string }) => t.origen === 'ciempi')).toHaveLength(CUENTOS.length)
    expect((await pedir('DELETE', `/api/textos/${poema.id}`, T)).status).toBe(403)
    expect((await pedir('PUT', `/api/textos/${poema.id}`, T, { titulo: 'x', textoOriginal: 'x', frases: [], capitulos: [] })).status).toBe(403)
    // Volver a sembrar no repite ni devuelve un cuento que un adulto quitó.
    const quitado = biblioteca.find((a) => a.textoId === poema.id) as unknown as { id: string }
    expect((await pedir('DELETE', `/api/asignaciones/${quitado.id}`, T)).status).toBe(200)
    await (await import('../src/cuentos.ts')).sembrarCuentos()
    expect((await pedir('GET', `/api/perfiles/${nuevo.body.id}/asignaciones`, T)).body).toHaveLength(CUENTOS.length - 1)
  })

  it('los párrafos de un texto se guardan si son válidos', async () => {
    const id = randomUUID()
    const frases = ['Uno.', 'Dos.', 'Tres.']
    expect((await pedir('PUT', `/api/textos/${id}`, T, { titulo: 'P', textoOriginal: 'x', frases, capitulos: [], parrafos: [0, 2] })).body.parrafos).toEqual([0, 2])
    expect((await pedir('PUT', `/api/textos/${id}`, T, { titulo: 'P', textoOriginal: 'x', frases, capitulos: [], parrafos: [2, 0] })).body.parrafos).toBeUndefined()
  })

  it('compartir: un adulto pasa a otro niño un libro que subió un niño suyo', async () => {
    const otro = await pedir('POST', '/api/perfiles', T, { apodo: 'Ana', icono: '🐼' })
    const guiaDeTomi = randomUUID()
    await pedir('PUT', `/api/textos/${guiaDeTomi}`, N, { titulo: 'Guía de Tomi', textoOriginal: 'x', frases: ['Hola.'], capitulos: [], origen: 'pdf' })
    await pedir('POST', `/api/perfiles/${perfilId}/asignaciones`, N, { textoId: guiaDeTomi })
    const r = await pedir('POST', `/api/perfiles/${otro.body.id}/asignaciones`, T, { textoId: guiaDeTomi, nivel: 2 })
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ perfilId: otro.body.id, nivel: 2 })
  })

  // ── Registro de premios (CIEMPI 2.5): el servidor calcula y anota las monedas ──
  describe('registro de premios', () => {
    // Una app con la hora en la mano, para revisar la plausibilidad temporal.
    let ahora = Date.now()
    let appReloj: Awaited<ReturnType<typeof crearApp>>
    const pedirR = async (metodo: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, token?: string, payload?: object): Promise<Respuesta> => {
      const r = await appReloj.inject({ method: metodo, url, payload, headers: token ? { authorization: `Bearer ${token}` } : {} })
      return { status: r.statusCode, body: r.body ? JSON.parse(r.body) : null }
    }
    const hoyUtc = () => new Date(ahora).toISOString().slice(0, 10)
    let P: string, K: string, K2: string, ninoId: string
    let op = 0
    const nuevoOp = () => `prueba-${randomUUID()}-${++op}`
    const saldo = async () => (await pedirR('GET', `/api/perfiles/${ninoId}`, P)).body.monedas as number
    /** Un libro del adulto en la biblioteca del niño, en un nivel. */
    const libro = async (frases: string[], nivel: number, token = P) => {
      const id = randomUUID()
      expect((await pedirR('PUT', `/api/textos/${id}`, token, { titulo: `Libro ${id.slice(0, 4)}`, textoOriginal: 'x', frases, capitulos: [], origen: 'pegado' })).status).toBe(200)
      const a = await pedirR('POST', `/api/perfiles/${ninoId}/asignaciones`, token, { textoId: id, nivel })
      if (a.body.nivel !== nivel) await pedirR('PUT', `/api/asignaciones/${a.body.id}/nivel`, P, { nivel })
      return { textoId: id, asignacionId: a.body.id as string }
    }
    const avance = (asignacionId: string, hasta: number, token = K, extra: object = {}) =>
      pedirR('POST', `/api/asignaciones/${asignacionId}/premios`, token, { operationId: nuevoOp(), tipo: 'avance', hasta, conPremio: true, ...extra })
    // Cada libro con su propio contenido (el mismo texto dos veces no vuelve a pagar: ver la prueba de borrar y subir).
    let libros = 0
    const frases = (n: number, palabras = 3) => {
      const k = ++libros
      return Array.from({ length: n }, (_, i) => `${Array.from({ length: palabras }, (_, j) => `libro${k}palabra${i}x${j}`).join(' ')}.`)
    }

    beforeAll(async () => {
      appReloj = await crearApp({ ahora: () => ahora })
      const r = await pedirR('POST', '/api/registro', undefined, { correo: 'premios@test.cl', clave: 'clave-segura', nombreVisible: 'Mamá', rol: 'apoderado' })
      P = r.body.token
      await pedirR('PUT', '/api/mi-pin', P, { pin: '2580', clave: 'clave-segura' })
      ninoId = (await pedirR('POST', '/api/perfiles', P, { apodo: 'Pía', icono: '🐝', usuario: 'pia', clave: 'pia123' })).body.id
      K = (await pedirR('POST', '/api/entrar-nino', undefined, { usuario: 'pia', clave: 'pia123' })).body.token
      // El mismo niño en otro dispositivo.
      K2 = (await pedirR('POST', '/api/entrar-nino', undefined, { usuario: 'pia', clave: 'pia123' })).body.token
    })
    afterAll(async () => {
      await appReloj?.close()
    })

    it('el servidor calcula lo que corresponde: lo que pide la app no cuenta', async () => {
      const { asignacionId } = await libro(frases(5), 1)
      const r = await pedirR('POST', `/api/asignaciones/${asignacionId}/premios`, K, { operationId: nuevoOp(), tipo: 'avance', hasta: 1, conPremio: true, esperadas: 100 })
      expect(r.status).toBe(200)
      expect(r.body).toMatchObject({ estado: 'otorgado', otorgadas: 1, monedas: 1, leidoHasta: 1, pagadoHasta: 1 })
      const { rows } = await pool.query(`select solicitadas, monedas, saldo, detalle from premios where perfil_id = $1 and tipo = 'avance'`, [ninoId])
      expect(rows).toEqual([{ solicitadas: 100, monedas: 1, saldo: 1, detalle: expect.objectContaining({ motivo: 'avance', origen: 'app', reglas: '2.4.1' }) }])
      // Más allá del final, o datos inválidos: no paga de más ni acepta basura.
      expect((await avance(asignacionId, 999)).body).toMatchObject({ otorgadas: 1, pagadoHasta: 5 })
      expect((await pedirR('POST', `/api/asignaciones/${asignacionId}/premios`, K, { operationId: 'corto', tipo: 'avance', hasta: 1 })).status).toBe(400)
      expect((await pedirR('POST', `/api/asignaciones/${asignacionId}/premios`, K, { operationId: nuevoOp(), tipo: 'regalo', hasta: 1 })).status).toBe(400)
      expect(await saldo()).toBe(2)
    })

    it('el mismo pedido repetido (reintento, red lenta) paga una sola vez, también si llega a la vez', async () => {
      const { asignacionId } = await libro(frases(5), 1)
      const id = nuevoOp()
      const pedido = { operationId: id, tipo: 'avance', hasta: 1, conPremio: true }
      const primera = await pedirR('POST', `/api/asignaciones/${asignacionId}/premios`, K, pedido)
      const segunda = await pedirR('POST', `/api/asignaciones/${asignacionId}/premios`, K, pedido)
      expect(primera.body).toMatchObject({ estado: 'otorgado', otorgadas: 1 })
      // La respuesta repetida dice lo que se pagó (la app no lo pierde si no recibió la primera).
      expect(segunda.body).toMatchObject({ estado: 'repetido', otorgadas: 1, monedas: primera.body.monedas })
      const otro = { operationId: nuevoOp(), tipo: 'avance', hasta: 2, conPremio: true }
      const aLaVez = await Promise.all(Array.from({ length: 6 }, () => pedirR('POST', `/api/asignaciones/${asignacionId}/premios`, K, otro)))
      expect(aLaVez.map((r) => r.status)).toEqual(Array(6).fill(200))
      expect(aLaVez.filter((r) => r.body.estado === 'otorgado')).toHaveLength(1)
      expect(aLaVez.every((r) => r.body.otorgadas === 1)).toBe(true)
      expect(await saldo()).toBe(4)
    })

    it('dos dispositivos del mismo niño: la misma frase se paga una vez; libros distintos, cada uno', async () => {
      const uno = await libro(frases(4), 1)
      const dos = await libro(frases(4), 1)
      const antes = await saldo()
      const misma = await Promise.all([avance(uno.asignacionId, 1, K), avance(uno.asignacionId, 1, K2)])
      expect(misma.map((r) => r.body.otorgadas).sort()).toEqual([0, 1])
      const distintos = await Promise.all([avance(uno.asignacionId, 2, K), avance(dos.asignacionId, 1, K2), avance(dos.asignacionId, 2, K2)])
      expect(distintos.every((r) => r.status === 200)).toBe(true)
      // Los dos dispositivos ven el mismo saldo al final, y es lo que dice el registro.
      const final = await saldo()
      expect(final).toBe(antes + 1 + distintos.reduce((s, r) => s + r.body.otorgadas, 0))
      expect(final).toBeLessThanOrEqual(antes + 4)
    })

    it('reabrir un libro (otra instalación, cola vacía) no vuelve a pagar lo ya leído', async () => {
      const { asignacionId } = await libro(frases(3), 1)
      for (let h = 1; h <= 3; h++) await avance(asignacionId, h)
      const antes = await saldo()
      // La app reinstalada no tiene sus operationId: pide todo de nuevo con otros.
      for (let h = 1; h <= 3; h++) expect((await avance(asignacionId, h, K2)).body).toMatchObject({ otorgadas: 0, motivo: 'ya_pagado' })
      expect(await saldo()).toBe(antes)
      const biblioteca = (await pedirR('GET', `/api/perfiles/${ninoId}/asignaciones`, K)).body as { id: string; leidoHasta: number; pagadoHasta: number }[]
      expect(biblioteca.find((a) => a.id === asignacionId)).toMatchObject({ leidoHasta: 3, pagadoHasta: 3 })
    })

    it('una frase muy rápida avanza sin moneda; el libro terminado da relectura una vez al día en todos los niveles', async () => {
      const { asignacionId } = await libro(frases(5), 1)
      for (let h = 1; h <= 3; h++) await avance(asignacionId, h)
      // Releer un libro sin terminar no paga.
      expect((await pedirR('POST', `/api/asignaciones/${asignacionId}/premios`, K, { operationId: nuevoOp(), tipo: 'relectura', dia: hoyUtc() })).body).toMatchObject({ otorgadas: 0, motivo: 'no_terminado' })
      expect((await avance(asignacionId, 4, K, { conPremio: false })).body).toMatchObject({ otorgadas: 0, pagadoHasta: 4 })
      expect((await avance(asignacionId, 5)).body).toMatchObject({ otorgadas: 1, pagadoHasta: 5 })
      const relectura = (dia: string) => pedirR('POST', `/api/asignaciones/${asignacionId}/premios`, K, { operationId: nuevoOp(), tipo: 'relectura', dia })
      expect((await relectura(hoyUtc())).body).toMatchObject({ otorgadas: 1, motivo: 'relectura', relecturaPremiadaEn: hoyUtc() })
      expect((await relectura(hoyUtc())).body).toMatchObject({ otorgadas: 0, motivo: 'relectura_repetida' })
      // Una fecha vieja o futura no sirve.
      expect((await relectura('2020-01-01')).body).toMatchObject({ otorgadas: 0, motivo: 'dia_invalido' })
      ahora += 24 * 3600 * 1000
      expect((await relectura(hoyUtc())).body).toMatchObject({ otorgadas: 1 })
      // Nivel 3 (antes la relectura nunca pagaba en 0, 1 y 3): 2 monedas.
      const parrafos = await libro(frases(3, 10), 3)
      await avance(parrafos.asignacionId, 3)
      const r3 = await pedirR('POST', `/api/asignaciones/${parrafos.asignacionId}/premios`, K, { operationId: nuevoOp(), tipo: 'relectura', dia: hoyUtc() })
      expect(r3.body).toMatchObject({ otorgadas: 2, motivo: 'relectura' })
    })

    it('plausibilidad: no paga más rápido de lo que se puede leer; lo pedido se paga después (429 y reintento)', async () => {
      // Oraciones de 10 palabras (nivel 2, 1 moneda cada una): leer cada una toma al menos 1 s.
      const { asignacionId } = await libro(frases(8, 10), 2)
      await pool.query('update perfiles_ninos set premios_reloj = $1 where id = $2', [new Date(ahora), ninoId])
      for (let h = 1; h <= 5; h++) expect((await avance(asignacionId, h)).status).toBe(200)
      const id = nuevoOp()
      const rapido = await pedirR('POST', `/api/asignaciones/${asignacionId}/premios`, K, { operationId: id, tipo: 'avance', hasta: 6, conPremio: true })
      expect(rapido.status).toBe(429)
      expect(rapido.body.reintentarEnSegundos).toBeGreaterThanOrEqual(1)
      // No quedó nada a medias: ni pagado ni anotado.
      expect((await pedirR('GET', `/api/perfiles/${ninoId}/asignaciones`, K)).body.find((a: { id: string }) => a.id === asignacionId).pagadoHasta).toBe(5)
      ahora += rapido.body.reintentarEnSegundos * 1000
      const despues = await pedirR('POST', `/api/asignaciones/${asignacionId}/premios`, K, { operationId: id, tipo: 'avance', hasta: 6, conPremio: true })
      expect(despues.body).toMatchObject({ estado: 'otorgado', otorgadas: 1 })
      ahora += 3600 * 1000
    })

    it('borrar y volver a subir el mismo texto (o quitarlo y agregarlo) no vuelve a pagar', async () => {
      const contenido = ['Mi gato se llama Tito.', 'Tito come pan.', 'Tito duerme mucho.']
      const subir = async (frs: string[]) => {
        const id = randomUUID()
        await pedirR('PUT', `/api/textos/${id}`, K, { titulo: 'Mi gato', textoOriginal: frs.join(' '), frases: frs, capitulos: [], origen: 'pegado' })
        const a = (await pedirR('POST', `/api/perfiles/${ninoId}/asignaciones`, K, { textoId: id })).body
        // Lo que sube el niño paga después de que un adulto lo autoriza con su PIN.
        expect((await pedirR('POST', `/api/asignaciones/${a.id}/autorizar`, K, { pin: '2580' })).body.autorizacion).toBe('autorizada')
        return { textoId: id, asignacionId: a.id as string }
      }
      const leerTodo = async (asignacionId: string) => {
        let total = 0
        for (let h = 1; h <= 3; h++) total += (await avance(asignacionId, h)).body.otorgadas
        return total
      }
      const primero = await subir(contenido)
      expect(await leerTodo(primero.asignacionId)).toBeGreaterThan(0)
      expect((await pedirR('DELETE', `/api/textos/${primero.textoId}`, K)).status).toBe(200)
      // Igual, con otras mayúsculas, tildes y signos.
      const otraVez = await subir(['MI GATO SE LLAMA TITO', 'tito come pan!!', 'Tító duerme mucho...'])
      expect(await leerTodo(otraVez.asignacionId)).toBe(0)
      // Quitar el libro de la biblioteca y volver a agregarlo.
      expect((await pedirR('DELETE', `/api/asignaciones/${otraVez.asignacionId}`, K)).status).toBe(200)
      const reagregada = (await pedirR('POST', `/api/perfiles/${ninoId}/asignaciones`, K, { textoId: otraVez.textoId })).body
      await pedirR('POST', `/api/asignaciones/${reagregada.id}/autorizar`, K, { pin: '2580' })
      expect(await leerTodo(reagregada.id)).toBe(0)
      // Un texto de verdad distinto sí paga.
      const nuevo = await subir(['Mi perro se llama Bobi.', 'Bobi corre.', 'Bobi salta alto.'])
      expect(await leerTodo(nuevo.asignacionId)).toBeGreaterThan(0)
    })

    it('APK antigua: POST /monedas ya no suma; su progreso sí paga (una vez) con las mismas reglas', async () => {
      const { asignacionId } = await libro(frases(4), 1)
      const antes = await saldo()
      expect((await pedirR('POST', `/api/perfiles/${ninoId}/monedas`, K, { cantidad: 100 })).body).toEqual({ monedas: antes })
      expect((await pedirR('POST', `/api/perfiles/${ninoId}/monedas`, K, { cantidad: 101 })).status).toBe(400)
      const progreso = (leido: number, extra: object = {}) =>
        pedirR('PUT', `/api/asignaciones/${asignacionId}/progreso`, K, { fraseActual: leido, fraseMaxima: leido, estado: leido >= 4 ? 'completada' : 'en_curso', leidoHasta: leido, premioHasta: 100, ...extra })
      expect((await progreso(1)).body).toMatchObject({ leidoHasta: 1, pagadoHasta: 1, premioHasta: 0 })
      expect(await saldo()).toBe(antes + 1)
      // El mismo progreso otra vez (la app lo manda al saltar o al volver): no paga de nuevo.
      await progreso(1)
      expect(await saldo()).toBe(antes + 1)
      await progreso(2)
      await progreso(3)
      await progreso(4)
      expect(await saldo()).toBe(antes + 4)
      // Relectura de una app anterior (manda la fecha en el progreso): una vez por día.
      await progreso(4, { relecturaPremiadaEn: hoyUtc() })
      await progreso(4, { relecturaPremiadaEn: hoyUtc() })
      expect(await saldo()).toBe(antes + 5)
      // La app nueva avisa que pide sus premios aparte: su progreso no paga.
      const nuevo = await libro(frases(2), 1)
      await pedirR('PUT', `/api/asignaciones/${nuevo.asignacionId}/progreso`, K, { fraseActual: 2, fraseMaxima: 2, estado: 'completada', leidoHasta: 2, premiosPorRegistro: true })
      expect(await saldo()).toBe(antes + 5)
      const { rows } = await pool.query(`select count(*)::int as n from premios where perfil_id = $1 and tipo = 'legado' and monedas = 0`, [ninoId])
      expect(rows[0].n).toBe(1)
    })

    it('compras simultáneas y premios a la vez: atómico, sin saldo negativo', async () => {
      // Deja el saldo en 30 con un ajuste del adulto.
      const actual = await saldo()
      expect((await pedirR('POST', `/api/perfiles/${ninoId}/monedas`, P, { cantidad: 30 - actual, motivo: 'Preparar la prueba' })).body.monedas).toBe(30)
      const items = ['comida-frutilla', 'comida-platano', 'comida-sandia', 'comida-galleta'] // 8 + 8 + 10 + 10 = 36 > 30
      const compras = await Promise.all(items.map((itemId) => pedirR('POST', `/api/perfiles/${ninoId}/comprar`, K, { itemId })))
      const hechas = compras.filter((r) => r.status === 200)
      expect(hechas.length).toBe(3)
      expect(compras.filter((r) => r.status === 400).every((r) => /Te faltan/.test(r.body.error))).toBe(true)
      const { rows } = await pool.query('select coalesce(sum(precio_pagado), 0)::int as total from compras where perfil_id = $1', [ninoId])
      expect(await saldo()).toBe(30 - rows[0].total)
      expect(await saldo()).toBeGreaterThanOrEqual(0)
      // Un premio y una compra a la vez, desde dos dispositivos.
      await pedirR('POST', `/api/perfiles/${ninoId}/monedas`, P, { cantidad: 20, motivo: 'Preparar la prueba' })
      const { asignacionId } = await libro(frases(3), 1)
      const antes = await saldo()
      const [premio, compra] = await Promise.all([avance(asignacionId, 1, K2), pedirR('POST', `/api/perfiles/${ninoId}/comprar`, K, { itemId: 'comida-pelota' })])
      expect(compra.status).toBe(200)
      expect(premio.body.otorgadas).toBe(1)
      expect(await saldo()).toBe(antes + 1 - 12)
    })

    it('el saldo nunca queda negativo y el registro cuadra con el saldo', async () => {
      const r = await pedirR('POST', `/api/perfiles/${ninoId}/monedas`, P, { cantidad: -100, motivo: 'Prueba de resta' })
      expect(r.body.monedas).toBe(0)
      expect(r.body.otorgadas).toBeLessThanOrEqual(0)
      await expect(pool.query('update perfiles_ninos set monedas = -1 where id = $1', [ninoId])).rejects.toThrow()
      // Todo lo que entró (premios, ajustes) menos lo que se gastó es el saldo.
      const { rows } = await pool.query(
        `select (select coalesce(sum(monedas), 0) from premios where perfil_id = $1)::int - (select coalesce(sum(precio_pagado), 0) from compras where perfil_id = $1)::int as cuadra`,
        [ninoId],
      )
      expect(rows[0].cuadra).toBe(await saldo())
    })

    it('un extraño no pide premios por otro niño', async () => {
      const { asignacionId } = await libro(frases(2), 1)
      const extraño = (await pedirR('POST', '/api/registro', undefined, { correo: 'otro-premios@test.cl', clave: 'clave-segura' })).body.token
      expect((await avance(asignacionId, 1, extraño)).status).toBe(403)
      expect((await pedirR('POST', `/api/perfiles/${ninoId}/monedas`, extraño, { cantidad: 5, motivo: 'x' })).status).toBe(403)
    })
  })
  // ── Textos propios: el niño los agrega, un adulto los autoriza con su PIN ──
  describe('textos propios con PIN del adulto', () => {
    let ahora = Date.now()
    let appPin: Awaited<ReturnType<typeof crearApp>>
    const pedirP = async (metodo: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, token?: string, payload?: object): Promise<Respuesta> => {
      const r = await appPin.inject({ method: metodo, url, payload, headers: token ? { authorization: `Bearer ${token}` } : {} })
      return { status: r.statusCode, body: r.body ? JSON.parse(r.body) : null }
    }
    let M: string, M2: string, Z: string, J: string, ninoId: string
    const PIN = '4826'
    const PIN2 = '93715'
    let op = 0
    const nuevoOp = () => `pin-${randomUUID()}-${++op}`
    const saldo = async () => (await pedirP('GET', `/api/perfiles/${ninoId}`, M)).body.monedas as number
    let n = 0
    const frasesUnicas = (k: number) => {
      const t = ++n
      return Array.from({ length: k }, (_, i) => `Mi texto${t} dice cosa${i} bonita.`)
    }
    /** El niño escribe un texto y lo agrega a su biblioteca. */
    const textoDelNino = async (frases = frasesUnicas(3), extra: object = {}) => {
      const id = randomUUID()
      expect((await pedirP('PUT', `/api/textos/${id}`, J, { titulo: 'Mi cuento', textoOriginal: frases.join(' '), frases, capitulos: [], origen: 'pegado' })).status).toBe(200)
      const a = await pedirP('POST', `/api/perfiles/${ninoId}/asignaciones`, J, { textoId: id, ...extra })
      expect(a.status).toBe(200)
      return { textoId: id, asignacion: a.body }
    }
    const autorizar = (asignacionId: string, pin: unknown, token = J, extra: object = {}) => pedirP('POST', `/api/asignaciones/${asignacionId}/autorizar`, token, { pin, ...extra })
    const avance = (asignacionId: string, hasta: number, operationId = nuevoOp()) =>
      pedirP('POST', `/api/asignaciones/${asignacionId}/premios`, J, { operationId, tipo: 'avance', hasta, conPremio: true, esperadas: 1 })
    const reiniciarIntentos = () => pool.query('delete from intentos_pin where perfil_id = $1', [ninoId])

    beforeAll(async () => {
      appPin = await crearApp({ ahora: () => ahora })
      M = (await pedirP('POST', '/api/registro', undefined, { correo: 'mama-pin@test.cl', clave: 'clave-mama-1', nombreVisible: 'Mamá' })).body.token
      ninoId = (await pedirP('POST', '/api/perfiles', M, { apodo: 'Juan', icono: '🐢', usuario: 'juanpin', clave: 'juan123' })).body.id
      J = (await pedirP('POST', '/api/entrar-nino', undefined, { usuario: 'juanpin', clave: 'juan123' })).body.token
      Z = (await pedirP('POST', '/api/registro', undefined, { correo: 'extrano-pin@test.cl', clave: 'clave-extrana' })).body.token
    })
    afterAll(async () => {
      await appPin?.close()
    })

    it('el niño agrega su texto sin PIN: queda pendiente, en el nivel sugerido, y lo que diga la app no cuenta', async () => {
      const { asignacion } = await textoDelNino(frasesUnicas(3), { nivel: 4, autorizacion: 'autorizada' })
      expect(asignacion).toMatchObject({ autorizacion: 'pendiente', autorizadaEn: null })
      expect(asignacion.nivel).not.toBe(4)
      const lista = (await pedirP('GET', `/api/perfiles/${ninoId}/asignaciones`, J)).body
      expect(lista.find((a: { id: string }) => a.id === asignacion.id).autorizacion).toBe('pendiente')
      // Los cuentos de Ciempi están autorizados.
      expect(lista.filter((a: { autorizacion: string }) => a.autorizacion === 'autorizada').length).toBe(CUENTOS.length)
    })

    it('pendiente: lo puede leer y guardar su avance, pero no paga (ni con un cliente que se salta el paso, ni con una APK antigua)', async () => {
      const { asignacion } = await textoDelNino()
      const antes = await saldo()
      expect((await pedirP('PUT', `/api/asignaciones/${asignacion.id}/progreso`, J, { fraseActual: 2, fraseMaxima: 2, estado: 'en_curso', leidoHasta: 2, premiosPorRegistro: true })).status).toBe(200)
      // Cliente modificado: pide el premio directo, sin pasar por la autorización.
      const r = await avance(asignacion.id, 1)
      expect(r.status).toBe(200)
      expect(r.body).toMatchObject({ otorgadas: 0, motivo: 'sin_autorizar', pagadoHasta: 0 })
      expect((await pedirP('POST', `/api/asignaciones/${asignacion.id}/premios`, J, { operationId: nuevoOp(), tipo: 'relectura', dia: new Date(ahora).toISOString().slice(0, 10) })).body.otorgadas).toBe(0)
      // APK antigua: su progreso tampoco paga, y POST /monedas no suma.
      await pedirP('PUT', `/api/asignaciones/${asignacion.id}/progreso`, J, { fraseActual: 3, fraseMaxima: 3, estado: 'completada', leidoHasta: 3 })
      expect((await pedirP('POST', `/api/perfiles/${ninoId}/monedas`, J, { cantidad: 6 })).body.monedas).toBe(antes)
      expect(await saldo()).toBe(antes)
      const { rows } = await pool.query(`select monedas, detalle->>'motivo' as motivo from premios where asignacion_id = $1`, [asignacion.id])
      expect(rows.every((f) => f.monedas === 0 && f.motivo === 'sin_autorizar')).toBe(true)
    })

    it('lo que agrega un adulto no pide nada: queda autorizado y paga', async () => {
      const id = randomUUID()
      const frases = frasesUnicas(2)
      await pedirP('PUT', `/api/textos/${id}`, M, { titulo: 'De mamá', textoOriginal: 'x', frases, capitulos: [], origen: 'pegado' })
      const a = (await pedirP('POST', `/api/perfiles/${ninoId}/asignaciones`, M, { textoId: id, nivel: 1 })).body
      expect(a).toMatchObject({ autorizacion: 'autorizada', autorizadaEn: expect.any(String) })
      const antes = await saldo()
      expect((await avance(a.id, 1)).body.otorgadas).toBe(1)
      expect(await saldo()).toBe(antes + 1)
      // Si el niño vuelve a agregar un libro que ya le dio el adulto, sigue autorizado.
      expect((await pedirP('POST', `/api/perfiles/${ninoId}/asignaciones`, J, { textoId: id })).body.autorizacion).toBe('autorizada')
    })

    it('sin PIN creado no se puede autorizar (y no cuenta como intento); crear el PIN pide la contraseña y un PIN no obvio', async () => {
      const { asignacion } = await textoDelNino()
      const r = await autorizar(asignacion.id, '1234')
      expect(r.status).toBe(409)
      expect(r.body.error).toMatch(/PIN/)
      expect((await pedirP('GET', '/api/mi-pin', M)).body).toEqual({ tienePin: false, cambiadoEn: null })
      // El niño no puede crear ni ver el PIN.
      expect((await pedirP('PUT', '/api/mi-pin', J, { pin: '7777', clave: 'juan123' })).status).toBe(403)
      expect((await pedirP('GET', '/api/mi-pin', J)).status).toBe(403)
      expect((await pedirP('PUT', '/api/mi-pin', M, { pin: PIN, clave: 'mala-mala-1' })).status).toBe(403)
      for (const malo of ['12', 'abcd', '1111', '1234', '98765', '123456789']) {
        expect((await pedirP('PUT', '/api/mi-pin', M, { pin: malo, clave: 'clave-mama-1' })).status).toBe(400)
      }
      expect((await pedirP('PUT', '/api/mi-pin', M, { pin: PIN, clave: 'clave-mama-1' })).body).toEqual({ tienePin: true })
      expect((await pedirP('GET', '/api/mi-pin', M)).body.tienePin).toBe(true)
      // Se guarda con scrypt, nunca en claro.
      const { rows } = await pool.query(`select pin_hash from cuentas c join usuarios u on u.id = c.id where u.correo = 'mama-pin@test.cl'`)
      expect(rows[0].pin_hash).toMatch(/^scrypt\$[^$]+\$[^$]+$/)
      expect(rows[0].pin_hash).not.toContain(PIN)
      const { rows: intentos } = await pool.query('select fallos from intentos_pin where perfil_id = $1', [ninoId])
      expect(intentos[0]?.fallos ?? 0).toBe(0)
    })

    it('el niño llama al endpoint de autorización sin el PIN, o con uno equivocado: no se autoriza', async () => {
      await reiniciarIntentos()
      const { asignacion } = await textoDelNino()
      const sinPin = await autorizar(asignacion.id, undefined)
      expect(sinPin.status).toBe(403)
      const malo = await autorizar(asignacion.id, '0000')
      expect(malo.status).toBe(403)
      expect(malo.body.intentosRestantes).toBe(3)
      // Basura en el PIN o en el nivel no rompe nada.
      expect((await autorizar(asignacion.id, { $ne: '' })).status).toBe(403)
      expect((await autorizar(asignacion.id, PIN, J, { nivel: 9 })).status).toBe(400)
      expect((await pedirP('GET', `/api/perfiles/${ninoId}/asignaciones`, J)).body.find((a: { id: string }) => a.id === asignacion.id).autorizacion).toBe('pendiente')
      // Tampoco puede cambiar el nivel él mismo.
      expect((await pedirP('PUT', `/api/asignaciones/${asignacion.id}/nivel`, J, { nivel: 2 })).status).toBe(403)
    })

    it('fuerza bruta: a los 5 fallos espera 1 min, después 2, 4…; bloqueado, ni el PIN correcto entra', async () => {
      await reiniciarIntentos()
      const { asignacion } = await textoDelNino()
      const respuestas = []
      for (const pin of ['1000', '1001', '1002', '1003', '1004']) respuestas.push(await autorizar(asignacion.id, pin))
      expect(respuestas.map((r) => r.status)).toEqual([403, 403, 403, 403, 429])
      expect(respuestas[4].body.reintentarEnSegundos).toBe(60)
      // El correcto, mientras espera: no se revisa (no hay forma de saber si acertó).
      const bloqueado = await autorizar(asignacion.id, PIN)
      expect(bloqueado.status).toBe(429)
      ahora += 61_000
      expect((await autorizar(asignacion.id, '1005')).body.reintentarEnSegundos).toBe(120)
      ahora += 121_000
      expect((await autorizar(asignacion.id, '1006')).body.reintentarEnSegundos).toBe(240)
      // Reiniciar el servidor no borra los intentos (están en la base).
      const otraApp = await crearApp({ ahora: () => ahora })
      const r = await otraApp.inject({ method: 'POST', url: `/api/asignaciones/${asignacion.id}/autorizar`, payload: { pin: PIN }, headers: { authorization: `Bearer ${J}` } })
      expect(r.statusCode).toBe(429)
      await otraApp.close()
      ahora += 241_000
      expect((await autorizar(asignacion.id, PIN)).body.autorizacion).toBe('autorizada')
      // Acertar reinicia la cuenta.
      const { rows } = await pool.query('select fallos from intentos_pin where perfil_id = $1', [ninoId])
      expect(rows[0].fallos).toBe(0)
    })

    it('fuerza bruta en paralelo: los intentos se atienden de a uno (como mucho 5 se revisan)', async () => {
      await reiniciarIntentos()
      const { asignacion } = await textoDelNino()
      const pins = Array.from({ length: 20 }, (_, i) => String(5000 + i))
      const r = await Promise.all(pins.map((pin) => autorizar(asignacion.id, pin)))
      expect(r.filter((x) => x.status === 403)).toHaveLength(4)
      expect(r.filter((x) => x.status === 429)).toHaveLength(16)
      const { rows } = await pool.query('select fallos from intentos_pin where perfil_id = $1', [ninoId])
      expect(rows[0].fallos).toBe(5)
      ahora += 3600_000 * 25
    })

    it('autorizado en el dispositivo del niño: desde ahí paga como libro nuevo, sin pagar lo de antes ni dos veces', async () => {
      await reiniciarIntentos()
      const { asignacion } = await textoDelNino(frasesUnicas(3))
      // Practica mientras espera: lee todo, sin monedas.
      const opPendiente = nuevoOp()
      expect((await avance(asignacion.id, 3, opPendiente)).body.otorgadas).toBe(0)
      await pedirP('PUT', `/api/asignaciones/${asignacion.id}/progreso`, J, { fraseActual: 3, fraseMaxima: 3, estado: 'completada', leidoHasta: 3, premiosPorRegistro: true })
      const antes = await saldo()
      const ok = await autorizar(asignacion.id, PIN, J, { nivel: 1 })
      expect(ok.status).toBe(200)
      // Lo leído sin autorizar se vuelve a leer: el avance vuelve a lo pagado (0).
      expect(ok.body).toMatchObject({ autorizacion: 'autorizada', nivel: 1, leidoHasta: 0, pagadoHasta: 0 })
      // Repetir la autorización no hace nada; el pedido de antes repetido no paga.
      expect((await autorizar(asignacion.id, '0000')).body.autorizacion).toBe('autorizada')
      expect((await avance(asignacion.id, 3, opPendiente)).body).toMatchObject({ estado: 'repetido', otorgadas: 0 })
      let ganadas = 0
      for (let h = 1; h <= 3; h++) ganadas += (await avance(asignacion.id, h)).body.otorgadas
      expect(ganadas).toBeGreaterThan(0)
      expect(await saldo()).toBe(antes + ganadas)
      // Leído otra vez, no vuelve a pagar.
      for (let h = 1; h <= 3; h++) expect((await avance(asignacion.id, h)).body.otorgadas).toBe(0)
      const { rows } = await pool.query(`select autorizada_por from asignaciones where id = $1`, [asignacion.id])
      const { rows: mama } = await pool.query(`select id from usuarios where correo = 'mama-pin@test.cl'`)
      expect(rows[0].autorizada_por).toBe(mama[0].id)
      // El PIN no queda en ninguna parte del registro.
      const { rows: registro } = await pool.query(`select count(*)::int as n from premios where detalle::text like $1`, [`%${PIN}%`])
      expect(registro[0].n).toBe(0)
      ahora += 3600_000
    })

    it('si el niño cambia el contenido de un texto ya autorizado, vuelve a quedar pendiente (cambiar solo el título, no)', async () => {
      const frases = frasesUnicas(2)
      const { textoId, asignacion } = await textoDelNino(frases)
      await autorizar(asignacion.id, PIN)
      const guardar = (fs: string[], titulo = 'Mi cuento') => pedirP('PUT', `/api/textos/${textoId}`, J, { titulo, textoOriginal: fs.join(' '), frases: fs, capitulos: [], origen: 'pegado' })
      await guardar(frases, 'Otro título')
      const estado = async () => (await pedirP('GET', `/api/perfiles/${ninoId}/asignaciones`, J)).body.find((a: { id: string }) => a.id === asignacion.id).autorizacion
      expect(await estado()).toBe('autorizada')
      await guardar(Array(300).fill('Mariposa amarilla.'))
      expect(await estado()).toBe('pendiente')
      expect((await avance(asignacion.id, 1)).body.otorgadas).toBe(0)
    })

    it('el adulto ve los pendientes de sus niños y autoriza desde su panel con su PIN; otro adulto del niño, con el suyo', async () => {
      const { asignacion } = await textoDelNino()
      const lista = (await pedirP('GET', '/api/autorizaciones', M)).body
      const item = lista.find((x: { asignacion: { id: string } }) => x.asignacion.id === asignacion.id)
      expect(item).toMatchObject({ perfil: { id: ninoId, apodo: 'Juan' }, texto: { titulo: 'Mi cuento', frases: 3 }, hayPin: true })
      expect(item.texto.muestra).toHaveLength(3)
      // El niño ve sus propios pendientes; un extraño no ve nada ni puede autorizar.
      expect((await pedirP('GET', '/api/autorizaciones', J)).body.length).toBeGreaterThan(0)
      expect((await pedirP('GET', '/api/autorizaciones', Z)).body).toEqual([])
      expect((await autorizar(asignacion.id, PIN, Z)).status).toBe(403)
      // Desde el panel también se pide el PIN.
      expect((await autorizar(asignacion.id, undefined, M)).status).toBe(403)
      expect((await autorizar(asignacion.id, PIN, M, { nivel: 3 })).body).toMatchObject({ autorizacion: 'autorizada', nivel: 3 })
      // Un segundo adulto (apoderado) con su propio PIN.
      M2 = (await pedirP('POST', '/api/registro', undefined, { correo: 'papa-pin@test.cl', clave: 'clave-papa-1' })).body.token
      const inv = (await pedirP('POST', `/api/perfiles/${ninoId}/invitaciones`, M)).body.codigo
      await pedirP('POST', '/api/invitaciones/canjear', M2, { codigo: inv })
      await pedirP('PUT', '/api/mi-pin', M2, { pin: PIN2, clave: 'clave-papa-1' })
      await reiniciarIntentos()
      const otro = await textoDelNino()
      expect((await autorizar(otro.asignacion.id, PIN2)).body.autorizacion).toBe('autorizada')
      // El PIN de un adulto no sirve para un niño que no es suyo.
      const ajeno = (await pedirP('POST', '/api/perfiles', Z, { apodo: 'Otro', icono: '🐙', usuario: 'otropin', clave: 'otro123' })).body.id
      const O = (await pedirP('POST', '/api/entrar-nino', undefined, { usuario: 'otropin', clave: 'otro123' })).body.token
      await pedirP('PUT', '/api/mi-pin', Z, { pin: '86420', clave: 'clave-extrana' })
      const tid = randomUUID()
      await pedirP('PUT', `/api/textos/${tid}`, O, { titulo: 'x', textoOriginal: 'x', frases: ['Hola mundo.'], capitulos: [], origen: 'pegado' })
      const asig = (await pedirP('POST', `/api/perfiles/${ajeno}/asignaciones`, O, { textoId: tid })).body
      expect((await autorizar(asig.id, PIN, O)).status).toBe(403)
      expect((await autorizar(asig.id, '86420', O)).body.autorizacion).toBe('autorizada')
    })

    it('nada más del niño queda bloqueado: ajustes, cuentos, tienda, borrar su texto pendiente', async () => {
      const { textoId } = await textoDelNino()
      expect((await pedirP('PUT', `/api/perfiles/${ninoId}/ajustes`, J, { ajustes: { tamanoLetra: 48 } })).status).toBe(200)
      const cuento = (await pedirP('GET', `/api/perfiles/${ninoId}/asignaciones`, J)).body.find((a: { textoId: string; nivel: number }) => a.nivel === 2 && CUENTOS.some((c) => c.id === a.textoId))
      const antes = await saldo()
      expect((await avance(cuento.id, 1)).body.otorgadas).toBeGreaterThan(0)
      expect(await saldo()).toBeGreaterThan(antes)
      expect((await pedirP('POST', `/api/perfiles/${ninoId}/comprar`, J, { itemId: 'comida-frutilla' })).status).not.toBe(403)
      expect((await pedirP('DELETE', `/api/textos/${textoId}`, J)).status).toBe(200)
    })
  })
})
