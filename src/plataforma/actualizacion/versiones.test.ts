import { describe, expect, it, vi } from 'vitest'
import {
  canalDeCompilacion,
  compararIdentidades,
  compararVersiones,
  decidir,
  elegirPendiente,
  identidadDePaquete,
  leerManifiesto,
  obtenerManifiesto,
  urlDelManifiesto,
  type Manifiesto,
} from './versiones'

const URL_M = 'https://ciempi.minttu.cl/ota/ultima.json'
const SHA = 'a'.repeat(64)

const json = (cambios: Record<string, unknown> = {}) => ({
  version: '2.7.1',
  compilacion: '20261110120000',
  url: 'ciempi-web-2.7.1-20261110120000.zip',
  sha256: SHA,
  checksum: SHA,
  nativaMinima: '2.7.0',
  apk: { version: '2.7.0', url: '../descargas/CIEMPI-2.7.0.apk' },
  ...cambios,
})

const manifiesto = (cambios: Record<string, unknown> = {}) => leerManifiesto(json(cambios), URL_M) as Manifiesto
const WEB = { version: '2.7.0', compilacion: '20261104120000' }

describe('compararVersiones', () => {
  it('compara mayor, menor y parche como números', () => {
    expect(compararVersiones('2.7.0', '2.7.0')).toBe(0)
    expect(compararVersiones('2.10.0', '2.9.9')).toBeGreaterThan(0)
    expect(compararVersiones('2.7.0', '2.7.1')).toBeLessThan(0)
    expect(compararVersiones('3.0.0', '2.99.99')).toBeGreaterThan(0)
    expect(compararVersiones('2.7', '2.7.0')).toBe(0)
    expect(compararVersiones('2.7.0-20261104120000', '2.7.0')).toBe(0)
  })

  it('con la misma versión manda el sello de compilación', () => {
    expect(compararIdentidades({ version: '2.7.0', compilacion: '20261105000000' }, WEB)).toBeGreaterThan(0)
    expect(compararIdentidades({ version: '2.7.0', compilacion: '20261104120000' }, WEB)).toBe(0)
    expect(compararIdentidades({ version: '2.6.9', compilacion: '20991231000000' }, WEB)).toBeLessThan(0)
  })

  it('lee el nombre de un paquete', () => {
    expect(identidadDePaquete('2.7.1-20261110120000')).toEqual({ version: '2.7.1', compilacion: '20261110120000' })
    expect(identidadDePaquete('builtin')).toBeNull()
  })
})

describe('leerManifiesto', () => {
  it('resuelve las URL contra la del manifiesto', () => {
    const m = manifiesto()
    expect(m.url).toBe('https://ciempi.minttu.cl/ota/ciempi-web-2.7.1-20261110120000.zip')
    expect(m.apk).toEqual({ version: '2.7.0', url: 'https://ciempi.minttu.cl/descargas/CIEMPI-2.7.0.apk' })
    expect(m.paquete).toBe('2.7.1-20261110120000')
  })

  it('descarta lo que no es un manifiesto válido', () => {
    expect(leerManifiesto('<!doctype html>', URL_M)).toBeNull()
    expect(leerManifiesto(null, URL_M)).toBeNull()
    expect(leerManifiesto(json({ sha256: 'xyz' }), URL_M)).toBeNull()
    expect(leerManifiesto(json({ version: 'nueva' }), URL_M)).toBeNull()
    expect(leerManifiesto(json({ nativaMinima: undefined }), URL_M)).toBeNull()
    expect(leerManifiesto(json({ apk: null }), URL_M)?.apk).toBeNull()
  })
})

describe('decidir', () => {
  const base = { nativa: '2.7.0', web: WEB, canal: 'directo' as const, locales: [] }

  it('descarga un paquete más nuevo compatible con la APK', () => {
    expect(decidir({ ...base, manifiesto: manifiesto() }).tipo).toBe('descargar')
  })

  it('no hace nada si la web ya está al día (o es más nueva)', () => {
    expect(decidir({ ...base, manifiesto: manifiesto({ version: '2.7.0', compilacion: WEB.compilacion }) }).tipo).toBe('nada')
    expect(decidir({ ...base, manifiesto: manifiesto({ version: '2.6.0' }) }).tipo).toBe('nada')
  })

  it('no repite una descarga ni insiste con un paquete que falló', () => {
    const paquete = '2.7.1-20261110120000'
    expect(decidir({ ...base, manifiesto: manifiesto(), locales: [{ id: 'x', version: paquete, status: 'pending' }] }).tipo).toBe('nada')
    expect(decidir({ ...base, manifiesto: manifiesto(), locales: [{ id: 'x', version: paquete, status: 'error' }] }).tipo).toBe('nada')
    expect(decidir({ ...base, manifiesto: manifiesto(), locales: [{ id: 'x', version: paquete, status: 'deleted' }] }).tipo).toBe('descargar')
  })

  it('con una APK más vieja que la mínima no descarga y, en el canal directo, avisa', () => {
    const m = manifiesto({ version: '2.8.0', nativaMinima: '2.8.0', apk: { version: '2.8.0', url: '../descargas/CIEMPI-2.8.0.apk' } })
    expect(decidir({ ...base, manifiesto: m })).toEqual({
      tipo: 'avisarApk',
      version: '2.8.0',
      url: 'https://ciempi.minttu.cl/descargas/CIEMPI-2.8.0.apk',
    })
    expect(decidir({ ...base, canal: 'tienda', manifiesto: m }).tipo).toBe('nada')
    // Sin APK publicada (o no más nueva que la instalada) no hay a dónde mandar.
    expect(decidir({ ...base, manifiesto: manifiesto({ nativaMinima: '2.8.0', apk: null }) }).tipo).toBe('nada')
    expect(decidir({ ...base, manifiesto: manifiesto({ nativaMinima: '2.8.0' }) }).tipo).toBe('nada')
  })
})

describe('elegirPendiente', () => {
  it('elige el paquete descargado más nuevo que la web actual, sin los que fallaron', () => {
    const locales = [
      { id: 'a', version: '2.7.0-20261101000000', status: 'success' },
      { id: 'b', version: '2.7.1-20261110120000', status: 'pending' },
      { id: 'c', version: '2.7.2-20261111120000', status: 'error' },
      { id: 'd', version: '2.7.3-20261112120000', status: 'downloading' },
      { id: 'e', version: 'builtin', status: 'success' },
    ]
    expect(elegirPendiente(locales, WEB)?.id).toBe('b')
    expect(elegirPendiente(locales, { version: '2.7.1', compilacion: '20261110120000' })).toBeNull()
  })
})

describe('configuración', () => {
  it('el manifiesto va junto a la API absoluta; en la web (VITE_API_URL=/) no hay', () => {
    expect(urlDelManifiesto('https://ciempi.minttu.cl')).toBe(URL_M)
    expect(urlDelManifiesto('https://ciempi.minttu.cl/')).toBe(URL_M)
    expect(urlDelManifiesto('/')).toBeNull()
    expect(urlDelManifiesto(undefined)).toBeNull()
  })

  it('el canal es "tienda" salvo que se pida "directo"', () => {
    expect(canalDeCompilacion('directo')).toBe('directo')
    expect(canalDeCompilacion('tienda')).toBe('tienda')
    expect(canalDeCompilacion(undefined)).toBe('tienda')
  })
})

describe('obtenerManifiesto', () => {
  it('pide el manifiesto sin caché y lo valida', async () => {
    const pedir = vi.fn(async (url: string) => {
      expect(url).toMatch(/^https:\/\/ciempi\.minttu\.cl\/ota\/ultima\.json\?t=\d+$/)
      return json()
    })
    expect((await obtenerManifiesto(URL_M, pedir))?.paquete).toBe('2.7.1-20261110120000')
    expect(pedir).toHaveBeenCalledOnce()
  })

  it('sin internet devuelve null y la app sigue con lo que tiene', async () => {
    expect(await obtenerManifiesto(URL_M, () => Promise.reject(new TypeError('Failed to fetch')))).toBeNull()
  })

  it('con fetch simulado (como en el navegador)', async () => {
    const fetchSimulado = vi.fn(async (_url: string) => new Response(JSON.stringify(json()), { headers: { 'content-type': 'application/json' } }))
    const pedir = async (url: string) => (await fetchSimulado(url)).json() as Promise<unknown>
    const m = await obtenerManifiesto(URL_M, pedir)
    expect(decidir({ manifiesto: m!, nativa: '2.7.0', web: WEB, canal: 'directo', locales: [] }).tipo).toBe('descargar')
  })
})

// Contra un ultima.json real servido en local, p. ej.:
//   (cd dist && python3 -m http.server 8765) &
//   CIEMPI_OTA_PRUEBA=http://127.0.0.1:8765/ota/ultima.json npx vitest run src/plataforma/actualizacion
describe.skipIf(!process.env.CIEMPI_OTA_PRUEBA)('servidor local', () => {
  it('lee el ultima.json publicado por scripts/empaquetar-ota.mjs', async () => {
    const url = process.env.CIEMPI_OTA_PRUEBA!
    const m = await obtenerManifiesto(url, async (u) => {
      const r = await fetch(u)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json() as Promise<unknown>
    })
    expect(m).not.toBeNull()
    const zip = await fetch(m!.url)
    expect(zip.ok).toBe(true)
    const { createHash } = await import('node:crypto')
    expect(createHash('sha256').update(Buffer.from(await zip.arrayBuffer())).digest('hex')).toBe(m!.sha256)
    expect(decidir({ manifiesto: m!, nativa: m!.nativaMinima, web: { version: '0.0.1', compilacion: '20000101000000' }, canal: 'directo', locales: [] }).tipo).toBe(
      'descargar',
    )
  })
})
