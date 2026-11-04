// Capturas de la pista de lectura con las comidas nuevas (build local + vite preview en :5197).
// Uso: node scripts/frutas/capturar-pista.cjs <dir_salida>
const { chromium } = require('/home/menta/.npm/_npx/705bc6b22212b352/node_modules/playwright')
const path = require('node:path')
const fs = require('node:fs')
const URL = process.env.URL || 'http://localhost:5197/'
const LIBRO = new RegExp(process.env.LIBRO || 'Mi perro Pupo')
;(async () => {
  const dir = process.argv[2]; fs.mkdirSync(dir, { recursive: true })
  const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome' })
  const errs = []
  for (const [comida, vista] of [['comida-frutilla', { width: 390, height: 844 }], ['comida-manzana', { width: 900, height: 700 }], ['comida-helado', { width: 390, height: 844 }], ['comida-dona', { width: 900, height: 700 }]]) {
    const ctx = await b.newContext({ viewport: vista, deviceScaleFactor: 2 })
    const p = await ctx.newPage()
    p.on('pageerror', e => errs.push(`${comida}: ${e.message}`)); p.on('console', m => { if (m.type() === 'error') errs.push(`${comida}: ${m.text()}`) })
    await p.goto(URL); await p.waitForTimeout(1200)
    await p.evaluate((c) => { const k = 'ciempi:v1:perfiles', a = JSON.parse(localStorage.getItem(k)); a[0].ciempi.presentado = true; a[0].ciempi.comida = c; localStorage.setItem(k, JSON.stringify(a)) }, comida)
    await p.reload(); await p.waitForTimeout(800)
    await p.getByRole('button', { name: /Lector/ }).click(); await p.waitForTimeout(800)
    await p.getByRole('button', { name: LIBRO }).click(); await p.waitForTimeout(2500)
    const nombre = `${comida.replace('comida-', '')}-${vista.width}`
    await p.screenshot({ path: path.join(dir, `pista-${nombre}-inicio.png`) })
    const slider = p.getByRole('slider'); const box = await slider.boundingBox()
    const y = box.y + box.height - 40
    await p.mouse.move(box.x + 3, y); await p.mouse.down()
    const imgs = []
    for (let i = 0; i <= 12; i++) { await p.mouse.move(box.x + 3 + (box.width - 6) * 0.45 * i / 12, y); await p.waitForTimeout(140) }
    // E08 (comer): tras pasar la siguiente palabra, la comida del <use> salta a la boca; varios cuadros.
    for (let i = 13; i <= 15; i++) await p.mouse.move(box.x + 3 + (box.width - 6) * 0.45 * i / 12, y)
    for (let f = 0; f < 4; f++) { await p.waitForTimeout(90); await p.screenshot({ path: path.join(dir, `pista-${nombre}-comiendo-${f}.png`), clip: { x: 0, y: box.y - 60, width: vista.width, height: box.height + 80 } }) }
    await p.mouse.up(); await p.waitForTimeout(900)
    imgs.push(await p.evaluate(() => [...document.querySelectorAll('image')].filter(i => (i.getAttribute('href') || '').includes('/comida/')).map(i => ({ href: i.getAttribute('href'), ok: i.getBBox().width > 0 }))))
    await p.screenshot({ path: path.join(dir, `pista-${nombre}-mitad.png`) })
    console.log(nombre, JSON.stringify(imgs[0].slice(0, 2)), imgs[0].length, 'imágenes de comida')
    await ctx.close()
  }
  await b.close()
  console.log(errs.length ? 'ERRORES:\n' + errs.join('\n') : 'Consola sin errores')
})()
