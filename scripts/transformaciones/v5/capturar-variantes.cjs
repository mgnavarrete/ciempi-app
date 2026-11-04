#!/usr/bin/env node
// Captura las 4 láminas de variantes V5 (laminas-v4.html?tipo=variantes) y comprueba la consola.
// Uso: python3 -m http.server 8840 --bind 127.0.0.1 (raíz del worktree) y
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node scripts/transformaciones/v5/capturar-variantes.cjs [destino] [especie…]
// No sobrescribe: si el PNG ya existe, guarda <nombre>-<n>.png.
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')
const URL_BASE = process.env.LAB_URL || 'http://127.0.0.1:8840/docs/rediseno-ciempi/laboratorio-transformaciones/'
const CHROME = process.env.CHROME || '/home/menta/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
const destino = process.argv[2] || 'docs/rediseno-ciempi/revisiones/V5-variantes'
const NOMBRES = { dragon: 'lamina-dragones', cuncuna: 'lamina-cuncunas', serpiente: 'lamina-serpientes', camaleon: 'lamina-camaleones' }
const especies = process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(NOMBRES)
const libre = (base) => { let f = path.join(destino, base + '.png'), i = 2; while (fs.existsSync(f)) f = path.join(destino, `${base}-${i++}.png`); return f }
;(async () => {
  const nav = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {})
  let fallos = 0
  for (const e of especies) {
    const p = await nav.newPage({ viewport: { width: 1420, height: 900 } })
    const errores = []
    p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(m.text()) })
    p.on('pageerror', (x) => errores.push(x.message))
    await p.goto(URL_BASE + `laminas-v4.html?tipo=variantes&especie=${e}`)
    await p.waitForSelector('body[data-cargado]', { timeout: 180000 })
    const estado = await p.evaluate(() => document.body.dataset.cargado)
    await p.waitForTimeout(300)
    const f = libre(NOMBRES[e])
    await p.screenshot({ path: f, fullPage: true })
    console.log(`${e}: ${estado === '1' ? 'OK' : 'ERROR'} · ${errores.length} errores de consola → ${f}`)
    if (errores.length) console.log('  ' + errores.join('\n  '))
    if (estado !== '1' || errores.length) fallos++
    await p.close()
  }
  await nav.close()
  process.exit(fallos ? 1 : 0)
})()
