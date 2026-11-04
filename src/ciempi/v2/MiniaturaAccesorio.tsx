import { useLayoutEffect, useRef, useState } from 'react'
import { diseno, type AparienciaCiempi, type CategoriaCiempi, type ItemCiempi } from '../catalogo'
import { useEntornoCiempi, useEscena } from './Vestuario'

/**
 * Miniatura de la tienda con SOLO el accesorio (2.5.2), centrado y con fondo transparente.
 * - Piezas raster (gorros, máscaras, capas, mochilas y calzado): su propia imagen del catálogo
 *   (el color elegido, si tiene). Las mochilas usan la imagen v4.2 (la que se ve puesta).
 * - Piezas vectoriales (peinados, lentes, detalles y bufanda): Ciempi compuesto como siempre, pero
 *   solo se deja visible el accesorio y el encuadre se ajusta a él.
 * Al tocar la tarjeta se equipa exactamente igual que antes: esto solo cambia el dibujo.
 */
export const CATEGORIAS_SOLO_ACCESORIO: ReadonlySet<CategoriaCiempi> = new Set(['cabeza', 'pelo', 'cara', 'detalle', 'cuello', 'espalda', 'pies'])

const MOCHILA_V4: Record<string, string> = {
  'b09-aventura': 'mochila-aventura.webp',
  'b09-draco': 'mochila-draco.webp',
  'b09-mago': 'mochila-mago.webp',
  'b09-raton': 'mochila-raton.webp',
  'b09-robot': 'mochila-robot.webp',
}
const SIN = new Set(['cabeza-nada', 'pelo-nada', 'cara-nada', 'detalle-nada', 'cuello-nada', 'espalda-nada', 'pies-zapatillas'])

type PiezaRaster = { id: string; image?: string; images?: Record<string, string> }

/** Imagen raster de la pieza (o null si es vectorial). */
function imagenDe(env: unknown, item: ItemCiempi, color?: string): string | null {
  const id = diseno(item.id)
  if (MOCHILA_V4[id]) return '/ciempi-v2/mochilas-v4/' + MOCHILA_V4[id]
  const e = env as Record<string, PiezaRaster[] | undefined>
  for (const lista of [e.hats, e.masks, e.capes, e.bags, e.footwear]) {
    const p = lista?.find((x) => x.id === id)
    if (p?.image) return (color && p.images?.[color]) || p.image
  }
  return null
}

/** Qué nodos del SVG compuesto son el accesorio (piezas vectoriales). */
const selectorDe = (item: ItemCiempi) => (item.categoria === 'cuello' ? '[id*="lab-scarf"]' : `[data-accessory="${diseno(item.id)}"]`)

export function MiniaturaAccesorio({ item, apariencia, color, className = '' }: { item: ItemCiempi; apariencia: AparienciaCiempi; color?: string; className?: string }) {
  const { env } = useEntornoCiempi()
  if (SIN.has(diseno(item.id)))
    return (
      <div className={`${className} flex items-center justify-center text-2xl font-bold text-tinta-suave opacity-50`} aria-hidden>
        ✕
      </div>
    )
  const src = env ? imagenDe(env, item, color) : null
  if (src) return <img src={src} alt="" className={`${className} object-contain p-1`} draggable={false} />
  return <SoloVectorial item={item} apariencia={apariencia} className={className} />
}

function SoloVectorial({ item, apariencia, className }: { item: ItemCiempi; apariencia: AparienciaCiempi; className: string }) {
  const art = useEscena(apariencia, 5)
  const ref = useRef<SVGSVGElement>(null)
  const [viewBox, setViewBox] = useState<string | null>(null)
  useLayoutEffect(() => {
    const svg = ref.current
    if (!svg || !art) return
    const partes = [...svg.querySelectorAll<SVGGraphicsElement>(selectorDe(item))]
    const raiz = svg.firstElementChild as SVGGElement | null
    if (!raiz || !partes.length) return
    raiz.setAttribute('visibility', 'hidden')
    for (const p of partes) p.setAttribute('visibility', 'visible')
    // Unión de las cajas en coordenadas del SVG (con las transformaciones de la escena).
    const ctm = svg.getScreenCTM()?.inverse()
    if (!ctm) return
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const p of partes) {
      const r = p.getBoundingClientRect()
      if (!r.width && !r.height) continue
      for (const [x, y] of [[r.left, r.top], [r.right, r.bottom]]) {
        const q = new DOMPoint(x, y).matrixTransform(ctm)
        x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y)
      }
    }
    if (!isFinite(x0)) return
    const m = Math.max(x1 - x0, y1 - y0) * 0.08
    setViewBox(`${x0 - m} ${y0 - m} ${x1 - x0 + 2 * m} ${y1 - y0 + 2 * m}`)
  }, [art, item])
  if (!art) return <div className={`${className} animate-pulse rounded-xl bg-crema`} aria-hidden />
  return (
    <svg ref={ref} viewBox={viewBox ?? '540 0 420 500'} className={className} style={viewBox ? undefined : { opacity: 0 }} aria-hidden>
      <g dangerouslySetInnerHTML={{ __html: art.html }} />
    </svg>
  )
}
