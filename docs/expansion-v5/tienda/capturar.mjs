// Capturas de la sección «Criaturas» de la tienda a 390 px (modo local, sin cuenta).
//
//   npx vite --port 5199 --strictPort &   # en la raíz del proyecto
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node docs/expansion-v5/tienda/capturar.mjs
//
// Siembra el perfil en localStorage (presentación vista, monedas) y recorre:
// Cuncuna bloqueada, prueba de una variante sin la especie (desglose),
// confirmación, «¡Usar ahora!», puesta, paquete parcial y la celebración de la Cuncuna.
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const { chromium } = createRequire(process.env.NODE_PATH + '/')('playwright')
const aqui = dirname(fileURLToPath(import.meta.url))
const URL_APP = process.env.URL_APP ?? 'http://localhost:5199/'
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome' })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const errores = []
p.on('pageerror', (e) => errores.push(e.message))
const foto = async (nombre) => {
  await p.waitForTimeout(700)
  await p.screenshot({ path: `${aqui}/${nombre}.png` })
  console.log('✓', nombre)
}
/** Agrega `items` al inventario guardado y deja esos desbloqueos. */
const sembrar = (items, desbloqueos = []) =>
  p.evaluate(
    ([items, desbloqueos]) => {
      const ps = JSON.parse(localStorage.getItem('ciempi:v1:perfiles'))
      ps[0].inventario = [...(ps[0].inventario ?? []), ...items]
      localStorage.setItem('ciempi:v1:perfiles', JSON.stringify(ps))
      localStorage.setItem('ciempi:v1:desbloqueos', JSON.stringify(desbloqueos.map((d) => ({ ...d, id: `${ps[0].id}|${d.item}`, perfilId: ps[0].id }))))
    },
    [items, desbloqueos],
  )
const abrirTienda = async () => {
  await p.reload()
  await p.getByText('Lector').click()
  await p.getByRole('button', { name: /Personalizar/ }).click()
  await p.waitForTimeout(800)
}

await p.goto(URL_APP)
await p.waitForTimeout(2500)
await p.evaluate(() => {
  const ps = JSON.parse(localStorage.getItem('ciempi:v1:perfiles'))
  ps[0].ciempi = { ...ps[0].ciempi, presentado: true, genero: 'nino' }
  ps[0].monedas = 300
  ps[0].inventario = []
  localStorage.setItem('ciempi:v1:perfiles', JSON.stringify(ps))
})
await abrirTienda()
await p.getByRole('tab', { name: /Criaturas/ }).click()
await foto('01-criaturas-cuncuna-bloqueada')

await p.getByRole('tab', { name: /Dragón/ }).click()
await foto('02-dragon-pestana')
await p.getByRole('button', { name: /Dragón de Fuego/ }).click()
await foto('03-dragon-fuego-probando-desglose')
await p.getByRole('button', { name: /^Comprar/ }).click()
await foto('04-confirmar-especie-mas-variante')
await p.getByRole('button', { name: 'Sí, comprar' }).click()
await foto('05-comprada-usar-ahora')
await p.getByRole('button', { name: '¡Usar ahora!' }).click()
await foto('06-puesta-estreno')
// Paquete parcial (ya tiene Fuego): se ve el total y el ahorro, con confirmación.
await p.locator('main, body').evaluate(() => document.querySelector('.overflow-y-auto')?.scrollTo(0, 99999))
await foto('07-paquete-parcial-fila')
await p.getByRole('button', { name: /^🪙/ }).last().click()
await foto('08-paquete-confirmar')
await p.getByRole('button', { name: 'No', exact: true }).click()

// Cuncuna recién ganada leyendo: la celebración.
await sembrar(['especie:cuncuna'], [
  { item: 'especie:cuncuna', motivo: 'nivel0', estado: 'por_celebrar', otorgadoEn: new Date().toISOString(), celebradoEn: null },
])
await abrirTienda()
await foto('09-celebracion-cuncuna')
await p.getByRole('button', { name: '¡Ponérmela!' }).click()
await foto('10-cuncuna-puesta')
await p.getByRole('button', { name: /Cuncuna Dorada/ }).click()
await foto('11-variante-cuncuna-con-especie')

// Vista horizontal (apaisado) de la sección.
await p.setViewportSize({ width: 844, height: 390 })
await abrirTienda()
await p.getByRole('tab', { name: /Criaturas/ }).click()
await p.getByRole('tab', { name: /Dragón/ }).click()
await p.getByRole('button', { name: /Dragón de Hielo/ }).click()
await foto('12-apaisado')
console.log(errores.length ? `Errores: ${errores.join(' | ')}` : 'Sin errores de página')
await b.close()
