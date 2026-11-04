import { createRequire } from 'node:module'
const { chromium } = createRequire(process.env.NODE_PATH + '/')('playwright')
import { readFileSync } from 'node:fs'
const [S, OUT] = process.argv.slice(2)
const { M, N } = JSON.parse(readFileSync(`${S}/sembrado.txt`, 'utf8').trim().split('\n').pop())
const URL = 'http://127.0.0.1:5197/'
const navegador = await chromium.launch({ executablePath: '/home/menta/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell' })
const log = []
async function pagina(token) {
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript((t) => localStorage.setItem('ciempi:token', t), token)
  const pg = await ctx.newPage()
  pg.on('console', (m) => m.type() === 'error' && log.push(`[console] ${m.text()}`))
  pg.on('pageerror', (e) => log.push(`[pageerror] ${e.message}`))
  await pg.goto(URL)
  return pg
}
const foto = async (pg, nombre) => {
  await pg.waitForTimeout(500)
  await pg.screenshot({ path: `${OUT}/${nombre}.png` })
  log.push(`captura ${nombre}`)
}

// ── Niño ──
let nino = await pagina(N)
await nino.getByText('Pendiente de aprobación').first().waitFor()
await nino.getByText('Pendiente de aprobación').first().scrollIntoViewIfNeeded()
await nino.evaluate(() => document.querySelector('li:has(.bg-naranjo\\/20)')?.scrollIntoView({ block: 'center' }))
await foto(nino, '01-nino-biblioteca-pendiente')
// Leerlo: se puede, sin monedas.
await nino.locator('li', { hasText: 'Mi perro Bobi' }).locator('button').first().click()
await nino.getByText('Pendiente de aprobación: puedes leerlo').waitFor()
await foto(nino, '02-nino-lectura-pendiente')
await nino.goto(URL)
await nino.getByText('Pendiente de aprobación').first().waitFor()
await nino.locator('li', { hasText: 'Mi perro Bobi' }).getByText('Aprobar con PIN (adulto)').click()
await nino.getByRole('dialog').waitFor()
await foto(nino, '03-nino-dialogo-pin')
// Sin PIN creado todavía.
await nino.getByLabel('PIN del adulto').fill('2580')
await nino.getByRole('button', { name: 'Aprobar', exact: true }).click()
await nino.getByText('Todavía ningún adulto creó su PIN').waitFor()
await foto(nino, '04-nino-sin-pin-creado')
await nino.getByRole('dialog').getByRole('button', { name: 'Cerrar' }).click()

// ── Adulto ──
const adulto = await pagina(M)
await adulto.getByText('Textos por aprobar').waitFor()
await foto(adulto, '05-adulto-pendientes-sin-pin')
await adulto.getByRole('button', { name: 'Créalo en «Cuenta»' }).click()
await adulto.getByRole('button', { name: 'Crear mi PIN' }).click()
await adulto.getByLabel('PIN nuevo (4 a 8 números)').fill('482613')
await adulto.getByLabel('Repítelo').fill('482613')
await adulto.getByLabel('Tu contraseña (para confirmar que eres tú)').fill('clave-mama-1')
await foto(adulto, '06-adulto-crear-pin')
await adulto.getByRole('button', { name: 'Guardar PIN' }).click()
await adulto.getByText('Listo: tu PIN quedó guardado.').waitFor()
await foto(adulto, '07-adulto-pin-guardado')
await adulto.getByRole('tab', { name: /Alumnos/ }).click()
await adulto.getByText('Textos por aprobar').waitFor()
await adulto.locator('li', { hasText: 'El volcán' }).getByRole('button', { name: 'Revisar' }).click()
await adulto.getByLabel('PIN del adulto').fill('482613')
await foto(adulto, '08-adulto-dialogo-pin')
await adulto.getByRole('button', { name: 'Aprobar', exact: true }).click()
await adulto.getByRole('dialog').waitFor({ state: 'detached' })
await foto(adulto, '09-adulto-aprobado-desde-panel')

// ── En el teléfono del niño: PIN incorrecto y después el correcto ──
await nino.goto(URL)
await nino.getByText('Pendiente de aprobación').first().waitFor()
await nino.locator('li', { hasText: 'Mi perro Bobi' }).getByText('Aprobar con PIN (adulto)').click()
await nino.getByLabel('PIN del adulto').fill('1357')
await nino.getByRole('button', { name: 'Aprobar', exact: true }).click()
await nino.getByText('Ese PIN no es').waitFor()
await foto(nino, '10-nino-pin-incorrecto')
await nino.getByLabel('PIN del adulto').fill('482613')
await nino.getByRole('button', { name: 'Aprobar', exact: true }).click()
await nino.getByRole('dialog').waitFor({ state: 'detached' })
await nino.evaluate(() => [...document.querySelectorAll('li')].find((l) => l.textContent?.includes('Mi perro Bobi'))?.scrollIntoView({ block: 'center' }))
await foto(nino, '11-nino-aprobado')
const quedan = await nino.getByText('Pendiente de aprobación').count()
log.push(`pendientes visibles al final: ${quedan}`)
await navegador.close()
console.log(log.join('\n'))
