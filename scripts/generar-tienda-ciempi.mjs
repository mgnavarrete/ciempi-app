// Genera src/ciempi/tienda.generada.ts: los productos de la tienda de Ciempi a
// partir de los diseños aprobados que usa el juego (public/ciempi-v2/catalogo.json
// y las paletas/ojos del compositor). Aquí vive la política de precios.
// Uso: node scripts/generar-tienda-ciempi.mjs
import fs from 'node:fs'
import { ojosColores, paletas } from '../src/ciempi/v2/arte/lib/armario-ciempi.mjs'
import '../src/ciempi/v2/arte/lib/colecciones-personajes.mjs'
import '../src/ciempi/v2/arte/lib/acabados-armario.mjs'

const c = JSON.parse(fs.readFileSync('public/ciempi-v2/catalogo.json', 'utf8'))
const items = []
const agregar = (categoria, id, nombre, precio) => items.push({ id: `${categoria}:${id}`, nombre, categoria, precio })

// Precios parecidos a la tienda anterior (6 a 30 monedas); lo básico, gratis.
// Las cinco paletas base, gratis (como los cuatro colores gratis de antes); las de personajes, 12.
for (const p of paletas) agregar('paleta', p.id, p.nombre, p.collection || p.collections ? 12 : 0)
for (const o of ojosColores) agregar('ojos', o.id, o.nombre, o.id === 'oscuro' ? 0 : 6)
for (const e of c.facial) agregar('gesto', e.id, e.nombre.replace(' · original', ''), e.id === 'b03-alegre' ? 0 : 8)
agregar('cabeza', 'cabeza-nada', 'Sin gorro', 0)
const PRECIO_GORRO = { 'b06-ia-jockey': 0, 'b06-ia-aventura': 18, 'b06-ia-pirata': 18, 'b06-ia-dragon': 20, 'b06-ia-mago': 20, 'b06-ia-corona': 25 }
for (const g of c.hats) agregar('cabeza', g.id, g.nombre, PRECIO_GORRO[g.id] ?? 20)
for (const m of c.masks) agregar('cabeza', m.id, m.nombre, m.id === 'b07-ia-robot' ? 30 : 25)
agregar('pelo', 'pelo-nada', 'Sin peinado', 0)
for (const h of c.hair) agregar('pelo', h.id, h.nombre, 12)
agregar('detalle', 'detalle-nada', 'Sin detalle', 0)
for (const d of c.details) agregar('detalle', d.id, d.nombre, 6)
agregar('cara', 'cara-nada', 'Sin lentes', 0)
const LENTES_ESPECIALES = ['b04-corazones', 'b04-estrellas', 'b04-arcoiris', 'b04-llamas', 'b04-visor']
for (const l of c.lenses) agregar('cara', l.id, l.nombre, LENTES_ESPECIALES.some((x) => l.id.startsWith(x)) ? 12 : 10)
agregar('cuello', 'cuello-nada', 'Sin bufanda', 0)
agregar('cuello', c.scarf.id, 'Bufanda acolchada', 15)
agregar('espalda', 'espalda-nada', 'Nada en la espalda', 0)
for (const k of c.capes) agregar('espalda', k.id, k.nombre, 25)
for (const b of c.bags) agregar('espalda', b.id, b.nombre, b.id === 'b09-robot' ? 25 : 20)
agregar('pies', 'pies-zapatillas', 'Zapatillas', 0)
for (const f of c.footwear) agregar('pies', f.id, f.nombre, f.id === 'b10-robot' ? 18 : 15)
agregar('textura', 'liso', 'Sin estampado', 0)
for (const s of c.surfaces) agregar('textura', s.id, s.nombre, 20)

// Variantes de color (se desbloquean todas al comprar la pieza).
const variantes = {}
for (const [categoria, lista] of [['cara', c.lenses], ['espalda', c.capes]])
  for (const x of lista) if (x.variantes?.length > 1) variantes[`${categoria}:${x.id}`] = x.variantes.map((v) => ({ id: v.id, nombre: v.nombre }))
variantes[`cuello:${c.scarf.id}`] = c.scarf.variantes.map((v) => ({ id: v.id, nombre: v.nombre }))

// Conjuntos: sus piezas con precio (el pack cuesta 30 % menos que comprarlas sueltas).
const CLAVE = { cabeza: 'cabeza', textura: 'textura', pies: 'pies', espalda: 'espalda', cuello: 'cuello', cara: 'cara', pelo: 'pelo', paleta: 'paleta', expresion: 'gesto' }
const conjuntos = c.sets.map((s) => {
  // Todo lo que se pone (también lo gratis, como el jockey) y lo que se cobra.
  const pone = Object.entries(s.seleccion)
    .filter(([k]) => CLAVE[k])
    .map(([k, v]) => `${CLAVE[k]}:${v}`)
  for (const id of pone) if (!items.some((i) => i.id === id)) throw Error(`Pieza desconocida en ${s.id}: ${id}`)
  const piezas = pone.filter((id) => items.find((i) => i.id === id).precio > 0)
  const variantesConjunto = {}
  if (s.seleccion.variante) variantesConjunto.cuello = s.seleccion.variante
  if (s.seleccion.varianteCapa) variantesConjunto.espalda = s.seleccion.varianteCapa
  return { id: `conjunto:${s.id}`, nombre: s.nombre, pone, piezas, variantes: variantesConjunto }
})

const salida = `// Generado por scripts/generar-tienda-ciempi.mjs a partir de los diseños aprobados. No editar a mano.
import type { ItemCiempi } from './catalogo.ts'

export const PIEZAS: ItemCiempi[] = ${JSON.stringify(items, null, 1)}

/** Variantes de color de una pieza: se desbloquean todas al comprarla. */
export const VARIANTES: Record<string, { id: string; nombre: string }[]> = ${JSON.stringify(variantes, null, 1)}

/** Conjuntos completos: «pone» es todo lo que se pone; «piezas», lo que se cobra (30 % menos que sueltas). */
export const CONJUNTOS: { id: string; nombre: string; pone: string[]; piezas: string[]; variantes: Partial<Record<'cuello' | 'espalda', string>> }[] = ${JSON.stringify(conjuntos, null, 1)}
`
fs.writeFileSync('src/ciempi/tienda.generada.ts', salida)
console.log(`${items.length} piezas, ${conjuntos.length} conjuntos, ${Object.keys(variantes).length} piezas con variantes`)
