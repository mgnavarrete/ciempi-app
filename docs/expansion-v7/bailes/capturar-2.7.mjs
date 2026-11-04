// Capturas de 2.7 (bailes y frutas del inicio) a 390 px y en apaisado (844×390), modo local.
//   VITE_API_URL= npx vite build --outDir <tmp> && npx vite preview --outDir <tmp> --port 5194
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node docs/expansion-v7/bailes/capturar-2.7.mjs
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'

const { chromium } = createRequire(process.env.NODE_PATH + '/')('playwright')
const aqui = dirname(fileURLToPath(import.meta.url)) + '/2.7'
mkdirSync(aqui, { recursive: true })
const URL_APP = process.env.URL_APP ?? 'http://localhost:5194/'
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome' })
const errores = []

async function sembrar(p, cambios) {
  await p.evaluate((cambios) => {
    const ps = JSON.parse(localStorage.getItem('ciempi:v1:perfiles'))
    ps[0].ciempi = { ...ps[0].ciempi, presentado: true, genero: 'nino', comida: 'comida-frutilla', nombre: 'Pipo', ...cambios.ciempi }
    ps[0].monedas = cambios.monedas ?? ps[0].monedas
    ps[0].inventario = cambios.inventario ?? ps[0].inventario
    ps[0].ajustes = { ...ps[0].ajustes, ...cambios.ajustes }
    localStorage.setItem('ciempi:v1:perfiles', JSON.stringify(ps))
  }, cambios)
  await p.reload()
  await p.getByText('Lector').click()
}

async function recorrido(tamano, sufijo) {
  const ctx = await b.newContext({ viewport: tamano, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => errores.push(e.message))
  p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()) })
  const foto = async (nombre, espera = 1500) => {
    await p.waitForTimeout(espera)
    await p.screenshot({ path: `${aqui}/${nombre}-${sufijo}.png` })
    console.log('✓', nombre, sufijo)
  }
  p.setDefaultTimeout(60000)
  await p.goto(URL_APP)
  await p.waitForFunction(() => localStorage.getItem('ciempi:v1:perfiles'))
  // Quieto (modo tranquilo) para ver bien las frutas.
  await sembrar(p, { monedas: 60, inventario: ['comida-frutilla'], ajustes: { modoTranquilo: true } })
  await foto('01-inicio-frutas')
  await sembrar(p, { ajustes: { modoTranquilo: false } })
  await p.getByRole('button', { name: /Elegir un baile/ }).click()
  await foto('02-rueda-solo-gratis', 900)
  await p.getByRole('button', { name: /Saltito/ }).click()
  await foto('02b-eligio-saltito', 700)
  await p.getByRole('button', { name: /Elegir un baile/ }).click()
  await p.getByRole('button', { name: /Más bailes/ }).click()
  await foto('03-tienda-bailes', 2500)
  await p.getByRole('button', { name: /Ver Baile alegre/ }).click()
  await foto('04-tienda-mirando-baile', 1200)
  await p.getByRole('button', { name: /^Comprar · / }).click()
  await foto('05-tienda-comprado')
  await p.getByRole('button', { name: /Ropero/ }).click()
  await foto('06-ropero-bailes', 2500)
  await p.getByRole('button', { name: /Para celebrar/ }).last().click()
  await foto('07-ropero-para-celebrar')
  await p.getByRole('button', { name: 'Volver' }).first().click()
  await p.getByRole('button', { name: /Elegir un baile/ }).click()
  await foto('08-rueda-con-comprado', 900)
  // Con todos los bailes.
  await sembrar(p, { inventario: ['comida-frutilla', 'baile:e01', 'baile:e06', 'baile:a12', 'baile:a11', 'baile:a09', 'baile:e02'] })
  await p.getByRole('button', { name: /Elegir un baile/ }).click()
  await foto('09-rueda-todos', 900)
  await p.mouse.click(10, tamano.height - 10)
  await foto('10-rueda-cerrada', 600)
  await ctx.close()
}
await recorrido({ width: 390, height: 844 }, '390')
await recorrido({ width: 844, height: 390 }, 'apaisado')
console.log('errores:', errores.length, errores.slice(0, 5))
await b.close()
