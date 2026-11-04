/**
 * Bailes (2.7): se compran como cualquier cosa de la tienda (los gratis se
 * tienen sin comprarlos) y el de celebrar (`apariencia.celebracion`) tiene que
 * ser suyo en PUT /ciempi; si una APK anterior no manda el campo, se conserva
 * el guardado. Contra un PostgreSQL real (DATABASE_URL), en su propio esquema.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const HAY_BASE = !!process.env.DATABASE_URL
const ESQUEMA = 'prueba_bailes'

describe.skipIf(!HAY_BASE)('bailes en la tienda', async () => {
  process.env.NODE_ENV = 'test'
  delete process.env.ECONOMIA
  const url = new URL(process.env.DATABASE_URL!)
  url.searchParams.set('options', `-c search_path=${ESQUEMA}`)
  process.env.DATABASE_URL = url.toString()
  const { pool, migrar } = await import('../src/db.ts')
  const { crearApp } = await import('../src/app.ts')
  const { APARIENCIA_INICIAL, CELEBRACION_INICIAL } = await import('../../src/ciempi/catalogo.ts')

  let app: Awaited<ReturnType<typeof crearApp>>
  type Respuesta = { status: number; body: any }
  const pedir = async (metodo: 'GET' | 'POST' | 'PUT', ruta: string, token?: string, payload?: object): Promise<Respuesta> => {
    const r = await app.inject({ method: metodo, url: ruta, payload, headers: token ? { authorization: `Bearer ${token}` } : {} })
    return { status: r.statusCode, body: r.body ? JSON.parse(r.body) : null }
  }
  let P: string

  beforeAll(async () => {
    await pool.query(`drop schema if exists ${ESQUEMA} cascade; create schema ${ESQUEMA}`)
    await migrar()
    app = await crearApp()
    P = (await pedir('POST', '/api/registro', undefined, { correo: 'bailes@test.cl', clave: 'clave-segura', nombreVisible: 'Mamá', rol: 'apoderado' })).body.token
  }, 60_000)
  afterAll(async () => {
    await app?.close()
    await pool.query(`drop schema if exists ${ESQUEMA} cascade`)
    await pool.end()
  })

  let ninos = 0
  const nino = async (monedas = 0) => {
    const usuario = `bailenino${++ninos}`
    const id = (await pedir('POST', '/api/perfiles', P, { apodo: `B${ninos}`, icono: '🐛', usuario, clave: 'clave123' })).body.id as string
    const token = (await pedir('POST', '/api/entrar-nino', undefined, { usuario, clave: 'clave123' })).body.token as string
    for (let falta = monedas; falta > 0; falta -= 100)
      expect((await pedir('POST', `/api/perfiles/${id}/monedas`, P, { cantidad: Math.min(100, falta), motivo: 'Preparar la prueba' })).status).toBe(200)
    return { id, token }
  }
  const fila = async (id: string) => (await pool.query('select monedas, inventario, ciempi from perfiles_ninos where id = $1', [id])).rows[0]
  const poner = (n: { id: string; token: string }, apariencia: object) => pedir('PUT', `/api/perfiles/${n.id}/ciempi`, n.token, { apariencia })

  it('compra un baile de pago y lo elige para celebrar', async () => {
    const n = await nino(30)
    const r = await pedir('POST', `/api/perfiles/${n.id}/comprar`, n.token, { itemId: 'baile:e02', precioVisto: 25 })
    expect(r.status).toBe(200)
    expect(r.body.monedas).toBe(5)
    expect(r.body.inventario).toContain('baile:e02')
    const compras = (await pool.query('select item_id, precio_pagado from compras where perfil_id = $1', [n.id])).rows
    expect(compras).toEqual([{ item_id: 'baile:e02', precio_pagado: 25 }])
    const puesto = await poner(n, { ...APARIENCIA_INICIAL, celebracion: 'baile:e02' })
    expect(puesto.status).toBe(200)
    expect(puesto.body.ciempi.celebracion).toBe('baile:e02')
  })

  it('los gratis no se cobran y se pueden elegir sin comprarlos', async () => {
    const n = await nino(0)
    expect((await poner(n, { ...APARIENCIA_INICIAL, celebracion: 'baile:a03' })).body.ciempi.celebracion).toBe('baile:a03')
    const r = await pedir('POST', `/api/perfiles/${n.id}/comprar`, n.token, { itemId: 'baile:a04' })
    expect(r.body.monedas).toBe(0)
  })

  it('no deja celebrar con un baile ajeno (403) ni con uno que no existe (400)', async () => {
    const n = await nino(0)
    const ajeno = await poner(n, { ...APARIENCIA_INICIAL, celebracion: 'baile:e02' })
    expect(ajeno.status).toBe(403)
    expect((await poner(n, { ...APARIENCIA_INICIAL, celebracion: 'baile:z99' })).status).toBe(400)
    expect((await fila(n.id)).ciempi.celebracion ?? CELEBRACION_INICIAL).toBe(CELEBRACION_INICIAL)
  })

  it('una APK anterior (sin `celebracion`) conserva la guardada', async () => {
    const n = await nino(20)
    await pedir('POST', `/api/perfiles/${n.id}/comprar`, n.token, { itemId: 'baile:a12', precioVisto: 20 })
    expect((await poner(n, { ...APARIENCIA_INICIAL, celebracion: 'baile:a12' })).status).toBe(200)
    const { celebracion: _, ...antigua } = { ...APARIENCIA_INICIAL, nombre: 'Pepe' }
    const r = await poner(n, antigua)
    expect(r.status).toBe(200)
    expect(r.body.ciempi.nombre).toBe('Pepe')
    expect(r.body.ciempi.celebracion).toBe('baile:a12')
    expect((await fila(n.id)).ciempi.celebracion).toBe('baile:a12')
  })
})
