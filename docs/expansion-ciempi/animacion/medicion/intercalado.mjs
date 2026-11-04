// Medición "después" INTERCALADA: en la misma sesión y con el mismo build se
// alternan los modos (recomponer = camino anterior, revelar = escena creciente,
// revelar+comer = revelar con E08 activo) para que la carga variable de la
// máquina (otros procesos) afecte por igual a todos. Cada corrida registra la
// carga (/proc/loadavg) antes y después.
//
// Uso (desde la raíz del worktree):
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules \
//     node docs/expansion-ciempi/animacion/medicion/intercalado.mjs \
//     --etiqueta despues-intercalado --rondas 3 --cpu 1,4,6 [--traza]
// Misma corrida que medir.mjs (banco.html, N 0→40, 500 ms/unidad, conjunto típico).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CHROMIUM, chromium, servir } from './servir.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1] }
const etiqueta = arg('etiqueta', 'despues-intercalado')
const rondas = +arg('rondas', 3)
const cpus = arg('cpu', '1,4,6').split(',').map(Number)
const msPorUnidad = +arg('ms', 500)
const conjunto = arg('conjunto', 'tipico')
const MODOS = {
  recomponer: { crecimiento: 'recomponer' },
  revelar: { crecimiento: 'revelar' },
  'revelar+comer': { crecimiento: 'revelar', comerAnimado: true },
}
const modos = arg('modos', Object.keys(MODOS).join(',')).split(',')
const carga = () => readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3).map(Number)

const { salida, urls: [url], cerrar } = await servir([join(aqui, 'banco.html')], etiqueta)
const navegador = await chromium.launch({ executablePath: CHROMIUM, args: ['--enable-precise-memory-info'] })
const mediana = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)] }

async function pagina(cpu) {
  const ctx = await navegador.newContext({ viewport: { width: 412, height: 600 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errores.push(m.text()))
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Performance.enable')
  await page.goto(url)
  await page.waitForFunction(() => window.banco?.listo(), null, { timeout: 30000 })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  return { ctx, page, cdp, errores }
}

const res = { etiqueta, msPorUnidad, conjunto, modos, fecha: new Date().toISOString(), chromium: navegador.version(), nucleos: (await import('node:os')).cpus().length, corridas: [], costoCuadro: [], trazas: [] }
for (let ronda = 0; ronda < rondas; ronda++) {
  for (const cpu of cpus) {
    // El orden de los modos rota en cada ronda para no favorecer siempre al primero.
    const orden = modos.map((_, i) => modos[(i + ronda) % modos.length])
    for (const modo of orden) {
      const { ctx, page, cdp, errores } = await pagina(cpu)
      const cargaIni = carga()
      const r = await page.evaluate((o) => window.banco.correr(o), { nMax: 40, msPorUnidad, conjunto, extra: MODOS[modo] })
      const cargaFin = carga()
      await cdp.send('HeapProfiler.collectGarbage')
      const heap = (await cdp.send('Performance.getMetrics')).metrics.find((x) => x.name === 'JSHeapUsedSize').value / 1048576
      delete r.unidad.todas
      res.corridas.push({ ronda, cpu, modo, cargaIni, cargaFin, ...r, heapFinMB: heap, errores })
      console.log(`r${ronda} ${cpu}× ${modo.padEnd(13)} carga ${cargaIni[0].toFixed(2)}→${cargaFin[0].toFixed(2)} · unidad med ${r.unidad.mediana.toFixed(1)} p95 ${r.unidad.p95.toFixed(1)} máx ${r.unidad.max.toFixed(1)} · fps ${r.cuadros.fps.toFixed(1)} · perdidos ${r.cuadros.perdidos} (${r.cuadros.pctPerdidos.toFixed(1)} %) · cuadro p95 ${r.cuadros.p95.toFixed(1)} · largas ${r.tareasLargas.n} (${r.tareasLargas.totalMs.toFixed(0)} ms)${errores.length ? ' · ERRORES ' + errores.length : ''}`)
      await ctx.close()
    }
    if (ronda === 0) {
      // Costo por cuadro aislado con N = 40 (rig.aplicar A02): escena por n contra escena creciente.
      const { ctx, page } = await pagina(cpu)
      res.costoCuadro.push({ cpu, carga: carga(), ...(await page.evaluate((o) => window.banco.costoCuadro(o), { conjunto, n: 40 })) })
      await ctx.close()
    }
  }
}

if (process.argv.includes('--traza')) {
  for (const modo of modos) {
    const cpu = Math.max(...cpus)
    const { ctx, page } = await pagina(cpu)
    const ruta = join(salida, `traza-${modo}-${cpu}x.json`)
    await navegador.startTracing(page, { path: ruta, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink.user_timing', 'v8', 'blink_gc'] })
    await page.evaluate((o) => window.banco.correr(o), { nMax: 40, msPorUnidad, conjunto, extra: MODOS[modo] })
    await navegador.stopTracing()
    const { traceEvents } = JSON.parse(readFileSync(ruta, 'utf8'))
    const hilo = traceEvents.find((e) => e.ph === 'M' && e.name === 'thread_name' && e.args?.name === 'CrRendererMain')
    const ini = traceEvents.find((e) => e.name === 'banco-inicio')?.ts ?? 0
    const fin = traceEvents.find((e) => e.name === 'banco-fin')?.ts ?? Infinity
    const suma = {}
    for (const e of traceEvents) if (e.pid === hilo.pid && e.tid === hilo.tid && e.ph === 'X' && e.dur && e.ts >= ini && e.ts <= fin) suma[e.name] = (suma[e.name] || 0) + e.dur / 1000
    const nombres = ['RunTask', 'FunctionCall', 'FireAnimationFrame', 'UpdateLayoutTree', 'Layout', 'PrePaint', 'Paint', 'Layerize', 'ParseHTML', 'MinorGC', 'MajorGC']
    res.trazas.push({ modo, cpu, carga: carga(), ventanaS: (fin - ini) / 1e6, msPorEvento: Object.fromEntries(nombres.filter((n) => suma[n]).map((n) => [n, Math.round(suma[n])])) })
    console.log('traza', modo, res.trazas.at(-1).msPorEvento)
    await ctx.close()
  }
}

res.resumen = []
for (const cpu of cpus)
  for (const modo of modos) {
    const cs = res.corridas.filter((c) => c.cpu === cpu && c.modo === modo)
    const v = (f) => cs.map(f)
    res.resumen.push({
      cpu, modo, n: cs.length,
      unidadMediana: mediana(v((c) => c.unidad.mediana)), unidadP95: mediana(v((c) => c.unidad.p95)), unidadMax: Math.max(...v((c) => c.unidad.max)),
      movMediana: mediana(v((c) => c.movimiento.mediana)), movP95: mediana(v((c) => c.movimiento.p95)),
      fps: mediana(v((c) => c.cuadros.fps)), perdidos: mediana(v((c) => c.cuadros.perdidos)), pctPerdidos: mediana(v((c) => c.cuadros.pctPerdidos)),
      cuadroP95: mediana(v((c) => c.cuadros.p95)), cuadroMax: Math.max(...v((c) => c.cuadros.max)),
      largas: mediana(v((c) => c.tareasLargas.n)), largasMs: mediana(v((c) => c.tareasLargas.totalMs)), largaMax: Math.max(...v((c) => c.tareasLargas.max)),
      heapFinMB: mediana(v((c) => c.heapFinMB)), nodosDom: mediana(v((c) => c.nodosDom)),
      carga1m: [Math.min(...v((c) => c.cargaIni[0])), Math.max(...v((c) => c.cargaFin[0]))],
      errores: cs.reduce((s, c) => s + c.errores.length, 0),
    })
  }
console.table(res.resumen.map((r) => Object.fromEntries(Object.entries(r).map(([k, x]) => [k, typeof x === 'number' ? +x.toFixed(2) : Array.isArray(x) ? x.map((y) => y.toFixed(2)).join('–') : x]))))
mkdirSync(join(aqui, 'resultados'), { recursive: true })
writeFileSync(join(aqui, 'resultados', `${etiqueta}.json`), JSON.stringify(res, null, 1))
await navegador.close()
await cerrar()
