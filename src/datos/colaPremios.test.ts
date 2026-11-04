import { describe, expect, it } from 'vitest'
import { CLAVE_COLA, crearColaPremios, type PedidoEnCola, type RespuestaEnvio } from './colaPremios'
import type { PedidoPremio, ResolucionPremio } from './repositorios'

function almacenEnMemoria() {
  const datos = new Map<string, string>()
  return {
    datos,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
  }
}

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

/** Un servidor de mentira: responde lo que diga `responder` y anota lo que recibe. */
function servidor(responder: (p: PedidoEnCola) => RespuestaEnvio | Promise<RespuestaEnvio>) {
  const recibidos: PedidoEnCola[] = []
  return {
    recibidos,
    enviar: async (p: PedidoEnCola) => {
      recibidos.push(p)
      return responder(p)
    },
  }
}

/** Reintentos programados, para dispararlos a mano. */
function reloj() {
  const programados: { fn: () => void; ms: number }[] = []
  return {
    programados,
    programar: (fn: () => void, ms: number) => void programados.push({ fn, ms }),
    disparar: () => programados.splice(0).forEach((p) => p.fn()),
  }
}

describe('cola de premios', () => {
  it('sin conexión: queda pendiente, guardada en el dispositivo, y suma lo esperado', async () => {
    const almacen = almacenEnMemoria()
    const red = servidor(() => {
      throw new Error('Sin conexión')
    })
    const cola = crearColaPremios({ enviar: red.enviar, almacen, programar: reloj().programar })
    expect(await cola.reclamar(pedido(1, { esperadas: 2 }))).toEqual({ estado: 'pendiente' })
    expect(await cola.reclamar(pedido(2, { esperadas: 1 }))).toEqual({ estado: 'pendiente' })
    expect(cola.pendientes('nino-1')).toBe(3)
    expect(cola.pendientes('otro')).toBe(0)
    const guardado = JSON.parse(almacen.datos.get(CLAVE_COLA)!) as PedidoEnCola[]
    expect(guardado.map((p) => p.operationId)).toEqual(['operacion-1', 'operacion-2'])
  })

  it('al abrir la app otra vez (nueva instancia), reintenta con el mismo operationId y avisa', async () => {
    const almacen = almacenEnMemoria()
    const sinRed = crearColaPremios({
      enviar: async () => ({ tipo: 'reintentar' }),
      almacen,
      programar: reloj().programar,
    })
    await sinRed.reclamar(pedido(1, { esperadas: 2 }))

    let saldo = 10
    const red = servidor((p) => ({ tipo: 'ok', otorgadas: p.esperadas, monedas: (saldo += p.esperadas) }))
    const otraVez = crearColaPremios({ enviar: red.enviar, almacen, programar: reloj().programar })
    expect(otraVez.pendientes('nino-1')).toBe(2)
    const avisos: [PedidoPremio, ResolucionPremio][] = []
    otraVez.alResolver((p, r) => avisos.push([p, r]))
    await otraVez.reintentar()
    expect(red.recibidos.map((p) => p.operationId)).toEqual(['operacion-1'])
    expect(red.recibidos[0].intentos).toBe(1)
    expect(avisos).toEqual([[expect.objectContaining({ operationId: 'operacion-1' }), { estado: 'otorgado', otorgadas: 2, monedas: 12 }]])
    expect(otraVez.pendientes('nino-1')).toBe(0)
    expect(JSON.parse(almacen.datos.get(CLAVE_COLA)!)).toEqual([])
  })

  it('el mismo pedido dos veces queda una sola vez en la cola', async () => {
    const cola = crearColaPremios({ enviar: async () => ({ tipo: 'reintentar' }), almacen: almacenEnMemoria(), programar: reloj().programar })
    await cola.reclamar(pedido(1))
    await cola.reclamar(pedido(1))
    expect(cola.enCola()).toHaveLength(1)
  })

  it('en orden (FIFO): si el primero no sale, la cola se detiene y no se adelanta el siguiente', async () => {
    let conRed = false
    const red = servidor(() => (conRed ? { tipo: 'ok', otorgadas: 1, monedas: 0 } : { tipo: 'reintentar' }))
    const tiempo = reloj()
    const cola = crearColaPremios({ enviar: red.enviar, almacen: almacenEnMemoria(), programar: tiempo.programar })
    await cola.reclamar(pedido(1))
    await cola.reclamar(pedido(2))
    await cola.reclamar(pedido(3))
    // Sin red: solo se intentó el primero (cada reclamar vuelve a probar con el primero).
    expect(new Set(red.recibidos.map((p) => p.operationId))).toEqual(new Set(['operacion-1']))
    expect(tiempo.programados).toHaveLength(1)

    conRed = true
    red.recibidos.length = 0
    tiempo.disparar()
    await cola.reintentar()
    expect(red.recibidos.map((p) => p.operationId)).toEqual(['operacion-1', 'operacion-2', 'operacion-3'])
    expect(cola.enCola()).toEqual([])
  })

  it('con conexión, la respuesta llega a quien la pidió', async () => {
    const cola = crearColaPremios({
      enviar: async () => ({ tipo: 'ok', otorgadas: 4, monedas: 30 }),
      almacen: almacenEnMemoria(),
      programar: reloj().programar,
    })
    expect(await cola.reclamar(pedido(1, { esperadas: 4 }))).toEqual({ estado: 'otorgado', otorgadas: 4, monedas: 30 })
  })

  it('libro pendiente de aprobación (el servidor paga 0): sale de la cola, no se reintenta y no bloquea lo siguiente', async () => {
    // Pedidos guardados sin conexión (por ejemplo, de una app que mostraba la moneda antes de saber que estaba pendiente).
    const almacen = almacenEnMemoria()
    const sinRed = crearColaPremios({ enviar: async () => ({ tipo: 'reintentar' }), almacen, programar: reloj().programar })
    await sinRed.reclamar(pedido(1, { asignacionId: 'pendiente-1', esperadas: 2 }))
    await sinRed.reclamar(pedido(2, { asignacionId: 'libro-1', esperadas: 1 }))
    const red = servidor((p) => (p.asignacionId === 'pendiente-1' ? { tipo: 'ok', otorgadas: 0, monedas: 10 } : { tipo: 'ok', otorgadas: 1, monedas: 11 }))
    const reloj2 = reloj()
    const cola = crearColaPremios({ enviar: red.enviar, almacen, programar: reloj2.programar })
    const avisos: ResolucionPremio[] = []
    cola.alResolver((_, r) => avisos.push(r))
    await cola.reintentar()
    expect(avisos).toEqual([
      { estado: 'otorgado', otorgadas: 0, monedas: 10 },
      { estado: 'otorgado', otorgadas: 1, monedas: 11 },
    ])
    expect(cola.pendientes('nino-1')).toBe(0)
    expect(JSON.parse(almacen.datos.get(CLAVE_COLA) ?? '[]')).toEqual([])
    reloj2.disparar()
    await cola.reintentar()
    expect(red.recibidos.map((p) => p.operationId)).toEqual(['operacion-1', 'operacion-2'])
  })

  it('descartar: sale de la cola, avisa y la cola sigue con el siguiente', async () => {
    const red = servidor((p) => (p.operationId === 'operacion-1' ? { tipo: 'descartar', motivo: 'Ese libro ya no está' } : { tipo: 'ok', otorgadas: 1, monedas: 1 }))
    const cola = crearColaPremios({ enviar: red.enviar, almacen: almacenEnMemoria(), programar: reloj().programar })
    const avisos: ResolucionPremio[] = []
    cola.alResolver((_, r) => avisos.push(r))
    expect(await cola.reclamar(pedido(1, { esperadas: 3 }))).toEqual({ estado: 'descartado', motivo: 'Ese libro ya no está' })
    await cola.reclamar(pedido(2))
    expect(avisos).toEqual([{ estado: 'descartado', motivo: 'Ese libro ya no está' }, { estado: 'otorgado', otorgadas: 1, monedas: 1 }])
    expect(cola.pendientes('nino-1')).toBe(0)
  })

  it('429 («muy rápido»): espera lo que pide el servidor; sin dato, espera creciente con tope', async () => {
    const tiempo = reloj()
    let respuestas: RespuestaEnvio[] = [{ tipo: 'reintentar', esperarMs: 12_000 }]
    const cola = crearColaPremios({
      enviar: async () => respuestas.shift() ?? { tipo: 'reintentar' },
      almacen: almacenEnMemoria(),
      programar: tiempo.programar,
    })
    expect(await cola.reclamar(pedido(1))).toEqual({ estado: 'pendiente' })
    expect(tiempo.programados.map((p) => p.ms)).toEqual([12_000])

    // Sin indicación del servidor: 5 s, 10 s, 20 s… hasta 5 minutos.
    const esperas: number[] = []
    for (let i = 0; i < 9; i++) {
      tiempo.disparar()
      await cola.reintentar()
      esperas.push(tiempo.programados[0].ms)
    }
    expect(esperas).toEqual([10_000, 20_000, 40_000, 80_000, 160_000, 300_000, 300_000, 300_000, 300_000])
    // Un solo reintento programado a la vez.
    expect(tiempo.programados).toHaveLength(1)

    respuestas = [{ tipo: 'ok', otorgadas: 1, monedas: 1 }]
    tiempo.disparar()
    await cola.reintentar()
    expect(cola.enCola()).toEqual([])
  })

  it('sin almacenamiento (bloqueado), funciona en memoria', async () => {
    const roto = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
    }
    const cola = crearColaPremios({ enviar: async () => ({ tipo: 'reintentar' }), almacen: roto, programar: reloj().programar })
    await cola.reclamar(pedido(1, { esperadas: 2 }))
    expect(cola.pendientes('nino-1')).toBe(2)
  })
})
