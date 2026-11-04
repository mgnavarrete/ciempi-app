/**
 * Lógica pura de la actualización automática de la APK (sin Capacitor, para probarla):
 * comparar versiones, leer el manifiesto del servidor (ota/ultima.json) y decidir qué hacer.
 * El manifiesto lo escribe scripts/empaquetar-ota.mjs.
 */

/** Lo que identifica una web publicada: versión de package.json + sello de compilación. */
export interface IdentidadWeb {
  version: string
  /** AAAAMMDDhhmmss (UTC). */
  compilacion: string
}

export interface Manifiesto extends IdentidadWeb {
  /** Nombre del paquete para el plugin: `<version>-<compilacion>`. */
  paquete: string
  /** URL del zip (absoluta, ya resuelta contra la URL del manifiesto). */
  url: string
  /** SHA-256 del zip, en hexadecimal. */
  sha256: string
  /** La APK instalada debe ser al menos esta versión para usar este paquete. */
  nativaMinima: string
  /** La APK más nueva publicada para descargar a mano (canal directo), si hay. */
  apk: { version: string; url: string } | null
}

export type Canal = 'directo' | 'tienda'

/** "2.7.0" → [2, 7, 0]. Lo que no es número cuenta como 0; se ignora un sufijo "-algo". */
function partes(version: string): number[] {
  return version
    .split('-')[0]
    .split('.')
    .map((p) => {
      const n = Number.parseInt(p, 10)
      return Number.isFinite(n) ? n : 0
    })
}

/** Negativo si a < b, 0 si son iguales, positivo si a > b (mayor.menor.parche). */
export function compararVersiones(a: string, b: string): number {
  const pa = partes(a)
  const pb = partes(b)
  for (let i = 0; i < Math.max(pa.length, pb.length, 3); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

/** Primero la versión; con la misma versión, el sello de compilación más reciente. */
export function compararIdentidades(a: IdentidadWeb, b: IdentidadWeb): number {
  return compararVersiones(a.version, b.version) || compararSellos(a.compilacion, b.compilacion)
}

function compararSellos(a: string, b: string): number {
  const na = Number(a) || 0
  const nb = Number(b) || 0
  return na - nb
}

export function nombreDePaquete(id: IdentidadWeb): string {
  return `${id.version}-${id.compilacion}`
}

/** "2.7.0-20261104153000" → identidad; null si no tiene esa forma (p. ej. "builtin"). */
export function identidadDePaquete(nombre: string): IdentidadWeb | null {
  const m = /^(\d+\.\d+\.\d+)-(\d{14})$/.exec(nombre)
  return m ? { version: m[1], compilacion: m[2] } : null
}

const esTexto = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

/**
 * Valida el JSON del servidor y resuelve sus URL (relativas al propio manifiesto).
 * Cualquier cosa rara (una página HTML de error, un campo que falta) → null: no se hace nada.
 */
export function leerManifiesto(json: unknown, urlManifiesto: string): Manifiesto | null {
  if (!json || typeof json !== 'object') return null
  const m = json as Record<string, unknown>
  if (!esTexto(m.version) || !esTexto(m.compilacion) || !esTexto(m.url) || !esTexto(m.nativaMinima)) return null
  if (!/^\d+\.\d+\.\d+$/.test(m.version) || !/^\d{14}$/.test(m.compilacion)) return null
  const sha256 = esTexto(m.sha256) ? m.sha256.toLowerCase() : ''
  if (!/^[0-9a-f]{64}$/.test(sha256)) return null
  try {
    const url = new URL(m.url, urlManifiesto).href
    let apk: Manifiesto['apk'] = null
    const a = m.apk as Record<string, unknown> | null | undefined
    if (a && typeof a === 'object' && esTexto(a.version) && esTexto(a.url)) {
      apk = { version: a.version, url: new URL(a.url, urlManifiesto).href }
    }
    const identidad = { version: m.version, compilacion: m.compilacion }
    return { ...identidad, paquete: nombreDePaquete(identidad), url, sha256, nativaMinima: m.nativaMinima, apk }
  } catch {
    return null
  }
}

/** Un paquete que el plugin ya tiene en el dispositivo. */
export interface PaqueteLocal {
  id: string
  /** El nombre con que se descargó (`<version>-<compilacion>`). */
  version: string
  status: string
}

export type Decision =
  | { tipo: 'nada'; motivo: string }
  | { tipo: 'descargar'; manifiesto: Manifiesto }
  | { tipo: 'avisarApk'; version: string; url: string }

/**
 * Qué hacer con el manifiesto recién leído.
 * - La APK instalada es más vieja que la mínima del paquete: no se descarga nada (el paquete
 *   podría pedir algo nativo que esta APK no tiene). En el canal directo se avisa que hay APK nueva.
 * - El paquete es más nuevo que la web que corre, no falló antes y no está ya descargado: descargar.
 */
export function decidir(opciones: {
  manifiesto: Manifiesto
  nativa: string
  web: IdentidadWeb
  canal: Canal
  locales: PaqueteLocal[]
}): Decision {
  const { manifiesto, nativa, web, canal, locales } = opciones
  if (compararVersiones(nativa, manifiesto.nativaMinima) < 0) {
    const apk = manifiesto.apk
    if (canal === 'directo' && apk && compararVersiones(apk.version, nativa) > 0) {
      return { tipo: 'avisarApk', version: apk.version, url: apk.url }
    }
    return { tipo: 'nada', motivo: 'la APK instalada es muy antigua para este paquete' }
  }
  if (compararIdentidades(manifiesto, web) <= 0) return { tipo: 'nada', motivo: 'al día' }
  const local = locales.find((p) => p.version === manifiesto.paquete)
  if (local?.status === 'error') return { tipo: 'nada', motivo: 'este paquete ya falló en este dispositivo' }
  if (local && (local.status === 'pending' || local.status === 'success' || local.status === 'downloading')) {
    return { tipo: 'nada', motivo: 'ya descargado: se usa al abrir la app' }
  }
  return { tipo: 'descargar', manifiesto }
}

/**
 * Al abrir la app: el paquete descargado más nuevo que la web que corre (y que no falló), para
 * cambiarse a él antes de mostrar nada. null si no hay.
 */
export function elegirPendiente(locales: PaqueteLocal[], web: IdentidadWeb): PaqueteLocal | null {
  let mejor: { paquete: PaqueteLocal; id: IdentidadWeb } | null = null
  for (const p of locales) {
    if (p.status !== 'pending' && p.status !== 'success') continue
    const id = identidadDePaquete(p.version)
    if (!id || compararIdentidades(id, web) <= 0) continue
    if (!mejor || compararIdentidades(id, mejor.id) > 0) mejor = { paquete: p, id }
  }
  return mejor?.paquete ?? null
}

/** Dónde está el manifiesto: junto a la API (VITE_API_URL absoluta, como en la APK). */
export function urlDelManifiesto(apiUrl: string | undefined): string | null {
  const base = apiUrl?.trim()
  if (!base || !/^https?:\/\//.test(base)) return null
  return new URL('/ota/ultima.json', base).href
}

export function canalDeCompilacion(valor: unknown): Canal {
  return valor === 'directo' ? 'directo' : 'tienda'
}

/** Pide el manifiesto y lo valida. `pedir` devuelve el JSON ya leído (o lanza si falla). */
export async function obtenerManifiesto(
  urlManifiesto: string,
  pedir: (url: string) => Promise<unknown>,
): Promise<Manifiesto | null> {
  // El sello en la URL esquiva cualquier caché intermedia aunque nginx no mande no-cache.
  const url = `${urlManifiesto}${urlManifiesto.includes('?') ? '&' : '?'}t=${Date.now()}`
  try {
    return leerManifiesto(await pedir(url), urlManifiesto)
  } catch {
    return null // Sin internet o servidor caído: se sigue con lo que hay.
  }
}
