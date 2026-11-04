#!/usr/bin/env node
// Captura las láminas V4 de mochilas y calzado (laminas-accesorios.html) con Playwright de npx.
// Uso (servidor estático en la raíz del worktree):
//   python3 -m http.server 8810 --bind 127.0.0.1
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules \
//     node scripts/transformaciones/capturar-accesorios-v4.cjs v1 antes
//   … capturar-accesorios-v4.cjs v4 despues      (iteración 4.2: v4 despues-v4.2)
// Escribe en docs/rediseno-ciempi/revisiones/V4-mochilas-zapatos/<carpeta>/ y nunca sobrescribe
// una carpeta existente salvo con FORZAR=1. Falla si hay errores de consola.
const path = require('node:path')
const fs = require('node:fs')
const { chromium } = require('playwright')
const raiz = path.resolve(__dirname, '..', '..')
const [version = 'v1', carpeta = version === 'v4' ? 'despues' : 'antes'] = process.argv.slice(2)
const URL_BASE = process.env.LAB_URL || 'http://127.0.0.1:8810/docs/rediseno-ciempi/laboratorio-transformaciones/'
const CHROME = process.env.CHROME || '/home/menta/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
const destino = path.join(raiz, 'docs/rediseno-ciempi/revisiones/V4-mochilas-zapatos', carpeta)
if (fs.existsSync(destino) && fs.readdirSync(destino).length && !process.env.FORZAR) {
  console.error(`${path.relative(raiz, destino)} ya existe: no se sobrescribe (FORZAR=1 para hacerlo).`); process.exit(2)
}
fs.mkdirSync(destino, { recursive: true })
const trabajos = []
for (const familia of ['mochilas', 'zapatos']) {
  trabajos.push({ tipo: 'piezas', familia, especie: 'ciempi', fondo: 'claro' })
  trabajos.push({ tipo: 'detalle', familia, especie: 'ciempi', fondo: 'claro' })
  trabajos.push({ tipo: 'especies', familia, especie: 'ciempi', fondo: 'claro' })
  trabajos.push({ tipo: 'piezas', familia, especie: 'ciempi', fondo: 'oscuro' })
}
for (const especie of ['ciempi', 'dragon', 'cuncuna']) {
  trabajos.push({ tipo: 'crecimiento', familia: 'mochilas', especie, fondo: 'claro' })
  trabajos.push({ tipo: 'animacion', familia: 'mochilas', especie, fondo: 'claro' })
}
for (const especie of ['dragon', 'cuncuna']) trabajos.push({ tipo: 'detalle', familia: 'zapatos', especie, fondo: 'claro' }, { tipo: 'detalle', familia: 'mochilas', especie, fondo: 'claro' })
for (const fondo of ['claro', 'oscuro']) trabajos.push({ tipo: 'conjuntos', familia: 'mochilas', especie: 'ciempi', fondo })
// SOLO=conjuntos,detalle… limita los tipos (p. ej. para capturar en otra carpeta solo lo que faltaba).
const solo = process.env.SOLO ? process.env.SOLO.split(',') : null
if (solo) trabajos.splice(0, trabajos.length, ...trabajos.filter((t) => solo.includes(t.tipo)))

;(async () => {
  const navegador = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {})
  const errores = []
  for (const t of trabajos) {
    const pagina = await navegador.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 })
    pagina.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(`${t.tipo}/${t.familia}/${t.especie}: ${m.text()}`) })
    pagina.on('pageerror', (e) => errores.push(`${t.tipo}/${t.especie}: ${e.message}`))
    await pagina.goto(`${URL_BASE}laminas-accesorios.html?tipo=${t.tipo}&familia=${t.familia}&especie=${t.especie}&fondo=${t.fondo}&accesorios=${version}`)
    await pagina.waitForSelector('body[data-cargado]', { timeout: 180000 })
    if ((await pagina.getAttribute('body', 'data-cargado')) !== '1') errores.push(`${t.tipo}/${t.especie}: la lámina no terminó`)
    await pagina.waitForTimeout(400)
    const nombre = t.tipo === 'conjuntos' ? 'conjuntos' : ['crecimiento', 'animacion'].includes(t.tipo) ? `${t.tipo}-${t.especie}` : `${t.tipo}-${t.familia}${t.especie === 'ciempi' ? '' : '-' + t.especie}`
    const archivo = path.join(destino, `${nombre}-${t.fondo}.png`)
    await pagina.screenshot({ path: archivo, fullPage: true })
    console.log(path.relative(raiz, archivo))
    await pagina.close()
  }
  await navegador.close()
  if (errores.length) { console.error('Errores de consola:\n' + errores.join('\n')); process.exit(1) }
  console.log('Sin errores de consola en', trabajos.length, 'láminas', version + '.')
})()
