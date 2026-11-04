/** Utilidades compartidas por el compositor de criaturas (DOM y recursos de `public/criaturas/`). */
export const NS = 'http://www.w3.org/2000/svg'
/** Recursos copiados del laboratorio (ver scripts/criaturas/copiar-recursos.mjs). */
export const RECURSOS = '/criaturas/'
export const MAESTRO_IDS = ['tail', 'mint-back', 'yellow-middle', 'orange-middle', 'mint-front', 'segmento-d']
export const PIEZA_DE_ROL: Record<number, string> = { 0: 'cola', 1: 'seg-a', 2: 'seg-b', 3: 'seg-c', 4: 'frente', 5: 'seg-d' }
/** Pies de la pose aprobada (x, y, giro). El 5 es el de la cabeza. Las especies acercan el 4 a su segmento. */
export const PIES_CIEMPI = [[172, 524, -12], [276, 541, -6], [375, 550, 0], [500, 544, 7], [625, 537, -5], [780, 527, -12]] as const

export type Encuadre = [number, number, number, number]
export interface Pieza { id: string; archivo: string; encuadre: Encuadre; plano?: string }
export interface Manifiesto { especie: string; piezas: Pieza[] }

export const parse = (s: string) => {
  const d = new DOMParser().parseFromString(s, 'image/svg+xml')
  if (d.querySelector('parsererror')) throw Error('SVG inválido en el compositor de criaturas')
  return d
}
export const crear = (doc: Document, tag: string, attrs: Record<string, string | number> = {}) => {
  const n = doc.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  return n
}
export const imagen = (doc: Document, href: string, [x, y, w, h]: readonly number[], extra: Record<string, string | number> = {}) =>
  crear(doc, 'image', { x, y, width: w, height: h, href, preserveAspectRatio: 'none', ...extra })

/** URL de un recurso: `public/criaturas/<ruta>`. */
export const recurso = (ruta: string) => RECURSOS + ruta

const json = new Map<string, Promise<unknown>>()
/** JSON de `public/criaturas/` (una vez; un fallo se puede reintentar). */
export function cargarJson<T>(ruta: string): Promise<T> {
  if (!json.has(ruta)) {
    const p = fetch(recurso(ruta)).then((r) => {
      if (!r.ok) throw Error('Falta ' + ruta)
      return r.json()
    })
    p.catch(() => json.delete(ruta))
    json.set(ruta, p)
  }
  return json.get(ruta) as Promise<T>
}

export const pieza = (m: Manifiesto, id: string): Pieza => {
  const p = m.piezas.find((x) => x.id === id)
  if (!p) throw Error(`Pieza ${id} ausente en ${m.especie}`)
  return p
}
/** Radio del núcleo (bola) de una pieza de segmento: su borde inferior menos medio contorno. */
export const radioNucleo = (p: Pieza) => p.encuadre[1] + p.encuadre[3] - 3
