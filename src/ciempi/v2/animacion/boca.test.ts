import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { tapaBoca } from './boca'

// El catálogo del juego (el mismo que carga `load()` desde /ciempi-v2/catalogo.json).
const catalogo = JSON.parse(readFileSync(new URL('../../../../public/ciempi-v2/catalogo.json', import.meta.url), 'utf8'))
const cabezas = [...catalogo.hats, ...catalogo.masks] as { id: string; ocultaRostro?: boolean }[]

describe('tapaBoca: máscaras que tapan la boca, según los metadatos del catálogo', () => {
  it('coincide con `ocultaRostro` en todas las piezas de cabeza (no hay lista a mano)', () => {
    for (const p of cabezas) expect(tapaBoca(catalogo, p.id), p.id).toBe(p.ocultaRostro === true)
  })

  it('sin pieza, con una desconocida o sin catálogo no tapa', () => {
    expect(tapaBoca(catalogo, 'cabeza-nada')).toBe(false)
    expect(tapaBoca(catalogo, 'no-existe')).toBe(false)
    expect(tapaBoca(null, 'b07-ia-robot')).toBe(false)
    expect(tapaBoca(catalogo, undefined)).toBe(false)
  })

  it('registro: hoy tapan la boca Robot Lumen, Espíritu y AraLuz (si cambia el catálogo, revisar E08)', () => {
    expect(cabezas.filter((p) => p.ocultaRostro).map((p) => p.id).sort()).toEqual(['b07-ia-espiritu', 'b07-ia-robot', 'b12-araluz'])
  })
})
