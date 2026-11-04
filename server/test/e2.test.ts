/**
 * Economía E2 (bandera ECONOMIA=e2), su valor por defecto (2.4.1), el
 * desbloqueo de la Cuncuna y pruebas de abuso con clientes modificados.
 * Contra un PostgreSQL real (DATABASE_URL), en su propio esquema
 * (`prueba_e2`): puede correr a la vez que api.test.ts, que usa `public`.
 */
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const HAY_BASE = !!process.env.DATABASE_URL
const ESQUEMA = 'prueba_e2'

describe.skipIf(!HAY_BASE)('economía E2, bandera y Cuncuna', async () => {
  process.env.NODE_ENV = 'test'
  delete process.env.ECONOMIA
  // Todo en el esquema propio (search_path), antes de crear el pool.
  const url = new URL(process.env.DATABASE_URL!)
  url.searchParams.set('options', `-c search_path=${ESQUEMA}`)
  process.env.DATABASE_URL = url.toString()
  const { pool, migrar } = await import('../src/db.ts')
  const { crearApp } = await import('../src/app.ts')
  const { CUENTOS } = await import('../../src/contenido/cuentos.ts')
  const { ORIGINALES_N0, CUNCUNA } = await import('../src/desbloqueos.ts')
  const { REGLAS_MONEDAS, REGLAS_MONEDAS_E2, contarSilabas, leerModeloEconomia, segundosEsperados } = await import('../../src/lectura/monedas.ts')
  const { vistaPorNivel, fraseDeUnidad } = await import('../../src/lenguaje/unidades.ts')
  const { contarPalabras } = await import('../../src/lectura/monedas.ts')
  const E = REGLAS_MONEDAS_E2.esfuerzo

  let ahora = Date.parse('2026-11-03T12:00:00Z')
  let appE2: Awaited<ReturnType<typeof crearApp>>
  let appActual: Awaited<ReturnType<typeof crearApp>>
  type App = typeof appE2
  type Respuesta = { status: number; body: any }
  const pedirCon = async (app: App, metodo: 'GET' | 'POST' | 'PUT' | 'DELETE', ruta: string, token?: string, payload?: object): Promise<Respuesta> => {
    const r = await app.inject({ method: metodo, url: ruta, payload, headers: token ? { authorization: `Bearer ${token}` } : {} })
    return { status: r.statusCode, body: r.body ? JSON.parse(r.body) : null }
  }
  const migracion013 = () => readFile(new URL('../sql/013_e2_y_cuncuna.sql', import.meta.url), 'utf8')

  let P: string
  let op = 0
  const nuevoOp = () => `e2-${randomUUID()}-${++op}`
  const hoyUtc = () => new Date(ahora).toISOString().slice(0, 10)
  const minutos = (m: number) => (ahora += m * 60_000)

  beforeAll(async () => {
    await pool.query(`drop schema if exists ${ESQUEMA} cascade; create schema ${ESQUEMA}`)
    await migrar()
    await (await import('../src/cuentos.ts')).sembrarCuentos()
    appE2 = await crearApp({ ahora: () => ahora, economia: 'e2' })
    // Sin `economia` ni ECONOMIA en el entorno: la de siempre.
    appActual = await crearApp({ ahora: () => ahora })
    const r = await pedirCon(appE2, 'POST', '/api/registro', undefined, { correo: 'e2@test.cl', clave: 'clave-segura', nombreVisible: 'Mamá', rol: 'apoderado' })
    P = r.body.token
  })
  afterAll(async () => {
    await appE2?.close()
    await appActual?.close()
    await pool.query(`drop schema if exists ${ESQUEMA} cascade`)
    await pool.end()
  })

  /** Un niño nuevo (con los 40 cuentos de Ciempi) y su token. */
  let ninos = 0
  const nino = async () => {
    const usuario = `e2nino${++ninos}`
    const id = (await pedirCon(appE2, 'POST', '/api/perfiles', P, { apodo: `N${ninos}`, icono: '🐛', usuario, clave: 'clave123' })).body.id as string
    const token = (await pedirCon(appE2, 'POST', '/api/entrar-nino', undefined, { usuario, clave: 'clave123' })).body.token as string
    return { id, token }
  }
  const saldo = async (id: string) => (await pool.query('select monedas from perfiles_ninos where id = $1', [id])).rows[0].monedas as number

  /** Un texto en la biblioteca del niño, en un nivel que fija el adulto. */
  let libros = 0
  const frasesUnicas = (n: number, palabras = 3) => {
    const k = ++libros
    return Array.from({ length: n }, (_, i) => `${Array.from({ length: palabras }, (_, j) => `pa${k}la${i}bra${j}`).join(' ')}.`)
  }
  const libro = async (ninoId: string, frases: string[], nivel: number, token = P) => {
    const id = randomUUID()
    expect((await pedirCon(appE2, 'PUT', `/api/textos/${id}`, token, { titulo: `T ${id.slice(0, 4)}`, textoOriginal: frases.join(' '), frases, capitulos: [], origen: 'pegado' })).status).toBe(200)
    const a = (await pedirCon(appE2, 'POST', `/api/perfiles/${ninoId}/asignaciones`, token, { textoId: id, nivel })).body
    if (a.nivel !== nivel) await pedirCon(appE2, 'PUT', `/api/asignaciones/${a.id}/nivel`, P, { nivel })
    return { textoId: id, asignacionId: a.id as string, frases }
  }
  /** Las unidades (con palabras) de un texto en un nivel: dónde terminan y su texto. */
  const unidadesDe = (frases: string[], nivel: number, parrafos?: number[]) => {
    const v = vistaPorNivel({ frases, capitulos: [], parrafos }, nivel as 0)
    return v.unidades
      .map((texto, i) => ({ texto, fin: fraseDeUnidad(v, i + 1, frases.length) }))
      .filter((u) => contarPalabras(u.texto) > 0)
  }
  const esperado = (texto: string, nivelRef: number) => segundosEsperados(nivelRef as 0, contarSilabas(texto), E)

  const pedirPremio = (app: App, token: string, asignacionId: string, cuerpo: object) =>
    pedirCon(app, 'POST', `/api/asignaciones/${asignacionId}/premios`, token, { operationId: nuevoOp(), ...cuerpo })
  /** Lee unidad por unidad como un niño de verdad: pasa el tiempo que declara. */
  const leer = async (app: App, token: string, asignacionId: string, unidades: { fin: number }[], segundos: (i: number) => number, extra: object = {}) => {
    let total = 0
    const respuestas: Respuesta[] = []
    for (let i = 0; i < unidades.length; i++) {
      ahora += segundos(i) * 1000
      const r = await pedirPremio(app, token, asignacionId, { tipo: 'avance', hasta: unidades[i].fin, conPremio: true, segundosActivos: segundos(i), ...extra })
      expect(r.status).toBe(200)
      total += r.body.otorgadas
      respuestas.push(r)
    }
    return { total, respuestas }
  }

  // ── Bandera ───────────────────────────────────────────────────────────

  describe('bandera ECONOMIA', () => {
    it('sin bandera rige 2.4.1; solo "e2" activa E2; un valor desconocido no arranca', async () => {
      expect(leerModeloEconomia(undefined)).toBe('actual')
      expect(leerModeloEconomia('')).toBe('actual')
      expect(leerModeloEconomia('2.4.1')).toBe('actual')
      expect(leerModeloEconomia('E2')).toBe('e2')
      expect(() => leerModeloEconomia('e3')).toThrow()
      process.env.ECONOMIA = 'gratis'
      await expect(crearApp()).rejects.toThrow(/ECONOMIA/)
      delete process.env.ECONOMIA
    })

    it('por defecto paga exactamente como 2.4.1, aunque el cliente mande segundos, tropiezos o «releída»', async () => {
      const n = await nino()
      const frases = frasesUnicas(8)
      const { asignacionId } = await libro(n.id, frases, 1)
      // Nivel 1: 1 por frase hasta el tope del libro (2.4.1), más el hito del 100 %.
      let total = 0
      for (let h = 1; h <= 8; h++) {
        minutos(1)
        const r = await pedirPremio(appActual, n.token, asignacionId, { tipo: 'avance', hasta: h, conPremio: true, segundosActivos: 86_400, tropiezos: 0 })
        expect(r.body.economia).toBe('actual')
        total += r.body.otorgadas
      }
      const esperado241 = Math.min(8 * REGLAS_MONEDAS.porUnidad[1], REGLAS_MONEDAS.topePorLibro[1]) + REGLAS_MONEDAS.hitos[1].reduce((s, h) => s + h.monedas, 0)
      expect(total).toBe(esperado241)
      // Releer una unidad no paga con 2.4.1; la relectura del día sí (la de siempre).
      expect((await pedirPremio(appActual, n.token, asignacionId, { tipo: 'releida', hasta: 3, conPremio: true, segundosActivos: 500 })).body).toMatchObject({ otorgadas: 0, motivo: 'releida' })
      expect((await pedirPremio(appActual, n.token, asignacionId, { tipo: 'relectura', dia: hoyUtc(), tropiezos: 9 })).body).toMatchObject({
        otorgadas: REGLAS_MONEDAS.relectura[1],
        motivo: 'relectura',
      })
      const { rows } = await pool.query(`select distinct detalle->>'reglas' as r, detalle ? 'segundosPagados' as e2 from premios where perfil_id = $1 and tipo <> 'saldo_inicial'`, [n.id])
      expect(rows).toEqual([{ r: '2.4.1', e2: false }])
      expect(await saldo(n.id)).toBe(esperado241 + REGLAS_MONEDAS.relectura[1])
    })
  })

  // ── E2 ────────────────────────────────────────────────────────────────

  describe('E2', () => {
    it('paga 2 por minuto activo de cada unidad terminada (hasta 2× lo esperado), con la fracción acumulada en el libro', async () => {
      const n = await nino()
      const frases = frasesUnicas(6, 4)
      const { asignacionId } = await libro(n.id, frases, 1)
      const us = unidadesDe(frases, 1)
      const nivelRef = Math.max(1, (await import('../../src/lenguaje/dificultad.ts')).nivelSugerido(frases))
      // Lee un poco más lento que lo esperado (1,5×): todo cuenta.
      const seg = (i: number) => 1.5 * esperado(us[i].texto, nivelRef)
      const { total, respuestas } = await leer(appE2, n.token, asignacionId, us, seg)
      expect(respuestas.every((r) => r.body.economia === 'e2' && r.body.motivo === 'avance')).toBe(true)
      const segundos = us.reduce((s, _, i) => s + seg(i), 0)
      const minutosEsperados = us.reduce((s, u) => s + esperado(u.texto, nivelRef), 0) / 60
      const libroTerminado = minutosEsperados >= 1 ? Math.min(3, Math.floor(minutosEsperados)) : 0
      expect(total).toBe(Math.floor((2 * segundos) / 60 + 1e-9) + libroTerminado)
      const { rows } = await pool.query(`select detalle from premios where perfil_id = $1 and tipo = 'avance' order by id`, [n.id])
      expect(rows.every((f) => f.detalle.reglas === '3.0.0-e2' && f.detalle.economia === 'e2')).toBe(true)
    })

    it('segundos inflados: una unidad paga como mucho 2× lo esperado (tener la app abierta no paga)', async () => {
      const n = await nino()
      const frases = frasesUnicas(3, 6)
      const { asignacionId } = await libro(n.id, frases, 0)
      const us = unidadesDe(frases, 0)
      const nivelRef = Math.max(0, (await import('../../src/lenguaje/dificultad.ts')).nivelSugerido(frases))
      minutos(120)
      const r = await pedirPremio(appE2, n.token, asignacionId, { tipo: 'avance', hasta: us[0].fin, conPremio: true, segundosActivos: 86_400 })
      const tope = 2 * esperado(us[0].texto, nivelRef)
      const { rows } = await pool.query(`select detalle from premios where perfil_id = $1 and tipo = 'avance'`, [n.id])
      expect(rows[0].detalle.segundosPagados).toBeCloseTo(tope, 0)
      expect(rows[0].detalle.segundosDeclarados).toBe(86_400)
      expect(r.body.otorgadas).toBe(Math.floor((2 * tope) / 60 + 1e-9))
      // Negativos, infinitos o texto: se ignoran (como si no los mandara).
      for (const malo of [-50, 'mucho', null]) {
        const x = await pedirPremio(appE2, n.token, asignacionId, { tipo: 'avance', hasta: us[1].fin, conPremio: true, segundosActivos: malo })
        expect(x.status).toBe(200)
      }
      // Sin terminar una unidad no hay nada que pagar, por mucho tiempo que pase.
      minutos(600)
      expect((await pedirPremio(appE2, n.token, asignacionId, { tipo: 'avance', hasta: us[1].fin, conPremio: true, segundosActivos: 36_000 })).body).toMatchObject({ otorgadas: 0, motivo: 'ya_pagado' })
      // La frase «muy rápida» (conPremio falso) avanza sin pagar tiempo.
      const rapida = await pedirPremio(appE2, n.token, asignacionId, { tipo: 'avance', hasta: us[2].fin, conPremio: false, segundosActivos: 999 })
      expect(rapida.body.pagadoHasta).toBe(us[2].fin)
      const { rows: ult } = await pool.query(`select detalle from premios where perfil_id = $1 and tipo = 'avance' order by id desc limit 1`, [n.id])
      expect(ult[0].detalle.segundosPagados).toBe(0)
    })

    it('reloj del servidor: lo pagado no supera el tiempo real (ráfaga de 1 h); sin media tasa ni tope diario', async () => {
      const n = await nino()
      // Un texto de nivel 4 con unidades largas (párrafos): cada unidad ~2 min esperados.
      const frases = frasesUnicas(60, 30)
      const { asignacionId } = await libro(n.id, frases, 4)
      const us = unidadesDe(frases, 4)
      expect(us.length).toBeGreaterThan(5)
      // Un cliente que pide todo junto, sin dejar pasar el tiempo, declarando lo máximo.
      await pool.query('update perfiles_ninos set premios_reloj = $1 where id = $2', [new Date(ahora), n.id])
      const respuestas: Respuesta[] = []
      for (const u of us) respuestas.push(await pedirPremio(appE2, n.token, asignacionId, { tipo: 'avance', hasta: u.fin, conPremio: true, segundosActivos: 3600 }))
      expect(respuestas[0].status).toBe(429)
      expect(respuestas[0].body.reintentarEnSegundos).toBeGreaterThan(0)
      // Lo pagado nunca supera el tiempo que pasó (más 5 s de holgura).
      const pagados = async () =>
        (await pool.query(`select coalesce(sum((detalle->>'segundosPagados')::real), 0)::real as s from premios where perfil_id = $1`, [n.id])).rows[0].s as number

      expect(await pagados()).toBe(0)
      // Un lector honesto durante 3 horas: cada hora paga lo mismo (sin media tasa después de 45 min, sin tope).
      const n2 = await nino()
      const largo = await libro(n2.id, frasesUnicas(1000, 30), 4)
      const us2 = unidadesDe(largo.frases, 4)
      const porHora: number[] = []
      let i = 0
      for (let h = 0; h < 3; h++) {
        const inicio = await saldo(n2.id)
        const fin = ahora + 3600_000
        while (ahora < fin && i < us2.length) {
          const s = esperado(us2[i].texto, 4) * 1.2
          ahora += s * 1000
          const r = await pedirPremio(appE2, n2.token, largo.asignacionId, { tipo: 'avance', hasta: us2[i].fin, conPremio: true, segundosActivos: s })
          expect(r.status).toBe(200)
          i++
        }
        porHora.push((await saldo(n2.id)) - inicio)
      }
      // ~2 monedas por minuto activo: ~120 por hora, las tres iguales (±2 por el redondeo de la fracción).
      for (const m of porHora) expect(Math.abs(m - 120)).toBeLessThanOrEqual(3)
      expect(Math.max(...porHora) - Math.min(...porHora)).toBeLessThanOrEqual(3)
    })

    it('cola sin conexión antigua: 2 h leídas sin conexión se pagan enteras (1 h de golpe y el resto al ritmo del reloj)', async () => {
      const n = await nino()
      const largo = await libro(n.id, frasesUnicas(700, 30), 4)
      const us = unidadesDe(largo.frases, 4)
      // Lee 2 h sin conexión: la cola guarda cada unidad con su operationId.
      const cola: { operationId: string; hasta: number; segundosActivos: number }[] = []
      let leidos = 0
      for (const u of us) {
        if (leidos >= 7200) break
        const s = esperado(u.texto, 4)
        ahora += s * 1000
        leidos += s
        cola.push({ operationId: nuevoOp(), hasta: u.fin, segundosActivos: s })
      }
      // Vuelve la conexión 3 días después y la app envía la cola en orden, reintentando lo que recibe 429.
      minutos(3 * 24 * 60)
      let pagados = 0
      let esperas = 0
      for (const p of cola) {
        for (;;) {
          const r = await pedirCon(appE2, 'POST', `/api/asignaciones/${largo.asignacionId}/premios`, n.token, { ...p, tipo: 'avance', conPremio: true })
          if (r.status === 429) {
            esperas++
            ahora += r.body.reintentarEnSegundos * 1000
            continue
          }
          expect(r.status).toBe(200)
          pagados += r.body.otorgadas
          break
        }
      }
      expect(esperas).toBeGreaterThan(0)
      // Nada se perdió: lo mismo que si hubiera tenido conexión (2/min × segundos, sin el premio de terminar).
      expect(pagados).toBe(Math.floor((2 * cola.reduce((s, p) => s + p.segundosActivos, 0)) / 60 + 1e-9))
      // Reenviar toda la cola (la app no recibió las respuestas) no paga otra vez.
      const antes = await saldo(n.id)
      for (const p of cola.slice(0, 20)) {
        const r = await pedirCon(appE2, 'POST', `/api/asignaciones/${largo.asignacionId}/premios`, n.token, { ...p, tipo: 'avance', conPremio: true })
        expect(r.body.estado).toBe('repetido')
      }
      expect(await saldo(n.id)).toBe(antes)
      // Una relectura muy vieja de la cola (más de 3 días) no paga.
      expect((await pedirPremio(appE2, n.token, largo.asignacionId, { tipo: 'relectura', dia: '2026-10-01', tropiezos: 0 })).body).toMatchObject({ otorgadas: 0, motivo: 'dia_invalido' })
    })

    it('un pedido gigante (más que toda la ventana) solo paga lo que cabe en una hora', async () => {
      const n = await nino()
      const largo = await libro(n.id, frasesUnicas(600, 30), 4)
      const us = unidadesDe(largo.frases, 4)
      minutos(24 * 60)
      // De una vez hasta el final, con lo esperado (sin segundos): ~2× la ventana.
      const r = await pedirPremio(appE2, n.token, largo.asignacionId, { tipo: 'avance', hasta: us.at(-1)!.fin, conPremio: true, segundosActivos: 86_400 })
      expect(r.status).toBe(200)
      const { rows } = await pool.query(`select detalle from premios where perfil_id = $1 and tipo = 'avance'`, [n.id])
      expect(rows[0].detalle.segundosPagados).toBeLessThanOrEqual(3605)
      expect(r.body.otorgadas).toBeLessThanOrEqual(Math.floor((2 * 3605) / 60) + 3)
    })

    it('dificultad real: un texto difícil asignado en nivel 0 paga con lo esperado del nivel sugerido', async () => {
      const n = await nino()
      const dificiles = Array.from({ length: 4 }, (_, i) => `La extraordinaria biodiversidad amazónica ${i} constituye un patrimonio incalculable para generaciones venideras indudablemente.`)
      const { nivelSugerido } = await import('../../src/lenguaje/dificultad.ts')
      const sugerido = nivelSugerido(dificiles)
      expect(sugerido).toBeGreaterThan(0)
      const { asignacionId } = await libro(n.id, dificiles, 0)
      const us = unidadesDe(dificiles, 0)
      minutos(120)
      await pedirPremio(appE2, n.token, asignacionId, { tipo: 'avance', hasta: us[0].fin, conPremio: true, segundosActivos: 10_000 })
      const { rows } = await pool.query(`select detalle from premios where perfil_id = $1 and tipo = 'avance'`, [n.id])
      // El tope sale del nivel sugerido (más exigente), no del 0 que se asignó.
      expect(rows[0].detalle.segundosPagados).toBeCloseTo(2 * esperado(us[0].texto, sugerido), 0)
      expect(rows[0].detalle.segundosPagados).toBeLessThan(2 * esperado(us[0].texto, 0))
    })

    // 2.5.1: ya no hay textos pendientes al agregarlos; la regla de pago de un pendiente se conserva por compatibilidad.
    it.skip('integración PIN + E2: un texto pendiente no paga, no gasta reloj ni marca avance; al aprobarse paga desde 0', async () => {
      const n = await nino()
      const frs = Array.from({ length: 6 }, (_, i) => `La niña ${['lee', 'canta', 'pinta', 'salta', 'come', 'ríe'][i]} en el patio.`)
      const id = randomUUID()
      await pedirCon(appE2, 'PUT', `/api/textos/${id}`, n.token, { titulo: 'Patio', textoOriginal: frs.join(' '), frases: frs, capitulos: [], origen: 'pegado' })
      const a = (await pedirCon(appE2, 'POST', `/api/perfiles/${n.id}/asignaciones`, n.token, { textoId: id })).body
      expect(a.autorizacion).toBe('pendiente')
      const us = unidadesDe(frs, a.nivel)
      const antes = await saldo(n.id)
      for (const u of us) {
        minutos(2)
        const r = await pedirPremio(appE2, n.token, a.id, { tipo: 'avance', hasta: u.fin, conPremio: true, segundosActivos: 60 })
        expect(r.body.otorgadas).toBe(0)
      }
      expect(await saldo(n.id)).toBe(antes)
      const { rows: asg } = await pool.query(`select pagado_hasta from asignaciones where id = $1`, [a.id])
      expect(asg[0].pagado_hasta ?? 0).toBe(0)
      await pool.query(`update asignaciones set autorizacion = 'autorizada', autorizada_en = now() where id = $1`, [a.id])
      minutos(2)
      const r = await pedirPremio(appE2, n.token, a.id, { tipo: 'avance', hasta: us[0].fin, conPremio: true, segundosActivos: 60 })
      expect(r.body.otorgadas).toBeGreaterThan(0)
    })

    it('premio por terminar: una sola vez por huella (borrar y volver a subir no lo repite)', async () => {
      const n = await nino()
      const contenido = Array.from({ length: 10 }, (_, i) => `Mi gato Tito ${['come', 'salta', 'duerme', 'juega', 'corre', 'mira', 'toma', 'lame', 'busca', 'sube'][i]} en la casa.`)
      const subir = async (frs: string[]) => {
        const id = randomUUID()
        await pedirCon(appE2, 'PUT', `/api/textos/${id}`, n.token, { titulo: 'Tito', textoOriginal: frs.join(' '), frases: frs, capitulos: [], origen: 'pegado' })
        const a = (await pedirCon(appE2, 'POST', `/api/perfiles/${n.id}/asignaciones`, n.token, { textoId: id })).body
        // 2.5.1: lo que sube el niño queda autorizado de inmediato (sin aprobación del adulto).
        expect(a.autorizacion).toBe('autorizada')
        return { textoId: id, asignacionId: a.id as string, nivel: a.nivel as number }
      }
      const primero = await subir(contenido)
      const us = unidadesDe(contenido, primero.nivel)
      const nivelRef = Math.max(primero.nivel, (await import('../../src/lenguaje/dificultad.ts')).nivelSugerido(contenido))
      const minutosEsp = us.reduce((s, u) => s + esperado(u.texto, nivelRef), 0) / 60
      const seg = (i: number) => esperado(us[i].texto, nivelRef)
      const { respuestas } = await leer(appE2, n.token, primero.asignacionId, us, seg)
      const { rows } = await pool.query(`select detalle from premios where perfil_id = $1 and detalle ? 'desglose' order by id`, [n.id])
      const libro1 = rows.reduce((s, f) => s + f.detalle.desglose.libro, 0)
      expect(libro1).toBe(minutosEsp >= 1 ? Math.min(3, Math.floor(minutosEsp)) : 0)
      expect(respuestas.at(-1)!.body.pagadoHasta).toBe(contenido.length)
      expect((await pedirCon(appE2, 'DELETE', `/api/textos/${primero.textoId}`, n.token)).status).toBe(200)
      // El mismo texto otra vez (con otra puntuación): nada nuevo que pagar, ni el premio de terminar.
      const otra = await subir(contenido.map((f) => f.toUpperCase().replace('.', '!')))
      const antes = await saldo(n.id)
      for (const u of us) {
        minutos(2)
        const r = await pedirPremio(appE2, n.token, otra.asignacionId, { tipo: 'avance', hasta: u.fin, conPremio: true, segundosActivos: 60 })
        expect(r.body.otorgadas).toBe(0)
      }
      expect(await saldo(n.id)).toBe(antes)
    })

    it('relectura: releer paga por tiempo (1,5/min en N0–N1) y «con mejora» +2 una vez al día, comparando con la mejor marca', async () => {
      const n = await nino()
      const frases = frasesUnicas(8, 5)
      const { asignacionId } = await libro(n.id, frases, 1)
      const us = unidadesDe(frases, 1)
      const nivelRef = Math.max(1, (await import('../../src/lenguaje/dificultad.ts')).nivelSugerido(frases))
      const seg = (i: number) => esperado(us[i].texto, nivelRef)
      expect(us.reduce((s, _, i) => s + seg(i), 0)).toBeGreaterThan(60)
      // Primera lectura completa con 5 tropiezos.
      for (let i = 0; i < us.length; i++) {
        ahora += seg(i) * 1000
        await pedirPremio(appE2, n.token, asignacionId, { tipo: 'avance', hasta: us[i].fin, conPremio: true, segundosActivos: seg(i), ...(i === us.length - 1 ? { tropiezos: 5 } : {}) })
      }
      const relectura = (tropiezos: number) => pedirPremio(appE2, n.token, asignacionId, { tipo: 'relectura', dia: hoyUtc(), tropiezos })
      // Decir «lo releí entero» sin haberlo releído (sin unidades releídas) no paga.
      expect((await relectura(0)).body).toMatchObject({ otorgadas: 0, motivo: 'sin_relectura' })
      // Releer una unidad que no se ha leído: no.
      const libroNuevo = await libro(n.id, frasesUnicas(3), 1)
      expect((await pedirPremio(appE2, n.token, libroNuevo.asignacionId, { tipo: 'releida', hasta: 1, conPremio: true, segundosActivos: 30 })).body).toMatchObject({ otorgadas: 0, motivo: 'no_leida' })
      // Releer todo el libro: cada unidad paga a 1,5/min.
      const antes = await saldo(n.id)
      for (let i = 0; i < us.length; i++) {
        ahora += seg(i) * 1000
        const r = await pedirPremio(appE2, n.token, asignacionId, { tipo: 'releida', hasta: us[i].fin, conPremio: true, segundosActivos: seg(i) })
        expect(r.body.motivo).toBe('releida')
      }
      const porTiempo = (await saldo(n.id)) - antes
      const segundosLibro = us.reduce((s, _, i) => s + seg(i), 0)
      // La fracción del libro venía de la primera lectura: ±1.
      expect(Math.abs(porTiempo - (1.5 * segundosLibro) / 60)).toBeLessThanOrEqual(1)
      // Igual de tropiezos que la mejor (5): sin mejora. Con 5 + 10 (tropezar a propósito antes): tampoco.
      expect((await relectura(5)).body).toMatchObject({ otorgadas: 0, motivo: 'sin_mejora' })
      expect((await relectura(15)).body).toMatchObject({ otorgadas: 0, motivo: 'sin_mejora' })
      expect((await relectura(3)).body).toMatchObject({ otorgadas: 2, motivo: 'mejora' })
      // Una por cuento y día.
      expect((await relectura(1)).body).toMatchObject({ otorgadas: 0, motivo: 'relectura_repetida' })
      // Al día siguiente, otra vez (releyendo de verdad): la marca ya es 3.
      minutos(24 * 60)
      for (let i = 0; i < us.length; i++) {
        ahora += seg(i) * 1000
        await pedirPremio(appE2, n.token, asignacionId, { tipo: 'releida', hasta: us[i].fin, conPremio: true, segundosActivos: seg(i) })
      }
      expect((await relectura(3)).body).toMatchObject({ otorgadas: 0, motivo: 'sin_mejora' })
      expect((await relectura(2)).body).toMatchObject({ otorgadas: 2, motivo: 'mejora' })
    })

    it('tropiezos inflados (10 000): como mucho uno por unidad, así que las «mejoras» se agotan', async () => {
      const n = await nino()
      const frases = frasesUnicas(8, 5)
      const { asignacionId } = await libro(n.id, frases, 1)
      const us = unidadesDe(frases, 1)
      const nivelRef = Math.max(1, (await import('../../src/lenguaje/dificultad.ts')).nivelSugerido(frases))
      const seg = (i: number) => esperado(us[i].texto, nivelRef)
      for (let i = 0; i < us.length; i++) {
        ahora += seg(i) * 1000
        await pedirPremio(appE2, n.token, asignacionId, { tipo: 'avance', hasta: us[i].fin, conPremio: true, segundosActivos: seg(i), ...(i === us.length - 1 ? { tropiezos: 10_000 } : {}) })
      }
      const { rows } = await pool.query(`select mejor_tropiezos from lecturas_premiadas where perfil_id = $1 and mejor_tropiezos is not null`, [n.id])
      expect(rows).toEqual([{ mejor_tropiezos: us.length }])
      // Cliente modificado: cada día relee y dice un tropiezo menos. Como mucho `unidades` mejoras en toda la vida.
      let mejoras = 0
      for (let dia = 0; dia < us.length + 5; dia++) {
        minutos(24 * 60)
        for (let i = 0; i < us.length; i++) {
          ahora += seg(i) * 1000
          await pedirPremio(appE2, n.token, asignacionId, { tipo: 'releida', hasta: us[i].fin, conPremio: true, segundosActivos: seg(i) })
        }
        const r = await pedirPremio(appE2, n.token, asignacionId, { tipo: 'relectura', dia: hoyUtc(), tropiezos: Math.max(0, 9_999 - dia) > us.length ? us.length - 1 - dia : 0 })
        if (r.body.motivo === 'mejora') mejoras++
      }
      expect(mejoras).toBeLessThanOrEqual(us.length)
    })

    it('E2R (ECONOMIA=e2r, apagada por defecto): la relectura paga 1,5/min también en N2–N4', async () => {
      const appE2R = await crearApp({ ahora: () => ahora, economia: 'e2r' })
      try {
        const n = await nino()
        const frases = frasesUnicas(4, 10)
        const { asignacionId } = await libro(n.id, frases, 3)
        const us = unidadesDe(frases, 3)
        minutos(120)
        await pedirPremio(appE2R, n.token, asignacionId, { tipo: 'avance', hasta: us.at(-1)!.fin, conPremio: true, segundosActivos: 60 })
        minutos(120)
        const r = await pedirPremio(appE2R, n.token, asignacionId, { tipo: 'releida', hasta: us.at(-1)!.fin, conPremio: true, segundosActivos: 40 })
        expect(r.body.economia).toBe('e2r')
        const { rows } = await pool.query(`select detalle from premios where perfil_id = $1 and tipo = 'releida'`, [n.id])
        expect(rows[0].detalle.reglas).toBe('3.0.0-e2r')
        const segundos = rows[0].detalle.segundosPagados as number
        // 1,5/min (con E2 sería 1/min); la fracción anterior del libro suma a lo más 1.
        expect(r.body.otorgadas).toBeGreaterThanOrEqual(Math.floor((1.5 * segundos) / 60))
        expect(r.body.otorgadas).toBeLessThanOrEqual(Math.floor((1.5 * segundos) / 60) + 1)
      } finally {
        await appE2R.close()
      }
    })

    it('operationId repetido (también a la vez): paga una sola vez y responde lo mismo', async () => {
      const n = await nino()
      const frases = frasesUnicas(4, 5)
      const { asignacionId } = await libro(n.id, frases, 1)
      const us = unidadesDe(frases, 1)
      minutos(120)
      const pedido = { operationId: nuevoOp(), tipo: 'avance', hasta: us[0].fin, conPremio: true, segundosActivos: 200 }
      const aLaVez = await Promise.all(Array.from({ length: 8 }, () => pedirCon(appE2, 'POST', `/api/asignaciones/${asignacionId}/premios`, n.token, pedido)))
      expect(aLaVez.every((r) => r.status === 200)).toBe(true)
      expect(aLaVez.filter((r) => r.body.estado === 'otorgado')).toHaveLength(1)
      const otorgadas = aLaVez.find((r) => r.body.estado === 'otorgado')!.body.otorgadas
      expect(aLaVez.every((r) => r.body.otorgadas === otorgadas)).toBe(true)
      // El mismo operationId con otro contenido (cliente modificado): sigue siendo el primero.
      const trampa = await pedirCon(appE2, 'POST', `/api/asignaciones/${asignacionId}/premios`, n.token, { ...pedido, hasta: us.at(-1)!.fin, segundosActivos: 9999 })
      expect(trampa.body).toMatchObject({ estado: 'repetido', otorgadas })
      expect(await saldo(n.id)).toBe(otorgadas)
    })

    it('compras simultáneas mientras llegan premios: atómico, saldo ≥ 0 y el registro cuadra', async () => {
      const n = await nino()
      expect((await pedirCon(appE2, 'POST', `/api/perfiles/${n.id}/monedas`, P, { cantidad: 30, motivo: 'Preparar la prueba' })).body.monedas).toBe(30)
      const frases = frasesUnicas(6, 6)
      const { asignacionId } = await libro(n.id, frases, 1)
      const us = unidadesDe(frases, 1)
      minutos(120)
      const items = ['comida-frutilla', 'comida-platano', 'comida-sandia', 'comida-galleta']
      const resultados = await Promise.all([
        ...items.map((itemId) => pedirCon(appE2, 'POST', `/api/perfiles/${n.id}/comprar`, n.token, { itemId })),
        ...us.slice(0, 3).map((u) => pedirPremio(appE2, n.token, asignacionId, { tipo: 'avance', hasta: u.fin, conPremio: true, segundosActivos: 100 })),
      ])
      expect(resultados.every((r) => r.status === 200 || (r.status === 400 && /Te faltan/.test(r.body.error)))).toBe(true)
      const s = await saldo(n.id)
      expect(s).toBeGreaterThanOrEqual(0)
      const { rows } = await pool.query(
        `select (select coalesce(sum(monedas), 0) from premios where perfil_id = $1)::int - (select coalesce(sum(precio_pagado), 0) from compras where perfil_id = $1)::int as cuadra`,
        [n.id],
      )
      expect(rows[0].cuadra).toBe(s)
    })

    it('progreso falso: más allá del libro, a mitad de una unidad o «completado» por la app no paga', async () => {
      const n = await nino()
      // Nivel 3: la unidad es el párrafo (varias frases).
      const frases = frasesUnicas(9, 8)
      const { asignacionId } = await libro(n.id, frases, 3)
      const us = unidadesDe(frases, 3)
      minutos(120)
      for (const hasta of [999, frases.length + 1, -1]) {
        const r = await pedirPremio(appE2, n.token, asignacionId, { tipo: 'avance', hasta, conPremio: true, segundosActivos: 60 })
        expect(r.status === 400 || r.body.motivo === 'unidad_inexistente' || r.body.otorgadas === 0).toBe(true)
      }
      if (us.length > 1 && us[0].fin > 1) {
        expect((await pedirPremio(appE2, n.token, asignacionId, { tipo: 'avance', hasta: us[0].fin - 1, conPremio: true, segundosActivos: 60 })).body).toMatchObject({ otorgadas: 0, motivo: 'unidad_inexistente' })
      }
      // El progreso que guarda la app (completada, leído hasta el final) no paga ni cuenta como pagado.
      await pedirCon(appE2, 'PUT', `/api/asignaciones/${asignacionId}/progreso`, n.token, { fraseActual: 9, fraseMaxima: 9, estado: 'completada', leidoHasta: 9, premiosPorRegistro: true })
      expect(await saldo(n.id)).toBe(0)
      const a = (await pedirCon(appE2, 'GET', `/api/perfiles/${n.id}/asignaciones`, n.token)).body.find((x: { id: string }) => x.id === asignacionId)
      expect(a).toMatchObject({ estado: 'completada', pagadoHasta: 0 })
      // Tampoco desbloquea la Cuncuna marcar «completados» los 8 cuentos de nivel 0.
      const todas = (await pedirCon(appE2, 'GET', `/api/perfiles/${n.id}/asignaciones`, n.token)).body as { id: string; textoId: string }[]
      for (const x of todas.filter((x) => ORIGINALES_N0.includes(x.textoId))) {
        await pedirCon(appE2, 'PUT', `/api/asignaciones/${x.id}/progreso`, n.token, { fraseActual: 99, fraseMaxima: 99, estado: 'completada', leidoHasta: 99, premiosPorRegistro: true })
      }
      expect((await pedirCon(appE2, 'GET', `/api/perfiles/${n.id}/desbloqueos`, n.token)).body).toEqual([])
      // Ajustar las propias monedas con un «motivo» no sirve (no es su adulto).
      expect((await pedirCon(appE2, 'POST', `/api/perfiles/${n.id}/monedas`, n.token, { cantidad: 100, motivo: 'me lo merezco' })).body.monedas).toBe(0)
    })

    it('cliente viejo 2.4.1 contra el servidor E2: sin segundos medidos su progreso paga solo el mínimo plausible (una vez); POST /monedas no suma', async () => {
      const n = await nino()
      const frases = frasesUnicas(5, 5)
      const { asignacionId } = await libro(n.id, frases, 1)
      const us = unidadesDe(frases, 1)
      minutos(120)
      expect((await pedirCon(appE2, 'POST', `/api/perfiles/${n.id}/monedas`, n.token, { cantidad: 100 })).body).toEqual({ monedas: 0 })
      // La APK antigua manda su progreso unidad por unidad, sin segundos: cuenta solo lo mínimo para pasar el dedo.
      for (const u of us) {
        minutos(1)
        const r = await pedirCon(appE2, 'PUT', `/api/asignaciones/${asignacionId}/progreso`, n.token, { fraseActual: u.fin, fraseMaxima: u.fin, estado: 'en_curso', leidoHasta: u.fin })
        expect(r.status).toBe(200)
        // El mismo progreso dos veces no paga dos veces.
        await pedirCon(appE2, 'PUT', `/api/asignaciones/${asignacionId}/progreso`, n.token, { fraseActual: u.fin, fraseMaxima: u.fin, estado: 'en_curso', leidoHasta: u.fin })
      }
      // Mínimo plausible: 0,1 s por palabra y 0,5 s por unidad (no lo esperado: eso sería pagar sin medir).
      const minimo = us.reduce((s, u) => s + Math.max(0.5, contarPalabras(u.texto) * 0.1), 0)
      const { rows: pagadas } = await pool.query(`select sum((detalle->>'segundosPagados')::real)::real as s from premios where perfil_id = $1 and tipo = 'avance'`, [n.id])
      expect(pagadas[0].s).toBeCloseTo(minimo, 1)
      // Tampoco el premio de terminar (no hay ≥ 50 % de lo esperado activo).
      expect(await saldo(n.id)).toBe(Math.floor((2 * minimo) / 60 + 1e-9))
      const a = (await pedirCon(appE2, 'GET', `/api/perfiles/${n.id}/asignaciones`, n.token)).body.find((x: { id: string }) => x.id === asignacionId)
      expect(a.pagadoHasta).toBe(5)
      // Su relectura (fecha en el progreso, sin tropiezos) no paga la «mejora».
      const antes = await saldo(n.id)
      await pedirCon(appE2, 'PUT', `/api/asignaciones/${asignacionId}/progreso`, n.token, { fraseActual: 5, fraseMaxima: 5, estado: 'completada', leidoHasta: 5, relecturaPremiadaEn: hoyUtc() })
      expect(await saldo(n.id)).toBe(antes)
      const { rows } = await pool.query(`select count(*)::int as n from premios where perfil_id = $1 and detalle->>'origen' = 'legado'`, [n.id])
      expect(rows[0].n).toBeGreaterThan(0)
    })
  })

  // ── Cuncuna ───────────────────────────────────────────────────────────

  // 2.5.2: la Cuncuna se compra con monedas; leer ya no la regala (CUNCUNA_POR_LECTURA = false).
  // Las pruebas de la regla de lectura quedan omitidas; las de migración y regalo del adulto siguen.
  describe('Cuncuna', () => {
    const asignacionesDe = async (n: { id: string; token: string }) =>
      (await pedirCon(appE2, 'GET', `/api/perfiles/${n.id}/asignaciones`, n.token)).body as { id: string; textoId: string; nivel: number }[]
    const totalFrases = async (textoId: string) => (await pool.query('select array_length(frases, 1) as n from textos where id = $1', [textoId])).rows[0].n as number
    /** Termina un cuento de una vez (sin segundos: lo esperado), dejando pasar el tiempo. */
    const terminar = async (app: App, n: { token: string }, a: { id: string; textoId: string }) => {
      minutos(120)
      const r = await pedirPremio(app, n.token, a.id, { tipo: 'avance', hasta: await totalFrases(a.textoId), conPremio: true })
      expect(r.status).toBe(200)
      return r
    }
    const desbloqueos = async (n: { id: string; token: string }) => (await pedirCon(appE2, 'GET', `/api/perfiles/${n.id}/desbloqueos`, n.token)).body
    const inventario = async (id: string) => (await pool.query('select inventario from perfiles_ninos where id = $1', [id])).rows[0].inventario as string[]

    it('los 8 cuentos originales de nivel 0 de la migración son los de src/contenido/cuentos.ts', async () => {
      const sql = await migracion013()
      const enSql = [...sql.matchAll(/'(c1e0a000-[0-9a-f-]+)'/g)].map((m) => m[1])
      expect(enSql.sort()).toEqual(CUENTOS.filter((c) => c.nivel === 0).map((c) => c.id).sort())
      expect(ORIGINALES_N0).toHaveLength(8)
    })

    it.skip('6 de los 8 cuentos de nivel 0: se desbloquea una vez, queda «por celebrar» y luego «celebrado» (también con 2.4.1)', async () => {
      const n = await nino()
      const n0 = (await asignacionesDe(n)).filter((a) => ORIGINALES_N0.includes(a.textoId))
      expect(n0).toHaveLength(8)
      for (const a of n0.slice(0, 5)) expect((await terminar(appActual, n, a)).body.desbloqueos).toEqual([])
      expect(await desbloqueos(n)).toEqual([])
      const sexto = await terminar(appActual, n, n0[5])
      expect(sexto.body.desbloqueos).toEqual([CUNCUNA])
      expect(await inventario(n.id)).toContain(CUNCUNA)
      expect(await desbloqueos(n)).toMatchObject([{ item: CUNCUNA, motivo: 'nivel0', estado: 'por_celebrar' }])
      // El séptimo no lo repite.
      expect((await terminar(appActual, n, n0[6])).body.desbloqueos).toEqual([])
      expect((await inventario(n.id)).filter((i) => i === CUNCUNA)).toHaveLength(1)
      // Celebrada: no se vuelve a mostrar.
      expect((await pedirCon(appE2, 'POST', `/api/perfiles/${n.id}/desbloqueos/${encodeURIComponent(CUNCUNA)}/celebrado`, n.token)).body).toMatchObject({ estado: 'celebrado' })
      expect(await desbloqueos(n)).toMatchObject([{ estado: 'celebrado' }])
      expect((await pedirCon(appE2, 'POST', `/api/perfiles/${n.id}/desbloqueos/otra-cosa/celebrado`, n.token)).status).toBe(404)
    })

    it.skip('quien empieza en otro nivel: 6 cuentos de Ciempi distintos de cualquier nivel', async () => {
      const n = await nino()
      const otros = (await asignacionesDe(n)).filter((a) => !ORIGINALES_N0.includes(a.textoId))
      for (const a of otros.slice(0, 5)) await terminar(appE2, n, a)
      expect(await desbloqueos(n)).toEqual([])
      // Un texto propio terminado no cuenta.
      const propio = await libro(n.id, frasesUnicas(3), 1, n.token)
      await terminar(appE2, n, { id: propio.asignacionId, textoId: propio.textoId })
      expect(await desbloqueos(n)).toEqual([])
      expect((await terminar(appE2, n, otros[5])).body.desbloqueos).toEqual([CUNCUNA])
      expect(await desbloqueos(n)).toMatchObject([{ motivo: 'cuentos' }])
    })

    it.skip('si un adulto quitó cuentos de nivel 0: todos los que tenga, con un mínimo de 4', async () => {
      const n = await nino()
      const n0 = (await asignacionesDe(n)).filter((a) => ORIGINALES_N0.includes(a.textoId))
      for (const a of n0.slice(4)) expect((await pedirCon(appE2, 'DELETE', `/api/asignaciones/${a.id}`, P)).status).toBe(200)
      for (const a of n0.slice(0, 3)) await terminar(appE2, n, a)
      expect(await desbloqueos(n)).toEqual([])
      await terminar(appE2, n, n0[3])
      expect(await desbloqueos(n)).toMatchObject([{ motivo: 'nivel0' }])
    })

    it.skip('lector muy lento: 60 min activos en nivel 0 y 30 frases distintas; solo tiempo no basta', async () => {
      const n = await nino()
      const n0 = (await asignacionesDe(n)).filter((a) => ORIGINALES_N0.includes(a.textoId))
      const cuentos = await Promise.all(
        n0.map(async (a) => {
          const { rows } = await pool.query('select frases, parrafos from textos where id = $1', [a.textoId])
          return { a, us: unidadesDe(rows[0].frases, 0, rows[0].parrafos ?? undefined) }
        }),
      )
      // Primera frase de un cuento y luego releerla muchas veces, despacio: más de una hora, pero 1 frase.
      const [c0] = cuentos
      const lento = (u: { texto: string }) => 2 * esperado(u.texto, 0)
      ahora += lento(c0.us[0]) * 1000
      await pedirPremio(appE2, n.token, c0.a.id, { tipo: 'avance', hasta: c0.us[0].fin, conPremio: true, segundosActivos: lento(c0.us[0]) })
      let releido = 0
      while (releido < 4000) {
        const s = lento(c0.us[0])
        ahora += s * 1000
        await pedirPremio(appE2, n.token, c0.a.id, { tipo: 'releida', hasta: c0.us[0].fin, conPremio: true, segundosActivos: s })
        releido += s
      }
      const { rows: act } = await pool.query(`select sum(segundos_actividad)::real as s from lecturas_premiadas where perfil_id = $1`, [n.id])
      expect(act[0].s).toBeGreaterThan(3600)
      expect(await desbloqueos(n)).toEqual([])
      // Avanza sin terminar ningún cuento (deja la última frase de cada uno) hasta 30 frases distintas.
      let frasesLeidas = 1
      let respuesta: Respuesta | null = null
      for (const c of cuentos) {
        for (const u of c.us.slice(c === c0 ? 1 : 0, -1)) {
          if (frasesLeidas >= 30) break
          const s = lento(u)
          ahora += s * 1000
          respuesta = await pedirPremio(appE2, n.token, c.a.id, { tipo: 'avance', hasta: u.fin, conPremio: true, segundosActivos: s })
          frasesLeidas = (await pool.query(`select sum(least(pagado_hasta, 99))::int as f from asignaciones where perfil_id = $1 and texto_id = any($2::uuid[])`, [n.id, ORIGINALES_N0])).rows[0].f
          if (frasesLeidas < 30) expect(respuesta.body.desbloqueos).toEqual([])
        }
      }
      expect(frasesLeidas).toBeGreaterThanOrEqual(30)
      expect(respuesta!.body.desbloqueos).toEqual([CUNCUNA])
      expect(await desbloqueos(n)).toMatchObject([{ motivo: 'lector_lento', estado: 'por_celebrar' }])
    })

    it('regalo de un adulto, con motivo; el niño no se la puede regalar', async () => {
      const n = await nino()
      expect((await pedirCon(appE2, 'POST', `/api/perfiles/${n.id}/desbloqueos`, n.token, { item: CUNCUNA, motivo: 'yo' })).status).toBe(403)
      expect((await pedirCon(appE2, 'POST', `/api/perfiles/${n.id}/desbloqueos`, P, { item: CUNCUNA, motivo: '' })).status).toBe(400)
      expect((await pedirCon(appE2, 'POST', `/api/perfiles/${n.id}/desbloqueos`, P, { item: 'especie:dragon', motivo: 'x' })).status).toBe(400)
      const r = await pedirCon(appE2, 'POST', `/api/perfiles/${n.id}/desbloqueos`, P, { item: CUNCUNA, motivo: 'Se esforzó mucho' })
      expect(r.body).toMatchObject([{ item: CUNCUNA, motivo: 'regalo', estado: 'por_celebrar' }])
      expect(await saldo(n.id)).toBe(0)
    })

    it('migración 013: retroactiva con lo ya pagado, idempotente y sin tocar saldos ni progreso', async () => {
      const n = await nino()
      const n0 = (await asignacionesDe(n)).filter((a) => ORIGINALES_N0.includes(a.textoId))
      // Datos de antes (2.4.x): seis cuentos ya pagados, sin desbloqueo registrado.
      await pool.query(
        `update asignaciones a set pagado_hasta = array_length(t.frases, 1), leido_hasta = array_length(t.frases, 1)
           from textos t where t.id = a.texto_id and a.id = any($1::uuid[])`,
        [n0.slice(0, 6).map((a) => a.id)],
      )
      await pool.query('update perfiles_ninos set monedas = 77 where id = $1', [n.id])
      const foto = async () =>
        (
          await pool.query(
            `select (select monedas from perfiles_ninos where id = $1) as monedas,
                    (select json_agg(json_build_object('id', id, 'p', pagado_hasta, 'l', leido_hasta) order by id) from asignaciones where perfil_id = $1) as progreso,
                    (select count(*)::int from premios) as premios, (select count(*)::int from compras) as compras`,
            [n.id],
          )
        ).rows[0]
      const antes = await foto()
      const sql = await migracion013()
      await pool.query(sql)
      const { rows } = await pool.query('select motivo, estado, detalle from desbloqueos where perfil_id = $1', [n.id])
      expect(rows).toEqual([{ motivo: 'nivel0', estado: 'por_celebrar', detalle: { retroactivo: true, migracion: '013' } }])
      // Otra vez: nada cambia ni se duplica.
      await pool.query(sql)
      await pool.query(sql)
      expect((await pool.query('select count(*)::int as n from desbloqueos where perfil_id = $1', [n.id])).rows[0].n).toBe(1)
      expect((await inventario(n.id)).filter((i) => i === CUNCUNA)).toHaveLength(1)
      expect(await foto()).toEqual(antes)
      // Los desbloqueos ya celebrados siguen celebrados después de volver a correrla.
      await pedirCon(appE2, 'POST', `/api/perfiles/${n.id}/desbloqueos/${encodeURIComponent(CUNCUNA)}/celebrado`, n.token)
      await pool.query(sql)
      expect(await desbloqueos(n)).toMatchObject([{ estado: 'celebrado' }])
    })
  })
})
