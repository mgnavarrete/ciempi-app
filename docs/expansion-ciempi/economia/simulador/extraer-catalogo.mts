/**
 * Extrae el catálogo y los precios REALES de la tienda (src/ciempi/catalogo.ts)
 * para el simulador. No cambia nada.
 *   node --experimental-strip-types docs/expansion-ciempi/economia/simulador/extraer-catalogo.mts
 * Escribe docs/expansion-ciempi/economia/simulador/datos/catalogo.json
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { CATALOGO, CONJUNTOS, piezasDe } from '../../../../src/ciempi/catalogo.ts'

const items = CATALOGO.map((i) => ({ id: i.id, nombre: i.nombre, categoria: i.categoria, precio: i.precio }))
const conjuntos = CONJUNTOS.map((c) => {
  const piezas = piezasDe(c.id)
  const sueltas = piezas.reduce((s, p) => s + (CATALOGO.find((x) => x.id === p)?.precio ?? 0), 0)
  return { id: c.id, nombre: c.nombre, piezas, sueltas, precio: CATALOGO.find((x) => x.id === c.id)!.precio }
})
const pagables = items.filter((i) => i.precio > 0 && i.categoria !== 'conjunto')
const porCategoria: Record<string, { n: number; min: number; max: number; suma: number }> = {}
for (const i of pagables) {
  const c = (porCategoria[i.categoria] ??= { n: 0, min: Infinity, max: 0, suma: 0 })
  c.n++
  c.min = Math.min(c.min, i.precio)
  c.max = Math.max(c.max, i.precio)
  c.suma += i.precio
}
const resumen = {
  piezasDePago: pagables.length,
  gratis: items.filter((i) => i.precio === 0 && i.categoria !== 'conjunto').length,
  totalTodoSuelto: pagables.reduce((s, i) => s + i.precio, 0),
  porCategoria,
}
mkdirSync(new URL('./datos/', import.meta.url), { recursive: true })
writeFileSync(new URL('./datos/catalogo.json', import.meta.url), JSON.stringify({ resumen, conjuntos, items }, null, 1) + '\n')
console.log(JSON.stringify(resumen, null, 1))
for (const c of conjuntos) console.log(c.nombre.padEnd(14), 'piezas', c.piezas.length, 'sueltas', c.sueltas, 'conjunto', c.precio)
