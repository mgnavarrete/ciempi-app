import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { APARIENCIA_INICIAL, CATALOGO, CONJUNTOS, SIN_GORRO, buscarItem, comprarItem, loTiene, precioDe } from './catalogo'
import { MASCARAS_COMPLETAS } from './v2/especie'
import {
  CATEGORIAS_DE_CARA,
  TAPAN_LA_CARA,
  aComprar,
  conCaraALaVista,
  despuesDeComprar,
  probarCriatura,
  probarTarjeta,
  sinPrueba,
  tarjetasDe,
  type Prueba,
} from './pruebaTienda'

const guardado = { ...APARIENCIA_INICIAL, cuello: 'cuello:bufanda-calco32' }
const inventario = ['cabeza:b06-ia-jockey', 'cuello:bufanda-calco32']
const nueva = (categoria: Parameters<typeof tarjetasDe>[0]) => tarjetasDe(categoria).find((t) => !loTiene(inventario, t.item.id) && t.item.precio > 0)!

describe('tienda: una compra a la vez', () => {
  const gorro = nueva('cabeza')
  const capa = nueva('espalda')
  const zapato = nueva('pies')

  it('probar otra cosa descarta la anterior: queda un solo producto, sobre lo guardado', () => {
    let p: Prueba = probarTarjeta(guardado, gorro)
    expect(p.apariencia.cabeza).toBe(gorro.item.id)
    p = probarTarjeta(guardado, capa)
    expect(p.apariencia.espalda).toBe(capa.item.id)
    // El gorro ya no está: vuelve el que tiene guardado.
    expect(p.apariencia.cabeza).toBe(guardado.cabeza)
    // Lo que ya tenía puesto y guardado sigue ahí.
    expect(p.apariencia.cuello).toBe('cuello:bufanda-calco32')
  })

  it('al cambiar de sección o categoría se descarta la prueba (vuelve a lo guardado)', () => {
    const p = sinPrueba(guardado)
    expect(p.apariencia).toBe(guardado)
    expect(aComprar(p, inventario)).toBeNull()
  })

  it('el total y la compra son de un solo producto', () => {
    const p = probarTarjeta(guardado, zapato)
    const compra = aComprar(p, inventario)!
    expect(compra.item.id).toBe(zapato.item.id)
    expect(compra.precio).toBe(precioDe(zapato.item, inventario))
    // Lo que cobra el servidor es lo mismo que se mostró.
    expect(comprarItem(inventario, 999, zapato.item.id, compra.precio).precio).toBe(compra.precio)
    // Tras probar gorro y luego zapato, solo se compra el zapato.
    const otra = aComprar(probarTarjeta(probarTarjeta(guardado, gorro).apariencia, zapato), inventario)
    expect(otra?.item.id).toBe(zapato.item.id)
  })

  it('al comprar se pone lo comprado (con su color) sobre lo guardado, sin nada más', () => {
    // Una capa en un color que no es el primero: se compra la capa y queda con ese color.
    const enColor = tarjetasDe('espalda').find((t) => t.color && !loTiene(inventario, t.item.id) && tarjetasDe('espalda').find((x) => x.item.id === t.item.id)!.color!.id !== t.color.id)!
    expect(enColor).toBeTruthy()
    const conColor = despuesDeComprar(guardado, probarTarjeta(guardado, enColor))
    expect(conColor.espalda).toBe(enColor.item.id)
    expect(conColor.variantes.espalda).toBe(enColor.color!.id)
    const puesta = despuesDeComprar(guardado, probarTarjeta(guardado, capa))
    expect(puesta).toMatchObject({ espalda: capa.item.id, cabeza: guardado.cabeza, cuello: guardado.cuello })
  })

  it('un conjunto se prueba y se compra como un solo producto (el pack)', () => {
    const c = buscarItem(CONJUNTOS[0].id)!
    const compra = aComprar(probarTarjeta(guardado, { clave: c.id, item: c }), inventario)
    expect(compra).toEqual({ item: c, precio: precioDe(c, inventario) })
  })

  it('lo que ya es suyo no va a la barra de compra', () => {
    const jockey = buscarItem('cabeza:b06-ia-jockey')!
    expect(aComprar(probarTarjeta(guardado, { clave: jockey.id, item: jockey }), inventario)).toBeNull()
  })

  it('probar una criatura parte de lo guardado', () => {
    const p = probarCriatura({ ...guardado, criatura: null }, 'variante:dragon-fuego')
    expect(p.apariencia).toMatchObject({ criatura: 'variante:dragon-fuego', cabeza: guardado.cabeza })
    expect(p.item).toBeNull()
  })
})

describe('la cara a la vista al probar ojos, gestos, lentes y detalles', () => {
  const catalogo = JSON.parse(readFileSync(new URL('../../public/ciempi-v2/catalogo.json', import.meta.url), 'utf8'))
  const mascaras = catalogo.masks as { id: string; mask?: boolean; ocultaRostro?: boolean }[]

  it('las piezas que tapan la cara son las máscaras del catálogo del juego (incluye las de `ocultaRostro`)', () => {
    expect([...TAPAN_LA_CARA].sort()).toEqual(mascaras.map((m) => `cabeza:${m.id}`).sort())
    for (const m of mascaras.filter((x) => x.ocultaRostro)) expect(TAPAN_LA_CARA).toContain(`cabeza:${m.id}`)
    for (const m of MASCARAS_COMPLETAS) expect(TAPAN_LA_CARA).toContain(m)
    // Ningún gorro tapa la cara.
    for (const h of catalogo.hats as { id: string; ocultaRostro?: boolean }[]) expect(h.ocultaRostro).not.toBe(true)
    for (const id of TAPAN_LA_CARA) expect(CATALOGO.some((i) => i.id === id)).toBe(true)
  })

  it('en esas categorías la vista previa quita la máscara; en las demás, no; lo guardado no cambia', () => {
    const conMascara = { ...guardado, cabeza: 'cabeza:b07-ia-robot', ojos: 'ojos:oscuro' }
    const copia = structuredClone(conMascara)
    for (const c of CATEGORIAS_DE_CARA) expect(conCaraALaVista(conMascara, c)).toMatchObject({ cabeza: SIN_GORRO, ojos: 'ojos:oscuro', cuello: guardado.cuello })
    expect(conCaraALaVista(conMascara, 'cabeza')).toBe(conMascara)
    expect(conCaraALaVista(conMascara, 'espalda')).toBe(conMascara)
    expect(conCaraALaVista({ ...conMascara, cabeza: 'cabeza:b07-ia-buho' }, 'ojos').cabeza).toBe(SIN_GORRO)
    // Un gorro que deja la cara a la vista se queda.
    expect(conCaraALaVista(guardado, 'ojos')).toBe(guardado)
    expect(conMascara).toEqual(copia)
  })
})
