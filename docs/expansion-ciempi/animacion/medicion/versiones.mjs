// Medición INTERCALADA antes/después entre DOS VERSIONES del código: el banco
// (banco.html) se compila desde este árbol ("después") y desde otro árbol
// ("antes", p. ej. `git archive 1bf79c6` en una carpeta temporal con enlace a
// node_modules), se sirven en dos puertos y, en una sola sesión de Chromium, se
// alternan versión y modo, rotando el orden en cada ronda. Registra la carga.
//   NODE_PATH=… node docs/expansion-ciempi/animacion/medicion/versiones.mjs \
//     --antes /ruta/arbol-antes --rondas 3 --cpu 4,6 --etiqueta e08-v3-versiones
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { CHROMIUM, chromium, servir } from './servir.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1] }
const etiqueta = arg('etiqueta', 'e08-v3-versiones'), rondas = +arg('rondas', 3), cpus = arg('cpu', '4,6').split(',').map(Number)
const antesRaiz = arg('antes', null); if (!antesRaiz) throw Error('--antes /ruta/arbol')
const CASOS = [
  ['revelar', 'tipico', { crecimiento: 'revelar' }],
  ['revelar+comer', 'tipico', { crecimiento: 'revelar', comerAnimado: true }],
  ['revelar+comer', 'mascara', { crecimiento: 'revelar', comerAnimado: true }],
]
// --casos revelar+comer/tipico,… limita los casos (repeticiones).
const filtro = arg('casos', null)?.split(',')
if (filtro) CASOS.splice(0, CASOS.length, ...CASOS.filter(([m, c]) => filtro.includes(`${m}/${c}`)))
const carga = () => readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3).map(Number)
const mediana = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)] }

const despues = await servir([join(aqui, 'banco.html')], etiqueta + '-despues', 8773)
const servirAntes = (await import(pathToFileURL(join(antesRaiz, 'docs/expansion-ciempi/animacion/medicion/servir.mjs')).href)).servir
const antes = await servirAntes([join(antesRaiz, 'docs/expansion-ciempi/animacion/medicion/banco.html')], etiqueta + '-antes', 8774)
const URLS = { antes: antes.urls[0], despues: despues.urls[0] }
const navegador = await chromium.launch({ executablePath: CHROMIUM })
const res = { etiqueta, antes: antesRaiz, fecha: new Date().toISOString(), chromium: navegador.version(), corridas: [] }
for (let ronda = 0; ronda < rondas; ronda++)
  for (const cpu of cpus) {
    const versiones = ronda % 2 ? ['despues', 'antes'] : ['antes', 'despues']
    const casos = CASOS.map((_, i) => CASOS[(i + ronda) % CASOS.length])
    for (const caso of casos)
      for (const version of versiones) {
        const [modo, conjunto, extra] = caso
        const ctx = await navegador.newContext({ viewport: { width: 412, height: 600 }, deviceScaleFactor: 2 })
        const page = await ctx.newPage(), errores = []
        page.on('pageerror', (e) => errores.push(String(e)))
        page.on('console', (m) => m.type() === 'error' && errores.push(m.text()))
        const cdp = await ctx.newCDPSession(page)
        await page.goto(URLS[version])
        await page.waitForFunction(() => window.banco?.listo(), null, { timeout: 30000 })
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
        const c0 = carga()
        const r = await page.evaluate((o) => window.banco.correr(o), { nMax: 40, msPorUnidad: 500, conjunto, extra })
        const c1 = carga()
        delete r.unidad.todas
        res.corridas.push({ ronda, cpu, version, modo, conjunto, cargaIni: c0, cargaFin: c1, ...r, errores })
        console.log(`r${ronda} ${cpu}× ${version.padEnd(7)} ${modo}/${conjunto} carga ${c0[0].toFixed(1)}→${c1[0].toFixed(1)} · unidad ${r.unidad.mediana.toFixed(1)}/${r.unidad.p95.toFixed(1)}/${r.unidad.max.toFixed(1)} · perdidos ${r.cuadros.pctPerdidos.toFixed(1)} % · largas ${r.tareasLargas.n}${errores.length ? ' ERR ' + errores.length : ''}`)
        await ctx.close()
      }
  }
res.resumen = []
for (const cpu of cpus) for (const [modo, conjunto] of CASOS) for (const version of ['antes', 'despues']) {
  const cs = res.corridas.filter((c) => c.cpu === cpu && c.modo === modo && c.conjunto === conjunto && c.version === version), v = (f) => cs.map(f)
  res.resumen.push({ cpu, caso: `${modo}/${conjunto}`, version, n: cs.length, unidad: [mediana(v((c) => c.unidad.mediana)), mediana(v((c) => c.unidad.p95)), Math.max(...v((c) => c.unidad.max))].map((x) => +x.toFixed(1)).join(' / '),
    pctPerdidos: +mediana(v((c) => c.cuadros.pctPerdidos)).toFixed(1), rangoPerdidos: [Math.min(...v((c) => c.cuadros.pctPerdidos)), Math.max(...v((c) => c.cuadros.pctPerdidos))].map((x) => x.toFixed(1)).join('–'),
    fps: +mediana(v((c) => c.cuadros.fps)).toFixed(1), largas: mediana(v((c) => c.tareasLargas.n)), largaMax: +Math.max(...v((c) => c.tareasLargas.max)).toFixed(0),
    carga: [Math.min(...v((c) => c.cargaIni[0])), Math.max(...v((c) => c.cargaFin[0]))].map((x) => x.toFixed(1)).join('–'), errores: cs.reduce((s, c) => s + c.errores.length, 0) })
}
console.table(res.resumen)
mkdirSync(join(aqui, 'resultados'), { recursive: true })
writeFileSync(join(aqui, 'resultados', `${etiqueta}.json`), JSON.stringify(res, null, 1))
await navegador.close(); await despues.cerrar(); await antes.cerrar()
