import type { Cuento } from './cuentos.ts'

/**
 * Nivel Inicial (-1, antes del nivel 0): «Mis primeras palabras». Nueve cuadernos sin
 * historia para empezar a decodificar: palabras sueltas de sílabas directas (consonante +
 * vocal), una consonante nueva por cuaderno en el orden M, P, S, L, T, N, C (ca, co, cu), R,
 * luego palabras de tres sílabas y un cuaderno puente con frases de 2 o 3 palabras.
 *
 * Se leen como el nivel 0 (una manzana por sílaba, Ciempi dice cada sílaba) y pagan lo
 * mismo que el nivel 0. Al terminar cada palabra aparece su dibujo (`DIBUJOS_INICIAL`),
 * después de leerla para que no se adivine por la imagen.
 *
 * Formato: una palabra (o frase del cuaderno puente) por línea: cada línea es una frase.
 * La prueba inicial.test.ts verifica las letras de cada cuaderno.
 */

const id = (n: number) => `c1e0a000-0000-4000-8000-${String(n).padStart(12, '0')}`

/** [número de cuento, letras nuevas, palabras con su dibujo]. */
const CUADERNOS: [number, string, [string, string][]][] = [
  [66, 'M y P', [['mamá', '👩'], ['papá', '👨'], ['papa', '🥔'], ['mapa', '🗺️'], ['puma', '🐆'], ['mimo', '🤗'], ['pío', '🐤'], ['mío', '🙋'], ['amo', '❤️'], ['ama', '💞']]],
  [67, 'S', [['sopa', '🍲'], ['sapo', '🐸'], ['mesa', '🍽️'], ['masa', '🫓'], ['piso', '🏠'], ['peso', '⚖️'], ['oso', '🐻'], ['osa', '🐻‍❄️'], ['suma', '➕'], ['paso', '👣']]],
  [68, 'L', [['lupa', '🔍'], ['pala', '🪏'], ['sala', '🛋️'], ['palo', '🪵'], ['pelo', '💇'], ['loma', '⛰️'], ['ola', '🌊'], ['lima', '🍋'], ['pila', '🔋'], ['lila', '🪻']]],
  [69, 'T', [['pato', '🦆'], ['tapa', '🫙'], ['moto', '🏍️'], ['tela', '🧵'], ['pata', '🐾'], ['lata', '🥫'], ['tío', '🧔'], ['té', '🍵'], ['tuto', '😴'], ['tutú', '🩰']]],
  [70, 'N', [['luna', '🌙'], ['mano', '✋'], ['mono', '🐒'], ['pino', '🌲'], ['lana', '🧶'], ['nota', '🎵'], ['nena', '👧'], ['nene', '👶'], ['uno', '1️⃣'], ['tina', '🛁']]],
  [71, 'C', [['casa', '🏠'], ['cama', '🛏️'], ['copa', '🏆'], ['cola', '🦊'], ['cuna', '🧸'], ['taco', '🌮'], ['coco', '🥥'], ['saco', '🛍️'], ['capa', '🦸'], ['cono', '🍦']]],
  [72, 'R', [['rosa', '🌹'], ['ropa', '👕'], ['rama', '🌿'], ['risa', '😂'], ['rana', '🐸'], ['pera', '🍐'], ['loro', '🦜'], ['toro', '🐂'], ['cara', '😊'], ['oro', '🥇']]],
  [73, 'tres sílabas', [['paloma', '🕊️'], ['pelota', '⚽'], ['tomate', '🍅'], ['camisa', '👔'], ['maleta', '🧳'], ['pepino', '🥒'], ['paleta', '🍭'], ['cometa', '☄️'], ['camino', '🛤️'], ['pirata', '🏴‍☠️']]],
  [74, 'frases', [['mi mamá', '👩'], ['la luna', '🌙'], ['el pato', '🦆'], ['un oso', '🐻'], ['mi casa', '🏠'], ['Mira la luna.', '🌙'], ['Toma la sopa.', '🍲'], ['Papá come pera.', '🍐'], ['El sapo mira.', '🐸'], ['Mi mono come.', '🐒']]],
]

/** Letras que estrena cada cuaderno (los de tres sílabas y frases no estrenan ninguna). */
export const LETRAS_NUEVAS_INICIAL: string[] = ['mp', 's', 'l', 't', 'n', 'c', 'r', '', '']
/** Palabras amigas del cuaderno puente: muy frecuentes, se aprenden enteras. */
export const PALABRAS_AMIGAS_INICIAL = ['el', 'un', 'mi', 'la']

export const CUADERNOS_INICIAL: Cuento[] = CUADERNOS.map(([n, letras, palabras], i) => ({
  id: id(n),
  nivel: -1,
  titulo: i < 7 ? `Primeras palabras ${i + 1}: ${letras}` : i === 7 ? 'Primeras palabras 8: tres sílabas' : 'Primeras palabras 9: mis primeras frases',
  texto: palabras.map(([p]) => p).join('\n'),
}))

/** Lo que se compara para buscar el dibujo: sin mayúsculas ni puntuación. */
export const claveDibujo = (frase: string) => frase.toLocaleLowerCase('es').replace(/[^\p{L}\s]/gu, '').replace(/\s+/g, ' ').trim()

/** El dibujo de cada palabra (o frase del puente) del nivel Inicial. */
export const DIBUJOS_INICIAL: ReadonlyMap<string, string> = new Map(CUADERNOS.flatMap(([, , palabras]) => palabras.map(([p, d]) => [claveDibujo(p), d] as const)))

/** Palabras de cada cuaderno, en orden (para las pruebas). */
export const PALABRAS_POR_CUADERNO: string[][] = CUADERNOS.map(([, , palabras]) => palabras.map(([p]) => p))
