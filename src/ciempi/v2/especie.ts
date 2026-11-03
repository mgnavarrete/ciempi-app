/**
 * Especies de Ciempi (LABORATORIO T01/T02 — no integradas al juego).
 *
 * Una especie es otra base SVG con los mismos ids que usa el compositor
 * (`body`, `legs-and-sneakers`, `head`, `eyes`, `mouth`, `antennae`, `jockey`…)
 * y la misma cabeza: círculo (736, 340) r130, ojos y anclajes de accesorios.
 * Lo propio de cada especie se suma en grupos aparte (cuernos, cresta,
 * pelaje, alas) y nunca desplaza ese círculo. El cuerpo crece repitiendo
 * segmentos modulares (A→B→C→D→A…) entre una cola y un frente únicos; nunca se
 * estira una imagen completa.
 *
 * Módulo puro (sin DOM): lo pueden importar la vista, el laboratorio y, en el
 * futuro, el servidor.
 */

export type EspecieId = 'ciempi' | 'dragon' | 'cuncuna'

/** Partes de la apariencia (las mismas de `catalogo.ts`, sin importar la tienda). */
export type Parte =
  | 'paleta' | 'ojos' | 'gesto' | 'cabeza' | 'pelo' | 'detalle' | 'cara' | 'cuello' | 'espalda' | 'pies' | 'textura' | 'fondo' | 'comida'

/** Cómo se dispone el cuerpo al crecer. Los valores de Ciempi reproducen exactamente `pose.ts`. */
export interface FormaCuerpo {
  /** Roles del maestro que se repiten en el centro, en orden (Ciempi 1→2→3; especies A→B→C→D). */
  ciclo: number[]
  /** Rol de la cola (primer segmento) y del frente (último, junto a la cabeza). */
  cola: number
  frente: number
  /** x del segmento delantero: el cuerpo crece hacia atrás desde aquí. */
  xFrente: number
  /** y del centro de cada rol, en unidades de la base (viewBox 0 0 1000 650). */
  y: Record<number, number>
  /** Distancia de cada rol al segmento siguiente (hacia la cabeza). */
  separacion: Record<number, number>
  /** x de cada segmento en el maestro de cinco: las patas se trasladan desde aquí. */
  xMaestro: Record<number, number>
  /** Pie del maestro que usa cada rol (un rol sin pie propio reutiliza otro). */
  pieDeRol: Record<number, number>
  /**
   * Con cinco segmentos Ciempi conserva el maestro tal cual. Una especie cuyo
   * maestro guarda piezas extra (el segmento D) siempre se recompone.
   */
  siempreClonar: boolean
  /** Margen del encuadre a la izquierda del centro de la cola (Ciempi: 110; una cola con punta necesita más). */
  margenCola?: number
}

/** Puntos de unión fijos: la cabeza de todas las especies es la de Ciempi. */
export const CABEZA = { centro: [736, 340] as const, radio: 130 }

export type TipoCompatibilidad = 'universal' | 'adaptable' | 'exclusivo'

export interface Adaptacion {
  /** Qué se hace con la pieza en esta especie. */
  como: string
}

export interface ElementoExclusivo {
  /** Id con el formato de la tienda («categoría:diseño»). */
  id: string
  parte: Parte
  nombre: string
  especie: EspecieId
}

export interface Especie {
  id: EspecieId
  /** Id de inventario de la transformación (futuro). */
  item: `especie:${EspecieId}`
  nombre: string
  /** Estado artístico: solo Ciempi está aprobado. */
  estado: 'aprobada' | 'laboratorio — pendiente de aprobación'
  forma: FormaCuerpo
  /** Partes adaptables y cómo se adaptan (el resto de partes del personaje son universales). */
  adaptables: Partial<Record<Parte, Adaptacion>>
  /** Piezas que solo existen para esta especie. */
  exclusivos: ElementoExclusivo[]
  /**
   * Piezas universales que en esta especie se ocultan por diseño (sin
   * desequiparlas), con el motivo. Vacío salvo decisión visual documentada.
   */
  ocultas: { id: string; motivo: string }[]
  /** Rasgos propios que se esconden mientras se lleva cierta pieza (p. ej. cuernos bajo una máscara completa). */
  rasgosOcultosCon: { parte: Parte; ids: string[] | '*'; rasgos: string[]; motivo: string }[]
  /** Manifiesto de recursos del laboratorio (ruta relativa a la raíz del repositorio). */
  manifiesto?: string
}

/** Forma aprobada de Ciempi: idéntica a las constantes históricas de `pose.ts`. */
export const FORMA_CIEMPI: FormaCuerpo = {
  ciclo: [1, 2, 3],
  cola: 0,
  frente: 4,
  xFrente: 558,
  y: { 0: 386, 1: 410, 2: 414, 3: 402, 4: 402 },
  separacion: { 0: 102, 1: 101, 2: 87, 3: 81 },
  xMaestro: { 0: 187, 1: 289, 2: 390, 3: 477, 4: 558 },
  pieDeRol: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 },
  siempreClonar: false,
}

/**
 * Forma de las especies modulares: cola (0), A (1), B (2), C (3), frente (4) y
 * D (5, guardado aparte en el maestro). Los cuatro centrales tienen el mismo
 * tamaño y altura de unión; D reutiliza la pata de A.
 */
const formaModular = (y: number, sep: number, yCola: number, sepCola: number, margenCola: number, ciclo = [1, 2, 3, 5]): FormaCuerpo => ({
  ciclo,
  cola: 0,
  frente: 4,
  xFrente: 558,
  y: { 0: yCola, 1: y, 2: y, 3: y, 4: 402, 5: y },
  separacion: { 0: sepCola, 1: sep, 2: sep, 3: sep, 5: sep },
  xMaestro: { 0: 187, 1: 289, 2: 390, 3: 477, 4: 558, 5: 289 },
  pieDeRol: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 1 },
  siempreClonar: true,
  margenCola,
})

/** Máscaras que cubren toda la cabeza (fullFace en el catálogo): tapan rasgos propios de la cabeza. */
export const MASCARAS_COMPLETAS = ['cabeza:b07-ia-robot', 'cabeza:b07-ia-espiritu', 'cabeza:b12-araluz']

const ADAPTABLES_COMUNES: Partial<Record<Parte, Adaptacion>> = {
  pies: { como: 'El calzado se pone sobre la pata propia: mismo tobillo y mismo giro que las zapatillas de Ciempi.' },
  espalda: { como: 'Capas y mochilas se anclan al cuello y al segmento delantero, que conservan la posición de Ciempi.' },
  paleta: { como: 'La paleta tiñe el cuerpo propio de la especie con el tono derivado de su color principal (no reemplaza colores uno a uno).' },
  textura: { como: 'La superficie se aplica como traje sobre el núcleo de cada segmento, con contorno propio; el pelaje/espinas exteriores quedan a la vista.' },
}

export const ESPECIES: Record<EspecieId, Especie> = {
  ciempi: {
    id: 'ciempi',
    item: 'especie:ciempi',
    nombre: 'Ciempi',
    estado: 'aprobada',
    forma: FORMA_CIEMPI,
    adaptables: {},
    exclusivos: [],
    ocultas: [],
    rasgosOcultosCon: [],
  },
  dragon: {
    id: 'dragon',
    item: 'especie:dragon',
    nombre: 'Ciempi Dragón',
    estado: 'laboratorio — pendiente de aprobación',
    forma: formaModular(402, 92, 400, 104, 175),
    adaptables: ADAPTABLES_COMUNES,
    exclusivos: [
      { id: 'espalda:dragon-alas', parte: 'espalda', nombre: 'Alitas de dragón', especie: 'dragon' },
    ],
    ocultas: [],
    rasgosOcultosCon: [
      {
        parte: 'cabeza',
        ids: MASCARAS_COMPLETAS,
        rasgos: ['cuernos', 'hocico'],
        motivo: 'La máscara completa cubre la cabeza: cuernos y hocico quedarían asomando o encima del disfraz.',
      },
    ],
    manifiesto: 'docs/rediseno-ciempi/laboratorio-transformaciones/recursos/dragon/manifiesto.json',
  },
  cuncuna: {
    id: 'cuncuna',
    item: 'especie:cuncuna',
    nombre: 'Ciempi Cuncuna',
    estado: 'laboratorio — pendiente de aprobación',
    forma: formaModular(404, 88, 402, 100, 180, [2, 3, 5, 1]),
    // Ciclo B→C→D→A: cola y frente son lila, así el primer central es menta y se alterna lila/menta.
    adaptables: ADAPTABLES_COMUNES,
    exclusivos: [],
    ocultas: [],
    rasgosOcultosCon: [
      { parte: 'cabeza', ids: '*', rasgos: ['penacho'], motivo: 'El penacho ocupa la coronilla: bajo gorros y máscaras se guarda para no atravesarlos.' },
      { parte: 'pelo', ids: '*', rasgos: ['penacho'], motivo: 'Un peinado reemplaza al penacho en la coronilla.' },
    ],
    manifiesto: 'docs/rediseno-ciempi/laboratorio-transformaciones/recursos/cuncuna/manifiesto.json',
  },
}

export const especie = (id: string): Especie => ESPECIES[id as EspecieId] ?? ESPECIES.ciempi

/** Todos los exclusivos de todas las especies (para reconocerlos en el inventario). */
export const EXCLUSIVOS: ElementoExclusivo[] = Object.values(ESPECIES).flatMap((e) => e.exclusivos)
