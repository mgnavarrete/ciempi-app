/**
 * La tienda de Ciempi (2.1): solo los diseños nuevos aprobados (colores,
 * ojos, gestos, gorros y máscaras, peinados, lentes, bufandas, capas y
 * mochilas, calzado, estampados y conjuntos), más los fondos y la comida de
 * la pista. El servidor importa este mismo archivo para cobrar las compras,
 * así que los precios viven solo aquí (y en scripts/generar-tienda-ciempi.mjs).
 * Todo está disponible para todos: no hay cosas "de niño" o "de niña".
 */
import { CONJUNTOS, FAMILIAS, PIEZAS, VARIANTES } from './tienda.generada.ts'
import { DESCUENTO_PAQUETE, ESPECIES, VARIANTES_CRIATURAS, especieDeItem, variantesDePaquete, varianteDeItem } from './criaturas.ts'

export { CONJUNTOS, FAMILIAS, VARIANTES }

export type CategoriaCiempi =
  | 'paleta' | 'ojos' | 'gesto' | 'cabeza' | 'pelo' | 'detalle' | 'cara' | 'cuello' | 'espalda' | 'pies' | 'textura' | 'fondo' | 'comida' | 'conjunto'
  /** Criaturas (2.5): fuera de PARTES; se ponen con `apariencia.criatura`. */
  | 'especie' | 'variante' | 'paquete'
  /** Bailes (2.7): fuera de PARTES; no cambian el dibujo. Ver BAILES y `apariencia.celebracion`. */
  | 'baile'

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
  // Fondos ilustrados (v2.7, IA): WebP en public/ciempi-v2/fondos/.
  { id: 'fondo-bosque', nombre: 'Bosque', categoria: 'fondo', precio: 28 },
  { id: 'fondo-playa', nombre: 'Playa', categoria: 'fondo', precio: 25 },
  { id: 'fondo-ciudad', nombre: 'Ciudad', categoria: 'fondo', precio: 28 },
  { id: 'fondo-castillo', nombre: 'Castillo', categoria: 'fondo', precio: 30 },
  { id: 'fondo-arrecife', nombre: 'Arrecife', categoria: 'fondo', precio: 25 },
  { id: 'fondo-nubes', nombre: 'Nubes', categoria: 'fondo', precio: 30 },
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

/**
 * Bailes (2.7): animaciones aprobadas del rig (ciempi/v2/animacion/animaciones.js)
 * que Ciempi hace cuando el niño lo toca en el inicio y, la elegida, al terminar
 * un cuento. No se crean animaciones: cada baile es una existente (id
 * `baile:<animación>`). Dos gratis; «Celebración clásica» (A10 Victoria, lo que
 * hacía siempre al terminar un cuento) es gratis y oculta: solo se ve en el ropero,
 * para volver a elegirla para celebrar.
 */
export interface Baile {
  id: string
  /** Animación del rig (A04, E02…). */
  animacion: string
  nombre: string
  emoji: string
  precio: number
  /** No se vende ni sale en la rueda (la celebración de siempre). */
  oculto?: boolean
}
export const BAILES: Baile[] = [
  { id: 'baile:a04', animacion: 'A04', nombre: 'Saludo', emoji: '👋', precio: 0 },
  { id: 'baile:a03', animacion: 'A03', nombre: 'Saltito', emoji: '🦘', precio: 0 },
  { id: 'baile:e01', animacion: 'E01', nombre: 'Carcajada', emoji: '😂', precio: 15 },
  { id: 'baile:e06', animacion: 'E06', nombre: 'Estirón', emoji: '🙆', precio: 15 },
  { id: 'baile:a12', animacion: 'A12', nombre: 'Resorte', emoji: '🪀', precio: 20 },
  { id: 'baile:a11', animacion: 'A11', nombre: 'Besito', emoji: '😘', precio: 20 },
  { id: 'baile:a09', animacion: 'A09', nombre: 'Pose de modelo', emoji: '😎', precio: 20 },
  { id: 'baile:e02', animacion: 'E02', nombre: 'Baile alegre', emoji: '💃', precio: 25 },
  { id: 'baile:a10', animacion: 'A10', nombre: 'Celebración clásica', emoji: '🏆', precio: 0, oculto: true },
]
/** La celebración de siempre al terminar un cuento (A10 Victoria). */
export const CELEBRACION_INICIAL = 'baile:a10'
export const bailePorId = (id: string | null | undefined) => BAILES.find((b) => b.id === id)
/** ¿Es un id de baile existente? */
export const esBaileValido = (id: unknown): id is string => typeof id === 'string' && !!bailePorId(id)
/** Los bailes que tiene (gratis o comprados), en el orden de la tienda. Con `ocultos`, también la celebración clásica. */
export const bailesDe = (inventario: string[], ocultos = false) => BAILES.filter((b) => (ocultos || !b.oculto) && loTiene(inventario, b.id))

/** Un conjunto cuesta 20 % menos que sus piezas sueltas (y no se cobra lo que ya tiene). */
const DESCUENTO_CONJUNTO = 0.8

export const buscarItem = (id: string): ItemCiempi | undefined => CATALOGO.find((i) => i.id === id)

/** La familia de una pieza (colores casi iguales que se compran una vez), o solo ella. */
export const familiaDe = (id: string) => FAMILIAS.find((f) => f.includes(id)) ?? [id]

const esCriatura = (c: CategoriaCiempi | undefined) => c === 'especie' || c === 'variante' || c === 'paquete'

/**
 * Lo gratis siempre está disponible; lo demás, si se compró (él o alguien de su familia).
 * Criaturas: la variante base viene con la especie (y nunca se guarda); un paquete,
 * si ya tiene la especie y todas sus variantes. La Cuncuna cuesta 0 pero no es gratis:
 * solo se tiene si se ganó.
 */
export function loTiene(inventario: string[], id: string): boolean {
  const item = buscarItem(id)
  if (esCriatura(item?.categoria)) {
    const e = especieDeItem(id)
    if (!e) return false
    if (item!.categoria === 'especie') return inventario.includes(e.item)
    if (item!.categoria === 'paquete') return inventario.includes(e.item) && variantesDePaquete(e.id).every((v) => inventario.includes(v))
    return varianteDeItem(id)!.base ? inventario.includes(e.item) : inventario.includes(id)
  }
  return (item?.precio ?? 1) === 0 || familiaDe(id).some((x) => inventario.includes(x))
}

/** Lo que costarían sueltas las piezas de un conjunto que todavía no tiene. */
const sueltas = (conjuntoId: string, inventario: string[]) =>
  piezasDe(conjuntoId)
    .filter((p) => !loTiene(inventario, p))
    .reduce((s, p) => s + (buscarItem(p)?.precio ?? 0), 0)

/** Lo que costarían sueltas las variantes de un paquete que todavía no tiene (sin la especie). */
const variantesSueltas = (paqueteId: string, inventario: string[]) => {
  const e = especieDeItem(paqueteId)
  return e ? variantesDePaquete(e.id).filter((v) => !inventario.includes(v)).length * e.precioVariante : 0
}

/** La especie a precio completo, si todavía no la tiene. */
const especieQueFalta = (itemId: string, inventario: string[]) => {
  const e = especieDeItem(itemId)
  return e && !inventario.includes(e.item) ? e.precio : 0
}

/**
 * Lo que cuesta ahora: un conjunto descuenta las piezas que ya tiene. Una
 * variante sin su especie suma la especie (se compran juntas); un paquete
 * cobra el 80 % de las variantes que faltan, más la especie si falta.
 */
export function precioDe(item: ItemCiempi, inventario: string[]): number {
  if (item.categoria === 'conjunto') return Math.ceil(sueltas(item.id, inventario) * DESCUENTO_CONJUNTO)
  if (item.categoria === 'variante') {
    const base = varianteDeItem(item.id)?.base
    return (base ? 0 : item.precio) + especieQueFalta(item.id, inventario)
  }
  if (item.categoria === 'paquete') return Math.ceil(variantesSueltas(item.id, inventario) * DESCUENTO_PAQUETE) + especieQueFalta(item.id, inventario)
  return item.precio
}

/** Cuánto ahorra comprando el conjunto (o el paquete) en vez de cada cosa suelta. */
export function ahorroDe(item: ItemCiempi, inventario: string[]): number {
  if (item.categoria === 'conjunto') return sueltas(item.id, inventario) - precioDe(item, inventario)
  if (item.categoria === 'paquete') return variantesSueltas(item.id, inventario) + especieQueFalta(item.id, inventario) - precioDe(item, inventario)
  return 0
}

/** Lo que solo se gana (la Cuncuna): sin la especie no se puede comprar ni ella ni sus variantes. */
export const soloDesbloqueo = (itemId: string, inventario: string[] = []) => {
  const e = especieDeItem(itemId)
  return !!e?.soloDesbloqueo && !inventario.includes(e.item)
}

export const piezasDe = (conjuntoId: string) => CONJUNTOS.find((c) => c.id === conjuntoId)?.piezas ?? []

export const CATALOGO: ItemCiempi[] = [
  ...PIEZAS,
  ...FONDOS_Y_COMIDA,
  ...CONJUNTOS.map((c) => ({ id: c.id, nombre: c.nombre, categoria: 'conjunto' as const, precio: 0 })),
  // Criaturas: el precio de una variante es solo el suyo (la base, 0); precioDe suma la especie si falta.
  ...ESPECIES.map((e) => ({ id: e.item, nombre: e.nombre, categoria: 'especie' as const, precio: e.precio })),
  ...VARIANTES_CRIATURAS.map((v) => ({ id: v.item, nombre: v.nombre, categoria: 'variante' as const, precio: v.base ? 0 : especieDeItem(v.item)!.precioVariante })),
  ...ESPECIES.map((e) => ({ id: e.paquete, nombre: e.nombrePaquete, categoria: 'paquete' as const, precio: 0 })),
  ...BAILES.map((b) => ({ id: b.id, nombre: b.nombre, categoria: 'baile' as const, precio: b.precio })),
]
for (const c of CATALOGO) if (c.categoria === 'conjunto' || c.categoria === 'paquete') c.precio = precioDe(c, [])

/**
 * Compra (la misma regla en el servidor y sin conexión): descuenta las monedas
 * y agrega lo comprado; un conjunto agrega también sus piezas, y un color, su
 * familia. `precioVisto`: lo que mostró la app; si ahora cuesta más, no se cobra.
 * `lineas`: lo cobrado por cada cosa (un conjunto lo reparte entre sus piezas,
 * para que una devolución futura sea exacta).
 */
export function comprarItem(
  inventario: string[],
  monedas: number,
  itemId: string,
  precioVisto?: number,
): { monedas: number; inventario: string[]; precio: number; lineas: { id: string; precio: number }[] } {
  const item = buscarItem(itemId)
  if (!item) throw new Error('Eso no está en la tienda')
  if (loTiene(inventario, item.id)) return { monedas, inventario, precio: 0, lineas: [] }
  if (soloDesbloqueo(item.id, inventario)) throw new Error('Gana la Cuncuna leyendo')
  const precio = precioDe(item, inventario)
  if (precioVisto !== undefined && precio > precioVisto) throw new Error(`El precio cambió: ahora cuesta ${precio} monedas`)
  if (monedas < precio) throw new Error(`Te faltan ${precio - monedas} monedas`)
  if (esCriatura(item.categoria)) return comprarCriatura(inventario, monedas, item, precio)
  const piezas = piezasDe(item.id).filter((id) => !loTiene(inventario, id))
  const nuevos = [...familiaDe(item.id), ...piezas].filter((id) => !inventario.includes(id))
  let lineas = [{ id: item.id, precio }]
  if (piezas.length) {
    const total = piezas.reduce((s, p) => s + (buscarItem(p)?.precio ?? 0), 0)
    lineas = [{ id: item.id, precio: 0 }, ...piezas.map((id) => ({ id, precio: Math.floor((precio * (buscarItem(id)?.precio ?? 0)) / total) }))]
    // Lo que sobra del redondeo va a la primera pieza: las líneas suman exactamente lo cobrado.
    lineas[1].precio += precio - lineas.reduce((s, l) => s + l.precio, 0)
  }
  return { monedas: monedas - precio, inventario: [...inventario, ...nuevos], precio, lineas }
}

/**
 * Compra de una criatura (ya validada): agrega la especie si falta (a precio
 * completo, en su propia línea) y la variante o las variantes del paquete que
 * falten, repartiendo lo demás entre ellas. La base nunca entra al inventario.
 */
function comprarCriatura(inventario: string[], monedas: number, item: ItemCiempi, precio: number) {
  const e = especieDeItem(item.id)!
  const lineas: { id: string; precio: number }[] = []
  const nuevos: string[] = []
  const especie = especieQueFalta(item.id, inventario)
  if (!inventario.includes(e.item)) {
    nuevos.push(e.item)
    lineas.push({ id: e.item, precio: especie })
  }
  const resto = precio - especie
  if (item.categoria === 'variante' && !varianteDeItem(item.id)!.base) {
    nuevos.push(item.id)
    lineas.push({ id: item.id, precio: resto })
  } else if (item.categoria === 'paquete') {
    const faltan = variantesDePaquete(e.id).filter((v) => !inventario.includes(v))
    const parte = faltan.map((v) => ({ id: v, precio: Math.floor(resto / faltan.length) }))
    if (parte.length) parte[0].precio += resto - parte.reduce((s, l) => s + l.precio, 0)
    lineas.unshift({ id: item.id, precio: 0 })
    lineas.push(...parte)
    nuevos.push(...faltan)
  }
  return { monedas: monedas - precio, inventario: [...inventario, ...nuevos], precio, lineas }
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
  { id: 'espalda', nombre: 'Capas y mochilas', emoji: '🎒' },
  { id: 'pies', nombre: 'Calzado', emoji: '👟' },
  { id: 'textura', nombre: 'Estampados', emoji: '✨' },
  { id: 'detalle', nombre: 'Detalles', emoji: '⚡' },
  { id: 'fondo', nombre: 'Fondos', emoji: '🏞️' },
  { id: 'comida', nombre: 'Comida', emoji: '🍎' },
  { id: 'baile', nombre: 'Bailes', emoji: '💃' },
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
  /** La criatura puesta (`variante:<id>`; la especie se deduce de ella). null = Ciempi. */
  criatura: string | null
  /** El baile con que celebra al terminar un cuento (`baile:<animación>`, suyo). */
  celebracion: string
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
  criatura: null,
  celebracion: CELEBRACION_INICIAL,
}

/** El diseño sin la categoría: «cabeza:b06-ia-mago» → «b06-ia-mago». */
export const diseno = (id: string) => id.slice(id.indexOf(':') + 1)

/** Un peinado solo se ve sin gorro: elegir uno quita el otro. */
export const SIN_GORRO = 'cabeza:cabeza-nada'
export const SIN_PEINADO = 'pelo:pelo-nada'
export const SIN_ESTAMPADO = 'textura:liso'

/**
 * La apariencia con una pieza (o un conjunto completo, que reemplaza todo el
 * personaje) puesta. Gorro y peinado se excluyen; un color quita el
 * estampado (que lo taparía); al cambiar una pieza vuelve a su color original.
 */
export function ponerItem(a: AparienciaCiempi, item: ItemCiempi): AparienciaCiempi {
  // Criaturas: una variante (o la especie, con su base) cambia solo la criatura; un paquete no se «pone».
  if (item.categoria === 'variante') return { ...a, criatura: item.id }
  if (item.categoria === 'especie') return { ...a, criatura: `variante:${especieDeItem(item.id)!.base}` }
  if (item.categoria === 'paquete') return a
  // Un baile no se «pone»: se elige para celebrar (`celebracion`).
  if (item.categoria === 'baile') return a
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
  // El estampado tapa los colores del cuerpo: al elegir un color se quita, para que se vea.
  if (parte === 'paleta') nueva.textura = SIN_ESTAMPADO
  return nueva
}

/** Vuelve a ser Ciempi (sin criatura); el resto de lo puesto se conserva. */
export const sinCriatura = (a: AparienciaCiempi): AparienciaCiempi => ({ ...a, criatura: null })

/** ¿Ya tiene puesto esto? (un conjunto: todas sus piezas; una especie: cualquiera de sus variantes). */
export function lleva(a: AparienciaCiempi, item: ItemCiempi): boolean {
  if (item.categoria === 'variante') return a.criatura === item.id
  if (item.categoria === 'especie') return !!a.criatura && especieDeItem(a.criatura)?.item === item.id
  if (item.categoria === 'paquete') return false
  if (item.categoria === 'baile') return a.celebracion === item.id
  if (item.categoria === 'conjunto') return (CONJUNTOS.find((c) => c.id === item.id)?.pone ?? []).every((id) => PARTES.some((p) => a[p] === id))
  return a[item.categoria as ParteCiempi] === item.id
}

/** Las partes de la apariencia que todavía no son suyas. */
export const sinComprar = (a: AparienciaCiempi, inventario: string[]) => PARTES.filter((p) => !loTiene(inventario, a[p]))

/** ¿Puede ponerse esta apariencia? (todas sus partes, su criatura y su baile de celebrar son suyos). */
export const puedePonerse = (a: AparienciaCiempi, inventario: string[]) =>
  PARTES.every((p) => loTiene(inventario, a[p])) && (a.criatura === null || loTiene(inventario, a.criatura)) && loTiene(inventario, a.celebracion ?? CELEBRACION_INICIAL)

/** ¿Es un id de criatura válido para `apariencia.criatura`? (`variante:<id>` existente). */
export const esCriaturaValida = (id: unknown): id is string => typeof id === 'string' && buscarItem(id)?.categoria === 'variante'

/**
 * Completa una apariencia guardada (o vacía) con los valores iniciales. Lo que
 * ya no existe (las piezas del Ciempi clásico) vuelve al valor inicial.
 * Con `inventario`, un baile de celebración que no es suyo también vuelve al
 * inicial (sin él solo se revisa que el baile exista: el servidor lo valida aparte).
 */
export function normalizarApariencia(guardada: Partial<AparienciaCiempi> | null | undefined, inventario?: string[]): AparienciaCiempi {
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
  // Lo que no es una variante existente (o falta, como en lo guardado antes de 2.5) es Ciempi.
  a.criatura = esCriaturaValida(g.criatura) ? g.criatura : null
  // Lo guardado antes de 2.7 (sin celebración) celebra como siempre.
  a.celebracion = esBaileValido(g.celebracion) && (!inventario || loTiene(inventario, g.celebracion)) ? g.celebracion : CELEBRACION_INICIAL
  return a
}
