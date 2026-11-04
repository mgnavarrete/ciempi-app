/**
 * Serpiente y Camaleón (portado de `criaturas-v4.js` y de los ojos k3 de
 * `variantes.js` del laboratorio; solo la iteración v2 aprobada, siempre con variante).
 *
 *  - Cabeza con piel IA propia bajo el rostro; rostro IA por expresión (v2).
 *  - Serpiente: sin patas (las seis patas del maestro existen vacías, para que
 *    escena, escenaCreciente y rig.crecer cuenten igual los apoyos). Con calzado
 *    equipado lleva UNA zapatilla en la punta de la cola (AD-019/AD-020).
 *  - Camaleón: casco detrás de la cabeza, patas prensiles v2 y ojos k3
 *    «Atardecer» en todas las variantes (AD-020).
 */
import type { FormaCuerpo } from '../especie'
import type { VarianteDatos } from './datos'
import { MAESTRO_IDS, PIEZA_DE_ROL, PIES_CIEMPI, cargarJson, crear, imagen, parse, pieza, radioNucleo, recurso, type Encuadre, type Manifiesto } from './comun'
import { aplicarPatronBase, n2 } from './patrones'
import { tenirVariante } from './tinte'

type EspecieV4 = 'serpiente' | 'camaleon'
export const esV4 = (id: string): id is EspecieV4 => id === 'serpiente' || id === 'camaleon'

interface Capa { archivo: string; encuadre: Encuadre; centro?: [number, number] }
interface EntradaV2 { rostro: Capa; ojos?: (Capa | null)[]; b03?: string }
interface ManifiestoV2 { porDefecto: string; expresiones: Record<string, EntradaV2> }
interface Torreta { archivo: string; encuadre: Encuadre; ojo: [number, number, number, number]; colorParpado: string; url: string }
interface OjosK3 { torretas: Record<'torreta-izq' | 'torreta-der', Torreta>; parpado: string }
export interface BaseV4 {
  svg: string
  alas: null
  rostro: { m: ManifiestoV2; urls: Map<string, string> }
  k3: OjosK3 | null
}

/** Base SVG de una criatura V4 (texto con los ids de la base aprobada), teñida con la variante. */
export async function baseCriaturaV4(baseCiempi: string, especieId: EspecieV4, vari: VarianteDatos, forma: FormaCuerpo): Promise<BaseV4> {
  const m = await cargarJson<Manifiesto>(`${especieId}/manifiesto.json`)
  const v = (id: string) => (m.piezas.some((x) => x.id === id + '-v2') ? id + '-v2' : id)
  const url = (p: { id: string; archivo: string }) => tenirVariante(recurso(`${especieId}/${p.archivo}`), especieId, vari, p.id)
  const doc = parse(baseCiempi)

  // Cuerpo: seis segmentos con los ids del maestro (las superficies B11 se ponen en su núcleo).
  const body = doc.getElementById('body')!
  body.replaceChildren()
  for (let rol = 0; rol < 6; rol++) {
    const p = pieza(m, PIEZA_DE_ROL[rol]), id = MAESTRO_IDS[rol], r = radioNucleo(p)
    const g = crear(doc, 'g', { id, transform: `translate(${forma.xMaestro[rol]} ${forma.y[rol]})`, 'data-especie': especieId, 'data-nucleo': r })
    const defs = crear(doc, 'defs'), clip = crear(doc, 'clipPath', { id: 'clip-' + id })
    clip.append(crear(doc, 'circle', { r: r - 3 }))
    defs.append(clip)
    const nucleo = crear(doc, 'g', { 'clip-path': `url(#clip-${id})` })
    nucleo.append(crear(doc, 'g', { 'data-nucleo-vacio': '' }))
    g.append(defs, imagen(doc, await url(p), p.encuadre, { 'data-pieza': p.id }), nucleo)
    body.append(g)
  }

  // Patas: el Camaleón con pierna y pie prensil propios; la Serpiente con apoyos vacíos.
  const pies = doc.getElementById('legs-and-sneakers')!
  pies.replaceChildren()
  // En public/criaturas solo se copió la pierna v2 del Camaleón.
  const conPatas = m.piezas.some((x) => x.id === 'pierna' || x.id === 'pierna-v2')
  const [pierna, pie] = conPatas ? [pieza(m, v('pierna')), pieza(m, v('pie'))] : []
  const [urlPierna, urlPie] = conPatas ? [await url(pierna!), await url(pie!)] : []
  PIES_CIEMPI.forEach(([x, y, giro], i) => {
    const px = i === 0 || i === 5 ? x : i === 4 ? Math.min(x, forma.xMaestro[4] + 42) : forma.xMaestro[i] - 8
    const g = crear(doc, 'g', { transform: `translate(${px} ${y})`, stroke: '#243e5b', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' })
    const giroG = crear(doc, 'g', { transform: `rotate(${giro} -10 -32)` })
    if (conPatas) {
      giroG.append(imagen(doc, urlPie!, pie!.encuadre, { 'data-pieza': 'pie' }))
      g.append(imagen(doc, urlPierna!, pierna!.encuadre, { 'data-pieza': 'pierna' }), giroG)
    } else {
      g.setAttribute('data-sin-pata', '')
      g.append(giroG)
    }
    pies.append(g)
  })

  // Sin antenas: la serpiente y el camaleón no tienen.
  doc.getElementById('antennae')?.remove()

  // Cabeza: piel IA propia bajo el rostro vectorial (recortada al círculo #face);
  // se quita el sombreado naranja de Ciempi, el contorno vectorial queda encima.
  const cabeza = doc.getElementById('head')!
  const disco = [...cabeza.children].find((n) => n.localName === 'circle' && /url\(#orange\)/.test(n.getAttribute('fill') || ''))!
  const sombra = [...cabeza.children].find((n) => n.localName === 'g' && n.getAttribute('clip-path') === 'url(#face)')
  const piel = pieza(m, v('cabeza-piel'))
  const gp = crear(doc, 'g', { 'clip-path': 'url(#face)', 'data-rasgo': 'piel' })
  gp.append(imagen(doc, await url(piel), piel.encuadre, { 'data-pieza': 'cabeza-piel' }))
  disco.setAttribute('fill', '#fff9e9')
  if (sombra) sombra.replaceWith(gp)
  else disco.after(gp)

  // Casco del Camaleón: detrás de la cabeza (se guarda bajo gorros y peinados).
  const casco = m.piezas.find((x) => x.id === 'casco')
  if (casco) {
    const gc = crear(doc, 'g', { id: 'rasgos-cabeza', 'data-accessory': 'rasgos-' + especieId, 'data-rasgo': 'casco' })
    gc.append(imagen(doc, await url(casco), casco.encuadre, { 'data-pieza': 'casco' }))
    cabeza.parentNode!.insertBefore(gc, cabeza)
  }

  aplicarPatronBase(doc, vari)
  return {
    svg: new XMLSerializer().serializeToString(doc), alas: null,
    rostro: await prepararRostro(especieId, vari),
    // Ojos k3 «Atardecer», compartidos por todas las variantes del Camaleón (AD-020).
    k3: especieId === 'camaleon' ? await prepararOjosK3(vari) : null,
  }
}

// ── Rostro propio (v2) ───────────────────────────────────────────────────────
// Serpiente: #eyes → un grupo eye-i por ojo abierto o eyelids; #mouth → capa fija;
// #b03-brows vacío; sin tinte. Camaleón (siempre con ojos k3): #mouth → boca y
// mejillas v2 teñidas con la variante; ojos B03 sobre torretas k3.
async function prepararRostro(especieId: EspecieV4, vari: VarianteDatos) {
  const m = await cargarJson<ManifiestoV2>(`${especieId}/rostro-v2/manifiesto.json`)
  const urls = new Map<string, string>()
  for (const e of Object.values(m.expresiones)) {
    // El Camaleón con ojos k3 solo usa la capa `rostro` (sus torretas v2 no se dibujan).
    const capas = especieId === 'camaleon' ? [e.rostro] : [e.rostro, ...(e.ojos || [])]
    for (const capa of capas) {
      if (!capa?.archivo || urls.has(capa.archivo)) continue
      const href = recurso(`${especieId}/rostro-v2/${capa.archivo}`)
      urls.set(capa.archivo, especieId === 'camaleon' && !capa.archivo.includes('-ojo-') ? await tenirVariante(href, especieId, vari, 'rostro') : href)
    }
  }
  return { m, urls }
}

function entradaRostro(m: ManifiestoV2, expresion: unknown) {
  const lista = Object.entries(m.expresiones)
  return lista.find(([, e]) => e.b03 === expresion)?.[1] ?? lista.find(([, e]) => e.b03 === m.porDefecto)?.[1]
}

function aplicarRostro(doc: Document, efectiva: Record<string, unknown>, rostro: BaseV4['rostro'], k3: OjosK3 | null, ajustada: boolean) {
  const { m, urls } = rostro
  const e = entradaRostro(m, efectiva.expresion)
  const cabeza = doc.querySelector('g[id="head"]')
  if (!cabeza || !e) return
  const capa = (c: Capa) => imagen(doc, urls.get(c.archivo)!, c.encuadre)
  for (const n of [...cabeza.children]) if (n.localName === 'ellipse' && n.getAttribute('fill') === '#ee724b') n.remove()
  if (k3) {
    // Boca y mejillas v2 de la expresión + ojos B03 en torretas k3.
    const boca = cabeza.querySelector('[id="mouth"]')
    if (boca && !boca.hasAttribute('data-hidden')) {
      const g = crear(doc, 'g', { 'data-rostro-v2': 'rostro' })
      g.append(capa(e.rostro))
      boca.replaceChildren(g)
    }
    aplicarOjosK3(doc, cabeza, k3, ajustada)
    doc.documentElement.setAttribute('data-rostro', 'v2-k3')
    return
  }
  const ojos = cabeza.querySelector('[id="eyes"]')
  const ojosOcultos = !ojos || ojos.hasAttribute('data-hidden')
  let cejas = doc.querySelector('[id="b03-brows"]')
  if (!cejas) { cejas = crear(doc, 'g', { id: 'b03-brows' }); cabeza.insertBefore(cejas, cabeza.querySelector('[id="mouth"]')) }
  cejas.replaceChildren()
  if (!ojosOcultos) {
    const abiertos = new Map([...ojos.querySelectorAll(':scope > [data-component^="eye-"]')].map((g) => [g.getAttribute('data-component'), !!g.querySelector('ellipse')]))
    const b03 = abiertos.size > 0
    const nuevos: Element[] = []
    ;(e.ojos || []).forEach((o, i) => {
      if (!o) return
      const abierto = b03 ? abiertos.get('eye-' + i) === true : true
      const g = crear(doc, 'g', { 'data-component': abierto ? 'eye-' + i : 'eyelids', 'data-rostro-v2': 'ojo-' + i })
      g.append(capa(o))
      if (abierto) {
        const [x, y, w, h] = o.encuadre
        g.append(crear(doc, 'ellipse', { cx: o.centro?.[0] ?? x + w / 2, cy: o.centro?.[1] ?? y + h / 2, rx: w / 2, ry: h / 2, fill: 'none', opacity: 0 }))
      }
      nuevos.push(g)
    })
    nuevos.sort((a, b) => Number(a.getAttribute('data-component') === 'eyelids') - Number(b.getAttribute('data-component') === 'eyelids'))
    ojos.replaceChildren(...nuevos)
  }
  const boca = cabeza.querySelector('[id="mouth"]')
  if (boca && !boca.hasAttribute('data-hidden')) {
    const g = crear(doc, 'g', { 'data-rostro-v2': 'rostro' })
    g.append(capa(e.rostro))
    boca.replaceChildren(g)
  }
  doc.documentElement.setAttribute('data-rostro', 'v2')
}

// ── Ojos k3 «Atardecer» del Camaleón ─────────────────────────────────────────
// Torretas del concepto k3 + ojos vectoriales B03 encima, donde están en k3. Para
// que el parpadeo del rig (que escala cada ojo sobre su centro B03) siga
// funcionando, se mueve el GRUPO #eyes con una semejanza E (lleva los dos centros
// B03 a los de k3) y dentro de cada ojo se escala su contenido sobre su centro (G).
const OJOS_B03 = [[708, 342, 33, 39], [808, 320, 27, 35]]

async function prepararOjosK3(v: VarianteDatos): Promise<OjosK3> {
  const m = await cargarJson<{ torretas: Record<'torreta-izq' | 'torreta-der', Omit<Torreta, 'url'>> }>('camaleon/ojos-k3/manifiesto.json')
  const torretas = {} as OjosK3['torretas']
  for (const [id, t] of Object.entries(m.torretas) as ['torreta-izq' | 'torreta-der', Omit<Torreta, 'url'>][]) {
    const href = recurso(`camaleon/ojos-k3/${t.archivo}`)
    torretas[id] = { ...t, url: v.torreta ? await tenirVariante(href, 'torreta', { id: v.id, colores: v.torreta }, id) : href }
  }
  return { torretas, parpado: (v.torreta?.borde as string | undefined) ?? m.torretas['torreta-izq'].colorParpado }
}

/** Semejanza que lleva los centros B03 a los ojos de k3: { a, b, tx, ty, s } (x' = a x − b y + tx). */
function semejanza(destinos: number[][]) {
  const [[x1, y1], [x2, y2]] = OJOS_B03, [[u1, v1], [u2, v2]] = destinos
  const dx = x2 - x1, dy = y2 - y1, du = u2 - u1, dv = v2 - v1, n = dx * dx + dy * dy
  const a = (dx * du + dy * dv) / n, b = (dx * dv - dy * du) / n
  return { a, b, tx: u1 - (a * x1 - b * y1), ty: v1 - (b * x1 + a * y1), s: Math.hypot(a, b) }
}
const lado = (n: Element) => {
  const c = n.getAttribute('data-component')
  if (c === 'eye-0') return 0
  if (c === 'eye-1') return 1
  const m = /-?\d+(\.\d+)?/.exec(n.querySelector('[d]')?.getAttribute('d') || n.getAttribute('d') || n.querySelector('[cx]')?.getAttribute('cx') || '')
  return m && +m[0] < 760 ? 0 : 1
}
/** Cejas k3: desplazamiento de cada ceja B03 hasta donde están en el concepto. */
const CEJAS_K3 = [[4, -18], [-6, -22]]

/**
 * Aplica los ojos k3 en la cabeza ya compuesta. `ajustada`: con lentes o máscara con
 * agujeros, los ojos se quedan en su sitio B03 y las torretas se centran en ellos.
 */
function aplicarOjosK3(doc: Document, cabeza: Element, k3: OjosK3, ajustada: boolean) {
  const ojos = cabeza.querySelector('[id="eyes"]')
  if (!ojos || ojos.hasAttribute('data-hidden') || !ojos.children.length) return // máscara que tapa: sin ojos ni torretas
  const t = [k3.torretas['torreta-izq'], k3.torretas['torreta-der']]
  const destinos = t.map((x) => x.ojo.slice(0, 2))
  const E = ajustada ? { a: 1, b: 0, tx: 0, ty: 0, s: 1 } : semejanza(destinos)
  const visibles = OJOS_B03.map(([x, y]) => [E.a * x - E.b * y + E.tx, E.b * x + E.a * y + E.ty])
  // Torretas detrás de los ojos (y de las cejas), centradas en el ojo visible.
  const gt = crear(doc, 'g', { 'data-rasgo': 'torretas', 'data-ojos': 'k3' })
  t.forEach((x, i) => {
    const [ex, ey] = x.ojo, [vx, vy] = visibles[i], [X, Y, W, H] = x.encuadre
    gt.append(crear(doc, 'image', { x: n2(X + vx - ex), y: n2(Y + vy - ey), width: W, height: H, href: x.url, preserveAspectRatio: 'none', 'data-pieza': 'torreta-k3-' + i }))
  })
  ojos.parentNode!.insertBefore(gt, ojos)
  // Párpados cerrados (B03 rellena con el naranja de la paleta): color del borde de la torreta.
  for (const n of ojos.querySelectorAll('[fill="#ff9e32"]')) n.setAttribute('fill', k3.parpado)
  if (ajustada) return
  ojos.setAttribute('transform', `matrix(${n2(E.a * 1000) / 1000} ${n2(E.b * 1000) / 1000} ${n2(-E.b * 1000) / 1000} ${n2(E.a * 1000) / 1000} ${n2(E.tx)} ${n2(E.ty)})`)
  ojos.setAttribute('data-ojos', 'k3')
  // Tamaño de cada ojo: el de k3 (G sobre su centro B03, que es el que usa el rig).
  const G = t.map((x, i) => Math.min((x.ojo[2] + 3) / OJOS_B03[i][2], (x.ojo[3] + 3) / OJOS_B03[i][3]) / E.s)
  for (const hijo of [...ojos.children]) {
    if (hijo.localName === 'defs') continue
    const i = lado(hijo), [cx, cy] = OJOS_B03[i], k = n2(G[i] * 1000) / 1000
    const w = crear(doc, 'g', { transform: `translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})` })
    w.append(...hijo.childNodes)
    hijo.append(w)
  }
  // Cejas: cada trazo de la B03 se separa y se lleva a su sitio k3 (el rig mueve el grupo entero).
  const cejas = cabeza.querySelector('[id="b03-brows"]')
  if (cejas) {
    for (const p of [...cejas.querySelectorAll('path')]) {
      const trazos = (p.getAttribute('d') || '').split(/(?=M)/).filter((x) => x.trim())
      for (const d of trazos) {
        const i = +(/-?\d+(\.\d+)?/.exec(d)?.[0] ?? 0) < 760 ? 0 : 1
        const c = p.cloneNode(false) as Element
        c.setAttribute('d', d.trim())
        c.setAttribute('transform', `translate(${CEJAS_K3[i][0]} ${CEJAS_K3[i][1]})`)
        p.parentNode!.insertBefore(c, p)
      }
      p.remove()
    }
  }
}

// ── Zapatilla en la cola (Serpiente, AD-019/AD-020) ──────────────────────────
// `renderCiempi` pone el calzado B10 en las seis patas (vacías): se quitan y se pone
// UNA copia dentro del grupo de la COLA (`tail`), así acompaña al crecimiento y a
// todas las animaciones del rig. El zapato va boca abajo con la punta de la cola dentro.
const COLA_PUNTA = [-92, -84] // centro del corazón de la punta (medido en cola.webp)
const CENTRO_ZAPATO = [1, -11] // centro del calzado B10 en coordenadas de pie
const COLA_GIRO = 196
const COLA_ESCALA = 1.3

function calzarCola(doc: Document, efectiva: Record<string, unknown>) {
  const usos = [...doc.querySelectorAll('[data-footwear]')]
  if (!usos.length) return
  const modelo = usos[0].cloneNode(true)
  for (const u of usos) u.remove()
  const cola = doc.querySelector('g[id="tail"]')
  if (!cola) return
  const [px, py] = COLA_PUNTA, [bx, by] = CENTRO_ZAPATO
  const g = crear(doc, 'g', { 'data-calzado-cola': String(efectiva.pies), 'data-zapatilla-cola': '' })
  // Sombra de contacto sobre la cola, justo debajo del cuello del zapato.
  g.append(crear(doc, 'ellipse', { cx: px + 8, cy: py + 40, rx: 17, ry: 6, fill: '#243e5b', opacity: 0.28 }))
  const zapato = crear(doc, 'g', { transform: `translate(${px} ${py}) rotate(${COLA_GIRO}) scale(${COLA_ESCALA}) translate(${-bx} ${-by})` })
  zapato.append(modelo)
  g.append(zapato)
  cola.append(g)
}

/** Retoques sobre la composición ya hecha por `renderCiempi` (también en cada rostro del rig). */
export function posprocesarV4(doc: Document, especieId: string, efectiva: Record<string, unknown>, base: BaseV4, ajustada: boolean) {
  if (!esV4(especieId)) return
  aplicarRostro(doc, efectiva, base.rostro, base.k3, ajustada)
  if (especieId === 'serpiente') {
    calzarCola(doc, efectiva)
    // La mochila se apoya en el segmento delantero, que en la serpiente está 44 u más abajo.
    const dy = 446 - 402
    for (const b of doc.querySelectorAll('[data-bag]')) b.setAttribute('transform', `translate(0 ${dy})`)
  }
  doc.documentElement.setAttribute('data-especie-v4', especieId)
}
