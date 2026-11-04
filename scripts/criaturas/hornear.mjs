#!/usr/bin/env node
// Hornea el tinte de las variantes no base: ejecuta en Chromium el MISMO tinte en
// vivo del juego (src/ciempi/v2/criaturas/tinte.ts) y guarda cada pieza teñida como
// WebP con pérdida de alta calidad (q 92, alfa 100; decisión del coordinador: el PNG
// exacto pesaba 23 MiB, casi lo mismo que la APK), más el índice
// src/ciempi/v2/criaturas/horneadas.generado.ts. Requiere public/criaturas/ copiado
// (copiar-recursos.mjs). Motivo: con la CPU frenada 4× el tinte en vivo tarda 0,8–1,7 s.
//
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node scripts/criaturas/hornear.mjs
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const sharp = require('sharp')
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CHROMIUM = process.env.CHROMIUM || join(process.env.HOME, '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
const PUERTO = Number(process.env.PUERTO_JUEGO || 8853)
const destino = join(raiz, 'public/criaturas/horneadas')
/** Calidad WebP por omisión y, si alguna variante se viera peor, la suya. */
const CALIDAD = Number(process.env.CALIDAD || 92)
const CALIDAD_DE = {}
/**
 * Control por pieza, sobre los píxeles opacos (alfa ≥ 250): fracción que difiere en más de 6
 * en algún canal. Es informativo; la tolerancia que manda es la del render (paridad.mjs).
 */

const vite = await createServer({ root: raiz, configFile: false, logLevel: 'warn', server: { port: PUERTO, host: '127.0.0.1', strictPort: true } })
await vite.listen()
const navegador = await chromium.launch({ executablePath: CHROMIUM })
try {
  const p = await navegador.newPage()
  p.on('pageerror', (e) => { throw e })
  await p.goto(`http://127.0.0.1:${PUERTO}/scripts/criaturas/paridad/juego.html?sinHornear`)
  await p.waitForSelector('body[data-listo]', { state: 'attached', timeout: 120000 })
  const { VARIANTES } = await vite.ssrLoadModule('/src/ciempi/v2/criaturas/datos.ts')
  rmSync(destino, { recursive: true, force: true, maxRetries: 3 })
  const indice = {}
  let archivos = 0, bytes = 0
  const peor = {}
  for (const v of VARIANTES.filter((x) => !x.base || x.torreta)) {
    const piezas = await p.evaluate(async (id) => {
      await window.paridad.preparar(id)
      const hechos = window.paridad.tintesHechos.filter((t) => t[1] === id)
      return Promise.all(hechos.map(async ([url, , pieza, claves, blob]) => {
        const datos = new Uint8Array(await (await fetch(await blob)).arrayBuffer())
        let bin = ''
        for (let i = 0; i < datos.length; i += 0x8000) bin += String.fromCharCode(...datos.subarray(i, i + 0x8000))
        return { url, pieza, claves, png: btoa(bin) }
      }))
    }, v.id)
    indice[v.id] = {}
    mkdirSync(join(destino, v.id), { recursive: true })
    for (const { url, pieza, claves, png } of piezas) {
      const rel = url.replace(/^\/criaturas\//, '')
      const nombre = `${rel.replace(/\.webp$/, '').replace(/\//g, '_')}--${pieza}${claves ? '--' + claves.replace(/,/g, '+') : ''}.webp`
      const salida = join(destino, v.id, nombre)
      await sharp(Buffer.from(png, 'base64')).webp({ quality: CALIDAD_DE[v.id] ?? CALIDAD, alphaQuality: 100, effort: 6 }).toFile(salida)
      // Fidelidad frente al PNG del tinte en vivo (informativa).
      const [a, b] = await Promise.all([Buffer.from(png, 'base64'), salida].map((x) => sharp(x).ensureAlpha().raw().toBuffer()))
      let visibles = 0, lejos = 0
      for (let i = 0; i < a.length; i += 4) {
        if (a[i + 3] < 250) continue
        visibles++
        if (Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])) > 6) lejos++
      }
      peor[v.id] = Math.max(peor[v.id] ?? 0, visibles ? lejos / visibles : 0)
      indice[v.id][`${rel}|${pieza}|${claves}`] = `horneadas/${v.id}/${nombre}`
      archivos++; bytes += statSync(salida).size
    }
    console.log(`${v.id.padEnd(20)} ${piezas.length} piezas · q ${CALIDAD_DE[v.id] ?? CALIDAD} · peor pieza ${((peor[v.id] ?? 0) * 100).toFixed(1)} % px opacos > 6`)
  }
  writeFileSync(join(raiz, 'src/ciempi/v2/criaturas/horneadas.generado.ts'),
    `// GENERADO por scripts/criaturas/hornear.mjs: no editar a mano.\n// Variante → (<ruta en public/criaturas>|<pieza>|<claves> → archivo horneado).\nexport const HORNEADAS: Readonly<Record<string, Readonly<Record<string, string>>>> = ${JSON.stringify(indice, null, 1)}\n`)
  console.log(`${archivos} piezas horneadas en public/criaturas/horneadas/ (${(bytes / 1024 / 1024).toFixed(2)} MiB).`)
} finally {
  await navegador.close()
  await vite.close()
}
