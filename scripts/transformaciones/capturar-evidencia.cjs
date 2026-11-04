#!/usr/bin/env node
// Captura las láminas de evidencia del laboratorio de transformaciones con Playwright
// (no está en package.json: usar el de npx, sin instalar nada) y falla si hay
// errores de consola. Requiere el servidor estático en la raíz del worktree:
//   python3 -m http.server 8772 --bind 127.0.0.1
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node scripts/transformaciones/capturar-evidencia.cjs
// Escribe en docs/rediseno-ciempi/revisiones/T0x-*/evidencia/ (no toca auditoria/).
const path = require('node:path')
const fs = require('node:fs')
const { chromium } = require('playwright')
const raiz = path.resolve(__dirname, '..', '..')
const URL_BASE = process.env.LAB_URL || 'http://127.0.0.1:8772/docs/rediseno-ciempi/laboratorio-transformaciones/'
const CHROME = process.env.CHROME || '/home/menta/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
const DESTINO = { dragon: 'T01-dragon-v1', cuncuna: 'T02-cuncuna-v1', comun: 'T00-comparacion-v1' }
const trabajos = []
for (const especie of ['dragon', 'cuncuna']) {
  for (const tipo of ['crecimiento', 'accesorios', 'detalle', 'conjuntos', 'animacion']) trabajos.push({ especie, tipo, fondo: 'claro' })
  trabajos.push({ especie, tipo: 'accesorios', fondo: 'oscuro' })
}
for (const fondo of ['claro', 'oscuro']) trabajos.push({ especie: 'comun', tipo: 'comparacion', fondo })

;(async () => {
  const navegador = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {})
  const errores = []
  for (const t of trabajos) {
    const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 })
    pagina.on('console', (m) => { if (m.type() === 'error') errores.push(`${t.tipo}/${t.especie}: ${m.text()}`) })
    pagina.on('pageerror', (e) => errores.push(`${t.tipo}/${t.especie}: ${e.message}`))
    await pagina.goto(`${URL_BASE}laminas.html?tipo=${t.tipo}&especie=${t.especie === 'comun' ? 'dragon' : t.especie}&fondo=${t.fondo}`)
    await pagina.waitForSelector('body[data-cargado]', { timeout: 120000 })
    if ((await pagina.getAttribute('body', 'data-cargado')) !== '1') errores.push(`${t.tipo}/${t.especie}: la lámina no terminó`)
    await pagina.waitForTimeout(400)
    const dir = path.join(raiz, 'docs/rediseno-ciempi/revisiones', DESTINO[t.especie], 'evidencia')
    fs.mkdirSync(dir, { recursive: true })
    const archivo = path.join(dir, `${t.tipo}-${t.fondo}.png`)
    await pagina.screenshot({ path: archivo, fullPage: true })
    console.log(path.relative(raiz, archivo))
    await pagina.close()
  }
  await navegador.close()
  if (errores.length) { console.error('Errores de consola:\n' + errores.join('\n')); process.exit(1) }
  console.log('Sin errores de consola en', trabajos.length, 'láminas.')
})()
