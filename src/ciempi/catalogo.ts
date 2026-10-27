/**
 * Catálogo de cosas para personalizar a Ciempi. El servidor importa este
 * mismo archivo para cobrar las compras, así que los precios viven solo aquí.
 * Todo está disponible para todos: no hay cosas "de niño" o "de niña".
 */

export type CategoriaCiempi = 'paleta' | 'forma' | 'ojos' | 'cabeza' | 'cara' | 'pies' | 'diseno' | 'fondo' | 'comida'

/** Las partes de Ciempi que se pueden cambiar (una cosa puesta por parte). */
export const PARTES: CategoriaCiempi[] = ['paleta', 'forma', 'ojos', 'cabeza', 'cara', 'pies', 'diseno', 'fondo', 'comida']

export interface ItemCiempi {
  id: string
  nombre: string
  categoria: CategoriaCiempi
  /** 0 = gratis (siempre disponible). */
  precio: number
}

export interface Paleta {
  /** Colores de los segmentos, en orden (se repiten). */
  cuerpo: string[]
  cabeza: string
}

export const PALETAS: Record<string, Paleta> = {
  clasica: { cuerpo: ['#3a9fb1', '#ef9129'], cabeza: '#ef9129' },
  oceano: { cuerpo: ['#247586', '#73bfcc'], cabeza: '#73bfcc' },
  bosque: { cuerpo: ['#62954c', '#a9c670'], cabeza: '#8eb743' },
  frutilla: { cuerpo: ['#ea6444', '#f6a5b8'], cabeza: '#f6a5b8' },
  sol: { cuerpo: ['#efc31d', '#f59a5e'], cabeza: '#efc31d' },
  lavanda: { cuerpo: ['#8f6fcf', '#cdb8f2'], cabeza: '#cdb8f2' },
  noche: { cuerpo: ['#36384f', '#5d6b80'], cabeza: '#73bfcc' },
  arcoiris: { cuerpo: ['#ea6444', '#ef9129', '#efc31d', '#8eb743', '#3a9fb1', '#8f6fcf'], cabeza: '#ef9129' },
}

export const CATALOGO: ItemCiempi[] = [
  // Colores
  { id: 'paleta-clasica', nombre: 'Clásico', categoria: 'paleta', precio: 0 },
  { id: 'paleta-oceano', nombre: 'Océano', categoria: 'paleta', precio: 0 },
  { id: 'paleta-bosque', nombre: 'Bosque', categoria: 'paleta', precio: 0 },
  { id: 'paleta-frutilla', nombre: 'Frutilla', categoria: 'paleta', precio: 0 },
  { id: 'paleta-sol', nombre: 'Sol', categoria: 'paleta', precio: 8 },
  { id: 'paleta-lavanda', nombre: 'Lavanda', categoria: 'paleta', precio: 10 },
  { id: 'paleta-noche', nombre: 'Noche', categoria: 'paleta', precio: 10 },
  { id: 'paleta-arcoiris', nombre: 'Arcoíris', categoria: 'paleta', precio: 20 },
  // Forma de los segmentos del cuerpo
  { id: 'forma-circulo', nombre: 'Círculos', categoria: 'forma', precio: 0 },
  { id: 'forma-cuadrado', nombre: 'Cuadrados', categoria: 'forma', precio: 10 },
  { id: 'forma-triangulo', nombre: 'Triángulos', categoria: 'forma', precio: 10 },
  { id: 'forma-rombo', nombre: 'Rombos', categoria: 'forma', precio: 12 },
  { id: 'forma-hexagono', nombre: 'Hexágonos', categoria: 'forma', precio: 12 },
  { id: 'forma-nube', nombre: 'Nubes', categoria: 'forma', precio: 15 },
  { id: 'forma-corazon', nombre: 'Corazones', categoria: 'forma', precio: 18 },
  { id: 'forma-estrella', nombre: 'Estrellas', categoria: 'forma', precio: 20 },
  // Ojos
  { id: 'ojos-normales', nombre: 'Normales', categoria: 'ojos', precio: 0 },
  { id: 'ojos-azules', nombre: 'Azules', categoria: 'ojos', precio: 6 },
  { id: 'ojos-verdes', nombre: 'Verdes', categoria: 'ojos', precio: 6 },
  { id: 'ojos-miel', nombre: 'Color miel', categoria: 'ojos', precio: 6 },
  { id: 'ojos-dormilones', nombre: 'Dormilones', categoria: 'ojos', precio: 8 },
  { id: 'ojos-guino', nombre: 'Guiño', categoria: 'ojos', precio: 10 },
  { id: 'ojos-estrellas', nombre: 'Estrellas', categoria: 'ojos', precio: 15 },
  { id: 'ojos-corazones', nombre: 'Enamorados', categoria: 'ojos', precio: 15 },
  // Gorros y cosas en la cabeza
  { id: 'cabeza-nada', nombre: 'Nada', categoria: 'cabeza', precio: 0 },
  { id: 'cabeza-antenas', nombre: 'Antenas', categoria: 'cabeza', precio: 0 },
  { id: 'cabeza-jockey', nombre: 'Jockey', categoria: 'cabeza', precio: 0 },
  { id: 'cabeza-flor', nombre: 'Flor', categoria: 'cabeza', precio: 0 },
  { id: 'cabeza-lazo', nombre: 'Lazo', categoria: 'cabeza', precio: 0 },
  { id: 'cabeza-cumpleanos', nombre: 'Cumpleaños', categoria: 'cabeza', precio: 12 },
  { id: 'cabeza-gorro-lana', nombre: 'Gorro de lana', categoria: 'cabeza', precio: 12 },
  { id: 'cabeza-orejas-gato', nombre: 'Orejas de gato', categoria: 'cabeza', precio: 15 },
  { id: 'cabeza-vaquero', nombre: 'Vaquero', categoria: 'cabeza', precio: 15 },
  { id: 'cabeza-mago', nombre: 'Mago', categoria: 'cabeza', precio: 20 },
  { id: 'cabeza-corona', nombre: 'Corona', categoria: 'cabeza', precio: 25 },
  { id: 'cabeza-astronauta', nombre: 'Astronauta', categoria: 'cabeza', precio: 30 },
  { id: 'cabeza-audifonos', nombre: 'Audífonos', categoria: 'cabeza', precio: 15 },
  { id: 'cabeza-pirata', nombre: 'Pirata', categoria: 'cabeza', precio: 18 },
  { id: 'cabeza-unicornio', nombre: 'Unicornio', categoria: 'cabeza', precio: 25 },
  // Cara
  { id: 'cara-nada', nombre: 'Nada', categoria: 'cara', precio: 0 },
  { id: 'cara-lentes', nombre: 'Lentes', categoria: 'cara', precio: 10 },
  { id: 'cara-lentes-sol', nombre: 'Lentes de sol', categoria: 'cara', precio: 12 },
  { id: 'cara-lentes-corazon', nombre: 'Lentes de corazón', categoria: 'cara', precio: 15 },
  { id: 'cara-antifaz', nombre: 'Antifaz de héroe', categoria: 'cara', precio: 15 },
  // Zapatos
  { id: 'pies-clasicos', nombre: 'Clásicos', categoria: 'pies', precio: 0 },
  { id: 'pies-zapatillas', nombre: 'Zapatillas', categoria: 'pies', precio: 10 },
  { id: 'pies-botas', nombre: 'Botas de lluvia', categoria: 'pies', precio: 12 },
  { id: 'pies-futbol', nombre: 'De fútbol', categoria: 'pies', precio: 12 },
  { id: 'pies-pantuflas', nombre: 'Pantuflas de conejo', categoria: 'pies', precio: 15 },
  { id: 'pies-payaso', nombre: 'De payaso', categoria: 'pies', precio: 15 },
  { id: 'pies-brillantes', nombre: 'Brillantes', categoria: 'pies', precio: 18 },
  { id: 'pies-patines', nombre: 'Patines', categoria: 'pies', precio: 20 },
  // Diseños en el cuerpo
  { id: 'diseno-liso', nombre: 'Liso', categoria: 'diseno', precio: 0 },
  { id: 'diseno-puntos', nombre: 'Puntos', categoria: 'diseno', precio: 10 },
  { id: 'diseno-rayas', nombre: 'Rayas', categoria: 'diseno', precio: 10 },
  { id: 'diseno-estrellas', nombre: 'Estrellas', categoria: 'diseno', precio: 15 },
  { id: 'diseno-corazones', nombre: 'Corazones', categoria: 'diseno', precio: 15 },
  { id: 'diseno-flores', nombre: 'Flores', categoria: 'diseno', precio: 12 },
  { id: 'diseno-huellitas', nombre: 'Huellitas', categoria: 'diseno', precio: 12 },
  { id: 'diseno-rayos', nombre: 'Rayos', categoria: 'diseno', precio: 15 },
  { id: 'diseno-llamas', nombre: 'Llamas', categoria: 'diseno', precio: 18 },
  { id: 'diseno-autos', nombre: 'Autos', categoria: 'diseno', precio: 20 },
  // Fondos
  { id: 'fondo-jardin', nombre: 'Jardín', categoria: 'fondo', precio: 0 },
  { id: 'fondo-mar', nombre: 'Mar', categoria: 'fondo', precio: 20 },
  { id: 'fondo-selva', nombre: 'Selva', categoria: 'fondo', precio: 20 },
  { id: 'fondo-dulces', nombre: 'Dulces', categoria: 'fondo', precio: 20 },
  { id: 'fondo-nieve', nombre: 'Nieve', categoria: 'fondo', precio: 20 },
  { id: 'fondo-espacio', nombre: 'Espacio', categoria: 'fondo', precio: 25 },
  // Lo que Ciempi se come en la pista (una por palabra)
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

export const CATEGORIAS: { id: CategoriaCiempi; nombre: string; emoji: string }[] = [
  { id: 'paleta', nombre: 'Colores', emoji: '🎨' },
  { id: 'forma', nombre: 'Forma', emoji: '🔷' },
  { id: 'ojos', nombre: 'Ojos', emoji: '👀' },
  { id: 'cabeza', nombre: 'Gorros', emoji: '🎩' },
  { id: 'cara', nombre: 'Cara', emoji: '👓' },
  { id: 'pies', nombre: 'Zapatos', emoji: '👟' },
  { id: 'diseno', nombre: 'Diseños', emoji: '✨' },
  { id: 'fondo', nombre: 'Fondos', emoji: '🏞️' },
  { id: 'comida', nombre: 'Comida', emoji: '🍎' },
]

export const buscarItem = (id: string) => CATALOGO.find((i) => i.id === id)

/** Lo gratis siempre está disponible; lo demás, si se compró. */
export const loTiene = (inventario: string[], id: string) => (buscarItem(id)?.precio ?? 1) === 0 || inventario.includes(id)

/** El nombre corto sin prefijo de categoría: "cabeza-mago" → "mago". */
export const variante = (id: string) => id.slice(id.indexOf('-') + 1)

export type Genero = 'nino' | 'nina'

/** Cómo se ve el Ciempi de cada niño. */
export interface AparienciaCiempi {
  nombre: string
  genero: Genero | null
  paleta: string
  forma: string
  ojos: string
  cabeza: string
  cara: string
  pies: string
  diseno: string
  fondo: string
  /** Lo que se come en la pista de lectura. */
  comida: string
  /** Ya vio la presentación de Ciempi (la primera vez que entra). */
  presentado: boolean
}

export const APARIENCIA_INICIAL: AparienciaCiempi = {
  nombre: 'Ciempi',
  genero: null,
  paleta: 'paleta-clasica',
  forma: 'forma-circulo',
  ojos: 'ojos-normales',
  // Parte sin nada en la cabeza: el niño elige qué ponerle.
  cabeza: 'cabeza-nada',
  cara: 'cara-nada',
  pies: 'pies-clasicos',
  diseno: 'diseno-liso',
  fondo: 'fondo-jardin',
  comida: 'comida-manzana',
  presentado: false,
}

/** Completa una apariencia guardada (o vacía) con los valores iniciales. */
export function normalizarApariencia(guardada: Partial<AparienciaCiempi> | null | undefined): AparienciaCiempi {
  const a = { ...APARIENCIA_INICIAL, ...(guardada ?? {}) }
  for (const c of PARTES) {
    if (buscarItem(a[c])?.categoria !== c) a[c] = APARIENCIA_INICIAL[c]
  }
  a.nombre = (a.nombre ?? '').trim().slice(0, 20) || APARIENCIA_INICIAL.nombre
  a.presentado = a.presentado === true
  return a
}

export const paletaDe = (a: AparienciaCiempi): Paleta => PALETAS[variante(a.paleta)] ?? PALETAS.clasica
