#!/usr/bin/env node
// Miniaturas horneadas de las 23 variantes para la tienda:
// public/criaturas/miniaturas/<varianteId>.webp, 240 px de ancho, N = 5, fondo
// transparente, sin accesorios (selección inicial, expresión Alegre). Se dibujan con
// el compositor del juego (src/ciempi/v2/criaturas) a 960 px, se recortan al
// personaje (con un margen) y se reducen.
//
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node scripts/criaturas/miniaturas.mjs
import { mkdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const sharp = require('sharp')
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CHROMIUM = process.env.CHROMIUM || join(process.env.HOME, '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
const PUERTO = Number(process.env.PUERTO_JUEGO || 8854), ANCHO = 240
const destino = join(raiz, 'public/criaturas/miniaturas')
mkdirSync(destino, { recursive: true })

const vite = await createServer({ root: raiz, configFile: false, logLevel: 'warn', server: { port: PUERTO, host: '127.0.0.1', strictPort: true } })
await vite.listen()
const navegador = await chromium.launch({ executablePath: CHROMIUM, args: ['--disable-gpu', '--force-color-profile=srgb'] })
try {
  const p = await navegador.newPage({ viewport: { width: 1000, height: 800 } })
  const errores = []
  p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()) })
  p.on('pageerror', (e) => errores.push(e.message))
  await p.goto(`http://127.0.0.1:${PUERTO}/scripts/criaturas/paridad/juego.html?transparente&espera=300`)
  await p.waitForSelector('body[data-listo]', { state: 'attached', timeout: 120000 })
  const { VARIANTES } = await vite.ssrLoadModule('/src/ciempi/v2/criaturas/datos.ts')
  let bytes = 0
  for (const v of VARIANTES) {
    await p.evaluate((id) => window.paridad.dibujar(id, window.paridad.inicial, 5).then(() => {
      const s = document.querySelector('#lienzo > svg'), w = 960
      s.setAttribute('height', Math.round((w * s.height.baseVal.value) / s.width.baseVal.value)); s.setAttribute('width', w)
    }), v.id)
    const png = await p.locator('#lienzo > svg').screenshot({ omitBackground: true })
    const recortado = await sharp(png).trim({ threshold: 0 }).extend({ top: 12, bottom: 12, left: 12, right: 12, background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
    const salida = join(destino, v.id + '.webp')
    await sharp(recortado).resize({ width: ANCHO, kernel: 'lanczos3' }).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(salida)
    const { width, height } = await sharp(salida).metadata()
    bytes += statSync(salida).size
    console.log(`${v.id.padEnd(20)} ${width}×${height}`)
  }
  console.log(`${VARIANTES.length} miniaturas en public/criaturas/miniaturas/ (${(bytes / 1024).toFixed(0)} KiB). Errores de consola: ${errores.length}`)
  for (const e of errores) console.log('  ' + e)
} finally {
  await navegador.close()
  await vite.close()
}
