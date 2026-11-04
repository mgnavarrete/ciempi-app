#!/usr/bin/env node
// Captura las láminas V4 (laminas-v4.html) en docs/rediseno-ciempi/revisiones/T03-serpiente-v1/evidencia
// y T04-camaleon-v1/evidencia, y falla si hay errores de consola. No toca T01/T02/T00 ni auditoria/.
//   python3 -m http.server 8803 --bind 127.0.0.1   (raíz del worktree)
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules LAB_URL=http://127.0.0.1:8803/docs/rediseno-ciempi/laboratorio-transformaciones/ node scripts/transformaciones/v4/capturar-evidencia-v4.cjs [tipo…]
const path = require('node:path')
const fs = require('node:fs')
const { chromium } = require('playwright')
const raiz = path.resolve(__dirname, '..', '..', '..')
const URL_BASE = process.env.LAB_URL || 'http://127.0.0.1:8803/docs/rediseno-ciempi/laboratorio-transformaciones/'
const CHROME = process.env.CHROME || '/home/menta/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
const DESTINO = { serpiente: 'T03-serpiente-v1', camaleon: 'T04-camaleon-v1' }
const filtro = process.argv.slice(2)
const trabajos = []
for (const especie of ['serpiente', 'camaleon']) {
  for (const fondo of ['claro', 'oscuro']) for (const tipo of ['crecimiento', 'expresiones', 'accesorios', 'comparacion']) trabajos.push({ especie, tipo, fondo })
  for (const tipo of ['conjuntos', 'comer', 'animacion']) trabajos.push({ especie, tipo, fondo: 'claro' })
}
trabajos.push({ especie: 'camaleon', tipo: 'camuflaje', fondo: 'claro' }, { especie: 'camaleon', tipo: 'camuflaje', fondo: 'oscuro' })

;(async () => {
  const navegador = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {})
  const errores = []
  for (const t of trabajos.filter((x) => !filtro.length || filtro.includes(x.tipo))) {
    const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 })
    pagina.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(`${t.tipo}/${t.especie}: ${m.text()}`) })
    pagina.on('pageerror', (e) => errores.push(`${t.tipo}/${t.especie}: ${e.message}`))
    await pagina.goto(`${URL_BASE}laminas-v4.html?tipo=${t.tipo}&especie=${t.especie}&fondo=${t.fondo}`)
    await pagina.waitForSelector('body[data-cargado]', { timeout: 180000 })
    if ((await pagina.getAttribute('body', 'data-cargado')) !== '1') errores.push(`${t.tipo}/${t.especie}: la lámina no terminó`)
    await pagina.waitForTimeout(500)
    const dir = path.join(raiz, 'docs/rediseno-ciempi/revisiones', DESTINO[t.especie], 'evidencia')
    fs.mkdirSync(dir, { recursive: true })
    const archivo = path.join(dir, `${t.tipo}-${t.fondo}.png`)
    await pagina.screenshot({ path: archivo, fullPage: true })
    console.log(path.relative(raiz, archivo))
    await pagina.close()
  }
  await navegador.close()
  if (errores.length) { console.error('Errores de consola:\n' + errores.join('\n')); process.exit(1) }
  console.log('Sin errores ni avisos de consola.')
})()
