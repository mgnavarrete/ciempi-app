import { normalizarApariencia } from '../../ciempi/catalogo'
import {
  normalizarAjustes,
  type Asignacion,
  type Cuenta,
  type InvitacionNino,
  type PerfilNino,
  type Sesion,
  type SesionLectura,
  type Texto,
} from '../../dominio/tipos'
import { crearColaPremios, type PedidoEnCola, type RespuestaEnvio } from '../colaPremios'
import type { PendienteDeAutorizar, Repositorios } from '../repositorios'

/**
 * Implementación con el servidor propio de Ciempi (carpeta server/: Node +
 * PostgreSQL). La sesión es un token que se guarda en este dispositivo y se
 * manda en cada pedido (Authorization: Bearer); así funciona igual en la web
 * y en la app Android.
 */

const CLAVE_TOKEN = 'ciempi:token'

export function leerToken(): string | null {
  try {
    return localStorage.getItem(CLAVE_TOKEN)
  } catch {
    return null
  }
}

function guardarToken(token: string | null) {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token)
    else localStorage.removeItem(CLAVE_TOKEN)
  } catch {
    // Sin almacenamiento: la sesión dura mientras la app esté abierta.
  }
}

/** Lo que el servidor devuelve de un perfil se completa con los valores por defecto de la app. */
const aPerfil = (p: PerfilNino): PerfilNino => ({ ...p, ajustes: normalizarAjustes(p.ajustes ?? {}), ciempi: normalizarApariencia(p.ciempi), inventario: p.inventario ?? [] })

/**
 * @param base dirección del servidor: "" para el mismo sitio (la web servida
 *   por nginx) o "https://ciempi.minttu.cl" para la app Android.
 */
export function crearRepositoriosApi(base: string): Repositorios {
  let token = leerToken()
  const oyentes = new Set<(s: Sesion | null) => void>()
  const avisar = (s: Sesion | null) => oyentes.forEach((fn) => fn(s))

  // Enlace de "recuperar contraseña": ?recuperar=<token> en la dirección.
  const tokenRecuperacion = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('recuperar') : null
  let recuperacionPendiente = tokenRecuperacion && tokenRecuperacion !== '1' ? tokenRecuperacion : null

  /** El pedido tal cual: lanza solo si no hay conexión. */
  async function pedirCrudo(metodo: string, ruta: string, cuerpo?: unknown): Promise<{ status: number; ok: boolean; datos: unknown }> {
    let r: Response
    try {
      r = await fetch(`${base}${ruta}`, {
        method: metodo,
        headers: {
          ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      })
    } catch {
      throw new Error('Sin conexión. Revisa tu internet e inténtalo de nuevo.')
    }
    return { status: r.status, ok: r.ok, datos: r.status === 204 ? null : await r.json().catch(() => null) }
  }

  async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
    const r = await pedirCrudo(metodo, ruta, cuerpo)
    const datos = r.datos
    if (r.status === 401 && token && !ruta.startsWith('/api/entrar')) {
      // La sesión venció o la cerraron (por ejemplo, le cambiaron la clave al niño).
      token = null
      guardarToken(null)
      avisar(null)
    }
    if (!r.ok) throw new Error((datos as { error?: string } | null)?.error ?? 'Algo falló. Inténtalo de nuevo.')
    return datos as T
  }

  async function iniciar(ruta: string, cuerpo: unknown): Promise<Sesion> {
    const r = await pedir<{ token: string; sesion: Sesion }>('POST', ruta, cuerpo)
    token = r.token
    guardarToken(token)
    avisar(r.sesion)
    return r.sesion
  }

  const nulo = <T>(p: Promise<T>) => p.catch(() => null)

  /**
   * Envía un pedido de premio de la cola y dice qué hacer con él. El servidor
   * calcula las monedas; si no conoce el pedido (un servidor anterior a 2.5,
   * por ejemplo después de volver atrás una actualización), se usa el
   * endpoint viejo con lo que la app esperaba, como antes.
   */
  async function enviarPremio(p: PedidoEnCola): Promise<RespuestaEnvio> {
    const cuerpo =
      p.tipo === 'avance'
        ? { operationId: p.operationId, tipo: p.tipo, hasta: p.hasta, conPremio: p.conPremio, esperadas: p.esperadas }
        : { operationId: p.operationId, tipo: p.tipo, dia: p.dia, esperadas: p.esperadas }
    let r: Awaited<ReturnType<typeof pedirCrudo>>
    try {
      r = await pedirCrudo('POST', `/api/asignaciones/${p.asignacionId}/premios`, cuerpo)
    } catch {
      return { tipo: 'reintentar' }
    }
    const datos = (r.datos ?? {}) as { otorgadas?: number; monedas?: number; reintentarEnSegundos?: number; error?: string; message?: string }
    if (r.ok) return { tipo: 'ok', otorgadas: datos.otorgadas ?? 0, monedas: datos.monedas ?? 0 }
    if (r.status === 429) return { tipo: 'reintentar', esperarMs: Math.max(1, datos.reintentarEnSegundos ?? 30) * 1000 }
    if (r.status === 404 && typeof datos.message === 'string' && datos.message.startsWith('Route ')) {
      try {
        const viejo = await pedirCrudo('POST', `/api/perfiles/${p.perfilId}/monedas`, { cantidad: p.esperadas })
        if (viejo.ok) return { tipo: 'ok', otorgadas: p.esperadas, monedas: (viejo.datos as { monedas: number }).monedas }
        return viejo.status >= 500 ? { tipo: 'reintentar' } : { tipo: 'descartar', motivo: `HTTP ${viejo.status}` }
      } catch {
        return { tipo: 'reintentar' }
      }
    }
    // Sesión vencida o servidor con problemas: se guarda y se reintenta (con la sesión nueva).
    if (r.status === 401 || r.status === 408 || r.status >= 500) return { tipo: 'reintentar' }
    return { tipo: 'descartar', motivo: datos.error ?? `HTTP ${r.status}` }
  }

  const almacen = (() => {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage
    } catch {
      return null
    }
  })()
  const premios = crearColaPremios({ enviar: enviarPremio, almacen })
  // Lo que quedó sin enviar sale al volver la conexión o al volver a la app.
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('online', () => void premios.reintentar())
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void premios.reintentar()
    })
  }

  return {
    enLinea: true,

    auth: {
      async sesionActual() {
        if (!token) return null
        const { sesion } = await pedir<{ sesion: Sesion | null }>('GET', '/api/sesion')
        if (!sesion) {
          token = null
          guardarToken(null)
        }
        return sesion
      },
      async registrarse(datos) {
        const s = await iniciar('/api/registro', datos)
        return (s as Extract<Sesion, { tipo: 'adulto' }>).cuenta as Cuenta
      },
      async iniciarSesionAdulto(correo, clave) {
        await iniciar('/api/entrar', { correo, clave })
      },
      async iniciarSesionNino(usuario, clave) {
        await iniciar('/api/entrar-nino', { usuario, clave })
      },
      async cerrarSesion() {
        // Lo ganado y todavía sin enviar sale antes de cerrar la sesión (con conexión).
        await premios.reintentar()
        await pedir('POST', '/api/salir').catch(() => {})
        token = null
        guardarToken(null)
        avisar(null)
      },
      async enviarRecuperacion(correo) {
        await pedir('POST', '/api/recuperar', { correo })
      },
      async cambiarMiClave(clave) {
        if (recuperacionPendiente) {
          // Viene del enlace del correo: crea la clave nueva y deja la sesión iniciada.
          await iniciar('/api/recuperar/confirmar', { token: recuperacionPendiente, clave })
          recuperacionPendiente = null
          return
        }
        await pedir('POST', '/api/mi-clave', { clave })
      },
      alPedirNuevaClave(fn) {
        if (recuperacionPendiente) setTimeout(fn, 0)
        return () => {}
      },
      alCambiar(fn) {
        oyentes.add(fn)
        return () => void oyentes.delete(fn)
      },
    },

    perfiles: {
      async listar() {
        return (await pedir<PerfilNino[]>('GET', '/api/perfiles')).map(aPerfil)
      },
      async obtener(id) {
        const p = await nulo(pedir<PerfilNino>('GET', `/api/perfiles/${id}`))
        return p ? aPerfil(p) : null
      },
      async crear(datos) {
        return aPerfil(await pedir<PerfilNino>('POST', '/api/perfiles', datos))
      },
      async cambiarClave(perfilId, clave) {
        await pedir('POST', `/api/perfiles/${perfilId}/clave`, { clave })
      },
      async actualizarAjustes(id, ajustes) {
        return aPerfil(await pedir<PerfilNino>('PUT', `/api/perfiles/${id}/ajustes`, { ajustes }))
      },
      async sumarMonedas(id, cantidad, motivo) {
        return (await pedir<{ monedas: number }>('POST', `/api/perfiles/${id}/monedas`, { cantidad, motivo })).monedas
      },
      async actualizarCiempi(id, apariencia) {
        return aPerfil(await pedir<PerfilNino>('PUT', `/api/perfiles/${id}/ciempi`, { apariencia }))
      },
      async comprar(id, itemId, precioVisto) {
        // Primero lo ganado que quedó sin enviar: así alcanza para lo que el niño ve en su contador.
        await premios.reintentar()
        const r = await pedir<{ monedas: number; inventario: string[] }>('POST', `/api/perfiles/${id}/comprar`, { itemId, precioVisto })
        // Como en el resto de la app, el saldo que se muestra incluye lo que sigue en la cola.
        return { ...r, monedas: r.monedas + premios.pendientes(id) }
      },
      async crearInvitacion(perfilId) {
        return pedir<InvitacionNino>('POST', `/api/perfiles/${perfilId}/invitaciones`)
      },
      async canjearInvitacion(codigo) {
        return aPerfil(await pedir<PerfilNino>('POST', '/api/invitaciones/canjear', { codigo }))
      },
    },

    textos: {
      listar: () => pedir<Texto[]>('GET', '/api/textos'),
      obtener: (id) => nulo(pedir<Texto | null>('GET', `/api/textos/${id}`)),
      guardar: (texto) => pedir<Texto>('PUT', `/api/textos/${texto.id}`, texto),
      async eliminar(id) {
        await pedir('DELETE', `/api/textos/${id}`)
      },
    },

    asignaciones: {
      // Un servidor anterior a los niveles no manda `nivel`: es el 1.
      listarPorPerfil: (perfilId) =>
        pedir<Asignacion[]>('GET', `/api/perfiles/${perfilId}/asignaciones`).then((l) => l.map((a) => ({ ...a, nivel: a.nivel ?? 1 }))),
      asignar: (perfilId, textoId, nivel = 1) => pedir<Asignacion>('POST', `/api/perfiles/${perfilId}/asignaciones`, { textoId, nivel }),
      cambiarNivel: (id, nivel) => pedir<Asignacion>('PUT', `/api/asignaciones/${id}/nivel`, { nivel }),
      // `premiosPorRegistro`: esta app pide sus premios aparte (el servidor no los deduce del progreso).
      guardarProgreso: (id, progreso) => pedir<Asignacion>('PUT', `/api/asignaciones/${id}/progreso`, { ...progreso, premiosPorRegistro: true }),
      async quitar(id) {
        await pedir('DELETE', `/api/asignaciones/${id}`)
      },
    },

    autorizaciones: {
      pendientes: () => pedir<PendienteDeAutorizar[]>('GET', '/api/autorizaciones'),
      autorizar: (asignacionId, pin, nivel) => pedir<Asignacion>('POST', `/api/asignaciones/${asignacionId}/autorizar`, { pin, ...(nivel === undefined ? {} : { nivel }) }),
      rechazar: (asignacionId, pin) => pedir<Asignacion>('POST', `/api/asignaciones/${asignacionId}/rechazar`, { pin }),
      miPin: () => pedir<{ tienePin: boolean }>('GET', '/api/mi-pin'),
      async definirPin(pin, clave) {
        await pedir('PUT', '/api/mi-pin', { pin, clave })
      },
    },

    sesiones: {
      guardar: (sesion) => pedir<SesionLectura>('PUT', `/api/sesiones-lectura/${sesion.id}`, sesion),
      listarPorPerfil: (perfilId) => pedir<SesionLectura[]>('GET', `/api/perfiles/${perfilId}/sesiones-lectura`),
    },

    premios,
  }
}
