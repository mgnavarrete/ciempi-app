import { expect, it } from 'vitest'
import { crearRepositoriosLocales } from '../datos/localStorage/repositoriosLocales'
import { APARIENCIA_INICIAL } from './catalogo'

it('sin conexión: lo comprado en la tienda anterior se devuelve en monedas; fondos y comida se quedan', async () => {
  const datos = new Map<string, string>()
  const almacen = { getItem: (k: string) => datos.get(k) ?? null, setItem: (k: string, v: string) => void datos.set(k, v) }
  const p = await crearRepositoriosLocales(almacen).perfiles.crear({ apodo: 'Tomi', icono: '🐛' })
  // Un niño de antes de 2.1: compró corona (25), estrellas (20) y Sol (8), además de fondo y comida.
  const antes = { ...p, monedas: 7, inventario: ['cabeza-corona', 'forma-estrella', 'paleta-sol', 'fondo-mar', 'comida-dona'], ciempi: { nombre: 'Rayito', cabeza: 'cabeza-corona', forma: 'forma-estrella', fondo: 'fondo-mar', presentado: true } }
  datos.set('ciempi:v1:perfiles', JSON.stringify([antes]))
  const aplicadas = JSON.parse(datos.get('ciempi:v1:migraciones')!) as string[]
  datos.set('ciempi:v1:migraciones', JSON.stringify(aplicadas.filter((m) => m !== '2026-10-tienda-nueva')))

  const despues = await crearRepositoriosLocales(almacen).perfiles.obtener(p.id)
  expect(despues?.monedas).toBe(7 + 25 + 20 + 8)
  expect(despues?.inventario).toEqual(['fondo-mar', 'comida-dona'])
  expect(despues?.ciempi).toEqual({ ...APARIENCIA_INICIAL, nombre: 'Rayito', fondo: 'fondo-mar', presentado: true })
  // Se aplica una sola vez.
  expect((await crearRepositoriosLocales(almacen).perfiles.obtener(p.id))?.monedas).toBe(60)
})
