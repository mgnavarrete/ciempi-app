/**
 * Datos de dibujo de las 23 variantes aprobadas (AD-022), portados tal cual de
 * `docs/rediseno-ciempi/laboratorio-transformaciones/variantes.js`.
 *
 * Solo lo que necesita el render: colores por clave semántica, colores por
 * pieza, cabeza vectorial, patrón de superficie y tinte de las torretas k3.
 * Nombres, precios y paquetes son del catálogo de la tienda (`src/ciempi/criaturas.ts`).
 * Módulo puro (sin DOM).
 */
import type { EspecieId } from '../especie'

export type EspecieCriatura = Exclude<EspecieId, 'ciempi'>
/** Un color o [luz, sombra] (sombra de otro tono: duotono). */
export type Destino = string | readonly [string, string]
export type Colores = Readonly<Record<string, Destino>>

export interface Patron {
  tipo: string
  colores: readonly string[]
  /** Escala del dibujo sobre el centro del núcleo (1 por omisión). */
  escala?: number
  /** Destellos: cuántos (1–3). */
  cantidad?: number
}

export interface VarianteDatos {
  id: string
  especie: EspecieCriatura
  /** La variante base es el diseño aprobado de la especie: sin tinte ni patrón. */
  base?: boolean
  /** Clave semántica → color. */
  colores?: Colores
  /** Colores por pieza raster (encima de `colores`). */
  piezas?: Readonly<Record<string, Colores>>
  /** Color de la cabeza vectorial (Dragón y Cuncuna). */
  cabeza?: string
  patron?: Patron
  /** Tinte de las torretas k3 (Camaleón): claves `borde` y `anillo`. */
  torreta?: Colores
  /** Claves del rostro IA que se tiñen (si no, las de la especie). */
  rostroClaves?: readonly string[]
}

/** Bandas semánticas por especie: [hueMin, hueMax, clave, lMin, lMax]; gana la primera que encaja. */
export type Banda = readonly [number, number, string, number?, number?]
export const BANDAS: Readonly<Record<EspecieCriatura | 'torreta', readonly Banda[]>> = {
  dragon: [[95, 205, 'escamas'], [20, 85, 'vientre', 0.62, 1], [40, 85, 'vientre'], [330, 360, 'pua', 0, 0.62], [0, 40, 'pua', 0, 0.62]],
  cuncuna: [[220, 330, 'lila'], [95, 220, 'menta'], [40, 85, 'amarillo'], [330, 360, 'salmon'], [0, 20, 'salmon'], [20, 40, 'naranja']],
  serpiente: [[15, 45, 'crema', 0.7, 1], [330, 360, 'rojo'], [0, 15, 'rojo'], [15, 80, 'amarillo']],
  camaleon: [[15, 55, 'vientre', 0.72, 1], [300, 360, 'rosa'], [0, 15, 'rosa'], [15, 55, 'amarillo'], [55, 210, 'piel']],
  // Torretas k3: anillos rosa/magenta y sus líneas rojas (h < 12) frente al caparazón naranja y el párpado (h 12–60).
  torreta: [[300, 360, 'anillo'], [0, 12, 'anillo'], [12, 60, 'borde']],
}

/** Rostro IA aprobado de cada especie (AD-020/AD-021): carpeta dentro de `public/criaturas/<especie>/`. */
export const ROSTRO: Readonly<Record<EspecieCriatura, 'v4' | 'v4b' | 'rostro-v2'>> = {
  dragon: 'v4', // AD-021: iteración 1
  cuncuna: 'v4b',
  serpiente: 'rostro-v2',
  camaleon: 'rostro-v2',
}

/** Claves que se tiñen en el rostro IA de Dragón y Cuncuna (los ojos nunca; la Cuncuna, nada). */
export const CLAVES_ROSTRO: Readonly<Partial<Record<EspecieCriatura, readonly string[]>>> = { dragon: ['escamas', 'vientre'], cuncuna: [] }

const v = (especie: EspecieCriatura, lista: Omit<VarianteDatos, 'especie'>[]): VarianteDatos[] => lista.map((x) => ({ ...x, especie }))

export const VARIANTES: readonly VarianteDatos[] = [
  ...v('dragon', [
    { id: 'dragon-clasico', base: true },
    { id: 'dragon-fuego', colores: { escamas: ['#e2402e', '#a51f2c'], pua: '#ffd23a', vientre: '#ffb24a' }, cabeza: '#f4672b', patron: { tipo: 'llamas', colores: ['#ff9a2e', '#ffe14a'] } },
    { id: 'dragon-hielo', colores: { escamas: ['#86d6f7', '#4b98dc'], pua: '#e4f8ff', vientre: '#eef9ff' }, cabeza: '#b4e6fa', patron: { tipo: 'escarcha', colores: ['#ffffff', '#d8f4ff'] } },
    { id: 'dragon-nocturno', colores: { escamas: ['#46559c', '#2d2f72'], pua: '#8e62e0', vientre: '#c3b2f4' }, cabeza: '#5a67b0', rostroClaves: ['escamas'], patron: { tipo: 'estrellas', colores: ['#ffe466', '#7ff0ff'] } },
    { id: 'dragon-tierra', colores: { escamas: ['#bb7442', '#7f4a2b'], pua: '#8cc63f', vientre: '#ecd3a0' }, cabeza: '#c98049', patron: { tipo: 'piedras', colores: ['#6e4426', '#dff3f7', '#5fc4d8'] } },
    { id: 'dragon-blanco', colores: { escamas: ['#f7f0e6', '#a9bff0'], pua: '#f4c64c', vientre: '#dcecfb' }, cabeza: '#fcf4e8', patron: { tipo: 'nacar', colores: ['#c3bcf0', '#ffffff'] } },
    { id: 'dragon-esmeralda', colores: { escamas: ['#17b673', '#0b7650'], pua: '#ffcc2e', vientre: '#c6f5df' }, cabeza: '#2fbf83', patron: { tipo: 'gemas', colores: ['#5fe3a8', '#0d8457', '#ffd23a'] } },
  ]),
  ...v('cuncuna', [
    { id: 'cuncuna-clasica', base: true },
    { id: 'cuncuna-primavera', colores: { lila: '#9fe3b8', menta: '#ffe98a', amarillo: '#ffd84a', salmon: '#ff9fb4', naranja: '#ff9fb4' }, cabeza: '#8fdcb0', patron: { tipo: 'flores', colores: ['#ffffff', '#ff8fb0', '#ffd23a'] } },
    { id: 'cuncuna-frutilla', colores: { lila: ['#f0505c', '#c1323f'], menta: '#ff9fb0', amarillo: '#8fd03c', salmon: '#5fb23c', naranja: '#5fb23c' }, cabeza: '#e8434f', patron: { tipo: 'semillas', colores: ['#ffe27a'] } },
    {
      id: 'cuncuna-arcoiris', colores: { amarillo: '#fff0c4', salmon: '#ffe2d2', naranja: '#5cb2f5' }, cabeza: '#c8a2f2',
      // Orden visible al crecer: cola, B, C, D, A, B… y el frente al final.
      piezas: { cola: { lila: '#a77ff0' }, 'seg-b': { menta: '#ff6f86' }, 'seg-c': { lila: '#ffa53c' }, 'seg-d': { menta: '#ffd83a' }, 'seg-a': { lila: '#6fd07a' }, frente: { lila: '#5cb2f5' } },
      patron: { tipo: 'destellos', colores: ['#ffffff'], cantidad: 2 },
    },
    { id: 'cuncuna-lavanda', colores: { lila: '#cfa8f3', menta: '#a9d6fb', amarillo: '#f2d6f6', salmon: '#e0bdfb', naranja: '#b08ce6' }, cabeza: '#c9a2f0', patron: { tipo: 'brotes', colores: ['#6f45b8', '#5f9a52'], escala: 1.5 } },
    { id: 'cuncuna-bosque', colores: { lila: ['#73963a', '#4d6b2a'], menta: ['#ad6c3d', '#7a4a2a'], amarillo: '#f2c23a', salmon: '#7fb03c', naranja: '#6b8f34' }, cabeza: '#b07a45', patron: { tipo: 'hojas', colores: ['#d4ef7a', '#5f8f2e'], escala: 1.45 } },
    { id: 'cuncuna-dorada', colores: { lila: ['#ffc425', '#e08a12'], menta: '#ffe9ad', amarillo: '#ff9a1f', salmon: '#ffb631', naranja: '#ffc425' }, cabeza: '#f0a020', patron: { tipo: 'destellos', colores: ['#fffbe6'], cantidad: 3 } },
  ]),
  ...v('serpiente', [
    { id: 'serpiente-caramelo', base: true },
    { id: 'serpiente-jardin', colores: { rojo: '#6cc88f', amarillo: '#86bf3e' }, piezas: { 'cabeza-piel-v2': { rojo: '#a8d84c' }, 'cabeza-piel': { rojo: '#a8d84c' } }, patron: { tipo: 'rombos', colores: ['#ffd84a'] } },
    { id: 'serpiente-noche', colores: { rojo: '#5d70e2', amarillo: '#8c60d8', crema: '#cdbaf3' }, piezas: { 'cabeza-piel-v2': { rojo: '#7c88ec' }, 'cabeza-piel': { rojo: '#7c88ec' } }, patron: { tipo: 'estrellas5', colores: ['#fff2b0'] } },
    { id: 'serpiente-hoja', colores: { rojo: '#22b6b0', amarillo: '#1fa39e' }, piezas: { 'cabeza-piel-v2': { rojo: '#2cbcb6' }, 'cabeza-piel': { rojo: '#2cbcb6' } }, patron: { tipo: 'zigzag', colores: ['#b8e24c'] } },
  ]),
  ...v('camaleon', [
    { id: 'camaleon-lima', base: true, torreta: { borde: '#b6de3e', anillo: '#2fb5b8' } },
    {
      id: 'camaleon-arcoiris', colores: { rosa: '#fff3c4', amarillo: '#fff3c4' },
      piezas: { cola: { piel: '#f2639a' }, 'seg-a': { piel: '#ff9b3d' }, 'seg-b': { piel: '#f6cf34' }, 'seg-c': { piel: '#6fcf55' }, 'seg-d': { piel: '#33bfb5' }, frente: { piel: '#4fa6ef' }, casco: { piel: '#6fcf55', rosa: '#f2639a', amarillo: '#ffb43c' } },
      torreta: { borde: '#b6de3e', anillo: '#4fa6ef' },
    },
    {
      id: 'camaleon-tropical', colores: { piel: ['#6cc33f', '#3f9636'], rosa: '#ff8a2a', amarillo: '#ffd23a' },
      piezas: { cola: { piel: '#ff8a2a', rosa: '#ffd23a' }, 'cabeza-piel': { piel: '#bde23c' }, casco: { piel: '#7cc943', rosa: '#ff8a2a' } },
      patron: { tipo: 'franja', colores: ['#fff3b8'] }, torreta: { borde: '#bde23c', anillo: '#ff8a2a' },
    },
    {
      id: 'camaleon-atardecer', colores: { piel: '#ff8f3a', rosa: '#ffe23d', amarillo: '#ffe23d', vientre: '#c9a6ec' },
      piezas: { cola: { piel: '#d6337a' }, 'seg-a': { piel: '#e9457a' }, 'seg-b': { piel: '#f45f68' }, 'seg-c': { piel: '#fb7656' }, 'seg-d': { piel: '#f45f68' }, frente: { piel: '#ff8540' }, 'cabeza-piel': { piel: '#ff9433' }, casco: { piel: '#ff6f5e', rosa: '#ef3f7c', amarillo: '#ffd23a' } },
      patron: { tipo: 'pecas', colores: ['#ffe23d'] },
    },
    {
      id: 'camaleon-pastel', colores: { piel: '#a9e3c8', rosa: '#fff6e0', amarillo: '#fff6e0', vientre: '#9fcdf4' },
      piezas: { cola: { piel: '#c3a6ec' }, 'seg-a': { piel: '#a9e3c8' }, 'seg-b': { piel: '#a8d2f5' }, 'seg-c': { piel: '#c9b2ef' }, 'seg-d': { piel: '#a8d2f5' }, casco: { piel: '#c9b2ef' } },
      patron: { tipo: 'nubes', colores: ['#fff8e8'] }, torreta: { borde: '#a9e3c8', anillo: '#c3a6ec' },
    },
  ]),
]

const INDICE = new Map(VARIANTES.map((x) => [x.id, x]))

/** Id de variante sin el prefijo de la tienda (`variante:dragon-fuego` → `dragon-fuego`). */
export const idVariante = (id: string) => id.replace(/^variante:/, '')

/** Datos de una variante (acepta `variante:<id>` o `<id>`), o null si no existe. */
export const varianteDatos = (id: string | null | undefined): VarianteDatos | null => (id ? INDICE.get(idVariante(id)) ?? null : null)
