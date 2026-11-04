#!/usr/bin/env node
// Monta los componentes reales del juego (scripts/criaturas/componente/) con Ciempi y
// cada una de las 23 variantes: N = 1, 5 y 12, vestida (gorro, mochila, calzado),
// con máscara y textura, y el carril de lectura creciendo de 0 a 40 con E08 y
// animaciones del rig. Exige consola sin errores ni avisos y comprueba el DOM.
//
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node scripts/criaturas/componentes.mjs
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { createServer } from 'vite'

const { chromium } = createRequire(import.meta.url)('playwright')
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CHROMIUM = process.env.CHROMIUM || join(process.env.HOME, '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
const PUERTO = Number(process.env.PUERTO_JUEGO || 8857)
const SALIDA = process.env.SALIDA || join(tmpdir(), 'componentes-criaturas')
mkdirSync(SALIDA, { recursive: true })

const vite = await createServer({ root: raiz, configFile: false, logLevel: 'warn', plugins: [react()], define: { __VERSION_APP__: '"prueba"' }, server: { port: PUERTO, host: '127.0.0.1', strictPort: true } })
await vite.listen()
const navegador = await chromium.launch({ executablePath: CHROMIUM })
const { VARIANTES } = await vite.ssrLoadModule('/src/ciempi/v2/criaturas/datos.ts')
let fallos = 0
try {
  for (const id of [null, ...VARIANTES.map((v) => v.id)]) {
    const p = await navegador.newPage({ viewport: { width: 1400, height: 700 } })
    const errores = []
    p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(`${m.type()}: ${m.text()}`) })
    p.on('pageerror', (e) => errores.push('pageerror: ' + e.message))
    await p.goto(`http://127.0.0.1:${PUERTO}/scripts/criaturas/componente/componente.html${id ? '?v=' + id : ''}`)
    await p.waitForSelector('body[data-crecio="40"]', { state: 'attached', timeout: 120000 })
    await p.waitForTimeout(1500) // animaciones A03/A04, E08 y parpadeo en marcha
    const r = await p.evaluate(() => {
      const caso = (c) => document.querySelector(`[data-caso="${c}"]`)
      const svgs = (c) => caso(c)?.querySelectorAll('svg[data-ciempi="v2"], g[data-ciempi="v2"]').length ?? 0
      const criatura = (c) => caso(c)?.querySelectorAll('image[href^="/criaturas/"]').length ?? 0
      const vestida = caso('vestida')
      return {
        nuevos: ['n1', 'n5', 'n12', 'vestida', 'mascara', 'carril'].map(svgs),
        criatura: ['n1', 'n5', 'n12', 'vestida', 'mascara', 'carril'].map(criatura),
        segmentos12: caso('n12').querySelectorAll('g[id$="-body"] > g[data-role]').length,
        carrilVisibles: [...caso('carril').querySelectorAll('g[id$="-body"] > g[data-role]')].filter((g) => getComputedStyle(g).display !== 'none' && g.getAttribute('visibility') !== 'hidden').length,
        zapatillaCola: vestida.querySelectorAll('[data-zapatilla-cola]').length,
        calzados: vestida.querySelectorAll('[data-footwear]').length,
        gorro: vestida.querySelectorAll('[data-accessory], [data-hat], [data-costume]').length,
      }
    })
    const esperado = id ? r.criatura.every((x) => x > 0) : r.criatura.every((x) => x === 0)
    const serp = id?.startsWith('serpiente') ? r.zapatillaCola === 1 && r.calzados === 1 : r.zapatillaCola === 0
    const ok = !errores.length && r.nuevos.every((x) => x > 0) && esperado && serp && r.segmentos12 === 12
    if (!ok) fallos++
    await p.screenshot({ path: join(SALIDA, `${id ?? 'ciempi'}.png`) })
    console.log(`${ok ? 'ok   ' : 'FALLA'} ${(id ?? 'ciempi').padEnd(20)} ${JSON.stringify(r)}${errores.length ? '\n  ' + errores.slice(0, 5).join('\n  ') : ''}`)
    await p.close()
  }
  console.log(`\nComponentes: ${24 - fallos}/24 sin errores de consola y con el DOM esperado.`)
  process.exitCode = fallos ? 1 : 0
} finally {
  await navegador.close()
  await vite.close()
}
