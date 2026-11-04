// Accesorios v4 · mochilas (B09) y calzado (B10) integrados al cuerpo. LABORATORIO.
//
// Postproceso del SVG que compone `renderCiempi` (que no se modifica): se activa
// con `?accesorios=v4` en el laboratorio de transformaciones. Sin el parámetro,
// el laboratorio usa el vestuario del juego exactamente como siempre.
//
// Calzado: el zapato sigue en el mismo grupo que gira en el tobillo
// (`rotate(g -10 -32)`), pero se coloca por su ABERTURA: el centro de la boca
// del zapato queda bajo el eje de la pierna y la suela en el suelo de la pose.
// Encima del zapato se dibuja una copia de la propia pierna recortada a la boca
// (hasta el labio delantero): la pierna tapa el interior y el borde trasero, y
// el labio delantero tapa la pierna. Debajo, una sombra de contacto bajo la suela.
//
// Mochilas: ya no son una imagen fija en coordenadas absolutas. Viven DENTRO
// del grupo del segmento delantero (`mint-front`), así que siguen su posición,
// giro y escala al crecer (pose.ts) y al animar (rig.js) sin tocar ninguno de
// los dos. Capas, de atrás hacia adelante: mitad lejana de las dos correas
// (detrás del segmento), el segmento, sombra de contacto recortada a la esfera,
// mitad cercana de las correas (recortada a la esfera) y la mochila IA sin
// correas pintadas (regenerada en V4 conservando diseño y colores B09).
import { V4_MOCHILAS, V4_CALZADO } from './accesorios-v4-datos.js'

const NS = 'http://www.w3.org/2000/svg'
const OSCURO = '#243e5b'
const RECURSOS = new URL('./recursos/accesorios-v4/', import.meta.url)
const r2 = (n) => Math.round(n * 100) / 100

export const ACTIVO = new URLSearchParams(globalThis.location?.search || '').get('accesorios') === 'v4'

const parse = (s) => {
  const d = new DOMParser().parseFromString(s, 'image/svg+xml')
  if (d.querySelector('parsererror')) throw Error('SVG inválido (accesorios v4)')
  return d
}
const crear = (doc, tag, attrs = {}) => {
  const n = doc.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  return n
}
const defsDe = (doc) => doc.querySelector('defs') || doc.documentElement.insertBefore(crear(doc, 'defs'), doc.documentElement.firstChild)

/** Aplica la construcción v4 a un SVG compuesto (texto). `sel` es la selección efectiva. */
export function aplicarAccesoriosV4(svg, sel) {
  const bolsa = V4_MOCHILAS[sel.espalda], zapato = V4_CALZADO[sel.pies]
  if (!bolsa && !zapato) return svg
  const doc = parse(svg)
  if (zapato) calzar(doc, sel.pies, zapato)
  if (bolsa) equiparMochila(doc, sel.espalda, bolsa)
  doc.documentElement.setAttribute('data-accesorios', 'v4')
  return new XMLSerializer().serializeToString(doc)
}

// ── Calzado ──────────────────────────────────────────────────────────────────
function calzar(doc, id, z) {
  const usos = [...doc.querySelectorAll(`[data-footwear="${id}"]`)]
  if (!usos.length) return
  const href = usos[0].getAttribute('href')
  const [anchoPx, altoPx] = z.px
  const s = z.ancho / anchoPx
  const b = z.boca
  const tx = -10 + (z.dx ?? 0) - ((b.x0 + b.x1) / 2) * s
  const ty = 24 - z.suela * s
  const X = (x) => r2(tx + x * s), Y = (y) => r2(ty + y * s)
  const labio = Y(b.labio[1])
  // Recorte de la pierna visible dentro de la boca: desde el borde trasero hasta el labio delantero.
  const clipId = `v4-boca-${id}`
  if (!doc.getElementById(clipId)) {
    const clip = crear(doc, 'clipPath', { id: clipId })
    // Tope por encima del borde trasero (que queda detrás de la pierna) y del final de la pierna de Ciempi.
    const tope = r2(Math.min(Y(b.arriba) - 4, -38))
    const ctrlY = 2 * labio - (Y(b.izq[1]) + Y(b.der[1])) / 2
    clip.append(crear(doc, 'path', {
      d: `M${X(b.izq[0])} ${tope} L${X(b.der[0])} ${tope} L${X(b.der[0])} ${Y(b.der[1])} Q${X(b.labio[0])} ${r2(ctrlY)} ${X(b.izq[0])} ${Y(b.izq[1])}Z`,
    }))
    defsDe(doc).append(clip)
  }
  for (const uso of usos) {
    const giroG = uso.parentNode, pie = giroG.parentNode
    const giro = +(/rotate\(\s*(-?[\d.]+)/.exec(giroG.getAttribute('transform') || '')?.[1] ?? 0)
    // La pierna propia (Ciempi: trazados; especies: imagen `pierna`), sin el grupo del pie.
    const pierna = [...pie.children].filter((n) => n !== giroG)
    const imgPierna = pierna.find((n) => n.getAttribute?.('data-pieza') === 'pierna')
    const finPierna = imgPierna ? +imgPierna.getAttribute('y') + +imgPierna.getAttribute('height') - 6 : -29
    // La copia es idéntica a la pierna (sin costura visible) hasta justo encima de su borde inferior.
    // Si el labio queda más abajo que ese borde (zapatos bajos), una franja fina de la pierna, justo
    // sobre ese borde, se estira hacia abajo hasta pasar el labio: los lados siguen rectos y no se ve
    // el contorno inferior de la pierna dentro de la boca.
    const baja = Math.max(0, r2(labio - finPierna + 4))
    const y0 = finPierna - 5
    const sombra = crear(doc, 'ellipse', { cx: X(z.contacto ?? anchoPx / 2), cy: 24, rx: r2(z.ancho * 0.44), ry: 4.6, fill: OSCURO, opacity: 0.2, 'data-v4': 'sombra-contacto' })
    const arte = crear(doc, 'use', { href, transform: `translate(${r2(tx)} ${r2(ty)}) scale(${r2(s * 1e4) / 1e4})`, 'data-footwear': id, 'data-v4': 'zapato' })
    const dentro = crear(doc, 'g', { 'clip-path': `url(#${clipId})`, 'data-v4': 'pierna-en-boca' })
    const copia = crear(doc, 'g', { transform: `rotate(${-giro} -10 -32)` })
    const recorte = (id, y, h) => {
      if (!doc.getElementById(id)) {
        const c = crear(doc, 'clipPath', { id })
        c.append(crear(doc, 'rect', { x: -120, y: r2(y), width: 240, height: r2(h) }))
        defsDe(doc).append(c)
      }
      return `url(#${id})`
    }
    if (baja > 0) {
      const k = r2((labio + 4 - y0) / 2)
      const tramo = crear(doc, 'g', { transform: `translate(0 ${r2(y0)}) scale(1 ${k}) translate(0 ${r2(-y0)})` })
      const franja = crear(doc, 'g', { 'clip-path': recorte(`v4-franja-${Math.round(-y0)}`, y0, 2) })
      for (const n of pierna) franja.append(n.cloneNode(true))
      tramo.append(franja)
      copia.append(tramo)
    }
    const corteId = `v4-pierna-${Math.round(-finPierna)}`
    if (baja > 0) recorte(corteId, -300, 300 + finPierna - 3)
    const igual = crear(doc, 'g', baja > 0 ? { 'clip-path': `url(#${corteId})` } : {})
    for (const n of pierna) igual.append(n.cloneNode(true))
    copia.append(igual)
    dentro.append(copia)
    giroG.replaceChildren(sombra, arte, dentro)
  }
  doc.querySelector('desc').textContent += ' Calzado v4: pierna dentro de la boca del zapato y sombra de contacto.'
}

// ── Mochilas ─────────────────────────────────────────────────────────────────
function equiparMochila(doc, id, m) {
  for (const n of doc.querySelectorAll('[data-bag]')) n.remove()
  const seg = doc.getElementById('mint-front')
  if (!seg) return
  const nucleo = +seg.getAttribute('data-nucleo')
  const R = nucleo ? nucleo - 2 : 96
  const defs = defsDe(doc)
  const arteId = `v4-arte-${id}`
  if (!doc.getElementById(arteId)) defs.append(crear(doc, 'image', { id: arteId, width: m.px[0], height: m.px[1], href: new URL(m.archivo, RECURSOS).href }))
  const discoId = `v4-disco-${id}`
  // Disco del segmento, para que sombra y correas cercanas no se salgan de la esfera.
  const disco = crear(doc, 'clipPath', { id: discoId })
  disco.append(crear(doc, 'circle', { r: R + 1 }))

  const giro = m.giro ?? -26
  const s = m.ancho / m.px[0]
  const apoyoY = -R * (m.apoyo ?? 0.86)
  const [ax, ay] = m.base
  // Correas: dos anillos paralelos alrededor de la esfera, a ambos lados de la mochila.
  // Proyección de un anillo inclinado: elipse de centro (c, 0), ry = ρ, rx = ρ·k.
  const anillos = (m.correas ?? [-0.3, 0.3]).map((c) => { const cx = c * R, rho = Math.sqrt(R * R - cx * cx); return { cx, rho, rx: rho * (m.inclinacion ?? 0.3) } })
  const arco = ({ cx, rho, rx }, lado) => `M${r2(cx)} ${r2(-rho)} A${r2(rx)} ${r2(rho)} 0 0 ${lado === 'cerca' ? 0 : 1} ${r2(cx)} ${r2(rho)}`
  const ancho = m.correa?.ancho ?? 14
  const banda = (d, extra = {}) => {
    const g = crear(doc, 'g', { fill: 'none', 'stroke-linecap': 'butt', ...extra })
    g.append(
      crear(doc, 'path', { d, stroke: OSCURO, 'stroke-width': ancho + 9 }),
      crear(doc, 'path', { d, stroke: m.correa.color, 'stroke-width': ancho }),
      crear(doc, 'path', { d, stroke: m.correa.luz, 'stroke-width': 3.5, opacity: 0.8, transform: 'translate(-3 0)' }),
    )
    return g
  }
  const rot = `rotate(${giro})`
  const lejos = crear(doc, 'g', { transform: rot, 'data-v4': 'correas-lejanas' })
  for (const a of anillos) lejos.append(banda(arco(a, 'lejos')))
  const cerca = crear(doc, 'g', { 'clip-path': `url(#${discoId})`, 'data-v4': 'correas-cercanas' })
  const cercaRot = crear(doc, 'g', { transform: rot })
  for (const a of anillos) {
    cercaRot.append(banda(arco(a, 'cerca')))
    // Hebilla donde la correa cruza el ecuador visible del segmento.
    if (m.hebilla) cercaRot.append(crear(doc, 'rect', { x: r2(a.cx - a.rx - ancho / 2 - 2), y: -9, width: ancho + 4, height: 18, rx: 4, fill: m.hebilla, stroke: OSCURO, 'stroke-width': 4 }))
  }
  cerca.append(cercaRot)
  const sombra = crear(doc, 'g', { 'clip-path': `url(#${discoId})`, 'data-v4': 'sombra-contacto' })
  sombra.append(crear(doc, 'ellipse', { cx: 0, cy: r2(apoyoY + 6), rx: r2(m.ancho * 0.36), ry: 10, fill: OSCURO, opacity: 0.2, transform: rot }))
  const bolsa = crear(doc, 'g', { transform: `${rot} translate(0 ${r2(apoyoY)}) scale(${r2(s * 1e4) / 1e4}) translate(${-ax} ${-ay})`, 'data-v4': 'mochila' })
  bolsa.append(crear(doc, 'use', { href: '#' + arteId }))
  // Sin <image> dentro de [data-bag]: pose.ts lee el x de esas imágenes para el encuadre de la mochila absoluta.
  const grupo = crear(doc, 'g', { id: `${id}-equipped`, 'data-bag': id, 'data-v4': 'mochila-en-segmento' })
  const frente = crear(doc, 'g', {})
  frente.append(sombra, cerca, bolsa)
  grupo.append(frente)
  seg.insertBefore(lejos, seg.firstChild)
  seg.insertBefore(crear(doc, 'defs', {}), seg.firstChild).append(disco)
  seg.append(grupo)
  // La mitad lejana también se oculta sin cuerpo (N = 0 ya quita el segmento entero).
  lejos.setAttribute('data-bag', id)
  doc.querySelector('desc').textContent += ` Mochila v4: ${id} en el segmento delantero con correas alrededor.`
}
