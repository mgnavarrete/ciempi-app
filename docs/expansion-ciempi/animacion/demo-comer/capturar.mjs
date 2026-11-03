// Hoja de 8 cuadros de E08 (grande y tamaño de pista, fondo claro y oscuro) y
// un video .webm de la demo. Requiere `servir.mjs` corriendo (puerto 8773).
// Las hojas grandes del repositorio se redujeron después a 1× con PIL (peso).
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules \
//     node docs/expansion-ciempi/animacion/demo-comer/capturar.mjs
import { createRequire } from 'node:module'
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const salida = join(aqui, '..', 'hoja-e08')
mkdirSync(salida, { recursive: true })
const { chromium } = createRequire(import.meta.url)('playwright')
const CHROMIUM = process.env.CHROMIUM || join(process.env.HOME, '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
const url = process.env.DEMO_URL || 'http://127.0.0.1:8773/'
const navegador = await chromium.launch({ executablePath: CHROMIUM })
const errores = []
const vigilar = (page, donde) => {
  page.on('pageerror', (e) => errores.push(`${donde}: ${e}`))
  page.on('console', (m) => m.type() === 'error' && errores.push(`${donde}: ${m.text()}`))
}

const FILAS = [
  { conjunto: 'base' },
  { conjunto: 'base', boca: 'b03-carcajada' },
  { conjunto: 'base', gesto: 'b03-dormilon' },
  { conjunto: 'mago', comida: 'comida-platano' },
  { conjunto: 'robot' },
  { conjunto: 'gatita', comida: 'comida-frutilla' },
  { conjunto: 'base', tranquilo: true },
]
const FONDOS = { claro: ['#f6ecd8', '#243e5b'], oscuro: ['#1d2633', '#f3ead7'] }
const ctx = await navegador.newContext({ viewport: { width: 2600, height: 2600 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
vigilar(page, 'hoja')
await page.goto(url + 'hoja.html')
await page.waitForFunction(() => window.hoja?.listo(), null, { timeout: 30000 })
for (const modo of ['grande', 'pista'])
  for (const [fondo, [bg, tinta]] of Object.entries(FONDOS)) {
    await page.evaluate((a) => window.hoja.dibujar(a), { modo, fondo: bg, tinta, filas: FILAS })
    await page.evaluate(() => Promise.all([...document.querySelectorAll('image')].map((im) => im.decode?.().catch(() => {}))))
    await page.waitForTimeout(400)
    await page.locator('[data-hoja]').screenshot({ path: join(salida, `hoja-${modo}-${fondo}.png`) })
    console.log('hoja', modo, fondo)
  }
await ctx.close()

// Video: el carril real (src/lectura/Ciempi.tsx) leyendo a ritmo realista, ampliado y a tamaño real.
for (const [nombre, ajustes] of [
  ['carril-ampliado-mago', { conjunto: 'mago', ritmo: 500, ampliado: true, nMax: 12 }],
  ['carril-real-robot', { conjunto: 'robot', ritmo: 500, ampliado: false, nMax: 12 }],
]) {
  const dir = join(salida, 'tmp-video')
  const v = await navegador.newContext({ viewport: { width: 1100, height: 760 }, recordVideo: { dir, size: { width: 1100, height: 760 } } })
  const p = await v.newPage()
  vigilar(p, 'demo')
  await p.goto(url)
  await p.waitForSelector('[data-ciempi="v2"]', { timeout: 30000 })
  await p.evaluate((a) => { window.demo.fijar(a); window.demo.reiniciar() }, ajustes)
  await p.waitForTimeout(7000)
  await v.close()
  const [archivo] = readdirSync(dir)
  renameSync(join(dir, archivo), join(salida, `${nombre}.webm`))
  rmSync(dir, { recursive: true })
  console.log('video', nombre)
}
await navegador.close()
console.log(errores.length ? 'ERRORES:\n' + errores.join('\n') : 'Sin errores de consola.')
