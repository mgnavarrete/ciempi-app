// Copia V4 (T03/T04) de docs/expansion-ciempi/animacion/fusion-especies/comprobar-crecer.js, sin cambios de lógica.
// Comprobación de la fusión animación + especies (no es parte del laboratorio):
// 1) `escena(svg, n, p, forma)` + rig  frente a  `escenaCreciente(svg, nMax, p, forma)` + `rig.crecer(n, e.posiciones)`.
// 2) E08 con máscaras que tapan la boca (según `ocultaRostro` del catálogo cargado): ninguna boca dibujada.
import { ANIMACIONES, comer, COMER } from '../../../src/ciempi/v2/animacion/animaciones.js'
import { escenaCreciente } from './gen/pose.js'
import { ESPECIES } from './gen/especie.js'
import { env, escenaDe, dibujar, nuevoRig, INICIAL } from './nucleo.js'
import { crearRig } from '../../../src/ciempi/v2/animacion/rig.js'

const zona = document.getElementById('zona')
let k = 0
const esperar = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
async function decodificar() { await Promise.all([...zona.querySelectorAll('image')].map((im) => im.decode?.().catch(() => {}))) }

async function comparar({ especie, sel, n, nMax = 40, t = -1, modo: solo }) {
  zona.replaceChildren()
  const forma = especie === 'ciempi' ? undefined : ESPECIES[especie].forma
  const a = await escenaDe(especie, { ...INICIAL, ...sel }, n)
  const c = escenaCreciente(a.svg, nMax, 'q' + ++k, forma)
  const b = { ...a, ...c.encuadre(n), html: c.html, prefijo: 'q' + k + '-' }
  const anim = ANIMACIONES.find((x) => x.id === 'A02')
  const out = {}
  for (const [modo, e] of [['escena', a], ['creciente', b]]) {
    if (solo && modo !== solo) continue
    const { svg, g } = dibujar(e, { ancho: 600 })
    svg.setAttribute('data-modo', modo)
    zona.append(svg)
    const rig = nuevoRig(e, g)
    if (modo === 'creciente') out.crecer = rig.crecer(n, c.posiciones)
    if (t >= 0) rig.aplicar(anim.pose(t, n))
    out[modo] = e.viewBox
  }
  await decodificar(); await esperar()
  return out
}

/** Ids de cabeza que tapan la boca según el catálogo cargado (mismo orden que el compositor). */
const tapan = () => [...env.hats, ...env.masks].filter((x) => x.ocultaRostro === true).map((x) => x.id)
const cabezas = () => [...new Set([...env.hats, ...env.masks].filter((x) => !x.historico).map((x) => x.id))]

/** Recorre E08 cuadro a cuadro y cuenta las bocas dibujadas (hijos de #…-mouth dentro de la cabeza). */
async function bocas({ especie, cabeza, n = 6, forzarConBoca = false, boca = 'sorprendido' }) {
  zona.replaceChildren()
  const forma = especie === 'ciempi' ? undefined : ESPECIES[especie].forma
  const sel = { ...INICIAL, cabeza }
  const a = await escenaDe(especie, sel, n)
  const c = escenaCreciente(a.svg, 12, 'm' + ++k, forma)
  const e = { ...a, ...c.encuadre(n), html: c.html, prefijo: 'm' + k + '-' }
  const { svg, g } = dibujar(e, { ancho: 400 }); zona.append(svg)
  const rig = crearRig(g, { cabeza: String(cabeza), expresion: String(sel.expresion) }, a.rostro, { prefijo: e.prefijo })
  rig.crecer(n, c.posiciones)
  const tapa = forzarConBoca ? false : tapan().includes(cabeza)
  const anim = ANIMACIONES.find((x) => x.id === 'A02')
  const res = { especie, cabeza, tapa, forzarConBoca, cuadros: 0, maxBocas: 0, maxHijos: 0, minHijos: 1e9, expresiones: new Set(), bocaVisibleInicial: rig.bocaVisible() }
  for (let t = 0; t <= COMER.duracion + 0.001; t += 0.02) {
    const p = comer(anim.pose(t, n), t, n, { boca, bocaTapada: tapa })
    rig.cambiarRostro(p.expresion ?? sel.expresion)
    rig.aplicar(p)
    if (p.expresion) res.expresiones.add(p.expresion)
    const grupos = [...svg.querySelectorAll('[id$="-mouth"]')]
    const hijos = grupos.reduce((s, x) => s + x.children.length, 0)
    res.maxBocas = Math.max(res.maxBocas, grupos.length)
    res.maxHijos = Math.max(res.maxHijos, hijos); res.minHijos = Math.min(res.minHijos, hijos)
    res.cuadros++
  }
  res.expresiones = [...res.expresiones]
  return res
}

Object.assign(window, { comprobar: { comparar, bocas, tapan, cabezas, listo: () => !!env } })
