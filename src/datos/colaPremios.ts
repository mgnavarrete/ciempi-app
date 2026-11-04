import type { Id } from '../dominio/tipos'
import type { PedidoPremio, RepositorioPremios, ResolucionPremio } from './repositorios'

/**
 * Cola de premios de este dispositivo. Cada moneda que gana el niño es un
 * pedido al servidor («leí hasta la frase N», con su operationId). El pedido
 * se guarda aquí antes de enviarlo y sale de la cola recién cuando el servidor
 * responde: sin conexión (o si se cierra la app) no se pierde, y se vuelve a
 * enviar con el mismo operationId, así que nunca se paga dos veces.
 *
 * Se envían de a uno y en orden (una relectura necesita que antes llegue el
 * final del libro). Si uno no se puede enviar todavía, la cola se detiene y lo
 * reintenta más tarde.
 */

export type PedidoEnCola = PedidoPremio & {
  creadoEn: string
  intentos: number
}

/** Lo que pasó al enviar un pedido. */
export type RespuestaEnvio =
  | { tipo: 'ok'; otorgadas: number; monedas: number }
  /** Sin conexión, servidor caído o «muy rápido»: se reintenta (después de `esperarMs`, si se sabe). */
  | { tipo: 'reintentar'; esperarMs?: number }
  /** El servidor no lo puede pagar nunca (libro quitado, sin permiso): sale de la cola. */
  | { tipo: 'descartar'; motivo: string }

type Almacen = Pick<Storage, 'getItem' | 'setItem'>
type Final = Exclude<ResolucionPremio, { estado: 'pendiente' }>

export const CLAVE_COLA = 'ciempi:premios-pendientes'
/** Más que esto sin enviar es otra cosa (un error): se descartan los más viejos. */
const MAXIMO = 1000
const ESPERA_MINIMA_MS = 5_000
const ESPERA_MAXIMA_MS = 5 * 60_000

export interface ColaPremios extends RepositorioPremios {
  /** Lo que queda por enviar (de un niño, o de todos). */
  enCola(perfilId?: Id): PedidoEnCola[]
}

export function crearColaPremios(opciones: {
  enviar: (p: PedidoEnCola) => Promise<RespuestaEnvio>
  /** Dónde se guarda (localStorage). Sin almacenamiento, en memoria mientras la app esté abierta. */
  almacen?: Almacen | null
  /** Para reintentar más tarde (las pruebas lo reemplazan). */
  programar?: (fn: () => void, ms: number) => void
}): ColaPremios {
  const { enviar } = opciones
  const programar = opciones.programar ?? ((fn, ms) => void setTimeout(fn, ms))
  let memoria: PedidoEnCola[] = []

  // La lista se lee y escribe entera cada vez: si hay dos pestañas abiertas, no se pisan lo agregado.
  const leer = (): PedidoEnCola[] => {
    try {
      const guardado = opciones.almacen?.getItem(CLAVE_COLA)
      if (guardado != null) return JSON.parse(guardado) as PedidoEnCola[]
    } catch {
      // Almacenamiento bloqueado o dañado: lo de esta sesión.
    }
    return memoria
  }
  const escribir = (lista: PedidoEnCola[]) => {
    memoria = lista.slice(-MAXIMO)
    try {
      opciones.almacen?.setItem(CLAVE_COLA, JSON.stringify(memoria))
    } catch {
      // Sin espacio o sin permiso: queda en memoria.
    }
  }
  const quitar = (operationId: Id) => escribir(leer().filter((p) => p.operationId !== operationId))

  const oyentes = new Set<(p: PedidoPremio, r: Final) => void>()
  const avisar = (p: PedidoPremio, r: Final) => oyentes.forEach((fn) => fn(p, r))
  // Quien espera la primera respuesta de su pedido (reclamar).
  const esperando = new Map<Id, (r: ResolucionPremio) => void>()
  const resolver = (operationId: Id, r: ResolucionPremio) => {
    esperando.get(operationId)?.(r)
    esperando.delete(operationId)
  }

  let enCurso: Promise<void> | null = null
  let reintentoProgramado = false

  function programarReintento(intentos: number, esperarMs?: number) {
    if (reintentoProgramado) return
    reintentoProgramado = true
    const ms = esperarMs ?? Math.min(ESPERA_MAXIMA_MS, ESPERA_MINIMA_MS * 2 ** Math.max(0, intentos - 1))
    programar(() => {
      reintentoProgramado = false
      void procesar()
    }, ms)
  }

  function procesar(): Promise<void> {
    if (enCurso) return enCurso
    enCurso = (async () => {
      try {
        for (;;) {
          const pedido = leer()[0]
          if (!pedido) return
          let r: RespuestaEnvio
          try {
            r = await enviar(pedido)
          } catch {
            r = { tipo: 'reintentar' }
          }
          if (r.tipo === 'reintentar') {
            const intentos = pedido.intentos + 1
            escribir(leer().map((p) => (p.operationId === pedido.operationId ? { ...p, intentos } : p)))
            // Los que esperan respuesta quedan como pendientes: se avisará cuando se paguen.
            for (const p of leer()) resolver(p.operationId, { estado: 'pendiente' })
            programarReintento(intentos, r.esperarMs)
            return
          }
          quitar(pedido.operationId)
          const final: Final = r.tipo === 'ok' ? { estado: 'otorgado', otorgadas: r.otorgadas, monedas: r.monedas } : { estado: 'descartado', motivo: r.motivo }
          resolver(pedido.operationId, final)
          avisar(pedido, final)
        }
      } finally {
        enCurso = null
      }
    })()
    return enCurso
  }

  return {
    async reclamar(pedido) {
      if (!leer().some((p) => p.operationId === pedido.operationId)) {
        escribir([...leer(), { ...pedido, creadoEn: new Date().toISOString(), intentos: 0 }])
      }
      const respuesta = new Promise<ResolucionPremio>((r) => esperando.set(pedido.operationId, r))
      void procesar().then(() => {
        // Si la cola ya estaba detenida esperando un reintento, este queda pendiente.
        if (leer().some((p) => p.operationId === pedido.operationId)) resolver(pedido.operationId, { estado: 'pendiente' })
      })
      return respuesta
    },
    reintentar: () => procesar(),
    pendientes: (perfilId) => leer().reduce((s, p) => s + (p.perfilId === perfilId ? p.esperadas : 0), 0),
    enCola: (perfilId) => leer().filter((p) => !perfilId || p.perfilId === perfilId),
    alResolver(fn) {
      oyentes.add(fn)
      return () => void oyentes.delete(fn)
    },
  }
}
