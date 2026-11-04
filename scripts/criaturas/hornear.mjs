#!/usr/bin/env node
// Hornea el tinte de las variantes no base: ejecuta en Chromium el MISMO tinte en
// vivo del juego (src/ciempi/v2/criaturas/tinte.ts) y guarda cada pieza teñida como
// PNG recomprimido (mismos píxeles RGBA que el PNG del tinte en vivo; Chromium
// decodifica un WebP sin pérdida con otro redondeo de alfa: ±2 en 20–50 mil píxeles), más el índice
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
      const nombre = `${rel.replace(/\.webp$/, '').replace(/\//g, '_')}--${pieza}${claves ? '--' + claves.replace(/,/g, '+') : ''}.png`
      const salida = join(destino, v.id, nombre)
      await sharp(Buffer.from(png, 'base64')).png({ compressionLevel: 9, adaptiveFiltering: true, palette: false }).toFile(salida)
      // Comprobación: los píxeles visibles son los del PNG del tinte en vivo.
      const [a, b] = await Promise.all([Buffer.from(png, 'base64'), salida].map((x) => sharp(x).ensureAlpha().raw().toBuffer()))
      let visibles = 0
      for (let i = 0; i < a.length; i += 4) if ((a[i + 3] || b[i + 3]) && (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3])) visibles++
      if (visibles) throw Error(`El PNG horneado no conserva ${visibles} píxeles visibles: ${salida}`)
      indice[v.id][`${rel}|${pieza}|${claves}`] = `horneadas/${v.id}/${nombre}`
      archivos++; bytes += statSync(salida).size
    }
    console.log(`${v.id.padEnd(20)} ${piezas.length} piezas`)
  }
  writeFileSync(join(raiz, 'src/ciempi/v2/criaturas/horneadas.generado.ts'),
    `// GENERADO por scripts/criaturas/hornear.mjs: no editar a mano.\n// Variante → (<ruta en public/criaturas>|<pieza>|<claves> → archivo horneado).\nexport const HORNEADAS: Readonly<Record<string, Readonly<Record<string, string>>>> = ${JSON.stringify(indice, null, 1)}\n`)
  console.log(`${archivos} piezas horneadas en public/criaturas/horneadas/ (${(bytes / 1024 / 1024).toFixed(2)} MiB).`)
} finally {
  await navegador.close()
  await vite.close()
}
