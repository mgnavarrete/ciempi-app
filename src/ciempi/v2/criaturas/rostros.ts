/**
 * Rostros IA aprobados de Dragón (v4, iteración 1: AD-021) y Cuncuna (v4b:
 * AD-020), portados de `rostros-v4.js` del laboratorio.
 *
 * Se compone primero la expresión B03 vectorial, como en Ciempi, y luego se
 * sustituye su CONTENIDO conservando los grupos que usan el rig y el compositor:
 *  - #eyes: un grupo data-component="eye-i" por ojo que la B03 deja abierto (con
 *    una elipse invisible: el rig lo hace parpadear) o "eyelids" si lo cierra;
 *  - #mouth: capa fija del rostro (hocico, cejas, boca, mejillas), teñida con la
 *    variante (los ojos nunca);
 *  - #b03-brows: vacío.
 * Si el compositor vació #eyes o #mouth (lentes opacos, máscaras), se respeta.
 */
import { CLAVES_ROSTRO, ROSTRO, type EspecieCriatura, type VarianteDatos } from './datos'
import { cargarJson, crear, recurso, type Encuadre } from './comun'
import { tenirVariante } from './tinte'

interface Capa { archivo: string; encuadre: Encuadre; centro?: [number, number] }
interface Entrada { rostro: Capa; ojos: (Capa | null)[]; b03?: string }
interface ManifiestoRostro { porDefecto: string; expresiones: Record<string, Entrada> }

export const ESPECIES_ROSTRO_IA: readonly EspecieCriatura[] = ['dragon', 'cuncuna']
const carpetaDe = (especie: EspecieCriatura) => `${especie}/${ROSTRO[especie]}`

const manifiestos = new Map<string, ManifiestoRostro>()
const tenidos = new Map<string, string>() // `${varianteId}|${archivo}` → blob URL

/** Carga el manifiesto del rostro y tiñe (una vez) su capa fija con la variante. */
export async function prepararRostroIA(especie: EspecieCriatura, v: VarianteDatos) {
  if (!ESPECIES_ROSTRO_IA.includes(especie)) return
  const carpeta = carpetaDe(especie)
  const m = await cargarJson<ManifiestoRostro>(`${carpeta}/manifiesto.json`)
  manifiestos.set(carpeta, m)
  if (!v.colores) return
  const claves = v.rostroClaves ?? CLAVES_ROSTRO[especie] ?? []
  await Promise.all(Object.values(m.expresiones).map(async (e) => {
    const k = `${v.id}|${e.rostro.archivo}`
    if (!tenidos.has(k)) tenidos.set(k, await tenirVariante(recurso(`${carpeta}/${e.rostro.archivo}`), especie, v, 'rostro', claves))
  }))
}

/** Rostro del manifiesto para una expresión B03 (o el de Alegre si no es B03). */
function entradaDe(m: ManifiestoRostro, expresion: unknown) {
  const lista = Object.values(m.expresiones)
  return lista.find((e) => e.b03 === expresion) ?? lista.find((e) => e.b03 === m.porDefecto)
}

/** Centros y radios de los ojos de la base v2 (los de rig.js), donde están los agujeros de las máscaras. */
const OJOS_BASE = [[708, 342, 33, 39], [808, 320, 27, 35]]

const img = (doc: Document, carpeta: string, p: Capa, href: string | null = null) => {
  const [x, y, width, height] = p.encuadre
  return crear(doc, 'image', { x, y, width, height, href: href ?? recurso(`${carpeta}/${p.archivo}`), preserveAspectRatio: 'none' })
}

/**
 * Sustituye el rostro vectorial por el IA en el documento ya compuesto (después de
 * `renderCiempi`). Síncrono: requiere `prepararRostroIA` antes.
 */
export function aplicarRostroIA(doc: Document, especie: EspecieCriatura, expresion: unknown, v: VarianteDatos, mascara: boolean) {
  if (!ESPECIES_ROSTRO_IA.includes(especie)) return
  const version = ROSTRO[especie], carpeta = carpetaDe(especie)
  const m = manifiestos.get(carpeta)
  if (!m) throw Error('Rostro sin preparar: usar prepararCriatura() antes')
  const e = entradaDe(m, expresion)
  const cabeza = doc.getElementById('head')
  if (!cabeza || !e) return
  // Rubor vectorial de Ciempi y hocico v1: los sustituye el rostro IA.
  for (const n of [...cabeza.children]) if (n.localName === 'ellipse' && n.getAttribute('fill') === '#ee724b') n.remove()
  cabeza.querySelector('[data-rasgo="hocico"]')?.remove()

  const ojos = cabeza.querySelector('#eyes')
  if (ojos && !ojos.hasAttribute('data-hidden')) {
    // Qué ojos deja abiertos la expresión B03 (el rig parpadea los grupos eye-i con elipse).
    const abiertos = new Map([...ojos.querySelectorAll(':scope > [data-component^="eye-"]')]
      .map((g) => [g.getAttribute('data-component'), !!g.querySelector('ellipse')]))
    const b03 = abiertos.size > 0
    const nuevos: Element[] = []
    e.ojos.forEach((o, i) => {
      if (!o) return
      const abierto = b03 ? abiertos.get('eye-' + i) === true : true
      const g = crear(doc, 'g', { 'data-component': abierto ? 'eye-' + i : 'eyelids', 'data-rostro-v4': 'ojo-' + i })
      const im = img(doc, carpeta, o)
      if (mascara && version === 'v4b' && OJOS_BASE[i]) {
        // Máscara con agujeros (gatita, búho…): el ojo IA se centra en el agujero y se escala a su tamaño.
        const [hx, hy, rx, ry] = OJOS_BASE[i], [x, y, w, h] = o.encuadre
        const [cx, cy] = o.centro ?? [x + w / 2, y + h / 2]
        const k = Math.min((2 * rx + 6) / w, (2 * ry + 6) / h, 1)
        const t = crear(doc, 'g', { transform: `translate(${hx} ${hy}) scale(${k.toFixed(3)}) translate(${-cx} ${-cy})`, 'data-ajuste-mascara': '' })
        t.append(im)
        g.append(t)
      } else g.append(im)
      if (abierto) {
        // Marca de ojo abierto para el rig (invisible): mismo centro que el ojo IA.
        const [x, y, w, h] = o.encuadre
        g.append(crear(doc, 'ellipse', { cx: o.centro?.[0] ?? x + w / 2, cy: o.centro?.[1] ?? y + h / 2, rx: w / 2, ry: h / 2, fill: 'none', opacity: 0 }))
      }
      nuevos.push(g)
    })
    // El rig asocia los ojos por orden (eye-0 izquierdo, eye-1 derecho); los cerrados van al final.
    nuevos.sort((a, b) => Number(a.getAttribute('data-component') === 'eyelids') - Number(b.getAttribute('data-component') === 'eyelids'))
    ojos.replaceChildren(...nuevos)
  }
  doc.getElementById('b03-brows')?.replaceChildren()
  const boca = cabeza.querySelector('#mouth')
  if (boca && !boca.hasAttribute('data-hidden')) {
    const g = crear(doc, 'g', { 'data-rostro-v4': 'rostro' })
    g.append(img(doc, carpeta, e.rostro, tenidos.get(`${v.id}|${e.rostro.archivo}`) ?? null))
    boca.replaceChildren(g)
  }
  doc.documentElement.setAttribute('data-rostro', version)
}
