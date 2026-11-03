// Banco de medición del Ciempi de lectura (crecimiento N = 0 → 40 caminando).
//
// Uso (desde la raíz del repositorio; Playwright no está en package.json):
//   NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules \
//     node docs/expansion-ciempi/animacion/medicion/medir.mjs --etiqueta antes
// Opciones: --extra '{"crecimiento":"revelar"}' (props extra de <Ciempi>),
//   --reps 3, --cpu 1,4,6, --ms 500, --conjunto tipico, --sin-traza, --solo-servir.
//
// Compila banco.html en modo producción (React de producción, como la APK), lo
// sirve con `vite preview` en 127.0.0.1:8773 y lo recorre con Chromium. La CPU
// se frena con Emulation.setCPUThrottlingRate: es una APROXIMACIÓN a un Android
// modesto, no un dispositivo real.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CHROMIUM, chromium, servir } from './servir.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1] }
const bandera = (k) => process.argv.includes('--' + k)
const etiqueta = arg('etiqueta', 'antes')
const extra = JSON.parse(arg('extra', '{}'))
const reps = +arg('reps', 3)
const cpus = arg('cpu', '1,4,6').split(',').map(Number)
const msPorUnidad = +arg('ms', 500)
const conjunto = arg('conjunto', 'tipico')
mkdirSync(join(aqui, 'resultados'), { recursive: true })

const { salida, urls: [url], cerrar } = await servir([join(aqui, 'banco.html')], etiqueta)
if (bandera('solo-servir')) { console.log('Sirviendo', url); await new Promise(() => {}) }

const navegador = await chromium.launch({ executablePath: CHROMIUM, args: ['--enable-precise-memory-info'] })
const mediana = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)] }
const p95 = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil(s.length * 0.95) - 1)] }

async function pagina(cpu) {
  const ctx = await navegador.newContext({ viewport: { width: 412, height: 600 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errores.push(m.text()))
  page.on('response', (r) => r.status() >= 400 && errores.push(`${r.status()} ${r.url()}`))
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Performance.enable')
  await page.goto(url)
  await page.waitForFunction(() => window.banco?.listo(), null, { timeout: 30000 })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  return { ctx, page, cdp, errores }
}
async function metricas(cdp) {
  await cdp.send('HeapProfiler.collectGarbage')
  const { metrics } = await cdp.send('Performance.getMetrics')
  const m = Object.fromEntries(metrics.map((x) => [x.name, x.value]))
  return { heapMB: m.JSHeapUsedSize / 1048576, nodos: m.Nodes, documentos: m.Documents, layouts: m.LayoutCount, estilos: m.RecalcStyleCount }
}

/** Resume una traza de Chrome: tiempo propio por tipo de evento en el hilo principal del renderizador. */
function resumirTraza(ruta) {
  const { traceEvents } = JSON.parse(readFileSync(ruta, 'utf8'))
  const hilo = traceEvents.find((e) => e.ph === 'M' && e.name === 'thread_name' && e.args?.name === 'CrRendererMain')
  const ev = traceEvents.filter((e) => e.pid === hilo.pid && e.tid === hilo.tid && e.ph === 'X' && e.dur)
  const ini = traceEvents.find((e) => e.name === 'banco-inicio')?.ts ?? 0
  const fin = traceEvents.find((e) => e.name === 'banco-fin')?.ts ?? Infinity
  const suma = {}
  for (const e of ev) if (e.ts >= ini && e.ts <= fin) suma[e.name] = (suma[e.name] || 0) + e.dur / 1000
  const nombres = ['RunTask', 'FunctionCall', 'EventDispatch', 'FireAnimationFrame', 'UpdateLayoutTree', 'Layout', 'PrePaint', 'Paint', 'Layerize', 'ParseHTML', 'MinorGC', 'MajorGC', 'V8.GC_SCAVENGER', 'BlinkGC.AtomicPhase', 'ImageDecodeTask', 'Decode Image', 'HitTest']
  return { ventanaS: (fin - ini) / 1e6, msPorEvento: Object.fromEntries(nombres.filter((n) => suma[n]).map((n) => [n, Math.round(suma[n])])) }
}

const resultados = { etiqueta, extra, msPorUnidad, conjunto, fecha: new Date().toISOString(), chromium: navegador.version(), corridas: [], micro: [], trazas: [] }
for (const cpu of cpus) {
  for (let r = 0; r < reps; r++) {
    const { ctx, page, cdp, errores } = await pagina(cpu)
    const antes = await metricas(cdp)
    const res = await page.evaluate((o) => window.banco.correr(o), { nMax: 40, msPorUnidad, conjunto, extra })
    const sinGc = (await cdp.send('Performance.getMetrics')).metrics.find((x) => x.name === 'JSHeapUsedSize').value / 1048576
    const despues = await metricas(cdp)
    delete res.unidad.todas
    resultados.corridas.push({ cpu, rep: r, ...res, heap: { inicioMB: antes.heapMB, finSinGcMB: sinGc, finMB: despues.heapMB }, cdp: { nodosInicio: antes.nodos, nodosFin: despues.nodos, layouts: despues.layouts - antes.layouts, recalculosEstilo: despues.estilos - antes.estilos }, errores })
    console.log(`cpu ${cpu}× rep ${r}: unidad mediana ${res.unidad.mediana.toFixed(1)} ms p95 ${res.unidad.p95.toFixed(1)} · fps ${res.cuadros.fps.toFixed(1)} · perdidos ${res.cuadros.perdidos} · tareas largas ${res.tareasLargas.n}`)
    if (r === 0) {
      const m = await page.evaluate((o) => window.banco.micro(o), { conjunto, nMax: 40, repeticiones: 2 })
      const cuadro = await page.evaluate((o) => window.banco.costoCuadro?.(o), { conjunto, n: 40 })
      resultados.micro.push({ cpu, ...m, cuadroN40: cuadro })
    }
    await ctx.close()
  }
  if (!bandera('sin-traza')) {
    const { ctx, page } = await pagina(cpu)
    const ruta = join(salida, `traza-${cpu}x.json`)
    await navegador.startTracing(page, { path: ruta, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink.user_timing', 'v8', 'blink_gc'] })
    await page.evaluate((o) => window.banco.correr(o), { nMax: 40, msPorUnidad, conjunto, extra })
    await navegador.stopTracing()
    resultados.trazas.push({ cpu, ...resumirTraza(ruta) })
    await ctx.close()
  }
}

// Resumen: mediana y p95 entre repeticiones (de las medianas/p95 de cada corrida).
resultados.resumen = cpus.map((cpu) => {
  const cs = resultados.corridas.filter((c) => c.cpu === cpu)
  const v = (f) => cs.map(f)
  return {
    cpu,
    unidadMediana: mediana(v((c) => c.unidad.mediana)), unidadP95: mediana(v((c) => c.unidad.p95)), unidadMax: Math.max(...v((c) => c.unidad.max)),
    movimientoMediana: mediana(v((c) => c.movimiento.mediana)), movimientoP95: mediana(v((c) => c.movimiento.p95)),
    fps: mediana(v((c) => c.cuadros.fps)), perdidos: mediana(v((c) => c.cuadros.perdidos)), pctPerdidos: mediana(v((c) => c.cuadros.pctPerdidos)), cuadroP95: mediana(v((c) => c.cuadros.p95)), cuadroMax: Math.max(...v((c) => c.cuadros.max)),
    tareasLargas: mediana(v((c) => c.tareasLargas.n)), tareasLargasMs: mediana(v((c) => c.tareasLargas.totalMs)),
    heapFinMB: mediana(v((c) => c.heap.finMB)), heapPicoSinGcMB: Math.max(...v((c) => c.heap.finSinGcMB)), nodosDom: mediana(v((c) => c.nodosDom)), nodosCdpFin: mediana(v((c) => c.cdp.nodosFin)),
    recalculosEstilo: mediana(v((c) => c.cdp.recalculosEstilo)), layouts: mediana(v((c) => c.cdp.layouts)),
  }
})
console.table(resultados.resumen.map((r) => Object.fromEntries(Object.entries(r).map(([k, x]) => [k, typeof x === 'number' ? +x.toFixed(2) : x]))))
writeFileSync(join(aqui, 'resultados', `${etiqueta}.json`), JSON.stringify(resultados, null, 1))
await navegador.close()
await cerrar()
