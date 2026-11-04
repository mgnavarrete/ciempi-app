// Láminas de evidencia V4 · mochilas (B09) y calzado (B10) sobre Ciempi, Dragón y Cuncuna.
// Las captura scripts/transformaciones/capturar-accesorios-v4.cjs. Parámetros:
//   ?tipo=piezas|detalle|crecimiento|animacion|especies
//   &familia=mochilas|zapatos  &especie=ciempi|dragon|cuncuna  &fondo=claro|oscuro
//   &accesorios=v1|v4   (v1 = vestuario del juego tal cual; v4 = construcción nueva del laboratorio)
import { ESPECIES } from './especies.js'
import { env, INICIAL, escenaDe, dibujar, nuevoRig, mostrarError } from './nucleo.js'
import { ANIMACIONES } from '../../../src/ciempi/v2/animacion/animaciones.js'
import { poseConInercia } from '../../../src/ciempi/v2/animacion/motor.js'

const p = new URLSearchParams(location.search)
const tipo = p.get('tipo') || 'piezas'
const familia = p.get('familia') === 'zapatos' ? 'zapatos' : 'mochilas'
const especie = p.get('especie') in ESPECIES ? p.get('especie') : 'ciempi'
const version = p.get('accesorios') === 'v4' ? 'v4' : 'v1'
if (p.get('fondo') === 'oscuro') document.body.dataset.fondo = 'oscuro'
const fondoTxt = document.body.dataset.fondo === 'oscuro' ? 'fondo oscuro' : 'fondo claro'
const raiz = document.querySelector('#lamina')
const el = (tag, attrs = {}, ...hijos) => { const n = document.createElement(tag); Object.assign(n, attrs); n.append(...hijos); return n }
const celda = (svg, texto) => el('figure', { className: 'celda' }, svg, el('figcaption', { textContent: texto }))
const anim = (id) => ANIMACIONES.find((a) => a.id === id)
const MOCHILAS = env.bags.map((b) => [b.nombre + ' · ' + b.id, { espalda: b.id }])
const ZAPATOS = env.footwear.map((z) => [z.nombre + ' · ' + z.id, { pies: z.id }])
/** Parejas temáticas mochila + calzado (misma colección). */
const PAREJAS = [['robot', 'robot'], ['aventura', 'aventura'], ['draco', 'lluvia'], ['mago', 'mago'], ['raton', 'deportiva']]
  .map(([m, z]) => [`b09-${m} + b10-${z}`, { espalda: 'b09-' + m, pies: 'b10-' + z }])
const piezasDe = (f) => (f === 'zapatos' ? ZAPATOS : MOCHILAS)
/** Recortes de detalle, en unidades de la base (N = 5). */
const RECORTE = { mochilas: [330, 200, 360, 280], zapatos: [220, 430, 250, 160] }

function titulo(texto, nota) {
  raiz.append(el('h1', { textContent: `Accesorios ${version} · ${texto}` }),
    el('p', { textContent: `${nota} ${fondoTxt}. Laboratorio de transformaciones; ${version === 'v4' ? 'construcción v4 (laboratorio, pendiente de aprobación)' : 'vestuario del juego sin cambios (estado previo)'}.` }))
}

/** Dibuja una escena, opcionalmente animada en el instante t de una animación, y opcionalmente recortada. */
async function vista(esp, sel, n, { tam, a, t, recorte } = {}) {
  const e = await escenaDe(esp, { ...INICIAL, ...sel }, n)
  const { svg, g } = dibujar(e, tam || {})
  if (a) {
    const rig = nuevoRig(e, g)
    const pose = poseConInercia(a, t, n)
    if (pose.expresion) rig.cambiarRostro(pose.expresion)
    rig.aplicar(pose)
  }
  if (recorte) {
    svg.setAttribute('viewBox', recorte.join(' '))
    const k = tam?.k ?? 1
    svg.setAttribute('width', Math.round(recorte[2] * k)); svg.setAttribute('height', Math.round(recorte[3] * k))
  }
  return svg
}

async function piezas() {
  titulo(familia === 'mochilas' ? 'mochilas B09 sobre ' + ESPECIES[especie].nombre : 'calzado B10 sobre ' + ESPECIES[especie].nombre,
    'Por pieza: N = 5 y 12 a 320 px de ancho y 84 px de alto (pista), en reposo y caminando (A02, dos instantes).')
  const caminar = anim('A02')
  for (const [texto, sel] of [['Sin accesorio', {}], ...piezasDe(familia)]) {
    const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: texto }))
    for (const n of [5, 12]) fila.append(celda(await vista(especie, sel, n, { tam: { ancho: 320 } }), `N = ${n} · 320 px · reposo`))
    for (const n of [5, 12]) fila.append(celda(await vista(especie, sel, n, { tam: { alto: 84 } }), `N = ${n} · 84 px alto`))
    for (const f of [0.25, 0.7]) fila.append(celda(await vista(especie, sel, 12, { tam: { ancho: 320 }, a: caminar, t: caminar.duracion * f }), `N = 12 · caminar t = ${(caminar.duracion * f).toFixed(2)} s`))
    raiz.append(fila)
  }
}

async function detalle() {
  titulo(`detalle del anclaje (${familia}) · ${ESPECIES[especie].nombre}`,
    `N = 5, recorte ${RECORTE[familia].join(' ')} ampliado ×1,1 (unidades de la base); reposo, caminar (A02), tropezar (E04) y celebrar (A03).`)
  const instantes = [['reposo'], ['caminar', 'A02', 0.3], ['tropezar', 'E04', 0.35], ['tropezar', 'E04', 0.55], ['celebrar', 'A03', 0.4]]
  for (const [texto, sel] of [['Sin accesorio', {}], ...piezasDe(familia)]) {
    const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: texto }))
    for (const [nombre, id, f] of instantes) {
      const a = id ? anim(id) : null
      fila.append(celda(await vista(especie, sel, 5, { tam: { k: 1.1 }, a, t: a ? a.duracion * f : 0, recorte: RECORTE[familia] }), a ? `${nombre} t = ${(a.duracion * f).toFixed(2)} s` : nombre))
    }
    raiz.append(fila)
  }
}

async function crecimiento() {
  titulo(`crecimiento · ${ESPECIES[especie].nombre}`, 'Parejas mochila + calzado, N = 0, 1, 5, 12 y 40 con la misma escala (alto 130 px).')
  for (const [texto, sel] of PAREJAS) {
    const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: texto }))
    for (const n of [0, 1, 5, 12, 40]) fila.append(celda(await vista(especie, sel, n, { tam: { alto: 130 } }), `N = ${n}`))
    raiz.append(fila)
  }
}

async function animacion() {
  titulo(`animaciones · ${ESPECIES[especie].nombre}`, 'N = 12, 240 px de ancho, rig del juego; caminar A02, tropezar E04, celebrar A03, victoria A10, comer E08 (seis instantes).')
  const ids = ['A02', 'E04', 'A03', 'A10', 'E08']
  for (const [k, id] of ids.entries()) {
    const a = anim(id), [texto, sel] = PAREJAS[k % PAREJAS.length]
    const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: `${a.id} · ${a.nombre} · ${texto}` }))
    for (let i = 0; i < 6; i++) {
      const t = (a.duracion * (i + 0.5)) / 6
      fila.append(celda(await vista(especie, sel, 12, { tam: { ancho: 240 }, a, t }), `t = ${t.toFixed(2)} s`))
    }
    raiz.append(fila)
  }
}

async function especies() {
  titulo(`${familia} en las tres criaturas`, 'N = 5, 240 px de ancho, y detalle del anclaje (×0,8).')
  for (const [texto, sel] of piezasDe(familia)) {
    const fila = el('div', { className: 'fila-lamina' }, el('h2', { textContent: texto }))
    for (const id of ['ciempi', 'dragon', 'cuncuna']) fila.append(celda(await vista(id, sel, 5, { tam: { ancho: 240 } }), ESPECIES[id].nombre))
    for (const id of ['ciempi', 'dragon', 'cuncuna']) fila.append(celda(await vista(id, sel, 5, { tam: { k: 0.8 }, recorte: RECORTE[familia] }), ESPECIES[id].nombre + ' · detalle'))
    raiz.append(fila)
  }
}

try {
  await ({ piezas, detalle, crecimiento, animacion, especies })[tipo]()
  await Promise.all([...document.querySelectorAll('image')].map((im) => new Promise((ok) => {
    const href = im.getAttribute('href'); if (!href) return ok()
    const i = new Image(); i.onload = i.onerror = ok; i.src = href
  })))
  document.body.dataset.cargado = '1'
} catch (e) { mostrarError(e); document.body.dataset.cargado = 'error' }
