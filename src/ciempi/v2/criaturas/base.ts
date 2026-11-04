/**
 * Criaturas en el juego (Dragón, Cuncuna, Serpiente y Camaleón con sus 23
 * variantes aprobadas, AD-022), portado de `especies.js` del laboratorio.
 *
 * Cómo arma una criatura, sin redibujar ni estirar nada:
 *  1. Parte de la base aprobada de Ciempi (mismos ids que usan `componer.js` y
 *     `rig.js`) y sustituye `body` por seis segmentos raster (cola, A, B, C,
 *     frente, D) con los ids del maestro, `clip-<id>` y núcleo para las
 *     superficies B11; las patas por pierna + pie raster (o apoyos vacíos en la
 *     Serpiente). Las piezas se tiñen con la variante en tiempo de ejecución.
 *  2. Compone con `renderCiempi` (sin modificarlo) lo que `resolver()` deja
 *     visible, y aplica el rostro IA aprobado de la especie.
 *  3. La escena se arma con `escena`/`escenaCreciente` de pose.ts y `formaDe`.
 *
 * API: `prepararCriatura(id)` (asíncrona, una vez por variante) y después
 * `componerCriatura(seleccion, id)` (síncrona). `id` acepta `variante:<id>` o `<id>`.
 */
import { load } from '../arte/cargar.js'
import { renderCiempi } from '../arte/componer.js'
import { resolver, type Apariencia } from '../compatibilidad'
import { especie as buscarEspecie, type FormaCuerpo, type Parte } from '../especie'
import type { Entorno, Seleccion } from '../seleccion'
import { idVariante, varianteDatos, type EspecieCriatura, type VarianteDatos } from './datos'
import { MAESTRO_IDS, PIEZA_DE_ROL, PIES_CIEMPI, cargarJson, crear, imagen, parse, pieza, radioNucleo, recurso, type Encuadre, type Manifiesto } from './comun'
import { aplicarPatronBase, recolorCabeza } from './patrones'
import { aplicarRostroIA, prepararRostroIA } from './rostros'
import { tenirVariante } from './tinte'
import { baseCriaturaV4, esV4, posprocesarV4, type BaseV4 } from './v4'

/** Lo que usa el compositor del vestuario cargado (además de `Entorno`). */
type Env = Entorno & { base: string; masks: { id: string; ocultaRostro?: boolean }[] }
interface BaseDragonCuncuna { svg: string; alas: { encuadre: Encuadre; url: string } | null }
type Base = BaseDragonCuncuna | BaseV4

/** Rasgos propios: grupo e id con que se pueden ocultar (ver `rasgosOcultosCon` en especie.ts). */
const RASGO_CABEZA: Partial<Record<EspecieCriatura, string>> = { dragon: 'cuernos', cuncuna: 'penacho' }

let entorno: Env | null = null
const bases = new Map<string, Base>()
const preparando = new Map<string, Promise<void>>()

function datosDe(id: string): VarianteDatos {
  const v = varianteDatos(id)
  if (!v) throw Error('Variante desconocida: ' + id)
  return v
}

// ── Base de Dragón y Cuncuna ─────────────────────────────────────────────────
async function baseDragonCuncuna(env: Env, especieId: 'dragon' | 'cuncuna', vari: VarianteDatos): Promise<BaseDragonCuncuna> {
  const m = await cargarJson<Manifiesto>(`${especieId}/manifiesto.json`)
  const url = (p: { id: string; archivo: string }) => tenirVariante(recurso(`${especieId}/${p.archivo}`), especieId, vari, p.id)
  const forma = buscarEspecie(especieId).forma
  const doc = parse(env.base)

  // Cuerpo: seis segmentos con los ids del maestro.
  const body = doc.getElementById('body')!
  body.replaceChildren()
  for (let rol = 0; rol < 6; rol++) {
    const p = pieza(m, PIEZA_DE_ROL[rol]), id = MAESTRO_IDS[rol], r = radioNucleo(p)
    const g = crear(doc, 'g', { id, transform: `translate(${forma.xMaestro[rol]} ${forma.y[rol]})`, 'data-especie': especieId, 'data-nucleo': r })
    const defs = crear(doc, 'defs'), clip = crear(doc, 'clipPath', { id: 'clip-' + id })
    clip.append(crear(doc, 'circle', { r: r - 3 }))
    defs.append(clip)
    // El <g clip-path> no puede quedar vacío: compose() inserta las texturas tras su etiqueta de apertura.
    const nucleo = crear(doc, 'g', { 'clip-path': `url(#clip-${id})` })
    nucleo.append(crear(doc, 'g', { 'data-nucleo-vacio': '' }))
    g.append(defs, imagen(doc, await url(p), p.encuadre, { 'data-pieza': p.id }), nucleo)
    body.append(g)
  }

  // Patas: pierna y pie propios en la pose aprobada; el pie gira en el tobillo como la zapatilla.
  const pies = doc.getElementById('legs-and-sneakers')!
  pies.replaceChildren()
  const pierna = pieza(m, 'pierna'), pie = pieza(m, 'pie')
  const [urlPierna, urlPie] = [await url(pierna), await url(pie)]
  PIES_CIEMPI.forEach(([x, y, giro], i) => {
    const px = i === 0 || i === 5 ? x : i === 4 ? Math.min(x, forma.xMaestro[4] + 42) : forma.xMaestro[i] - 8
    const g = crear(doc, 'g', { transform: `translate(${px} ${y})`, stroke: '#243e5b', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' })
    const giroG = crear(doc, 'g', { transform: `rotate(${giro} -10 -32)` })
    giroG.append(imagen(doc, urlPie, pie.encuadre, { 'data-pieza': 'pie' }))
    g.append(imagen(doc, urlPierna, pierna.encuadre, { 'data-pieza': 'pierna' }), giroG)
    pies.append(g)
  })

  // Antenas: el Dragón no tiene; la Cuncuna lleva puntas menta.
  const antenas = doc.getElementById('antennae')
  if (especieId === 'dragon') antenas?.remove()
  else for (const c of antenas?.querySelectorAll('circle') || []) c.setAttribute('fill', '#83cda4')

  // Rasgos de cabeza (raster IA), en un grupo propio que el rig mueve con la cabeza.
  const rasgos = pieza(m, 'cabeza-rasgos')
  const gr = crear(doc, 'g', { id: 'rasgos-cabeza', 'data-accessory': 'rasgos-' + especieId, 'data-rasgo': RASGO_CABEZA[especieId]! })
  gr.append(imagen(doc, await url(rasgos), rasgos.encuadre, { 'data-pieza': 'cabeza-rasgos' }))
  const cabeza = doc.getElementById('head')!
  if (rasgos.plano === 'detras') cabeza.parentNode!.insertBefore(gr, cabeza)
  else cabeza.parentNode!.insertBefore(gr, doc.getElementById('jockey'))

  // Hocico vectorial del Dragón v1 (el rostro IA v4 lo quita; se conserva para que la base sea la del laboratorio).
  if (especieId === 'dragon') {
    const h = crear(doc, 'g', { 'data-rasgo': 'hocico', 'clip-path': 'url(#face)' })
    h.append(
      crear(doc, 'path', { d: 'M712 404 C708 371 740 358 768 361 C800 362 826 376 826 404 C826 438 796 452 766 451 C734 450 714 434 712 404Z', fill: '#ffe3a3', stroke: '#243e5b', 'stroke-width': 5, 'stroke-linejoin': 'round' }),
      crear(doc, 'path', { d: 'M724 392 Q742 372 772 372', fill: 'none', stroke: '#fff6d6', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.8 }),
      crear(doc, 'ellipse', { cx: 752, cy: 381, rx: 4.5, ry: 3.5, fill: '#243e5b' }),
      crear(doc, 'ellipse', { cx: 781, cy: 377, rx: 4.5, ry: 3.5, fill: '#243e5b' }),
    )
    cabeza.insertBefore(h, doc.getElementById('eyes'))
  }

  // Patrón de superficie de la variante y cabeza vectorial recoloreada.
  aplicarPatronBase(doc, vari)
  const svg = recolorCabeza(new XMLSerializer().serializeToString(doc), vari)
  // Alas exclusivas: se guardan como plantilla y se añaden solo si están equipadas.
  const alas = m.piezas.find((x) => x.id === 'alas')
  return { svg, alas: alas ? { encuadre: alas.encuadre, url: await url(alas) } : null }
}

// ── Preparación ──────────────────────────────────────────────────────────────
/**
 * Carga el vestuario y las piezas de la variante, las tiñe (una vez, con caché) y
 * deja lista la base; después `componerCriatura` es síncrono. Un fallo se puede reintentar.
 */
export function prepararCriatura(varianteId: string): Promise<void> {
  const v = datosDe(varianteId)
  let p = preparando.get(v.id)
  if (!p) {
    p = (async () => {
      const env = (await load()) as Env
      entorno = env
      const forma = buscarEspecie(v.especie).forma
      const [base] = await Promise.all([
        esV4(v.especie) ? baseCriaturaV4(env.base, v.especie, v, forma) : baseDragonCuncuna(env, v.especie as 'dragon' | 'cuncuna', v),
        prepararRostroIA(v.especie, v),
      ])
      bases.set(v.id, base)
    })()
    p.catch(() => preparando.delete(v.id))
    preparando.set(v.id, p)
  }
  return p
}

/** true si la variante ya está preparada (se puede componer sin esperar). */
export const criaturaLista = (varianteId: string) => bases.has(idVariante(varianteId)) && !!entorno

/** Forma del cuerpo de la especie de la variante (para `escena`/`escenaCreciente`); undefined si no es criatura. */
export function formaDe(varianteId: string | null | undefined): FormaCuerpo | undefined {
  const v = varianteDatos(varianteId)
  return v ? buscarEspecie(v.especie).forma : undefined
}

// ── Composición ──────────────────────────────────────────────────────────────
const PARTE_A_CLAVE: Partial<Record<Parte, string>> = { paleta: 'paleta', ojos: 'ojos', gesto: 'expresion', cabeza: 'cabeza', pelo: 'pelo', detalle: 'detalle', cara: 'cara', cuello: 'cuello', espalda: 'espalda', pies: 'pies', textura: 'textura' }
function aApariencia(sel: Seleccion): Apariencia {
  const a: Apariencia = {}
  for (const [parte, clave] of Object.entries(PARTE_A_CLAVE) as [Parte, string][]) if (sel[clave] !== undefined) a[parte] = `${parte}:${sel[clave]}`
  return a
}
const diseno = (id: string) => id.slice(id.indexOf(':') + 1)

/**
 * Compone la criatura con la selección del vestuario (síncrono; ver `prepararCriatura`).
 * Devuelve el SVG (texto) con los mismos ids que el de Ciempi, para `escena` y el rig.
 */
export function componerCriatura(seleccion: Seleccion, varianteId: string): string {
  const v = datosDe(varianteId)
  const env = entorno, base = bases.get(v.id)
  if (!env || !base) throw Error('Criatura sin preparar: usar prepararCriatura() antes')
  const especieId = v.especie
  const res = resolver(aApariencia(seleccion), especieId)
  const efectiva: Seleccion = { ...seleccion }
  for (const [parte, id] of Object.entries(res.visibles) as [Parte, string][]) efectiva[PARTE_A_CLAVE[parte]!] = diseno(id)
  const alasPuestas = efectiva.espalda === 'dragon-alas'
  const svg = renderCiempi({ ...env, base: base.svg } as Env, alasPuestas ? { ...efectiva, espalda: 'espalda-nada' } : efectiva)
  const doc = parse(svg)
  // Rasgos que una pieza puesta tapa (penacho bajo un gorro, cuernos bajo un casco cerrado…).
  for (const r of res.rasgosOcultos) for (const n of doc.querySelectorAll(`[data-rasgo="${r}"]`)) n.remove()
  // Superficies B11: también en el segmento D, y contorno del núcleo encima del material.
  if (efectiva.textura && efectiva.textura !== 'liso') {
    const modelo = doc.querySelector('[data-surface][data-segment="mint-back"]')
    const d = doc.getElementById('segmento-d')
    if (modelo && d && !d.querySelector('[data-surface]')) {
      const copia = modelo.cloneNode(true) as Element
      copia.setAttribute('data-segment', 'segmento-d')
      copia.setAttribute('clip-path', 'url(#clip-segmento-d)')
      d.insertBefore(copia, d.querySelector('g[clip-path]'))
    }
    for (const g of doc.getElementById('body')!.children) {
      const r = Number(g.getAttribute('data-nucleo'))
      if (r && g.querySelector('[data-surface]')) g.append(crear(doc, 'circle', { r: r - 3, fill: 'none', stroke: '#243e5b', 'stroke-width': 7, 'data-contorno-nucleo': '' }))
    }
  }
  // Alas: espalda exclusiva del Dragón, sobre el lomo del segmento delantero y detrás de cuernos y cabeza.
  if (alasPuestas && base.alas) {
    const g = crear(doc, 'g', { id: 'dragon-alas-equipped', 'data-bag': 'dragon-alas', 'data-exclusivo': 'espalda:dragon-alas' })
    g.append(imagen(doc, base.alas.url, base.alas.encuadre))
    const body = doc.getElementById('body')!
    body.parentNode!.insertBefore(g, body.nextSibling)
  }
  const mascara = !!env.masks?.some((x) => x.id === efectiva.cabeza && !x.ocultaRostro)
  if ('rostro' in base) posprocesarV4(doc, especieId, efectiva, base, mascara || (!!efectiva.cara && efectiva.cara !== 'cara-nada'))
  else aplicarRostroIA(doc, especieId, efectiva.expresion, v, mascara)
  doc.documentElement.setAttribute('data-criatura', v.id)
  return new XMLSerializer().serializeToString(doc)
}
