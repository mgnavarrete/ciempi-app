// Núcleo compartido del laboratorio de transformaciones y sus láminas:
// carga el vestuario del juego, compone criaturas y dibuja escenas/rigs.
import { load, defaults } from '../../../src/ciempi/v2/arte/cargar.js'
import { crearRig } from '../../../src/ciempi/v2/animacion/rig.js'
import { corregirRutas, prepararCriatura, componerCriatura as componerBase, escenaCriatura, ESPECIES } from './especies.js'
import { ACTIVO as ACCESORIOS_V4, aplicarAccesoriosV4 } from './accesorios-v4.js'

/** Con `?accesorios=v4`, mochilas y calzado con la construcción v4 (accesorios-v4.js); si no, el vestuario del juego tal cual. */
function componerCriatura(env, especieId, sel) {
  const c = componerBase(env, especieId, sel)
  return ACCESORIOS_V4 ? { ...c, svg: aplicarAccesoriosV4(c.svg, c.seleccion) } : c
}

const $ = (s) => document.querySelector(s)
const NS = 'http://www.w3.org/2000/svg'
const CIELO = 150

/** Carga el vestuario del juego desde public/ (el servidor estático sirve la raíz del repositorio). */
async function cargarEntorno() {
  const original = window.fetch.bind(window)
  window.fetch = (url, ...r) => original(typeof url === 'string' && url.startsWith('/ciempi-v2/') ? '/public' + url : url, ...r)
  try { return corregirRutas(await load()) } finally { window.fetch = original }
}

export const env = await cargarEntorno().catch((e) => { mostrarError(e); throw e })
export function mostrarError(e) { const p = $('#error'); if (p) { p.hidden = false; p.textContent = 'Error: ' + (e?.message || e) }; console.error(e) }

export const INICIAL = { ...defaults, expresion: 'b03-alegre' }
const composiciones = new Map()
let contador = 0

/** Escena (pose.ts) de una criatura con una selección y una longitud, más lo que pide el rig. */
export async function escenaDe(especieId, sel, n) {
  await prepararCriatura(env, especieId, sel.paleta || 'clasica')
  const clave = especieId + JSON.stringify(sel)
  if (!composiciones.has(clave)) { if (composiciones.size > 80) composiciones.clear(); composiciones.set(clave, componerCriatura(env, especieId, sel)) }
  const c = composiciones.get(clave)
  const prefijo = 'l' + ++contador
  const e = escenaCriatura(c.svg, n, prefijo, especieId)
  const rostros = new Map()
  const rostro = (exp) => { if (!rostros.has(exp)) rostros.set(exp, componerCriatura(env, especieId, { ...sel, expresion: exp }).svg); return rostros.get(exp) }
  return { ...e, prefijo: prefijo + '-', svg: c.svg, resolucion: c.resolucion, seleccion: c.seleccion, rostro, especie: especieId, sel }
}

/** Dibuja una escena en un <svg> nuevo; `alto` o `ancho` en px (si no, ocupa el contenedor). */
export function dibujar(e, { alto, ancho, cielo = CIELO } = {}) {
  const [x, , w, h] = e.viewBox.split(' ').map(Number)
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', `${x} ${-cielo} ${w} ${h + cielo}`)
  svg.setAttribute('overflow', 'hidden')
  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', `${ESPECIES[e.especie].nombre}, ${e.html ? '' : 'sin cuerpo, '}${e.viewBox}`)
  const proporcion = w / (h + cielo)
  if (alto) { svg.setAttribute('height', alto); svg.setAttribute('width', Math.round(alto * proporcion)) }
  if (ancho) { svg.setAttribute('width', ancho); svg.setAttribute('height', Math.round(ancho / proporcion)) }
  const g = document.createElementNS(NS, 'g')
  g.innerHTML = e.html
  svg.append(g)
  return { svg, g }
}

export function nuevoRig(e, g) {
  return crearRig(g, { cabeza: String(e.seleccion.cabeza), expresion: String(e.seleccion.expresion) }, e.rostro, { prefijo: e.prefijo })
}

