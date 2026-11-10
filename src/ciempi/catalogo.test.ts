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
  ahorroDe,
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

  it('precios aprobados: gestos gratis, piezas según su trabajo', () => {
    expect(CATALOGO.filter((i) => i.categoria === 'gesto').every((i) => i.precio === 0)).toBe(true)
    expect(item('pies:b10-lluvia').precio).toBe(12)
    expect(item('cuello:bufanda-calco32').precio).toBe(30)
    expect(item('cabeza:b07-ia-robot').precio).toBe(32)
    // 2.5.2: las mochilas vuelven a la tienda (a su precio de 2.1); los conjuntos siguen sin mochila.
    expect(CATALOGO.filter((i) => i.id.startsWith('espalda:b09')).map((i) => [i.id, i.precio])).toEqual([
      ['espalda:b09-robot', 25], ['espalda:b09-aventura', 20], ['espalda:b09-draco', 20], ['espalda:b09-mago', 20], ['espalda:b09-raton', 20],
      // 2.8.2: escudo de Capitán Cometa, al precio del propulsor Robot.
      ['espalda:b09-cometa', 25],
      // 2.9.0: mochilas de los Héroes de Ciempi, al precio del escudo.
      ['espalda:b09-coloso', 25], ['espalda:b09-aracnido', 25], ['espalda:b09-bromista', 25], ['espalda:b09-esmeralda', 25], ['espalda:b09-sombra', 25], ['espalda:b09-travieso', 25], ['espalda:b09-garra', 25], ['espalda:b09-relampago', 25],
    ])
    // 2.8.2: Capitán Cometa, con los precios del Robot (32 + 32 + 24 = 88 → 71) y sin el escudo.
    expect([item('cabeza:b07-ia-cometa').precio, item('textura:b11-cometa').precio, item('pies:b10-cometa').precio]).toEqual([32, 32, 24])
    expect(CONJUNTOS.find((c) => c.id === 'conjunto:b12-set-cometa')?.pone).toEqual(['cabeza:b07-ia-cometa', 'textura:b11-cometa', 'pies:b10-cometa'])
    expect(precioDe(item('conjunto:b12-set-cometa'), [])).toBe(71)
    expect(CONJUNTOS.every((c) => c.pone.every((id) => !id.startsWith('espalda:b09')))).toBe(true)
    // 2.9.0: Héroes de Ciempi. Sin capa: 32 + 32 + 24 = 88 → 71; con capa (28): 116 → 93.
    expect(precioDe(item('conjunto:b12-set-coloso'), [])).toBe(71)
    expect(precioDe(item('conjunto:b12-set-solar'), [])).toBe(93)
    expect(CONJUNTOS.find((c) => c.id === 'conjunto:b12-set-nocturno')?.pone).toEqual(['cabeza:b07-ia-nocturno', 'textura:b11-nocturno', 'pies:b10-nocturno', 'espalda:b08-ia-nocturno'])
  })

  it('un conjunto cuesta 20 % menos que sus piezas (redondeando hacia arriba) y no cobra lo que ya tiene', () => {
    const robot = item('conjunto:b12-set-robot')
    // Máscara 32 + armadura 32 + botas 24 = 88 → 71, ahorra 17.
    expect(precioDe(robot, [])).toBe(71)
    expect(ahorroDe(robot, [])).toBe(17)
    // Con la máscara: armadura 32 + botas 24 = 56 → 45.
    expect(precioDe(robot, ['cabeza:b07-ia-robot'])).toBe(45)
  })

  it('comprar un conjunto agrega el pack y sus piezas, y reparte lo cobrado entre ellas', () => {
    const r = comprarItem([], 200, 'conjunto:b12-set-robot')
    expect(r.inventario).toEqual(expect.arrayContaining(['conjunto:b12-set-robot', 'cabeza:b07-ia-robot', 'textura:b11-robot', 'pies:b10-robot']))
    expect(r.monedas).toBe(200 - 71)
    expect(r.lineas.reduce((s, l) => s + l.precio, 0)).toBe(71)
    expect(r.lineas.map((l) => l.id)).toEqual(['conjunto:b12-set-robot', 'cabeza:b07-ia-robot', 'textura:b11-robot', 'pies:b10-robot'])
    expect(() => comprarItem([], 3, 'cabeza:b06-ia-corona')).toThrow('Te faltan 22 monedas')
    expect(() => comprarItem([], 99, 'forma-estrella')).toThrow('Eso no está en la tienda')
  })

  it('no cobra más de lo que mostró la tienda', () => {
    expect(() => comprarItem([], 99, 'cabeza:b06-ia-corona', 20)).toThrow('El precio cambió: ahora cuesta 25 monedas')
    expect(comprarItem([], 99, 'cabeza:b06-ia-corona', 25).monedas).toBe(74)
  })

  it('los colores casi iguales se compran una vez para toda la familia', () => {
    const r = comprarItem([], 50, 'paleta:harry')
    expect(r.monedas).toBe(38)
    expect(loTiene(r.inventario, 'paleta:gryffindor')).toBe(true)
    expect(loTiene(r.inventario, 'paleta:hermione')).toBe(true)
    expect(loTiene(r.inventario, 'paleta:slytherin')).toBe(false)
  })

  it('elegir un color quita el estampado (que lo taparía)', () => {
    const conEstampado = ponerItem(APARIENCIA_INICIAL, item('textura:b11-draco'))
    expect(ponerItem(conEstampado, item('paleta:oceano')).textura).toBe('textura:liso')
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
