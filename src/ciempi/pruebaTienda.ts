import {
  CATALOGO,
  SIN_GORRO,
  VARIANTES,
  loTiene,
  ponerItem,
  precioDe,
  type AparienciaCiempi,
  type CategoriaCiempi,
  type ItemCiempi,
  type VariantesCiempi,
} from './catalogo'

/**
 * La prueba de la tienda (2.8): una sola cosa nueva a la vez, siempre sobre lo
 * que el niño tiene guardado. Probar otra cosa reemplaza la anterior; cambiar
 * de sección o de categoría la descarta. La barra de compra muestra ese único
 * producto con su precio. Lo guardado nunca se toca al probar.
 */

/** Una tarjeta de la tienda: una pieza o uno de sus colores (todos vienen con la pieza). */
export interface Tarjeta {
  clave: string
  item: ItemCiempi
  color?: { id: string; nombre: string }
}

export const tarjetasDe = (categoria: CategoriaCiempi): Tarjeta[] =>
  CATALOGO.filter((i) => i.categoria === categoria).flatMap((item) =>
    VARIANTES[item.id] ? VARIANTES[item.id].map((color) => ({ clave: `${item.id}|${color.id}`, item, color })) : [{ clave: item.id, item }],
  )

/** La apariencia con la pieza de la tarjeta puesta (y su color). */
export const conColor = (a: AparienciaCiempi, t: Tarjeta): AparienciaCiempi => {
  const puesta = ponerItem(a, t.item)
  return t.color ? { ...puesta, variantes: { ...puesta.variantes, [t.item.categoria]: t.color.id } } : puesta
}

/** Lo que se está probando: cómo se ve y el único producto nuevo (null = nada). */
export interface Prueba {
  apariencia: AparienciaCiempi
  item: ItemCiempi | null
}

/** Sin prueba: Ciempi como lo tiene guardado. */
export const sinPrueba = (guardado: AparienciaCiempi): Prueba => ({ apariencia: guardado, item: null })

/** Prueba una tarjeta sobre lo guardado (no sobre la prueba anterior: esa se descarta). */
export const probarTarjeta = (guardado: AparienciaCiempi, t: Tarjeta): Prueba => ({ apariencia: conColor(guardado, t), item: t.item })

/** Prueba una criatura sobre lo guardado (null = Ciempi). */
export const probarCriatura = (guardado: AparienciaCiempi, criatura: string | null): Prueba => ({
  apariencia: { ...guardado, criatura },
  item: null,
})

/** Lo que muestra la barra de compra: un solo producto y su precio (o nada, si ya es suyo). */
export function aComprar(prueba: Prueba, inventario: string[]): { item: ItemCiempi; precio: number } | null {
  const { item } = prueba
  if (!item) return null
  const precio = precioDe(item, inventario)
  if (loTiene(inventario, item.id) || (item.categoria === 'conjunto' && precio === 0)) return null
  return { item, precio }
}

/** Cómo queda lo guardado al comprar la prueba: la pieza puesta con el color con que se la probaba. */
export function despuesDeComprar(guardado: AparienciaCiempi, prueba: Prueba): AparienciaCiempi {
  const { item } = prueba
  if (!item) return guardado
  const puesta = ponerItem(guardado, item)
  if (item.categoria in prueba.apariencia.variantes) {
    const parte = item.categoria as keyof VariantesCiempi
    return { ...puesta, variantes: { ...puesta.variantes, [parte]: prueba.apariencia.variantes[parte] } }
  }
  return puesta
}

// ── La cara a la vista ──

/** Categorías que se miran en la cara: ojos, gestos, lentes y detalles. */
export const CATEGORIAS_DE_CARA: readonly CategoriaCiempi[] = ['ojos', 'gesto', 'cara', 'detalle']

/**
 * Piezas de cabeza que tapan ojos o boca: las máscaras del catálogo del juego
 * (`masks`: antifaces que cubren los ojos y, con `ocultaRostro`, máscaras que
 * cubren la cara entera; ver `MASCARAS_COMPLETAS` en v2/especie.ts). Una
 * prueba verifica que coincida con public/ciempi-v2/catalogo.json.
 */
export const TAPAN_LA_CARA: readonly string[] = [
  'cabeza:b07-ia-robot',
  'cabeza:b07-ia-gatita',
  'cabeza:b07-ia-espiritu',
  'cabeza:b07-ia-dragon',
  'cabeza:b07-ia-buho',
  'cabeza:b12-araluz',
  'cabeza:b12-raton',
  'cabeza:b07-ia-cometa',
]

/**
 * Lo que se ve mientras se elige algo de la cara: sin la máscara que la tapa,
 * para que se vea lo que se prueba. Solo la vista previa; lo guardado no cambia.
 */
export function conCaraALaVista(a: AparienciaCiempi, categoria: CategoriaCiempi | null): AparienciaCiempi {
  if (!categoria || !CATEGORIAS_DE_CARA.includes(categoria) || !TAPAN_LA_CARA.includes(a.cabeza)) return a
  return { ...a, cabeza: SIN_GORRO }
}
