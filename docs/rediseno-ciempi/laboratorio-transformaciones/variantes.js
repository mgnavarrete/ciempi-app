// Catálogo EXPERIMENTAL de variantes por especie (V5, AD-020). LABORATORIO: no está
// conectado al juego, la tienda, los precios, los inventarios ni las compras.
//
// Modelo: especie → diseño base (id estable) → variante (id estable, nombre, paleta,
// patrón) → producto futuro (nombre, estado 'experimental', sin precio).
// Todas las variantes de una especie comparten geometría, rostro, expresiones,
// crecimiento y animaciones: solo cambian color, material y patrón de superficie.
//  - Color: tinte por bandas de tono (como `tenir()` de especies.js), con claves
//    semánticas por especie (escamas, púas, vientre…) y, si hace falta, color por
//    pieza (Arcoíris) y sombra de otro tono (duotono: Blanco con sombras lavanda).
//  - Material/patrón: capa vectorial dentro del núcleo de cada segmento (mismo
//    recorte que las superficies B11), así acompaña al crecimiento y al rig.
//  - Camaleón: TODAS las variantes usan los ojos k3 «Atardecer» (recursos/camaleon/ojos-k3).
// En el laboratorio: `?variante=<id>` (ver laboratorio-v4.js) o `sel.varianteEspecie`.

const RECURSOS = new URL('./recursos/', import.meta.url)
const NS = 'http://www.w3.org/2000/svg'
const NAVY = '#243e5b'

/** Bandas semánticas por especie: [hueMin, hueMax, clave, lMin, lMax]; gana la primera que encaja. */
const BANDAS = {
  dragon: [[95, 205, 'escamas'], [20, 85, 'vientre', 0.62, 1], [40, 85, 'vientre'], [330, 360, 'pua', 0, 0.62], [0, 40, 'pua', 0, 0.62]],
  cuncuna: [[220, 330, 'lila'], [95, 220, 'menta'], [40, 85, 'amarillo'], [330, 360, 'salmon'], [0, 20, 'salmon'], [20, 40, 'naranja']],
  serpiente: [[15, 45, 'crema', 0.7, 1], [330, 360, 'rojo'], [0, 15, 'rojo'], [15, 80, 'amarillo']],
  camaleon: [[15, 55, 'vientre', 0.72, 1], [300, 360, 'rosa'], [0, 15, 'rosa'], [15, 55, 'amarillo'], [55, 210, 'piel']],
  // Torretas k3: anillos rosa/magenta y sus líneas rojas (h < 12) frente al caparazón naranja y el párpado (h 12–60).
  torreta: [[300, 360, 'anillo'], [0, 12, 'anillo'], [12, 60, 'borde']],
}
/** Qué claves se tiñen en el rostro IA v4b (los ojos nunca): hocico y cejas del Dragón, cejas de la Cuncuna. */
// La Cuncuna no tiñe nada del rostro: ojos, cejas, mejillas y boca quedan como en el v4b aprobado.
const CLAVES_ROSTRO = { dragon: ['escamas', 'vientre'], cuncuna: [] }
/** Colores de la cabeza vectorial de la base (paleta clásica 0–2 y su sombra). */
const CABEZA_CLASICA = ['#ffb449', '#ff9e32', '#f58b2d', '#e8752b']

const prod = (nombre) => ({ nombre, estado: 'experimental', precio: null })

/**
 * CATÁLOGO. `colores`: clave semántica → color (o [luz, sombra]); `piezas`: colores por
 * pieza; `cabeza`: color de la cabeza vectorial (Dragón/Cuncuna); `patron`: capa de
 * superficie; `torreta`: tinte de los ojos k3 (Camaleón); `rostroClaves`: claves del rostro.
 */
export const CATALOGO = {
  dragon: {
    nombre: 'Ciempi Dragón',
    disenoBase: { id: 'dragon-v4', nombre: 'Dragón V4 (cuerpo d2 + rostro v4b)', estado: 'aprobado (AD-020)', rostro: 'v4b' },
    variantes: [
      { id: 'dragon-clasico', nombre: 'Dragón Clásico', base: true, producto: prod('Ciempi Dragón'), diferencias: 'Diseño base aprobado: escamas verde azulado, púas naranja, cabeza naranja.' },
      { id: 'dragon-fuego', nombre: 'Dragón de Fuego', producto: prod('Transformación Dragón de Fuego'),
        colores: { escamas: ['#e2402e', '#a51f2c'], pua: '#ffd23a', vientre: '#ffb24a' }, cabeza: '#f4672b',
        patron: { tipo: 'llamas', colores: ['#ff9a2e', '#ffe14a'] }, diferencias: 'Rojo y naranja con púas amarillas y llamas en cada segmento.' },
      { id: 'dragon-hielo', nombre: 'Dragón de Hielo', producto: prod('Transformación Dragón de Hielo'),
        colores: { escamas: ['#86d6f7', '#4b98dc'], pua: '#e4f8ff', vientre: '#eef9ff' }, cabeza: '#b4e6fa',
        patron: { tipo: 'escarcha', colores: ['#ffffff', '#d8f4ff'] }, diferencias: 'Celeste y blanco helado, púas de cristal y copos de escarcha.' },
      { id: 'dragon-nocturno', nombre: 'Dragón Nocturno', producto: prod('Transformación Dragón Nocturno'),
        colores: { escamas: ['#46559c', '#2d2f72'], pua: '#8e62e0', vientre: '#c3b2f4' }, cabeza: '#5a67b0', rostroClaves: ['escamas'],
        patron: { tipo: 'estrellas', colores: ['#ffe466', '#7ff0ff'] }, diferencias: 'Azul noche y morado con estrellas luminosas; hocico crema para leer la cara.' },
      { id: 'dragon-tierra', nombre: 'Dragón de Tierra', producto: prod('Transformación Dragón de Tierra'),
        colores: { escamas: ['#bb7442', '#7f4a2b'], pua: '#8cc63f', vientre: '#ecd3a0' }, cabeza: '#c98049',
        patron: { tipo: 'piedras', colores: ['#6e4426', '#dff3f7', '#5fc4d8'] }, diferencias: 'Marrón tierra, púas de musgo, guijarros y un cristal mineral.' },
      { id: 'dragon-blanco', nombre: 'Dragón Blanco', producto: prod('Transformación Dragón Blanco'),
        colores: { escamas: ['#f7f0e6', '#a9bff0'], pua: '#f4c64c', vientre: '#dcecfb' }, cabeza: '#fcf4e8',
        patron: { tipo: 'nacar', colores: ['#c3bcf0', '#ffffff'] }, diferencias: 'Blanco cálido con sombras lavanda, púas doradas y escamas de nácar.' },
      { id: 'dragon-esmeralda', nombre: 'Dragón Esmeralda', producto: prod('Transformación Dragón Esmeralda'),
        colores: { escamas: ['#17b673', '#0b7650'], pua: '#ffcc2e', vientre: '#c6f5df' }, cabeza: '#2fbf83',
        patron: { tipo: 'gemas', colores: ['#5fe3a8', '#0d8457', '#ffd23a'] }, diferencias: 'Verde esmeralda, púas doradas y una gema facetada por segmento.' },
    ],
  },
  cuncuna: {
    nombre: 'Ciempi Cuncuna',
    disenoBase: { id: 'cuncuna-v4', nombre: 'Cuncuna V4 (cuerpo c2 + rostro v4b)', estado: 'aprobado (AD-020)', rostro: 'v4b' },
    variantes: [
      { id: 'cuncuna-clasica', nombre: 'Cuncuna Clásica', base: true, producto: prod('Ciempi Cuncuna'), diferencias: 'Diseño base aprobado: segmentos lila y menta, mechones amarillo y salmón.' },
      { id: 'cuncuna-primavera', nombre: 'Cuncuna Primavera', producto: prod('Transformación Cuncuna Primavera'),
        colores: { lila: '#9fe3b8', menta: '#ffe98a', amarillo: '#ffd84a', salmon: '#ff9fb4', naranja: '#ff9fb4' }, cabeza: '#8fdcb0',
        patron: { tipo: 'flores', colores: ['#ffffff', '#ff8fb0', '#ffd23a'] }, diferencias: 'Menta y amarillo suave, mechones rosados y florcitas discretas.' },
      { id: 'cuncuna-frutilla', nombre: 'Cuncuna Frutilla', producto: prod('Transformación Cuncuna Frutilla'),
        colores: { lila: ['#f0505c', '#c1323f'], menta: '#ff9fb0', amarillo: '#8fd03c', salmon: '#5fb23c', naranja: '#5fb23c' }, cabeza: '#e8434f',
        patron: { tipo: 'semillas', colores: ['#ffe27a'] }, diferencias: 'Rojo frutilla y rosado con pepitas; mechones verdes como hojas.' },
      { id: 'cuncuna-arcoiris', nombre: 'Cuncuna Arcoíris', producto: prod('Transformación Cuncuna Arcoíris'),
        colores: { amarillo: '#fff0c4', salmon: '#ffe2d2', naranja: '#5cb2f5' }, cabeza: '#c8a2f2',
        // Orden visible al crecer: cola, B, C, D, A, B… y el frente al final (forma modular: ciclo A,B,C,D tras la cola).
        piezas: { cola: { lila: '#a77ff0' }, 'seg-b': { menta: '#ff6f86' }, 'seg-c': { lila: '#ffa53c' }, 'seg-d': { menta: '#ffd83a' }, 'seg-a': { lila: '#6fd07a' }, frente: { lila: '#5cb2f5' } },
        patron: { tipo: 'destellos', colores: ['#ffffff'], cantidad: 2 }, diferencias: 'Cada segmento de un color del arcoíris, mechones crema.' },
      { id: 'cuncuna-lavanda', nombre: 'Cuncuna Lavanda', producto: prod('Transformación Cuncuna Lavanda'),
        colores: { lila: '#cfa8f3', menta: '#a9d6fb', amarillo: '#f2d6f6', salmon: '#e0bdfb', naranja: '#b08ce6' }, cabeza: '#c9a2f0',
        patron: { tipo: 'brotes', colores: ['#6f45b8', '#5f9a52'], escala: 1.5 }, diferencias: 'Lila y celeste pastel con ramitos de lavanda.' },
      { id: 'cuncuna-bosque', nombre: 'Cuncuna Bosque', producto: prod('Transformación Cuncuna Bosque'),
        colores: { lila: ['#73963a', '#4d6b2a'], menta: ['#ad6c3d', '#7a4a2a'], amarillo: '#f2c23a', salmon: '#7fb03c', naranja: '#6b8f34' }, cabeza: '#b07a45',
        patron: { tipo: 'hojas', colores: ['#d4ef7a', '#5f8f2e'], escala: 1.45 }, diferencias: 'Musgo y madera, mechones amarillo cálido y verde, hojitas.' },
      { id: 'cuncuna-dorada', nombre: 'Cuncuna Dorada', producto: prod('Transformación Cuncuna Dorada'),
        colores: { lila: ['#ffc425', '#e08a12'], menta: '#ffe9ad', amarillo: '#ff9a1f', salmon: '#ffb631', naranja: '#ffc425' }, cabeza: '#f0a020',
        patron: { tipo: 'destellos', colores: ['#fffbe6'], cantidad: 3 }, diferencias: 'Oro y crema luminosos, mechones naranja y destellos.' },
    ],
  },
  serpiente: {
    nombre: 'Ciempi Serpiente',
    disenoBase: { id: 'serpiente-s2', nombre: 'Serpiente s2 (geometría y rostro s2a + zapatilla en la cola)', estado: 'en revisión (AD-019/AD-020)' },
    calzadoMuestra: 'b10-deportiva',
    variantes: [
      { id: 'serpiente-caramelo', nombre: 'Serpiente Caramelo', base: true, origen: 's2', producto: prod('Transformación Serpiente Caramelo'), diferencias: 'Diseño s2: rojo y amarillo alternos, vientre crema, punta de corazón.' },
      { id: 'serpiente-jardin', nombre: 'Serpiente Jardín', origen: 's1', producto: prod('Transformación Serpiente Jardín'),
        colores: { rojo: '#6cc88f', amarillo: '#86bf3e' }, piezas: { 'cabeza-piel-v2': { rojo: '#a8d84c' }, 'cabeza-piel': { rojo: '#a8d84c' } },
        patron: { tipo: 'rombos', colores: ['#ffd84a'] }, diferencias: 'Verdes de jardín alternos con un rombo amarillo por segmento (s1).' },
      { id: 'serpiente-noche', nombre: 'Serpiente Noche', origen: 's3', producto: prod('Transformación Serpiente Noche'),
        colores: { rojo: '#5d70e2', amarillo: '#8c60d8', crema: '#cdbaf3' }, piezas: { 'cabeza-piel-v2': { rojo: '#7c88ec' }, 'cabeza-piel': { rojo: '#7c88ec' } },
        patron: { tipo: 'estrellas5', colores: ['#fff2b0'] }, diferencias: 'Azul y morado con estrellitas crema, vientre lavanda (s3).' },
      { id: 'serpiente-hoja', nombre: 'Serpiente Hoja', origen: 's4', producto: prod('Transformación Serpiente Hoja'),
        colores: { rojo: '#22b6b0', amarillo: '#1fa39e' }, piezas: { 'cabeza-piel-v2': { rojo: '#2cbcb6' }, 'cabeza-piel': { rojo: '#2cbcb6' } },
        patron: { tipo: 'zigzag', colores: ['#b8e24c'] }, diferencias: 'Turquesa con franja en zigzag lima (s4).' },
    ],
  },
  camaleon: {
    nombre: 'Ciempi Camaleón',
    disenoBase: { id: 'camaleon-v2', nombre: 'Camaleón v2 (cuerpo, patas y boca v2) + ojos k3 «Atardecer»', estado: 'en revisión; ojos k3 elegidos (AD-020)' },
    variantes: [
      { id: 'camaleon-lima', nombre: 'Camaleón Lima', base: true, origen: 'k2a', producto: prod('Transformación Camaleón Lima'),
        torreta: { borde: '#b6de3e', anillo: '#2fb5b8' }, diferencias: 'El diseño actual (k2a): degradado turquesa→lima, casco arcoíris, torretas lima con anillos turquesa.' },
      { id: 'camaleon-arcoiris', nombre: 'Camaleón Arcoíris', origen: 'k1', producto: prod('Transformación Camaleón Arcoíris'),
        colores: { rosa: '#fff3c4', amarillo: '#fff3c4' },
        piezas: { cola: { piel: '#f2639a' }, 'seg-a': { piel: '#ff9b3d' }, 'seg-b': { piel: '#f6cf34' }, 'seg-c': { piel: '#6fcf55' }, 'seg-d': { piel: '#33bfb5' }, frente: { piel: '#4fa6ef' },
          casco: { piel: '#6fcf55', rosa: '#f2639a', amarillo: '#ffb43c' } },
        torreta: { borde: '#b6de3e', anillo: '#4fa6ef' }, diferencias: 'Un color del arcoíris por segmento con lunares crema, torretas con anillos azules (k1).' },
      { id: 'camaleon-tropical', nombre: 'Camaleón Tropical', origen: 'k2', producto: prod('Transformación Camaleón Tropical'),
        colores: { piel: ['#6cc33f', '#3f9636'], rosa: '#ff8a2a', amarillo: '#ffd23a' },
        piezas: { cola: { piel: '#ff8a2a', rosa: '#ffd23a' }, 'cabeza-piel': { piel: '#bde23c' }, casco: { piel: '#7cc943', rosa: '#ff8a2a' } },
        patron: { tipo: 'franja', colores: ['#fff3b8'] }, torreta: { borde: '#bde23c', anillo: '#ff8a2a' }, diferencias: 'Verde selva con manchas naranja, franja ondulada, cola y anillos de las torretas naranja (k2).' },
      { id: 'camaleon-atardecer', nombre: 'Camaleón Atardecer', origen: 'k3', producto: prod('Transformación Camaleón Atardecer'),
        colores: { piel: '#ff8f3a', rosa: '#ffe23d', amarillo: '#ffe23d', vientre: '#c9a6ec' },
        piezas: { cola: { piel: '#d6337a' }, 'seg-a': { piel: '#e9457a' }, 'seg-b': { piel: '#f45f68' }, 'seg-c': { piel: '#fb7656' }, 'seg-d': { piel: '#f45f68' }, frente: { piel: '#ff8540' },
          'cabeza-piel': { piel: '#ff9433' }, casco: { piel: '#ff6f5e', rosa: '#ef3f7c', amarillo: '#ffd23a' } },
        patron: { tipo: 'pecas', colores: ['#ffe23d'] }, diferencias: 'Magenta→naranja como un atardecer, pecas amarillas y vientre lavanda (k3).' },
      { id: 'camaleon-pastel', nombre: 'Camaleón Pastel', origen: 'k4', producto: prod('Transformación Camaleón Pastel'),
        colores: { piel: '#a9e3c8', rosa: '#fff6e0', amarillo: '#fff6e0', vientre: '#9fcdf4' },
        piezas: { cola: { piel: '#c3a6ec' }, 'seg-a': { piel: '#a9e3c8' }, 'seg-b': { piel: '#a8d2f5' }, 'seg-c': { piel: '#c9b2ef' }, 'seg-d': { piel: '#a8d2f5' }, casco: { piel: '#c9b2ef' } },
        patron: { tipo: 'nubes', colores: ['#fff8e8'] }, torreta: { borde: '#a9e3c8', anillo: '#c3a6ec' }, diferencias: 'Menta, celeste y lila pastel con nubes crema y anillos lila (k4).' },
    ],
  },
}

// ── Búsqueda ─────────────────────────────────────────────────────────────────
const INDICE = new Map()
for (const [especie, e] of Object.entries(CATALOGO)) for (const v of e.variantes) INDICE.set(v.id, { especie, v })
export const buscarVariante = (id) => INDICE.get(id) ?? null
/** Variante válida de una selección para esa especie (o null). */
export function varianteDe(especieId, sel) {
  const r = sel?.varianteEspecie ? INDICE.get(sel.varianteEspecie) : null
  return r && r.especie === especieId ? r.v : null
}
/** Sufijo de la clave de tinte de la base (vacío sin variante). */
export const sufijoVariante = (especieId, sel) => (varianteDe(especieId, sel) ? '#v:' + sel.varianteEspecie : '')
export const varianteDeClave = (clave) => { const m = /#v:([\w-]+)/.exec(clave || ''); return m ? INDICE.get(m[1])?.v ?? null : null }
export const usaOjosK3 = (especieId, clave) => especieId === 'camaleon' && !!varianteDeClave(clave)

// ── Color ────────────────────────────────────────────────────────────────────
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
const aHex = (rgb) => '#' + rgb.map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0')).join('')
const hslDe = (c) => rgbAHsl(...hex(c))
/** Cuatro tonos para la cabeza vectorial (como la progresión de la paleta clásica). */
const tonosCabeza = (c) => { const [h, s, l] = hslDe(c); return [0.05, 0, -0.035, -0.07].map((d) => aHex(hslARgb(h, s, Math.max(0.08, Math.min(0.97, l + d))))) }

const cargarImagen = (url) => new Promise((ok, mal) => {
  const im = new Image()
  im.onload = () => ok(im)
  im.onerror = () => mal(Error('No se pudo cargar ' + url))
  im.src = url
})

/** Destinos por clave para una pieza: colores de la variante con los de la pieza encima. */
function destinosDe(v, piezaId, claves) {
  const d = { ...(v.colores || {}), ...(v.piezas?.[piezaId] || {}) }
  if (claves) for (const k of Object.keys(d)) if (!claves.includes(k)) delete d[k]
  return d
}

const tintes = new Map()
/**
 * Tiñe una pieza raster con la variante: cada píxel de una banda semántica toma el
 * tono del destino de su clave, conservando la luz y la sombra del original
 * (contorno azul oscuro, blancos y grises intactos). Con destino [luz, sombra], las
 * zonas más oscuras que la media giran hacia el tono de sombra (material).
 */
export async function tenirVariante(url, bandasId, v, piezaId, claves = null) {
  const destinos = destinosDe(v, piezaId, claves)
  if (!Object.keys(destinos).length) return url
  const k = `${url}|${v.id}|${piezaId}|${claves || ''}`
  if (!tintes.has(k)) tintes.set(k, (async () => {
    const bandas = BANDAS[bandasId]
    const dest = bandas.map(([, , clave]) => {
      const c = destinos[clave]
      if (!c) return null
      const [luz, sombra] = Array.isArray(c) ? c : [c, null]
      return { luz: hslDe(luz), sombra: sombra ? hslDe(sombra) : null }
    })
    const im = await cargarImagen(url)
    const c = document.createElement('canvas')
    c.width = im.naturalWidth; c.height = im.naturalHeight
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(im, 0, 0)
    const datos = ctx.getImageData(0, 0, c.width, c.height), px = datos.data
    const n = px.length / 4
    const hsl = new Float32Array(n * 3), banda = new Int8Array(n).fill(-1)
    const suma = bandas.map(() => [0, 0, 0, 0, 0])
    for (let i = 0, j = 0; j < n; i += 4, j++) {
      if (px[i + 3] < 8) continue
      const [h, s, l] = rgbAHsl(px[i] / 255, px[i + 1] / 255, px[i + 2] / 255)
      hsl[j * 3] = h; hsl[j * 3 + 1] = s; hsl[j * 3 + 2] = l
      if (l < 0.3 || s < 0.2 || l > 0.96) continue
      const b = bandas.findIndex(([a, z, , l0 = 0, l1 = 1]) => h >= a && h < z && l >= l0 && l <= l1)
      if (b < 0 || !dest[b]) continue
      banda[j] = b
      const ang = (h * Math.PI) / 180
      suma[b][0] += Math.cos(ang); suma[b][1] += Math.sin(ang); suma[b][2] += s; suma[b][3] += l; suma[b][4]++
    }
    const ref = suma.map(([x, y, s, l, m]) => (m ? [Math.atan2(y, x) * 180 / Math.PI, s / m, l / m] : null))
    for (let j = 0, i = 0; j < n; j++, i += 4) {
      const b = banda[j]
      if (b < 0 || !ref[b]) continue
      const [h, s, l] = [hsl[j * 3], hsl[j * 3 + 1], hsl[j * 3 + 2]]
      const [rh, rs, rl] = ref[b], { luz, sombra } = dest[b]
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
    ctx.putImageData(datos, 0, 0)
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'))
    return URL.createObjectURL(blob)
  })())
  return tintes.get(k)
}

// ── Rostro v4b teñido (Dragón y Cuncuna) ─────────────────────────────────────
const rostros = new Map() // `${varianteId}|${carpeta}/${archivo}` → blob URL
/** Tiñe (una vez) las capas «rostro» del v4b con la variante; los ojos no se tocan. */
export async function prepararRostroVariante(especieId, v) {
  if (!CLAVES_ROSTRO[especieId] || !v.colores) return
  const carpeta = especieId + '/v4b'
  const m = await (await fetch(new URL(`${carpeta}/manifiesto.json`, RECURSOS))).json()
  const claves = v.rostroClaves ?? CLAVES_ROSTRO[especieId]
  await Promise.all(Object.values(m.expresiones).map(async (e) => {
    const k = `${v.id}|${carpeta}/${e.rostro.archivo}`
    if (!rostros.has(k)) rostros.set(k, await tenirVariante(new URL(`${carpeta}/${e.rostro.archivo}`, RECURSOS).href, especieId, v, 'rostro', claves))
  }))
}
/** URL teñida de una capa del rostro v4b, o null (sin variante, capa de ojo o rostro v4). */
export const rostroTenido = (varianteId, carpeta, archivo) => rostros.get(`${varianteId}|${carpeta}/${archivo}`) ?? null

// ── Base: cabeza vectorial y patrones de superficie ──────────────────────────
/** Recolorea la cabeza vectorial (Dragón/Cuncuna) en el texto de la base. */
export function recolorCabeza(svg, v) {
  if (!v.cabeza) return svg
  const t = tonosCabeza(v.cabeza)
  return CABEZA_CLASICA.reduce((s, c, i) => s.replaceAll(c, t[i]), svg)
}

const n2 = (x) => Math.round(x * 100) / 100
/** Estrella de 4 puntas (destello) centrada en (x, y) con radio r. */
const destello = (x, y, r, fill, extra = '') =>
  `<path d="M${n2(x)} ${n2(y - r)} Q${n2(x + r * 0.18)} ${n2(y - r * 0.18)} ${n2(x + r)} ${n2(y)} Q${n2(x + r * 0.18)} ${n2(y + r * 0.18)} ${n2(x)} ${n2(y + r)} Q${n2(x - r * 0.18)} ${n2(y + r * 0.18)} ${n2(x - r)} ${n2(y)} Q${n2(x - r * 0.18)} ${n2(y - r * 0.18)} ${n2(x)} ${n2(y - r)}Z" fill="${fill}" ${extra}/>`
const estrella5 = (x, y, r, fill, extra = '') => {
  const p = []
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.48 : r; p.push(`${n2(x + rr * Math.cos(a))} ${n2(y + rr * Math.sin(a))}`) }
  return `<path d="M${p.join(' L')}Z" fill="${fill}" stroke-linejoin="round" ${extra}/>`
}
// Desplazamientos por rol, para que los segmentos no parezcan sellos idénticos.
const JIT = [[0.05, 0.02], [-0.06, 0], [0.04, 0.03], [-0.02, -0.02], [0.03, 0.01], [-0.04, 0.02]]

/** Capa de patrón (texto SVG) en coordenadas del segmento (centro de la bola = 0,0; radio r). */
function patronSVG(p, r, rol) {
  const [jx, jy] = JIT[rol] || [0, 0]
  const X = (f) => n2((f + jx) * r), Y = (f) => n2((f + jy) * r), R = (f) => n2(f * r)
  const [c0, c1, c2] = p.colores
  switch (p.tipo) {
    case 'llamas': {
      const llama = (x, y, h, fo, fi) => {
        const d = (k) => `M0 0 C${-0.5 * k} 0 ${-0.56 * k} ${-0.5 * k} ${-0.2 * k} ${-0.78 * k} C${-0.2 * k} ${-0.52 * k} 0 ${-0.48 * k} ${0.06 * k} ${-0.62 * k} C${0.12 * k} ${-0.86 * k} ${0.3 * k} ${-0.96 * k} ${0.32 * k} ${-1.02 * k} C${0.3 * k} ${-0.76 * k} ${0.62 * k} ${-0.52 * k} ${0.46 * k} ${-0.2 * k} C${0.38 * k} ${-0.04 * k} ${0.2 * k} 0 0 0Z`
        return `<g transform="translate(${x} ${y}) scale(${n2(h)})"><path d="${d(1)}" fill="${fo}"/><path d="${d(0.55)}" fill="${fi}" transform="translate(0.02 -0.02)"/></g>`
      }
      return llama(X(-0.08), Y(0.05), r * 0.62, c0, c1) + llama(X(0.42), Y(-0.08), r * 0.3, c0, c1)
    }
    case 'escarcha': {
      const copo = (x, y, s) => {
        let d = ''
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI) / 3, ca = Math.cos(a), sa = Math.sin(a)
          d += `M${n2(x - ca * s)} ${n2(y - sa * s)} L${n2(x + ca * s)} ${n2(y + sa * s)} `
          for (const sg of [1, -1]) {
            const bx = x + sg * ca * s * 0.62, by = y + sg * sa * s * 0.62
            for (const t of [0.5, -0.5]) {
              const ta = a + (sg > 0 ? 0 : Math.PI) + t * 1.4
              d += `M${n2(bx)} ${n2(by)} L${n2(bx + Math.cos(ta) * s * 0.3)} ${n2(by + Math.sin(ta) * s * 0.3)} `
            }
          }
        }
        return `<path d="${d}" fill="none" stroke="${c0}" stroke-width="${n2(s * 0.13)}" stroke-linecap="round"/>`
      }
      return copo(X(-0.05), Y(-0.36), r * 0.27) + destello(X(0.42), Y(-0.05), r * 0.1, c1) + `<circle cx="${X(-0.45)}" cy="${Y(-0.05)}" r="${R(0.04)}" fill="${c0}"/>`
    }
    case 'estrellas':
      return `<circle cx="${X(-0.08)}" cy="${Y(-0.36)}" r="${R(0.22)}" fill="${c0}" opacity="0.22"/>` + destello(X(-0.08), Y(-0.36), r * 0.2, c0) +
        destello(X(0.4), Y(-0.06), r * 0.09, c0) +
        [[-0.42, -0.06, 0.045], [0.18, 0.02, 0.035], [0.3, -0.48, 0.04], [-0.4, -0.5, 0.03]].map(([x, y, s]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="${R(s * 1.9)}" fill="${c1}" opacity="0.3"/><circle cx="${X(x)}" cy="${Y(y)}" r="${R(s)}" fill="${c1}"/>`).join('')
    case 'piedras':
      return [[-0.42, -0.12, 0.09, 0.06], [0.38, -0.02, 0.07, 0.05], [0.22, -0.55, 0.05, 0.035], [-0.15, 0.08, 0.06, 0.04]].map(([x, y, a, b], i) =>
        `<ellipse cx="${X(x)}" cy="${Y(y)}" rx="${R(a)}" ry="${R(b)}" fill="${c0}" opacity="${i % 2 ? 0.55 : 0.7}"/>`).join('') +
        `<g transform="translate(${X(0)} ${Y(-0.3)}) scale(1.6)"><path d="M0 ${R(-0.2)} L${R(0.12)} ${R(-0.07)} L${R(0.09)} ${R(0.16)} L${R(-0.09)} ${R(0.16)} L${R(-0.12)} ${R(-0.07)}Z" fill="${c1}" stroke="${NAVY}" stroke-width="${R(0.035)}" stroke-linejoin="round"/>` +
        `<path d="M0 ${R(-0.2)} L${R(0.12)} ${R(-0.07)} L0 ${R(-0.02)}Z" fill="#ffffff" opacity="0.75"/><path d="M0 ${R(-0.02)} L${R(0.09)} ${R(0.16)} L${R(-0.09)} ${R(0.16)} L${R(-0.12)} ${R(-0.07)}Z" fill="${c2}" opacity="0.55"/></g>`
    case 'nacar':
      return [[-0.32, -0.3], [0.02, -0.42], [0.34, -0.26], [-0.14, -0.06], [0.2, 0.0]].map(([x, y]) =>
        `<path d="M${X(x - 0.12)} ${Y(y)} Q${X(x)} ${Y(y + 0.14)} ${X(x + 0.12)} ${Y(y)}" fill="none" stroke="${c0}" stroke-width="${R(0.04)}" stroke-linecap="round" opacity="0.85"/>`).join('') +
        destello(X(-0.36), Y(-0.52), r * 0.07, c1)
    case 'gemas': {
      const g = `<g transform="translate(${X(0)} ${Y(-0.3)}) scale(1.3)">` +
        `<path d="M0 ${R(-0.24)} L${R(0.14)} ${R(-0.1)} L${R(0.14)} ${R(0.1)} L0 ${R(0.24)} L${R(-0.14)} ${R(0.1)} L${R(-0.14)} ${R(-0.1)}Z" fill="${c0}" stroke="${NAVY}" stroke-width="${R(0.035)}" stroke-linejoin="round"/>` +
        `<path d="M0 ${R(-0.24)} L${R(0.06)} 0 L0 ${R(0.24)} L${R(-0.06)} 0Z" fill="${c1}" opacity="0.45"/>` +
        `<path d="M0 ${R(-0.24)} L${R(-0.14)} ${R(-0.1)} L${R(-0.06)} 0Z" fill="#ffffff" opacity="0.8"/></g>`
      return g + [[-0.42, -0.1], [0.4, -0.06], [0.3, -0.56], [-0.3, -0.56]].map(([x, y]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="${R(0.035)}" fill="${c2}"/>`).join('')
    }
    case 'flores': {
      const flor = (x, y, s, petalo, centro) => {
        let d = ''
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; d += `<circle cx="${n2(x + Math.cos(a) * s)}" cy="${n2(y + Math.sin(a) * s)}" r="${n2(s * 0.78)}" fill="${petalo}" stroke="${NAVY}" stroke-width="${n2(s * 0.16)}"/>` }
        return d + `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(s * 0.62)}" fill="${centro}" stroke="${NAVY}" stroke-width="${n2(s * 0.16)}"/>`
      }
      return flor(X(-0.12), Y(-0.3), r * 0.085, rol % 2 ? c0 : c1, c2) + flor(X(0.36), Y(-0.02), r * 0.055, rol % 2 ? c1 : c0, c2)
    }
    case 'semillas':
      return [[-0.38, -0.38], [-0.05, -0.5], [0.3, -0.38], [-0.45, -0.05], [-0.15, -0.18], [0.17, -0.12], [0.45, -0.02], [0.0, 0.12]].map(([x, y]) =>
        `<ellipse cx="${X(x)}" cy="${Y(y)}" rx="${R(0.033)}" ry="${R(0.055)}" fill="${c0}" transform="rotate(${n2(x * 30)} ${X(x)} ${Y(y)})"/>`).join('')
    case 'brotes': {
      const [lila, tallo] = p.colores
      let s = `<path d="M${X(-0.02)} ${Y(0.02)} Q${X(0.02)} ${Y(-0.25)} ${X(-0.04)} ${Y(-0.55)}" fill="none" stroke="${tallo}" stroke-width="${R(0.035)}" stroke-linecap="round"/>`
      for (const [x, y, a] of [[-0.04, -0.55, 0], [-0.1, -0.46, -30], [0.03, -0.44, 30], [-0.08, -0.34, -30], [0.05, -0.32, 30], [-0.05, -0.22, -25], [0.05, -0.2, 25]])
        s += `<ellipse cx="${X(x)}" cy="${Y(y)}" rx="${R(0.035)}" ry="${R(0.055)}" fill="${lila}" transform="rotate(${a} ${X(x)} ${Y(y)})"/>`
      return s + `<circle cx="${X(0.4)}" cy="${Y(-0.1)}" r="${R(0.03)}" fill="${lila}" opacity="0.7"/><circle cx="${X(-0.42)}" cy="${Y(-0.2)}" r="${R(0.025)}" fill="${lila}" opacity="0.7"/>`
    }
    case 'hojas': {
      const hoja = (x, y, s, a) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M${n2(-s)} 0 Q0 ${n2(-s * 0.7)} ${n2(s)} 0 Q0 ${n2(s * 0.7)} ${n2(-s)} 0Z" fill="${c0}" stroke="${NAVY}" stroke-width="${n2(s * 0.12)}" stroke-linejoin="round"/><path d="M${n2(-s * 0.8)} 0 L${n2(s * 0.7)} 0" stroke="${c1}" stroke-width="${n2(s * 0.1)}" stroke-linecap="round"/></g>`
      return hoja(X(-0.05), Y(-0.32), r * 0.2, -35 + rol * 9) + hoja(X(0.38), Y(-0.02), r * 0.11, 20)
    }
    case 'destellos':
      return destello(X(-0.12), Y(-0.36), r * 0.15, c0) + (p.cantidad > 1 ? destello(X(0.34), Y(-0.08), r * 0.08, c0) : '') + (p.cantidad > 2 ? destello(X(-0.42), Y(-0.02), r * 0.06, c0) : '')
    case 'rombos':
      return `<path d="M${X(0)} ${Y(-0.62)} L${X(0.2)} ${Y(-0.37)} L${X(0)} ${Y(-0.12)} L${X(-0.2)} ${Y(-0.37)}Z" fill="${c0}" stroke="${NAVY}" stroke-width="${R(0.035)}" stroke-linejoin="round"/>`
    case 'estrellas5':
      return estrella5(X(-0.1), Y(-0.36), r * 0.13, c0) + estrella5(X(0.32), Y(-0.1), r * 0.08, c0) + `<circle cx="${X(-0.42)}" cy="${Y(-0.08)}" r="${R(0.03)}" fill="${c0}"/><circle cx="${X(0.2)}" cy="${Y(-0.56)}" r="${R(0.025)}" fill="${c0}"/>`
    case 'zigzag': {
      const pts = []
      for (let i = 0; i <= 6; i++) pts.push(`${n2((-1 + i / 3) * r)} ${n2((-0.22 + (i % 2 ? -0.13 : 0.06)) * r)}`)
      return `<path d="M${pts.join(' L')}" fill="none" stroke="${c0}" stroke-width="${R(0.11)}" stroke-linejoin="round" stroke-linecap="round"/>`
    }
    case 'franja':
      return `<path d="M${n2(-r)} ${Y(-0.02)} C${n2(-0.6 * r)} ${Y(-0.2)} ${n2(-0.3 * r)} ${Y(0.12)} 0 ${Y(-0.04)} S${n2(0.6 * r)} ${Y(-0.18)} ${n2(r)} ${Y(-0.02)}" fill="none" stroke="${c0}" stroke-width="${R(0.12)}" stroke-linecap="round"/>`
    case 'nubes': {
      const nube = (x, y, s) => `<g fill="${c0}"><circle cx="${n2(x - s)}" cy="${n2(y)}" r="${n2(s * 0.75)}"/><circle cx="${n2(x)}" cy="${n2(y - s * 0.35)}" r="${n2(s)}"/><circle cx="${n2(x + s)}" cy="${n2(y)}" r="${n2(s * 0.7)}"/><rect x="${n2(x - s)}" y="${n2(y - s * 0.1)}" width="${n2(2 * s)}" height="${n2(s * 0.85)}"/></g>`
      return nube(X(-0.2), Y(-0.12), r * 0.15) + nube(X(0.36), Y(-0.42), r * 0.09)
    }
    case 'pecas':
      return [[-0.36, -0.42], [-0.22, -0.5], [-0.3, -0.3], [0.12, -0.46], [0.24, -0.36], [0.32, -0.5], [0.4, -0.12], [-0.42, -0.08]].map(([x, y]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="${R(0.028)}" fill="${c0}"/>`).join('')
    default: return ''
  }
}

/**
 * Inserta el patrón de la variante en cada segmento de la base (doc DOM): detrás del
 * núcleo (las superficies B11 quedan encima) y recortado con el mismo clip del núcleo.
 */
export function aplicarPatronBase(doc, v) {
  if (!v.patron) return
  const ids = ['tail', 'mint-back', 'yellow-middle', 'orange-middle', 'mint-front', 'segmento-d']
  ids.forEach((id, rol) => {
    const g = doc.getElementById(id)
    const r = Number(g?.getAttribute('data-nucleo'))
    if (!g || !r) return
    const nucleo = [...g.children].find((n) => n.localName === 'g' && n.getAttribute('clip-path') === `url(#clip-${id})`)
    const k = v.patron.escala || 1, cy = n2(-0.3 * (r - 3))
    const dentro = k === 1 ? patronSVG(v.patron, r - 3, rol) : `<g transform="translate(0 ${cy}) scale(${k}) translate(0 ${-cy})">${patronSVG(v.patron, r - 3, rol)}</g>`
    const frag = new DOMParser().parseFromString(`<svg xmlns="${NS}"><g clip-path="url(#clip-${id})" data-patron-variante="${v.patron.tipo}">${dentro}</g></svg>`, 'image/svg+xml')
    const capa = doc.importNode(frag.documentElement.firstChild, true)
    g.insertBefore(capa, nucleo ?? null)
  })
}

// ── Ojos k3 «Atardecer» del Camaleón (capa compartida por todas las variantes) ──
// Construcción: torretas del concepto k3 (recortadas sin redibujar, con el ojo
// sustituido por un párpado) + ojos vectoriales B03 encima, colocados donde están
// en k3. Para que el parpadeo del rig (que escala cada ojo sobre su centro B03 y
// dibuja la línea del párpado allí) siga funcionando, se mueve el GRUPO #eyes entero
// con una transformación de semejanza E (lleva los dos centros B03 a los de k3) y
// dentro de cada ojo se escala su contenido sobre su propio centro (G), así el
// tamaño final es el de k3 (izquierdo grande, derecho más chico en perspectiva).
const OJOS_B03 = [[708, 342, 33, 39], [808, 320, 27, 35]]
let ojosK3 = null
/** Carga el manifiesto de los ojos k3 y tiñe las torretas para la variante. */
export async function prepararOjosK3(v) {
  if (!ojosK3) ojosK3 = fetch(new URL('camaleon/ojos-k3/manifiesto.json', RECURSOS)).then((r) => { if (!r.ok) throw Error('Faltan los ojos k3'); return r.json() })
  const m = await ojosK3
  const torretas = {}
  for (const [id, t] of Object.entries(m.torretas)) {
    const href = new URL(`camaleon/ojos-k3/${t.archivo}`, RECURSOS).href
    torretas[id] = { ...t, url: v.torreta ? await tenirVariante(href, 'torreta', { id: v.id, colores: v.torreta }, id) : href }
  }
  return { torretas, parpado: v.torreta?.borde ?? m.torretas['torreta-izq'].colorParpado }
}

/** Semejanza que lleva los centros B03 a los ojos de k3: { a, b, tx, ty, s } (x' = a x − b y + tx). */
function semejanza(destinos) {
  const [[x1, y1], [x2, y2]] = OJOS_B03, [[u1, v1], [u2, v2]] = destinos
  const dx = x2 - x1, dy = y2 - y1, du = u2 - u1, dv = v2 - v1, n = dx * dx + dy * dy
  const a = (dx * du + dy * dv) / n, b = (dx * dv - dy * du) / n
  return { a, b, tx: u1 - (a * x1 - b * y1), ty: v1 - (b * x1 + a * y1), s: Math.hypot(a, b) }
}
const lado = (n) => {
  const c = n.getAttribute('data-component')
  if (c === 'eye-0') return 0
  if (c === 'eye-1') return 1
  const m = /-?\d+(\.\d+)?/.exec(n.querySelector('[d]')?.getAttribute('d') || n.getAttribute('d') || n.querySelector('[cx]')?.getAttribute('cx') || '')
  return m && +m[0] < 760 ? 0 : 1
}
/** Cejas k3: desplazamiento de cada ceja B03 hasta donde están en el concepto (sobre la torreta izquierda y entre los ojos). */
const CEJAS_K3 = [[4, -18], [-6, -22]]

/**
 * Aplica los ojos k3 en la cabeza ya compuesta (con la expresión B03 en #eyes y #b03-brows).
 * `ajustada`: con lentes o máscara con agujeros, los ojos se quedan en su sitio B03
 * (para que coincidan con lentes y agujeros) y las torretas se centran en ellos.
 */
export function aplicarOjosK3(doc, cabeza, k3, { ajustada = false } = {}) {
  const ojos = cabeza.querySelector('[id="eyes"]')
  if (!ojos || ojos.hasAttribute('data-hidden') || !ojos.children.length) return // máscara que tapa: sin ojos ni torretas
  const t = [k3.torretas['torreta-izq'], k3.torretas['torreta-der']]
  const destinos = t.map((x) => x.ojo.slice(0, 2))
  const E = ajustada ? { a: 1, b: 0, tx: 0, ty: 0, s: 1 } : semejanza(destinos)
  const visibles = OJOS_B03.map(([x, y]) => [E.a * x - E.b * y + E.tx, E.b * x + E.a * y + E.ty])
  // Torretas detrás de los ojos (y de las cejas), centradas en el ojo visible.
  const gt = doc.createElementNS(NS, 'g')
  gt.setAttribute('data-rasgo', 'torretas'); gt.setAttribute('data-ojos', 'k3')
  t.forEach((x, i) => {
    const [ex, ey] = x.ojo, [vx, vy] = visibles[i], [X, Y, W, H] = x.encuadre
    const im = doc.createElementNS(NS, 'image')
    for (const [k, val] of Object.entries({ x: n2(X + vx - ex), y: n2(Y + vy - ey), width: W, height: H, href: x.url, preserveAspectRatio: 'none', 'data-pieza': 'torreta-k3-' + i })) im.setAttribute(k, String(val))
    gt.append(im)
  })
  ojos.parentNode.insertBefore(gt, ojos)
  // Párpados cerrados (B03 rellena con el naranja de la paleta): color del borde de la torreta.
  for (const n of ojos.querySelectorAll('[fill="#ff9e32"]')) n.setAttribute('fill', k3.parpado)
  if (ajustada) return
  ojos.setAttribute('transform', `matrix(${n2(E.a * 1000) / 1000} ${n2(E.b * 1000) / 1000} ${n2(-E.b * 1000) / 1000} ${n2(E.a * 1000) / 1000} ${n2(E.tx)} ${n2(E.ty)})`)
  ojos.setAttribute('data-ojos', 'k3')
  // Tamaño de cada ojo: el de k3 (G sobre su centro B03, que es el que usa el rig).
  // +3 u: el ojo llena el párpado y deja solo un aro fino (como en k3).
  const G = t.map((x, i) => Math.min((x.ojo[2] + 3) / OJOS_B03[i][2], (x.ojo[3] + 3) / OJOS_B03[i][3]) / E.s)
  for (const hijo of [...ojos.children]) {
    if (hijo.localName === 'defs') continue
    const i = lado(hijo), [cx, cy] = OJOS_B03[i], k = n2(G[i] * 1000) / 1000
    const w = doc.createElementNS(NS, 'g')
    w.setAttribute('transform', `translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})`)
    w.append(...hijo.childNodes)
    hijo.append(w)
  }
  // Cejas: cada trazo de la B03 se separa y se lleva a su sitio k3 (el rig mueve el grupo entero).
  const cejas = cabeza.querySelector('[id="b03-brows"]')
  if (cejas) {
    for (const p of [...cejas.querySelectorAll('path')]) {
      const trazos = (p.getAttribute('d') || '').split(/(?=M)/).filter((x) => x.trim())
      for (const d of trazos) {
        const i = +(/-?\d+(\.\d+)?/.exec(d)?.[0] ?? 0) < 760 ? 0 : 1
        const c = p.cloneNode(false)
        c.setAttribute('d', d.trim())
        c.setAttribute('transform', `translate(${CEJAS_K3[i][0]} ${CEJAS_K3[i][1]})`)
        p.parentNode.insertBefore(c, p)
      }
      p.remove()
    }
  }
}
