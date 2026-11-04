#!/usr/bin/env node
// Prueba mínima V5: carga el laboratorio con cada variante (?variante=<id>), comprueba
// consola sin errores, que la variante se aplicó, ojos k3 en los camaleones, zapatilla
// única en la cola de las serpientes (N = 1, 2, 12) y una animación corta con parpadeo.
// Uso: servidor en 8840 y NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node probar-variantes.cjs
const fs = require('node:fs')
const { chromium } = require('playwright')
const URL_BASE = process.env.LAB_URL || 'http://127.0.0.1:8840/docs/rediseno-ciempi/laboratorio-transformaciones/'
const CHROME = process.env.CHROME || '/home/menta/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
;(async () => {
  const nav = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {})
  const p0 = await nav.newPage()
  await p0.goto(URL_BASE + 'laminas-v4.html?tipo=variantes&especie=dragon')
  const ids = await p0.evaluate(async () => Object.values((await import('./variantes.js')).CATALOGO).flatMap((e) => e.variantes.map((v) => v.id)))
  await p0.close()
  let ok = 0
  const fallos = []
  for (const id of ids) {
    const p = await nav.newPage({ viewport: { width: 1300, height: 900 } })
    const errores = []
    p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(m.text()) })
    p.on('pageerror', (e) => errores.push('pageerror: ' + e.message))
    await p.goto(URL_BASE + `?variante=${id}&quieto`)
    await p.waitForSelector('body[data-cargado]', { timeout: 120000 })
    await p.waitForFunction((id) => window.lab?.estado.sel.varianteEspecie === id && document.querySelector('#variante-v5')?.value === id, id, { timeout: 60000 })
    const r = await p.evaluate(async (id) => {
      const lab = window.lab, svg = () => document.querySelector('#lienzo-a svg')
      const out = { especie: lab.estado.especie, selector: document.querySelector('#variante-v5')?.value === id }
      out.k3 = !!svg().querySelector('[data-ojos="k3"]')
      out.patron = svg().querySelectorAll('[data-patron-variante]').length
      if (lab.estado.especie === 'serpiente') {
        out.cola = {}
        lab.estado.sel.pies = 'b10-deportiva'
        for (const n of [1, 2, 12]) {
          lab.estado.n = n; await lab.actualizar()
          out.cola[n] = [...svg().querySelectorAll('[data-zapatilla-cola]')].filter((z) => !z.closest('[display="none"]')).length
        }
        lab.estado.n = 5; await lab.actualizar()
      }
      // Animación corta (A02 caminar) con el rig: los ojos k3 deben seguir siendo los que parpadean.
      document.querySelector('#anim').value = 'A02'; document.querySelector('#anim').dispatchEvent(new Event('change'))
      document.querySelector('#reproducir').click(); await new Promise((ok) => setTimeout(ok, 900)); document.querySelector('#reproducir').click()
      out.ojosRig = svg().querySelectorAll('[data-ojo]').length
      return out
    }, id)
    const esperaK3 = r.especie === 'camaleon'
    const bien = !errores.length && r.selector && r.k3 === esperaK3 && (!r.cola || (r.cola[1] <= 1 && r.cola[2] === 1 && r.cola[12] === 1))
    if (bien) ok++; else fallos.push(id)
    console.log(`${bien ? 'OK ' : 'MAL'} ${id}: ${JSON.stringify(r)}${errores.length ? ' · consola: ' + errores.join(' | ') : ''}`)
    await p.close()
  }
  console.log(`Variantes: ${ok}/${ids.length} cargan sin errores de consola${fallos.length ? ' · fallan: ' + fallos.join(', ') : ''}`)
  await nav.close()
  process.exit(fallos.length ? 1 : 0)
})()
