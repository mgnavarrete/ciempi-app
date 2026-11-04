import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import {
  canalDeCompilacion,
  decidir,
  elegirPendiente,
  obtenerManifiesto,
  urlDelManifiesto,
  type Decision,
  type IdentidadWeb,
} from './versiones'

/**
 * Actualización automática de la parte web de la APK, desde el servidor propio
 * (ota/ultima.json, lo publica deploy/actualizar.sh). Ver docs/despliegue.md, «Actualizaciones
 * automáticas de la APK». En la web normal no hace nada.
 *
 * 1. Al abrir: si hay un paquete ya descargado más nuevo, la app se cambia a él antes de mostrar nada.
 * 2. Ya mostrada: avisa al plugin que esta versión arrancó bien (si no, vuelve a la anterior).
 * 3. Lee el manifiesto; si hay algo más nuevo lo descarga en segundo plano para la próxima vez.
 *    Nunca se recarga con la app abierta: así no se corta una lectura.
 */

export const WEB_ACTUAL: IdentidadWeb = { version: __VERSION_APP__, compilacion: __COMPILACION_APP__ }

const activa = Capacitor.isNativePlatform()
const URL_MANIFIESTO = urlDelManifiesto(import.meta.env.VITE_API_URL as string | undefined)
const CANAL = canalDeCompilacion(import.meta.env.VITE_CANAL)

function conTiempo<T>(promesa: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolver, rechazar) => {
    const reloj = setTimeout(() => rechazar(new Error('tiempo agotado')), ms)
    promesa.then(
      (v) => {
        clearTimeout(reloj)
        resolver(v)
      },
      (e: unknown) => {
        clearTimeout(reloj)
        rechazar(e instanceof Error ? e : new Error(String(e)))
      },
    )
  })
}

/** Paso 1, antes de dibujar la app. Si se cambia de paquete, la página se recarga sola. */
export async function abrirPaquetePendiente(): Promise<void> {
  if (!activa) return
  try {
    const [{ bundles }, actual] = await conTiempo(Promise.all([CapacitorUpdater.list(), CapacitorUpdater.current()]), 2000)
    const pendiente = elegirPendiente(bundles, WEB_ACTUAL)
    // Si ya corre ese paquete y aun así dice ser más viejo, no se insiste (evita recargar sin fin).
    if (!pendiente || pendiente.id === actual.bundle.id) return
    await CapacitorUpdater.set({ id: pendiente.id })
  } catch {
    // Si algo falla se sigue con la versión que hay.
  }
}

/** El JSON por la vía nativa: no pasa por el CORS del WebView. */
async function pedirNativo(url: string): Promise<unknown> {
  const r = await CapacitorHttp.get({ url, headers: { 'Cache-Control': 'no-cache' }, connectTimeout: 10000, readTimeout: 10000 })
  if (r.status !== 200) throw new Error(`HTTP ${r.status}`)
  return typeof r.data === 'string' ? (JSON.parse(r.data) as unknown) : r.data
}

let comprobando: Promise<Decision> | null = null

/** Pasos 2 y 3. Devuelve lo que se decidió (para mostrar el aviso de APK nueva). */
export function comprobarActualizacion(): Promise<Decision> {
  if (!activa) return Promise.resolve({ tipo: 'nada', motivo: 'web' })
  comprobando ??= (async (): Promise<Decision> => {
    try {
      await CapacitorUpdater.notifyAppReady()
    } catch {
      // Sin plugin (APK antigua): no hay nada que confirmar.
    }
    if (!URL_MANIFIESTO) return { tipo: 'nada', motivo: 'sin servidor' }
    try {
      const manifiesto = await obtenerManifiesto(URL_MANIFIESTO, pedirNativo)
      if (!manifiesto) return { tipo: 'nada', motivo: 'sin manifiesto' }
      const [{ native }, { bundles }] = await Promise.all([CapacitorUpdater.current(), CapacitorUpdater.list()])
      const decision = decidir({ manifiesto, nativa: native, web: WEB_ACTUAL, canal: CANAL, locales: bundles })
      if (decision.tipo === 'descargar') {
        // Solo se descarga: se aplica al abrir la app la próxima vez (abrirPaquetePendiente).
        await CapacitorUpdater.download({ url: manifiesto.url, version: manifiesto.paquete, checksum: manifiesto.sha256 })
      }
      return decision
    } catch {
      return { tipo: 'nada', motivo: 'falló la comprobación' }
    } finally {
      comprobando = null
    }
  })()
  return comprobando
}

/** Abre la descarga de la APK nueva en el navegador del sistema (Capacitor manda ahí las URL externas). */
export function abrirDescargaApk(url: string): void {
  window.location.href = url
}
