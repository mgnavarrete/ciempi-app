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

  it('lo leído, los hitos premiados y la relectura se guardan y no bajan', async () => {
    const url = `/api/asignaciones/${asigGuia}/progreso`
    const p = await pedir('PUT', url, N, { fraseActual: 1, fraseMaxima: 1, estado: 'en_curso', leidoHasta: 1, premioHasta: 50, relecturaPremiadaEn: '2026-10-28' })
    expect(p.body).toMatchObject({ leidoHasta: 1, premioHasta: 50, relecturaPremiadaEn: '2026-10-28' })
    // Vuelve a empezar desde el comienzo: no se pierde lo ganado.
    const otra = await pedir('PUT', url, N, { fraseActual: 0, fraseMaxima: 0, estado: 'en_curso', leidoHasta: 0, premioHasta: 0 })
    expect(otra.body).toMatchObject({ fraseActual: 0, leidoHasta: 1, premioHasta: 50, relecturaPremiadaEn: '2026-10-28' })
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
})
