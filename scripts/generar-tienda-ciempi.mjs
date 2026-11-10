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
// Nombres cortos y concretos, que un niño entiende de un vistazo (los del diseño son largos o abstractos).
const NOMBRES = {
  // Colores y ojos
  oceano: 'Mar', rosa: 'Rosa', noche: 'Noche', gryffindor: 'Gryffindor', slytherin: 'Slytherin', ravenclaw: 'Ravenclaw', hufflepuff: 'Hufflepuff',
  harry: 'Harry', kitty: 'Kitty', mickey: 'Mickey', minnie: 'Minnie', oscuro: 'Oscuros', violeta: 'Morados',
  // Gestos
  'b03-carcajada': 'Risa', 'b03-pensativo': 'Pensando', 'b03-sorprendido': 'Sorpresa', 'b03-dormilon': 'Con sueño', 'b03-enojadito': 'Enojado',
  // Gorros y máscaras
  'b06-ia-jockey': 'Jockey', 'b06-ia-dragon': 'Gorro dragón', 'b06-ia-mago': 'Gorro de mago', 'b06-ia-aventura': 'Explorador',
  'b06-ia-pirata': 'Pirata', 'b06-ia-corona': 'Corona', 'b07-ia-robot': 'Robot', 'b07-ia-gatita': 'Gatita', 'b07-ia-espiritu': 'Espíritu',
  'b07-ia-dragon': 'Antifaz dragón', 'b07-ia-buho': 'Búho', 'b12-araluz': 'AraLuz', 'b12-raton': 'Ratón',
  'b07-ia-cometa': 'Antifaz Capitán Ciempi',
  // Peinados
  'b05-harry': 'Harry', 'b05-hermione': 'Rizos', 'b05-super': 'Copete', 'b05-barbie': 'Pelo largo', 'b05-flequillo': 'Flequillo',
  'b05-coletas': 'Coletas', 'b05-trenza': 'Trenza', 'b05-monos': 'Moños', 'b05-cresta': 'Cresta', 'b05-ondas': 'Ondas', 'b05-mechon': 'Mechón',
  'b04-cicatriz': 'Rayo',
  // Lentes
  'b04-lector': 'Turquesa', 'b04-redondos': 'Redondos', 'b04-estrellas': 'Estrellas', 'b04-llamas': 'Llamas', 'b04-visor': 'Visor', 'b04-deportivo': 'Deportivos', 'b04-sol': 'De sol',
  // Bufanda, capas, calzado y estampados
  'bufanda-calco32': 'Bufanda', 'b08-ia-heroica': 'Capa de héroe', 'b08-ia-bosque': 'Capa de hojas',
  'b10-robot': 'Botas robot', 'b10-aventura': 'Botas explorador', 'b10-lluvia': 'Botas de lluvia', 'b10-mago': 'Zapatos de mago', 'b10-deportiva': 'Deportivas',
  'b10-cometa': 'Botas Capitán Ciempi', 'b11-cometa': 'Traje Capitán Ciempi', 'b09-cometa': 'Escudo Capitán Ciempi',
  liso: 'Liso', 'b11-robot': 'Armadura', 'b11-draco': 'Escamas', 'b11-mago': 'Estrellas', 'b11-pirata': 'Marinero', 'b11-araluz': 'Seda',
  // Conjuntos
  'b12-set-robot': 'Robot', 'b12-set-draco': 'Dragón', 'b12-set-cartografo': 'Explorador', 'b12-set-pirata': 'Pirata', 'b12-set-luna': 'Mago',
  'b12-set-noctilio': 'Espíritu', 'b12-set-araluz': 'AraLuz', 'b12-set-raton': 'Ratón', 'b12-set-reino': 'Realeza', 'b12-set-lluvia': 'Charcos',
  'b12-set-cometa': 'Capitán Ciempi',
  // Héroes de Ciempi (2.9.0): diez conjuntos de superhéroe propios.
  'b06-ia-coloso': 'Máscara Coloso', 'b11-coloso': 'Traje Coloso', 'b10-coloso': 'Botas Coloso', 'b09-coloso': 'Mochila de Fuerza', 'b12-set-coloso': 'Ciempi Coloso',
  'b07-ia-aracnido': 'Máscara Arácnida', 'b11-aracnido': 'Traje Arácnido', 'b10-aracnido': 'Botas Arácnidas', 'b09-aracnido': 'Mochila Telaraña', 'b12-set-aracnido': 'Ciempi Arácnido',
  'b06-ia-ilusionista': 'Corona Ilusionista', 'b11-ilusionista': 'Traje Ilusionista', 'b10-ilusionista': 'Botas Ilusionista', 'b08-ia-ilusionista': 'Capa de Ilusiones', 'b12-set-ilusionista': 'Ciempi Ilusionista',
  'b07-ia-solar': 'Antifaz Solar', 'b11-solar': 'Traje Solar', 'b10-solar': 'Botas Solares', 'b08-ia-solar': 'Capa Solar', 'b12-set-solar': 'Ciempi Solar',
  'b07-ia-nocturno': 'Máscara Nocturna', 'b11-nocturno': 'Traje Nocturno', 'b10-nocturno': 'Botas Nocturnas', 'b08-ia-nocturno': 'Capa Nocturna', 'b12-set-nocturno': 'Ciempi Nocturno',
  'b06-ia-bromista': 'Gorro Bromista', 'b11-bromista': 'Traje Bromista', 'b10-bromista': 'Botas Bromistas', 'b09-bromista': 'Mochila Sorpresa', 'b12-set-bromista': 'Ciempi Bromista',
  'b07-ia-esmeralda': 'Antifaz Esmeralda', 'b11-esmeralda': 'Traje Esmeralda', 'b10-esmeralda': 'Botas Esmeralda', 'b09-esmeralda': 'Mochila de Energía', 'b12-set-esmeralda': 'Ciempi Esmeralda',
  'b07-ia-sombra': 'Máscara Sombra', 'b11-sombra': 'Traje Araña Sombra', 'b10-sombra': 'Botas Sombra', 'b09-sombra': 'Mochila Sombra', 'b12-set-sombra': 'Ciempi Araña Sombra',
  'b07-ia-travieso': 'Máscara Traviesa', 'b11-travieso': 'Traje Travieso', 'b10-travieso': 'Botas Traviesas', 'b09-travieso': 'Mochila Aventurera', 'b12-set-travieso': 'Ciempi Travieso',
  'b07-ia-garra': 'Máscara Garra', 'b11-garra': 'Traje Garra Salvaje', 'b10-garra': 'Botas Garra', 'b09-garra': 'Mochila Garra', 'b12-set-garra': 'Ciempi Garra Salvaje',
  // Héroes de Ciempi, segunda serie (2.9.0).
  'b07-ia-trueno': 'Casco Trueno', 'b11-trueno': 'Traje Trueno', 'b10-trueno': 'Botas Trueno', 'b08-ia-trueno': 'Capa Trueno', 'b12-set-trueno': 'Ciempi Trueno',
  'b07-ia-relampago': 'Máscara Relámpago', 'b11-relampago': 'Traje Relámpago', 'b10-relampago': 'Botas Relámpago', 'b09-relampago': 'Mochila de Velocidad', 'b12-set-relampago': 'Ciempi Relámpago',
  'b07-ia-pantera': 'Máscara Pantera', 'b11-pantera': 'Traje Pantera', 'b10-pantera': 'Botas Pantera', 'b08-ia-pantera': 'Capa Pantera', 'b12-set-pantera': 'Ciempi Pantera',
  'b06-ia-mistico': 'Diadema Mística', 'b11-mistico': 'Traje Místico', 'b10-mistico': 'Botas Místicas', 'b08-ia-mistico': 'Capa Mística', 'b12-set-mistico': 'Ciempi Místico',
  'b06-ia-marino': 'Corona Marina', 'b11-marino': 'Traje Marino', 'b10-marino': 'Botas Marinas', 'b09-marino': 'Mochila Oceánica', 'b12-set-marino': 'Ciempi Marino',
  'b06-ia-kpopvioleta': 'Peinado Violeta', 'b11-kpopvioleta': 'Traje Violeta', 'b10-kpopvioleta': 'Botas Violeta', 'b09-kpopvioleta': 'Mochila Guardiana Violeta', 'b12-set-kpopvioleta': 'Ciempi Guerrera K-pop Violeta',
  'b06-ia-kpoprosa': 'Peinado Rosa', 'b11-kpoprosa': 'Traje Rosa', 'b10-kpoprosa': 'Botas Rosa', 'b09-kpoprosa': 'Mochila Estelar Rosa', 'b12-set-kpoprosa': 'Ciempi Guerrera K-pop Rosa',
  'b06-ia-kpopazul': 'Peinado Azul', 'b11-kpopazul': 'Traje Azul', 'b10-kpopazul': 'Botas Azules', 'b09-kpopazul': 'Mochila Musical Azul', 'b12-set-kpopazul': 'Ciempi Guerrera K-pop Azul',
  'b07-ia-unicornio': 'Cabeza Unicornio', 'b11-unicornio': 'Traje Unicornio', 'b10-unicornio': 'Botas Unicornio', 'b08-ia-unicornio': 'Cola Arcoíris', 'b12-set-unicornio': 'Ciempi Unicornio',
  'b06-ia-hada': 'Corona de Hada', 'b11-hada': 'Traje Hada', 'b10-hada': 'Botas Hada', 'b08-ia-hada': 'Alas Mágicas', 'b12-set-hada': 'Ciempi Hada Mágica',
  'b07-ia-sombrio': 'Cabeza Sombra', 'b11-sombrio': 'Traje Sombra', 'b10-sombrio': 'Botas de Sombra', 'b09-sombrio': 'Mochila de Sombras', 'b12-set-sombrio': 'Ciempi Sombra',
  'b06-ia-hielo': 'Corona de Hielo', 'b11-hielo': 'Traje de Hielo', 'b10-hielo': 'Botas de Cristal', 'b08-ia-hielo': 'Capa Invernal', 'b12-set-hielo': 'Ciempi Princesa de Hielo'
}
const NOMBRES_COLORES = {
  bronce: 'Bronce', barbie: 'Rosa', original: 'Roja', luna: 'Azul', aurora: 'Morada', oceano: 'Turquesa', 'oceano-coral': 'Coral', 'lavanda-magica': 'Lavanda',
}
const agregar = (categoria, id, nombre, precio) => items.push({ id: `${categoria}:${id}`, nombre: NOMBRES[id] ?? nombre, categoria, precio })

// Precios (propuesta económica del plan maestro, aprobada para 2.2): según el
// trabajo de cada pieza; gestos gratis (expresar emociones no cuesta monedas).
const PRECIOS = {
  // Gorros y máscaras
  'b06-ia-jockey': 0, 'b06-ia-dragon': 26, 'b06-ia-mago': 20, 'b06-ia-aventura': 22, 'b06-ia-pirata': 18, 'b06-ia-corona': 25,
  'b07-ia-robot': 32, 'b07-ia-gatita': 24, 'b07-ia-espiritu': 28, 'b07-ia-dragon': 28, 'b07-ia-buho': 24, 'b12-araluz': 30, 'b12-raton': 24,
  // Capitán Ciempi (ids «cometa» desde 2.8.2): como las piezas Robot.
  'b07-ia-cometa': 32,
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
  'b10-cometa': 24, 'b11-cometa': 32,
  // Héroes de Ciempi (2.9.0): como el Capitán Ciempi; las capas, como la Capa de héroe.
  'b06-ia-coloso': 32, 'b11-coloso': 32, 'b10-coloso': 24,
  'b07-ia-aracnido': 32, 'b11-aracnido': 32, 'b10-aracnido': 24,
  'b06-ia-ilusionista': 32, 'b11-ilusionista': 32, 'b10-ilusionista': 24, 'b08-ia-ilusionista': 28,
  'b07-ia-solar': 32, 'b11-solar': 32, 'b10-solar': 24, 'b08-ia-solar': 28,
  'b07-ia-nocturno': 32, 'b11-nocturno': 32, 'b10-nocturno': 24, 'b08-ia-nocturno': 28,
  'b06-ia-bromista': 32, 'b11-bromista': 32, 'b10-bromista': 24,
  'b07-ia-esmeralda': 32, 'b11-esmeralda': 32, 'b10-esmeralda': 24,
  'b07-ia-sombra': 32, 'b11-sombra': 32, 'b10-sombra': 24,
  'b07-ia-travieso': 32, 'b11-travieso': 32, 'b10-travieso': 24,
  'b07-ia-garra': 32, 'b11-garra': 32, 'b10-garra': 24,
  // Héroes de Ciempi, segunda serie (2.9.0).
  'b07-ia-trueno': 32, 'b11-trueno': 32, 'b10-trueno': 24, 'b08-ia-trueno': 28,
  'b07-ia-relampago': 32, 'b11-relampago': 32, 'b10-relampago': 24,
  'b07-ia-pantera': 32, 'b11-pantera': 32, 'b10-pantera': 24, 'b08-ia-pantera': 28,
  'b06-ia-mistico': 32, 'b11-mistico': 32, 'b10-mistico': 24, 'b08-ia-mistico': 28,
  'b06-ia-marino': 32, 'b11-marino': 32, 'b10-marino': 24,
  'b06-ia-kpopvioleta': 32, 'b11-kpopvioleta': 32, 'b10-kpopvioleta': 24,
  'b06-ia-kpoprosa': 32, 'b11-kpoprosa': 32, 'b10-kpoprosa': 24,
  'b06-ia-kpopazul': 32, 'b11-kpopazul': 32, 'b10-kpopazul': 24,
  'b07-ia-unicornio': 32, 'b11-unicornio': 32, 'b10-unicornio': 24, 'b08-ia-unicornio': 28,
  'b06-ia-hada': 32, 'b11-hada': 32, 'b10-hada': 24, 'b08-ia-hada': 28,
  'b07-ia-sombrio': 32, 'b11-sombrio': 32, 'b10-sombrio': 24,
  'b06-ia-hielo': 32, 'b11-hielo': 32, 'b10-hielo': 24, 'b08-ia-hielo': 28
}
const precio = (id) => {
  if (!(id in PRECIOS)) throw Error(`Falta el precio de ${id}`)
  return PRECIOS[id]
}
// Mochilas (2.5.2): vuelven a la tienda con la construcción v4.2 (en el flanco del segmento,
// con correas y sombra; ver src/ciempi/v2/arte/mochilas-v4.js), a su precio de 2.1. Los conjuntos
// siguen sin mochila, como desde 2.2.
const MOCHILAS = new Set(c.bags.map((b) => b.id))
const PRECIO_MOCHILA = { 'b09-robot': 25, 'b09-aventura': 20, 'b09-draco': 20, 'b09-mago': 20, 'b09-raton': 20, 'b09-cometa': 25,
  // Héroes de Ciempi (2.9.0), como el escudo del Capitán Ciempi.
  'b09-coloso': 25, 'b09-aracnido': 25, 'b09-bromista': 25, 'b09-esmeralda': 25, 'b09-sombra': 25, 'b09-travieso': 25, 'b09-garra': 25,
  'b09-relampago': 25, 'b09-marino': 25, 'b09-kpopvioleta': 25, 'b09-kpoprosa': 25, 'b09-kpopazul': 25, 'b09-sombrio': 25 }

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
for (const b of c.bags) agregar('espalda', b.id, b.nombre, PRECIO_MOCHILA[b.id])
agregar('pies', 'pies-zapatillas', 'Zapatillas', 0)
for (const f of c.footwear) agregar('pies', f.id, f.nombre, precio(f.id))
agregar('textura', 'liso', 'Sin estampado', 0)
for (const s of c.surfaces) agregar('textura', s.id, s.nombre, precio(s.id))

// Variantes de color (se desbloquean todas al comprar la pieza).
const variantes = {}
// El color «original» de unos lentes se llama así; el de la capa de héroe es rojo.
const nombreColor = (pieza, v) => (v.id === 'original' && pieza !== 'b08-ia-heroica' ? 'Original' : NOMBRES_COLORES[v.id] ?? v.nombre)
for (const [categoria, lista] of [['cara', c.lenses], ['espalda', c.capes]])
  for (const x of lista) if (x.variantes?.length > 1) variantes[`${categoria}:${x.id}`] = x.variantes.map((v) => ({ id: v.id, nombre: nombreColor(x.id, v) }))
variantes[`cuello:${c.scarf.id}`] = c.scarf.variantes.map((v) => ({ id: v.id, nombre: nombreColor(c.scarf.id, v) }))

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
  return { id: `conjunto:${s.id}`, nombre: NOMBRES[s.id] ?? s.nombre, pone, piezas, variantes: variantesConjunto }
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
