/**
 * Compatibilidad de la apariencia con una especie (LABORATORIO — no integrado).
 *
 * Decide qué piezas equipadas se ven y cuáles se ocultan en una especie, con el
 * motivo. Nunca modifica la apariencia ni el inventario: lo comprado y
 * equipado se conserva y vuelve a verse al cambiar a una especie compatible.
 *
 * - universal: cuelga de la cabeza o el cuello (iguales en todas las especies) → se ve igual.
 * - adaptable: pies, espalda, paleta y textura → se ve, ajustado a la especie.
 * - exclusivo: pieza propia de una especie → solo se ve en ella.
 */
import { EXCLUSIVOS, especie as buscarEspecie, type Especie, type EspecieId, type Parte, type TipoCompatibilidad } from './especie'

/** Partes del personaje (fondo y comida no se dibujan sobre él, pero son universales). */
export const PARTES_PERSONAJE: Parte[] = ['paleta', 'ojos', 'gesto', 'cabeza', 'pelo', 'detalle', 'cara', 'cuello', 'espalda', 'pies', 'textura', 'fondo', 'comida']

/** Valor «sin nada» de cada parte, con el formato de la tienda. */
export const NINGUNO: Partial<Record<Parte, string>> = {
  cabeza: 'cabeza:cabeza-nada', pelo: 'pelo:pelo-nada', detalle: 'detalle:detalle-nada', cara: 'cara:cara-nada',
  cuello: 'cuello:cuello-nada', espalda: 'espalda:espalda-nada', pies: 'pies:pies-zapatillas', textura: 'textura:liso',
  paleta: 'paleta:clasica', gesto: 'gesto:b03-alegre', ojos: 'ojos:oscuro',
}

export type Apariencia = Partial<Record<Parte, string>>

export interface Etiqueta {
  parte: Parte
  id: string
  tipo: TipoCompatibilidad
  visible: boolean
  /** Por qué se oculta o cómo se adapta. */
  motivo?: string
}

export interface Resolucion {
  especie: EspecieId
  /** Lo que se dibuja: las partes ocultas vuelven a su valor «sin nada». */
  visibles: Apariencia
  /** Lo equipado que no se dibuja en esta especie, sin desequiparlo. */
  ocultos: Etiqueta[]
  /** Etiqueta de cada parte equipada (para la interfaz). */
  etiquetas: Partial<Record<Parte, Etiqueta>>
  /** Rasgos propios de la especie que se esconden por una pieza puesta (p. ej. cuernos bajo una máscara). */
  rasgosOcultos: string[]
}

const exclusivoDe = (id: string) => EXCLUSIVOS.find((x) => x.id === id)

/** Tipo de compatibilidad de una pieza en una especie, sin mirar si está oculta. */
export function tipoDe(parte: Parte, id: string, especie: Especie | EspecieId = 'ciempi'): TipoCompatibilidad {
  const e = typeof especie === 'string' ? buscarEspecie(especie) : especie
  if (exclusivoDe(id)) return 'exclusivo'
  if (esNinguno(parte, id)) return 'universal'
  return e.adaptables[parte] ? 'adaptable' : 'universal'
}

const esNinguno = (parte: Parte, id: string) => NINGUNO[parte] === id

/** Etiqueta de una pieza concreta en una especie (también para lo no equipado, p. ej. en una tienda). */
export function etiquetar(parte: Parte, id: string, especie: Especie | EspecieId = 'ciempi'): Etiqueta {
  const e = typeof especie === 'string' ? buscarEspecie(especie) : especie
  const tipo = tipoDe(parte, id, e)
  const ex = exclusivoDe(id)
  if (ex && ex.especie !== e.id) return { parte, id, tipo, visible: false, motivo: `Exclusivo de ${buscarEspecie(ex.especie).nombre}: se guarda y se verá al volver a esa especie.` }
  if (ex && ex.parte !== parte) return { parte, id, tipo, visible: false, motivo: 'Pieza exclusiva en una parte que no le corresponde.' }
  const oculta = e.ocultas.find((o) => o.id === id)
  if (oculta) return { parte, id, tipo, visible: false, motivo: oculta.motivo }
  if (tipo === 'adaptable' && !esNinguno(parte, id)) return { parte, id, tipo, visible: true, motivo: e.adaptables[parte]?.como }
  return { parte, id, tipo, visible: true }
}

/**
 * Resuelve qué se ve de una apariencia en una especie. No modifica `apariencia`.
 * Las partes ocultas se dibujan con su valor «sin nada»; las demás tal cual.
 */
export function resolver(apariencia: Apariencia, especie: Especie | EspecieId = 'ciempi'): Resolucion {
  const e = typeof especie === 'string' ? buscarEspecie(especie) : especie
  const visibles: Apariencia = {}
  const ocultos: Etiqueta[] = []
  const etiquetas: Partial<Record<Parte, Etiqueta>> = {}
  for (const parte of PARTES_PERSONAJE) {
    const id = apariencia[parte]
    if (id === undefined) continue
    const et = etiquetar(parte, id, e)
    etiquetas[parte] = et
    if (et.visible) visibles[parte] = id
    else {
      ocultos.push(et)
      visibles[parte] = NINGUNO[parte] ?? id
    }
  }
  const rasgosOcultos = new Set<string>()
  for (const r of e.rasgosOcultosCon) {
    const id = visibles[r.parte]
    if (!id || esNinguno(r.parte, id)) continue
    if (r.ids === '*' || r.ids.includes(id)) for (const x of r.rasgos) rasgosOcultos.add(x)
  }
  return { especie: e.id, visibles, ocultos, etiquetas, rasgosOcultos: [...rasgosOcultos] }
}
