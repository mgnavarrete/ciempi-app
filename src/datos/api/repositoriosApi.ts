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
import type { Repositorios } from '../repositorios'

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

  async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
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
    const datos = r.status === 204 ? null : await r.json().catch(() => null)
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
      async sumarMonedas(id, cantidad) {
        return (await pedir<{ monedas: number }>('POST', `/api/perfiles/${id}/monedas`, { cantidad })).monedas
      },
      async actualizarCiempi(id, apariencia) {
        return aPerfil(await pedir<PerfilNino>('PUT', `/api/perfiles/${id}/ciempi`, { apariencia }))
      },
      async comprar(id, itemId, precioVisto) {
        return pedir<{ monedas: number; inventario: string[] }>('POST', `/api/perfiles/${id}/comprar`, { itemId, precioVisto })
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
      guardarProgreso: (id, progreso) => pedir<Asignacion>('PUT', `/api/asignaciones/${id}/progreso`, progreso),
      async quitar(id) {
        await pedir('DELETE', `/api/asignaciones/${id}`)
      },
    },

    sesiones: {
      guardar: (sesion) => pedir<SesionLectura>('PUT', `/api/sesiones-lectura/${sesion.id}`, sesion),
      listarPorPerfil: (perfilId) => pedir<SesionLectura[]>('GET', `/api/perfiles/${perfilId}/sesiones-lectura`),
    },
  }
}
