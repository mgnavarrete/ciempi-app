#!/usr/bin/env node
// Captura las láminas antes/después de los rostros v4 (laminas-rostros.html) con Playwright de npx.
// Escribe SOLO en docs/rediseno-ciempi/revisiones/T0x-*-v4-rostro/evidencia/. Falla si hay errores de consola.
//   python3 -m http.server <puerto> --bind 127.0.0.1   (raíz del worktree)
//   LAB_URL=http://127.0.0.1:<puerto>/docs/rediseno-ciempi/laboratorio-transformaciones/ \
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node scripts/transformaciones/capturar-rostros-v4.cjs
const path = require('node:path')
const fs = require('node:fs')
const { chromium } = require('playwright')
const raiz = path.resolve(__dirname, '..', '..')
const URL_BASE = process.env.LAB_URL || 'http://127.0.0.1:8793/docs/rediseno-ciempi/laboratorio-transformaciones/'
const CHROME = process.env.CHROME || '/home/menta/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
const DESTINO = { dragon: 'T01-dragon-v4-rostro', cuncuna: 'T02-cuncuna-v4-rostro' }
// ITER=2: iteración 2 (v4b), láminas con sufijo -it2 (no sobrescribe las de v4).
const IT = process.env.ITER === '2' ? { q: '&it=2', suf: '-it2' } : { q: '', suf: '' }
const trabajos = []
for (const especie of ['dragon', 'cuncuna']) {
  for (const tipo of ['crecimiento', 'expresiones', 'accesorios', 'tamanos', 'animacion']) for (const fondo of ['claro', 'oscuro']) {
    if (fondo === 'oscuro' && !['accesorios', 'tamanos', 'expresiones'].includes(tipo)) continue
    trabajos.push({ especie, tipo, fondo })
  }
}
trabajos.push({ especie: 'dragon', tipo: 'ciempi', fondo: 'claro' }, { especie: 'dragon', tipo: 'ciempi', fondo: 'oscuro' })
;(async () => {
  const navegador = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {})
  const errores = []
  for (const t of trabajos) {
    const pagina = await navegador.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 })
    pagina.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(`${t.tipo}/${t.especie}: ${m.text()}`) })
    pagina.on('pageerror', (e) => errores.push(`${t.tipo}/${t.especie}: ${e.message}`))
    await pagina.goto(`${URL_BASE}laminas-rostros.html?tipo=${t.tipo}&especie=${t.especie}&fondo=${t.fondo}${IT.q}`)
    await pagina.waitForSelector('body[data-cargado]', { timeout: 180000 })
    if ((await pagina.getAttribute('body', 'data-cargado')) !== '1') errores.push(`${t.tipo}/${t.especie}: la lámina no terminó`)
    await pagina.waitForTimeout(400)
    const carpeta = t.tipo === 'ciempi' ? 'T01-dragon-v4-rostro' : DESTINO[t.especie]
    const dir = path.join(raiz, 'docs/rediseno-ciempi/revisiones', carpeta, 'evidencia')
    fs.mkdirSync(dir, { recursive: true })
    const archivo = path.join(dir, `${t.tipo === 'ciempi' ? 'comparacion-ciempi' : t.tipo}-${t.fondo}${IT.suf}.png`)
    await pagina.screenshot({ path: archivo, fullPage: true })
    console.log(path.relative(raiz, archivo))
    await pagina.close()
  }
  await navegador.close()
  if (errores.length) { console.error('Errores de consola:\n' + errores.join('\n')); process.exit(1) }
  console.log('Sin errores ni avisos de consola en', trabajos.length, 'láminas.')
})()
