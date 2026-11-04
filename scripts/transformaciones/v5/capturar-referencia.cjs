#!/usr/bin/env node
// Captura una criatura del laboratorio a tamaño grande (referencia para IA o revisión).
// Uso: node capturar-referencia.cjs <especie> <salida.png> [selJSON] [ancho] [n]
const fs = require('node:fs')
const { chromium } = require('playwright')
const URL_BASE = process.env.LAB_URL || 'http://127.0.0.1:8840/docs/rediseno-ciempi/laboratorio-transformaciones/'
const CHROME = process.env.CHROME || '/home/menta/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
const [especie, salida, selJSON = '{}', ancho = '1000', n = '5'] = process.argv.slice(2)
;(async () => {
  const nav = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {})
  const p = await nav.newPage({ viewport: { width: +ancho + 40, height: 900 } })
  const errores = []
  p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()) })
  p.on('pageerror', (e) => errores.push(e.message))
  await p.goto(URL_BASE + 'laminas-v4.html?tipo=ninguno')
  await p.evaluate(async ([especie, sel, ancho, n]) => {
    const { INICIAL, escenaDe, dibujar } = await import('./nucleo.js')
    const raiz = document.querySelector('#lamina'); raiz.replaceChildren()
    const e = await escenaDe(especie, { ...INICIAL, ...sel }, n)
    const { svg } = dibujar(e, { ancho })
    svg.id = 'ref'; document.body.style.background = '#fff'; raiz.append(svg)
  }, [especie, JSON.parse(selJSON), +ancho, +n])
  await p.waitForTimeout(400)
  await (await p.$('#ref')).screenshot({ path: salida })
  if (errores.length) console.log('ERRORES:', errores.join(' | '))
  await nav.close()
})()
