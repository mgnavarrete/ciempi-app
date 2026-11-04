// Inicio antes de 2.7 (frutas chicas y cortadas), para comparar. Ver capturar-2.7.mjs.
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'

const { chromium } = createRequire(process.env.NODE_PATH + '/')('playwright')
const aqui = dirname(fileURLToPath(import.meta.url)) + '/antes'
mkdirSync(aqui, { recursive: true })
const URL_APP = process.env.URL_APP ?? 'http://localhost:5194/'
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome' })
for (const [tamano, sufijo] of [[{ width: 390, height: 844 }, '390'], [{ width: 844, height: 390 }, 'apaisado']]) {
  const ctx = await b.newContext({ viewport: tamano, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  p.setDefaultTimeout(60000)
  await p.goto(URL_APP)
  await p.waitForFunction(() => localStorage.getItem('ciempi:v1:perfiles'))
  await p.evaluate(() => {
    const ps = JSON.parse(localStorage.getItem('ciempi:v1:perfiles'))
    ps[0].ciempi = { ...ps[0].ciempi, presentado: true, genero: 'nino', comida: 'comida-frutilla', nombre: 'Pipo' }
    ps[0].ajustes = { ...ps[0].ajustes, modoTranquilo: true }
    localStorage.setItem('ciempi:v1:perfiles', JSON.stringify(ps))
  })
  await p.reload()
  await p.getByText('Lector').click()
  await p.waitForTimeout(2000)
  await p.locator('section').first().screenshot({ path: `${aqui}/inicio-${sufijo}.png` })
  await ctx.close()
}
await b.close()
