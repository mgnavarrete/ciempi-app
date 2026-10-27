import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { APARIENCIA_INICIAL, CATALOGO, CATEGORIAS, PALETAS, loTiene, normalizarApariencia, variante } from './catalogo'

describe('catálogo de Ciempi', () => {
  it('los ids son únicos y cada categoría tiene al menos una cosa gratis', () => {
    expect(new Set(CATALOGO.map((i) => i.id)).size).toBe(CATALOGO.length)
    for (const c of CATEGORIAS) {
      expect(CATALOGO.some((i) => i.categoria === c.id && i.precio === 0)).toBe(true)
    }
  })

  it('cada color del catálogo tiene su paleta', () => {
    for (const i of CATALOGO.filter((x) => x.categoria === 'paleta')) expect(PALETAS[variante(i.id)]).toBeDefined()
  })

  it('los precios coinciden con la tabla items_tienda de Supabase', () => {
    const dir = 'supabase/migrations'
    const sql = readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => readFileSync(`${dir}/${f}`, 'utf8'))
      .join('\n')
    const enSql = new Map([...sql.matchAll(/\('([a-z0-9-]+)', '[^']*', '([a-z]+)', (\d+)\)/g)].map((m) => [m[1], { categoria: m[2], precio: Number(m[3]) }]))
    // Cambios de precio posteriores: update … set precio = N where id in ('a', 'b').
    for (const m of sql.matchAll(/set precio = (\d+)\s+where id in \(([^)]*)\)/g)) {
      for (const id of m[2].match(/[a-z0-9-]+/g) ?? []) enSql.set(id, { ...enSql.get(id)!, precio: Number(m[1]) })
    }
    // Los que salieron de la tienda quedan inactivos en la base y fuera del catálogo.
    for (const m of sql.matchAll(/set activo = false where id in \(([^)]*)\)/g)) {
      for (const id of m[1].match(/[a-z0-9-]+/g) ?? []) enSql.delete(id)
    }
    expect(enSql.size).toBe(CATALOGO.length)
    for (const i of CATALOGO) expect(enSql.get(i.id)).toEqual({ categoria: i.categoria, precio: i.precio })
  })
})

describe('normalizarApariencia', () => {
  it('completa lo que falta y descarta ids desconocidos o de otra categoría', () => {
    expect(normalizarApariencia(null)).toEqual(APARIENCIA_INICIAL)
    expect(normalizarApariencia({ nombre: '  Rayito  ', cabeza: 'cabeza-corona', pies: 'cabeza-mago', fondo: 'fondo-inventado' })).toEqual({
      ...APARIENCIA_INICIAL,
      nombre: 'Rayito',
      cabeza: 'cabeza-corona',
    })
  })

  it('un nombre vacío vuelve a "Ciempi"', () => {
    expect(normalizarApariencia({ nombre: '   ' }).nombre).toBe('Ciempi')
  })
})

describe('loTiene', () => {
  it('lo gratis siempre; lo pagado solo si está en el inventario', () => {
    expect(loTiene([], 'cabeza-jockey')).toBe(true)
    expect(loTiene([], 'cabeza-corona')).toBe(false)
    expect(loTiene(['cabeza-corona'], 'cabeza-corona')).toBe(true)
    expect(loTiene([], 'no-existe')).toBe(false)
  })
})
