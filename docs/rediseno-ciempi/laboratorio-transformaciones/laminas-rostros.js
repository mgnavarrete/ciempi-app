// Láminas antes (rostro v1) / después (rostro v4) del Dragón y la Cuncuna.
// LABORATORIO. Se capturan con scripts/transformaciones/capturar-rostros-v4.cjs. Parámetros:
//   ?tipo=crecimiento|expresiones|accesorios|tamanos|animacion|ciempi&especie=dragon|cuncuna&fondo=claro|oscuro
import { ESPECIES } from './especies.js'
import { env, INICIAL, escenaDe, dibujar, nuevoRig, mostrarError } from './nucleo.js'
import { ANIMACIONES } from '../../../src/ciempi/v2/animacion/animaciones.js'
import { poseConInercia } from '../../../src/ciempi/v2/animacion/motor.js'

const p = new URLSearchParams(location.search)
const tipo = p.get('tipo') || 'crecimiento'
const especie = ['dragon', 'cuncuna'].includes(p.get('especie')) ? p.get('especie') : 'dragon'
if (p.get('fondo') === 'oscuro') document.body.dataset.fondo = 'oscuro'
const raiz = document.querySelector('#lamina')
const el = (tag, attrs = {}, ...hijos) => { const n = document.createElement(tag); Object.assign(n, attrs); n.append(...hijos); return n }
const celda = (svg, texto) => el('figure', { className: 'celda' }, svg, el('figcaption', { textContent: texto }))
const nombre = ESPECIES[especie].nombre
const fondoTxt = document.body.dataset.fondo === 'oscuro' ? 'fondo oscuro' : 'fondo claro'
// ?it=2: iteración 2 (v4b) frente a v1 y v4.
const IT2 = p.get('it') === '2'
const VERS = IT2 ? ['v1', 'v4', 'v4b'] : ['v1', 'v4']
const NUEVA = IT2 ? 'v4b' : 'v4'
const TXT = IT2 ? { v1: 'rostro v1', v4: 'v4 (iteración 1)', v4b: 'v4b (iteración 2)' } : { v1: 'antes · rostro v1', v4: 'después · rostro v4' }
const sel = (v, extra = {}) => ({ ...INICIAL, ...extra, rostro: v })
const CABEZA = [575, 150, 330, 330]
const titulo = (t, sub) => raiz.append(el('h1', { textContent: `${nombre} · ${t}` }), el('p', { textContent: `${sub} ${fondoTxt}. Laboratorio, pendiente de aprobación del usuario.` }))
const recorte = (svg, vb, ancho) => { svg.setAttribute('viewBox', vb.join(' ')); svg.setAttribute('width', ancho); svg.setAttribute('height', Math.round(ancho * vb[3] / vb[2])); return svg }

async function crecimiento() {
  titulo('crecimiento con rostro v1 y v4', 'Misma escala (alto 160 px = 800 unidades), sin accesorios, Alegre. Solo cambia el rostro: cuerpo, cola y patas idénticos.')
  for (const n of [0, 1, 5, 12, 40]) {
    const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: `N = ${n}` }))
    for (const v of VERS) fila.append(celda(dibujar(await escenaDe(especie, sel(v), n), { alto: 160 }).svg, TXT[v]))
    raiz.append(fila)
  }
}

async function expresiones() {
  titulo('14 expresiones B03', 'Cabeza ampliada (recorte del mismo dibujo, N = 5). Arriba de cada par v1, abajo v4.')
  for (const v of VERS) {
    const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: TXT[v] }))
    for (const f of env.facial) fila.append(celda(recorte(dibujar(await escenaDe(especie, sel(v, { expresion: f.id }), 5)).svg, CABEZA, 150), f.nombre))
    raiz.append(fila)
  }
  const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: `Gestos a 84 px de alto (pista), ${NUEVA}` }))
  for (const id of ['b03-alegre', 'b03-carcajada', 'b03-sorprendido', 'b03-guino', 'b03-triste', 'b03-dormilon', 'b03-orgulloso', 'b03-asustado'])
    fila.append(celda(dibujar(await escenaDe(especie, sel(NUEVA, { expresion: id }), 5), { alto: 84 }).svg, id.slice(4)))
  raiz.append(fila)
}

export const CABEZA_ACC = [
  ['Sin accesorios', {}], ['Gorro mago (B06)', { cabeza: 'b06-ia-mago' }], ['Gorro jockey (B06)', { cabeza: 'b06-ia-jockey' }],
  ['Máscara gatita, parcial (B07)', { cabeza: 'b07-ia-gatita' }], ['Máscara búho, parcial (B07)', { cabeza: 'b07-ia-buho' }], ['Máscara robot, tapa el rostro (B07)', { cabeza: 'b07-ia-robot' }],
  ['Lentes redondos (B04)', { cara: 'b04-redondos' }], ['Visor opaco (B04)', { cara: 'b04-visor' }], ['Peinado coletas (B05)', { pelo: 'b05-coletas' }],
  ['Bufanda B01 + gorro mago', { cuello: 'bufanda-calco32', variante: 'gryffindor', cabeza: 'b06-ia-mago' }],
  ['Lentes redondos + guiño', { cara: 'b04-redondos', expresion: 'b03-guino' }], ['Paleta Océano', { paleta: 'oceano' }],
]
async function accesorios() {
  titulo('accesorios de cabeza', 'Cabeza ampliada (N = 5); debajo, la criatura entera a 320 px de ancho. Las máscaras que tapan el rostro lo ocultan también en v4.')
  for (const [texto, extra] of CABEZA_ACC) {
    const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: texto }))
    for (const v of VERS) {
      const e = await escenaDe(especie, sel(v, extra), 5)
      fila.append(celda(recorte(dibujar(e).svg, [560, 40, 370, 450], 200), TXT[v]), celda(dibujar(e, { ancho: 320 }).svg, TXT[v] + ' · 320 px'))
    }
    raiz.append(fila)
  }
}

async function tamanos() {
  titulo('tamaños de uso', '84 px de alto (pista de lectura real) y 320 px de ancho, N = 5 y N = 12, Alegre.')
  for (const n of [5, 12]) for (const t of [{ alto: 84 }, { ancho: 320 }]) {
    const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: `N = ${n} · ${t.alto ? '84 px de alto' : '320 px de ancho'}` }))
    for (const v of VERS) fila.append(celda(dibujar(await escenaDe(especie, sel(v), n), t).svg, TXT[v]))
    fila.append(celda(dibujar(await escenaDe('ciempi', sel('v1'), n), t).svg, 'Ciempi (referencia)'))
    raiz.append(fila)
  }
}

async function animacion() {
  titulo('rig de animación con rostro v4 (cuadros congelados)', 'N = 5, cabeza ampliada; mismo rig (rig.js) y poses (animaciones.js) que Ciempi. Fila de v1 como referencia en E08.')
  const n = NUEVA
  const casos = [['A01', 'Reposo · parpadeo', [1.2, 1.32, 1.385, 1.42, 1.5, 1.6], n], ['E08', 'Comer (boca sorprendida, AD-018)', [0, 0.16, 0.28, 0.36, 0.5, 0.7], n],
    ['E08', 'Comer · rostro v1 (referencia)', [0, 0.16, 0.28, 0.36, 0.5, 0.7], 'v1'], ['A10', 'Victoria (sorprendido → carcajada → orgulloso)', [0.3, 0.7, 1.2, 2.4, 2.8, 3.2], n],
    ['A04', 'Saludar (guiño)', [0.5, 1.0, 1.2, 1.4, 1.6, 2.2], n], ['A06', 'Dormir', [0.5, 2, 3.5], n]]
  for (const [id, texto, tiempos, v] of casos) {
    const anim = ANIMACIONES.find((a) => a.id === id)
    const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: `${id} · ${texto}` }))
    for (const t of tiempos) {
      const e = await escenaDe(especie, sel(v), 5)
      const { svg, g } = dibujar(e)
      const rig = nuevoRig(e, g)
      const pose = poseConInercia(anim, t, 5)
      if (pose.expresion) rig.cambiarRostro(pose.expresion)
      rig.aplicar(pose)
      fila.append(celda(recorte(svg, [540, 60, 420, 440], 170), `t = ${t.toFixed(2).replace('.', ',')} s${pose.expresion ? ' · ' + pose.expresion.slice(4) : ''}`))
    }
    raiz.append(fila)
  }
}

async function ciempi() {
  raiz.append(el('h1', { textContent: `Rostros: Ciempi · Dragón ${NUEVA} · Cuncuna ${NUEVA}` }), el('p', { textContent: `Diferenciación del rostro. Cabeza ampliada y criatura a 84 px de alto. ${fondoTxt}.` }))
  for (const exp of ['b03-alegre', 'b03-sorprendido', 'b03-triste', 'b03-dormilon', 'b03-orgulloso']) {
    const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: exp.slice(4) }))
    for (const [id, v] of [['ciempi', 'v1'], ...['dragon', 'cuncuna'].flatMap((e) => VERS.map((v) => [e, v]))])
      fila.append(celda(recorte(dibujar(await escenaDe(id, sel(v, { expresion: exp }), 5)).svg, [560, 60, 370, 430], 170), `${ESPECIES[id].nombre}${id === 'ciempi' ? '' : ' · ' + v}`))
    raiz.append(fila)
  }
  const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: '84 px de alto, N = 5' }))
  for (const [id, v] of [['ciempi', 'v1'], ...['dragon', 'cuncuna'].flatMap((e) => VERS.filter((x) => x !== 'v1').map((x) => [e, x]))]) fila.append(celda(dibujar(await escenaDe(id, sel(v), 5), { alto: 84 }).svg, `${ESPECIES[id].nombre}${id === 'ciempi' ? '' : ' · ' + v}`))
  raiz.append(fila)
}

try {
  await ({ crecimiento, expresiones, accesorios, tamanos, animacion, ciempi })[tipo]()
  await Promise.all([...document.querySelectorAll('image')].map((im) => new Promise((ok) => {
    const href = im.getAttribute('href'); if (!href) return ok()
    const i = new Image(); i.onload = i.onerror = ok; i.src = href
  })))
  document.body.dataset.cargado = '1'
} catch (e) { mostrarError(e); document.body.dataset.cargado = 'error' }
