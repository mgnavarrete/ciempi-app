import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  APARIENCIA_INICIAL,
  CATALOGO,
  PARTES,
  ahorroDe,
  buscarItem,
  comprarItem,
  lleva,
  loTiene,
  normalizarApariencia,
  ponerItem,
  precioDe,
  puedePonerse,
  sinCriatura,
  soloDesbloqueo,
} from './catalogo'
import { ESPECIES, VARIANTES_CRIATURAS, especieDeItem, variantesDePaquete } from './criaturas'
import { aSeleccion } from './v2/seleccion'

const item = (id: string) => buscarItem(id)!
const SERP = 'especie:serpiente'
const DRAGON = 'especie:dragon'
const CUNCUNA = 'especie:cuncuna'

describe('criaturas: catálogo', () => {
  it('las 23 variantes con los ids del laboratorio, 4 especies y 4 paquetes', () => {
    const lab = readFileSync('docs/rediseno-ciempi/laboratorio-transformaciones/variantes.js', 'utf8')
    const ids = [...lab.matchAll(/\{ id: '([a-z]+-[a-z]+)', nombre: '([^']+)'/g)].map((m) => [m[1], m[2]])
    expect(ids).toHaveLength(23)
    expect(VARIANTES_CRIATURAS).toHaveLength(23)
    for (const [id, nombre] of ids) expect(buscarItem(`variante:${id}`)?.nombre, id).toBe(nombre)
    expect(ESPECIES.map((e) => e.item).sort()).toEqual(['especie:camaleon', 'especie:cuncuna', 'especie:dragon', 'especie:serpiente'])
    expect(CATALOGO.filter((i) => i.categoria === 'paquete').map((i) => i.id).sort()).toEqual(['paquete:camaleon', 'paquete:cuncuna', 'paquete:dragon', 'paquete:serpiente'])
    // Una base por especie, y es la que dice el plan.
    expect(VARIANTES_CRIATURAS.filter((v) => v.base).map((v) => v.id).sort()).toEqual(['camaleon-lima', 'cuncuna-clasica', 'dragon-clasico', 'serpiente-caramelo'])
    // Las criaturas no son partes del personaje.
    for (const c of ['especie', 'variante', 'paquete']) expect((PARTES as readonly string[]).includes(c)).toBe(false)
  })

  it('precios del plan (economía 2.4.1)', () => {
    expect(precioDe(item(SERP), [])).toBe(60)
    expect(precioDe(item('especie:camaleon'), [])).toBe(70)
    expect(precioDe(item(DRAGON), [])).toBe(80)
    expect(item('variante:cuncuna-frutilla').precio).toBe(20)
    expect(item('variante:dragon-fuego').precio).toBe(24)
    // Con la especie: solo la variante. Sin ella: variante + especie.
    expect(precioDe(item('variante:dragon-fuego'), [DRAGON])).toBe(24)
    expect(precioDe(item('variante:dragon-fuego'), [])).toBe(104)
    expect(precioDe(item('variante:serpiente-noche'), [])).toBe(84)
    // La base: la especie (o nada si ya la tiene).
    expect(precioDe(item('variante:dragon-clasico'), [])).toBe(80)
  })

  it('paquetes: 80 % de lo que falta (hacia arriba) + la especie si falta; ejemplos del plan', () => {
    expect(precioDe(item('paquete:serpiente'), [SERP])).toBe(58)
    expect(precioDe(item('paquete:camaleon'), ['especie:camaleon'])).toBe(77)
    expect(precioDe(item('paquete:cuncuna'), [CUNCUNA])).toBe(96)
    expect(precioDe(item('paquete:dragon'), [DRAGON])).toBe(116)
    expect(precioDe(item('paquete:serpiente'), [])).toBe(118)
    expect(ahorroDe(item('paquete:serpiente'), [SERP])).toBe(72 - 58)
    // Parcial: ya tiene una variante → no se cobra de nuevo.
    expect(precioDe(item('paquete:serpiente'), [SERP, 'variante:serpiente-noche'])).toBe(Math.ceil(48 * 0.8))
  })

  it('loTiene: la base viene con la especie; la Cuncuna (0 monedas) no es gratis', () => {
    expect(loTiene([], 'variante:dragon-clasico')).toBe(false)
    expect(loTiene([DRAGON], 'variante:dragon-clasico')).toBe(true)
    expect(loTiene([DRAGON], 'variante:dragon-fuego')).toBe(false)
    expect(loTiene([], CUNCUNA)).toBe(false)
    expect(loTiene([], 'variante:cuncuna-clasica')).toBe(false)
    expect(loTiene([CUNCUNA], 'variante:cuncuna-clasica')).toBe(true)
    expect(loTiene([SERP, ...variantesDePaquete('serpiente')], 'paquete:serpiente')).toBe(true)
    expect(loTiene(variantesDePaquete('serpiente'), 'paquete:serpiente')).toBe(false)
  })

  it('comprar una variante sin la especie agrega las dos, en dos líneas', () => {
    const r = comprarItem([], 200, 'variante:dragon-fuego')
    expect(r.precio).toBe(104)
    expect(r.monedas).toBe(96)
    expect(r.inventario.sort()).toEqual([DRAGON, 'variante:dragon-fuego'])
    expect(r.lineas).toEqual([
      { id: DRAGON, precio: 80 },
      { id: 'variante:dragon-fuego', precio: 24 },
    ])
    // Con la especie: solo la variante.
    const r2 = comprarItem([DRAGON], 30, 'variante:dragon-hielo')
    expect(r2).toMatchObject({ precio: 24, monedas: 6, lineas: [{ id: 'variante:dragon-hielo', precio: 24 }] })
    // La base nunca se guarda en el inventario.
    const r3 = comprarItem([], 80, 'variante:dragon-clasico')
    expect(r3.inventario).toEqual([DRAGON])
    expect(comprarItem([DRAGON], 0, 'variante:dragon-clasico').precio).toBe(0)
  })

  it('una especie desbloqueada nunca se vuelve a pagar; ya tenerlo no cobra', () => {
    expect(comprarItem([DRAGON], 100, DRAGON)).toMatchObject({ precio: 0, monedas: 100, lineas: [] })
    expect(comprarItem([DRAGON, 'variante:dragon-fuego'], 100, 'variante:dragon-fuego').precio).toBe(0)
  })

  it('paquete: no cobra dos veces y reparte lo cobrado en líneas exactas', () => {
    const inv = [SERP, 'variante:serpiente-noche']
    const r = comprarItem(inv, 100, 'paquete:serpiente')
    expect(r.precio).toBe(39)
    expect(r.inventario.filter((x) => x === 'variante:serpiente-noche')).toHaveLength(1)
    expect(loTiene(r.inventario, 'paquete:serpiente')).toBe(true)
    expect(r.lineas[0]).toEqual({ id: 'paquete:serpiente', precio: 0 })
    expect(r.lineas.reduce((s, l) => s + l.precio, 0)).toBe(39)
    expect(r.lineas.map((l) => l.id)).not.toContain('variante:serpiente-noche')
    // Sin la especie: la especie entera en su línea, más el 80 % de las variantes.
    const s = comprarItem([], 200, 'paquete:dragon')
    expect(s.precio).toBe(80 + 116)
    expect(s.lineas.find((l) => l.id === DRAGON)?.precio).toBe(80)
    expect(s.lineas.reduce((t, l) => t + l.precio, 0)).toBe(196)
    expect(s.inventario).not.toContain('variante:dragon-clasico')
    expect(s.inventario).not.toContain('paquete:dragon')
  })

  it('2.5.2: la Cuncuna se compra con monedas (40); quien ya la tiene no la vuelve a pagar', () => {
    expect(soloDesbloqueo('variante:cuncuna-dorada')).toBe(false)
    expect(comprarItem([], 40, CUNCUNA)).toMatchObject({ precio: 40, monedas: 0, inventario: [CUNCUNA] })
    expect(comprarItem([], 60, 'variante:cuncuna-dorada')).toMatchObject({ precio: 60, monedas: 0, inventario: [CUNCUNA, 'variante:cuncuna-dorada'] })
    expect(comprarItem([CUNCUNA], 5, CUNCUNA)).toMatchObject({ precio: 0, monedas: 5 })
    expect(comprarItem([CUNCUNA], 20, 'variante:cuncuna-dorada')).toMatchObject({ precio: 20, monedas: 0 })
  })

  it('precioVisto menor que el precio: no cobra; sin saldo, tampoco', () => {
    expect(() => comprarItem([], 500, 'variante:dragon-fuego', 24)).toThrow('El precio cambió')
    expect(() => comprarItem([], 100, 'variante:dragon-fuego')).toThrow('Te faltan 4 monedas')
  })
})

describe('criaturas: apariencia', () => {
  it('normalizarApariencia: criatura válida o null (lo guardado antes de 2.5 es Ciempi)', () => {
    expect(normalizarApariencia(null).criatura).toBeNull()
    expect(normalizarApariencia({ criatura: 'variante:dragon-fuego' }).criatura).toBe('variante:dragon-fuego')
    expect(normalizarApariencia({ criatura: 'especie:dragon' } as never).criatura).toBeNull()
    expect(normalizarApariencia({ criatura: 'variante:no-existe' }).criatura).toBeNull()
    expect(normalizarApariencia({ criatura: 3 } as never).criatura).toBeNull()
  })

  it('ponerItem y lleva', () => {
    const a = ponerItem(APARIENCIA_INICIAL, item('variante:camaleon-pastel'))
    expect(a.criatura).toBe('variante:camaleon-pastel')
    // Lo demás puesto se conserva.
    expect(PARTES.every((p) => a[p] === APARIENCIA_INICIAL[p])).toBe(true)
    expect(lleva(a, item('variante:camaleon-pastel'))).toBe(true)
    expect(lleva(a, item('especie:camaleon'))).toBe(true)
    expect(lleva(a, item(DRAGON))).toBe(false)
    expect(ponerItem(APARIENCIA_INICIAL, item(SERP)).criatura).toBe('variante:serpiente-caramelo')
    expect(ponerItem(a, item('paquete:dragon'))).toBe(a)
    expect(sinCriatura(a).criatura).toBeNull()
    // Un conjunto viste a la criatura sin quitarla.
    expect(ponerItem(a, item('conjunto:b12-set-robot')).criatura).toBe('variante:camaleon-pastel')
  })

  it('puedePonerse exige tener la criatura', () => {
    const a = { ...APARIENCIA_INICIAL, criatura: 'variante:dragon-fuego' }
    expect(puedePonerse(a, [DRAGON])).toBe(false)
    expect(puedePonerse(a, [DRAGON, 'variante:dragon-fuego'])).toBe(true)
    expect(puedePonerse({ ...a, criatura: 'variante:dragon-clasico' }, [DRAGON])).toBe(true)
    expect(puedePonerse(APARIENCIA_INICIAL, [])).toBe(true)
  })

  it('aSeleccion: con Ciempi no agrega claves; con criatura, criatura/varianteEspecie/especie', () => {
    const sin = aSeleccion(APARIENCIA_INICIAL)
    expect('criatura' in sin || 'varianteEspecie' in sin || 'especie' in sin).toBe(false)
    const con = aSeleccion({ ...APARIENCIA_INICIAL, criatura: 'variante:serpiente-hoja' })
    expect(con).toMatchObject({ criatura: 'variante:serpiente-hoja', varianteEspecie: 'serpiente-hoja', especie: 'serpiente' })
    // El resto, igual que sin criatura.
    const { criatura, varianteEspecie, especie, ...resto } = con
    expect(resto).toEqual(sin)
    expect([criatura, varianteEspecie, especie].every(Boolean)).toBe(true)
  })

  it('especieDeItem reconoce los tres tipos de id', () => {
    expect(especieDeItem('variante:dragon-fuego')?.id).toBe('dragon')
    expect(especieDeItem('paquete:cuncuna')?.id).toBe('cuncuna')
    expect(especieDeItem(SERP)?.id).toBe('serpiente')
    expect(especieDeItem('cabeza:b06-ia-mago')).toBeUndefined()
  })
})
