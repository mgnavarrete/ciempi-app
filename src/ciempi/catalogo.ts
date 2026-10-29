/**
 * La tienda de Ciempi (2.1): solo los diseños nuevos aprobados (colores,
 * ojos, gestos, gorros y máscaras, peinados, lentes, bufandas, capas y
 * mochilas, calzado, estampados y conjuntos), más los fondos y la comida de
 * la pista. El servidor importa este mismo archivo para cobrar las compras,
 * así que los precios viven solo aquí (y en scripts/generar-tienda-ciempi.mjs).
 * Todo está disponible para todos: no hay cosas "de niño" o "de niña".
 */
import { CONJUNTOS, PIEZAS, VARIANTES } from './tienda.generada.ts'

export { CONJUNTOS, VARIANTES }

export type CategoriaCiempi =
  | 'paleta' | 'ojos' | 'gesto' | 'cabeza' | 'pelo' | 'detalle' | 'cara' | 'cuello' | 'espalda' | 'pies' | 'textura' | 'fondo' | 'comida' | 'conjunto'

/** Las partes de Ciempi que se pueden cambiar (una cosa puesta por parte). */
export const PARTES = ['paleta', 'ojos', 'gesto', 'cabeza', 'pelo', 'detalle', 'cara', 'cuello', 'espalda', 'pies', 'textura', 'fondo', 'comida'] as const
export type ParteCiempi = (typeof PARTES)[number]

export interface ItemCiempi {
  /** «categoría:diseño» para el personaje («cabeza:b06-ia-mago»); fondos y comida conservan su id. */
  id: string
  nombre: string
  categoria: CategoriaCiempi
  /** 0 = gratis (siempre disponible). En un conjunto, lo que cuesta sin nada de él comprado. */
  precio: number
}

const FONDOS_Y_COMIDA: ItemCiempi[] = [
  { id: 'fondo-jardin', nombre: 'Jardín', categoria: 'fondo', precio: 0 },
  { id: 'fondo-mar', nombre: 'Mar', categoria: 'fondo', precio: 20 },
  { id: 'fondo-selva', nombre: 'Selva', categoria: 'fondo', precio: 20 },
  { id: 'fondo-dulces', nombre: 'Dulces', categoria: 'fondo', precio: 20 },
  { id: 'fondo-nieve', nombre: 'Nieve', categoria: 'fondo', precio: 20 },
  { id: 'fondo-espacio', nombre: 'Espacio', categoria: 'fondo', precio: 25 },
  { id: 'comida-manzana', nombre: 'Manzanas', categoria: 'comida', precio: 0 },
  { id: 'comida-frutilla', nombre: 'Frutillas', categoria: 'comida', precio: 8 },
  { id: 'comida-platano', nombre: 'Plátanos', categoria: 'comida', precio: 8 },
  { id: 'comida-sandia', nombre: 'Sandía', categoria: 'comida', precio: 10 },
  { id: 'comida-galleta', nombre: 'Galletas', categoria: 'comida', precio: 10 },
  { id: 'comida-pelota', nombre: 'Pelotas', categoria: 'comida', precio: 12 },
  { id: 'comida-dona', nombre: 'Donas', categoria: 'comida', precio: 12 },
  { id: 'comida-cupcake', nombre: 'Cupcakes', categoria: 'comida', precio: 15 },
  { id: 'comida-pizza', nombre: 'Pizza', categoria: 'comida', precio: 15 },
  { id: 'comida-helado', nombre: 'Helados', categoria: 'comida', precio: 15 },
]

/** Un conjunto cuesta 30 % menos que sus piezas sueltas (y no se cobra lo que ya tiene). */
const DESCUENTO_CONJUNTO = 0.7

export const buscarItem = (id: string): ItemCiempi | undefined => CATALOGO.find((i) => i.id === id)

/** Lo gratis siempre está disponible; lo demás, si se compró. */
export const loTiene = (inventario: string[], id: string) => (buscarItem(id)?.precio ?? 1) === 0 || inventario.includes(id)

/** Lo que cuesta ahora: un conjunto descuenta las piezas que ya tiene. */
export function precioDe(item: ItemCiempi, inventario: string[]): number {
  if (item.categoria !== 'conjunto') return item.precio
  const faltan = piezasDe(item.id).filter((p) => !loTiene(inventario, p))
  return Math.round(faltan.reduce((s, p) => s + (buscarItem(p)?.precio ?? 0), 0) * DESCUENTO_CONJUNTO)
}

export const piezasDe = (conjuntoId: string) => CONJUNTOS.find((c) => c.id === conjuntoId)?.piezas ?? []

export const CATALOGO: ItemCiempi[] = [
  ...PIEZAS,
  ...FONDOS_Y_COMIDA,
  ...CONJUNTOS.map((c) => ({ id: c.id, nombre: c.nombre, categoria: 'conjunto' as const, precio: 0 })),
]
for (const c of CATALOGO) if (c.categoria === 'conjunto') c.precio = precioDe(c, [])

/**
 * Compra (la misma regla en el servidor y sin conexión): descuenta las monedas
 * y agrega lo comprado; un conjunto agrega también sus piezas.
 */
export function comprarItem(inventario: string[], monedas: number, itemId: string): { monedas: number; inventario: string[]; precio: number } {
  const item = buscarItem(itemId)
  if (!item) throw new Error('Eso no está en la tienda')
  if (loTiene(inventario, item.id)) return { monedas, inventario, precio: 0 }
  const precio = precioDe(item, inventario)
  if (monedas < precio) throw new Error(`Te faltan ${precio - monedas} monedas`)
  const nuevos = [item.id, ...piezasDe(item.id)].filter((id) => !loTiene(inventario, id))
  return { monedas: monedas - precio, inventario: [...inventario, ...nuevos], precio }
}

export const CATEGORIAS: { id: CategoriaCiempi; nombre: string; emoji: string }[] = [
  { id: 'conjunto', nombre: 'Conjuntos', emoji: '🦸' },
  { id: 'paleta', nombre: 'Colores', emoji: '🎨' },
  { id: 'gesto', nombre: 'Gestos', emoji: '😄' },
  { id: 'ojos', nombre: 'Ojos', emoji: '👀' },
  { id: 'cabeza', nombre: 'Gorros', emoji: '🎩' },
  { id: 'pelo', nombre: 'Peinados', emoji: '💇' },
  { id: 'cara', nombre: 'Lentes', emoji: '👓' },
  { id: 'cuello', nombre: 'Bufandas', emoji: '🧣' },
  { id: 'espalda', nombre: 'Capas', emoji: '🎒' },
  { id: 'pies', nombre: 'Calzado', emoji: '👟' },
  { id: 'textura', nombre: 'Estampados', emoji: '✨' },
  { id: 'detalle', nombre: 'Detalles', emoji: '⚡' },
  { id: 'fondo', nombre: 'Fondos', emoji: '🏞️' },
  { id: 'comida', nombre: 'Comida', emoji: '🍎' },
]

export type Genero = 'nino' | 'nina'

/** Variantes de color elegidas (se cambian gratis: vienen con la pieza). */
export type VariantesCiempi = Partial<Record<'cara' | 'cuello' | 'espalda', string>>

/** Cómo se ve el Ciempi de cada niño (ids de la tienda). */
export interface AparienciaCiempi extends Record<ParteCiempi, string> {
  nombre: string
  genero: Genero | null
  variantes: VariantesCiempi
  /** Ya vio la presentación de Ciempi (la primera vez que entra). */
  presentado: boolean
}

export const APARIENCIA_INICIAL: AparienciaCiempi = {
  nombre: 'Ciempi',
  genero: null,
  // El Ciempi aprobado: colores clásicos, gesto alegre, jockey y zapatillas.
  paleta: 'paleta:clasica',
  ojos: 'ojos:oscuro',
  gesto: 'gesto:b03-alegre',
  cabeza: 'cabeza:b06-ia-jockey',
  pelo: 'pelo:pelo-nada',
  detalle: 'detalle:detalle-nada',
  cara: 'cara:cara-nada',
  cuello: 'cuello:cuello-nada',
  espalda: 'espalda:espalda-nada',
  pies: 'pies:pies-zapatillas',
  textura: 'textura:liso',
  fondo: 'fondo-jardin',
  comida: 'comida-manzana',
  variantes: {},
  presentado: false,
}

/** El diseño sin la categoría: «cabeza:b06-ia-mago» → «b06-ia-mago». */
export const diseno = (id: string) => id.slice(id.indexOf(':') + 1)

/** Un peinado solo se ve sin gorro: elegir uno quita el otro. */
export const SIN_GORRO = 'cabeza:cabeza-nada'
export const SIN_PEINADO = 'pelo:pelo-nada'

/**
 * La apariencia con una pieza (o un conjunto completo, que reemplaza todo el
 * personaje) puesta. Gorro y peinado se excluyen; al cambiar una pieza vuelve
 * a su color original.
 */
export function ponerItem(a: AparienciaCiempi, item: ItemCiempi): AparienciaCiempi {
  if (item.categoria === 'conjunto') {
    // Un conjunto es un look completo: parte del Ciempi inicial (conserva nombre, fondo y comida).
    const conjunto = CONJUNTOS.find((c) => c.id === item.id)
    let nueva: AparienciaCiempi = { ...a, variantes: {} }
    for (const p of PARTES) if (p !== 'fondo' && p !== 'comida') nueva[p] = APARIENCIA_INICIAL[p]
    for (const id of conjunto?.pone ?? []) {
      const pieza = buscarItem(id)
      if (pieza) nueva = ponerItem(nueva, pieza)
    }
    return { ...nueva, variantes: { ...nueva.variantes, ...conjunto?.variantes } }
  }
  const parte = item.categoria
  const variantes = { ...a.variantes }
  delete variantes[parte as keyof VariantesCiempi]
  const nueva: AparienciaCiempi = { ...a, [parte]: item.id, variantes }
  if (parte === 'pelo' && item.id !== SIN_PEINADO) nueva.cabeza = SIN_GORRO
  if (parte === 'cabeza' && item.id !== SIN_GORRO) nueva.pelo = SIN_PEINADO
  return nueva
}

/** ¿Ya tiene puesto esto? (un conjunto: todas sus piezas). */
export const lleva = (a: AparienciaCiempi, item: ItemCiempi) =>
  item.categoria === 'conjunto' ? (CONJUNTOS.find((c) => c.id === item.id)?.pone ?? []).every((id) => PARTES.some((p) => a[p] === id)) : a[item.categoria as ParteCiempi] === item.id

/** Las partes de la apariencia que todavía no son suyas. */
export const sinComprar = (a: AparienciaCiempi, inventario: string[]) => PARTES.filter((p) => !loTiene(inventario, a[p]))

/**
 * Completa una apariencia guardada (o vacía) con los valores iniciales. Lo que
 * ya no existe (las piezas del Ciempi clásico) vuelve al valor inicial.
 */
export function normalizarApariencia(guardada: Partial<AparienciaCiempi> | null | undefined): AparienciaCiempi {
  const g = (guardada ?? {}) as Partial<AparienciaCiempi>
  const a: AparienciaCiempi = { ...APARIENCIA_INICIAL, variantes: {} }
  for (const c of PARTES) if (typeof g[c] === 'string' && buscarItem(g[c])?.categoria === c) a[c] = g[c]
  if (a.pelo !== SIN_PEINADO && a.cabeza !== SIN_GORRO) a.pelo = SIN_PEINADO
  for (const parte of ['cara', 'cuello', 'espalda'] as const) {
    const elegida = g.variantes?.[parte]
    if (elegida && VARIANTES[a[parte]]?.some((v) => v.id === elegida)) a.variantes[parte] = elegida
  }
  a.nombre = (typeof g.nombre === 'string' ? g.nombre : '').trim().slice(0, 20) || APARIENCIA_INICIAL.nombre
  a.genero = g.genero === 'nino' || g.genero === 'nina' ? g.genero : null
  a.presentado = g.presentado === true
  return a
}
