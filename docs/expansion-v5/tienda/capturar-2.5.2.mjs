// Capturas de 2.5.2 a 390 px (modo local): inicio, Criaturas primero, compra de la Cuncuna,
// miniaturas solo del accesorio y mochilas puestas.
//   npx vite --port 5199 --strictPort &
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node docs/expansion-v5/tienda/capturar-2.5.2.mjs
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'

const { chromium } = createRequire(process.env.NODE_PATH + '/')('playwright')
const aqui = dirname(fileURLToPath(import.meta.url)) + '/2.5.2'
mkdirSync(aqui, { recursive: true })
const URL_APP = process.env.URL_APP ?? 'http://localhost:5199/'
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome' })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const errores = []
p.on('pageerror', (e) => errores.push(e.message))
p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()) })
const foto = async (nombre) => {
  await p.waitForTimeout(2500)
  await p.screenshot({ path: `${aqui}/${nombre}.png` })
  console.log('✓', nombre)
}

p.setDefaultTimeout(90000)
await p.goto(URL_APP, { timeout: 180000 })
await p.waitForFunction(() => localStorage.getItem('ciempi:v1:perfiles'), null, { timeout: 120000 })
await p.waitForTimeout(2500)
await p.evaluate(() => {
  const ps = JSON.parse(localStorage.getItem('ciempi:v1:perfiles'))
  ps[0].ciempi = { ...ps[0].ciempi, presentado: true, genero: 'nino', comida: 'comida-frutilla' }
  ps[0].monedas = 300
  ps[0].inventario = ['comida-frutilla']
  localStorage.setItem('ciempi:v1:perfiles', JSON.stringify(ps))
})
await p.reload()
await p.getByText('Lector').click()
await foto('01-inicio')
await p.getByRole('button', { name: /Personalizar/ }).click()
await foto('02-tienda-abre-en-criaturas')
const tabs = await p.getByRole('tab').allInnerTexts()
console.log('pestañas:', tabs.join(' | '))

await p.getByRole('tab', { name: /Cuncuna/ }).click()
await foto('03-cuncuna-con-precio')
await p.getByRole('button', { name: /Cuncuna Clásica/ }).click()
await p.getByRole('button', { name: /^Comprar/ }).click()
await foto('04-cuncuna-confirmar')
await p.getByRole('button', { name: 'Sí, comprar' }).click()
await foto('05-cuncuna-comprada')

for (const [seccion, cat, nombre] of [
  ['Cabeza', 'Gorros', '06-gorros'],
  ['Cabeza', 'Peinados', '07-peinados'],
  ['Cabeza', 'Lentes', '08-lentes'],
  ['Cuerpo', 'Bufandas', '09-bufandas'],
  ['Cuerpo', 'Capas y mochilas', '10-capas-y-mochilas'],
  ['Cuerpo', 'Calzado', '11-calzado'],
]) {
  await p.getByRole('tab', { name: new RegExp(seccion) }).first().click()
  await p.getByRole('tab', { name: new RegExp(cat) }).first().click()
  await foto(nombre)
}
// Mochila puesta (probando): se ve en Ciempi.
await p.getByRole("tab", { name: /Capas y mochilas/ }).first().click()
await p.getByRole("button", { name: /Cartógrafo/ }).first().click()
await foto('12-mochila-probando')
console.log('errores:', errores.length, errores.slice(0, 5))
await b.close()
