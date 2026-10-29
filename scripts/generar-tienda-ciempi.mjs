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

// Precios (propuesta económica del plan maestro, aprobada para 2.2): según el
// trabajo de cada pieza; gestos gratis (expresar emociones no cuesta monedas).
const PRECIOS = {
  // Gorros y máscaras
  'b06-ia-jockey': 0, 'b06-ia-dragon': 26, 'b06-ia-mago': 20, 'b06-ia-aventura': 22, 'b06-ia-pirata': 18, 'b06-ia-corona': 25,
  'b07-ia-robot': 32, 'b07-ia-gatita': 24, 'b07-ia-espiritu': 28, 'b07-ia-dragon': 28, 'b07-ia-buho': 24, 'b12-araluz': 30, 'b12-raton': 24,
  // Peinados
  'b05-harry': 14, 'b05-hermione': 18, 'b05-super': 14, 'b05-barbie': 18, 'b05-flequillo': 12, 'b05-coletas': 16,
  'b05-trenza': 18, 'b05-monos': 16, 'b05-cresta': 14, 'b05-ondas': 18, 'b05-mechon': 12,
  // Lentes (todos sus acabados incluidos)
  'b04-lector': 10, 'b04-redondos': 10, 'b04-corazones': 15, 'b04-estrellas': 16, 'b04-llamas': 20, 'b04-arcoiris': 20,
  'b04-visor': 22, 'b04-aviador': 16, 'b04-mariposa': 18, 'b04-deportivo': 16, 'b04-cientifico': 18, 'b04-sol': 12,
  'b04-cicatriz': 6,
  // Bufanda (los seis colores), capas (todos sus acabados)
  'bufanda-calco32': 30, 'b08-ia-heroica': 28, 'b08-ia-bosque': 24,
  // Calzado y estampados
  'b10-robot': 24, 'b10-aventura': 18, 'b10-lluvia': 12, 'b10-mago': 22, 'b10-deportiva': 18,
  'b11-robot': 32, 'b11-draco': 28, 'b11-mago': 26, 'b11-pirata': 24, 'b11-araluz': 28,
}
const precio = (id) => {
  if (!(id in PRECIOS)) throw Error(`Falta el precio de ${id}`)
  return PRECIOS[id]
}
// Las mochilas se ven pegadas encima del cuerpo (sin correas ni volumen): fuera
// de la tienda hasta tener un diseño que se vea puesto.
const MOCHILAS = new Set(c.bags.map((b) => b.id))

// Las cinco paletas base, gratis; las de personajes, 12.
for (const p of paletas) agregar('paleta', p.id, p.nombre, p.collection || p.collections ? 12 : 0)
for (const o of ojosColores) agregar('ojos', o.id, o.nombre, o.id === 'oscuro' ? 0 : 6)
for (const e of c.facial) agregar('gesto', e.id, e.nombre.replace(' · original', ''), 0)
agregar('cabeza', 'cabeza-nada', 'Sin gorro', 0)
for (const g of [...c.hats, ...c.masks]) agregar('cabeza', g.id, g.nombre, precio(g.id))
agregar('pelo', 'pelo-nada', 'Sin peinado', 0)
for (const h of c.hair) agregar('pelo', h.id, h.nombre, precio(h.id))
agregar('detalle', 'detalle-nada', 'Sin detalle', 0)
for (const d of c.details) agregar('detalle', d.id, d.nombre, precio(d.id))
agregar('cara', 'cara-nada', 'Sin lentes', 0)
for (const l of c.lenses) agregar('cara', l.id, l.nombre, precio(l.id))
agregar('cuello', 'cuello-nada', 'Sin bufanda', 0)
agregar('cuello', c.scarf.id, 'Bufanda acolchada', precio(c.scarf.id))
agregar('espalda', 'espalda-nada', 'Sin capa', 0)
for (const k of c.capes) agregar('espalda', k.id, k.nombre, precio(k.id))
agregar('pies', 'pies-zapatillas', 'Zapatillas', 0)
for (const f of c.footwear) agregar('pies', f.id, f.nombre, precio(f.id))
agregar('textura', 'liso', 'Sin estampado', 0)
for (const s of c.surfaces) agregar('textura', s.id, s.nombre, precio(s.id))

// Variantes de color (se desbloquean todas al comprar la pieza).
const variantes = {}
for (const [categoria, lista] of [['cara', c.lenses], ['espalda', c.capes]])
  for (const x of lista) if (x.variantes?.length > 1) variantes[`${categoria}:${x.id}`] = x.variantes.map((v) => ({ id: v.id, nombre: v.nombre }))
variantes[`cuello:${c.scarf.id}`] = c.scarf.variantes.map((v) => ({ id: v.id, nombre: v.nombre }))

// Conjuntos: sus piezas con precio (el pack cuesta 20 % menos que comprarlas sueltas).
const CLAVE = { cabeza: 'cabeza', textura: 'textura', pies: 'pies', espalda: 'espalda', cuello: 'cuello', cara: 'cara', pelo: 'pelo', paleta: 'paleta', expresion: 'gesto' }
const conjuntos = c.sets.map((s) => {
  // Todo lo que se pone (también lo gratis, como el jockey) y lo que se cobra.
  const pone = Object.entries(s.seleccion)
    .filter(([k, v]) => CLAVE[k] && !MOCHILAS.has(v))
    .map(([k, v]) => `${CLAVE[k]}:${v}`)
  for (const id of pone) if (!items.some((i) => i.id === id)) throw Error(`Pieza desconocida en ${s.id}: ${id}`)
  const piezas = pone.filter((id) => items.find((i) => i.id === id).precio > 0)
  const variantesConjunto = {}
  if (s.seleccion.variante) variantesConjunto.cuello = s.seleccion.variante
  if (s.seleccion.varianteCapa) variantesConjunto.espalda = s.seleccion.varianteCapa
  return { id: `conjunto:${s.id}`, nombre: s.nombre, pone, piezas, variantes: variantesConjunto }
})

// Colores casi iguales se compran una vez para toda la familia.
const familias = [['gryffindor', 'harry', 'hermione'], ['barbie', 'minnie']].map((f) => f.map((id) => `paleta:${id}`))
for (const f of familias) for (const id of f) if (!items.some((i) => i.id === id)) throw Error(`Paleta desconocida: ${id}`)

const salida = `// Generado por scripts/generar-tienda-ciempi.mjs a partir de los diseños aprobados. No editar a mano.
import type { ItemCiempi } from './catalogo.ts'

export const PIEZAS: ItemCiempi[] = ${JSON.stringify(items, null, 1)}

/** Variantes de color de una pieza: se desbloquean todas al comprarla. */
export const VARIANTES: Record<string, { id: string; nombre: string }[]> = ${JSON.stringify(variantes, null, 1)}

/** Piezas que se compran juntas (comprar una desbloquea todas). */
export const FAMILIAS: string[][] = ${JSON.stringify(familias)}

/** Conjuntos completos: «pone» es todo lo que se pone; «piezas», lo que se cobra (20 % menos que sueltas). */
export const CONJUNTOS: { id: string; nombre: string; pone: string[]; piezas: string[]; variantes: Partial<Record<'cuello' | 'espalda', string>> }[] = ${JSON.stringify(conjuntos, null, 1)}
`
fs.writeFileSync('src/ciempi/tienda.generada.ts', salida)
console.log(`${items.length} piezas, ${conjuntos.length} conjuntos, ${Object.keys(variantes).length} piezas con variantes`)
