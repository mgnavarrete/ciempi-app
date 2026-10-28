import type { Capitulo, NivelLectura, Texto } from '../dominio/tipos.ts'
import { contarPalabras } from '../lectura/monedas.ts'

/**
 * Niveles de lectura. Todos se arman con las frases del libro (las de los niveles 0 y 1,
 * las más cortas): una oración son varias frases seguidas, un párrafo varias
 * oraciones, una página varios párrafos. Por eso el avance se guarda siempre
 * como índice de frase y se puede cambiar de nivel sin perder el lugar.
 */
export type { NivelLectura }

/** `unidad`: lo que se lee de una vez («Frase 3 de 40»). */
export const NIVELES: { nivel: NivelLectura; nombre: string; unidad: string; descripcion: string }[] = [
  { nivel: 0, nombre: 'Sílabas', unidad: 'Frase', descripcion: 'Frases cortas separadas en sílabas, una manzana por sílaba.' },
  { nivel: 1, nombre: 'Palabra', unidad: 'Frase', descripcion: 'Frases cortas, una manzana por palabra.' },
  { nivel: 2, nombre: 'Oración', unidad: 'Oración', descripcion: 'La oración completa, al ritmo del dedo.' },
  { nivel: 3, nombre: 'Párrafo', unidad: 'Párrafo', descripcion: 'El párrafo o la estrofa, una frase por línea y una manzana por frase.' },
  { nivel: 4, nombre: 'Libre', unidad: 'Página', descripcion: 'Una página completa; Ciempi la lee oración por oración al ritmo del dedo.' },
]

export const datosNivel = (nivel: NivelLectura) => NIVELES.find((n) => n.nivel === nivel) ?? NIVELES[1]

/** Una oración larga se corta (en los mismos cortes de sus frases) para no pasar de esto: cabe en una línea. */
export const MAX_PALABRAS_ORACION = 12
/** Párrafos armados a falta de párrafos reales: entre estas palabras y oraciones. */
const PARRAFO = { minPalabras: 30, maxPalabras: 60, maxOraciones: 4 }
const PAGINA = { minPalabras: 100, maxPalabras: 160 }

export interface VistaPorNivel {
  /** Lo que se lee de una vez en este nivel. */
  unidades: string[]
  /** Frase (del nivel 1) donde empieza cada unidad. */
  desdeFrase: number[]
  /** Capítulos, con `desdeFrase` en índices de unidad. */
  capitulos: Capitulo[]
}

const terminaOracion = (frase: string) => /[.!?…]["»”’)]*$/.test(frase.trim())

/** Grupos de frases seguidas: [desde, hasta) en índices de frase. */
type Grupo = [number, number]

/** Unidades del texto para un nivel. El título de cada capítulo va siempre solo. */
export function vistaPorNivel(texto: Pick<Texto, 'frases' | 'capitulos' | 'parrafos'>, nivel: NivelLectura): VistaPorNivel {
  const { frases } = texto
  const capitulos = texto.capitulos.length ? texto.capitulos : [{ titulo: '', desdeFrase: 0 }]
  const palabras = (g: Grupo) => frases.slice(g[0], g[1]).reduce((n, f) => n + contarPalabras(f), 0)
  const inicioParrafo = new Set(texto.parrafos ?? [])

  const vista: VistaPorNivel = { unidades: [], desdeFrase: [], capitulos: [] }
  capitulos.forEach((cap, c) => {
    const desde = cap.desdeFrase
    const hasta = capitulos[c + 1]?.desdeFrase ?? frases.length
    vista.capitulos.push({ titulo: cap.titulo, desdeFrase: vista.unidades.length })
    if (desde >= hasta) return

    // El título del capítulo ("Enero 4") se lee solo, en cualquier nivel.
    const conTitulo = cap.titulo && cap.titulo !== 'Inicio' && frases[desde] === cap.titulo
    const grupos: Grupo[] = conTitulo ? [[desde, desde + 1]] : []
    const cuerpo = agrupar(frases, conTitulo ? desde + 1 : desde, hasta, nivel, palabras, inicioParrafo)
    for (const g of [...grupos, ...cuerpo]) {
      vista.unidades.push(frases.slice(g[0], g[1]).join(' '))
      vista.desdeFrase.push(g[0])
    }
  })
  return vista
}

function agrupar(
  frases: string[],
  desde: number,
  hasta: number,
  nivel: NivelLectura,
  palabras: (g: Grupo) => number,
  inicioParrafo: Set<number>,
): Grupo[] {
  const sueltas: Grupo[] = []
  for (let i = desde; i < hasta; i++) sueltas.push([i, i + 1])
  if (nivel <= 1) return sueltas

  // Nivel 2: oraciones (frases seguidas hasta un punto), sin pasar de MAX_PALABRAS_ORACION.
  const oraciones = juntar(sueltas, (actual, sig) => !terminaOracion(frases[actual[1] - 1]) && palabras([actual[0], sig[1]]) <= MAX_PALABRAS_ORACION && !inicioParrafo.has(sig[0]))
  if (nivel === 2) return oraciones

  // Nivel 3: los párrafos (o estrofas) del libro; si no los tiene, se arman de
  // 30 a 60 palabras. Un párrafo real muy largo se parte igual, para que quepa.
  const parrafos = inicioParrafo.size
    ? juntar(oraciones, (_, sig) => !inicioParrafo.has(sig[0])).flatMap((p) =>
        palabras(p) <= PARRAFO.maxPalabras * 1.5
          ? [p]
          : juntarPorLargo(
              oraciones.filter((o) => o[0] >= p[0] && o[1] <= p[1]),
              PARRAFO.minPalabras,
              PARRAFO.maxPalabras,
              palabras,
              PARRAFO.maxOraciones,
            ),
      )
    : juntarPorLargo(oraciones, PARRAFO.minPalabras, PARRAFO.maxPalabras, palabras, PARRAFO.maxOraciones)
  if (nivel === 3) return parrafos

  // Nivel 4: páginas de 100 a 160 palabras, sin cortar párrafos.
  return juntarPorLargo(parrafos, PAGINA.minPalabras, PAGINA.maxPalabras, palabras)
}

/** Une grupos seguidos mientras `seguir(actual, siguiente)` diga que sí. */
function juntar(grupos: Grupo[], seguir: (actual: Grupo, sig: Grupo) => boolean): Grupo[] {
  const resultado: Grupo[] = []
  for (const g of grupos) {
    const ultimo = resultado.at(-1)
    if (ultimo && seguir(ultimo, g)) ultimo[1] = g[1]
    else resultado.push([g[0], g[1]])
  }
  return resultado
}

/** Une grupos hasta llegar a `min` palabras, sin pasar de `max` (ni de `maxGrupos`). */
function juntarPorLargo(grupos: Grupo[], min: number, max: number, palabras: (g: Grupo) => number, maxGrupos = Infinity): Grupo[] {
  const resultado: Grupo[] = []
  let cuantos = 0
  for (const g of grupos) {
    const ultimo = resultado.at(-1)
    if (ultimo && palabras(ultimo) < min && palabras([ultimo[0], g[1]]) <= max && cuantos < maxGrupos) {
      ultimo[1] = g[1]
      cuantos++
    } else {
      resultado.push([g[0], g[1]])
      cuantos = 1
    }
  }
  return resultado
}

/** La unidad que contiene la frase (por ejemplo, para retomar donde quedó). */
export function unidadDeFrase(vista: VistaPorNivel, frase: number): number {
  let u = 0
  while (u + 1 < vista.desdeFrase.length && vista.desdeFrase[u + 1] <= frase) u++
  return u
}

/** La frase donde empieza la unidad (o el total de frases si ya se terminó todo). */
export function fraseDeUnidad(vista: VistaPorNivel, unidad: number, totalFrases: number): number {
  return unidad >= vista.unidades.length ? totalFrases : vista.desdeFrase[Math.max(0, unidad)]
}
