#!/usr/bin/env node
// Paridad píxel a píxel: render del JUEGO (src/ciempi/v2/criaturas) frente al del
// LABORATORIO aprobado (docs/rediseno-ciempi/laboratorio-transformaciones), para las
// 23 variantes, N = 5 y 12 y varias selecciones de vestuario.
//
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node scripts/criaturas/paridad.mjs
//
// Levanta Vite (juego, PUERTO_JUEGO=8850) y python http.server (laboratorio,
// PUERTO_LAB=8851) en la raíz del repositorio y los detiene al terminar.
// Dos modos:
//  - por omisión, con el tinte horneado (WebP con pérdida): tolerancia visual por caso.
//    Un WebP con pérdida mueve casi todos los píxeles teñidos 1–3 niveles y, por el
//    submuestreo de color, algunos píxeles sueltos del contorno bastante más: se mide
//    la fracción de píxeles que difieren en más de 6, 12 y 24 niveles (en algún canal)
//    y se exige ≤ TOL_12 (1 %) con más de 12 y ≤ TOL_24 (0,1 %) con más de 24;
//  - SIN_HORNEAR=1, con el tinte en vivo: exige igualdad exacta (el código es el del laboratorio).
// Escribe el detalle en $SALIDA (por omisión, el directorio temporal) y, si hay
// diferencias, las dos capturas de cada caso distinto.
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const sharp = require('sharp')
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CHROMIUM = process.env.CHROMIUM || join(process.env.HOME, '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
const PUERTO_JUEGO = Number(process.env.PUERTO_JUEGO || 8850), PUERTO_LAB = Number(process.env.PUERTO_LAB || 8851)
const SALIDA = process.env.SALIDA || join(tmpdir(), 'paridad-criaturas')
mkdirSync(SALIDA, { recursive: true })

/** Selecciones de vestuario (claves del compositor; las mismas en las dos páginas). */
const SELECCIONES = {
  inicial: {},
  'mago+bufanda+deportiva': { cabeza: 'b06-ia-mago', cuello: 'bufanda-calco32', variante: 'gryffindor', pies: 'b10-deportiva', expresion: 'b03-curioso' },
  'gatita+draco+mochila': { cabeza: 'b07-ia-gatita', textura: 'b11-draco', espalda: 'b09-aventura', expresion: 'b03-carcajada' },
}
const LARGOS = [5, 12]
const EXACTO = !!process.env.SIN_HORNEAR
const TOL_12 = Number(process.env.TOL_12 ?? 0.01), TOL_24 = Number(process.env.TOL_24 ?? 0.001)
const pasa = (d) => d.distintos >= 0 && (EXACTO ? d.distintos === 0 : d.mas12 <= d.total * TOL_12 && d.mas24 <= d.total * TOL_24)

const vite = await createServer({ root: raiz, configFile: false, logLevel: 'warn', server: { port: PUERTO_JUEGO, host: '127.0.0.1', strictPort: true } })
await vite.listen()
const python = spawn('python3', ['-m', 'http.server', String(PUERTO_LAB), '--bind', '127.0.0.1'], { cwd: raiz, stdio: 'ignore' })
const cerrar = async () => { python.kill(); await vite.close() }
process.on('SIGINT', async () => { await cerrar(); process.exit(1) })

async function diferencia(a, b) {
  const [x, y] = await Promise.all([a, b].map((p) => sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true })))
  if (x.info.width !== y.info.width || x.info.height !== y.info.height) return { distintos: -1, max: 255 }
  let distintos = 0, max = 0, mas6 = 0, mas12 = 0, mas24 = 0
  for (let i = 0; i < x.data.length; i += 4) {
    let d = 0
    for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(x.data[i + c] - y.data[i + c]))
    if (d > 0) distintos++
    if (d > 6) mas6++
    if (d > 12) mas12++
    if (d > 24) mas24++
    max = Math.max(max, d)
  }
  return { distintos, max, mas6, mas12, mas24, total: x.info.width * x.info.height }
}

const resultados = []
let navegador
try {
  await new Promise((ok) => setTimeout(ok, 800))
  // Rasterizado por software y espera larga: sin esto el mismo render da píxeles distintos entre dos capturas.
  navegador = await chromium.launch({ executablePath: CHROMIUM, args: ['--disable-gpu', '--disable-gpu-rasterization', '--disable-partial-raster', '--force-color-profile=srgb'] })
  const abrir = async (url) => {
    const ctx = await navegador.newContext({ viewport: { width: 700, height: 600 }, deviceScaleFactor: 1 })
    const p = await ctx.newPage()
    const errores = []
    p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()) })
    p.on('pageerror', (e) => errores.push(e.message))
    await p.goto(url)
    await p.waitForSelector('body[data-listo]', { state: 'attached', timeout: 120000 })
    return { p, errores }
  }
  const lab = await abrir(`http://127.0.0.1:${PUERTO_LAB}/scripts/criaturas/paridad/lab.html?espera=400`)
  const juego = await abrir(`http://127.0.0.1:${PUERTO_JUEGO}/scripts/criaturas/paridad/juego.html?espera=400${EXACTO ? '&sinHornear' : ''}`)
  const variantes = await lab.p.evaluate(() => window.paridad.variantes)
  if (variantes.length !== 23) throw Error(`El laboratorio tiene ${variantes.length} variantes (se esperaban 23)`)
  for (const id of variantes)
    for (const [nombre, extra] of Object.entries(SELECCIONES))
      for (const n of LARGOS) {
        const fotos = []
        for (const { p } of [lab, juego]) {
          const info = await p.evaluate(({ id, extra, n }) => window.paridad.dibujar(id, { ...window.paridad.inicial, ...extra }, n), { id, extra, n })
          fotos.push({ info, png: await p.locator('#lienzo > svg').screenshot() })
        }
        const d = await diferencia(fotos[0].png, fotos[1].png)
        const caso = { id, seleccion: nombre, n, ...d, tamano: `${fotos[0].info.ancho}x${fotos[0].info.alto}`, imagenes: [fotos[0].info.imagenes, fotos[1].info.imagenes] }
        resultados.push(caso)
        if (!pasa(d)) {
          writeFileSync(join(SALIDA, `${id}-${nombre}-${n}-lab.png`), fotos[0].png)
          writeFileSync(join(SALIDA, `${id}-${nombre}-${n}-juego.png`), fotos[1].png)
        }
        console.log(`${d.distintos === 0 ? 'igual ' : pasa(d) ? 'tolera' : 'FALLA '} ${id} · ${nombre} · N=${n} · ${caso.tamano}${d.distintos ? ` · >6: ${(100 * d.mas6 / d.total).toFixed(2)} % · >12: ${(100 * d.mas12 / d.total).toFixed(3)} % · >24: ${(100 * d.mas24 / d.total).toFixed(4)} % · máx ${d.max}` : ''}`)
      }
  const iguales = resultados.filter((r) => r.distintos === 0).length, pasan = resultados.filter(pasa).length
  // Resumen por variante: peor caso.
  for (const id of variantes) {
    const rs = resultados.filter((r) => r.id === id)
    const peor = (k) => Math.max(...rs.map((r) => (100 * r[k]) / r.total))
    console.log(`  ${id.padEnd(20)} ${rs.filter(pasa).length}/${rs.length} · peor caso: distintos ${peor('distintos').toFixed(1)} % · >6 ${peor('mas6').toFixed(2)} % · >12 ${peor('mas12').toFixed(3)} % · >24 ${peor('mas24').toFixed(4)} % · máx ${Math.max(...rs.map((r) => r.max))}`)
  }
  const errores = [...lab.errores.map((e) => 'lab: ' + e), ...juego.errores.map((e) => 'juego: ' + e)]
  writeFileSync(join(SALIDA, 'paridad.json'), JSON.stringify({ modo: EXACTO ? 'exacto' : 'tolerancia', TOL_12, TOL_24, pasan, iguales, total: resultados.length, errores, resultados }, null, 1))
  console.log(`\nParidad (${EXACTO ? 'exacta, tinte en vivo' : `tolerancia: ≤ ${TOL_12 * 100} % px con >12 y ≤ ${TOL_24 * 100} % con >24`}): ${pasan}/${resultados.length} pasan, ${iguales} idénticos (23 variantes × ${Object.keys(SELECCIONES).length} selecciones × N = ${LARGOS.join(', ')}). Errores de consola: ${errores.length}.`)
  for (const e of errores) console.log('  ' + e)
  process.exitCode = pasan === resultados.length && !errores.length ? 0 : 1
} finally {
  await navegador?.close()
  await cerrar()
}
