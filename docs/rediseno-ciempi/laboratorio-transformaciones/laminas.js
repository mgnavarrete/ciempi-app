// Láminas de evidencia del laboratorio de transformaciones (se capturan con
// scripts/transformaciones/capturar-evidencia.cjs). Parámetros:
//   ?tipo=crecimiento|accesorios|comparacion|detalle|conjuntos&especie=dragon&fondo=claro
import { ESPECIES } from './especies.js'
import { etiquetar } from './gen/compatibilidad.js'
import { aApariencia } from './especies.js'
import { env, INICIAL, escenaDe, dibujar, nuevoRig, mostrarError } from './nucleo.js'
import { ANIMACIONES } from '../../../src/ciempi/v2/animacion/animaciones.js'
import { poseConInercia } from '../../../src/ciempi/v2/animacion/motor.js'

const p = new URLSearchParams(location.search)
const tipo = p.get('tipo') || 'crecimiento'
const especie = p.get('especie') in ESPECIES ? p.get('especie') : 'dragon'
if (p.get('fondo') === 'oscuro') document.body.dataset.fondo = 'oscuro'
const raiz = document.querySelector('#lamina')
const el = (tag, attrs = {}, ...hijos) => { const n = document.createElement(tag); Object.assign(n, attrs); n.append(...hijos); return n }
const celda = (svg, texto) => el('figure', { className: 'celda' }, svg, el('figcaption', { textContent: texto }))
const nombre = (id) => ESPECIES[id].nombre
const fondoTxt = document.body.dataset.fondo === 'oscuro' ? 'fondo oscuro' : 'fondo claro'

/** Universales, adaptables y exclusivos que se revisan (ids del compositor). */
export const MUESTRAS = [
  ['Gorro mago (B06)', { cabeza: 'b06-ia-mago' }],
  ['Gorro jockey (B06)', { cabeza: 'b06-ia-jockey' }],
  ['Máscara gatita (B07)', { cabeza: 'b07-ia-gatita' }],
  ['Máscara robot completa (B07)', { cabeza: 'b07-ia-robot' }],
  ['Lentes redondos (B04)', { cara: 'b04-redondos' }],
  ['Visor opaco (B04)', { cara: 'b04-visor' }],
  ['Peinado coletas (B05)', { pelo: 'b05-coletas' }],
  ['Bufanda B01', { cuello: 'bufanda-calco32', variante: 'gryffindor' }],
  ['Gesto guiño (B03)', { expresion: 'b03-guino' }],
  ['Ojos verdes + dormilón (B03)', { ojos: 'verde', expresion: 'b03-dormilon' }],
  ['Paleta Océano', { paleta: 'oceano' }],
  ['Paleta Noche mágica', { paleta: 'noche' }],
  ['Calzado deportiva (B10)', { pies: 'b10-deportiva' }],
  ['Superficie draco (B11)', { textura: 'b11-draco' }],
  ['Capa heroica (B08)', { espalda: 'b08-ia-heroica' }],
  ['Mochila aventura (B09)', { espalda: 'b09-aventura' }],
  ['Alitas de dragón (exclusivo)', { espalda: 'dragon-alas' }],
]
const PARTE_DE = { paleta: 'paleta', expresion: 'gesto', ojos: 'ojos', cabeza: 'cabeza', cara: 'cara', pelo: 'pelo', cuello: 'cuello', espalda: 'espalda', pies: 'pies', textura: 'textura' }
function etiquetas(sel, esp) {
  const a = aApariencia(sel)
  const sueltas = Object.keys(sel).filter((k) => PARTE_DE[k] && sel[k] !== INICIAL[k])
  return sueltas.map((k) => { const e = etiquetar(PARTE_DE[k], a[PARTE_DE[k]], esp); return e.visible ? e.tipo : 'oculto' }).join(' + ')
}

async function crecimiento() {
  raiz.append(el('h1', { textContent: `${nombre(especie)} · crecimiento modular (A→B→C→D, cola y frente únicos)` }),
    el('p', { textContent: `Misma escala en todas las vistas (alto 180 px = 800 unidades). Sin accesorios, paleta clásica, ${fondoTxt}. Laboratorio, pendiente de aprobación.` }))
  for (const n of [0, 1, 2, 5, 8, 12, 22, 40]) {
    const e = await escenaDe(especie, INICIAL, n)
    raiz.append(el('div', { className: 'fila-lamina' }, celda(dibujar(e, { alto: 180 }).svg, `N = ${n}`)))
  }
}

async function accesorios() {
  raiz.append(el('h1', { textContent: `${nombre(especie)} · accesorios aprobados (universales, adaptables, exclusivos)` }),
    el('p', { textContent: `N = 5, 320 px de ancho, ${fondoTxt}. La etiqueta es la que calcula compatibilidad.ts para esta especie.` }))
  const rejilla = el('div', { className: 'rejilla' })
  raiz.append(rejilla)
  for (const [texto, extra] of [['Sin accesorios', {}], ...MUESTRAS]) {
    const sel = { ...INICIAL, ...extra }
    const e = await escenaDe(especie, sel, 5)
    rejilla.append(celda(dibujar(e, { ancho: 320 }).svg, `${texto} — ${etiquetas(sel, especie) || 'base'}`))
  }
}

async function comparacion() {
  raiz.append(el('h1', { textContent: `Comparación con Ciempi · ${fondoTxt}` }),
    el('p', { textContent: 'Sin accesorios, misma longitud por fila. 84 px de alto = pista de lectura real; 240 y 320 px de ancho.' }))
  for (const n of [5, 12]) {
    for (const t of [{ alto: 84 }, { ancho: 240 }, { ancho: 320 }]) {
      if (n === 12 && !t.alto) continue
      const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: `N = ${n} · ${t.alto ? '84 px de alto' : t.ancho + ' px de ancho'}` }))
      for (const id of ['ciempi', 'dragon', 'cuncuna']) fila.append(celda(dibujar(await escenaDe(id, INICIAL, n), t).svg, nombre(id)))
      raiz.append(fila)
    }
  }
  const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: 'Siluetas a 84 px de alto (N = 5)' }))
  for (const id of ['ciempi', 'dragon', 'cuncuna']) {
    const { svg } = dibujar(await escenaDe(id, INICIAL, 5), { alto: 84 })
    svg.style.filter = 'brightness(0)'
    fila.append(celda(svg, nombre(id) + ' (silueta)'))
  }
  raiz.append(fila)
}

async function detalle() {
  raiz.append(el('h1', { textContent: `${nombre(especie)} · detalle de anclajes (ampliado)` }),
    el('p', { textContent: `N = 5; recortes del mismo dibujo a 2,4 px por unidad. Con calzado B10 y bufanda B01 en la segunda fila. ${fondoTxt}.` }))
  const recortes = [['Cuello y cabeza', [520, 100, 400, 420]], ['Patas centrales', [180, 380, 420, 220]], ['Cola', [-20, 250, 330, 340]]]
  for (const [titulo, sel] of [['Sin accesorios', INICIAL], ['Calzado deportiva + bufanda + gorro mago', { ...INICIAL, pies: 'b10-deportiva', cuello: 'bufanda-calco32', cabeza: 'b06-ia-mago' }], ['Superficie draco + capa', { ...INICIAL, textura: 'b11-draco', espalda: especie === 'dragon' ? 'dragon-alas' : 'b08-ia-heroica' }]]) {
    const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: titulo }))
    for (const [t, vb] of recortes) {
      const { svg } = dibujar(await escenaDe(especie, sel, 5))
      svg.setAttribute('viewBox', vb.join(' '))
      svg.setAttribute('width', Math.round(vb[2] * 0.9)); svg.setAttribute('height', Math.round(vb[3] * 0.9))
      fila.append(celda(svg, t))
    }
    raiz.append(fila)
  }
}

async function conjuntos() {
  raiz.append(el('h1', { textContent: `${nombre(especie)} · conjuntos aprobados (B12)` }),
    el('p', { textContent: `N = 5, 320 px de ancho, ${fondoTxt}.` }))
  const rejilla = el('div', { className: 'rejilla' })
  raiz.append(rejilla)
  for (const s of env.sets) {
    const sel = { ...INICIAL, ...s.seleccion }
    rejilla.append(celda(dibujar(await escenaDe(especie, sel, 5), { ancho: 320 }).svg, s.nombre))
  }
}

async function animacion() {
  raiz.append(el('h1', { textContent: `${nombre(especie)} · rig de animación del juego (cuadros congelados)` }),
    el('p', { textContent: `N = 8, 240 px de ancho, mismo rig (rig.js) y poses deterministas (animaciones.js) que Ciempi. ${fondoTxt}.` }))
  for (const id of ['A02', 'A03', 'A06', 'A10', 'E04']) {
    const anim = ANIMACIONES.find((a) => a.id === id)
    const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: `${anim.id} · ${anim.nombre}` }))
    for (let i = 0; i < 6; i++) {
      const t = (anim.duracion * i) / 6
      const e = await escenaDe(especie, INICIAL, 8)
      const { svg, g } = dibujar(e, { ancho: 240 })
      fila.append(celda(svg, `t = ${t.toFixed(2).replace('.', ',')} s`))
      const rig = nuevoRig(e, g)
      const pose = poseConInercia(anim, t, 8)
      if (pose.expresion) rig.cambiarRostro(pose.expresion)
      rig.aplicar(pose)
    }
    raiz.append(fila)
  }
}

try {
  await ({ crecimiento, accesorios, comparacion, detalle, conjuntos, animacion })[tipo]()
  // Espera a que carguen todas las imágenes raster antes de capturar.
  await Promise.all([...document.querySelectorAll('image')].map((im) => new Promise((ok) => {
    const href = im.getAttribute('href'); if (!href) return ok()
    const i = new Image(); i.onload = i.onerror = ok; i.src = href
  })))
  document.body.dataset.cargado = '1'
} catch (e) { mostrarError(e); document.body.dataset.cargado = 'error' }
