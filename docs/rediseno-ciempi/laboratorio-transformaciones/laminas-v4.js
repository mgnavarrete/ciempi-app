// Láminas de evidencia V4 (T03 Serpiente, T04 Camaleón). Se capturan con
// scripts/transformaciones/v4/capturar-evidencia-v4.cjs. Parámetros:
//   ?tipo=crecimiento|expresiones|accesorios|comer|animacion|comparacion|camuflaje&especie=serpiente|camaleon&fondo=claro|oscuro
// Usa el mismo núcleo que el laboratorio (nucleo.js → especies.js → criaturas-v4.js) y el rig del juego.
import { ESPECIES, aApariencia } from './especies.js'
import { etiquetar } from './gen/compatibilidad.js'
import { escenaCreciente } from './gen/pose.js'
import { env, INICIAL, escenaDe, dibujar, nuevoRig, mostrarError } from './nucleo.js'
import { ANIMACIONES, comer, COMER } from '../../../src/ciempi/v2/animacion/animaciones.js'
import { poseConInercia } from '../../../src/ciempi/v2/animacion/motor.js'
import { crearRig } from '../../../src/ciempi/v2/animacion/rig.js'

const p = new URLSearchParams(location.search)
const tipo = p.get('tipo') || 'crecimiento'
const especie = p.get('especie') in ESPECIES ? p.get('especie') : 'serpiente'
if (p.get('fondo') === 'oscuro') document.body.dataset.fondo = 'oscuro'
// Iteración de las criaturas V4: v2 (rostro propio, por omisión) o v1 (`?iter=v1`, para comparar).
const ITER = p.get('iter') === 'v1' ? 'v1' : 'v2'
const BASE = ITER === 'v1' ? { ...INICIAL, iter: 'v1' } : INICIAL
const raiz = document.querySelector('#lamina')
const el = (tag, attrs = {}, ...hijos) => { const n = document.createElement(tag); Object.assign(n, attrs); n.append(...hijos); return n }
const celda = (svg, texto) => el('figure', { className: 'celda' }, svg, el('figcaption', { textContent: texto }))
const nombre = (id) => ESPECIES[id].nombre
const fondoTxt = document.body.dataset.fondo === 'oscuro' ? 'fondo oscuro' : 'fondo claro'
const titulo = (h, t) => raiz.append(el('h1', { textContent: `${h} · iteración ${ITER}` }), el('p', { textContent: `${t} ${fondoTxt}. Laboratorio, pendiente de aprobación del usuario.` }))
const fila = (h) => { const f = el('div', { className: 'fila-lamina' }, el('h2', { textContent: h })); raiz.append(f); return f }

const MUESTRAS = [
  ['Gorro mago (B06)', { cabeza: 'b06-ia-mago' }],
  ['Gorro jockey (B06)', { cabeza: 'b06-ia-jockey' }],
  ['Máscara gatita (B07)', { cabeza: 'b07-ia-gatita' }],
  ['Máscara robot completa (B07)', { cabeza: 'b07-ia-robot' }],
  ['Lentes redondos (B04)', { cara: 'b04-redondos' }],
  ['Visor opaco (B04)', { cara: 'b04-visor' }],
  ['Peinado coletas (B05)', { pelo: 'b05-coletas' }],
  ['Bufanda B01', { cuello: 'bufanda-calco32', variante: 'gryffindor' }],
  ['Capa heroica (B08, espalda)', { espalda: 'b08-ia-heroica' }],
  ['Mochila aventura (B09)', { espalda: 'b09-aventura' }],
  ['Mochila robot (B09)', { espalda: 'b09-robot' }],
  ['Calzado deportiva (B10, pies)', { pies: 'b10-deportiva' }],
  ['Calzado mago (B10, pies)', { pies: 'b10-mago' }],
  ['Superficie draco (B11)', { textura: 'b11-draco' }],
  ['Paleta Océano', { paleta: 'oceano' }],
  ['Paleta Noche mágica', { paleta: 'noche' }],
]
const PARTE_DE = { paleta: 'paleta', expresion: 'gesto', ojos: 'ojos', cabeza: 'cabeza', cara: 'cara', pelo: 'pelo', cuello: 'cuello', espalda: 'espalda', pies: 'pies', textura: 'textura' }
function etiquetas(sel, esp) {
  const a = aApariencia(sel)
  return Object.keys(sel).filter((k) => PARTE_DE[k] && sel[k] !== BASE[k])
    .map((k) => { const e = etiquetar(PARTE_DE[k], a[PARTE_DE[k]], esp); return e.visible ? e.tipo : 'oculto' }).join(' + ')
}

async function crecimiento() {
  titulo(`${nombre(especie)} · crecimiento modular (cola y frente únicos, A→B→C→D)`, 'Misma escala (alto 180 px = 800 u), sin accesorios, paleta clásica,')
  for (const n of [0, 1, 2, 5, 12, 40]) fila(`N = ${n}`).append(celda(dibujar(await escenaDe(especie, BASE, n), { alto: 180 }).svg, `N = ${n}`))
  const f = fila('Tamaños de uso, N = 5 y 12')
  for (const n of [5, 12]) for (const t of [{ alto: 84 }, { ancho: 320 }]) f.append(celda(dibujar(await escenaDe(especie, BASE, n), t).svg, `N = ${n} · ${t.alto ? '84 px de alto' : '320 px de ancho'}`))
}

async function expresiones() {
  const ids = env.facial.filter((x) => x.id.startsWith('b03-')).map((x) => x.id)
  titulo(`${nombre(especie)} · expresiones B03`, 'N = 5, 240 px de ancho, recorte de cabeza a 2× debajo;')
  const r = el('div', { className: 'rejilla' }); raiz.append(r)
  for (const id of ids) r.append(celda(dibujar(await escenaDe(especie, { ...BASE, expresion: id }, 5), { ancho: 240 }).svg, id.slice(4)))
  const f = fila('Cabeza ampliada (encuadre 590–900 × 190–490)')
  for (const id of ids) {
    const { svg } = dibujar(await escenaDe(especie, { ...BASE, expresion: id }, 5))
    svg.setAttribute('viewBox', '590 190 310 300'); svg.setAttribute('width', 155); svg.setAttribute('height', 150)
    f.append(celda(svg, id.slice(4)))
  }
  if (especie === 'serpiente') {
    const g = fila('Lengüita opcional: con / sin (selección lengua: "no")')
    for (const id of ['b03-alegre', 'b03-carcajada', 'b03-guino']) for (const lengua of ['si', 'no']) {
      const { svg } = dibujar(await escenaDe(especie, { ...BASE, expresion: id, lengua }, 5))
      svg.setAttribute('viewBox', '590 190 310 300'); svg.setAttribute('width', 186); svg.setAttribute('height', 180)
      g.append(celda(svg, `${id.slice(4)} · lengua ${lengua}`))
    }
  }
}

async function accesorios() {
  titulo(`${nombre(especie)} · accesorios (cabeza, cara, cuello, espalda, mochila, pies, superficie, paletas)`, 'N = 5, 320 px de ancho; la etiqueta es la de compatibilidad.ts;')
  const r = el('div', { className: 'rejilla' }); raiz.append(r)
  for (const [texto, extra] of [['Sin accesorios', {}], ...MUESTRAS]) {
    const sel = { ...BASE, ...extra }
    r.append(celda(dibujar(await escenaDe(especie, sel, 5), { ancho: 320 }).svg, `${texto} — ${etiquetas(sel, especie) || 'base'}`))
  }
  const f = fila('Mochila y capa con N = 1, 12 y 40 (240 px)')
  for (const extra of [{ espalda: 'b09-aventura' }, { espalda: 'b08-ia-heroica' }]) for (const n of [1, 12, 40])
    f.append(celda(dibujar(await escenaDe(especie, { ...BASE, ...extra }, n), { ancho: 240 }).svg, `${extra.espalda} · N = ${n}`))
}

async function conjuntos() {
  titulo(`${nombre(especie)} · conjuntos B12`, 'N = 5, 240 px de ancho;')
  const r = el('div', { className: 'rejilla' }); raiz.append(r)
  for (const s of env.sets) r.append(celda(dibujar(await escenaDe(especie, { ...BASE, ...s.seleccion }, 5), { ancho: 240 }).svg, s.nombre))
}

let contadorV4 = 0
/** Rig sobre una escena creciente (como el juego con E08: crecer sin recomponer). */
async function rigCreciente(esp, sel, n, ancho) {
  const forma = esp === 'ciempi' ? undefined : ESPECIES[esp].forma
  const a = await escenaDe(esp, sel, n)
  const prefijo = 'v' + ++contadorV4
  const c = escenaCreciente(a.svg, n + 1, prefijo, forma)
  const e = { ...a, ...c.encuadre(n), html: c.html, prefijo: prefijo + '-' }
  const { svg, g } = dibujar(e, { ancho })
  const rig = crearRig(g, { cabeza: String(sel.cabeza), expresion: String(sel.expresion) }, a.rostro, { prefijo: e.prefijo })
  rig.crecer(n, c.posiciones)
  return { svg, rig, c }
}

async function comer_() {
  titulo(`${nombre(especie)} · E08 «Comer» (AD-018)`, 'N = 6, 240 px; escena creciente + rig.crecer; boca sorprendida (por omisión), carcajada para comparar y máscara que tapa la boca;')
  const tapan = [...env.hats, ...env.masks].filter((x) => x.ocultaRostro === true).map((x) => x.id)
  for (const [texto, cabeza, boca] of [['Boca sorprendida', 'cabeza-nada', 'sorprendido'], ['Carcajada (comparación)', 'cabeza-nada', 'carcajada'], ['Gorro mago', 'b06-ia-mago', 'sorprendido'], ['Máscara robot (tapa la boca)', 'b07-ia-robot', 'sorprendido']]) {
    const f = fila(`${texto}${tapan.includes(cabeza) ? ' · bocaTapada' : ''}`)
    for (const t of [0, 0.12, 0.22, 0.34, 0.42, 0.6, 0.78]) {
      const sel = { ...BASE, cabeza }
      const { svg, rig } = await rigCreciente(especie, sel, 6, 240)
      const pose = comer(ANIMACIONES.find((a) => a.id === 'A02').pose(t, 6), t, 6, { boca, bocaTapada: tapan.includes(cabeza) })
      rig.cambiarRostro(pose.expresion ?? sel.expresion)
      rig.aplicar(pose)
      f.append(celda(svg, `t = ${t.toFixed(2).replace('.', ',')} s${pose.expresion ? ' · ' + pose.expresion.slice(4) : ''}`))
    }
  }
}

async function animacion() {
  titulo(`${nombre(especie)} · rig de animación del juego (cuadros congelados)`, 'N = 8, 240 px, mismo rig.js y poses de animaciones.js que Ciempi;')
  for (const id of ['A02', 'A03', 'A06', 'A10', 'E04']) {
    const anim = ANIMACIONES.find((a) => a.id === id)
    const f = fila(`${anim.id} · ${anim.nombre}`)
    for (let i = 0; i < 6; i++) {
      const t = (anim.duracion * i) / 6
      const e = await escenaDe(especie, BASE, 8)
      const { svg, g } = dibujar(e, { ancho: 240 })
      f.append(celda(svg, `t = ${t.toFixed(2).replace('.', ',')} s`))
      const rig = nuevoRig(e, g)
      const pose = poseConInercia(anim, t, 8)
      if (pose.expresion) rig.cambiarRostro(pose.expresion)
      rig.aplicar(pose)
    }
  }
}

async function comparacion() {
  const todas = ['ciempi', 'dragon', 'cuncuna', 'serpiente', 'camaleon']
  titulo('Comparación: Ciempi, Dragón, Cuncuna, Serpiente y Camaleón', 'Sin accesorios, misma longitud por fila;')
  for (const n of [5, 12]) for (const t of [{ alto: 84 }, { ancho: 320 }]) {
    const f = fila(`N = ${n} · ${t.alto ? '84 px de alto (pista)' : '320 px de ancho'}`)
    for (const id of todas) f.append(celda(dibujar(await escenaDe(id, BASE, n), t).svg, nombre(id)))
  }
  const f = fila('Siluetas a 84 px de alto (N = 5)')
  for (const id of todas) {
    const { svg } = dibujar(await escenaDe(id, BASE, 5), { alto: 84 })
    svg.style.filter = 'brightness(0)'
    f.append(celda(svg, nombre(id)))
  }
  const g = fila('Mismo conjunto (Luna bibliotecaria), N = 5, 240 px')
  const luna = env.sets.find((s) => s.nombre === 'Luna bibliotecaria')
  for (const id of todas) g.append(celda(dibujar(await escenaDe(id, { ...BASE, ...luna.seleccion }, 5), { ancho: 240 }).svg, nombre(id)))
}

async function camuflaje() {
  titulo('Ciempi Camaleón · gancho «camuflaje»', 'Con la paleta clásica el cuerpo toma los colores del conjunto (B12) o de la superficie (B11); una paleta elegida a mano manda. N = 5, 240 px;')
  const f = fila('Conjuntos B12 (paleta clásica)')
  for (const s of env.sets) f.append(celda(dibujar(await escenaDe('camaleon', { ...BASE, ...s.seleccion }, 5), { ancho: 240 }).svg, s.nombre))
  const g = fila('Solo superficie B11 / mismo conjunto con paleta Océano a mano')
  for (const t of ['b11-robot', 'b11-draco', 'b11-pirata', 'b11-mago', 'b11-araluz']) g.append(celda(dibujar(await escenaDe('camaleon', { ...BASE, textura: t }, 5), { ancho: 240 }).svg, t))
  const robot = env.sets.find((s) => s.nombre === 'Robot Lumen')
  g.append(celda(dibujar(await escenaDe('camaleon', { ...BASE, ...robot.seleccion, paleta: 'oceano' }, 5), { ancho: 240 }).svg, 'Robot Lumen + paleta Océano'))
  const h = fila('Mismo conjunto en Ciempi (referencia: Ciempi no cambia de color)')
  for (const s of env.sets.slice(0, 4)) h.append(celda(dibujar(await escenaDe('ciempi', { ...BASE, ...s.seleccion }, 5), { ancho: 240 }).svg, s.nombre))
}

const CALZADOS = ['b10-deportiva', 'b10-robot', 'b10-aventura', 'b10-lluvia', 'b10-mago']
/** Serpiente: UNA zapatilla en la punta de la cola (decisión de la usuaria, 2026-11-04). */
async function cola() {
  titulo('Ciempi Serpiente · zapatilla en la cola', 'Los 5 calzados B10: detalle de la cola ampliado (encuadre −40…160 × 240…520), cuerpo a 320 px y 84 px de alto, crecimiento y animaciones con el rig;')
  const det = (svg) => { svg.setAttribute('viewBox', '0 260 220 260'); svg.setAttribute('width', 220); svg.setAttribute('height', 260); return svg }
  const f = fila('Detalle de la cola (N = 5): sin calzado y los 5 calzados')
  for (const pies of ['pies-zapatillas', ...CALZADOS]) f.append(celda(det(dibujar(await escenaDe('serpiente', { ...BASE, pies }, 5)).svg), pies === 'pies-zapatillas' ? 'sin calzado' : pies))
  const g = fila('Cuerpo completo, N = 5 · 320 px')
  for (const pies of CALZADOS) g.append(celda(dibujar(await escenaDe('serpiente', { ...BASE, pies }, 5), { ancho: 320 }).svg, pies))
  const h = fila('84 px de alto (pista)')
  for (const pies of CALZADOS) h.append(celda(dibujar(await escenaDe('serpiente', { ...BASE, pies }, 5), { alto: 84 }).svg, pies))
  const c = fila('Crecimiento con b10-deportiva: N = 0, 1, 2, 5, 12, 40 (alto 150)')
  for (const n of [0, 1, 2, 5, 12, 40]) c.append(celda(dibujar(await escenaDe('serpiente', { ...BASE, pies: 'b10-deportiva' }, n), { alto: 150 }).svg, `N = ${n}`))
  for (const id of ['A02', 'E04', 'A03']) {
    const anim = ANIMACIONES.find((a) => a.id === id)
    const a = fila(`${anim.id} · ${anim.nombre} con b10-robot (N = 8, 240 px, rig.js)`)
    for (let i = 0; i < 6; i++) {
      const t = (anim.duracion * i) / 6
      const e = await escenaDe('serpiente', { ...BASE, pies: 'b10-robot' }, 8)
      const { svg, g: gr } = dibujar(e, { ancho: 240 })
      a.append(celda(svg, `t = ${t.toFixed(2).replace('.', ',')} s`))
      const rig = nuevoRig(e, gr)
      const pose = poseConInercia(anim, t, 8)
      if (pose.expresion) rig.cambiarRostro(pose.expresion)
      rig.aplicar(pose)
    }
  }
}

async function iteracion() {
  titulo(`${nombre(especie)} · antes (v1) y después (v2)`, 'Misma selección, pose y escala; v1 = rostro de Ciempi; v2 = rostro IA propio. Cabeza ampliada (encuadre 560–940 × 160–490) y cuerpo N = 5;')
  const cab = (svg) => { svg.setAttribute('viewBox', '560 160 380 330'); svg.setAttribute('width', 190); svg.setAttribute('height', 165); return svg }
  for (const exp of ['b03-alegre', 'b03-carcajada', 'b03-sorprendido', 'b03-dormilon', 'b03-guino', 'b03-triste', 'b03-enojadito']) {
    const f = fila(exp.slice(4))
    for (const iter of ['v1', 'v2']) f.append(celda(cab(dibujar(await escenaDe(especie, { ...INICIAL, iter, expresion: exp }, 5)).svg), iter))
  }
  const g = fila('Cuerpo N = 5 · 320 px y 84 px de alto')
  for (const iter of ['v1', 'v2']) for (const t of [{ ancho: 320 }, { alto: 84 }]) g.append(celda(dibujar(await escenaDe(especie, { ...INICIAL, iter }, 5), t).svg, `${iter} · ${t.ancho ? '320 px' : '84 px de alto'}`))
  if (especie === 'camaleon') {
    const h = fila('Patas (detalle 180–620 × 380–600)')
    for (const iter of ['v1', 'v2']) { const { svg } = dibujar(await escenaDe(especie, { ...INICIAL, iter }, 5)); svg.setAttribute('viewBox', '180 380 440 220'); svg.setAttribute('width', 440); svg.setAttribute('height', 220); h.append(celda(svg, iter)) }
  }
}

// V5: lámina de variantes de una especie (catálogo experimental variantes.js).
// ?tipo=variantes&especie=dragon|cuncuna|serpiente|camaleon
async function variantes() {
  const { CATALOGO } = await import('./variantes.js')
  const cat = CATALOGO[especie]
  raiz.append(el('h1', { textContent: `${cat.nombre} · diseño base y variantes (V5, catálogo experimental)` }),
    el('p', { textContent: `Diseño base: ${cat.disenoBase.nombre} — ${cat.disenoBase.estado}. N = 5, 320 px de ancho, misma escala y orientación; debajo, miniaturas a 84 px de alto. Solo color, material y patrón; misma geometría, rostro y animaciones.${cat.calzadoMuestra ? ' Con calzado ' + cat.calzadoMuestra + ': zapatilla única en la cola.' : ''}${especie === 'camaleon' ? ' Todas con los ojos k3 «Atardecer».' : ''} ${fondoTxt}. Laboratorio.` }))
  const sel = (v) => ({ ...BASE, rostro: cat.disenoBase.rostro, varianteEspecie: v.id, ...(cat.calzadoMuestra ? { pies: cat.calzadoMuestra } : {}) })
  const r = el('div', { className: 'rejilla' }); raiz.append(r)
  for (const v of cat.variantes) r.append(celda(dibujar(await escenaDe(especie, sel(v), 5), { ancho: 320 }).svg, `${v.nombre}${v.base ? ' (base)' : ''} · ${v.id}`))
  const f = fila('Miniaturas a 84 px de alto (pista de lectura)')
  for (const v of cat.variantes) f.append(celda(dibujar(await escenaDe(especie, sel(v), 5), { alto: 84 }).svg, v.nombre.split(' ').slice(1).join(' ')))
  if (especie === 'camaleon') {
    const cab = (svg) => { svg.setAttribute('viewBox', '580 170 350 300'); svg.setAttribute('width', 175); svg.setAttribute('height', 150); return svg }
    const g = fila('Ojos k3 compartidos: cabeza ampliada de cada variante (Alegre)')
    for (const v of cat.variantes) g.append(celda(cab(dibujar(await escenaDe(especie, sel(v), 5)).svg), v.nombre.split(' ').slice(1).join(' ')))
    const h = fila('Ojos k3 con otras expresiones y accesorios (Camaleón Atardecer)')
    const k3 = cat.variantes.find((v) => v.origen === 'k3')
    for (const [t, extra] of [['guiño', { expresion: 'b03-guino' }], ['carcajada (ojos cerrados)', { expresion: 'b03-carcajada' }], ['dormilón', { expresion: 'b03-dormilon' }], ['asustado', { expresion: 'b03-asustado' }], ['máscara robot (tapa)', { cabeza: 'b07-ia-robot' }], ['máscara gatita', { cabeza: 'b07-ia-gatita' }], ['lentes redondos', { cara: 'b04-redondos' }], ['gorro mago', { cabeza: 'b06-ia-mago' }]])
      h.append(celda(cab(dibujar(await escenaDe(especie, { ...sel(k3), ...extra }, 5)).svg), t))
  }
}

try {
  await ({ variantes, cola, iteracion,  crecimiento, expresiones, accesorios, conjuntos, comer: comer_, animacion, comparacion, camuflaje })[tipo]()
  await Promise.all([...document.querySelectorAll('image')].map((im) => new Promise((ok) => {
    const href = im.getAttribute('href'); if (!href) return ok()
    const i = new Image(); i.onload = i.onerror = ok; i.src = href
  })))
  document.body.dataset.cargado = '1'
} catch (e) { mostrarError(e); document.body.dataset.cargado = 'error' }
export { COMER }
