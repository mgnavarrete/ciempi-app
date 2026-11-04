#!/usr/bin/env node
// Prueba combinada V4 (rostros + criaturas + accesorios juntos), escrita al integrar las tres ramas.
// Recorre 5 criaturas × rostro v1/v4 × accesorios v1/v4 × 4 selecciones × N, exige consola sin errores
// ni avisos, y guarda una lámina de contacto (solo lectura del laboratorio) en SALIDA.
// Uso (raíz del árbol, servidor en LAB_PUERTO, 8820 por omisión):
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules SALIDA=/tmp/salida node scripts/transformaciones/v4/probar-combinado-v4.cjs
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')
const PUERTO = process.env.LAB_PUERTO || '8820'
const BASE = `http://127.0.0.1:${PUERTO}/docs/rediseno-ciempi/laboratorio-transformaciones/`
const SAL = process.env.SALIDA || './salida-combinado-v4'
const CHROME = process.env.CHROME || path.join(process.env.HOME, '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
fs.mkdirSync(SAL, { recursive: true })

const CRIATURAS = ['ciempi', 'dragon', 'cuncuna', 'serpiente', 'camaleon']
const SELS = {
  nada: {},
  mochilaZapatos: { espalda: 'b09-aventura', pies: 'b10-robot' },
  mascara: { cabeza: 'b07-ia-robot', espalda: 'b09-robot', pies: 'b10-lluvia' },
  mago: { cabeza: 'b06-ia-mago', espalda: 'b09-mago', pies: 'b10-mago', textura: 'b11-mago' },
}

;(async () => {
  const nav = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {})
  const page = await nav.newPage({ viewport: { width: 1400, height: 1000 } })
  const errores = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(`${page.url()} :: ${m.text()}`) })
  page.on('pageerror', (e) => errores.push(`${page.url()} :: pageerror ${e.message}`))
  let casos = 0
  const capturas = []
  for (const especie of CRIATURAS)
    for (const rostro of ['v1', 'v4'])
      for (const accesorios of ['v1', 'v4'])
        for (const [nombre, sel] of Object.entries(SELS))
          for (const n of [1, 12]) {
            const url = `${BASE}?especie=${especie}&n=${n}&rostro=${rostro}&accesorios=${accesorios}&quieto&sel=${encodeURIComponent(JSON.stringify(sel))}`
            await page.goto(url)
            await page.waitForSelector('body[data-cargado]', { timeout: 120000 })
            await page.waitForTimeout(250)
            casos++
            if (n === 12 && rostro === accesorios && nombre !== 'nada') {
              const svg = page.locator('#lienzo-a')
              const f = path.join(SAL, `${especie}-${rostro}-${nombre}.png`)
              await svg.screenshot({ path: f })
              capturas.push(f)
            }
          }
  await nav.close()
  const r = { casos, errores, capturas: capturas.length }
  fs.writeFileSync(path.join(SAL, 'resultado.json'), JSON.stringify(r, null, 1))
  console.log(`Casos: ${casos} · errores/avisos de consola: ${errores.length} · capturas: ${capturas.length}`)
  if (errores.length) { console.log(errores.slice(0, 10).join('\n')); process.exit(1) }
})()
