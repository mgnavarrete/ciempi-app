// Comparación píxel a píxel: recomponer la escena con cada unidad (camino
// anterior) contra la escena creciente (componer una vez con nMax y revelar).
//
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules \
//     node docs/expansion-ciempi/animacion/medicion/capturas.mjs
//
// 1. Rig aislado (`banco.comparar`): mismos n, conjunto y pose A02 en varios
//    instantes, sin animar (t = −1 = composición tal cual) y animado.
// 2. Componente real <Ciempi> del carril (84 px) con movimiento reducido (no
//    anima: estado fijo), en ambos modos.
// Guarda las láminas en capturas/ y el detalle en resultados/pixeles.json.
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CHROMIUM, chromium, servir } from './servir.mjs'

const sharp = createRequire(import.meta.url)('sharp')
const aqui = dirname(fileURLToPath(import.meta.url))
const dirCapturas = join(aqui, 'capturas')
mkdirSync(dirCapturas, { recursive: true })
mkdirSync(join(aqui, 'resultados'), { recursive: true })

const { urls: [url], cerrar } = await servir([join(aqui, 'banco.html')], 'capturas')
const navegador = await chromium.launch({ executablePath: CHROMIUM })

/** Píxeles distintos entre dos PNG del mismo tamaño (y la mayor diferencia de canal). */
async function diferencia(a, b) {
  const [x, y] = await Promise.all([a, b].map((p) => sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true })))
  if (x.info.width !== y.info.width || x.info.height !== y.info.height) return { distintos: -1, max: 255, tamano: [x.info, y.info].map((i) => `${i.width}x${i.height}`) }
  let distintos = 0, max = 0
  for (let i = 0; i < x.data.length; i += 4) {
    let d = 0
    for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(x.data[i + c] - y.data[i + c]))
    if (d > 0) distintos++
    max = Math.max(max, d)
  }
  return { distintos, max, total: x.info.width * x.info.height }
}

const resultados = { rig: [], componente: [] }
const conjuntos = ['tipico', 'base', 'mascara']
const largos = [0, 1, 2, 3, 4, 5, 6, 12, 40]

// 1. Rig aislado.
{
  const ctx = await navegador.newContext({ viewport: { width: 700, height: 900 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(url)
  await page.waitForFunction(() => window.banco?.listo(), null, { timeout: 30000 })
  for (const conjunto of conjuntos)
    for (const n of largos)
      for (const t of [-1, 0.37, 1.21]) {
        // Uno por vez, en el mismo lugar de la página (evita diferencias de posición subpíxel).
        const fotos = []
        for (const m of ['porN', 'creciente']) {
          await page.evaluate((o) => window.banco.comparar(o), { conjunto, n, t, modos: [m] })
          fotos.push(await page.locator(`[data-comparar="${m}"]`).screenshot())
        }
        const [a, b] = fotos
        const d = await diferencia(a, b)
        resultados.rig.push({ conjunto, n, t, ...d })
        if (t === 0.37 && [0, 5, 12, 40].includes(n)) {
          writeFileSync(join(dirCapturas, `rig-${conjunto}-n${n}-recomponer.png`), a)
          writeFileSync(join(dirCapturas, `rig-${conjunto}-n${n}-revelar.png`), b)
        }
        console.log(`rig ${conjunto} n=${n} t=${t}: ${d.distintos} píxeles distintos (máx ${d.max})`)
      }
  await ctx.close()
}

// 2. Componente real del carril, con movimiento reducido (estado fijo).
{
  const ctx = await navegador.newContext({ viewport: { width: 412, height: 320 }, deviceScaleFactor: 4, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(url)
  await page.waitForFunction(() => window.banco?.listo(), null, { timeout: 30000 })
  for (const conjunto of conjuntos)
    for (const n of largos) {
      const fotos = []
      for (const crecimiento of ['recomponer', 'revelar']) {
        await page.evaluate((o) => window.banco.mostrar(o), { n, conjunto, extra: { crecimiento } })
        await page.waitForTimeout(150)
        fotos.push(await page.locator('#root svg').first().screenshot())
      }
      const d = await diferencia(...fotos)
      resultados.componente.push({ conjunto, n, ...d })
      if ([0, 5, 40].includes(n)) fotos.forEach((f, i) => writeFileSync(join(dirCapturas, `carril-${conjunto}-n${n}-${i ? 'revelar' : 'recomponer'}.png`), f))
      console.log(`carril ${conjunto} n=${n}: ${d.distintos} píxeles distintos (máx ${d.max})`)
    }
  await ctx.close()
}

writeFileSync(join(aqui, 'resultados', 'pixeles.json'), JSON.stringify(resultados, null, 1))
const malos = [...resultados.rig, ...resultados.componente].filter((r) => r.distintos !== 0)
console.log(malos.length ? `DIFERENCIAS en ${malos.length} casos` : `Idénticos en los ${resultados.rig.length + resultados.componente.length} casos`)
await navegador.close()
await cerrar()
