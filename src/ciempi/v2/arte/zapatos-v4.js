// Calzado B10 en el juego (2.8): construcción v4.2 del laboratorio de transformaciones
// (docs/rediseno-ciempi/laboratorio-transformaciones/accesorios-v4.js, función `calzar`, y
// sus medidas `V4_CALZADO` en accesorios-v4-datos.js), solo la parte del calzado.
// Postproceso del SVG que compone renderCiempi (o componerCriatura): el zapato sigue en el
// mismo grupo que gira en el tobillo (`rotate(g -10 -32)`), pero se coloca por su ABERTURA:
// el centro de la boca queda bajo el eje de la pierna y la suela en el suelo de la pose.
// Encima del zapato va una copia de la propia pierna recortada a la boca (hasta el labio
// delantero): la pierna tapa el interior y el borde trasero, y el labio tapa la pierna.
// Debajo, una sombra de contacto. Usa los mismos recursos B10 de public/ciempi-v2/.
// Solo las patas de `legs-and-sneakers`: la zapatilla en la cola de la Serpiente
// (criaturas/v4.ts, `calzarCola`) no se toca. Sin calzado B10 devuelve el mismo texto.
const NS = 'http://www.w3.org/2000/svg'
const OSCURO = '#243e5b'
const r2 = (n) => Math.round(n * 100) / 100

// Coordenadas en px del recurso: `px` tamaño; `suela` y de la suela; `boca` = abertura del
// zapato (extremos izquierdo/derecho del borde delantero, punto más bajo del labio delantero
// y borde superior de la boca); `ancho` en unidades de la base (B10 v1 usaba 88 para todos).
// v4.2: los zapatos de luna (mago) al 86 % (100 → 86) para no pisar el pie vecino.
const V4_CALZADO = {
  'b10-robot': { px: [512, 423], suela: 419, ancho: 80, boca: { izq: [62, 36], der: [268, 40], labio: [170, 63], arriba: 5 } },
  'b10-aventura': { px: [512, 413], suela: 410, ancho: 84, boca: { izq: [88, 45], der: [210, 34], labio: [148, 68], arriba: 13 } },
  'b10-lluvia': { px: [512, 456], suela: 450, ancho: 74, boca: { izq: [48, 33], der: [300, 30], labio: [165, 52], arriba: 4 } },
  'b10-mago': { px: [512, 275], suela: 270, ancho: 86, boca: { izq: [42, 28], der: [205, 40], labio: [120, 56], arriba: 4 } },
  'b10-deportiva': { px: [512, 325], suela: 318, ancho: 92, boca: { izq: [100, 55], der: [222, 52], labio: [160, 76], arriba: 28 } },
}
for (const z of Object.values(V4_CALZADO)) { z.boca.x0 = z.boca.izq[0]; z.boca.x1 = z.boca.der[0] }

const crear = (doc, tag, attrs = {}) => {
  const n = doc.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  return n
}
const defsDe = (doc) => doc.querySelector('defs') || doc.documentElement.insertBefore(crear(doc, 'defs'), doc.documentElement.firstChild)

/** ¿Lleva calzado B10 v4? (`pies` sin prefijo, como en la selección del compositor). */
export const llevaZapatos = (sel) => !!V4_CALZADO[sel?.pies]

/** Calza los zapatos v4.2 en un SVG compuesto (texto). Sin calzado B10, devuelve el mismo texto. */
export function conZapatos(svg, sel) {
  const z = V4_CALZADO[sel?.pies]
  if (!z || !svg) return svg
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  if (doc.querySelector('parsererror')) return svg
  if (!calzar(doc, sel.pies, z)) return svg
  return new XMLSerializer().serializeToString(doc)
}

function calzar(doc, id, z) {
  // Solo los pies de las patas (no la zapatilla en la cola de la Serpiente).
  const usos = [...doc.querySelectorAll(`[data-footwear="${id}"]`)].filter((u) => u.closest('#legs-and-sneakers') && u.parentNode?.parentNode)
  if (!usos.length) return false
  const href = usos[0].getAttribute('href')
  const [anchoPx] = z.px
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
  const recorte = (rid, y, h) => {
    if (!doc.getElementById(rid)) {
      const c = crear(doc, 'clipPath', { id: rid })
      c.append(crear(doc, 'rect', { x: -120, y: r2(y), width: 240, height: r2(h) }))
      defsDe(doc).append(c)
    }
    return `url(#${rid})`
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
    // Deshace el giro del tobillo para que la copia calce con la pierna; el rig lo actualiza
    // cuando anima el pie (`data-contragiro`, ver animacion/rig.js).
    const copia = crear(doc, 'g', { transform: `rotate(${-giro} -10 -32)`, 'data-contragiro': '' })
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
  const desc = doc.querySelector('desc')
  if (desc) desc.textContent += ' Calzado v4.2: pierna dentro de la boca del zapato y sombra de contacto.'
  return true
}
