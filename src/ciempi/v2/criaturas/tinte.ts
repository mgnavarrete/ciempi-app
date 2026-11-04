/**
 * Tinte de las piezas raster por bandas de tono (portado del laboratorio:
 * `tenir` de especies.js/criaturas-v4.js y `tenirVariante` de variantes.js).
 *
 * Los dos tintes del laboratorio son el mismo método con distintos datos: cada
 * píxel de una banda toma el tono del destino de su clave, conservando la luz y
 * la sombra del original (contorno azul oscuro, blancos y grises intactos). Aquí
 * hay UN núcleo (`tenirPixeles`); `tenirVariante` lo usa con los colores de la
 * variante. El tinte por paleta del laboratorio no hace falta en el juego: con
 * una criatura puesta, la variante manda sobre la paleta.
 *
 * Resultado: blob: URL (PNG), con caché por pieza y variante.
 */
import { BANDAS, type Banda, type Colores, type Destino, type EspecieCriatura } from './datos'

type Hsl = [number, number, number]

export const rgbAHsl = (r: number, g: number, b: number): Hsl => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2
  if (mx === mn) return [0, 0, l]
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}
export const hslARgb = (h: number, s: number, l: number): [number, number, number] => {
  h = ((h % 360) + 360) % 360 / 360
  if (!s) return [l, l, l]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q
  const f = (t: number) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p }
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)]
}
const hex = (c: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255) as [number, number, number]
export const aHex = (rgb: readonly number[]) => '#' + rgb.map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0')).join('')
export const hslDe = (c: string) => rgbAHsl(...hex(c))

/** Destino de una banda: tono de luz y, opcional, tono de sombra. */
export interface DestinoHsl { luz: Hsl; sombra: Hsl | null }

/**
 * Núcleo del tinte, sobre los píxeles RGBA (se modifican en el sitio).
 * `bandas[k]` toma `destinos[k]` (null = banda sin tinte, ni entra en la media).
 * Umbrales: se ignoran l < 0.3, s < `sMin` y l > `lMax`.
 */
export function tenirPixeles(px: Uint8ClampedArray, bandas: readonly Banda[], destinos: readonly (DestinoHsl | null)[], sMin: number, lMax: number) {
  const n = px.length / 4
  const hsl = new Float32Array(n * 3), banda = new Int8Array(n).fill(-1)
  const suma = bandas.map(() => [0, 0, 0, 0, 0])
  for (let i = 0, j = 0; j < n; i += 4, j++) {
    if (px[i + 3] < 8) continue
    const [h, s, l] = rgbAHsl(px[i] / 255, px[i + 1] / 255, px[i + 2] / 255)
    hsl[j * 3] = h; hsl[j * 3 + 1] = s; hsl[j * 3 + 2] = l
    if (l < 0.3 || s < sMin || l > lMax) continue
    const b = bandas.findIndex(([a, z, , l0 = 0, l1 = 1]) => h >= a && h < z && l >= l0 && l <= l1)
    if (b < 0 || !destinos[b]) continue
    banda[j] = b
    const ang = (h * Math.PI) / 180
    suma[b][0] += Math.cos(ang); suma[b][1] += Math.sin(ang); suma[b][2] += s; suma[b][3] += l; suma[b][4]++
  }
  const ref = suma.map(([x, y, s, l, m]) => (m ? [Math.atan2(y, x) * 180 / Math.PI, s / m, l / m] : null))
  for (let j = 0, i = 0; j < n; j++, i += 4) {
    const b = banda[j]
    if (b < 0 || !ref[b]) continue
    const [h, s, l] = [hsl[j * 3], hsl[j * 3 + 1], hsl[j * 3 + 2]]
    const [rh, rs, rl] = ref[b]!, { luz, sombra } = destinos[b]!
    let dh = h - rh; if (dh > 180) dh -= 360; if (dh < -180) dh += 360
    const [ph, ps, pl] = luz
    const L = Math.max(0.05, Math.min(0.97, pl + (l - rl)))
    let [r, g, bl] = hslARgb(ph + dh * 0.5, Math.min(1, ps * (s / rs)), L)
    if (sombra) {
      // Sombra de otro tono: mezcla en RGB (no por el círculo de tonos, que pasaría por el rosado).
      const t = Math.max(0, Math.min(1, (rl - l) / 0.16))
      const [r2, g2, b2] = hslARgb(sombra[0] + dh * 0.5, Math.min(1, sombra[1] * (s / rs)), Math.max(0.05, Math.min(0.97, L + (sombra[2] - pl) * 0.6)))
      r += (r2 - r) * t; g += (g2 - g) * t; bl += (b2 - bl) * t
    }
    px[i] = r * 255; px[i + 1] = g * 255; px[i + 2] = bl * 255
  }
}

export const cargarImagen = (url: string) => new Promise<HTMLImageElement>((ok, mal) => {
  const im = new Image()
  im.onload = () => ok(im)
  im.onerror = () => mal(Error('No se pudo cargar ' + url))
  im.src = url
})

/** Lo mínimo de una variante para teñir: id y colores (generales y por pieza). */
export interface Tintable { id: string; colores?: Colores; piezas?: Readonly<Record<string, Colores>> }

/** Destinos por clave para una pieza: colores de la variante con los de la pieza encima. */
function destinosDe(v: Tintable, piezaId: string, claves: readonly string[] | null) {
  const d: Record<string, Destino> = { ...(v.colores || {}), ...(v.piezas?.[piezaId] || {}) }
  if (claves) for (const k of Object.keys(d)) if (!claves.includes(k)) delete d[k]
  return d
}

const tintes = new Map<string, Promise<string>>()
/** Cuántas piezas se tiñeron de verdad (para medir). */
export const estadisticasTinte = { piezas: 0, ms: 0 }

/**
 * Tiñe una pieza raster con la variante (blob: URL), o devuelve `url` tal cual si
 * la variante no tiene colores para esa pieza. Con destino [luz, sombra], las
 * zonas más oscuras que la media giran hacia el tono de sombra (material).
 */
export async function tenirVariante(url: string, bandasId: EspecieCriatura | 'torreta', v: Tintable, piezaId: string, claves: readonly string[] | null = null): Promise<string> {
  const destinos = destinosDe(v, piezaId, claves)
  if (!Object.keys(destinos).length) return url
  const k = `${url}|${v.id}|${piezaId}|${claves || ''}`
  if (!tintes.has(k)) {
    const p = (async () => {
      const t0 = performance.now()
      const bandas = BANDAS[bandasId]
      const dest = bandas.map(([, , clave]) => {
        const c = destinos[clave]
        if (!c) return null
        const [luz, sombra] = Array.isArray(c) ? c : [c as string, null]
        return { luz: hslDe(luz), sombra: sombra ? hslDe(sombra) : null }
      })
      const im = await cargarImagen(url)
      const c = document.createElement('canvas')
      c.width = im.naturalWidth; c.height = im.naturalHeight
      const ctx = c.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(im, 0, 0)
      const datos = ctx.getImageData(0, 0, c.width, c.height)
      tenirPixeles(datos.data, bandas, dest, 0.2, 0.96)
      ctx.putImageData(datos, 0, 0)
      const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/png'))
      if (!blob) throw Error('No se pudo teñir ' + url)
      estadisticasTinte.piezas++; estadisticasTinte.ms += performance.now() - t0
      return URL.createObjectURL(blob)
    })()
    // Un fallo no queda en caché: se puede reintentar.
    p.catch(() => tintes.delete(k))
    tintes.set(k, p)
  }
  return tintes.get(k)!
}
