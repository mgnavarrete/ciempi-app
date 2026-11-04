/**
 * Las criaturas de Ciempi (2.5): datos puros del catálogo, sin dibujo ni
 * reglas de compra (esas viven en catalogo.ts, que también usa el servidor).
 * Los ids de las variantes son exactamente los del laboratorio aprobado
 * (docs/rediseno-ciempi/laboratorio-transformaciones/variantes.js, AD-022).
 *
 * - `especie:<id>`: la especie; tenerla equivale a tener su variante base.
 * - `variante:<id>`: un color de la especie (la base nunca se guarda en el inventario).
 * - `paquete:<id>`: todas las variantes no base de la especie, con 20 % de descuento.
 *
 * El render (src/ciempi/v2/criaturas/) puede importar este archivo.
 *
 * Precios calculados con la economía 2.4.1; revisar cuando cambie el modelo
 * económico (E2). 2.5.2: la Cuncuna se compra con monedas como las demás (40, la
 * especie más barata, pensando en el nivel 0); quien ya la ganó leyendo la conserva.
 */

export type EspecieId = 'dragon' | 'cuncuna' | 'serpiente' | 'camaleon'

export interface EspecieCriatura {
  id: EspecieId
  /** Id de item: `especie:<id>`. */
  item: string
  /** Nombre en la tienda («Dragón»). */
  nombre: string
  emoji: string
  /** Lo que cuesta la especie (incluye su variante base). 0 en la Cuncuna: se gana leyendo. */
  precio: number
  /** No se vende: solo se gana (la Cuncuna, desbloqueo V3 013). */
  soloDesbloqueo: boolean
  /** Id (sin prefijo) de la variante base, la que viene con la especie. */
  base: string
  /** Precio de cada variante no base. */
  precioVariante: number
  /** Id de item del paquete: `paquete:<id>`. */
  paquete: string
  nombrePaquete: string
}

export interface VarianteCriatura {
  /** Id sin prefijo, el del laboratorio («dragon-fuego»). */
  id: string
  /** Id de item: `variante:<id>`. */
  item: string
  nombre: string
  especie: EspecieId
  /** La variante base: viene con la especie. */
  base: boolean
}

const especie = (
  id: EspecieId,
  nombre: string,
  emoji: string,
  precio: number,
  base: string,
  precioVariante: number,
  nombrePaquete: string,
  soloDesbloqueo = false,
): EspecieCriatura => ({ id, item: `especie:${id}`, nombre, emoji, precio, soloDesbloqueo, base, precioVariante, paquete: `paquete:${id}`, nombrePaquete })

/** En el orden de las pestañas de la tienda. */
export const ESPECIES: EspecieCriatura[] = [
  especie('cuncuna', 'Cuncuna', '🐛', 40, 'cuncuna-clasica', 20, 'Todas las Cuncunas'),
  especie('serpiente', 'Serpiente', '🐍', 60, 'serpiente-caramelo', 24, 'Todas las Serpientes'),
  especie('camaleon', 'Camaleón', '🦎', 70, 'camaleon-lima', 24, 'Todos los Camaleones'),
  especie('dragon', 'Dragón', '🐉', 80, 'dragon-clasico', 24, 'Todos los Dragones'),
]

const NOMBRES: Record<EspecieId, [string, string][]> = {
  dragon: [
    ['dragon-clasico', 'Dragón Clásico'],
    ['dragon-fuego', 'Dragón de Fuego'],
    ['dragon-hielo', 'Dragón de Hielo'],
    ['dragon-nocturno', 'Dragón Nocturno'],
    ['dragon-tierra', 'Dragón de Tierra'],
    ['dragon-blanco', 'Dragón Blanco'],
    ['dragon-esmeralda', 'Dragón Esmeralda'],
  ],
  cuncuna: [
    ['cuncuna-clasica', 'Cuncuna Clásica'],
    ['cuncuna-primavera', 'Cuncuna Primavera'],
    ['cuncuna-frutilla', 'Cuncuna Frutilla'],
    ['cuncuna-arcoiris', 'Cuncuna Arcoíris'],
    ['cuncuna-lavanda', 'Cuncuna Lavanda'],
    ['cuncuna-bosque', 'Cuncuna Bosque'],
    ['cuncuna-dorada', 'Cuncuna Dorada'],
  ],
  serpiente: [
    ['serpiente-caramelo', 'Serpiente Caramelo'],
    ['serpiente-jardin', 'Serpiente Jardín'],
    ['serpiente-noche', 'Serpiente Noche'],
    ['serpiente-hoja', 'Serpiente Hoja'],
  ],
  camaleon: [
    ['camaleon-lima', 'Camaleón Lima'],
    ['camaleon-arcoiris', 'Camaleón Arcoíris'],
    ['camaleon-tropical', 'Camaleón Tropical'],
    ['camaleon-atardecer', 'Camaleón Atardecer'],
    ['camaleon-pastel', 'Camaleón Pastel'],
  ],
}

/** Las 23 variantes, agrupadas por especie (en el orden de ESPECIES), la base primero. */
export const VARIANTES_CRIATURAS: VarianteCriatura[] = ESPECIES.flatMap((e) =>
  NOMBRES[e.id].map(([id, nombre]) => ({ id, item: `variante:${id}`, nombre, especie: e.id, base: id === e.base })),
)

/** Descuento de un paquete: cobra el 80 % de las variantes que falten (como los conjuntos). */
export const DESCUENTO_PAQUETE = 0.8

export const especiePorId = (id: string): EspecieCriatura | undefined => ESPECIES.find((e) => e.id === id)
/** Acepta `especie:<id>`, `paquete:<id>` o `variante:<id>`. */
export const especieDeItem = (itemId: string | null | undefined): EspecieCriatura | undefined => {
  if (!itemId) return undefined
  if (itemId.startsWith('variante:')) return especiePorId(varianteDeItem(itemId)?.especie ?? '')
  return ESPECIES.find((e) => e.item === itemId || e.paquete === itemId)
}
/** Acepta `variante:<id>` o el id sin prefijo. */
export const varianteDeItem = (itemId: string | null | undefined): VarianteCriatura | undefined =>
  itemId ? VARIANTES_CRIATURAS.find((v) => v.item === itemId || v.id === itemId) : undefined
export const variantesDe = (especieId: EspecieId) => VARIANTES_CRIATURAS.filter((v) => v.especie === especieId)
/** Ids de item de las variantes no base (las que incluye el paquete). */
export const variantesDePaquete = (especieId: EspecieId) => variantesDe(especieId).filter((v) => !v.base).map((v) => v.item)
/** Miniatura horneada por RENDER (puede no existir todavía: la tienda tiene respaldo). */
export const miniaturaDe = (varianteId: string) => `/criaturas/miniaturas/${varianteDeItem(varianteId)?.id ?? varianteId}.webp`
