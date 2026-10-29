// Rig 2D por partes de Ciempi, exclusivo del laboratorio de animaciones.
// Recibe la composición SVG exacta del laboratorio de vestuario (base v2 +
// accesorios) y la reparte en partes que solo se trasladan, giran o escalan.
// No redibuja la anatomía: cada trazado es el aprobado.

const NS = 'http://www.w3.org/2000/svg'
/** Puntos de giro, en unidades de la base (viewBox 0 0 1000 650). */
export const PIVOTES = {
  suelo: [493, 574],
  centro: [480, 400],
  cabeza: [690, 445], // donde la cabeza se apoya en el segmento delantero
  cuello: [640, 380], // broche de capas y bufandas
  cadera: [-7, -86], // en coordenadas de cada pata (su origen es el pie)
  tobillo: [-10, -32], // giro del calzado, el mismo del compositor
}

let instancias = 0
const OJOS_BASE = [[708, 342, 33, 39], [808, 320, 27, 35]]
/** Encuadre del laboratorio, en unidades de la base. */
export const VISTA = [0, -150, 1000, 800]

const crear = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v)
  return n
}
const envolver = (nodo, attrs) => {
  const g = crear('g', attrs)
  nodo.parentNode.insertBefore(g, nodo)
  g.append(nodo)
  return g
}
const leerTraslado = (t) => {
  const m = /translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)/.exec(t || '')
  return m ? [+m[1], +m[2]] : [0, 0]
}
const leerGiro = (t) => {
  const m = /rotate\(\s*(-?[\d.]+)/.exec(t || '')
  return m ? +m[1] : 0
}
const r2 = (n) => Math.round(n * 100) / 100

/** Renombra todos los id (y sus referencias) para poder tener varios Ciempi en la misma página. */
function aislarIds(raiz, prefijo) {
  const mapa = new Map()
  for (const n of raiz.querySelectorAll('[id]')) mapa.set(n.id, prefijo + n.id)
  if (raiz.id) mapa.set(raiz.id, prefijo + raiz.id)
  const todos = [raiz, ...raiz.querySelectorAll('*')]
  for (const n of todos) {
    if (n.id && mapa.has(n.id)) n.id = mapa.get(n.id)
    for (const a of [...n.attributes]) {
      let v = a.value
      if ((a.localName === 'href') && v.startsWith('#') && mapa.has(v.slice(1))) v = '#' + mapa.get(v.slice(1))
      if (v.includes('url(#')) v = v.replace(/url\(#([^)]+)\)/g, (s, id) => (mapa.has(id) ? `url(#${mapa.get(id)})` : s))
      if (v !== a.value) n.setAttributeNS(a.namespaceURI, a.name, v)
    }
  }
}

/** Separa un trazado con varios «M» en un trazado por subtrazado (las dos antenas vienen juntas). */
function separarSubtrazados(path) {
  const d = path.getAttribute('d')
  const partes = d.split(/(?=M)/).map((s) => s.trim()).filter(Boolean)
  if (partes.length < 2) return [path]
  const nuevos = partes.map((p) => {
    const c = path.cloneNode()
    c.setAttribute('d', p)
    return c
  })
  path.replaceWith(...nuevos)
  return nuevos
}
const primerPunto = (n) => {
  if (n.localName === 'circle') return [+n.getAttribute('cx'), +n.getAttribute('cy')]
  const m = /M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/.exec(n.getAttribute('d') || '')
  return m ? [+m[1], +m[2]] : [0, 0]
}

/**
 * Crea un Ciempi animable.
 *
 * `fuente`: el SVG compuesto (texto, en el laboratorio) o un grupo ya dibujado
 * con esa composición (en el juego, la escena de `pose.ts`, con cualquier
 * cantidad de segmentos y sus ids aislados con `opciones.prefijo`).
 * `info`: { cabeza, expresion } de la selección, para reconocer gorros y el rostro inicial.
 * `obtenerRostro(id)`: la composición del mismo conjunto con otra expresión B03.
 */
export function crearRig(fuente, info = {}, obtenerRostro = null, opciones = {}) {
  const rostros = new Map()
  const prefijo = `r${++instancias}-`
  const deTexto = typeof fuente === 'string'
  let svg
  if (deTexto) {
    const doc = new DOMParser().parseFromString(fuente, 'image/svg+xml')
    if (doc.querySelector('parsererror')) throw Error('SVG compuesto inválido')
    svg = document.importNode(doc.documentElement, true)
    svg.removeAttribute('width')
    svg.removeAttribute('height')
    // Más cielo que la base: saltos y efectos caben en cuadro.
    svg.setAttribute('viewBox', VISTA.join(' '))
    svg.setAttribute('overflow', 'visible')
  } else svg = fuente
  // Ids de la composición sin el prefijo con que la escena los aisló.
  const previo = deTexto ? '' : opciones.prefijo ?? ''
  const idDe = (n) => (n.id && previo && n.id.startsWith(previo) ? n.id.slice(previo.length) : n.id)
  const conId = (raizBusqueda, id) => [...raizBusqueda.querySelectorAll('[id]')].find((n) => idDe(n) === id) ?? null

  // ── Capas superiores: sombras en el suelo; todo lo demás dentro de la raíz.
  const sombras = crear('g', { 'data-rig': 'sombras' })
  const raiz = crear('g', { 'data-rig': 'raiz' })
  const efectos = crear('g', { 'data-rig': 'efectos', 'pointer-events': 'none' })
  const hijos = [...svg.children].filter((n) => !['title', 'desc', 'defs', 'style'].includes(n.localName))
  const primero = hijos[0]
  svg.insertBefore(sombras, primero)
  svg.insertBefore(raiz, primero)
  for (const n of hijos) (n.localName === 'ellipse' ? sombras : raiz).append(n)
  svg.append(efectos)
  const sombraGeneral = sombras.children[0]
  const sombrasPies = [...sombras.children].slice(1)
  const opacidadBase = new Map([...sombras.children].map((n) => [n, +(n.getAttribute('opacity') ?? 1)]))

  // ── Clasificación de cada pieza de la composición según la parte que sigue.
  const parteDe = (n) => {
    const id = idDe(n) || ''
    if (id === 'legs-and-sneakers') return 'patas'
    if (id === 'body') return 'cuerpo'
    if (['head', 'jockey', 'antennae', 'face-accessory'].includes(id)) return 'cabeza'
    if (n.hasAttribute('data-accessory')) return 'cabeza' // peinados (B05)
    if (n.hasAttribute('data-costume')) return info.cabeza && id.startsWith(info.cabeza) ? 'cabeza' : 'espalda' // gorros/máscaras o capas
    if (id === 'neck-front' || id.startsWith('lab-scarf')) return 'cuello'
    if (n.hasAttribute('data-bag') || id === 'back-accessory') return 'espalda'
    return 'raiz'
  }
  const partes = { cabeza: [], cuello: [], espalda: [], raiz: [] }
  let patasG = null
  let cuerpoG = null
  for (const n of [...raiz.children]) {
    const parte = parteDe(n)
    if (parte === 'patas') patasG = n
    else if (parte === 'cuerpo') cuerpoG = n
    else partes[parte].push(envolver(n, { 'data-parte': parte }))
  }

  // ── Patas, de la cola a la cabeza: el pie es el origen de cada una y la
  // cadera queda dentro del cuerpo. Con otro largo, la escena envuelve cada pata
  // en un grupo que la traslada: se anima la pata de adentro.
  const esPata = (g) => [...g.children].some((c) => c.localName === 'g' && /rotate\(/.test(c.getAttribute('transform') || ''))
  const patas = [...(patasG?.children || [])].map((g) => (esPata(g) ? g : [...g.querySelectorAll('g')].find(esPata))).filter(Boolean).map((g) => {
    const giro = [...g.children].find((c) => c.localName === 'g' && /rotate\(/.test(c.getAttribute('transform') || ''))
    return { g, base: leerTraslado(g.getAttribute('transform')), giro, giroBase: leerGiro(giro?.getAttribute('transform')) }
  })

  // ── Segmentos del cuerpo, de la cola a la cabeza (las superficies B11 van dentro y los acompañan).
  const segmentos = [...(cuerpoG?.children || [])]
    .filter((g) => g.localName === 'g')
    .map((g) => ({ g, base: leerTraslado(g.getAttribute('transform')) }))

  // ── Antenas: cada una gira desde su base, con movimiento propio.
  const antenas = []
  const antenasG = conId(raiz, 'antennae')
  if (antenasG) {
    const elementos = [...antenasG.children].flatMap((n) => (n.localName === 'path' ? separarSubtrazados(n) : [n]))
    // Los tallos son los subtrazados que empiezan abajo (base) y suben.
    const tallos = elementos.filter((n) => n.localName === 'path' && n.getAttribute('fill') === 'none' && primerPunto(n)[1] > 190)
    const bases = tallos.map(primerPunto).sort((a, b) => a[0] - b[0])
    const lados = bases.map((base) => ({ g: crear('g', { 'data-antena': base[0] }), base }))
    for (const n of elementos) {
      const x = primerPunto(n)[0]
      const lado = lados.reduce((a, b) => (Math.abs(b.base[0] - x) < Math.abs(a.base[0] - x) ? b : a), lados[0])
      lado?.g.append(n)
    }
    antenasG.replaceChildren(...lados.map((l) => l.g))
    antenas.push(...lados)
  }

  const cabezaG = conId(raiz, 'head')
  // Rubor: cada mejilla crece desde su propio centro, recortada al círculo del rostro.
  const rubor = [...(cabezaG?.children || [])]
    .filter((n) => n.localName === 'ellipse' && n.getAttribute('fill') === '#ee724b')
    .map((n) => ({ g: envolver(n, { 'clip-path': `url(#${previo}face)` }), c: [+n.getAttribute('cx'), +n.getAttribute('cy')] }))

  // ── Rostro (ojos, cejas, boca): se puede cambiar por otra expresión B03.
  const rostro = { ojos: [], cejas: null, expresion: info.expresion ?? null }
  const prepararRostro = () => {
    rostro.ojos = []
    // Solo dentro de la cabeza: otras piezas podrían tener ids parecidos.
    const ojos = cabezaG?.querySelector('[id="eyes"], [id$="-eyes"]')
    rostro.cejas = cabezaG?.querySelector('[id="b03-brows"], [id$="-b03-brows"]')
    if (!ojos || !ojos.children.length) return
    let grupos = [...ojos.querySelectorAll(':scope > [data-component^="eye-"]')]
    if (!grupos.length) {
      // Ojos históricos: se agrupan por lado, dejando las cejas fuera.
      const piezas = [...ojos.children].filter((n) => !(n.localName === 'path' && n.getAttribute('fill') === 'none'))
      const izq = crear('g'), der = crear('g')
      for (const n of piezas) ((n.hasAttribute('cx') ? +n.getAttribute('cx') : primerPunto(n)[0]) < 760 ? izq : der).append(n)
      ojos.prepend(izq, der)
      grupos = [izq, der]
    }
    // Centros y radios de los ojos de la base v2: las expresiones B03 conservan esa geometría.
    grupos.forEach((g, i) => {
      const [cx, cy, rx, ry] = OJOS_BASE[i] ?? OJOS_BASE[1]
      const w = envolver(g, { 'data-ojo': '' })
      const iris = g.querySelector('[data-component="iris-pupil"]')
      // Párpado: una línea del contorno que aparece al cerrar el ojo.
      const parpado = crear('path', {
        d: `M${cx - rx * 0.95} ${cy} Q${cx} ${cy + ry * 0.32} ${cx + rx * 0.95} ${cy}`,
        fill: 'none', stroke: '#243e5b', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0,
      })
      w.after(parpado)
      rostro.ojos.push({ w, cx, cy, rx, ry, iris, parpado, abierto: !!g.querySelector('ellipse') })
    })
  }
  prepararRostro()

  if (deTexto) aislarIds(svg, prefijo)

  // ── Efectos (estrellas, corazones, zetas…): dibujos del laboratorio, no del personaje.
  const efectosPool = []

  const rig = {
    svg,
    prefijo,
    tieneAntenas: antenas.length === 2,
    ojosVisibles: () => rostro.ojos.length > 0,
    /**
     * Cambia ojos, cejas y boca por los de otra expresión B03, tomados de la
     * composición del mismo conjunto con esa expresión (`obtenerRostro(id)`).
     */
    /** Prepara de antemano una expresión, para que el cambio no demore un cuadro. */
    precargarRostro(id) {
      if (!id || rostros.has(id) || !obtenerRostro) return
      const d = new DOMParser().parseFromString(obtenerRostro(id), 'image/svg+xml')
      const otro = document.importNode(d.documentElement, true)
      aislarIds(otro, `${prefijo}e-${id}-`)
      const cabezaOtra = otro.querySelector(`[id="${prefijo}e-${id}-head"]`)
      rostros.set(id, ['eyes', 'b03-brows', 'mouth'].map((nombre) => [nombre, cabezaOtra?.querySelector(`[id$="-${nombre}"]`)]))
    },
    cambiarRostro(id) {
      if (!id || rostro.expresion === id || !obtenerRostro) return
      this.precargarRostro(id)
      for (const [nombre, nuevo] of rostros.get(id)) {
        const actual = cabezaG.querySelector(`[id$="-${nombre}"]`)
        if (nuevo && actual) actual.replaceWith(nuevo.cloneNode(true))
      }
      prepararRostro()
      rostro.expresion = id
    },
    aplicar(p) {
      const pr = p.raiz
      const [gx, gy] = PIVOTES.suelo, [cx, cy] = PIVOTES.centro
      raiz.setAttribute('transform',
        `translate(${r2(pr.x)} ${r2(pr.y)}) rotate(${r2(pr.giroCentro)} ${cx} ${cy}) translate(${gx} ${gy}) scale(${r2(pr.sx)} ${r2(pr.sy)}) translate(${-gx} ${-gy}) rotate(${r2(pr.rot)} ${gx} ${gy})`)

      segmentos.forEach((s, i) => {
        const q = p.segmentos[i]
        if (!q) return
        s.g.setAttribute('transform', `translate(${r2(s.base[0] + q.x)} ${r2(s.base[1] + q.y)}) rotate(${r2(q.rot)}) scale(${r2(q.sx)} ${r2(q.sy)})`)
      })

      patas.forEach((pata, i) => {
        const q = p.patas[i]
        if (!q) return
        const [hx, hy] = PIVOTES.cadera
        pata.g.setAttribute('transform', `translate(${r2(pata.base[0] + q.x)} ${r2(pata.base[1] + q.y)}) rotate(${r2(q.rot)} ${hx} ${hy})`)
        if (pata.giro) pata.giro.setAttribute('transform', `rotate(${r2(pata.giroBase + q.pie)} ${PIVOTES.tobillo.join(' ')})`)
      })

      const c = p.cabeza
      const [hx, hy] = PIVOTES.cabeza
      const cabezaT = `translate(${r2(c.x)} ${r2(c.y)}) rotate(${r2(c.rot)} ${hx} ${hy}) translate(${hx} ${hy}) scale(${r2(c.s)}) translate(${-hx} ${-hy})`
      for (const g of partes.cabeza) g.setAttribute('transform', cabezaT)
      // Cuello: entre la cabeza y el segmento delantero.
      const frente = p.segmentos[p.segmentos.length - 1] ?? { x: 0, y: 0 }
      for (const g of partes.cuello)
        g.setAttribute('transform', `translate(${r2((c.x + frente.x) / 2)} ${r2((c.y + frente.y) / 2)}) rotate(${r2(c.rot * 0.5)} ${hx} ${hy})`)
      const [nx, ny] = PIVOTES.cuello
      for (const g of partes.espalda)
        g.setAttribute('transform', `translate(${r2(frente.x + c.x * 0.3)} ${r2(frente.y + c.y * 0.3)}) rotate(${r2(p.espalda.rot)} ${nx} ${ny})`)

      antenas.forEach((a, i) => {
        a.g.setAttribute('transform', `rotate(${r2(p.antenas[i])} ${a.base[0]} ${a.base[1]})`)
      })
      for (const { g, c } of rubor) {
        g.setAttribute('transform', `translate(${c[0]} ${c[1]}) scale(${r2(p.rubor)}) translate(${-c[0]} ${-c[1]})`)
        g.setAttribute('opacity', r2(Math.min(1, 0.88 + (p.rubor - 1) * 1.2)))
      }

      rostro.ojos.forEach((o, i) => {
        const cierre = Math.min(1, Math.max(0, p.ojos.parpadeo[i] ?? 0))
        const sy = Math.max(0.06, 1 - cierre) * p.ojos.escala
        o.w.setAttribute('transform', `translate(${o.cx} ${o.cy}) scale(${r2(p.ojos.escala)} ${r2(sy)}) translate(${-o.cx} ${-o.cy})`)
        // Casi cerrado: solo queda la línea del párpado (sin la franja aplastada del ojo).
        o.w.setAttribute('opacity', cierre > 0.8 && o.abierto ? 0 : 1)
        o.parpado.setAttribute('opacity', cierre > 0.55 && o.abierto ? 1 : 0)
        if (o.iris) o.iris.setAttribute('transform', `translate(${r2(p.ojos.mirarX)} ${r2(p.ojos.mirarY)})`)
      })
      if (rostro.cejas) rostro.cejas.setAttribute('transform', `translate(0 ${r2(p.cejas)})`)

      // Sombras: la general se achica al saltar; la de cada pie sigue a su pie.
      const altura = Math.max(0, -pr.y)
      if (sombraGeneral) {
        const k = Math.max(0.45, 1 - altura / 260)
        sombraGeneral.setAttribute('transform', `translate(${r2(pr.x)} 0) translate(${gx} ${gy}) scale(${r2(k)} 1) translate(${-gx} ${-gy})`)
        sombraGeneral.setAttribute('opacity', r2(k * opacidadBase.get(sombraGeneral)))
      }
      sombrasPies.forEach((s, i) => {
        const q = p.patas[i]
        if (!q) return
        const alto = altura + Math.max(0, -q.y)
        const k = Math.max(0.2, 1 - alto / 90)
        const x0 = +s.getAttribute('cx')
        s.setAttribute('transform', `translate(${r2(pr.x + q.x)} 0) translate(${x0} ${gy}) scale(${r2(k)}) translate(${-x0} ${-gy})`)
        s.setAttribute('opacity', Math.round(k * opacidadBase.get(s) * 1000) / 1000)
      })

      dibujarEfectos(p.efectos || [])
    },
  }

  function dibujarEfectos(lista) {
    lista.forEach((e, i) => {
      let n = efectosPool[i]
      if (!n || n.dataset.tipo !== e.tipo) {
        const nuevo = crear('g', { 'data-tipo': e.tipo })
        nuevo.innerHTML = DIBUJOS[e.tipo] || ''
        if (n) n.replaceWith(nuevo)
        else efectos.append(nuevo)
        efectosPool[i] = n = nuevo
      }
      n.setAttribute('transform', `translate(${r2(e.x)} ${r2(e.y)}) rotate(${r2(e.rot || 0)}) scale(${r2(e.s ?? 1)})`)
      n.setAttribute('opacity', r2(e.opacidad ?? 1))
      if (e.color) n.style.setProperty('--fx', e.color)
      n.style.display = ''
    })
    for (let i = lista.length; i < efectosPool.length; i++) efectosPool[i].style.display = 'none'
  }

  return rig
}

// Dibujos de los efectos, centrados en 0,0, con el contorno azul oscuro de Ciempi.
const C = 'stroke="#243e5b" stroke-linejoin="round" stroke-linecap="round"'
export const DIBUJOS = {
  estrella: `<path d="M0 -26 L7.6 -9 L26 -7 L12 6 L16 24 L0 15 L-16 24 L-12 6 L-26 -7 L-7.6 -9Z" fill="#ffd137" ${C} stroke-width="5"/><path d="M-3 -11 L0 -18" stroke="#fff6c4" stroke-width="4" stroke-linecap="round"/>`,
  brillo: `<path d="M0 -20 Q2 -2 20 0 Q2 2 0 20 Q-2 2 -20 0 Q-2 -2 0 -20Z" fill="#ffe56f" ${C} stroke-width="4"/>`,
  corazon: `<path d="M0 22 C-26 4 -30 -10 -22 -18 C-14 -26 -4 -22 0 -12 C4 -22 14 -26 22 -18 C30 -10 26 4 0 22Z" fill="#f58b78" ${C} stroke-width="5"/><path d="M-15 -12 Q-12 -17 -7 -16" fill="none" stroke="#ffd2c8" stroke-width="4" stroke-linecap="round"/>`,
  confeti: `<rect x="-7" y="-4" width="14" height="8" rx="2.5" style="fill: var(--fx, #ffd137)" ${C} stroke-width="3"/>`,
  zeta: `<path d="M-12 -12 H12 L-12 12 H12" fill="none" ${C} stroke-width="6"/>`,
  nota: `<path d="M-6 12 V-16 L14 -20 V6" fill="none" ${C} stroke-width="5"/><ellipse cx="-12" cy="12" rx="8" ry="6" fill="#243e5b"/><ellipse cx="8" cy="6" rx="8" ry="6" fill="#243e5b"/>`,
  exclamacion: `<path d="M0 -26 V4" ${C} stroke-width="9"/><circle cx="0" cy="20" r="5.5" fill="#243e5b"/>`,
  pregunta: `<path d="M-12 -14 Q-12 -28 1 -28 Q14 -28 14 -16 Q14 -6 2 -2 Q-1 0 -1 7" fill="none" ${C} stroke-width="8"/><circle cx="-1" cy="20" r="5.5" fill="#243e5b"/>`,
  gota: `<path d="M0 -18 Q12 0 10 8 Q8 18 0 18 Q-8 18 -10 8 Q-12 0 0 -18Z" fill="#a8dff0" ${C} stroke-width="4"/>`,
  puntos: `<circle cx="-18" cy="0" r="6" fill="#243e5b"/><circle cx="0" cy="0" r="6" fill="#243e5b"/><circle cx="18" cy="0" r="6" fill="#243e5b"/>`,
  moneda: `<circle r="22" fill="#ffd137" ${C} stroke-width="5"/><circle r="13" fill="none" stroke="#f0b32b" stroke-width="4"/><path d="M-8 -10 Q-4 -15 1 -14" stroke="#fff6c4" stroke-width="4" stroke-linecap="round"/>`,
  suelo: `<path d="M-18 0 H18" ${C} stroke-width="5" opacity=".35"/>`,
}
