// Mochilas B09 en el juego (2.5.2): construcción v4.2 del laboratorio de transformaciones
// (docs/rediseno-ciempi/laboratorio-transformaciones/accesorios-v4.js), solo la parte de mochilas.
// Postproceso del SVG que compone renderCiempi (o componerCriatura): la mochila vive DENTRO del
// segmento delantero (`mint-front`), así sigue su posición, giro y escala al crecer y al animar,
// con dos correas que rodean el lomo y sombra de contacto. Recursos en public/ciempi-v2/mochilas-v4/.
const NS = 'http://www.w3.org/2000/svg'
const OSCURO = '#243e5b'
const RECURSOS = '/ciempi-v2/mochilas-v4/'
const r2 = (n) => Math.round(n * 100) / 100
const medidas = {"aventura": {"archivo": "mochila-aventura.webp", "px": [384, 371], "baseInferior": [219.5, 368.0]}, "draco": {"archivo": "mochila-draco.webp", "px": [384, 359], "baseInferior": [203.0, 356.5]}, "mago": {"archivo": "mochila-mago.webp", "px": [384, 256], "baseInferior": [238.0, 254.0]}, "raton": {"archivo": "mochila-raton.webp", "px": [384, 389], "baseInferior": [185.0, 386.5]}, "robot": {"archivo": "mochila-robot.webp", "px": [384, 377], "baseInferior": [270.5, 375.5]}, "cometa": {"archivo": "mochila-cometa.webp", "px": [384, 366], "baseInferior": [191.0, 362.5]}}
const bolsa = (k, extra) => ({ archivo: medidas[k].archivo, px: medidas[k].px, base: medidas[k].baseInferior, ...extra })
const CORREAS = [{ desde: [0.36, 0.02], silueta: -81 }, { desde: [0.36, 0.3], silueta: -61 }]
const V4_MOCHILAS = {
  'b09-aventura': bolsa('aventura', { alto: 168, centro: [-78, -62], giro: -10, correas: CORREAS, correa: { color: '#a8662b' } }),
  'b09-draco': bolsa('draco', { alto: 180, centro: [-78, -64], giro: -10, correas: CORREAS, correa: { color: '#2a9d8f' } }),
  'b09-mago': bolsa('mago', { alto: 144, centro: [-82, -56], giro: -8, correas: [{ desde: [0.4, 0.1], silueta: -81 }, { desde: [0.4, 0.32], silueta: -61 }], correa: { color: '#e2b23a' }, borde: { color: '#f2c23a', interior: 4.5, exterior: 9 } }),
  'b09-raton': bolsa('raton', { alto: 178, centro: [-78, -66], giro: -10, correas: CORREAS, correa: { color: '#c97a33' } }),
  'b09-robot': bolsa('robot', { alto: 163, centro: [-80, -62], giro: -10, correas: CORREAS, correa: { color: '#e2a52f' } }),
  'b09-cometa': bolsa('cometa', { alto: 160, centro: [-80, -62], giro: -10, correas: CORREAS, correa: { color: '#1f6f7a' } }),
}


const crear = (doc, tag, attrs = {}) => {
  const n = doc.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  return n
}
const defsDe = (doc) => doc.querySelector('defs') || doc.documentElement.insertBefore(crear(doc, 'defs'), doc.documentElement.firstChild)

/** ¿Lleva una mochila B09? (`espalda` sin prefijo, como en la selección del compositor). */
export const llevaMochila = (sel) => !!V4_MOCHILAS[sel?.espalda]

/** Coloca la mochila v4.2 en un SVG compuesto (texto). Sin mochila, devuelve el mismo texto. */
export function conMochila(svg, sel) {
  const m = V4_MOCHILAS[sel?.espalda]
  if (!m || !svg) return svg
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  if (doc.querySelector('parsererror')) return svg
  equiparMochila(doc, sel.espalda, m)
  return new XMLSerializer().serializeToString(doc)
}

function equiparMochila(doc, id, m) {
  for (const n of doc.querySelectorAll('[data-bag]')) n.remove()
  const seg = doc.getElementById('mint-front')
  if (!seg) return
  const nucleo = +seg.getAttribute('data-nucleo')
  const R = nucleo ? nucleo - 2 : 96
  const k = R / 96 // las medidas están pensadas para el segmento de Ciempi
  const defs = defsDe(doc)
  const arteId = `v4-arte-${id}`
  if (!doc.getElementById(arteId)) defs.append(crear(doc, 'image', { id: arteId, width: m.px[0], height: m.px[1], href: RECURSOS + m.archivo }))
  const discoId = `v4-disco-${id}`
  const disco = crear(doc, 'clipPath', { id: discoId })
  disco.append(crear(doc, 'circle', { r: r2(R + 0.5) }))

  const alto = m.alto * k, s = alto / m.px[1], ancho = m.px[0] * s
  const [cx, cy] = m.centro.map((v) => v * k)
  const g = (m.giro * Math.PI) / 180
  /** Punto de la bolsa (fracciones de su caja desde el centro) en coordenadas del segmento. */
  const enSegmento = ([fx, fy]) => { const x = fx * ancho, y = fy * alto; return [cx + x * Math.cos(g) - y * Math.sin(g), cy + x * Math.sin(g) + y * Math.cos(g)] }

  const fino = m.correa.ancho ?? 6
  const trazo = (d) => {
    const n = crear(doc, 'g', { fill: 'none', 'stroke-linecap': 'butt' })
    n.append(crear(doc, 'path', { d, stroke: OSCURO, 'stroke-width': fino + 4.5 }), crear(doc, 'path', { d, stroke: m.correa.color, 'stroke-width': fino }))
    return n
  }
  const lejos = crear(doc, 'g', { 'data-v4': 'correas-lejanas', 'data-bag': id })
  const cerca = crear(doc, 'g', { 'clip-path': `url(#${discoId})`, 'data-v4': 'correas-cercanas' })
  for (const c of m.correas) {
    const [ax, ay] = enSegmento(c.desde)
    const th = (c.silueta * Math.PI) / 180
    const u = [Math.cos(th), Math.sin(th)]
    let v = [-u[1], u[0]], horario = 1
    let au = ax * u[0] + ay * u[1], av = ax * v[0] + ay * v[1]
    if (av < 0) { v = [-v[0], -v[1]]; av = -av; horario = 0 }
    const ry = R * Math.max(0.08, Math.min(1, av / (R * Math.sqrt(Math.max(1e-6, 1 - (au / R) ** 2)))))
    const P = (t) => [R * Math.cos(t) * u[0] + ry * Math.sin(t) * v[0], R * Math.cos(t) * u[1] + ry * Math.sin(t) * v[1]]
    const [ex, ey] = P(0), [fx, fy] = P(-0.3)
    const rot = r2(c.silueta)
    cerca.append(trazo(`M${r2(ex)} ${r2(ey)} A${r2(R)} ${r2(ry)} ${rot} 0 ${horario} ${r2(ax)} ${r2(ay)}`))
    lejos.append(trazo(`M${r2(fx)} ${r2(fy)} A${r2(R)} ${r2(ry)} ${rot} 0 ${horario} ${r2(ex)} ${r2(ey)}`))
  }
  // Sombra de contacto: la bolsa oscurece la esfera alrededor de su apoyo.
  const [sx, sy] = enSegmento([0.02, 0.1])
  const sombra = crear(doc, 'g', { 'clip-path': `url(#${discoId})`, 'data-v4': 'sombra-contacto' })
  sombra.append(crear(doc, 'ellipse', { cx: r2(sx * 0.9), cy: r2(sy * 0.9), rx: r2(ancho * 0.44), ry: r2(alto * 0.4), fill: OSCURO, opacity: 0.17, transform: `rotate(${m.giro} ${r2(sx * 0.9)} ${r2(sy * 0.9)})` }))
  const bolsa = crear(doc, 'g', { transform: `translate(${r2(cx)} ${r2(cy)}) rotate(${m.giro}) scale(${r2(s * 1e4) / 1e4}) translate(${-m.px[0] / 2} ${-m.px[1] / 2})`, 'data-v4': 'mochila' })
  if (m.borde) {
    // Borde propio (Bolso Luna): ribete dorado y contorno exterior, para no perderse sobre cuerpos oscuros.
    const fid = `v4-borde-${id}`
    if (!doc.getElementById(fid)) {
      const f = crear(doc, 'filter', { id: fid, x: '-10%', y: '-10%', width: '120%', height: '120%' })
      f.append(
        crear(doc, 'feMorphology', { in: 'SourceAlpha', operator: 'dilate', radius: m.borde.exterior, result: 'ext' }),
        crear(doc, 'feFlood', { 'flood-color': OSCURO, result: 'oscuro' }),
        crear(doc, 'feComposite', { in: 'oscuro', in2: 'ext', operator: 'in', result: 'a' }),
        crear(doc, 'feMorphology', { in: 'SourceAlpha', operator: 'dilate', radius: m.borde.interior, result: 'int' }),
        crear(doc, 'feFlood', { 'flood-color': m.borde.color, result: 'oro' }),
        crear(doc, 'feComposite', { in: 'oro', in2: 'int', operator: 'in', result: 'b' }),
      )
      const merge = crear(doc, 'feMerge')
      merge.append(crear(doc, 'feMergeNode', { in: 'a' }), crear(doc, 'feMergeNode', { in: 'b' }))
      f.append(merge)
      defs.append(f)
    }
    bolsa.append(crear(doc, 'use', { href: '#' + arteId, filter: `url(#${fid})` }))
  }
  // Sin <image> dentro de [data-bag]: pose.ts lee el x de esas imágenes para el encuadre de la mochila absoluta.
  bolsa.append(crear(doc, 'use', { href: '#' + arteId }))
  const grupo = crear(doc, 'g', { id: `${id}-equipped`, 'data-bag': id, 'data-v4': 'mochila-en-segmento' })
  grupo.append(sombra, cerca, bolsa)
  seg.insertBefore(lejos, seg.firstChild)
  seg.insertBefore(crear(doc, 'defs', {}), seg.firstChild).append(disco)
  seg.append(grupo)
  doc.querySelector('desc').textContent += ` Mochila v4.2: ${id} en el flanco trasero superior del segmento delantero con dos correas que rodean el lomo.`
}
