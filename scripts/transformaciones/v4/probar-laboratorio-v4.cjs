#!/usr/bin/env node
// Prueba de navegador del laboratorio con las criaturas V4 (Serpiente, Camaleón), complemento de
// probar-laboratorio.cjs (que sigue comprobando Ciempi 35/35 y Ciempi/Dragón/Cuncuna):
//  - se abren por URL (?especie=serpiente|camaleon) y por botón; N = 0, 1, 5, 12, 40; conjuntos; restaurar;
//  - la Serpiente oculta el calzado (etiqueta «oculto») y la lengüita se puede apagar;
//  - el Camaleón cambia de color con un conjunto (camuflaje) y guarda el casco bajo un gorro;
//  - animaciones A10 y E08 reproducidas; consola sin errores ni avisos.
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules LAB_URL=http://127.0.0.1:8803/docs/rediseno-ciempi/laboratorio-transformaciones/ node scripts/transformaciones/v4/probar-laboratorio-v4.cjs
const fs = require('node:fs')
const { chromium } = require('playwright')
const URL_BASE = process.env.LAB_URL || 'http://127.0.0.1:8803/docs/rediseno-ciempi/laboratorio-transformaciones/'
const CHROME = process.env.CHROME || '/home/menta/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
const fallos = []
const ok = (cond, txt) => { console.log((cond ? 'ok   ' : 'FALLO') + ' ' + txt); if (!cond) fallos.push(txt) }

;(async () => {
  const navegador = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {})
  const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1000 } })
  const errores = []
  pagina.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(`${m.type()}: ${m.text()}`) })
  pagina.on('pageerror', (e) => errores.push('pageerror: ' + e.message))
  // Espera a que termine la actualización en curso (generación nueva o sin cambios tras 400 ms).
  let ultima = null
  const esperar = async () => {
    await pagina.waitForFunction((u) => document.body.dataset.listo && document.body.dataset.listo !== u, ultima, { timeout: 4000 }).catch(() => {})
    await pagina.waitForTimeout(400)
    ultima = await pagina.evaluate(() => document.body.dataset.listo)
  }
  const n = async (v) => { await pagina.click(`#n-rapidos button:text-is("${v}")`); await esperar() }
  const imgs = () => pagina.$$eval('#lienzo-a image', (l) => l.map((i) => i.getAttribute('href')))

  for (const [id, nombre] of [['serpiente', 'Ciempi Serpiente'], ['camaleon', 'Ciempi Camaleón']]) {
    await pagina.goto(`${URL_BASE}?especie=${id}&n=12&quieto`)
    await pagina.waitForSelector('body[data-cargado]', { timeout: 120000 }); await esperar()
    ok((await pagina.textContent('#titulo-a')).startsWith(`${nombre} · N = 12`), `${id}: se abre por URL con N = 12`)
    for (const v of ['0', '1', '5', '12', '40']) {
      await n(v)
      const segs = await pagina.$$eval('#lienzo-a [data-role]', (l) => l.filter((g) => g.closest('[id$="-body"]')).length)
      ok(segs === +v, `${id}: N = ${v} dibuja ${segs} segmentos`)
    }
    await n('5')
    for (const c of ['Robot Lumen', 'Luna bibliotecaria', 'Explorador de charcos']) { await pagina.click(`#conjuntos button:text-is("${c}")`); await esperar() }
    await pagina.click('#restaurar'); await esperar()
  }

  // Serpiente: calzado oculto, lengüita apagable.
  await pagina.click('#criaturas button:text-is("Ciempi Serpiente")'); await esperar()
  await pagina.selectOption('#sel-pies', 'b10-deportiva'); await esperar()
  ok((await pagina.textContent('[data-etiqueta="pies"]')).includes('oculto'), 'serpiente: el calzado figura como oculto')
  ok(!(await pagina.$('#lienzo-a [data-footwear]')), 'serpiente: no se dibuja calzado')
  ok(!!(await pagina.$('#lienzo-a [data-rasgo="lengua"]')), 'serpiente: lengüita visible con Alegre')
  await pagina.uncheck('#lengua-v4'); await esperar()
  ok(!(await pagina.$('#lienzo-a [data-rasgo="lengua"]')), 'serpiente: lengüita apagada')
  await pagina.check('#lengua-v4'); await esperar()
  await pagina.click('#criaturas button:text-is("Ciempi Dragón")'); await esperar()
  ok(!!(await pagina.$('#lienzo-a [data-footwear]')), 'el calzado guardado vuelve a verse en el Dragón')
  await pagina.click('#restaurar'); await esperar()

  // Camaleón: camuflaje y casco.
  await pagina.click('#criaturas button:text-is("Ciempi Camaleón")'); await esperar()
  const antes = await imgs()
  await pagina.click('#conjuntos button:text-is("Draco del bosque")'); await esperar()
  const despues = await imgs()
  ok(despues.some((h) => h.startsWith('blob:')) && !antes.some((h) => h.startsWith('blob:')), 'camaleón: el conjunto tiñe el cuerpo (camuflaje)')
  ok(!(await pagina.$('#lienzo-a [data-rasgo="casco"]')), 'camaleón: casco guardado bajo el gorro del conjunto')
  await pagina.click('#restaurar'); await esperar()
  ok(!!(await pagina.$('#lienzo-a [data-rasgo="casco"]')) && !!(await pagina.$('#lienzo-a [data-rasgo="torretas"]')), 'camaleón: restaurar devuelve casco y torretas')

  for (const a of ['A10', 'E08']) { await pagina.selectOption('#anim', a); await pagina.click('#reproducir'); await pagina.waitForTimeout(1200); await pagina.click('#reproducir') }
  await pagina.check('input[name=fondo][value=oscuro]')
  await pagina.selectOption('#comparar', 'serpiente'); await esperar()
  console.log('Animación:', await pagina.textContent('#costo'))
  await navegador.close()
  if (errores.length) console.error('Errores de consola:\n' + errores.join('\n'))
  else console.log('Laboratorio V4: sin errores ni avisos de consola.')
  console.log(`${fallos.length ? 'FALLAN ' + fallos.length : 'Todas las comprobaciones pasan'}`)
  process.exit(fallos.length || errores.length ? 1 : 0)
})()
