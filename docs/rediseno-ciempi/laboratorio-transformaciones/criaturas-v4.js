// Criaturas V4 del laboratorio de transformaciones: T03 Serpiente y T04 Camaleón.
// LABORATORIO: no está conectado al juego, la tienda ni el servidor.
//
// Se engancha a `especies.js` con tres funciones (baseCriaturaV4, clavePaleta y
// posprocesarV4) para no duplicar el compositor ni tocar Ciempi, Dragón o Cuncuna.
// Igual que allí:
//  - parte de la base aprobada (mismos ids que usan componer.js y rig.js) y
//    conserva el círculo de la cabeza (736,340) r130, ojos, cejas, boca y rubor
//    vectoriales B03; las expresiones, accesorios de cabeza y E08 siguen funcionando;
//  - sustituye `body` por seis segmentos raster IA (cola, A, B, C, frente, D) con
//    los ids del maestro, `clip-<id>` y núcleo para las superficies B11;
//  - compone con `renderCiempi` y `escena(…, forma)` sin modificarlos.
// Novedades de V4:
//  - Cabeza con piel IA propia (hocico/garganta) bajo el rostro vectorial: la
//    cabeza deja de ser el disco naranja de Ciempi.
//  - Serpiente: sin patas. Las seis patas del maestro existen pero están vacías,
//    para que `escena`, `escenaCreciente` y `rig.crecer` cuenten igual los apoyos.
//    El calzado se oculta por compatibilidad (`partesOcultas.pies`). Lengüita
//    bífida opcional (selección `lengua: 'no'` la quita) dentro de la boca de las
//    expresiones abiertas o sonrientes; nunca con E08 (boca sorprendida) ni con
//    máscaras que tapan la boca.
//  - Camaleón: ojos en torreta (párpados IA detrás de los ojos B03), casco que se
//    guarda bajo gorros, cola en espiral y patas prensiles. Gancho «camuflaje»:
//    con la paleta clásica, el cuerpo toma los colores del conjunto puesto.
import { paletas } from '../../../src/ciempi/v2/arte/lib/armario-ciempi.mjs'

const NS = 'http://www.w3.org/2000/svg'
const RECURSOS = new URL('./recursos/', import.meta.url)
const MAESTRO_IDS = ['tail', 'mint-back', 'yellow-middle', 'orange-middle', 'mint-front', 'segmento-d']
const PIEZA_DE_ROL = { 0: 'cola', 1: 'seg-a', 2: 'seg-b', 3: 'seg-c', 4: 'frente', 5: 'seg-d' }
const PIES_CIEMPI = [[172, 524, -12], [276, 541, -6], [375, 550, 0], [500, 544, 7], [625, 537, -5], [780, 527, -12]]
/** Ojos B03 (rig.js, OJOS_BASE): las torretas se centran en ellos. */
const OJOS = [[708, 342], [808, 320]]

/**
 * Lengüita por expresión B03: punto (x, y) donde asoma, bajo el labio, y escala.
 * Solo expresiones con la boca abierta o sonriendo; sorprendida (E08), dormida,
 * triste, besito… no la llevan. Medido sobre los trazados de cada boca.
 */
export const LENGUA_EN = {
  'b03-alegre': [764, 418, 1.3],
  'b03-carcajada': [770, 432, 1.4],
  'b03-guino': [773, 418, 1.25],
  'b03-curioso': [776, 407, 0.95],
  'b03-orgulloso': [774, 404, 1.05],
}

/** Bandas de tono para el tinte por paleta: [hueMin, hueMax, rol] (0 naranja, 1 menta, 2 amarillo). */
const BANDAS = {
  serpiente: [[330, 360, 0], [0, 28, 0], [28, 75, 2], [75, 330, 1]],
  camaleon: [[300, 360, 0], [0, 25, 0], [25, 70, 2], [70, 300, 1]],
}

/**
 * Camuflaje del Camaleón: colores [naranja, menta, amarillo] que toma su cuerpo
 * según lo que lleva puesto. Primero un conjunto B12 completo, después la
 * superficie B11. Una paleta elegida a mano (≠ clásica) siempre manda.
 */
export const CAMUFLAJE = {
  conjuntos: {
    'Robot Lumen': ['#ffb347', '#8fb3cf', '#e9f1f6'],
    'Draco del bosque': ['#e2673a', '#5fa34a', '#f2d16b'],
    'Ratón Atlas': ['#f29bb0', '#a9a6b8', '#f5e3c2'],
    'AraLuz': ['#3c6fd6', '#df4b4b', '#ffe08a'],
  },
  texturas: {
    'b11-robot': ['#ffb347', '#8fb3cf', '#e9f1f6'],
    'b11-draco': ['#e2673a', '#5fa34a', '#f2d16b'],
    'b11-pirata': ['#d9534f', '#4e9fc4', '#f3d9a4'],
    'b11-mago': ['#f2a1d4', '#6f6fd6', '#ffd96a'],
    'b11-araluz': ['#3c6fd6', '#df4b4b', '#ffe08a'],
  },
}

export const CRIATURAS_V4 = { serpiente: true, camaleon: true }
const esV4 = (id) => !!CRIATURAS_V4[id]

/**
 * Clave de tinte de la base para una selección: el id de la paleta o, en el
 * Camaleón con la paleta clásica, `camuflaje:<origen>`. Para las especies
 * anteriores es exactamente la paleta (como antes).
 */
export function clavePaleta(env, especieId, sel) {
  const paleta = sel?.paleta || 'clasica'
  if (especieId !== 'camaleon' || paleta !== 'clasica') return paleta
  const conjunto = env.sets?.find((s) => CAMUFLAJE.conjuntos[s.nombre] && Object.entries(s.seleccion).every(([k, v]) => k === 'expresion' || sel[k] === v))
  if (conjunto) return 'camuflaje:' + conjunto.nombre
  if (CAMUFLAJE.texturas[sel.textura]) return 'camuflaje:' + sel.textura
  return 'clasica'
}

/** Colores destino [naranja, menta, amarillo] de una clave, o null (clásica: colores IA tal cual). */
function destinoDe(clave) {
  if (clave === 'clasica') return null
  if (clave.startsWith('camuflaje:')) {
    const k = clave.slice(10)
    return CAMUFLAJE.conjuntos[k] ?? CAMUFLAJE.texturas[k] ?? null
  }
  const p = paletas.find((x) => x.id === clave)
  return p ? [1, 4, 7].map((i) => p.colors[i]) : null
}

// ── Utilidades (copias locales de las de especies.js, que no se exportan) ────
const parse = (s) => {
  const d = new DOMParser().parseFromString(s, 'image/svg+xml')
  if (d.querySelector('parsererror')) throw Error('SVG inválido en el compositor V4')
  return d
}
const crear = (doc, tag, attrs = {}) => {
  const n = doc.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  return n
}
const imagen = (doc, href, [x, y, w, h], extra = {}) =>
  crear(doc, 'image', { x, y, width: w, height: h, href, preserveAspectRatio: 'none', ...extra })

const manifiestos = new Map()
function cargarManifiesto(id) {
  if (!manifiestos.has(id)) manifiestos.set(id, fetch(new URL(`${id}/manifiesto.json`, RECURSOS)).then((r) => {
    if (!r.ok) throw Error('Falta el manifiesto de ' + id)
    return r.json()
  }))
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
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
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
const cargarImagen = (url) => new Promise((ok, mal) => {
  const im = new Image()
  im.onload = () => ok(im)
  im.onerror = () => mal(Error('No se pudo cargar ' + url))
  im.src = url
})

/**
 * Tinte por bandas (mismo método que especies.js): cada banda toma el tono del
 * color destino de su rol, conservando luces y sombras propias; contornos,
 * blancos, cremas poco saturadas y grises no se tocan.
 */
const tintes = new Map()
async function tenir(url, especieId, clave) {
  const destino = destinoDe(clave)
  if (!destino) return url
  const k = `${url}|${clave}`
  if (!tintes.has(k)) tintes.set(k, (async () => {
    const dest = destino.map((c) => rgbAHsl(...hex(c)))
    const im = await cargarImagen(url)
    const c = document.createElement('canvas')
    c.width = im.naturalWidth; c.height = im.naturalHeight
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(im, 0, 0)
    const datos = ctx.getImageData(0, 0, c.width, c.height), px = datos.data
    const bandas = BANDAS[especieId]
    const suma = bandas.map(() => [0, 0, 0, 0, 0])
    const hsl = new Float32Array((px.length / 4) * 3), banda = new Int8Array(px.length / 4).fill(-1)
    for (let i = 0, j = 0; i < px.length; i += 4, j++) {
      if (px[i + 3] < 8) continue
      const [h, s, l] = rgbAHsl(px[i] / 255, px[i + 1] / 255, px[i + 2] / 255)
      hsl[j * 3] = h; hsl[j * 3 + 1] = s; hsl[j * 3 + 2] = l
      if (l < 0.3 || s < 0.25 || l > 0.95) continue
      const b = bandas.findIndex(([a, z]) => h >= a && h < z)
      if (b < 0) continue
      banda[j] = b
      const ang = (h * Math.PI) / 180
      suma[b][0] += Math.cos(ang); suma[b][1] += Math.sin(ang); suma[b][2] += s; suma[b][3] += l; suma[b][4]++
    }
    const ref = suma.map(([x, y, s, l, n]) => (n ? [Math.atan2(y, x) * 180 / Math.PI, s / n, l / n] : null))
    for (let j = 0, i = 0; j < banda.length; j++, i += 4) {
      const b = banda[j]
      if (b < 0 || !ref[b]) continue
      const [h, s, l] = [hsl[j * 3], hsl[j * 3 + 1], hsl[j * 3 + 2]]
      const [rh, rs, rl] = ref[b], [ph, ps, pl] = dest[bandas[b][2]]
      let dh = h - rh; if (dh > 180) dh -= 360; if (dh < -180) dh += 360
      const [r, g, bl] = hslARgb(ph + dh * 0.5, Math.min(1, ps * (s / rs)), Math.max(0.05, Math.min(0.97, pl + (l - rl))))
      px[i] = r * 255; px[i + 1] = g * 255; px[i + 2] = bl * 255
    }
    ctx.putImageData(datos, 0, 0)
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'))
    return URL.createObjectURL(blob)
  })())
  return tintes.get(k)
}

const radioNucleo = (p) => p.encuadre[1] + p.encuadre[3] - 3

/** Base SVG de una criatura V4 (texto con los ids de la base aprobada), teñida según `clave`. */
export async function baseCriaturaV4(env, especieId, clave, forma) {
  const m = await cargarManifiesto(especieId)
  const url = async (p) => tenir(new URL(`${especieId}/${p.archivo}`, RECURSOS).href, especieId, clave)
  const doc = parse(env.base)

  // Cuerpo: seis segmentos con los ids del maestro (las superficies B11 se ponen en su núcleo).
  const body = doc.getElementById('body')
  body.replaceChildren()
  for (let rol = 0; rol < 6; rol++) {
    const p = pieza(m, PIEZA_DE_ROL[rol]), id = MAESTRO_IDS[rol], r = radioNucleo(p)
    const g = crear(doc, 'g', { id, transform: `translate(${forma.xMaestro[rol]} ${forma.y[rol]})`, 'data-especie': especieId, 'data-nucleo': r })
    const defs = crear(doc, 'defs'), clip = crear(doc, 'clipPath', { id: 'clip-' + id })
    clip.append(crear(doc, 'circle', { r: r - 3 }))
    defs.append(clip)
    const nucleo = crear(doc, 'g', { 'clip-path': `url(#clip-${id})` })
    nucleo.append(crear(doc, 'g', { 'data-nucleo-vacio': '' }))
    g.append(defs, imagen(doc, await url(p), p.encuadre, { 'data-pieza': p.id }), nucleo)
    body.append(g)
  }

  // Patas: el Camaleón con pierna y pie prensil propios; la Serpiente con apoyos vacíos.
  const pies = doc.getElementById('legs-and-sneakers')
  pies.replaceChildren()
  const conPatas = m.piezas.some((x) => x.id === 'pierna')
  const [pierna, pie] = conPatas ? [pieza(m, 'pierna'), pieza(m, 'pie')] : []
  const [urlPierna, urlPie] = conPatas ? [await url(pierna), await url(pie)] : []
  PIES_CIEMPI.forEach(([x, y, giro], i) => {
    const px = i === 0 || i === 5 ? x : i === 4 ? Math.min(x, forma.xMaestro[4] + 42) : forma.xMaestro[i] - 8
    const g = crear(doc, 'g', { transform: `translate(${px} ${y})`, stroke: '#243e5b', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' })
    const giroG = crear(doc, 'g', { transform: `rotate(${giro} -10 -32)` })
    if (conPatas) {
      giroG.append(imagen(doc, urlPie, pie.encuadre, { 'data-pieza': 'pie' }))
      g.append(imagen(doc, urlPierna, pierna.encuadre, { 'data-pieza': 'pierna' }), giroG)
    } else {
      g.setAttribute('data-sin-pata', '')
      g.append(giroG)
    }
    pies.append(g)
  })
  // La pata de la cabeza de la Serpiente: tampoco existe (la cabeza descansa sobre el cuello).

  // Sin antenas: la serpiente y el camaleón no tienen.
  doc.getElementById('antennae')?.remove()

  // Cabeza: piel IA propia bajo el rostro vectorial (recortada al círculo #face);
  // se quita el sombreado naranja de Ciempi, el contorno vectorial queda encima.
  const cabeza = doc.getElementById('head')
  const disco = [...cabeza.children].find((n) => n.localName === 'circle' && /url\(#orange\)/.test(n.getAttribute('fill') || ''))
  const sombra = [...cabeza.children].find((n) => n.localName === 'g' && n.getAttribute('clip-path') === 'url(#face)')
  const piel = pieza(m, 'cabeza-piel')
  const gp = crear(doc, 'g', { 'clip-path': 'url(#face)', 'data-rasgo': 'piel' })
  gp.append(imagen(doc, await url(piel), piel.encuadre, { 'data-pieza': 'cabeza-piel' }))
  disco.setAttribute('fill', '#fff9e9')
  if (sombra) sombra.replaceWith(gp)
  else disco.after(gp)

  // Casco del Camaleón: detrás de la cabeza (se guarda bajo gorros y peinados).
  const casco = m.piezas.find((x) => x.id === 'casco')
  if (casco) {
    const gc = crear(doc, 'g', { id: 'rasgos-cabeza', 'data-accessory': 'rasgos-' + especieId, 'data-rasgo': 'casco' })
    gc.append(imagen(doc, await url(casco), casco.encuadre, { 'data-pieza': 'casco' }))
    cabeza.parentNode.insertBefore(gc, cabeza)
  }

  // Torretas del Camaleón: párpados IA centrados en cada ojo, detrás de #eyes.
  const torretas = ['torreta-izq', 'torreta-der'].map((id) => m.piezas.find((x) => x.id === id)).filter(Boolean)
  if (torretas.length === 2) {
    const gt = crear(doc, 'g', { 'data-rasgo': 'torretas' })
    for (const [i, t] of torretas.entries()) {
      const [x, y, w, h] = t.encuadre
      gt.append(imagen(doc, await url(t), [x + OJOS[i][0], y + OJOS[i][1], w, h], { 'data-pieza': t.id }))
    }
    cabeza.insertBefore(gt, doc.getElementById('eyes'))
  }

  const lengua = m.piezas.find((x) => x.id === 'lengua')
  return { svg: new XMLSerializer().serializeToString(doc), alas: null, lengua: lengua ? { ...lengua, url: await url(lengua) } : null }
}

/**
 * Retoques sobre la composición ya hecha por `renderCiempi` (doc DOM), con la
 * selección efectiva y la resolución de compatibilidad. Se aplica también a
 * cada rostro (`obtenerRostro`) porque `componerCriatura` es el mismo camino.
 */
export function posprocesarV4(doc, especieId, efectiva, res, base) {
  if (!esV4(especieId)) return
  if (especieId === 'serpiente') {
    // Lengüita: dentro de la boca (primer hijo: el labio la tapa arriba), solo si hay boca dibujada.
    const boca = doc.querySelector('g[id="head"] g[id="mouth"]')
    const donde = LENGUA_EN[efectiva.expresion]
    if (base.lengua && boca?.children.length && donde && efectiva.lengua !== 'no' && !res.rasgosOcultos.includes('lengua')) {
      const [x, y, s] = donde, [ex, ey, w, h] = base.lengua.encuadre
      const g = crear(doc, 'g', { 'data-rasgo': 'lengua', transform: `translate(${x} ${y}) scale(${s})` })
      g.append(imagen(doc, base.lengua.url, [ex, ey, w, h], { 'data-pieza': 'lengua' }))
      boca.prepend(g)
    }
    // La mochila se apoya en el segmento delantero, que en la serpiente está 44 u más abajo.
    const dy = 446 - 402
    for (const b of doc.querySelectorAll('[data-bag]')) b.setAttribute('transform', `translate(0 ${dy})`)
  }
  doc.documentElement.setAttribute('data-especie-v4', especieId)
}
