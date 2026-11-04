// Lámina de las 10 comidas (grande, pista 1:1 y tienda). Uso: node scripts/frutas/lamina-comida.mjs <raiz> <salida.png> <titulo>
// Uso: node lamina.mjs <raizWorktree> <salida.png> <titulo>
import { createRequire } from 'node:module'
const req = createRequire('/mnt/d/Proyectos/ciempi-app/package.json')
const { createServer } = await import(req.resolve('vite'))
import fs from 'node:fs'
import path from 'node:path'
const [raiz, salida, titulo] = process.argv.slice(2)
const entry = path.join(path.dirname(new URL(import.meta.url).pathname), 'lamina-comida.tsx')
const vite = await createServer({ root: raiz, configFile: false, logLevel: 'error', server: { middlewareMode: true, fs: { allow: ['/'] } }, appType: 'custom' })
const { lamina } = await vite.ssrLoadModule(entry)
let html = lamina(titulo).replaceAll('href="/ciempi-v2/', `href="file://${raiz}/public/ciempi-v2/`)
await vite.close()
const htmlPath = salida.replace(/\.png$/, '.html')
fs.writeFileSync(htmlPath, html)
const { chromium } = createRequire('/home/menta/.npm/_npx/705bc6b22212b352/node_modules/x.js')('playwright')
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome', args: ['--allow-file-access-from-files'] })
const p = await b.newPage({ viewport: { width: 1840, height: 400 } })
await p.goto('file://' + htmlPath)
await p.waitForTimeout(500)
// Ampliación x3 con los píxeles reales de la pista (tamano 10) a 1:1.
const real = await p.locator('.p').first().screenshot()
await p.evaluate((b64) => {
  const z = document.querySelector('.z')
  z.style.transform = 'none'
  z.innerHTML = `<img src="data:image/png;base64,${b64}" style="image-rendering:pixelated" onload="this.style.width=this.naturalWidth*3+'px'">`
}, real.toString('base64'))
await p.waitForTimeout(300)
await p.screenshot({ path: salida, fullPage: true })
await b.close()
fs.unlinkSync(htmlPath)
console.log('OK', salida)
