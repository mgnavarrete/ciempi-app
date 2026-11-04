/**
 * Patrones de superficie de las variantes y cabeza vectorial recoloreada
 * (portado de `variantes.js` del laboratorio, sin cambios de dibujo).
 * El patrón es una capa vectorial dentro del núcleo de cada segmento, con el
 * mismo recorte que las superficies B11: acompaña al crecimiento y al rig.
 */
import type { Patron, VarianteDatos } from './datos'
import { aHex, hslARgb, hslDe } from './tinte'

const NS = 'http://www.w3.org/2000/svg'
const NAVY = '#243e5b'
/** Colores de la cabeza vectorial de la base (paleta clásica 0–2 y su sombra). */
const CABEZA_CLASICA = ['#ffb449', '#ff9e32', '#f58b2d', '#e8752b']

/** Cuatro tonos para la cabeza vectorial (como la progresión de la paleta clásica). */
const tonosCabeza = (c: string) => { const [h, s, l] = hslDe(c); return [0.05, 0, -0.035, -0.07].map((d) => aHex(hslARgb(h, s, Math.max(0.08, Math.min(0.97, l + d))))) }

/** Recolorea la cabeza vectorial (Dragón/Cuncuna) en el texto de la base. */
export function recolorCabeza(svg: string, v: VarianteDatos): string {
  if (!v.cabeza) return svg
  const t = tonosCabeza(v.cabeza)
  return CABEZA_CLASICA.reduce((s, c, i) => s.replaceAll(c, t[i]), svg)
}

export const n2 = (x: number) => Math.round(x * 100) / 100
/** Estrella de 4 puntas (destello) centrada en (x, y) con radio r. */
const destello = (x: number, y: number, r: number, fill: string, extra = '') =>
  `<path d="M${n2(x)} ${n2(y - r)} Q${n2(x + r * 0.18)} ${n2(y - r * 0.18)} ${n2(x + r)} ${n2(y)} Q${n2(x + r * 0.18)} ${n2(y + r * 0.18)} ${n2(x)} ${n2(y + r)} Q${n2(x - r * 0.18)} ${n2(y + r * 0.18)} ${n2(x - r)} ${n2(y)} Q${n2(x - r * 0.18)} ${n2(y - r * 0.18)} ${n2(x)} ${n2(y - r)}Z" fill="${fill}" ${extra}/>`
const estrella5 = (x: number, y: number, r: number, fill: string, extra = '') => {
  const p: string[] = []
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.48 : r; p.push(`${n2(x + rr * Math.cos(a))} ${n2(y + rr * Math.sin(a))}`) }
  return `<path d="M${p.join(' L')}Z" fill="${fill}" stroke-linejoin="round" ${extra}/>`
}
// Desplazamientos por rol, para que los segmentos no parezcan sellos idénticos.
const JIT = [[0.05, 0.02], [-0.06, 0], [0.04, 0.03], [-0.02, -0.02], [0.03, 0.01], [-0.04, 0.02]]

/** Capa de patrón (texto SVG) en coordenadas del segmento (centro de la bola = 0,0; radio r). */
function patronSVG(p: Patron, r: number, rol: number): string {
  const [jx, jy] = JIT[rol] || [0, 0]
  const X = (f: number) => n2((f + jx) * r), Y = (f: number) => n2((f + jy) * r), R = (f: number) => n2(f * r)
  const [c0, c1, c2] = p.colores
  switch (p.tipo) {
    case 'llamas': {
      const llama = (x: number, y: number, h: number, fo: string, fi: string) => {
        const d = (k: number) => `M0 0 C${-0.5 * k} 0 ${-0.56 * k} ${-0.5 * k} ${-0.2 * k} ${-0.78 * k} C${-0.2 * k} ${-0.52 * k} 0 ${-0.48 * k} ${0.06 * k} ${-0.62 * k} C${0.12 * k} ${-0.86 * k} ${0.3 * k} ${-0.96 * k} ${0.32 * k} ${-1.02 * k} C${0.3 * k} ${-0.76 * k} ${0.62 * k} ${-0.52 * k} ${0.46 * k} ${-0.2 * k} C${0.38 * k} ${-0.04 * k} ${0.2 * k} 0 0 0Z`
        return `<g transform="translate(${x} ${y}) scale(${n2(h)})"><path d="${d(1)}" fill="${fo}"/><path d="${d(0.55)}" fill="${fi}" transform="translate(0.02 -0.02)"/></g>`
      }
      return llama(X(-0.08), Y(0.05), r * 0.62, c0, c1) + llama(X(0.42), Y(-0.08), r * 0.3, c0, c1)
    }
    case 'escarcha': {
      const copo = (x: number, y: number, s: number) => {
        let d = ''
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI) / 3, ca = Math.cos(a), sa = Math.sin(a)
          d += `M${n2(x - ca * s)} ${n2(y - sa * s)} L${n2(x + ca * s)} ${n2(y + sa * s)} `
          for (const sg of [1, -1]) {
            const bx = x + sg * ca * s * 0.62, by = y + sg * sa * s * 0.62
            for (const t of [0.5, -0.5]) {
              const ta = a + (sg > 0 ? 0 : Math.PI) + t * 1.4
              d += `M${n2(bx)} ${n2(by)} L${n2(bx + Math.cos(ta) * s * 0.3)} ${n2(by + Math.sin(ta) * s * 0.3)} `
            }
          }
        }
        return `<path d="${d}" fill="none" stroke="${c0}" stroke-width="${n2(s * 0.13)}" stroke-linecap="round"/>`
      }
      return copo(X(-0.05), Y(-0.36), r * 0.27) + destello(X(0.42), Y(-0.05), r * 0.1, c1) + `<circle cx="${X(-0.45)}" cy="${Y(-0.05)}" r="${R(0.04)}" fill="${c0}"/>`
    }
    case 'estrellas':
      return `<circle cx="${X(-0.08)}" cy="${Y(-0.36)}" r="${R(0.22)}" fill="${c0}" opacity="0.22"/>` + destello(X(-0.08), Y(-0.36), r * 0.2, c0) +
        destello(X(0.4), Y(-0.06), r * 0.09, c0) +
        [[-0.42, -0.06, 0.045], [0.18, 0.02, 0.035], [0.3, -0.48, 0.04], [-0.4, -0.5, 0.03]].map(([x, y, s]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="${R(s * 1.9)}" fill="${c1}" opacity="0.3"/><circle cx="${X(x)}" cy="${Y(y)}" r="${R(s)}" fill="${c1}"/>`).join('')
    case 'piedras':
      return [[-0.42, -0.12, 0.09, 0.06], [0.38, -0.02, 0.07, 0.05], [0.22, -0.55, 0.05, 0.035], [-0.15, 0.08, 0.06, 0.04]].map(([x, y, a, b], i) =>
        `<ellipse cx="${X(x)}" cy="${Y(y)}" rx="${R(a)}" ry="${R(b)}" fill="${c0}" opacity="${i % 2 ? 0.55 : 0.7}"/>`).join('') +
        `<g transform="translate(${X(0)} ${Y(-0.3)}) scale(1.6)"><path d="M0 ${R(-0.2)} L${R(0.12)} ${R(-0.07)} L${R(0.09)} ${R(0.16)} L${R(-0.09)} ${R(0.16)} L${R(-0.12)} ${R(-0.07)}Z" fill="${c1}" stroke="${NAVY}" stroke-width="${R(0.035)}" stroke-linejoin="round"/>` +
        `<path d="M0 ${R(-0.2)} L${R(0.12)} ${R(-0.07)} L0 ${R(-0.02)}Z" fill="#ffffff" opacity="0.75"/><path d="M0 ${R(-0.02)} L${R(0.09)} ${R(0.16)} L${R(-0.09)} ${R(0.16)} L${R(-0.12)} ${R(-0.07)}Z" fill="${c2}" opacity="0.55"/></g>`
    case 'nacar':
      return [[-0.32, -0.3], [0.02, -0.42], [0.34, -0.26], [-0.14, -0.06], [0.2, 0.0]].map(([x, y]) =>
        `<path d="M${X(x - 0.12)} ${Y(y)} Q${X(x)} ${Y(y + 0.14)} ${X(x + 0.12)} ${Y(y)}" fill="none" stroke="${c0}" stroke-width="${R(0.04)}" stroke-linecap="round" opacity="0.85"/>`).join('') +
        destello(X(-0.36), Y(-0.52), r * 0.07, c1)
    case 'gemas': {
      const g = `<g transform="translate(${X(0)} ${Y(-0.3)}) scale(1.3)">` +
        `<path d="M0 ${R(-0.24)} L${R(0.14)} ${R(-0.1)} L${R(0.14)} ${R(0.1)} L0 ${R(0.24)} L${R(-0.14)} ${R(0.1)} L${R(-0.14)} ${R(-0.1)}Z" fill="${c0}" stroke="${NAVY}" stroke-width="${R(0.035)}" stroke-linejoin="round"/>` +
        `<path d="M0 ${R(-0.24)} L${R(0.06)} 0 L0 ${R(0.24)} L${R(-0.06)} 0Z" fill="${c1}" opacity="0.45"/>` +
        `<path d="M0 ${R(-0.24)} L${R(-0.14)} ${R(-0.1)} L${R(-0.06)} 0Z" fill="#ffffff" opacity="0.8"/></g>`
      return g + [[-0.42, -0.1], [0.4, -0.06], [0.3, -0.56], [-0.3, -0.56]].map(([x, y]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="${R(0.035)}" fill="${c2}"/>`).join('')
    }
    case 'flores': {
      const flor = (x: number, y: number, s: number, petalo: string, centro: string) => {
        let d = ''
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; d += `<circle cx="${n2(x + Math.cos(a) * s)}" cy="${n2(y + Math.sin(a) * s)}" r="${n2(s * 0.78)}" fill="${petalo}" stroke="${NAVY}" stroke-width="${n2(s * 0.16)}"/>` }
        return d + `<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(s * 0.62)}" fill="${centro}" stroke="${NAVY}" stroke-width="${n2(s * 0.16)}"/>`
      }
      return flor(X(-0.12), Y(-0.3), r * 0.085, rol % 2 ? c0 : c1, c2) + flor(X(0.36), Y(-0.02), r * 0.055, rol % 2 ? c1 : c0, c2)
    }
    case 'semillas':
      return [[-0.38, -0.38], [-0.05, -0.5], [0.3, -0.38], [-0.45, -0.05], [-0.15, -0.18], [0.17, -0.12], [0.45, -0.02], [0.0, 0.12]].map(([x, y]) =>
        `<ellipse cx="${X(x)}" cy="${Y(y)}" rx="${R(0.033)}" ry="${R(0.055)}" fill="${c0}" transform="rotate(${n2(x * 30)} ${X(x)} ${Y(y)})"/>`).join('')
    case 'brotes': {
      const [lila, tallo] = p.colores
      let s = `<path d="M${X(-0.02)} ${Y(0.02)} Q${X(0.02)} ${Y(-0.25)} ${X(-0.04)} ${Y(-0.55)}" fill="none" stroke="${tallo}" stroke-width="${R(0.035)}" stroke-linecap="round"/>`
      for (const [x, y, a] of [[-0.04, -0.55, 0], [-0.1, -0.46, -30], [0.03, -0.44, 30], [-0.08, -0.34, -30], [0.05, -0.32, 30], [-0.05, -0.22, -25], [0.05, -0.2, 25]])
        s += `<ellipse cx="${X(x)}" cy="${Y(y)}" rx="${R(0.035)}" ry="${R(0.055)}" fill="${lila}" transform="rotate(${a} ${X(x)} ${Y(y)})"/>`
      return s + `<circle cx="${X(0.4)}" cy="${Y(-0.1)}" r="${R(0.03)}" fill="${lila}" opacity="0.7"/><circle cx="${X(-0.42)}" cy="${Y(-0.2)}" r="${R(0.025)}" fill="${lila}" opacity="0.7"/>`
    }
    case 'hojas': {
      const hoja = (x: number, y: number, s: number, a: number) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M${n2(-s)} 0 Q0 ${n2(-s * 0.7)} ${n2(s)} 0 Q0 ${n2(s * 0.7)} ${n2(-s)} 0Z" fill="${c0}" stroke="${NAVY}" stroke-width="${n2(s * 0.12)}" stroke-linejoin="round"/><path d="M${n2(-s * 0.8)} 0 L${n2(s * 0.7)} 0" stroke="${c1}" stroke-width="${n2(s * 0.1)}" stroke-linecap="round"/></g>`
      return hoja(X(-0.05), Y(-0.32), r * 0.2, -35 + rol * 9) + hoja(X(0.38), Y(-0.02), r * 0.11, 20)
    }
    case 'destellos':
      return destello(X(-0.12), Y(-0.36), r * 0.15, c0) + ((p.cantidad ?? 0) > 1 ? destello(X(0.34), Y(-0.08), r * 0.08, c0) : '') + ((p.cantidad ?? 0) > 2 ? destello(X(-0.42), Y(-0.02), r * 0.06, c0) : '')
    case 'rombos':
      return `<path d="M${X(0)} ${Y(-0.62)} L${X(0.2)} ${Y(-0.37)} L${X(0)} ${Y(-0.12)} L${X(-0.2)} ${Y(-0.37)}Z" fill="${c0}" stroke="${NAVY}" stroke-width="${R(0.035)}" stroke-linejoin="round"/>`
    case 'estrellas5':
      return estrella5(X(-0.1), Y(-0.36), r * 0.13, c0) + estrella5(X(0.32), Y(-0.1), r * 0.08, c0) + `<circle cx="${X(-0.42)}" cy="${Y(-0.08)}" r="${R(0.03)}" fill="${c0}"/><circle cx="${X(0.2)}" cy="${Y(-0.56)}" r="${R(0.025)}" fill="${c0}"/>`
    case 'zigzag': {
      const pts: string[] = []
      for (let i = 0; i <= 6; i++) pts.push(`${n2((-1 + i / 3) * r)} ${n2((-0.22 + (i % 2 ? -0.13 : 0.06)) * r)}`)
      return `<path d="M${pts.join(' L')}" fill="none" stroke="${c0}" stroke-width="${R(0.11)}" stroke-linejoin="round" stroke-linecap="round"/>`
    }
    case 'franja':
      return `<path d="M${n2(-r)} ${Y(-0.02)} C${n2(-0.6 * r)} ${Y(-0.2)} ${n2(-0.3 * r)} ${Y(0.12)} 0 ${Y(-0.04)} S${n2(0.6 * r)} ${Y(-0.18)} ${n2(r)} ${Y(-0.02)}" fill="none" stroke="${c0}" stroke-width="${R(0.12)}" stroke-linecap="round"/>`
    case 'nubes': {
      const nube = (x: number, y: number, s: number) => `<g fill="${c0}"><circle cx="${n2(x - s)}" cy="${n2(y)}" r="${n2(s * 0.75)}"/><circle cx="${n2(x)}" cy="${n2(y - s * 0.35)}" r="${n2(s)}"/><circle cx="${n2(x + s)}" cy="${n2(y)}" r="${n2(s * 0.7)}"/><rect x="${n2(x - s)}" y="${n2(y - s * 0.1)}" width="${n2(2 * s)}" height="${n2(s * 0.85)}"/></g>`
      return nube(X(-0.2), Y(-0.12), r * 0.15) + nube(X(0.36), Y(-0.42), r * 0.09)
    }
    case 'pecas':
      return [[-0.36, -0.42], [-0.22, -0.5], [-0.3, -0.3], [0.12, -0.46], [0.24, -0.36], [0.32, -0.5], [0.4, -0.12], [-0.42, -0.08]].map(([x, y]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="${R(0.028)}" fill="${c0}"/>`).join('')
    default: return ''
  }
}

const SEGMENTOS = ['tail', 'mint-back', 'yellow-middle', 'orange-middle', 'mint-front', 'segmento-d']

/**
 * Inserta el patrón de la variante en cada segmento de la base (doc DOM): detrás del
 * núcleo (las superficies B11 quedan encima) y recortado con el mismo clip del núcleo.
 */
export function aplicarPatronBase(doc: Document, v: VarianteDatos) {
  const patron = v.patron
  if (!patron) return
  SEGMENTOS.forEach((id, rol) => {
    const g = doc.getElementById(id)
    const r = Number(g?.getAttribute('data-nucleo'))
    if (!g || !r) return
    const nucleo = [...g.children].find((n) => n.localName === 'g' && n.getAttribute('clip-path') === `url(#clip-${id})`)
    const k = patron.escala || 1, cy = n2(-0.3 * (r - 3))
    const dentro = k === 1 ? patronSVG(patron, r - 3, rol) : `<g transform="translate(0 ${cy}) scale(${k}) translate(0 ${-cy})">${patronSVG(patron, r - 3, rol)}</g>`
    const frag = new DOMParser().parseFromString(`<svg xmlns="${NS}"><g clip-path="url(#clip-${id})" data-patron-variante="${patron.tipo}">${dentro}</g></svg>`, 'image/svg+xml')
    const capa = doc.importNode(frag.documentElement.firstChild!, true)
    g.insertBefore(capa, nucleo ?? null)
  })
}
