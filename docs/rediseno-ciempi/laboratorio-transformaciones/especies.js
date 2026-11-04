// Compositor de especies del laboratorio de transformaciones (T01 Dragón, T02 Cuncuna).
// LABORATORIO: no está conectado al juego, la tienda ni el servidor.
//
// Cómo arma una especie, sin redibujar ni estirar nada:
//  1. Parte de la base aprobada (env.base) y conserva la cabeza: círculo
//     (736,340) r130, ojos, boca, rubor, mejillas y todos los ids que usan el
//     compositor (`componer.js`) y el rig (`rig.js`).
//  2. Sustituye el contenido de `body` por seis segmentos raster (piezas IA de
//     `recursos/<especie>/`): cola (rol 0), A/B/C (1–3), frente (4) y D (5). Cada
//     segmento conserva el id del maestro de Ciempi (`tail`, `mint-back`…), su
//     `clip-<id>` y un `<g clip-path>`, para que las superficies B11 y las
//     texturas se pongan sobre el núcleo como en Ciempi.
//  3. Sustituye las seis patas por pierna + pie raster en las mismas
//     posiciones y giros (`rotate(g -10 -32)`): el calzado B10 reemplaza el pie.
//  4. Suma los rasgos de cabeza (cuernos/orejas detrás, penacho delante) en un
//     grupo propio y, en el Dragón, un hocico vectorial dentro de la cabeza.
//  5. Compone con `renderCiempi` (sin modificarlo) lo que `resolver()` deja
//     visible, y la escena con `escena(svg, n, prefijo, forma)` de pose.ts: el
//     cuerpo crece repitiendo A→B→C→D entre cola y frente únicos.
// Ciempi (especie 'ciempi') pasa por `renderCiempi` y `escena` SIN `forma`:
// exactamente la ruta del juego.
import { renderCiempi } from '../../../src/ciempi/v2/arte/componer.js'
import { paletas } from '../../../src/ciempi/v2/arte/lib/armario-ciempi.mjs'
import { escena } from './gen/pose.js'
import { especie as buscarEspecie, ESPECIES } from './gen/especie.js'
import { resolver, NINGUNO } from './gen/compatibilidad.js'
import { prepararRostroV4, aplicarRostroV4 } from './rostros-v4.js'

const NS = 'http://www.w3.org/2000/svg'
const RECURSOS = new URL('./recursos/', import.meta.url)
const MAESTRO_IDS = ['tail', 'mint-back', 'yellow-middle', 'orange-middle', 'mint-front', 'segmento-d']
const PIEZA_DE_ROL = { 0: 'cola', 1: 'seg-a', 2: 'seg-b', 3: 'seg-c', 4: 'frente', 5: 'seg-d' }
/** Pies de la pose aprobada (x, y, giro). El 5 es el de la cabeza. Las especies acercan el 4 a su segmento. */
const PIES_CIEMPI = [[172, 524, -12], [276, 541, -6], [375, 550, 0], [500, 544, 7], [625, 537, -5], [780, 527, -12]]

/**
 * Bandas de color de cada especie para el tinte por paleta: [hueMin, hueMax, rol],
 * con rol 0 = naranja, 1 = menta, 2 = amarillo de la paleta (colores 1, 4 y 7).
 * Los contornos azul oscuro, los blancos y los grises no se tocan.
 */
const BANDAS = {
  dragon: [[0, 40, 0], [40, 85, 2], [95, 205, 1]],
  cuncuna: [[330, 360, 0], [0, 40, 0], [40, 85, 2], [95, 205, 1], [220, 330, 0]],
}

/** Rasgos propios: grupo e id con que se pueden ocultar (ver `rasgosOcultosCon` en especie.ts). */
const RASGO_CABEZA = { dragon: 'cuernos', cuncuna: 'penacho' }

// ── Utilidades ───────────────────────────────────────────────────────────────
const parse = (s) => {
  const d = new DOMParser().parseFromString(s, 'image/svg+xml')
  if (d.querySelector('parsererror')) throw Error('SVG inválido en el compositor de especies')
  return d
}
const crear = (doc, tag, attrs = {}) => {
  const n = doc.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  return n
}
const imagen = (doc, href, [x, y, w, h], extra = {}) =>
  crear(doc, 'image', { x, y, width: w, height: h, href, preserveAspectRatio: 'none', ...extra })

/** Las rutas de public/ del catálogo apuntan a /ciempi-v2/ (Vite); servido desde la raíz es /public/ciempi-v2/. */
export function corregirRutas(env, prefijo = '/public') {
  const visitar = (v) => {
    if (typeof v === 'string') return v.startsWith('/ciempi-v2/') ? prefijo + v : v
    if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = visitar(v[i]); return v }
    if (v && typeof v === 'object') { for (const k of Object.keys(v)) v[k] = visitar(v[k]); return v }
    return v
  }
  for (const k of ['hats', 'masks', 'capes', 'bags', 'footwear', 'surfaces', 'characters']) visitar(env[k])
  return env
}

// ── Manifiestos y tinte ──────────────────────────────────────────────────────
const manifiestos = new Map()
export async function cargarManifiesto(id) {
  if (!manifiestos.has(id)) {
    manifiestos.set(id, fetch(new URL(`${id}/manifiesto.json`, RECURSOS)).then((r) => {
      if (!r.ok) throw Error('Falta el manifiesto de ' + id)
      return r.json()
    }))
  }
  return manifiestos.get(id)
}
const pieza = (m, id) => {
  const p = m.piezas.find((x) => x.id === id)
  if (!p) throw Error(`Pieza ${id} ausente en ${m.especie}`)
  return p
}

const rgbAHsl = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2
  if (mx === mn) return [0, 0, l]
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}
const hslARgb = (h, s, l) => {
  h = ((h % 360) + 360) % 360 / 360
  if (!s) return [l, l, l]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q
  const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p }
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)]
}
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
const enBanda = (h, [a, b]) => h >= a && h < b
const cargarImagen = (url) => new Promise((ok, mal) => {
  const im = new Image()
  im.onload = () => ok(im)
  im.onerror = () => mal(Error('No se pudo cargar ' + url))
  im.src = url
})

/**
 * Tiñe una pieza con una paleta: cada banda de color de la especie toma el tono
 * del color de la paleta que le corresponde, conservando las variaciones de luz
 * del original. Devuelve un blob: URL (o la URL original con la paleta clásica).
 */
const tintes = new Map()
async function tenir(url, especieId, paletaId) {
  if (paletaId === 'clasica') return url
  const clave = `${url}|${paletaId}`
  if (!tintes.has(clave)) tintes.set(clave, (async () => {
    const paleta = paletas.find((p) => p.id === paletaId)
    if (!paleta) return url
    const destino = [1, 4, 7].map((i) => rgbAHsl(...hex(paleta.colors[i])))
    const im = await cargarImagen(url)
    const c = document.createElement('canvas')
    c.width = im.naturalWidth; c.height = im.naturalHeight
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(im, 0, 0)
    const datos = ctx.getImageData(0, 0, c.width, c.height), px = datos.data
    const bandas = BANDAS[especieId]
    // Referencia de cada banda: tono, saturación y luz medios de la propia pieza.
    const suma = bandas.map(() => [0, 0, 0, 0, 0])
    const hsl = new Float32Array((px.length / 4) * 3), banda = new Int8Array(px.length / 4).fill(-1)
    for (let i = 0, j = 0; i < px.length; i += 4, j++) {
      if (px[i + 3] < 8) continue
      const [h, s, l] = rgbAHsl(px[i] / 255, px[i + 1] / 255, px[i + 2] / 255)
      hsl[j * 3] = h; hsl[j * 3 + 1] = s; hsl[j * 3 + 2] = l
      // Contorno azul oscuro, blancos de brillo y grises: intactos.
      if (l < 0.3 || s < 0.18 || l > 0.95) continue
      const k = bandas.findIndex((b) => enBanda(h, b))
      if (k < 0) continue
      banda[j] = k
      const ang = (h * Math.PI) / 180
      suma[k][0] += Math.cos(ang); suma[k][1] += Math.sin(ang); suma[k][2] += s; suma[k][3] += l; suma[k][4]++
    }
    const ref = suma.map(([x, y, s, l, n]) => (n ? [Math.atan2(y, x) * 180 / Math.PI, s / n, l / n] : null))
    for (let j = 0, i = 0; j < banda.length; j++, i += 4) {
      const k = banda[j]
      if (k < 0 || !ref[k]) continue
      const [h, s, l] = [hsl[j * 3], hsl[j * 3 + 1], hsl[j * 3 + 2]]
      const [rh, rs, rl] = ref[k], [ph, ps, pl] = destino[bandas[k][2]]
      let dh = h - rh; if (dh > 180) dh -= 360; if (dh < -180) dh += 360
      const [r, g, b] = hslARgb(ph + dh * 0.5, Math.min(1, ps * (s / rs)), Math.max(0.05, Math.min(0.97, pl + (l - rl))))
      px[i] = r * 255; px[i + 1] = g * 255; px[i + 2] = b * 255
    }
    ctx.putImageData(datos, 0, 0)
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'))
    return URL.createObjectURL(blob)
  })())
  return tintes.get(clave)
}

// ── Base de una especie ──────────────────────────────────────────────────────
const bases = new Map()
/** Radio del núcleo (bola) de una pieza de segmento: su borde inferior menos medio contorno. */
const radioNucleo = (p) => p.encuadre[1] + p.encuadre[3] - 3

/** La base SVG de la especie (texto, con los mismos ids que la de Ciempi), teñida con la paleta. */
export async function baseEspecie(env, especieId, paletaId = 'clasica') {
  if (especieId === 'ciempi') return env.base
  const clave = especieId + '|' + paletaId
  if (bases.has(clave)) return bases.get(clave)
  const m = await cargarManifiesto(especieId)
  const url = async (p) => tenir(new URL(`${especieId}/${p.archivo}`, RECURSOS).href, especieId, paletaId)
  const forma = buscarEspecie(especieId).forma
  const doc = parse(env.base)

  // Cuerpo: seis segmentos con los ids del maestro.
  const body = doc.getElementById('body')
  body.replaceChildren()
  for (let rol = 0; rol < 6; rol++) {
    const p = pieza(m, PIEZA_DE_ROL[rol]), id = MAESTRO_IDS[rol], r = radioNucleo(p)
    const g = crear(doc, 'g', { id, transform: `translate(${forma.xMaestro[rol]} ${forma.y[rol]})`, 'data-especie': especieId, 'data-nucleo': r })
    const defs = crear(doc, 'defs'), clip = crear(doc, 'clipPath', { id: 'clip-' + id })
    clip.append(crear(doc, 'circle', { r: r - 3 }))
    defs.append(clip)
    // El <g clip-path> no puede quedar vacío: compose() inserta las texturas tras su etiqueta de apertura.
    const nucleo = crear(doc, 'g', { 'clip-path': `url(#clip-${id})` })
    nucleo.append(crear(doc, 'g', { 'data-nucleo-vacio': '' }))
    g.append(defs, imagen(doc, await url(p), p.encuadre, { 'data-pieza': p.id }), nucleo)
    body.append(g)
  }

  // Patas: pierna y pie propios en la pose aprobada; el pie gira en el tobillo como la zapatilla.
  const pies = doc.getElementById('legs-and-sneakers')
  pies.replaceChildren()
  const pierna = pieza(m, 'pierna'), pie = pieza(m, 'pie')
  const [urlPierna, urlPie] = [await url(pierna), await url(pie)]
  PIES_CIEMPI.forEach(([x, y, giro], i) => {
    // Sin estirar la pierna: cola y frente conservan su desfase (el del frente, acotado para que la
    // pierna nazca dentro de la bola) y los centrales van todos 8 unidades por detrás de su centro,
    // para que el paso quede regular con cualquier orden del ciclo. Los giros son los de Ciempi.
    const px = i === 0 || i === 5 ? x : i === 4 ? Math.min(x, forma.xMaestro[4] + 42) : forma.xMaestro[i] - 8
    const g = crear(doc, 'g', { transform: `translate(${px} ${y})`, stroke: '#243e5b', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' })
    const giroG = crear(doc, 'g', { transform: `rotate(${giro} -10 -32)` })
    giroG.append(imagen(doc, urlPie, pie.encuadre, { 'data-pieza': 'pie' }))
    g.append(imagen(doc, urlPierna, pierna.encuadre, { 'data-pieza': 'pierna' }), giroG)
    pies.append(g)
  })

  // Antenas: el Dragón no tiene; la Cuncuna lleva puntas menta (siguen la paleta).
  const antenas = doc.getElementById('antennae')
  if (especieId === 'dragon') antenas?.remove()
  else for (const c of antenas?.querySelectorAll('circle') || []) c.setAttribute('fill', '#83cda4')

  // Rasgos de cabeza (raster IA), en un grupo propio que el rig mueve con la cabeza.
  const rasgos = pieza(m, 'cabeza-rasgos')
  const gr = crear(doc, 'g', { id: 'rasgos-cabeza', 'data-accessory': 'rasgos-' + especieId, 'data-rasgo': RASGO_CABEZA[especieId] })
  gr.append(imagen(doc, await url(rasgos), rasgos.encuadre, { 'data-pieza': 'cabeza-rasgos' }))
  const cabeza = doc.getElementById('head')
  if (rasgos.plano === 'detras') cabeza.parentNode.insertBefore(gr, cabeza)
  else cabeza.parentNode.insertBefore(gr, doc.getElementById('jockey'))

  // Hocico del Dragón: vector dentro de la cabeza, detrás de ojos y boca (no es IA).
  if (especieId === 'dragon') {
    const h = crear(doc, 'g', { 'data-rasgo': 'hocico', 'clip-path': 'url(#face)' })
    h.append(
      crear(doc, 'path', { d: 'M712 404 C708 371 740 358 768 361 C800 362 826 376 826 404 C826 438 796 452 766 451 C734 450 714 434 712 404Z', fill: '#ffe3a3', stroke: '#243e5b', 'stroke-width': 5, 'stroke-linejoin': 'round' }),
      crear(doc, 'path', { d: 'M724 392 Q742 372 772 372', fill: 'none', stroke: '#fff6d6', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.8 }),
      crear(doc, 'ellipse', { cx: 752, cy: 381, rx: 4.5, ry: 3.5, fill: '#243e5b' }),
      crear(doc, 'ellipse', { cx: 781, cy: 377, rx: 4.5, ry: 3.5, fill: '#243e5b' }),
    )
    cabeza.insertBefore(h, doc.getElementById('eyes'))
  }

  // Alas exclusivas: se guardan como plantilla y se añaden solo si están equipadas.
  const svg = new XMLSerializer().serializeToString(doc)
  const alas = m.piezas.find((x) => x.id === 'alas')
  const resultado = { svg, alas: alas ? { ...alas, url: await url(alas) } : null }
  bases.set(clave, resultado)
  return resultado
}

// ── Selección ⇄ apariencia (ids de la tienda) ───────────────────────────────
const PARTE_A_CLAVE = { paleta: 'paleta', ojos: 'ojos', gesto: 'expresion', cabeza: 'cabeza', pelo: 'pelo', detalle: 'detalle', cara: 'cara', cuello: 'cuello', espalda: 'espalda', pies: 'pies', textura: 'textura' }
export function aApariencia(sel) {
  const a = {}
  for (const [parte, clave] of Object.entries(PARTE_A_CLAVE)) if (sel[clave] !== undefined) a[parte] = `${parte}:${sel[clave]}`
  return a
}
const diseno = (id) => String(id).slice(String(id).indexOf(':') + 1)

/** Carga y tiñe (una vez) la base de la especie para esa paleta; luego `componerCriatura` es síncrono. */
export async function prepararCriatura(env, especieId, paletaId = 'clasica') {
  if (especieId !== 'ciempi') await Promise.all([baseEspecie(env, especieId, paletaId), prepararRostroV4(especieId)])
}

/**
 * Compone una criatura con la selección del laboratorio (síncrono; ver prepararCriatura). No modifica `sel`.
 * Devuelve el SVG compuesto (texto), la resolución de compatibilidad y la selección efectiva.
 */
export function componerCriatura(env, especieId, selConRostro) {
  // `rostro` (v1/v4, ver rostros-v4.js) no es parte de la selección del juego: no llega a renderCiempi.
  const { rostro: versionRostro, ...sel } = selConRostro
  const res = resolver(aApariencia(sel), especieId)
  const efectiva = { ...sel }
  for (const [parte, id] of Object.entries(res.visibles)) efectiva[PARTE_A_CLAVE[parte]] = diseno(id)
  const alasPuestas = efectiva.espalda === 'dragon-alas'
  if (especieId === 'ciempi') return { svg: renderCiempi(env, efectiva), resolucion: res, seleccion: efectiva }
  const base = bases.get(especieId + '|' + (efectiva.paleta || 'clasica'))
  if (!base || base instanceof Promise) throw Error('Base de especie sin preparar: usar prepararCriatura() antes')
  const svg = renderCiempi({ ...env, base: base.svg }, alasPuestas ? { ...efectiva, espalda: 'espalda-nada' } : efectiva)
  const doc = parse(svg)
  // Rasgos que una pieza puesta tapa (penacho bajo un gorro, cuernos bajo un casco cerrado…).
  for (const r of res.rasgosOcultos) for (const n of doc.querySelectorAll(`[data-rasgo="${r}"]`)) n.remove()
  // Superficies B11: también en el segmento D, y contorno del núcleo encima del material.
  const conTextura = efectiva.textura && efectiva.textura !== 'liso'
  if (conTextura) {
    const modelo = doc.querySelector('[data-surface][data-segment="mint-back"]')
    const d = doc.getElementById('segmento-d')
    if (modelo && d && !d.querySelector('[data-surface]')) {
      const copia = modelo.cloneNode(true)
      copia.setAttribute('data-segment', 'segmento-d')
      copia.setAttribute('clip-path', 'url(#clip-segmento-d)')
      d.insertBefore(copia, d.querySelector('g[clip-path]'))
    }
    for (const g of doc.getElementById('body').children) {
      const r = Number(g.getAttribute('data-nucleo'))
      if (r && g.querySelector('[data-surface]')) g.append(crear(doc, 'circle', { r: r - 3, fill: 'none', stroke: '#243e5b', 'stroke-width': 7, 'data-contorno-nucleo': '' }))
    }
  }
  // Alas: espalda exclusiva del Dragón, sobre el lomo del segmento delantero y
  // detrás de cuernos y cabeza, como en el concepto d2 (el rig las mueve como espalda).
  if (alasPuestas && base.alas) {
    const g = crear(doc, 'g', { id: 'dragon-alas-equipped', 'data-bag': 'dragon-alas', 'data-exclusivo': 'espalda:dragon-alas' })
    g.append(imagen(doc, base.alas.url, base.alas.encuadre))
    const body = doc.getElementById('body')
    body.parentNode.insertBefore(g, body.nextSibling)
  }
  if (versionRostro === 'v4' || versionRostro === 'v4b') aplicarRostroV4(doc, especieId, efectiva, versionRostro, !!env.masks?.some((x) => x.id === efectiva.cabeza && !x.ocultaRostro))
  doc.querySelector('desc').textContent += ` Especie: ${buscarEspecie(especieId).nombre} (laboratorio, pendiente de aprobación).`
  return { svg: new XMLSerializer().serializeToString(doc), resolucion: res, seleccion: efectiva }
}

/** Escena de pose.ts: Ciempi sin `forma` (ruta del juego); las especies con su forma modular. */
export function escenaCriatura(svg, n, prefijo, especieId) {
  return especieId === 'ciempi' ? escena(svg, n, prefijo) : escena(svg, n, prefijo, buscarEspecie(especieId).forma)
}

export { ESPECIES, NINGUNO }
