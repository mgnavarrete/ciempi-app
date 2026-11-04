#!/usr/bin/env node
// Tiempo de preparación de una criatura (carga + tinte de piezas + rostros) con la
// CPU frenada (por omisión 4×) en Chromium, en frío (página nueva por variante), y
// tiempo de componer una escena (N = 12) ya preparada.
//
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node scripts/criaturas/medir.mjs [variante…]
//
// Usa la página de paridad del juego servida por Vite (PUERTO_JUEGO=8852).
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const { chromium } = createRequire(import.meta.url)('playwright')
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CHROMIUM = process.env.CHROMIUM || join(process.env.HOME, '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
const PUERTO = Number(process.env.PUERTO_JUEGO || 8852), FRENO = Number(process.env.FRENO || 4)
const variantes = process.argv.slice(2).length ? process.argv.slice(2) : ['dragon-clasico', 'dragon-fuego', 'cuncuna-clasica', 'cuncuna-arcoiris', 'serpiente-caramelo', 'serpiente-noche', 'camaleon-lima', 'camaleon-atardecer']

const vite = await createServer({ root: raiz, configFile: false, logLevel: 'warn', server: { port: PUERTO, host: '127.0.0.1', strictPort: true } })
await vite.listen()
const navegador = await chromium.launch({ executablePath: CHROMIUM })
try {
  // Calentar Vite (transformaciones) para no medirlas.
  { const p = await navegador.newPage(); await p.goto(`http://127.0.0.1:${PUERTO}/scripts/criaturas/paridad/juego.html`); await p.waitForSelector('body[data-listo]', { state: 'attached', timeout: 120000 }); await p.close() }
  console.log(`CPU frenada ${FRENO}× · preparación en frío (vestuario ya cargado) · componer N=12 ya preparado`)
  for (const id of variantes) {
    const ctx = await navegador.newContext()
    const p = await ctx.newPage()
    await p.goto(`http://127.0.0.1:${PUERTO}/scripts/criaturas/paridad/juego.html`)
    await p.waitForSelector('body[data-listo]', { state: 'attached', timeout: 120000 })
    const cdp = await ctx.newCDPSession(p)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: FRENO })
    const r = await p.evaluate(async (id) => {
      const ms = await window.paridad.preparar(id)
      const { piezas, ms: msTinte } = window.paridad.estadisticas
      const t = performance.now()
      const { componerCriatura } = await import('/src/ciempi/v2/criaturas/base.ts')
      const { escena } = await import('/src/ciempi/v2/pose.ts')
      const { formaDe } = await import('/src/ciempi/v2/criaturas/base.ts')
      const t0 = performance.now()
      escena(componerCriatura(window.paridad.inicial, id), 12, 'm', formaDe(id))
      return { ms, piezas, msTinte, componer: performance.now() - t0, imports: t0 - t }
    }, id)
    console.log(`${id.padEnd(20)} preparar ${r.ms.toFixed(0).padStart(5)} ms · ${String(r.piezas).padStart(2)} piezas teñidas · componer+escena ${r.componer.toFixed(0)} ms`)
    await ctx.close()
  }
} finally {
  await navegador.close()
  await vite.close()
}
