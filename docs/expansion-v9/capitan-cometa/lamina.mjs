// Compila la lámina (lamina.html) sobre un árbol del proyecto, la sirve con
// `vite preview` en el puerto 5190 y la fotografía con Playwright.
//
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules \
//     node docs/expansion-v9/capitan-cometa/lamina.mjs <raíz del árbol> <salida.png> <carpeta de compilación> [título]
//
// Para el «antes», copiar lamina.html y lamina.tsx a la misma ruta de un árbol
// anterior (git archive) y pasar esa raíz: la página usa el camino real del
// juego (Vestuario → useEscena → rig) de ese árbol.
import { build, preview } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const [raizArg, salida, outDir, titulo = 'Capitán Ciempi'] = process.argv.slice(2)
const raiz = resolve(raizArg)
const { chromium } = createRequire(import.meta.url)('playwright')
const CHROMIUM = process.env.CHROMIUM || join(process.env.HOME, '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
const { version } = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8'))
const pagina = join(raiz, 'docs/expansion-v9/capitan-cometa/lamina.html')
await build({
  root: raiz, logLevel: 'warn', configFile: false, plugins: [react(), tailwindcss()],
  define: { __VERSION_APP__: JSON.stringify(version), __COMPILACION_APP__: '"lamina"' },
  build: { outDir: resolve(outDir), emptyOutDir: true, rollupOptions: { input: [pagina] } },
})
const servidor = await preview({ root: raiz, configFile: false, logLevel: 'warn', build: { outDir: resolve(outDir) }, preview: { port: 5190, host: '127.0.0.1', strictPort: true } })
const navegador = await chromium.launch({ executablePath: CHROMIUM })
try {
  const page = await navegador.newPage({ viewport: { width: 1900, height: 3000 }, deviceScaleFactor: 1.5 })
  page.on('console', (m) => m.type() === 'error' && console.error('página:', m.text()))
  await page.goto(`http://127.0.0.1:5190/docs/expansion-v9/capitan-cometa/lamina.html?titulo=${encodeURIComponent(titulo)}`)
  await page.waitForFunction(() => window.lamina?.listo(), null, { timeout: 120000 })
  await page.evaluate(() => window.lamina.decodificar())
  await page.waitForTimeout(500)
  writeFileSync(salida, await page.locator('#lamina').screenshot())
  console.log('lámina:', salida)
} finally {
  await navegador.close()
  servidor.httpServer.close()
}
