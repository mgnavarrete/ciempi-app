// Capturas de los fondos de «Su mundo»: portada con cada fondo, vista previa de la tienda y grilla.
//   VITE_API_URL= npx vite build --outDir <tmp> && npx vite preview --outDir <tmp> --port 5195
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node docs/expansion-v7/fondos/capturar-fondos.mjs <salida> <fondo1,fondo2,...>
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'

const { chromium } = createRequire(process.env.NODE_PATH + '/')('playwright')
const [salida, lista] = process.argv.slice(2)
const fondos = lista.split(',')
mkdirSync(salida, { recursive: true })
const URL_APP = process.env.URL_APP ?? 'http://localhost:5195/'
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome' })
const errores = []

async function preparar(tamano, fondo) {
  const ctx = await b.newContext({ viewport: tamano, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => errores.push(e.message))
  p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()) })
  p.setDefaultTimeout(60000)
  await p.goto(URL_APP)
  await p.waitForFunction(() => localStorage.getItem('ciempi:v1:perfiles'))
  await p.evaluate(([fondo, fondos]) => {
    const ps = JSON.parse(localStorage.getItem('ciempi:v1:perfiles'))
    ps[0].ciempi = { ...ps[0].ciempi, presentado: true, genero: 'nino', nombre: 'Pipo', fondo }
    ps[0].monedas = 40
    ps[0].inventario = [...fondos]
    localStorage.setItem('ciempi:v1:perfiles', JSON.stringify(ps))
  }, [fondo, fondos])
  await p.reload()
  await p.getByText('Lector').click()
  await p.waitForTimeout(1800)
  return { ctx, p }
}

// Portada (sección del Ciempi) con cada fondo, a 390 px; y página completa con los dos primeros.
for (const [i, fondo] of fondos.entries()) {
  const { ctx, p } = await preparar({ width: 390, height: 844 }, fondo)
  await p.locator('section[aria-label$="tu Ciempi"]').screenshot({ path: `${salida}/portada-${fondo}.png` })
  if (i < 3) await p.screenshot({ path: `${salida}/inicio-390-${fondo}.png` })
  await ctx.close()
  console.log('✓ portada', fondo)
}
for (const fondo of fondos.slice(0, 3)) {
  const { ctx, p } = await preparar({ width: 844, height: 390 }, fondo)
  await p.screenshot({ path: `${salida}/inicio-apaisado-${fondo}.png` })
  await ctx.close()
  console.log('✓ apaisado', fondo)
}
// Tienda: categoría Fondos (grilla de 3) y vista previa con un fondo probado.
for (const [tamano, suf] of [[{ width: 390, height: 844 }, '390'], [{ width: 844, height: 390 }, 'apaisado']]) {
  const { ctx, p } = await preparar(tamano, 'fondo-jardin')
  await p.evaluate(() => {
    const ps = JSON.parse(localStorage.getItem('ciempi:v1:perfiles'))
    ps[0].inventario = []
    localStorage.setItem('ciempi:v1:perfiles', JSON.stringify(ps))
  })
  await p.reload()
  await p.getByText('Lector').click()
  await p.getByRole('button', { name: /Tienda/ }).first().click()
  await p.getByRole('tab', { name: /Su mundo/ }).first().click()
  const tabFondos = p.getByRole('tab', { name: /Fondos/ })
  if (await tabFondos.count()) await tabFondos.first().click()
  await p.waitForTimeout(1500)
  await p.screenshot({ path: `${salida}/tienda-fondos-${suf}.png`, fullPage: suf === '390' })
  const ult = fondos[fondos.length - 1]
  const nombre = process.env[`NOMBRE_${ult.replace(/-/g, '_')}`]
  if (nombre) {
    await p.getByRole('button', { name: new RegExp(nombre) }).first().click()
    await p.waitForTimeout(1500)
    await p.screenshot({ path: `${salida}/tienda-probando-${suf}.png` })
  }
  await ctx.close()
  console.log('✓ tienda', suf)
}
console.log('errores:', errores.length, errores.slice(0, 5))
await b.close()
