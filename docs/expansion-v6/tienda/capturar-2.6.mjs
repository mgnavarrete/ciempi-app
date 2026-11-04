// Capturas de 2.6 (Tienda y Mi ropero separados) a 390 px y en apaisado (844×390), modo local.
//   VITE_API_URL= npx vite build --outDir <tmp> && npx vite preview --outDir <tmp> --port 5196
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node docs/expansion-v6/tienda/capturar-2.6.mjs
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'

const { chromium } = createRequire(process.env.NODE_PATH + '/')('playwright')
const aqui = dirname(fileURLToPath(import.meta.url)) + '/2.6'
mkdirSync(aqui, { recursive: true })
const URL_APP = process.env.URL_APP ?? 'http://localhost:5196/'
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome' })
const errores = []

async function recorrido(tamano, sufijo) {
  const ctx = await b.newContext({ viewport: tamano, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => errores.push(e.message))
  p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()) })
  const foto = async (nombre) => {
    await p.waitForTimeout(1500)
    await p.screenshot({ path: `${aqui}/${nombre}-${sufijo}.png` })
    console.log('✓', nombre, sufijo)
  }
  p.setDefaultTimeout(60000)
  await p.goto(URL_APP)
  await p.waitForFunction(() => localStorage.getItem('ciempi:v1:perfiles'))
  await p.evaluate(() => {
    const ps = JSON.parse(localStorage.getItem('ciempi:v1:perfiles'))
    ps[0].ciempi = { ...ps[0].ciempi, presentado: true, genero: 'nino', comida: 'comida-frutilla', nombre: 'Pipo' }
    ps[0].monedas = 30
    ps[0].inventario = ['comida-frutilla', 'especie:dragon', 'cabeza:b06-ia-jockey', 'cuello:bufanda-calco32', 'espalda:b09-robot']
    localStorage.setItem('ciempi:v1:perfiles', JSON.stringify(ps))
  })
  await p.reload()
  await p.getByText('Lector').click()
  await foto('01-inicio')
  await p.getByRole('button', { name: /Tienda/ }).click()
  await foto('02-tienda-criaturas')
  await p.getByRole('tab', { name: /Cabeza/ }).first().click()
  await p.getByRole('tab', { name: /Gorros/ }).first().click()
  await foto('03-tienda-gorros')
  await p.getByRole('button', { name: /Gorro de mago/ }).click()
  await foto('03b-tienda-probando-gorro')
  await p.getByRole('button', { name: /^Comprar · / }).click()
  await foto('03c-tienda-comprado-sale')
  await p.getByRole('tab', { name: /Cuerpo/ }).first().click()
  await p.getByRole('tab', { name: /Capas y mochilas/ }).first().click()
  await foto('04-tienda-capas-y-mochilas')
  await p.getByRole('button', { name: /Ropero/ }).click()
  await foto('05-ropero-capas-y-mochilas')
  await p.getByRole('button', { name: /Propulsor/ }).click()
  await foto('05b-ropero-puesto')
  await p.getByRole('tab', { name: /Cabeza/ }).first().click()
  await p.getByRole('tab', { name: /Gorros/ }).first().click()
  await foto('05c-ropero-gorros-con-lo-comprado')
  await p.getByRole('tab', { name: /Criaturas/ }).first().click()
  await foto('06-ropero-criaturas')
  await p.getByRole('tab', { name: /Cabeza/ }).first().click()
  await p.getByRole('tab', { name: /Lentes/ }).first().click()
  await foto('07-ropero-vacio')
  await ctx.close()
}
await recorrido({ width: 390, height: 844 }, '390')
await recorrido({ width: 844, height: 390 }, 'apaisado')
console.log('errores:', errores.length, errores.slice(0, 5))
await b.close()
