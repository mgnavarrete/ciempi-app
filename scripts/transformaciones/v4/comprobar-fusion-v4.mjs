// Copia V4 de docs/expansion-ciempi/animacion/fusion-especies/comprobar-fusion.mjs para T03 Serpiente y T04 Camaleón.
// Demuestra que escenaCreciente(…, forma) + rig.crecer(n) es idéntico (píxel a píxel y encuadre) a escena(…, forma) + rig,
// y que E08 no dibuja boca con máscaras que la tapan. Ciempi se incluye como control.
// Uso (raíz del worktree, servidor en LAB_PUERTO, 8803 por omisión):
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules SALIDA=docs/rediseno-ciempi/revisiones/T03-serpiente-v1/fusion node scripts/transformaciones/v4/comprobar-fusion-v4.mjs
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
const req = createRequire(import.meta.url)
const { chromium } = req('playwright'), sharp = req('sharp')
const CH = process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
const SAL = process.env.SALIDA || './salida-fusion-v4'; const PUERTO = process.env.LAB_PUERTO || '8803'; mkdirSync(SAL, { recursive: true })
async function dif(a, b) {
  const [x, y] = await Promise.all([a, b].map((p) => sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true })))
  if (x.info.width !== y.info.width || x.info.height !== y.info.height) return { distintos: -1, tam: [x.info.width, x.info.height, y.info.width, y.info.height] }
  let d = 0, m = 0
  for (let i = 0; i < x.data.length; i += 4) { let q = 0; for (let c = 0; c < 4; c++) q = Math.max(q, Math.abs(x.data[i + c] - y.data[i + c])); if (q) d++; m = Math.max(m, q) }
  return { distintos: d, max: m }
}
const nav = await chromium.launch({ executablePath: CH })
const ctx = await nav.newContext({ viewport: { width: 700, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
const errores = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(m.text()) })
page.on('pageerror', (e) => errores.push(String(e)))
await page.goto(`http://127.0.0.1:${PUERTO}/docs/rediseno-ciempi/laboratorio-transformaciones/comprobar-crecer-v4.html`)
await page.waitForFunction(() => window.comprobar?.listo(), null, { timeout: 60000 })
const SELS = {
  base: {},
  tipico: { cabeza: 'b06-ia-mago', espalda: 'b08-ia-heroica', textura: 'b11-mago' },
  mochila: { espalda: 'b09-aventura', pies: 'b10-robot' },
  robot: { cabeza: 'b07-ia-robot' },
}
const res = { crecer: [], bocas: [], errores }
for (const especie of ['serpiente', 'camaleon', 'ciempi'])
  for (const [nombre, sel] of Object.entries({ ...SELS, ...(especie === 'camaleon' ? { camuflaje: { cabeza: 'b07-ia-robot', textura: 'b11-robot', pies: 'b10-robot', espalda: 'b09-robot' } } : {}), ...(especie === 'serpiente' ? { sinLengua: { lengua: 'no', espalda: 'b09-aventura' } } : {}) }))
    for (const n of [0, 1, 2, 3, 4, 5, 6, 12, 40])
      for (const t of [-1, 0.37]) {
        // Uno por vez, en el mismo lugar de la página (como capturas.mjs: evita diferencias subpíxel).
        const o1 = await page.evaluate((a) => window.comprobar.comparar(a), { especie, sel, n, t, modo: 'escena' })
        const a = await page.locator('svg[data-modo="escena"]').screenshot()
        const o2 = await page.evaluate((a) => window.comprobar.comparar(a), { especie, sel, n, t, modo: 'creciente' })
        const b = await page.locator('svg[data-modo="creciente"]').screenshot()
        const o = { ...o1, ...o2 }
        const d = await dif(a, b)
        res.crecer.push({ especie, conjunto: nombre, n, t, ...o, ...d })
        if (t === -1 && [1, 5, 12].includes(n) && ['base', 'tipico'].includes(nombre)) { writeFileSync(`${SAL}/${especie}-${nombre}-n${n}-escena.png`, a); writeFileSync(`${SAL}/${especie}-${nombre}-n${n}-creciente.png`, b) }
        console.log(especie, nombre, 'n=' + n, 't=' + t, d.distintos, o.escena === o.creciente ? '' : `VIEWBOX ${o.escena} != ${o.creciente}`)
      }
const tapan = await page.evaluate(() => window.comprobar.tapan())
const cabezas = await page.evaluate(() => window.comprobar.cabezas())
console.log('tapan la boca (catálogo):', tapan, '\ncabezas:', cabezas)
for (const especie of ['ciempi', 'serpiente', 'camaleon'])
  for (const cabeza of ['cabeza-nada', ...cabezas]) {
    for (const forzar of [false, ...(tapan.includes(cabeza) ? [true] : [])])
      for (const boca of ['sorprendido', 'carcajada']) {
        const r = await page.evaluate((a) => window.comprobar.bocas(a), { especie, cabeza, forzarConBoca: forzar, boca })
        r.boca = boca
        res.bocas.push(r); console.log('bocas', JSON.stringify(r))
      }
  }
res.tapan = tapan
writeFileSync(`${SAL}/fusion.json`, JSON.stringify(res, null, 1))
const malos = res.crecer.filter((r) => r.distintos !== 0 || r.escena !== r.creciente || r.crecer !== true)
console.log(`crecer: ${res.crecer.length - malos.length}/${res.crecer.length} idénticos`, malos.length ? malos : '')
console.log('errores consola:', errores.length, errores.slice(0, 5))
await nav.close()
