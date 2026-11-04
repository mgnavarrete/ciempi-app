import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CLAVE_COLA } from '../colaPremios'
import type { PedidoPremio } from '../repositorios'
import { crearRepositoriosApi } from './repositoriosApi'

/** Un pedido HTTP recibido por el servidor de mentira. */
type Recibido = { metodo: string; ruta: string; cuerpo: Record<string, unknown> | null }
type Respuesta = { status: number; body?: unknown } | 'sin-red'

function localStorageEnMemoria() {
  const datos = new Map<string, string>()
  return {
    datos,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
  }
}

let almacen: ReturnType<typeof localStorageEnMemoria>
let recibidos: Recibido[]
let responder: (r: Recibido) => Respuesta

beforeEach(() => {
  vi.useFakeTimers()
  almacen = localStorageEnMemoria()
  almacen.setItem('ciempi:token', 'token-de-prueba')
  recibidos = []
  vi.stubGlobal('localStorage', almacen)
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const r: Recibido = { metodo: init.method ?? 'GET', ruta: url, cuerpo: init.body ? JSON.parse(init.body as string) : null }
    recibidos.push(r)
    const respuesta = responder(r)
    if (respuesta === 'sin-red') throw new TypeError('Failed to fetch')
    return new Response(respuesta.body === undefined ? null : JSON.stringify(respuesta.body), {
      status: respuesta.status,
      headers: { 'Content-Type': 'application/json' },
    })
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const pedido = (n: number, cambios: Partial<Omit<PedidoPremio, 'tipo'>> = {}): PedidoPremio => ({
  operationId: `operacion-${n}`,
  perfilId: 'nino-1',
  asignacionId: 'libro-1',
  tipo: 'avance',
  hasta: n,
  conPremio: true,
  esperadas: 1,
  ...cambios,
})

const premiosDe = () => recibidos.filter((r) => r.ruta.endsWith('/premios'))

describe('premios con el servidor', () => {
  it('pide «leí hasta N» (no una cantidad) y usa lo que calcula el servidor', async () => {
    responder = () => ({ status: 200, body: { estado: 'otorgado', otorgadas: 1, monedas: 41 } })
    const repos = crearRepositoriosApi('https://servidor')
    const r = await repos.premios.reclamar(pedido(3, { esperadas: 7 }))
    expect(r).toEqual({ estado: 'otorgado', otorgadas: 1, monedas: 41 })
    expect(recibidos).toEqual([
      {
        metodo: 'POST',
        ruta: 'https://servidor/api/asignaciones/libro-1/premios',
        cuerpo: { operationId: 'operacion-3', tipo: 'avance', hasta: 3, conPremio: true, esperadas: 7 },
      },
    ])
  })

  it('la relectura manda su fecha', async () => {
    responder = () => ({ status: 200, body: { otorgadas: 1, monedas: 2 } })
    const repos = crearRepositoriosApi('')
    await repos.premios.reclamar({ operationId: 'relee-0001', perfilId: 'nino-1', asignacionId: 'libro-1', tipo: 'relectura', dia: '2026-11-03', esperadas: 1 })
    expect(recibidos[0].cuerpo).toEqual({ operationId: 'relee-0001', tipo: 'relectura', dia: '2026-11-03', esperadas: 1 })
  })

  it('sin conexión queda en el dispositivo; la app abierta otra vez lo manda con el mismo operationId', async () => {
    responder = () => 'sin-red'
    const antes = crearRepositoriosApi('')
    expect(await antes.premios.reclamar(pedido(1, { esperadas: 2 }))).toEqual({ estado: 'pendiente' })
    expect(antes.premios.pendientes('nino-1')).toBe(2)
    expect(JSON.parse(almacen.getItem(CLAVE_COLA)!)).toHaveLength(1)

    // Se cerró la app; al abrirla hay conexión.
    responder = () => ({ status: 200, body: { otorgadas: 1, monedas: 11 } })
    recibidos = []
    const despues = crearRepositoriosApi('')
    const avisos: unknown[] = []
    despues.premios.alResolver((p, r) => avisos.push([p.operationId, r]))
    await despues.premios.reintentar()
    expect(premiosDe().map((r) => r.cuerpo?.operationId)).toEqual(['operacion-1'])
    expect(avisos).toEqual([['operacion-1', { estado: 'otorgado', otorgadas: 1, monedas: 11 }]])
    expect(despues.premios.pendientes('nino-1')).toBe(0)
  })

  it('429 (muy rápido) y 5xx: queda pendiente para reintentar; sesión vencida (401) también', async () => {
    for (const respuesta of [
      { status: 429, body: { error: 'Más rápido de lo que se puede leer', reintentarEnSegundos: 8 } },
      { status: 503, body: { error: 'caído' } },
      { status: 401, body: { error: 'Sesión vencida' } },
    ]) {
      almacen.removeItem(CLAVE_COLA)
      responder = () => respuesta
      const repos = crearRepositoriosApi('')
      expect(await repos.premios.reclamar(pedido(1))).toEqual({ estado: 'pendiente' })
      expect(repos.premios.pendientes('nino-1')).toBe(1)
    }
  })

  it('libro quitado (404 del servidor) o sin permiso (403): se descarta, no se reintenta', async () => {
    responder = () => ({ status: 404, body: { error: 'Ese libro ya no está en la biblioteca' } })
    const repos = crearRepositoriosApi('')
    expect(await repos.premios.reclamar(pedido(1))).toEqual({ estado: 'descartado', motivo: 'Ese libro ya no está en la biblioteca' })
    responder = () => ({ status: 403, body: { error: 'No puedes ver a este niño' } })
    expect(await repos.premios.reclamar(pedido(2))).toMatchObject({ estado: 'descartado' })
    expect(repos.premios.pendientes('nino-1')).toBe(0)
  })

  it('servidor anterior a 2.5 (no conoce /premios): vuelve al endpoint viejo con lo esperado', async () => {
    responder = (r) =>
      r.ruta.endsWith('/premios')
        ? { status: 404, body: { message: 'Route POST:/api/asignaciones/libro-1/premios not found', error: 'Not Found', statusCode: 404 } }
        : { status: 200, body: { monedas: 23 } }
    const repos = crearRepositoriosApi('')
    expect(await repos.premios.reclamar(pedido(1, { esperadas: 3 }))).toEqual({ estado: 'otorgado', otorgadas: 3, monedas: 23 })
    expect(recibidos.map((r) => [r.metodo, r.ruta, r.cuerpo])).toEqual([
      ['POST', '/api/asignaciones/libro-1/premios', expect.anything()],
      ['POST', '/api/perfiles/nino-1/monedas', { cantidad: 3 }],
    ])
  })

  it('el progreso avisa que los premios van aparte (premiosPorRegistro)', async () => {
    responder = () => ({ status: 200, body: { id: 'libro-1' } })
    const repos = crearRepositoriosApi('')
    await repos.asignaciones.guardarProgreso('libro-1', { fraseActual: 2, fraseMaxima: 2, estado: 'en_curso', leidoHasta: 2, premioHasta: 0 })
    expect(recibidos[0]).toMatchObject({ metodo: 'PUT', ruta: '/api/asignaciones/libro-1/progreso', cuerpo: { leidoHasta: 2, premiosPorRegistro: true } })
  })

  it('antes de comprar se envía lo pendiente (para que alcance lo que el niño ve)', async () => {
    responder = () => 'sin-red'
    const repos = crearRepositoriosApi('')
    await repos.premios.reclamar(pedido(1, { esperadas: 2 }))
    responder = (r) => (r.ruta.endsWith('/comprar') ? { status: 200, body: { monedas: 0, inventario: ['gorro'] } } : { status: 200, body: { otorgadas: 2, monedas: 12 } })
    recibidos = []
    const r = await repos.perfiles.comprar('nino-1', 'gorro', 12)
    expect(recibidos.map((x) => x.ruta)).toEqual(['/api/asignaciones/libro-1/premios', '/api/perfiles/nino-1/comprar'])
    expect(r).toEqual({ monedas: 0, inventario: ['gorro'] })
  })

  it('un adulto que ajusta a mano manda su motivo', async () => {
    responder = () => ({ status: 200, body: { monedas: 5 } })
    const repos = crearRepositoriosApi('')
    expect(await repos.perfiles.sumarMonedas('nino-1', 5, 'Premio por ordenar')).toBe(5)
    expect(recibidos[0].cuerpo).toEqual({ cantidad: 5, motivo: 'Premio por ordenar' })
  })
})
