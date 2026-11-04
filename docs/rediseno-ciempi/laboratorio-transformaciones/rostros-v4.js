// Rostros v4 del Dragón y la Cuncuna (LABORATORIO, pendiente de aprobación del usuario).
//
// El rostro v1 (ojos, cejas y boca de Ciempi, más el hocico vectorial del Dragón)
// no se toca: v4 es otra capa que se elige por selección (`sel.rostro = 'v4'`) o
// por URL (`?rostro=v4`). Los cuerpos aprobados (AD-017) no cambian.
//
// Cómo conviven con el resto del sistema:
//  - Expresiones B03: cada una tiene su rostro IA (recursos/<especie>/v4/). Se
//    compone primero la expresión B03 vectorial, como en Ciempi, y luego se
//    sustituye su CONTENIDO conservando los grupos que usan el rig y el compositor:
//      #eyes      → un grupo data-component="eye-i" por ojo que la B03 deja abierto
//                   (con una elipse invisible: el rig lo reconoce y lo hace
//                   parpadear), o data-component="eyelids" si la B03 lo cierra
//                   (guiño, carcajada, besito): así no parpadea un ojo cerrado.
//      #mouth     → capa fija del rostro (hocico, narinas, cejas, boca, mejillas).
//      #b03-brows → vacío (las cejas IA van en la capa fija).
//    El rig cambia de expresión reemplazando esos grupos (`cambiarRostro`), así
//    que las animaciones (A/E, también E08 «Comer» con b03-sorprendido) usan el
//    rostro v4 de la expresión correspondiente.
//  - Accesorios: si el compositor vació #eyes (lentes opacos, máscaras) o #mouth
//    (máscara completa: `data-hidden`), v4 respeta ese vacío: nunca aparecen ojos
//    o boca sobre una máscara. Gorros, peinados y lentes transparentes van encima.
//  - Se quitan el rubor vectorial de Ciempi y el hocico vectorial v1 del Dragón:
//    el rostro IA trae sus propias mejillas y su hocico.
import { rostroTenido } from './variantes.js'
const RECURSOS = new URL('./recursos/', import.meta.url)
const NS = 'http://www.w3.org/2000/svg'
/** v4b = iteración 2 tras la revisión independiente (v4 se conserva para comparar). */
export const VERSIONES_ROSTRO = ['v1', 'v4', 'v4b']
const esRostroIA = (v) => v === 'v4' || v === 'v4b'
export { esRostroIA }
export const ESPECIES_CON_V4 = ['dragon', 'cuncuna']

/** Versión pedida en la URL (`?rostro=v4`); por omisión v1. */
export function rostroDeUrl() {
  try { const v = new URLSearchParams(location.search).get('rostro'); return esRostroIA(v) ? v : 'v1' } catch { return 'v1' }
}

const manifiestos = new Map()
/** Carga (una vez) el manifiesto v4 de la especie. */
export async function prepararRostroV4(especieId) {
  if (!ESPECIES_CON_V4.includes(especieId)) return null
  return Promise.all(['v4', 'v4b'].map((v) => {
    const clave = especieId + '/' + v
    if (!manifiestos.has(clave)) {
      manifiestos.set(clave, fetch(new URL(`${clave}/manifiesto.json`, RECURSOS)).then((r) => {
        if (!r.ok) throw Error('Falta el manifiesto del rostro ' + clave)
        return r.json()
      }).then((m) => { manifiestos.set(clave, m); return m }))
    }
    return manifiestos.get(clave)
  }))
}

/** Rostro del manifiesto para una expresión B03 (o el de Alegre si no es B03). */
function entradaDe(m, expresion) {
  const lista = Object.values(m.expresiones)
  return lista.find((e) => e.b03 === expresion) ?? lista.find((e) => e.b03 === m.porDefecto)
}

/** Centros y radios de los ojos de la base v2 (los de rig.js), donde están los agujeros de las máscaras. */
const OJOS_BASE = [[708, 342, 33, 39], [808, 320, 27, 35]]
const crear = (doc, tag, attrs = {}) => {
  const n = doc.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  return n
}
const imagen = (doc, carpeta, p, href = null) => {
  const [x, y, width, height] = p.encuadre
  return crear(doc, 'image', { x, y, width, height, href: href ?? new URL(`${carpeta}/${p.archivo}`, RECURSOS).href, preserveAspectRatio: 'none' })
}

/**
 * Sustituye el rostro v1 de una especie por el v4 en el documento ya compuesto
 * (después de `renderCiempi`). Síncrono: requiere `prepararRostroV4` antes.
 */
export function aplicarRostroV4(doc, especieId, sel, version = 'v4', mascara = false) {
  // Solo Dragón y Cuncuna tienen rostro v4/v4b; Serpiente y Camaleón (T03/T04) traen su propia cara.
  if (!ESPECIES_CON_V4.includes(especieId)) return
  const carpeta = especieId + '/' + version
  const m = manifiestos.get(carpeta)
  if (!m || m instanceof Promise) throw Error('Rostro v4 sin preparar: usar prepararRostroV4() antes')
  const e = entradaDe(m, sel.expresion)
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
    const nuevos = []
    e.ojos.forEach((o, i) => {
      if (!o) return
      const abierto = b03 ? abiertos.get('eye-' + i) === true : true
      const g = crear(doc, 'g', { 'data-component': abierto ? 'eye-' + i : 'eyelids', 'data-rostro-v4': 'ojo-' + i })
      const img = imagen(doc, carpeta, o)
      if (mascara && version === 'v4b' && OJOS_BASE[i]) {
        // Máscara con agujeros (gatita, búho…): los agujeros están en los ojos de Ciempi.
        // En v4b el ojo IA se centra en ese agujero y se escala a su tamaño: no asoma por el antifaz.
        const [hx, hy, rx, ry] = OJOS_BASE[i], [x, y, w, h] = o.encuadre
        const [cx, cy] = o.centro ?? [x + w / 2, y + h / 2]
        const k = Math.min((2 * rx + 6) / w, (2 * ry + 6) / h, 1)
        const t = crear(doc, 'g', { transform: `translate(${hx} ${hy}) scale(${k.toFixed(3)}) translate(${-cx} ${-cy})`, 'data-ajuste-mascara': '' })
        t.append(img)
        g.append(t)
      } else g.append(img)
      if (abierto) {
        // Marca de ojo abierto para el rig (invisible): mismo centro que el ojo IA.
        const [x, y, w, h] = o.encuadre
        g.append(crear(doc, 'ellipse', { cx: o.centro?.[0] ?? x + w / 2, cy: o.centro?.[1] ?? y + h / 2, rx: w / 2, ry: h / 2, fill: 'none', opacity: 0 }))
      }
      nuevos.push(g)
    })
    // El rig asocia los ojos por orden (eye-0 izquierdo, eye-1 derecho); los cerrados van al final.
    nuevos.sort((a, b) => (a.getAttribute('data-component') === 'eyelids') - (b.getAttribute('data-component') === 'eyelids'))
    ojos.replaceChildren(...nuevos)
  }
  doc.getElementById('b03-brows')?.replaceChildren()
  const boca = cabeza.querySelector('#mouth')
  if (boca && !boca.hasAttribute('data-hidden')) {
    const g = crear(doc, 'g', { 'data-rostro-v4': 'rostro' })
    // V5: con una variante del catálogo, la capa fija (hocico, cejas) va teñida (variantes.js); los ojos no.
    g.append(imagen(doc, carpeta, e.rostro, rostroTenido(sel.varianteEspecie, carpeta, e.rostro.archivo)))
    boca.replaceChildren(g)
  }
  doc.documentElement.setAttribute('data-rostro', version)
  const desc = doc.querySelector('desc')
  if (desc) desc.textContent += ` Rostro ${version} IA (${e.b03 ?? m.porDefecto}; laboratorio, pendiente de aprobación).`
}

/**
 * Selector «Rostro v1 / v4» del laboratorio. Cambia `estado.sel.rostro` y el
 * inicial (para que Restaurar y los conjuntos lo conserven) y la URL.
 */
export function montarSelectorRostro({ estado, inicial, actualizar }) {
  const v = rostroDeUrl()
  inicial.rostro = v
  estado.sel.rostro = v
  const panel = document.querySelector('.panel')
  if (!panel) return
  const fs = document.createElement('fieldset')
  fs.id = 'rostro-version'
  fs.innerHTML = '<legend>Rostro (Dragón y Cuncuna)</legend><div class="botones pequenos">' +
    VERSIONES_ROSTRO.map((x) => `<label><input type="radio" name="rostro" value="${x}"${x === v ? ' checked' : ''}> Rostro ${x}</label>`).join('') +
    '</div><p class="ayuda">v1: rostro de Ciempi (no aprobado, AD-017). v4: rostro propio generado con IA, con las 14 expresiones B03. v4b: iteración 2 tras la revisión independiente. Pendientes de aprobación. Ciempi no cambia.</p>'
  panel.insertBefore(fs, panel.children[1] ?? null)
  for (const r of fs.querySelectorAll('input[name=rostro]')) {
    r.onchange = () => {
      inicial.rostro = r.value
      estado.sel.rostro = r.value
      const u = new URL(location.href)
      if (esRostroIA(r.value)) u.searchParams.set('rostro', r.value); else u.searchParams.delete('rostro')
      history.replaceState(null, '', u)
      actualizar()
    }
  }
}
