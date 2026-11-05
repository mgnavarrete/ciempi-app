// Capturas de la tienda 2.8 (una compra a la vez, la cara a la vista, diseño celular/tablet), modo local.
//   VITE_API_URL= npx vite build --outDir <tmp> && npx vite preview --outDir <tmp> --port 5192
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node docs/expansion-v8/tienda/capturar-2.8.mjs
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'

const { chromium } = createRequire(process.env.NODE_PATH + '/')('playwright')
const aqui = dirname(fileURLToPath(import.meta.url)) + '/2.8'
mkdirSync(aqui, { recursive: true })
const URL_APP = process.env.URL_APP ?? 'http://localhost:5192/'
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome' })
const errores = []
const problemas = []

async function recorrido(tamano, sufijo, { tableta = false } = {}) {
  const ctx = await b.newContext({ viewport: tamano, deviceScaleFactor: 2, hasTouch: true, isMobile: !tableta })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => errores.push(`${sufijo}: ${e.message}`))
  p.on('console', (m) => { if (m.type() === 'error') errores.push(`${sufijo}: ${m.text()}`) })
  // ¿La barra de compra tapa a Ciempi o la lista? ¿Algo se sale de la pantalla?
  const revisar = async (nombre) => {
    const r = await p.evaluate(() => {
      const caja = (el) => el && el.getBoundingClientRect()
      const barra = caja(document.querySelector('[role="region"][aria-label="Lo que te estás probando"]'))
      const ciempi = caja(document.querySelector('[data-ciempi]')?.closest('.rounded-3xl'))
      const listas = [...document.querySelectorAll('.overflow-y-auto')].map(caja).filter((x) => x && x.height > 0)
      const tapa = (a, z) => a && z && a.top < z.bottom - 1 && z.top < a.bottom - 1 && a.left < z.right - 1 && z.left < a.right - 1
      const fuera = document.documentElement.scrollWidth > innerWidth + 1
      const chicos = [...document.querySelectorAll('main button, [role=tab], [role=region] button, ul button')]
        .map((el) => [el, el.getBoundingClientRect()])
        .filter(([, r]) => r.width > 0 && r.height > 0 && r.height < 43.5)
        .map(([el, r]) => `${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20)} ${Math.round(r.height)}px`)
      return { tapaCiempi: tapa(barra, ciempi), tapaLista: listas.some((l) => tapa(barra, l)), fuera, chicos: chicos.slice(0, 6) }
    })
    if (r.tapaCiempi || r.tapaLista || r.fuera || r.chicos.length) problemas.push(`${nombre}-${sufijo}: ${JSON.stringify(r)}`)
  }
  const foto = async (nombre) => {
    await p.waitForTimeout(1500)
    await revisar(nombre)
    await p.screenshot({ path: `${aqui}/${nombre}-${sufijo}.png` })
    console.log('✓', nombre, sufijo)
  }
  const pestana = (nombre) => p.getByRole('tab', { name: nombre }).first().click()
  p.setDefaultTimeout(60000)
  await p.goto(URL_APP)
  await p.waitForFunction(() => localStorage.getItem('ciempi:v1:perfiles'))
  await p.evaluate(() => {
    const ps = JSON.parse(localStorage.getItem('ciempi:v1:perfiles'))
    // Lleva puesta (y guardada) la máscara Robot, que tapa la cara, y una bufanda.
    ps[0].ciempi = { ...ps[0].ciempi, presentado: true, genero: 'nino', comida: 'comida-frutilla', nombre: 'Pipo', cabeza: 'cabeza:b07-ia-robot', pelo: 'pelo:pelo-nada', cuello: 'cuello:bufanda-calco32' }
    ps[0].monedas = 60
    ps[0].inventario = ['comida-frutilla', 'especie:dragon', 'cabeza:b06-ia-jockey', 'cabeza:b07-ia-robot', 'cuello:bufanda-calco32', 'espalda:b09-robot']
    localStorage.setItem('ciempi:v1:perfiles', JSON.stringify(ps))
  })
  await p.reload()
  await p.getByText('Lector').click()
  await p.getByRole('button', { name: /Tienda/ }).click()
  await p.locator('ul button').first().click()
  await foto('01-tienda-criaturas')
  await pestana(/Cabeza/)
  await pestana(/Gorros/)
  await p.getByRole('button', { name: /Gorro de mago/ }).click()
  await foto('02-gorros-probando-gorro')
  await pestana(/Cuerpo/)
  await pestana(/Capas y mochilas/)
  await foto('03-capas-sin-el-gorro')
  await p.locator('ul button').last().click()
  await p.locator('ul').last().evaluate((el) => el.closest('.overflow-y-auto').scrollTo({ top: 1e5 }))
  await foto('03b-capas-probando-al-final')
  await pestana(/Cabeza/)
  await pestana(/Ojos/)
  await foto('04-ojos-con-mascara-cara-a-la-vista')
  await p.getByRole('button', { name: /Ropero/ }).click()
  await pestana(/Gorros/)
  await foto('05-ropero-gorros')
  await ctx.close()
}
await recorrido({ width: 360, height: 640 }, '360x640')
await recorrido({ width: 390, height: 844 }, '390x844')
await recorrido({ width: 844, height: 390 }, '844x390')
await recorrido({ width: 800, height: 1280 }, 'tablet-800x1280', { tableta: true })
await recorrido({ width: 1280, height: 800 }, 'tablet-1280x800', { tableta: true })
console.log('errores:', errores.length, errores.slice(0, 5))
console.log('problemas:', problemas.length)
for (const x of problemas) console.log(' -', x)
await b.close()
