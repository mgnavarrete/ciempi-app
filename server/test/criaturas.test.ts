/**
 * Criaturas (2.5): compras de especies, variantes y paquetes, la Cuncuna
 * (solo por desbloqueo) y la criatura puesta en PUT /ciempi, también con una
 * APK anterior que no conoce `criatura`. Contra un PostgreSQL real
 * (DATABASE_URL), en su propio esquema (`prueba_criaturas`).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const HAY_BASE = !!process.env.DATABASE_URL
const ESQUEMA = 'prueba_criaturas'

describe.skipIf(!HAY_BASE)('criaturas en la tienda', async () => {
  process.env.NODE_ENV = 'test'
  delete process.env.ECONOMIA
  const url = new URL(process.env.DATABASE_URL!)
  url.searchParams.set('options', `-c search_path=${ESQUEMA}`)
  process.env.DATABASE_URL = url.toString()
  const { pool, migrar } = await import('../src/db.ts')
  const { crearApp } = await import('../src/app.ts')
  const { CUNCUNA } = await import('../src/desbloqueos.ts')
  const { APARIENCIA_INICIAL } = await import('../../src/ciempi/catalogo.ts')

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
    P = (await pedir('POST', '/api/registro', undefined, { correo: 'criaturas@test.cl', clave: 'clave-segura', nombreVisible: 'Mamá', rol: 'apoderado' })).body.token
  }, 60_000)
  afterAll(async () => {
    await app?.close()
    await pool.query(`drop schema if exists ${ESQUEMA} cascade`)
    await pool.end()
  })

  let ninos = 0
  /** Un niño nuevo con `monedas` (ajuste del adulto) y su token. */
  const nino = async (monedas = 0) => {
    const usuario = `crianino${++ninos}`
    const id = (await pedir('POST', '/api/perfiles', P, { apodo: `C${ninos}`, icono: '🐛', usuario, clave: 'clave123' })).body.id as string
    const token = (await pedir('POST', '/api/entrar-nino', undefined, { usuario, clave: 'clave123' })).body.token as string
    // El ajuste a mano es de a 100 como máximo.
    for (let falta = monedas; falta > 0; falta -= 100)
      expect((await pedir('POST', `/api/perfiles/${id}/monedas`, P, { cantidad: Math.min(100, falta), motivo: 'Preparar la prueba' })).status).toBe(200)
    expect((await fila(id)).monedas).toBe(monedas)
    return { id, token }
  }
  type Nino = Awaited<ReturnType<typeof nino>>
  const fila = async (id: string) => (await pool.query('select monedas, inventario, ciempi from perfiles_ninos where id = $1', [id])).rows[0]
  const compras = async (id: string) =>
    (await pool.query('select item_id, precio_pagado from compras where perfil_id = $1 order by item_id', [id])).rows.map((r) => [r.item_id, r.precio_pagado])
  const comprar = (n: Nino, itemId: string, precioVisto?: number) => pedir('POST', `/api/perfiles/${n.id}/comprar`, n.token, { itemId, precioVisto })
  const poner = (n: Nino, apariencia: object) => pedir('PUT', `/api/perfiles/${n.id}/ciempi`, n.token, { apariencia })
  const regalarCuncuna = (n: Nino) => pedir('POST', `/api/perfiles/${n.id}/desbloqueos`, P, { item: CUNCUNA, motivo: 'Leyó en papel' })

  it('variante sin la especie: cobra las dos y anota dos líneas', async () => {
    const n = await nino(200)
    const r = await comprar(n, 'variante:dragon-fuego', 104)
    expect(r.status).toBe(200)
    expect(r.body.monedas).toBe(96)
    expect(r.body.inventario.sort()).toEqual(['especie:dragon', 'variante:dragon-fuego'])
    expect(await compras(n.id)).toEqual([
      ['especie:dragon', 80],
      ['variante:dragon-fuego', 24],
    ])
  })

  it('variante con la especie: cobra solo la variante; la especie no se vuelve a pagar', async () => {
    const n = await nino(200)
    expect((await comprar(n, 'especie:serpiente', 60)).body.monedas).toBe(140)
    expect((await comprar(n, 'variante:serpiente-noche', 24)).body.monedas).toBe(116)
    expect((await comprar(n, 'especie:serpiente')).body.monedas).toBe(116)
    // La base viene con la especie: «comprarla» no cobra.
    expect((await comprar(n, 'variante:serpiente-caramelo')).body.monedas).toBe(116)
    expect((await fila(n.id)).inventario).not.toContain('variante:serpiente-caramelo')
  })

  it('dos compras simultáneas del mismo item: una sola cobra', async () => {
    const n = await nino(200)
    const rs = await Promise.all([comprar(n, 'variante:camaleon-pastel'), comprar(n, 'variante:camaleon-pastel'), comprar(n, 'variante:camaleon-pastel')])
    expect(rs.every((r) => r.status === 200)).toBe(true)
    const f = await fila(n.id)
    expect(f.monedas).toBe(200 - 94)
    expect(f.inventario.filter((i: string) => i === 'variante:camaleon-pastel')).toHaveLength(1)
    expect(f.inventario.filter((i: string) => i === 'especie:camaleon')).toHaveLength(1)
    expect(await compras(n.id)).toEqual([
      ['especie:camaleon', 70],
      ['variante:camaleon-pastel', 24],
    ])
  })

  it('compras simultáneas de items distintos sin saldo suficiente: el saldo nunca queda negativo', async () => {
    const n = await nino(150)
    const items = ['especie:dragon', 'especie:serpiente', 'especie:camaleon', 'variante:dragon-hielo'] // 80 + 60 + 70 + (24 o 104)
    const rs = await Promise.all(items.map((i) => comprar(n, i)))
    expect(rs.filter((r) => r.status === 400).every((r) => /Te faltan/.test(r.body.error))).toBe(true)
    expect(rs.some((r) => r.status === 400)).toBe(true)
    const f = await fila(n.id)
    const total = (await compras(n.id)).reduce((s, [, p]) => s + p, 0)
    expect(f.monedas).toBe(150 - total)
    expect(f.monedas).toBeGreaterThanOrEqual(0)
  })

  it('reintento de la misma compra: no cobra dos veces', async () => {
    const n = await nino(100)
    const a = await comprar(n, 'especie:serpiente', 60)
    const b = await comprar(n, 'especie:serpiente', 60)
    expect(a.body).toEqual(b.body)
    expect(b.body.monedas).toBe(40)
    expect(await compras(n.id)).toEqual([['especie:serpiente', 60]])
  })

  it('precioVisto menor que el precio: no cobra (la variante sin especie cuesta más)', async () => {
    const n = await nino(200)
    const r = await comprar(n, 'variante:dragon-tierra', 24)
    expect(r.status).toBe(400)
    expect(r.body.error).toMatch(/ahora cuesta 104/)
    expect((await fila(n.id)).monedas).toBe(200)
    expect(await compras(n.id)).toEqual([])
  })

  it('nunca cobra más de lo mostrado: precioVisto es el total combinado (especie + variante)', async () => {
    const n = await nino(200)
    // La app mostró 103 (uno menos que Dragón 80 + Dragón de Fuego 24): no se cobra.
    const r = await comprar(n, 'variante:dragon-fuego', 103)
    expect(r.status).toBe(400)
    expect(r.body.error).toMatch(/ahora cuesta 104/)
    expect((await fila(n.id)).monedas).toBe(200)
    // Con el total exacto, cobra exactamente eso.
    expect((await comprar(n, 'variante:dragon-fuego', 104)).body.monedas).toBe(96)
    // Mostrar de más tampoco cobra de más: cobra el precio real.
    expect((await comprar(n, 'variante:dragon-hielo', 999)).body.monedas).toBe(72)
  })

  it('paquete parcial: el precio mostrado (precioDe) es igual al cobrado', async () => {
    const { buscarItem, precioDe } = await import('../../src/ciempi/catalogo.ts')
    const n = await nino(300)
    await comprar(n, 'variante:camaleon-tropical')
    const mostrado = precioDe(buscarItem('paquete:camaleon')!, (await fila(n.id)).inventario)
    expect(mostrado).toBe(Math.ceil(72 * 0.8))
    const antes = (await fila(n.id)).monedas
    expect((await comprar(n, 'paquete:camaleon', mostrado)).body.monedas).toBe(antes - mostrado)
    expect((await comprar(n, 'paquete:camaleon', mostrado - 1)).status).toBe(200) // ya lo tiene: no cobra
    expect((await fila(n.id)).monedas).toBe(antes - mostrado)
  })

  it('paquete parcial: 80 % de lo que falta, sin cobrar lo que ya tiene', async () => {
    const n = await nino(300)
    await comprar(n, 'variante:serpiente-noche') // 60 + 24
    const r = await comprar(n, 'paquete:serpiente', 39)
    expect(r.status).toBe(200)
    expect(r.body.monedas).toBe(300 - 84 - 39)
    expect(r.body.inventario.sort()).toEqual(['especie:serpiente', 'variante:serpiente-hoja', 'variante:serpiente-jardin', 'variante:serpiente-noche'])
    const c = await compras(n.id)
    expect(c.find(([i]) => i === 'variante:serpiente-noche')).toEqual(['variante:serpiente-noche', 24])
    expect(c.find(([i]) => i === 'paquete:serpiente')).toEqual(['paquete:serpiente', 0])
    expect(c.reduce((s, [, p]) => s + p, 0)).toBe(84 + 39)
    // Ya completo: comprarlo otra vez no cobra.
    expect((await comprar(n, 'paquete:serpiente')).body.monedas).toBe(r.body.monedas)
  })

  it('2.5.2: la Cuncuna se compra con monedas (40), sin cobrar dos veces; sin comprarla no se pone', async () => {
    const n = await nino(100)
    expect((await poner(n, { ...APARIENCIA_INICIAL, criatura: 'variante:cuncuna-clasica' })).status).toBe(403)
    expect((await comprar(n, CUNCUNA, 39)).status).toBe(400)
    const r = await comprar(n, CUNCUNA, 40)
    expect(r.status).toBe(200)
    expect(r.body.monedas).toBe(60)
    expect((await comprar(n, CUNCUNA, 40)).body.monedas).toBe(60)
    expect((await fila(n.id)).inventario).toEqual([CUNCUNA])
    expect((await poner(n, { ...APARIENCIA_INICIAL, criatura: 'variante:cuncuna-clasica' })).status).toBe(200)
  })

  it('Cuncuna desbloqueada (013): se pone la Clásica y compra una variante', async () => {
    const n = await nino(200)
    expect((await regalarCuncuna(n)).status).toBe(200)
    expect((await fila(n.id)).inventario).toEqual([CUNCUNA])
    const puesta = await poner(n, { ...APARIENCIA_INICIAL, criatura: 'variante:cuncuna-clasica' })
    expect(puesta.status).toBe(200)
    expect(puesta.body.ciempi.criatura).toBe('variante:cuncuna-clasica')
    const r = await comprar(n, 'variante:cuncuna-lavanda', 20)
    expect(r.body).toMatchObject({ monedas: 180 })
    expect(await compras(n.id)).toEqual([['variante:cuncuna-lavanda', 20]])
    expect((await poner(n, { ...APARIENCIA_INICIAL, criatura: 'variante:cuncuna-lavanda' })).body.ciempi.criatura).toBe('variante:cuncuna-lavanda')
    // Con la especie, también el paquete: 80 % de las 5 que faltan (100 → 80).
    const p = await comprar(n, 'paquete:cuncuna', 80)
    expect(p.body.monedas).toBe(100)
    expect(p.body.inventario.filter((i: string) => i.startsWith('variante:cuncuna'))).toHaveLength(6)
  })

  it('PUT con una variante ajena → 403; con una inventada → 400; null vuelve a Ciempi', async () => {
    const n = await nino(100)
    await comprar(n, 'especie:dragon')
    expect((await poner(n, { ...APARIENCIA_INICIAL, criatura: 'variante:dragon-nocturno' })).status).toBe(403)
    expect((await poner(n, { ...APARIENCIA_INICIAL, criatura: 'variante:serpiente-caramelo' })).status).toBe(403)
    expect((await poner(n, { ...APARIENCIA_INICIAL, criatura: 'variante:nada' })).status).toBe(400)
    expect((await poner(n, { ...APARIENCIA_INICIAL, criatura: 'variante:dragon-clasico' })).body.ciempi.criatura).toBe('variante:dragon-clasico')
    expect((await poner(n, { ...APARIENCIA_INICIAL, criatura: null })).body.ciempi.criatura).toBeNull()
  })

  it('PUT sin la clave `criatura` (APK antigua): conserva la guardada', async () => {
    const n = await nino(100)
    await comprar(n, 'especie:camaleon')
    await poner(n, { ...APARIENCIA_INICIAL, criatura: 'variante:camaleon-lima' })
    const { criatura: _, ...antigua } = { ...APARIENCIA_INICIAL, cabeza: 'cabeza:cabeza-nada', nombre: 'Lagarto' }
    const r = await poner(n, antigua)
    expect(r.status).toBe(200)
    expect(r.body.ciempi).toMatchObject({ criatura: 'variante:camaleon-lima', nombre: 'Lagarto', cabeza: 'cabeza:cabeza-nada' })
    expect((await fila(n.id)).ciempi.criatura).toBe('variante:camaleon-lima')
  })

  it('una APK antigua que compra un item viejo no pierde nada', async () => {
    const n = await nino(200)
    await comprar(n, 'variante:dragon-fuego')
    await poner(n, { ...APARIENCIA_INICIAL, criatura: 'variante:dragon-fuego' })
    // La APK antigua compra una pieza y se la pone (sin `criatura` en lo que manda).
    const compra = await comprar(n, 'comida-frutilla', 8)
    expect(compra.body.monedas).toBe(200 - 104 - 8)
    expect(compra.body.inventario.sort()).toEqual(['comida-frutilla', 'especie:dragon', 'variante:dragon-fuego'])
    const { criatura: _, ...antigua } = { ...APARIENCIA_INICIAL, comida: 'comida-frutilla' }
    const r = await poner(n, antigua)
    expect(r.body.ciempi).toMatchObject({ comida: 'comida-frutilla', criatura: 'variante:dragon-fuego' })
    // Y lee su perfil: la criatura sigue ahí, con todo lo comprado.
    const perfil = (await pedir('GET', '/api/perfiles', n.token)).body[0]
    expect(perfil.inventario.sort()).toEqual(['comida-frutilla', 'especie:dragon', 'variante:dragon-fuego'])
    expect(perfil.ciempi.criatura).toBe('variante:dragon-fuego')
  })
})
