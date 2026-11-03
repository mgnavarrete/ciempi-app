// Banco de medición: reproduce el carril de lectura con el Ciempi real
// (src/lectura/Ciempi.tsx → useEscena → CiempiVivo → rig), que crece unidad a
// unidad mientras camina (A02). Lo maneja medir.mjs desde Playwright con
// window.banco; también se puede abrir a mano tras `node medir.mjs --solo-servir`.
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import '../../../../src/index.css'
import { APARIENCIA_INICIAL, type AparienciaCiempi } from '../../../../src/ciempi/catalogo'
import { VestuarioProvider, useEntornoCiempi } from '../../../../src/ciempi/v2/Vestuario'
import { renderCiempi } from '../../../../src/ciempi/v2/arte/componer.js'
import { aSeleccion } from '../../../../src/ciempi/v2/seleccion'
import { escena, escenaCreciente, posiciones } from '../../../../src/ciempi/v2/pose'
import { ANIMACIONES } from '../../../../src/ciempi/v2/animacion/animaciones.js'
import { poseConInercia } from '../../../../src/ciempi/v2/animacion/motor.js'
import { crearRig } from '../../../../src/ciempi/v2/animacion/rig.js'
import { Ciempi } from '../../../../src/lectura/Ciempi'
import type { Fase, Pista } from '../../../../src/lectura/motor'

/** Conjuntos de prueba (ids de la tienda). */
export const CONJUNTOS: Record<string, AparienciaCiempi> = {
  // Típico: gorro raster alto, capa raster y superficie (atlas raster) en cada segmento.
  tipico: { ...APARIENCIA_INICIAL, cabeza: 'cabeza:b06-ia-mago', espalda: 'espalda:b08-ia-heroica', textura: 'textura:b11-mago' },
  base: { ...APARIENCIA_INICIAL },
  mascara: { ...APARIENCIA_INICIAL, cabeza: 'cabeza:b07-ia-robot', espalda: 'espalda:b09-robot', textura: 'textura:b11-robot' },
}

const pistas = new Map<number, Pista>()
/** Como en el juego, la pista es estable durante la frase. */
const pistaDe = (n: number): Pista => pistas.get(n) ?? pistas.set(n, { manzanas: Array.from({ length: n }, (_, i) => 0.05 + (0.9 * (i + 0.5)) / n), fin: 1 }).get(n)!
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))
const cuadro = () => new Promise<number>((r) => requestAnimationFrame(r))

interface Estado { n: number; progreso: number; fase: Fase; nMax: number; conjunto: string; extra: Record<string, unknown> }
let fijar: (f: (e: Estado) => Estado) => void = () => {}
let entorno: unknown = null

function Banco() {
  const [e, setE] = useState<Estado>({ n: 0, progreso: 0.02, fase: 'esperando', nMax: 40, conjunto: 'tipico', extra: {} })
  fijar = setE
  return (
    <div style={{ width: '100%', padding: '120px 0 40px' }}>
      <Ciempi
        key={e.conjunto + e.nMax + JSON.stringify(e.extra)}
        pista={pistaDe(e.nMax)}
        palabrasLeidas={e.n}
        progreso={e.progreso}
        fase={e.fase}
        tranquilo={false}
        apariencia={CONJUNTOS[e.conjunto]}
        {...(e.extra as object)}
      />
    </div>
  )
}
function Entorno() {
  const { env } = useEntornoCiempi()
  useEffect(() => void (entorno = env), [env])
  return null
}

const mediana = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : 0 }
const p95 = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.ceil(s.length * 0.95) - 1)] : 0 }

/** Lectura simulada: el dedo avanza a ritmo constante (un cuadro = un evento del dedo) y cada manzana alcanzada es una unidad. */
async function correr({ nMax = 40, msPorUnidad = 500, conjunto = 'tipico', extra = {} as Record<string, unknown> } = {}) {
  flushSync(() => fijar(() => ({ n: 0, progreso: 0.02, fase: 'esperando', nMax, conjunto, extra })))
  // Esperar a que la escena esté compuesta y las imágenes raster decodificadas.
  for (let i = 0; i < 200 && !document.querySelector('[data-ciempi="v2"] [data-rig="raiz"]'); i++) await esperar(50)
  await Promise.all([...document.querySelectorAll('image')].map((im) => (im as SVGImageElement).decode?.().catch(() => {})))
  await esperar(800)
  const pista = pistaDe(nMax)
  const largos: number[] = []
  const tareasLargas: number[] = []
  const obs = new PerformanceObserver((l) => { for (const x of l.getEntries()) tareasLargas.push(x.duration) })
  try { obs.observe({ type: 'longtask', buffered: false }) } catch { /* sin longtask */ }
  const unidades: number[] = []
  const movimientos: number[] = []
  const duracion = nMax * msPorUnidad + 600
  performance.mark('banco-inicio')
  const t0 = performance.now()
  let previo = await cuadro()
  let n = 0
  flushSync(() => fijar((e) => ({ ...e, fase: 'arrastrando' })))
  for (;;) {
    const ahora = await cuadro()
    largos.push(ahora - previo)
    previo = ahora
    const t = ahora - t0
    if (t > duracion) break
    const progreso = Math.min(0.99, 0.02 + (t / (nMax * msPorUnidad)) * 0.96)
    const nuevoN = pista.manzanas.filter((x) => x <= progreso).length
    const a = performance.now()
    if (nuevoN !== n) {
      n = nuevoN
      performance.mark('unidad-ini')
      flushSync(() => fijar((e) => ({ ...e, n: nuevoN, progreso })))
      performance.mark('unidad-fin')
      performance.measure(`unidad ${nuevoN}`, 'unidad-ini', 'unidad-fin')
      unidades.push(performance.now() - a)
    } else {
      flushSync(() => fijar((e) => ({ ...e, progreso })))
      movimientos.push(performance.now() - a)
    }
  }
  performance.mark('banco-fin')
  await esperar(300)
  obs.disconnect()
  const vsync = 1000 / 60
  const perdidos = largos.reduce((s, d) => s + Math.max(0, Math.round(d / vsync) - 1), 0)
  const segundos = largos.reduce((s, d) => s + d, 0) / 1000
  return {
    nMax, msPorUnidad, conjunto,
    unidad: { n: unidades.length, mediana: mediana(unidades), p95: p95(unidades), max: Math.max(...unidades), todas: unidades },
    movimiento: { n: movimientos.length, mediana: mediana(movimientos), p95: p95(movimientos) },
    cuadros: { n: largos.length, fps: largos.length / segundos, perdidos, pctPerdidos: (100 * perdidos) / (largos.length + perdidos), mediana: mediana(largos), p95: p95(largos), max: Math.max(...largos) },
    tareasLargas: { n: tareasLargas.length, totalMs: tareasLargas.reduce((s, d) => s + d, 0), max: tareasLargas.length ? Math.max(...tareasLargas) : 0 },
    nodosDom: document.querySelectorAll('*').length,
    nodosCiempi: document.querySelectorAll('[data-ciempi="v2"] *').length,
  }
}

/** Desglose aislado de una actualización de unidad: escena() (DOMParser + serializar), innerHTML y crearRig. */
async function micro({ conjunto = 'tipico', nMax = 40, repeticiones = 3 } = {}) {
  const env = entorno as Parameters<typeof renderCiempi>[0]
  const sel = aSeleccion(CONJUNTOS[conjunto])
  let a = performance.now()
  const svg = renderCiempi(env, sel)
  const componer = performance.now() - a
  const lienzo = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  lienzo.setAttribute('width', '400'); lienzo.setAttribute('height', '84')
  document.body.append(lienzo)
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  lienzo.append(g)
  const filas: { n: number; escena: number; innerHTML: number; rig: number; estilo: number; bytes: number }[] = []
  for (let rep = 0; rep < repeticiones; rep++)
    for (let n = 0; n <= nMax; n++) {
      a = performance.now()
      const esc = escena(svg, n, 'mb')
      const b = performance.now()
      g.innerHTML = esc.html
      const c = performance.now()
      crearRig(g, { cabeza: String(sel.cabeza), expresion: String(sel.expresion) }, null, { prefijo: 'mb-' })
      const d = performance.now()
      void g.getBoundingClientRect() // fuerza estilo y geometría
      const f = performance.now()
      filas.push({ n, escena: b - a, innerHTML: c - b, rig: d - c, estilo: f - d, bytes: esc.html.length })
      await cuadro()
    }
  lienzo.remove()
  const col = (k: 'escena' | 'innerHTML' | 'rig' | 'estilo', desde = 0, hasta = nMax) => filas.filter((r) => r.n >= desde && r.n <= hasta).map((r) => r[k])
  const resumen = (desde: number, hasta: number) => Object.fromEntries((['escena', 'innerHTML', 'rig', 'estilo'] as const).map((k) => [k, { mediana: mediana(col(k, desde, hasta)), p95: p95(col(k, desde, hasta)) }]))
  return { componerMs: componer, svgBytes: svg.length, n0a10: resumen(0, 10), n11a25: resumen(11, 25), n26a40: resumen(26, 40), bytesN40: filas.find((r) => r.n === nMax)?.bytes }
}

/** Un estado fijo, para capturas comparables (`progreso` fija dónde está la cabeza). */
async function mostrar({ n = 0, nMax = 40, conjunto = 'tipico', progreso = 0.93, fase = 'esperando' as Fase, extra = {} as Record<string, unknown> } = {}) {
  flushSync(() => fijar(() => ({ n, progreso, fase, nMax, conjunto, extra })))
  for (let i = 0; i < 200 && !document.querySelector('[data-ciempi="v2"] [data-rig="raiz"]'); i++) await esperar(50)
  await Promise.all([...document.querySelectorAll('image')].map((im) => (im as SVGImageElement).decode?.().catch(() => {})))
}

/** Costo por cuadro de rig.aplicar (A02) con N = 40: escena por n contra escena creciente. */
async function costoCuadro({ conjunto = 'tipico', n = 40, cuadros = 240 } = {}) {
  const env = entorno as Parameters<typeof renderCiempi>[0]
  const sel = aSeleccion(CONJUNTOS[conjunto])
  const svg = renderCiempi(env, sel)
  const A02 = ANIMACIONES.find((a) => a.id === 'A02')!
  const res: Record<string, { mediana: number; p95: number }> = {}
  for (const modo of ['porN', 'creciente'] as const) {
    const lienzo = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    lienzo.setAttribute('width', '400'); lienzo.setAttribute('height', '84')
    document.body.append(lienzo)
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    lienzo.append(g)
    g.innerHTML = modo === 'porN' ? escena(svg, n, 'cc').html : escenaCreciente(svg, 40, 'cc').html
    const rig = crearRig(g, { cabeza: String(sel.cabeza), expresion: String(sel.expresion) }, null, { prefijo: 'cc-' })
    if (modo === 'creciente') rig.crecer(n, posiciones)
    const js: number[] = [], total: number[] = []
    for (let i = 0; i < cuadros; i++) {
      const a = performance.now()
      rig.aplicar(poseConInercia(A02, i / 60, n))
      const b = performance.now()
      void g.getBoundingClientRect()
      js.push(b - a); total.push(performance.now() - a)
      await cuadro()
    }
    res[modo + 'JS'] = { mediana: mediana(js), p95: p95(js) }
    res[modo + 'ConEstilo'] = { mediana: mediana(total), p95: p95(total) }
    lienzo.remove()
  }
  return res
}

/**
 * Dos Ciempi lado a lado con la MISMA pose (A02 en el instante t): a la izquierda
 * `escena(svg, n)` + rig (camino anterior), a la derecha `escenaCreciente(svg, nMax)`
 * + `rig.crecer(n)`. capturas.mjs fotografía cada uno y los compara píxel a píxel.
 */
async function comparar({ conjunto = 'tipico', n = 5, nMax = 40, t = 0, anim = 'A02', modos = ['porN', 'creciente'] } = {}) {
  document.querySelectorAll('[data-comparar]').forEach((x) => x.remove())
  const env = entorno as Parameters<typeof renderCiempi>[0]
  const sel = aSeleccion(CONJUNTOS[conjunto])
  const svg = renderCiempi(env, sel)
  const a = ANIMACIONES.find((x) => x.id === anim)!
  for (const modo of modos) {
    const lienzo = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const e = modo === 'porN' ? escena(svg, n, 'k' + modo) : null
    const c = modo === 'creciente' ? escenaCreciente(svg, nMax, 'k' + modo) : null
    lienzo.setAttribute('viewBox', e ? e.viewBox : c!.encuadre(n).viewBox)
    Object.entries({ width: '600', height: '390', 'data-comparar': modo, overflow: 'visible' }).forEach(([k, v]) => lienzo.setAttribute(k, v))
    lienzo.style.cssText = 'display:block;margin:40px 0;background:#fdf8ee'
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    lienzo.append(g)
    document.body.append(lienzo)
    g.innerHTML = e ? e.html : c!.html
    const rig = crearRig(g, { cabeza: String(sel.cabeza), expresion: String(sel.expresion) }, null, { prefijo: 'k' + modo + '-' })
    if (c) rig.crecer(n, posiciones)
    if (t >= 0) rig.aplicar(poseConInercia(a, t, n))
  }
  await Promise.all([...document.querySelectorAll('[data-comparar] image')].map((im) => (im as SVGImageElement).decode?.().catch(() => {})))
  await cuadro()
  await cuadro()
}

Object.assign(window, { banco: { correr, micro, mostrar, costoCuadro, comparar, listo: () => !!entorno, CONJUNTOS } })
createRoot(document.getElementById('root')!).render(
  <VestuarioProvider>
    <Entorno />
    <Banco />
  </VestuarioProvider>,
)
