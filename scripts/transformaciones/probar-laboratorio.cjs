#!/usr/bin/env node
// Pruebas de navegador del laboratorio de transformaciones (Playwright vía npx, sin instalar):
//  1. Ciempi idéntico: escena() de pose.ts@3e188ce (gen/pose-original.js) frente a la actual,
//     sin `forma` y con FORMA_CIEMPI, para N = 0, 1, 5, 12, 40 y varias selecciones.
//  2. El laboratorio se usa (criaturas, longitudes, conjuntos, accesorios, animación) sin errores de consola.
// Uso: python3 -m http.server 8772 --bind 127.0.0.1 (raíz del worktree) y
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node scripts/transformaciones/probar-laboratorio.cjs
const fs = require('node:fs')
const { chromium } = require('playwright')
const URL_BASE = process.env.LAB_URL || 'http://127.0.0.1:8772/docs/rediseno-ciempi/laboratorio-transformaciones/'
const CHROME = process.env.CHROME || '/home/menta/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'

;(async () => {
  const navegador = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {})
  const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1000 } })
  const errores = []
  pagina.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(`${m.type()}: ${m.text()}`) })
  pagina.on('pageerror', (e) => errores.push('pageerror: ' + e.message))
  await pagina.goto(URL_BASE + '?quieto')
  await pagina.waitForSelector('body[data-cargado]', { timeout: 120000 })

  // 1. Igualdad de Ciempi.
  const igualdad = await pagina.evaluate(async () => {
    const original = await import('./gen/pose-original.js')
    const actual = await import('./gen/pose.js')
    const { FORMA_CIEMPI } = await import('./gen/especie.js')
    const { renderCiempi } = await import('../../../src/ciempi/v2/arte/componer.js')
    const env = window.lab.env
    const base = { ...(await import('../../../src/ciempi/v2/arte/cargar.js')).defaults, expresion: 'b03-alegre' }
    const selecciones = [base, ...env.sets.slice(0, 5).map((s) => ({ ...base, ...s.seleccion })), { ...base, cuello: 'bufanda-calco32', pelo: 'b05-coletas', cara: 'b04-redondos', paleta: 'noche' }]
    const resultados = []
    for (const sel of selecciones) {
      const svg = renderCiempi(env, sel)
      for (const n of [0, 1, 5, 12, 40]) {
        const a = JSON.stringify(original.escena(svg, n, 'p'))
        const b = JSON.stringify(actual.escena(svg, n, 'p'))
        const c = JSON.stringify(actual.escena(svg, n, 'p', FORMA_CIEMPI))
        const r = JSON.stringify([original.roles(n), original.posiciones(n)])
        const r2 = JSON.stringify([actual.roles(n), actual.posiciones(n)])
        const r3 = JSON.stringify([actual.roles(n, FORMA_CIEMPI), actual.posiciones(n, FORMA_CIEMPI)])
        resultados.push({ n, sel: JSON.stringify(sel).length, sinForma: a === b, conFormaCiempi: a === c, roles: r === r2 && r === r3, bytes: a.length })
      }
    }
    return resultados
  })
  const fallos = igualdad.filter((r) => !r.sinForma || !r.conFormaCiempi || !r.roles)
  console.log(`Igualdad de Ciempi: ${igualdad.length - fallos.length}/${igualdad.length} casos idénticos (N = 0, 1, 5, 12, 40 × ${igualdad.length / 5} selecciones).`)

  // 2. Uso del laboratorio.
  const esperar = async () => { await pagina.waitForFunction(() => document.body.dataset.listo, null, { timeout: 60000 }); await pagina.waitForTimeout(150) }
  for (const especie of ['Ciempi', 'Ciempi Dragón', 'Ciempi Cuncuna']) {
    await pagina.click(`#criaturas button:text-is("${especie}")`); await esperar()
    for (const n of ['0', '1', '2', '8', '22', '40', '5']) { await pagina.click(`#n-rapidos button:text-is("${n}")`); await esperar() }
    for (const c of ['Robot Lumen', 'Luna bibliotecaria', 'Reino de relatos']) { await pagina.click(`#conjuntos button:text-is("${c}")`); await esperar() }
    await pagina.selectOption('#sel-espalda', 'dragon-alas'); await esperar()
    await pagina.selectOption('#sel-paleta', 'oceano'); await esperar()
    await pagina.click('#restaurar'); await esperar()
  }
  await pagina.selectOption('#anim', 'A10'); await pagina.click('#reproducir'); await pagina.waitForTimeout(1500); await pagina.click('#reproducir')
  await pagina.check('input[name=fondo][value=oscuro]')
  await pagina.selectOption('#comparar', 'cuncuna'); await esperar()
  const costo = await pagina.textContent('#costo')
  console.log('Animación:', costo)
  await navegador.close()
  if (errores.length) console.error('Errores de consola:\n' + errores.join('\n'))
  else console.log('Laboratorio: sin errores ni avisos de consola.')
  process.exit(fallos.length || errores.length ? 1 : 0)
})()
