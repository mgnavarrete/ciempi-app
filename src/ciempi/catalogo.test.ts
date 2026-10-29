import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  APARIENCIA_INICIAL,
  CATALOGO,
  CATEGORIAS,
  CONJUNTOS,
  SIN_GORRO,
  SIN_PEINADO,
  buscarItem,
  comprarItem,
  diseno,
  lleva,
  loTiene,
  normalizarApariencia,
  ponerItem,
  precioDe,
} from './catalogo'
import { esCompraAntigua } from './tiendaAntigua'

const item = (id: string) => buscarItem(id)!

describe('tienda de Ciempi', () => {
  it('ids únicos y cada categoría del personaje tiene algo gratis', () => {
    expect(new Set(CATALOGO.map((i) => i.id)).size).toBe(CATALOGO.length)
    for (const c of CATEGORIAS.filter((c) => c.id !== 'conjunto')) expect(CATALOGO.some((i) => i.categoria === c.id && i.precio === 0), c.id).toBe(true)
  })

  it('solo vende diseños nuevos que existen en el vestuario del juego', () => {
    const v2 = JSON.parse(readFileSync('public/ciempi-v2/catalogo.json', 'utf8'))
    const ids = new Set<string>(
      ['facial', 'lenses', 'hair', 'details', 'hats', 'masks', 'capes', 'bags', 'footwear', 'surfaces'].flatMap((k) => v2[k].map((x: { id: string }) => x.id)),
    )
    ids.add(v2.scarf.id)
    const libres = ['cabeza-nada', 'pelo-nada', 'detalle-nada', 'cara-nada', 'cuello-nada', 'espalda-nada', 'pies-zapatillas', 'liso']
    for (const i of CATALOGO.filter((x) => ['gesto', 'cabeza', 'pelo', 'detalle', 'cara', 'cuello', 'espalda', 'pies', 'textura'].includes(x.categoria)))
      expect(ids.has(diseno(i.id)) || libres.includes(diseno(i.id)), i.id).toBe(true)
    // Nada de la tienda anterior (formas, diseños, gorros viejos…).
    expect(CATALOGO.filter((i) => esCompraAntigua(i.id))).toEqual([])
  })

  it('un conjunto cuesta 30 % menos que sus piezas y no cobra lo que ya tiene', () => {
    const robot = item('conjunto:b12-set-robot')
    const suelto = CONJUNTOS.find((c) => c.id === robot.id)!.piezas.reduce((s, p) => s + item(p).precio, 0)
    expect(precioDe(robot, [])).toBe(Math.round(suelto * 0.7))
    expect(precioDe(robot, ['cabeza:b07-ia-robot'])).toBe(Math.round((suelto - item('cabeza:b07-ia-robot').precio) * 0.7))
  })

  it('comprar un conjunto agrega el pack y sus piezas, y descuenta su precio', () => {
    const r = comprarItem([], 200, 'conjunto:b12-set-robot')
    expect(r.inventario).toEqual(expect.arrayContaining(['conjunto:b12-set-robot', 'cabeza:b07-ia-robot', 'textura:b11-robot', 'pies:b10-robot', 'espalda:b09-robot']))
    expect(r.monedas).toBe(200 - precioDe(item('conjunto:b12-set-robot'), []))
    expect(() => comprarItem([], 3, 'cabeza:b06-ia-corona')).toThrow('Te faltan 22 monedas')
    expect(() => comprarItem([], 99, 'forma-estrella')).toThrow('Eso no está en la tienda')
  })

  it('gorro y peinado se excluyen; cambiar de pieza vuelve a su color original', () => {
    const conPelo = ponerItem(APARIENCIA_INICIAL, item('pelo:b05-harry'))
    expect(conPelo.cabeza).toBe(SIN_GORRO)
    expect(ponerItem(conPelo, item('cabeza:b06-ia-mago')).pelo).toBe(SIN_PEINADO)
    const capa = ponerItem({ ...APARIENCIA_INICIAL, variantes: { espalda: 'luna' } }, item('espalda:b08-ia-bosque'))
    expect(capa.variantes.espalda).toBeUndefined()
  })

  it('un conjunto se pone entero, con sus colores', () => {
    const luna = ponerItem(APARIENCIA_INICIAL, item('conjunto:b12-set-luna'))
    expect(luna.cabeza).toBe('cabeza:b06-ia-mago')
    expect(luna.variantes.cuello).toBe('ravenclaw')
    expect(lleva(luna, item('conjunto:b12-set-luna'))).toBe(true)
    // Reemplaza todo el personaje (no queda la bufanda de antes), pero no el fondo.
    const robot = ponerItem({ ...luna, fondo: 'fondo-mar' }, item('conjunto:b12-set-robot'))
    expect(robot.cuello).toBe(APARIENCIA_INICIAL.cuello)
    expect(robot.fondo).toBe('fondo-mar')
  })
})

describe('normalizarApariencia', () => {
  it('lo del Ciempi clásico vuelve al inicial; fondo, comida y nombre se conservan', () => {
    const vieja = { nombre: '  Rayito  ', paleta: 'paleta-sol', forma: 'forma-estrella', cabeza: 'cabeza-unicornio', fondo: 'fondo-mar', comida: 'comida-dona', presentado: true }
    const n = normalizarApariencia(vieja as never)
    expect(n).toEqual({ ...APARIENCIA_INICIAL, nombre: 'Rayito', fondo: 'fondo-mar', comida: 'comida-dona', presentado: true })
    expect('forma' in n).toBe(false)
  })

  it('descarta variantes que no son de la pieza puesta', () => {
    const n = normalizarApariencia({ espalda: 'espalda:b08-ia-heroica', variantes: { espalda: 'luna', cuello: 'ravenclaw' } })
    expect(n.variantes).toEqual({ espalda: 'luna' })
  })

  it('un nombre vacío vuelve a "Ciempi"', () => {
    expect(normalizarApariencia({ nombre: '   ' }).nombre).toBe('Ciempi')
  })
})

describe('loTiene', () => {
  it('lo gratis siempre; lo pagado solo si está en el inventario', () => {
    expect(loTiene([], 'cabeza:b06-ia-jockey')).toBe(true)
    expect(loTiene([], 'cabeza:b06-ia-corona')).toBe(false)
    expect(loTiene(['cabeza:b06-ia-corona'], 'cabeza:b06-ia-corona')).toBe(true)
    expect(loTiene([], 'cabeza-corona')).toBe(false)
  })
})
