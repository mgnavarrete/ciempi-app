/**
 * Genera la página autocontenida docs/expansion-ciempi/economia/index.html
 * (tablas + gráficos SVG en línea, sin CDN) y datos/tablas.md a partir de
 * datos/resultados.json. Ejecutar después de simular.mjs:
 *   node docs/expansion-ciempi/economia/simulador/generar-informe.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'

const R = JSON.parse(readFileSync(new URL('./datos/resultados.json', import.meta.url), 'utf8'))
const M = Object.fromEntries(R.modelos.map((m) => [m.id, m]))
const P = R.perfiles
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const num = (x, d = 0) => (x == null || !Number.isFinite(x) ? '—' : x.toLocaleString('es-CL', { maximumFractionDigits: d, minimumFractionDigits: d }))
const ses = (v) => (v == null ? 'no alcanza' : String(v))

// ─── Gráficos ──────────────────────────────────────────────────────────────
/** Barras agrupadas con bigotes p10–p90. grupos: [{etiqueta, valores:[{serie, p10,p50,p90}]}] */
function barrasAgrupadas({ grupos, series, alto = 300, max, unidad }) {
  const W = 720
  const H = alto
  const m = { l: 44, r: 12, t: 16, b: 40 }
  const iw = W - m.l - m.r
  const ih = H - m.t - m.b
  const top = max ?? Math.max(...grupos.flatMap((g) => g.valores.map((v) => v.p90)))
  const paso = top > 150 ? 50 : top > 60 ? 20 : top > 20 ? 10 : 5
  const techo = Math.ceil(top / paso) * paso
  const y = (v) => m.t + ih - (v / techo) * ih
  const gw = iw / grupos.length
  const bw = Math.min(26, (gw - 16) / series.length - 2)
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" class="grafico">`
  for (let v = 0; v <= techo; v += paso) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" class="rejilla"/><text x="${m.l - 6}" y="${y(v) + 4}" class="eje" text-anchor="end">${v}</text>`
  grupos.forEach((g, gi) => {
    const x0 = m.l + gi * gw + (gw - series.length * (bw + 2)) / 2
    g.valores.forEach((v, si) => {
      const x = x0 + si * (bw + 2)
      const h = Math.max(1, y(0) - y(v.p50))
      const tip = `${g.etiqueta} · ${series[si].nombre}: ${num(v.p50)} ${unidad} (p10 ${num(v.p10)}, p90 ${num(v.p90)})`
      s += `<g class="marca" data-tip="${esc(tip)}"><rect x="${x - 2}" y="${m.t}" width="${bw + 4}" height="${ih}" fill="transparent"/>`
      s += `<path d="M${x},${y(0)} V${y(0) - h + 4} q0,-4 4,-4 h${bw - 8} q4,0 4,4 V${y(0)} Z" style="fill:var(--s${si + 1})"/>`
      s += `<line x1="${x + bw / 2}" x2="${x + bw / 2}" y1="${y(v.p10)}" y2="${y(v.p90)}" class="bigote"/>`
      s += `<line x1="${x + bw / 2 - 4}" x2="${x + bw / 2 + 4}" y1="${y(v.p90)}" y2="${y(v.p90)}" class="bigote"/>`
      s += `<line x1="${x + bw / 2 - 4}" x2="${x + bw / 2 + 4}" y1="${y(v.p10)}" y2="${y(v.p10)}" class="bigote"/></g>`
    })
    s += `<text x="${m.l + gi * gw + gw / 2}" y="${H - m.b + 18}" class="eje" text-anchor="middle">${esc(g.etiqueta)}</text>`
    if (g.sub) s += `<text x="${m.l + gi * gw + gw / 2}" y="${H - m.b + 32}" class="eje tenue" text-anchor="middle">${esc(g.sub)}</text>`
  })
  s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}" class="base"/></svg>`
  return leyenda(series) + s
}

function leyenda(series, estilos) {
  return `<div class="leyenda">${series.map((x, i) => `<span><i style="background:var(--s${x.color ?? i + 1})" class="${estilos?.[i] ?? ''}"></i>${esc(x.nombre)}</span>`).join('')}</div>`
}

/** Barras horizontales simples (una serie). */
function barrasH({ filas, unidad, alto }) {
  const W = 720
  const fh = 30
  const H = alto ?? filas.length * fh + 30
  const m = { l: 230, r: 60, t: 8, b: 20 }
  const top = Math.max(...filas.map((f) => f.valor))
  const x = (v) => m.l + (v / top) * (W - m.l - m.r)
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" class="grafico">`
  filas.forEach((f, i) => {
    const yy = m.t + i * fh
    s += `<g class="marca" data-tip="${esc(`${f.etiqueta}: ${num(f.valor, 1)} ${unidad}`)}"><rect x="0" y="${yy}" width="${W}" height="${fh}" fill="transparent"/>`
    s += `<text x="${m.l - 8}" y="${yy + 19}" class="eje" text-anchor="end">${esc(f.etiqueta)}</text>`
    const w = Math.max(4, x(f.valor) - m.l)
    s += `<path d="M${m.l},${yy + 6} h${w - 4} q4,0 4,4 v10 q0,4 -4,4 h-${w - 4} Z" style="fill:var(--s${f.color ?? 1})"/>`
    s += `<text x="${m.l + w + 6}" y="${yy + 19}" class="valor">${num(f.valor, 1)}×</text></g>`
  })
  s += `<line x1="${x(1)}" x2="${x(1)}" y1="${m.t}" y2="${H - m.b + 4}" class="referencia"/><text x="${x(1) + 4}" y="${H - 4}" class="eje tenue">1× = igualdad</text>`
  return s + '</svg>'
}

/** Líneas: acumulado mediano por sesión. lineas: [{nombre, color, punteada, datos[]}] */
function lineas({ lineas: ls, n = 40, refs = [], max }) {
  const W = 720
  const H = 340
  const m = { l: 48, r: 120, t: 14, b: 36 }
  const iw = W - m.l - m.r
  const ih = H - m.t - m.b
  const top = max ?? Math.max(...ls.flatMap((l) => l.datos.slice(0, n)))
  const paso = top > 600 ? 200 : top > 300 ? 100 : 50
  const techo = Math.ceil(top / paso) * paso
  const x = (i) => m.l + (i / (n - 1)) * iw
  const y = (v) => m.t + ih - (Math.min(v, techo) / techo) * ih
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" class="grafico lineas" data-n="${n}">`
  for (let v = 0; v <= techo; v += paso) s += `<line x1="${m.l}" x2="${m.l + iw}" y1="${y(v)}" y2="${y(v)}" class="rejilla"/><text x="${m.l - 6}" y="${y(v) + 4}" class="eje" text-anchor="end">${v}</text>`
  for (let i = 0; i < n; i += 5) s += `<text x="${x(i)}" y="${H - m.b + 16}" class="eje" text-anchor="middle">${i + 1}</text>`
  s += `<text x="${m.l + iw / 2}" y="${H - 4}" class="eje tenue" text-anchor="middle">sesiones de 15 min</text>`
  refs.forEach((r, i) => {
    s += `<line x1="${m.l}" x2="${m.l + iw}" y1="${y(r.valor)}" y2="${y(r.valor)}" class="referencia"/><text x="${i % 2 ? m.l + iw - 4 : m.l + iw * 0.55}" y="${y(r.valor) - 5}" class="eje tenue" text-anchor="end">${esc(r.nombre)} (${r.valor})</text>`
  })
  const etiquetas = []
  ls.forEach((l) => {
    const pts = l.datos.slice(0, n).map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    s += `<polyline points="${pts.join(' ')}" fill="none" style="stroke:var(--s${l.color})" stroke-width="2" ${l.punteada ? 'stroke-dasharray="5 4"' : ''}/>`
    etiquetas.push({ y: y(l.datos[n - 1]), texto: `${l.nombre}: ${num(l.datos[n - 1])}`, color: l.color })
  })
  etiquetas.sort((a, b) => a.y - b.y)
  for (let i = 1; i < etiquetas.length; i++) if (etiquetas[i].y - etiquetas[i - 1].y < 14) etiquetas[i].y = etiquetas[i - 1].y + 14
  for (const e of etiquetas) s += `<text x="${m.l + iw + 6}" y="${e.y + 4}" class="valor">${esc(e.texto)}</text>`
  // Capa de lectura: una franja por sesión con todos los valores.
  for (let i = 0; i < n; i++) {
    const tip = `Sesión ${i + 1}: ` + ls.map((l) => `${l.nombre} ${num(l.datos[i])}`).join(' · ')
    s += `<rect class="franja" x="${x(i) - iw / (n - 1) / 2}" y="${m.t}" width="${iw / (n - 1)}" height="${ih}" data-tip="${esc(tip)}" data-x="${x(i)}"/>`
  }
  s += `<line class="cruz" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}"/>`
  return s + '</svg>'
}

// ─── Tablas ────────────────────────────────────────────────────────────────
const tabla = (cab, filas, clase = '') =>
  `<div class="tabla-envoltura"><table class="${clase}"><thead><tr>${cab.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${filas
    .map((f) => `<tr>${f.map((c, i) => (i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`)).join('')}</tr>`)
    .join('')}</tbody></table></div>`

const md = (cab, filas) => `| ${cab.join(' | ')} |\n|${cab.map((_, i) => (i ? '---:' : '---')).join('|')}|\n${filas.map((f) => `| ${f.join(' | ')} |`).join('\n')}\n`

const rango = (r) => `${num(r.p50)} <span class="tenue">(${num(r.p10)}–${num(r.p90)})</span>`
const rangoMd = (r) => `${num(r.p50)} (${num(r.p10)}–${num(r.p90)})`

// Niveles (código real)
const reglasNivel = {
  0: { actividad: '1 por frase', tope: '10', hitos: '—', relectura: '1/día (nunca paga: bug)' },
  1: { actividad: '1 por frase', tope: '10', hitos: '—', relectura: '1/día (nunca paga: bug)' },
  2: { actividad: '1 por oración', tope: 'sin tope', hitos: '+5 al 100 %', relectura: '1/día' },
  3: { actividad: '4 por párrafo', tope: '15', hitos: '—', relectura: '2/día (nunca paga: bug)' },
  4: { actividad: '0 por página', tope: '—', hitos: '+5/+10/+10/+15 al 25/50/75/100 %', relectura: '3/día' },
}
const rangoLista = (xs) => `${Math.min(...xs)}–${Math.max(...xs)}`
const filasNiveles = R.niveles.map((n) => [
  `Nivel ${n.nivel}`,
  rangoLista(n.unidades),
  rangoLista(n.palabras),
  rangoLista(n.silabas),
  reglasNivel[n.nivel].actividad,
  reglasNivel[n.nivel].tope,
  reglasNivel[n.nivel].hitos,
  rangoLista(n.monedas),
  String(n.totalMonedas),
  reglasNivel[n.nivel].relectura,
  rangoLista(n.esperadoMinPorCuento),
])
const cabNiveles = ['Nivel', 'Unidades por cuento', 'Palabras', 'Sílabas', 'Paga por actividad', 'Tope por libro', 'Hitos', 'Monedas por cuento', 'Total del nivel (8 cuentos)', 'Relectura', 'Min. de lectura a ritmo de referencia']

// Sesión por perfil × duración, para un modelo
const filasSesion = (id) =>
  P.map((p) => [`${p.id} · ${p.nombre}`, ...R.duraciones.map((d) => rango(M[id].celdas[p.id][d].monedas)), num(M[id].celdas[p.id][15].porMinuto, 2), num(M[id].celdas[p.id][15].libros.p50), num(M[id].celdas[p.id][15].unidades.p50)])
const filasSesionMd = (id) =>
  P.map((p) => [`${p.id}`, ...R.duraciones.map((d) => rangoMd(M[id].celdas[p.id][d].monedas)), num(M[id].celdas[p.id][15].porMinuto, 2), num(M[id].celdas[p.id][15].libros.p50), num(M[id].celdas[p.id][15].unidades.p50)])
const cabSesion = ['Perfil', '10 min', '15 min', '20 min', '30 min', 'Monedas/min (15)', 'Cuentos terminados (15)', 'Unidades leídas (15)']

// Comparación de modelos
const orden = ['M0', 'PREV', 'A', 'B', 'C', 'D', 'E', 'E2']
const comprension = { M0: '3 — «cada frase da una moneda», pero el tope repartido y la regla del 80 % no se entienden', PREV: '3 — igual que hoy', A: '3 — igual que hoy, con números distintos por nivel', B: '4 — logros con nombre («¡ya conoces 30 sílabas!»)', C: '5 — una barra que se llena leyendo', D: '3 — «las frases largas dan más»; no se ve por qué', E: '4 — «cada frase da monedas, las largas más; terminar el cuento da premio; la barra de lectura da extra»', E2: '4 — «cada frase que terminas da monedas; terminar el cuento, aprender sílabas nuevas y releer mejor dan premios»' }
const peorAbuso = (m) => m.abuso.reduce((a, b) => (b.porMinuto > a.porMinuto ? b : a))
const acum = (id, perfil, k = 144) => M[id].campanas[perfil].relee.curvaMediana[k - 1]
const filasModelos = orden.map((id) => {
  const m = M[id]
  return [
    esc(m.nombre),
    ...P.map((p) => num(m.celdas[p.id][15].monedas.p50)),
    `${num(m.equidad.maxMin, 2)}×`,
    num(m.equidad.gini, 2),
    `${num(m.casoUsuario.monedas.p50)}`,
    `${num(peorAbuso(m).porMinuto, 1)}/min`,
    `${num(Math.min(...P.map((p) => acum(id, p.id))))}–${num(Math.max(...P.map((p) => acum(id, p.id))))}`,
    comprension[id],
  ]
})
const cabModelos = ['Modelo', 'P0', 'P1', 'P2', 'P3', 'P4', 'Máx/mín por minuto', 'Gini', 'Caso «20 min por cuento» (25 min)', 'Peor abuso', 'Acumulado en 144 sesiones (relee)', 'Comprensible para un niño (1–5)']

// Sesiones necesarias
const articulos = [...R.articulos, { id: 'catalogo', nombre: `Catálogo completo actual (${R.catalogoCompleto})`, precio: R.catalogoCompleto }]
const filasSesiones = (id, modo) =>
  articulos.map((a) => [
    `${esc(a.nombre)} · ${a.precio}`,
    ...P.map((p) => {
      const v = M[id].campanas[p.id][modo].sesionesPara[a.id]
      return v.p50 == null ? '<span class="malo">no alcanza</span>' : `${v.p50} <span class="tenue">(${v.p10}–${ses(v.p90)})</span>`
    }),
  ])
const filasSesionesMd = (id, modo) =>
  articulos.map((a) => [
    `${a.nombre} · ${a.precio}`,
    ...P.map((p) => {
      const v = M[id].campanas[p.id][modo].sesionesPara[a.id]
      return v.p50 == null ? 'no alcanza' : `${v.p50} (${v.p10}–${ses(v.p90)})`
    }),
  ])
const cabSesiones = ['Artículo · precio', ...P.map((p) => p.id)]

// Escenarios de precio (propuesta v3, no aplicada)
const celdaSes = (v, html) => (v.p50 == null ? (html ? '<span class="malo">no alcanza</span>' : 'no alcanza') : html ? `${v.p50} <span class="tenue">(${v.p10}–${ses(v.p90)})</span>` : `${v.p50} (${v.p10}–${ses(v.p90)})`)
const filasPrecios = (id, modo, html = true) =>
  R.escenariosPrecio.map((a) => [`${html ? esc(a.nombre) : a.nombre} · ${a.precio}`, ...P.map((p) => celdaSes(M[id].campanas[p.id][modo].sesionesParaPrecio[a.id], html))])

// Cuncuna: sesiones hasta 4/6/8 cuentos distintos y hasta los minutos activos (independiente del modelo; se usa E)
const cun = (p) => M.E2.campanas[p.id].relee.sesionesHastaCuentos
const filasCuncuna = (html = true) =>
  P.map((p) => [
    `${p.id}`,
    ...[4, 6, 8].map((u) => {
      const v = cun(p)[u]
      return `${celdaSes(v, html)}${v.nunca ? ` · ${html ? '<span class="tenue">' : ''}${num(v.nunca * 100, 1)} % nunca${html ? '</span>' : ''}` : ''}`
    }),
    celdaSes(cun(p).activoCuncuna, html),
  ])
const cabCuncuna = ['Perfil', '4 cuentos distintos', '6 cuentos distintos', '8 cuentos (nivel completo)', '60 min de lectura activa']
const filasLento = (html = true) =>
  ['M0', 'PREV', 'A', 'B', 'C', 'D', 'E', 'E2'].flatMap((id) =>
    M[id].p0Lento.map((l) => [
      `${html ? esc(M[id].nombre) : M[id].nombre} · sesiones de ${l.minutos} min${l.marcapaginas ? ' con marcapáginas' : ''}`,
      num(l.monedasEn20.p50),
      num(l.monedasEn60.p50),
      l.sesionesHasta6Cuentos.p50 == null ? (html ? '<span class="malo">nunca</span>' : 'nunca') : `${l.sesionesHasta6Cuentos.p50} (${l.sesionesHasta6Cuentos.p10}–${ses(l.sesionesHasta6Cuentos.p90)})`,
      `${l.sesionesHastaMinActivos.p50}`,
      l.sesionesProgresoCuncuna?.p50 == null ? '—' : `${l.sesionesProgresoCuncuna.p50} (${l.sesionesProgresoCuncuna.p10}–${ses(l.sesionesProgresoCuncuna.p90)})`,
    ]),
  )
const cabLento = ['Modelo · duración', 'Monedas en 20 sesiones', 'Monedas en 60 sesiones', 'Sesiones hasta 6 cuentos', 'Sesiones hasta 60 min activos', 'Sesiones hasta 60 min activos + 30 frases N0']

// Abusos ampliados, fuentes y grilla de P0
const filasAbusoAmpliado = (html = true) =>
  ['M0', 'A', 'B', 'D', 'E', 'E2'].flatMap((id) => M[id].abusoAmpliado.map((a, i) => [i ? '' : html ? esc(M[id].nombre) : M[id].nombre, html ? esc(a.accion) : a.accion, num(a.monedas), num(a.minutos, 1), html ? `<b>${num(a.porMinuto, 1)}</b>` : num(a.porMinuto, 1)]))
const FUENTES = [['unidad', 'Frase leída por 1.ª vez'], ['relectura', 'Relectura'], ['libro', 'Cuento terminado'], ['nuevas', 'Sílabas/palabras nuevas'], ['nivel', 'Nivel completo'], ['mejora', 'Relectura con mejora'], ['bloque', 'Rato de lectura'], ['hitos', 'Hitos %']]
const filasFuentes = (id, cual) =>
  P.map((p) => {
    const f = cual === 'sesion' ? M[id].celdas[p.id][15].fuentes : M[id].campanas[p.id][cual].fuentes
    const tot = Object.values(f).reduce((a, b) => a + b, 0) || 1
    return [`${p.id}${cual === 'sesion' ? '' : cual === 'relee' ? ' · campaña releyendo' : ' · campaña con textos nuevos'}`, ...FUENTES.map(([k]) => (cual === 'sesion' ? num(f[k] ?? 0, 1) : `${num((100 * (f[k] ?? 0)) / tot, 0)} %`))]
  })
const filasGrilla = (id) => {
  const g = M[id].campanas.P0
  const l = M[id].p0Lento[0]
  return Object.keys(g.relee.sesionesParaGrilla).map((pr) => [pr, ...[g.relee.sesionesParaGrilla[pr], g.subidos.sesionesParaGrilla[pr]].flatMap((v) => [ses(v.p50), ses(v.p90)]), ses(l.sesionesParaGrilla[pr].p50), ses(l.sesionesParaGrilla[pr].p90)])
}

// Abusos
const filasAbuso = orden.flatMap((id) => M[id].abuso.map((a, i) => [i ? '' : esc(M[id].nombre), esc(a.accion), num(a.monedas), num(a.minutos, 1), `<b>${num(a.porMinuto, 1)}</b>`]))

// Supuestos
const filasSupuestos = [
  ...P.map((p) => [`${p.id} · ${esc(p.nombre)}`, `${p.ppm} ppm; tropiezo ${Math.round(p.tropiezo * 100)} %/frase; ${p.pausasPorMin} pausas/min de ${p.pausaSeg} s; repite ${Math.round(p.repetir * 100)} %; fuera de lectura ${Math.round(p.fuera * 100)} %`, esc(p.ancla)]),
  ...Object.entries(R.supuestos).map(([k, v]) => [k, esc(typeof v.valor === 'object' ? JSON.stringify(v.valor) : v.valor), esc(v.nota)]),
]

// ─── Página ────────────────────────────────────────────────────────────────
const e0 = M.E
const m0 = M.M0
const grupos15 = P.map((p) => ({ etiqueta: p.id, sub: `nivel ${p.nivel}`, valores: ['M0', 'PREV', 'E'].map((id) => M[id].celdas[p.id][15].monedas) }))
const g1 = barrasAgrupadas({ grupos: grupos15, series: [{ nombre: 'Actual (2.4.1)' }, { nombre: 'Propuesta previa N0 = 2/frase' }, { nombre: 'E · Híbrido recomendado' }], unidad: 'monedas', alto: 320 })
const g2 = barrasH({ filas: orden.map((id) => ({ etiqueta: M[id].nombre.replace(' (recomendado)', ''), valor: M[id].equidad.maxMin, color: id === 'E' ? 3 : 1 })), unidad: 'veces' })
const g3 = lineas({
  n: 40,
  lineas: [
    { nombre: 'P4 actual', color: 2, punteada: true, datos: m0.campanas.P4.relee.curvaMediana },
    { nombre: 'P0 actual', color: 1, punteada: true, datos: m0.campanas.P0.relee.curvaMediana },
    { nombre: 'P4 con E', color: 2, datos: e0.campanas.P4.relee.curvaMediana },
    { nombre: 'P0 con E', color: 1, datos: e0.campanas.P0.relee.curvaMediana },
  ],
  refs: [{ nombre: 'Conjunto Mago', valor: 79 }, { nombre: 'Dragón propuesto', valor: 120 }],
})

const tiles = [
  ['15×', 'más monedas por minuto gana hoy un lector fluido (P4) que un niño que empieza con sílabas (P0)'],
  [`${num(m0.celdas.P0[15].monedas.p50)} vs ${num(m0.celdas.P4[15].monedas.p50)}`, 'monedas en una sesión de 15 min con cuentos nuevos: P0 vs P4 (mediana)'],
  [`${num(acum('M0', 'P0'))}`, 'monedas que junta P0 en 144 sesiones si solo tiene los cuentos de Ciempi: no alcanza para un conjunto'],
  ['36/min', 'monedas que da hoy subir un texto de 300 «Mariposa amarilla.» (nivel 2, sin tope)'],
]

const parametros = [
  ['TASA_PRIMERA_LECTURA', '2', 'monedas por cada minuto «esperado» de una unidad leída por primera vez'],
  ['TASA_RELECTURA', '1', 'la mitad al releer (sin límite diario: el tiempo ya lo limita)'],
  ['SILABAS_POR_MINUTO_REFERENCIA', '{ 0: 7, 1: 22, 2: 60, 3: 105, 4: 165 }', 'ritmo tranquilo de un lector de ese nivel; no es una exigencia de velocidad'],
  ['SEGUNDOS_POR_UNIDAD_REFERENCIA', '3', 'tiempo de paso entre frases que se suma a lo esperado'],
  ['Pago de la unidad', 'TASA × min(esperado, activo real)', 'activo = MAX_PAUSA_ACTIVA_MS ya existente (pausas de más de 10 s no cuentan). Se acumulan fracciones por libro'],
  ['PREMIO_LIBRO_TERMINADO', '3', 'primera vez; solo si el libro tiene ≥ 1 min esperado y el tiempo activo fue ≥ 50 % de lo esperado; no para textos que sube el propio niño'],
  ['NUEVAS (nivel 0)', '+2 cada 15 sílabas distintas', '«¡Ya conoces 30 sílabas!» (los 8 cuentos de nivel 0 tienen 100 sílabas distintas)'],
  ['NUEVAS (nivel 1)', '+2 cada 25 palabras distintas', '«¡Ya leíste 50 palabras distintas!» (170 en los 8 cuentos de nivel 1)'],
  ['PREMIO_NIVEL_COMPLETO', '15', 'terminar los 8 cuentos del nivel; en nivel 0, además, la Cuncuna'],
  ['RATO_DE_LECTURA', '+2 cada 5 min activos, máx. 6 al día', 'barra visible; al llenarse: «¡Hoy ya leíste un buen rato!»'],
  ['Tropiezo', 'ya no quita la moneda', 'se mantiene «Más despacito 🐢»; ir rápido ya no paga más porque se paga por tiempo activo'],
  ['Regla del 80 % (MINIMO_A_BUEN_RITMO)', 'se retira del pago', 'la reemplaza min(esperado, activo)'],
  ['TOPE_POR_LIBRO, HITOS, MONEDAS_POR_UNIDAD', 'se retiran', 'el pago por tiempo esperado ya escala con el largo; se acaban los textos de 1 frase que dan 40'],
]

const css = `
:root{color-scheme:light;--fondo:#fcfcfb;--superficie:#ffffff;--borde:#e4e2dc;--tinta:#1b1b19;--tinta-2:#52514e;--tinta-3:#7a7873;--acento:#1c5cab;--malo:#b3261e;
--s1:#2a78d6;--s2:#eb6834;--s3:#1baf7a;--s4:#eda100;--s5:#e87ba4;--rejilla:#ecebe6;--base:#9b9a95}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--fondo:#141413;--superficie:#1a1a19;--borde:#34332f;--tinta:#f0efec;--tinta-2:#c3c2b7;--tinta-3:#9a998f;--acento:#86b6ef;--malo:#f2867f;
--s1:#3987e5;--s2:#d95926;--s3:#199e70;--s4:#c98500;--s5:#d55181;--rejilla:#2a2a27;--base:#6b6a65}}
:root[data-theme="dark"]{color-scheme:dark;--fondo:#141413;--superficie:#1a1a19;--borde:#34332f;--tinta:#f0efec;--tinta-2:#c3c2b7;--tinta-3:#9a998f;--acento:#86b6ef;--malo:#f2867f;
--s1:#3987e5;--s2:#d95926;--s3:#199e70;--s4:#c98500;--s5:#d55181;--rejilla:#2a2a27;--base:#6b6a65}
*{box-sizing:border-box}
body{margin:0;background:var(--fondo);color:var(--tinta);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:1060px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:1.9rem;line-height:1.2;margin:0 0 8px}
h2{font-size:1.35rem;margin:48px 0 12px;padding-top:12px;border-top:1px solid var(--borde)}
h3{font-size:1.05rem;margin:28px 0 8px}
p,li{max-width:72ch;color:var(--tinta)}
.tenue{color:var(--tinta-3)}
.malo{color:var(--malo);font-weight:600}
.aviso{background:var(--superficie);border:1px solid var(--borde);border-left:4px solid var(--s4);padding:12px 16px;border-radius:8px;max-width:none}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:20px 0}
.tile{background:var(--superficie);border:1px solid var(--borde);border-radius:10px;padding:14px 16px}
.tile b{display:block;font-size:1.7rem;line-height:1.1;font-variant-numeric:tabular-nums}
.tile span{color:var(--tinta-2);font-size:.9rem}
.tabla-envoltura{overflow-x:auto;margin:12px 0 4px;border:1px solid var(--borde);border-radius:8px;background:var(--superficie)}
table{border-collapse:collapse;width:100%;font-size:.88rem;font-variant-numeric:tabular-nums}
th,td{padding:7px 10px;border-bottom:1px solid var(--borde);text-align:right;vertical-align:top}
th:first-child,td:first-child{text-align:left}
thead th{background:var(--fondo);color:var(--tinta-2);font-weight:600;position:sticky;top:0}
tbody th{font-weight:600}
table.texto td{text-align:left}
table.ultima-texto td:last-child{text-align:left;min-width:15em}
tr.destacada th,tr.destacada td{background:color-mix(in srgb,var(--s3) 12%,transparent)}
code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.85rem}
pre{background:var(--superficie);border:1px solid var(--borde);border-radius:8px;padding:12px 14px;overflow-x:auto}
.figura{background:var(--superficie);border:1px solid var(--borde);border-radius:10px;padding:14px 12px 8px;margin:12px 0}
.figura figcaption{color:var(--tinta-2);font-size:.88rem;margin-top:6px}
.grafico{width:100%;height:auto;display:block}
.grafico text{font-size:12px;fill:var(--tinta-2)}
.grafico .valor{fill:var(--tinta);font-size:12px}
.grafico .tenue{fill:var(--tinta-3)}
.rejilla{stroke:var(--rejilla);stroke-width:1}
.base{stroke:var(--base);stroke-width:1}
.bigote{stroke:var(--tinta-2);stroke-width:1.2}
.referencia{stroke:var(--tinta-3);stroke-width:1;stroke-dasharray:3 3}
.franja{fill:transparent}
.cruz{stroke:var(--tinta-3);stroke-width:1;opacity:0}
.lineas:hover .cruz{opacity:1}
.marca:hover path{opacity:.85}
.leyenda{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:.88rem;color:var(--tinta-2);margin:0 0 6px 4px}
.leyenda i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-1px}
.leyenda i.punteada{height:0;border-top:2px dashed var(--tinta-2);background:none!important;width:18px;vertical-align:3px}
.leyenda i.linea{height:0;border-top:2px solid var(--tinta-2);background:none!important;width:18px;vertical-align:3px}
#tip{position:fixed;pointer-events:none;background:var(--tinta);color:var(--fondo);font-size:.82rem;padding:6px 9px;border-radius:6px;max-width:320px;opacity:0;transition:opacity .1s;z-index:10}
.recomendado{border:2px solid var(--s3);border-radius:10px;padding:4px 16px 12px;background:var(--superficie)}
nav ol{columns:2;max-width:none;font-size:.95rem}
@media (max-width:640px){nav ol{columns:1}h1{font-size:1.5rem}}
`

const nav = [
  ['diagnostico', 'Diagnóstico'],
  ['niveles', 'Cómo paga hoy cada nivel'],
  ['actual', 'Simulación del modelo actual'],
  ['previa', 'La propuesta previa (N0 = 2 por frase, tope 10)'],
  ['modelos', 'Modelos A–E comparados'],
  ['recomendado', 'Modelo E y E2 (recomendado v3)'],
  ['campana', 'A lo largo de muchas sesiones'],
  ['precios', 'Esfuerzo por artículo y precios'],
  ['abuso', 'Abuso y topes'],
  ['riesgos', 'Riesgos y qué medir'],
  ['supuestos', 'Supuestos y fuentes'],
  ['detalle', 'Anexo: los 7 modelos × 5 perfiles × 4 duraciones'],
]

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Economía Ciempi v3</title><link rel="icon" href="data:,">
<style>${css}</style></head>
<body><main>
<h1>Economía de monedas de Ciempi · v3</h1>
<p class="tenue">Documento completo: <code>ECONOMIA-V3.md</code>. Análisis, simulador y propuesta. Semilla ${R.semilla}, ${R.nNinos} niños simulados por celda. Generado por <code>simulador/generar-informe.mjs</code>.</p>
<p class="aviso"><b>Son estimaciones con supuestos, no datos de niños reales.</b> Lo que viene del código del juego (troceo de los 40 cuentos, monedas por unidad, topes, hitos, precios) está verificado ejecutando ese código. Las velocidades de lectura, pausas, tropiezos y tiempos fuera de la lectura son supuestos anclados en normas públicas cuando las hay (ver <a href="#supuestos">Supuestos</a>). Nada se aplicó al juego.</p>
<nav><ol>${nav.map(([id, t]) => `<li><a href="#${id}">${t}</a></li>`).join('')}</ol></nav>

<h2 id="diagnostico">1. Diagnóstico</h2>
<div class="tiles">${tiles.map(([b, s]) => `<div class="tile"><b>${b}</b><span>${s}</span></div>`).join('')}</div>
<ul>
<li><b>El dinero va por libro, no por tiempo.</b> Los topes por libro (10 en N0 y N1) hacen que un cuento de nivel 0 pague 7–9 monedas tarde lo que tarde. Un niño que demora 20 minutos gana lo mismo que uno que demora 4. En el nivel 4, un cuento de ~300 palabras paga 40.</li>
<li><b>Un tropiezo cuesta varias monedas en N0 y N1.</b> La frase con tropiezo no paga, y por la regla del 80 % del tramo tampoco avanzan las siguientes hasta recuperar el ritmo. Esas monedas no se recuperan nunca, porque la relectura en N0, N1 y N3 no paga (bug ya conocido). Por eso P0 junta solo ~${num(acum('M0', 'P0'))} de las 65 monedas de su nivel en toda la vida del juego.</li>
<li><b>Un cuento siempre empieza desde el principio</b> (<code>fraseDeInicio</code>). Si la sesión se acaba a mitad de un cuento, la próxima vez el niño relee la primera parte sin ganar nada. Esto castiga justo al lector lento.</li>
<li><b>Los cuentos se acaban rápido para los avanzados</b> (P2–P4 los terminan en 2–3 sesiones de 15 min) y después casi no hay ingreso. La mediana de P0 tarda ${num(m0.campanas.P0.relee.agotaCuentos.p50)} sesiones.</li>
<li><b>Hay fugas grandes</b>, verificadas con el código real. Un niño puede subir un texto que se sugiere en nivel 2, que no tiene tope (300 oraciones = 305 monedas). Un adulto puede asignar en nivel 4 un texto de una frase, que paga 40. Además, el servidor acepta <code>POST /monedas</code> de ±100 sin cotejar nada.</li>
</ul>

<h2 id="niveles">2. Cómo paga hoy cada nivel (código real, 8 cuentos por nivel)</h2>
<p>Los cuentos se trocearon ejecutando <code>dividirConParrafos</code> y <code>vistaPorNivel</code> del juego, y el pago con <code>monedasDeUnidad</code> y <code>HITOS</code>. La última columna es lo que tarda un lector «de referencia» de ese nivel (modelo E), sin pausas.</p>
${tabla(cabNiveles, filasNiveles)}
<p>Total de los 40 cuentos en primera lectura: <b>${R.niveles.reduce((s, n) => s + n.totalMonedas, 0)}</b> monedas. El nivel 2 da 118, no 112 como decía el documento anterior: «Don Ciempiés va a la escuela» tiene 12 oraciones. Comprar todo el catálogo actual cuesta <b>${R.catalogoCompleto}</b> monedas: 81 piezas de pago que suman ${R.catalogoResumen.totalTodoSuelto}, menos 36 por las familias de colores que se compran una sola vez.</p>

<h2 id="actual">3. Simulación del modelo actual</h2>
<p>Primera sesión con cuentos nuevos. Mediana y, entre paréntesis, p10–p90 de ${R.nNinos} niños por perfil.</p>
${tabla(cabSesion, filasSesion('M0'))}
<figure class="figura">${g1}<figcaption>Monedas en una sesión de 15 min con cuentos nuevos (barra = mediana; bigote = p10–p90). Pasa el cursor sobre una barra para ver el valor.</figcaption></figure>

<h2 id="previa">4. La propuesta previa: «nivel 0 = 2 monedas por frase, tope 10»</h2>
<p>Esta propuesta sube el cuento de nivel 0 de 7–9 a 10 monedas, que es lo que da el nivel 1. En la sesión de 15 min, P0 pasa de ${num(m0.celdas.P0[15].monedas.p50)} a ${num(M.PREV.celdas.P0[15].monedas.p50)} monedas. La brecha por minuto con P4 baja de ${num(m0.equidad.maxMin, 1)}× a ${num(M.PREV.equidad.maxMin, 1)}×. En el caso que describes, un niño que tarda ~20 min por cuento, gana ${num(M.PREV.casoUsuario.monedas.p50)} monedas en 25 min, frente a ${num(m0.casoUsuario.monedas.p50)} hoy.</p>
<p><b>No resuelve el desequilibrio por sesión</b>, porque el tope sigue siendo por cuento. Con tope 10, el cuento paga 10 tarde lo que tarde, y el problema de P0 es justamente que tarda. Arregla el empate entre N0 y N1, nada más. Para equilibrar por sesión, la paga tiene que crecer con el esfuerzo (tiempo esperado de lectura) y no con la cantidad de cuentos terminados.</p>

<h2 id="modelos">5. Modelos A–E comparados</h2>
<p>A–E suponen hecha la «Fase 0»: relectura corregida, tope del nivel 2 y pagos calculados en el servidor. Columnas P0–P4: monedas (mediana) en 15 min con cuentos nuevos. «Máx/mín por minuto» compara el perfil que más gana por minuto con el que menos (1× = igualdad). Gini sobre las 5 medianas (0 = igualdad).</p>
${tabla(cabModelos, filasModelos, 'ultima-texto').replace(`<tr><th scope="row">${esc(M.E2.nombre)}`, `<tr class="destacada"><th scope="row">${esc(M.E2.nombre)}`)}
<figure class="figura">${g2}<figcaption>Brecha de monedas por minuto entre el perfil que más gana y el que menos (sesión de 15 min, cuentos nuevos).</figcaption></figure>
<h3>Qué hace cada modelo</h3>
<ul>${orden.map((id) => `<li><b>${esc(M[id].nombre)}</b>: ${esc(M[id].resumen)}</li>`).join('')}</ul>
<h3>Lectura de los resultados</h3>
<ul>
<li><b>A (multiplicadores)</b> iguala las medianas (${num(M.A.equidad.maxMin, 2)}×), pero conserva todo lo frágil: topes por libro, la regla del 80 %, el tropiezo que quita monedas y el pago por terminar libros. Además, triplicar el nivel 0 vuelve más rentable la fuga de textos cortos (${num(peorAbuso(M.A).porMinuto)}/min). Cuando se acaban los cuentos, los avanzados se quedan casi sin ingreso.</li>
<li><b>B (hitos)</b> ayuda a P0 una sola vez (sílabas nuevas, primer cuento), pero no cambia la tasa por sesión: sigue en ${num(M.B.equidad.maxMin, 1)}×.</li>
<li><b>C (rato de lectura)</b> es lo más fácil de entender, pero sobre la base actual el bono es pequeño frente a los 40 por cuento del nivel 4 (${num(M.C.equidad.maxMin, 1)}×).</li>
<li><b>D (esfuerzo esperado)</b> es el más parejo (${num(M.D.equidad.maxMin, 2)}×), pero paga lo esperado aunque el niño arrastre el dedo sin leer. Con un texto largo subido, eso da <b>${num(peorAbuso(M.D).porMinuto)}/min</b>.</li>
<li><b>E (híbrido)</b> toma la paga de D, pero nunca paga más que el tiempo activo real. Así arrastrar rápido no rinde y demorarse más de lo esperado tampoco. Encima suma logros pedagógicos y una barra de «rato de lectura» visible. Es parejo (${num(e0.equidad.maxMin, 2)}×, Gini ${num(e0.equidad.gini, 2)}), su peor abuso queda acotado a ~${num(peorAbuso(e0).porMinuto, 1)}/min (lo mismo que leer de verdad) y el gasto total es predecible.</li>
</ul>

<h2 id="recomendado">6. Modelo E (checkpoint) y E2 · híbrido ajustado (recomendado v3)</h2>
<p><b>E2 es la versión recomendada</b> tras la revisión de Fable y las preferencias del usuario (ver <code>ECONOMIA-V3.md</code>). Abajo, primero E tal como quedó en el checkpoint y después lo que cambia en E2.</p>
<div class="recomendado">
<p><b>Idea para el niño:</b> «Cada frase que lees le da monedas a Ciempi, y las largas dan más. Al terminar un cuento hay premio. Cada sílaba nueva que aprendes suma. Y mientras lees se va llenando tu barra de lectura.»</p>
<p><b>Idea para el adulto:</b> se paga el esfuerzo. Cada frase vale lo que a un lector de ese nivel le toma leerla con calma, pero nunca más que el tiempo que el niño estuvo leyendo de verdad. La velocidad no da más monedas, y la lentitud tampoco quita las que corresponden.</p>
${tabla(['Parámetro', 'Valor', 'Qué significa'], parametros, 'texto')}
<pre>// Propuesta para src/lectura/monedas.ts (NO aplicada)
export const TASA_PRIMERA_LECTURA = 2
export const TASA_RELECTURA = 1
export const SILABAS_POR_MINUTO_REFERENCIA: Record&lt;NivelLectura, number&gt; = { 0: 7, 1: 22, 2: 60, 3: 105, 4: 165 }
export const SEGUNDOS_POR_UNIDAD_REFERENCIA = 3
export const PREMIO_LIBRO_TERMINADO = 3
export const NUEVAS = { 0: { cada: 15, monedas: 2, que: 'silabas' }, 1: { cada: 25, monedas: 2, que: 'palabras' } } as const
export const PREMIO_NIVEL_COMPLETO = 15
export const RATO_DE_LECTURA = { minutos: 5, monedas: 2, maxPorDia: 6 }

/** Minutos que a un lector de este nivel le toma leer la unidad con calma. */
export const minutosEsperados = (nivel: NivelLectura, silabas: number) =&gt;
  silabas / SILABAS_POR_MINUTO_REFERENCIA[nivel] + SEGUNDOS_POR_UNIDAD_REFERENCIA / 60

/** Monedas (con fracción) de una unidad: nunca más que el tiempo activo real. */
export const valorUnidad = (nivel: NivelLectura, silabas: number, segundosActivos: number, primeraVez: boolean) =&gt;
  (primeraVez ? TASA_PRIMERA_LECTURA : TASA_RELECTURA) * Math.min(minutosEsperados(nivel, silabas), segundosActivos / 60)
// La fracción se acumula por libro; se paga la parte entera al terminar cada unidad.</pre>
<p>Resultado simulado (15 min, cuentos nuevos): ${P.map((p) => `${p.id} ${num(e0.celdas[p.id][15].monedas.p50)}`).join(' · ')} monedas. Con P0 a 10, 15, 20 y 30 min: ${R.duraciones.map((d) => num(e0.celdas.P0[d].monedas.p50)).join(' / ')}. El caso de «20 min por cuento» gana ${num(e0.casoUsuario.monedas.p50)} en 25 min, frente a ${num(m0.casoUsuario.monedas.p50)} hoy.</p>
</div>

<div class="recomendado">
<p><b>E2 · qué cambia respecto de E</b></p>
${tabla(['Parámetro', 'E2', 'Por qué'], [
  ['Rato de lectura', 'eliminado', 'Decisión del usuario: nunca pagar por tener la app abierta'],
  ['Pago de la frase completada', '2 × min(minutos activos, 2 × esperado)', 'El que lee hasta 2 veces más lento que la referencia cobra todo su tiempo activo; el tiempo inactivo (pausas &gt; 10 s) no cuenta'],
  ['Referencia N0', '5 síl/min (antes 7)', 'Revisión de Fable: el lento perdía'],
  ['Cuento terminado', 'min(3, minutos esperados), si ≥ 1 min y activo ≥ 50 %', 'Revisión de Fable: el +3 fijo favorecía los textos cortos'],
  ['Relectura', '1,5/min en N0–N1; 1/min en N2–N4', 'Revisión de Fable'],
  ['Relectura con mejora', '+2 si releyendo entero tropieza menos que en su mejor lectura completa (1 por cuento y día)', 'Preferencia del usuario: premiar el progreso; contra la mejor marca para que no se pueda provocar'],
  ['Dificultad real', 'en textos que no son de la biblioteca, lo esperado usa el nivel más exigente entre el sugerido y el asignado', 'Revisión de Fable; abuso del texto difícil marcado en N0'],
], 'texto')}
<p>Resultado simulado (15 min, cuentos nuevos): ${P.map((p) => `${p.id} ${num(M.E2.celdas[p.id][15].monedas.p50)}`).join(' · ')}. Brecha ${num(M.E2.equidad.maxMin, 2)}×; Gini sobre 2 000 niños ${num(M.E2.equidad.giniNinos, 2)} (E: ${num(M.E.equidad.giniNinos, 2)}; actual: ${num(M.M0.equidad.giniNinos, 2)}). Caso «20 min por cuento»: ${num(M.E2.casoUsuario.monedas.p50)} (E: ${num(M.E.casoUsuario.monedas.p50)}; actual: ${num(M.M0.casoUsuario.monedas.p50)}).</p>
</div>

<h2 id="campana">7. A lo largo de muchas sesiones</h2>
<p>Sesiones seguidas de 15 min, una por día. Cuando se acaban los 8 cuentos de su nivel, el niño los relee. En el anexo de tablas está también el escenario en que un adulto sube textos nuevos.</p>
<figure class="figura">${leyenda([{ nombre: 'P0 · sílabas', color: 1 }, { nombre: 'P4 · fluido', color: 2 }])}${leyenda([{ nombre: 'actual (punteada)' }, { nombre: 'modelo E (continua)' }], ['punteada', 'linea'])}${g3}<figcaption>Monedas acumuladas (mediana) en 40 sesiones de 15 min. Pasa el cursor para ver cada sesión.</figcaption></figure>
<p>Hoy, P4 tiene ${num(m0.campanas.P4.relee.curvaMediana[2])} monedas en la sesión 3, y P0 se queda en ~${num(acum('M0', 'P0'))} para siempre. Con E, ambos avanzan a un ritmo parecido: unas 25–30 monedas por sesión mientras hay cuentos nuevos y 10–13 al releer. En 144 sesiones, P4 junta ${num(acum('E', 'P4'))} con E frente a ${num(acum('M0', 'P4'))} hoy: a largo plazo no sale perdiendo, solo recibe lo suyo repartido en vez de todo al principio. P0 pasa de ${num(acum('M0', 'P0'))} a ${num(acum('E', 'P0'))}.</p>

<h2 id="precios">8. Esfuerzo por artículo (sesiones de 15 min) y precios</h2>
<p>Sesiones de 15 min necesarias para juntar el precio desde cero, sin gastar en otra cosa. Mediana (p10–p90). «No alcanza» significa que no llega en ${160} sesiones.</p>
<h3>Modelo actual · releyendo cuando se acaban los cuentos</h3>
${tabla(cabSesiones, filasSesiones('M0', 'relee'))}
<h3>Modelo actual · un adulto sube textos nuevos</h3>
${tabla(cabSesiones, filasSesiones('M0', 'subidos'))}
<h3>Modelo E · releyendo</h3>
${tabla(cabSesiones, filasSesiones('E', 'relee'))}
<h3>Modelo E · un adulto sube textos nuevos</h3>
${tabla(cabSesiones, filasSesiones('E', 'subidos'))}
<h3>Escenarios de precio (propuesta v3, no aplicada) · modelo E2, un adulto sube textos nuevos</h3>
<p>Escalones propuestos para piezas nuevas: básico ${R.preciosV3.basico}, común ${R.preciosV3.comun}, especial ${R.preciosV3.especial}, obra ${R.preciosV3.obra}; Dragón ${R.preciosV3.dragon}. Ola 1 = 16 piezas universales o adaptables de Fantasía, Naturaleza y Espacio; ola 2 = 4 exclusivos de especie + 3 mochilas (condicionadas a su rediseño) + el Dragón.</p>
${tabla(cabSesiones, filasPrecios('E2', 'subidos'))}
<h3>Escenarios de precio · modelo E2, releyendo</h3>
${tabla(cabSesiones, filasPrecios('E2', 'relee'))}
<h3>Escenarios de precio · modelo actual, un adulto sube textos nuevos (contraste)</h3>
${tabla(cabSesiones, filasPrecios('M0', 'subidos'))}
<h3>Propuesta de precios (no aplicada)</h3>
${tabla(
  ['Qué', 'Rango', 'Recomendado', 'Esfuerzo con E2 (P0–P4, mediana)', 'Por qué'],
  [
    ['Dragón (transformación comprable)', '60–100', `<b>${R.preciosV3.dragon}</b>`, `${P.map((p) => M.E2.campanas[p.id].subidos.sesionesParaPrecio.dragon80.p50).join(' / ')} sesiones`, 'P0: 4 sesiones (p90 5); P0 muy lento: 5 (p90 6). Una semana de uso. 120 (borrador anterior) pedía 6 a P0 y 8 al muy lento'],
    ['Cuncuna', 'gratis', '6 cuentos de Ciempi terminados (de N0, o de cualquier nivel para quien parte en N1+), o 60 min activos en N0 + 30 frases distintas de N0', `${P.map((p) => cun(p)[6].p50).join(' / ')} sesiones (cuentos)`, 'P0: 6 sesiones (p90 10). El muy lento con sesiones de 15 min no termina cuentos: llega por la vía progreso + tiempo en 11 sesiones'],
    ['Piezas nuevas', 'escalones actuales', `${R.preciosV3.basico} / ${R.preciosV3.comun} / ${R.preciosV3.especial} / ${R.preciosV3.obra}`, 'P0: 1 / 1 / 2 / 2 sesiones', 'El precio sigue al trabajo de construcción, no a la rareza. Ninguna pieza nueva por encima de 32'],
    ['Conjunto de colección', '−20 % sobre lo que falta (regla actual)', '55–85', '2–4 sesiones', 'Igual que los 10 conjuntos actuales'],
    ['Colección v3', `ola 1 = ${R.escenariosPrecio.find((e) => e.id === 'ola1').precio}; ola 2 + Dragón = ${R.escenariosPrecio.find((e) => e.id === 'ola2').precio}`, 'dos olas', `${P.map((p) => M.E2.campanas[p.id].subidos.sesionesParaPrecio.ola1.p50).join(' / ')} sesiones (ola 1)`, 'Ola 1 con las piezas universales; ola 2 con las especies. Las mochilas solo tras su rediseño'],
  ],
  'texto',
)}

<h3>Cuncuna: sesiones de 15 min hasta el umbral (mediana, p10–p90)</h3>
<p>Cuentos distintos de su nivel terminados por primera vez, releyendo cuando se acaban. No depende del modelo de monedas.</p>
${tabla(cabCuncuna, filasCuncuna())}
<h3>El lector muy lento («20 min por cuento») a lo largo del tiempo</h3>
<p>P0 con factor ${0.42} (≈ 2 palabras por minuto). Como el cuento se empieza siempre desde el principio, con sesiones de 15 min <b>nunca termina un cuento</b>: no recibiría la Cuncuna por cuentos ni el premio de libro terminado. Con E sigue ganando monedas porque la relectura del comienzo paga la mitad.</p>
${tabla(cabLento, filasLento())}

<h3>Esfuerzo de un niño de nivel 0 (P0) por precio · modelo E2</h3>
<p>Sesiones de 15 min para juntar cada precio desde cero. «Muy lento» = el caso de ~20 min por cuento (factor 0,42), con sesiones de 15 min.</p>
${tabla(['Precio', 'P0 mediana, releyendo', 'P0 p90, releyendo', 'P0 mediana, textos nuevos', 'P0 p90, textos nuevos', 'Muy lento mediana', 'Muy lento p90'], filasGrilla('E2'))}
<h3>Lo mismo con el modelo actual (contraste)</h3>
${tabla(['Precio', 'P0 mediana, releyendo', 'P0 p90, releyendo', 'P0 mediana, textos nuevos', 'P0 p90, textos nuevos', 'Muy lento mediana', 'Muy lento p90'], filasGrilla('M0'))}

<h2 id="abuso">9. Abuso y topes: ¿hace falta un tope diario?</h2>
<p>«Peor abuso» es la acción repetitiva que más monedas da sin aprender a leer, con los tiempos mínimos que permite el motor. Las cifras de los textos de abuso salen del código real (<code>verificar-abusos.mts</code>).</p>
${tabla(['Modelo', 'Acción', 'Monedas', 'Minutos', 'Monedas/min'], filasAbuso, 'texto')}
<p><b>Recomendación (decisión del usuario): ningún tope diario silencioso y ninguna «media tasa» después de X minutos.</b> Con E2, el ingreso máximo ya está atado al reloj real: ~2 monedas por minuto, lo mismo que leer. En su lugar, controles que no castigan al que necesita más tiempo:</p>
<ol>
<li><b>Reloj del servidor con los segundos pagados</b> (extensión de <code>revisarRitmo</code> de la rama de seguridad). La app no puede cobrar más rápido que el tiempo real; la ráfaga máxima es de 1 h acumulada (~120 monedas).</li>
<li><b>Dificultad real</b>: en textos que no son de la biblioteca, lo esperado usa el nivel más exigente entre el sugerido y el asignado.</li>
<li><b>Huella y duplicados</b>: un texto ya pagado no vuelve a pagar (ya implementado en la rama de seguridad).</li>
<li><b>Premio de terminar proporcional</b> (min(3, minutos esperados), mínimo 1 min): muchos textos cortos no rinden.</li>
<li><b>Avisos visibles al adulto y revisión de textos propios</b> (PIN del adulto opcional). Nada se apaga para el niño.</li>
</ol>
<p>Nada de esto toca al lector muy lento que lee de verdad: en la simulación, lo pagado nunca supera el 75 % del tiempo real de su sesión, así que el reloj no lo frena nunca.</p>

<h3>Abusos ampliados (revisión independiente)</h3>
<p>El que abusa no tropieza y no gasta en otra cosa; subir un texto toma ~40 s. «Falsificado»: la app declara el tope de cada frase como tiempo activo (por ejemplo, desde la cola sin conexión). Con el reloj actual de la rama de seguridad (0,1 s por palabra) eso no se frena; con un reloj que se adelanta con los segundos <b>pagados</b>, nunca rinde más que leer.</p>
${tabla(['Modelo', 'Acción', 'Monedas', 'Minutos', 'Monedas/min'], filasAbusoAmpliado(), 'texto')}
<h3>E2: de dónde salen las monedas</h3>
${tabla(['Perfil', ...FUENTES.map((f) => f[1])], filasFuentes('E2', 'sesion'))}
<p class="tenue">Primera sesión de 15 min con cuentos nuevos (monedas promedio por fuente). Abajo, la campaña completa (${160} sesiones) releyendo, en %.</p>
${tabla(['Perfil', ...FUENTES.map((f) => f[1])], filasFuentes('E2', 'relee'))}
${tabla(['Perfil', ...FUENTES.map((f) => f[1])], filasFuentes('E2', 'subidos'))}

<h2 id="riesgos">10. Riesgos y qué medir después</h2>
<h3>Riesgos</h3>
<ul>
<li><b>Los supuestos de velocidad de P0 son lo más incierto.</b> No hay una norma para «recién empieza sílabas», y la voz de Ciempi en «Leer conmigo» puede acelerar o frenar al niño.</li>
<li><b>Bajan las monedas por sesión de P3 y P4</b> mientras haya cuentos nuevos: de ~${num(m0.celdas.P3[15].monedas.p50)}–${num(m0.celdas.P4[15].monedas.p50)} a ~${num(e0.celdas.P3[15].monedas.p50)}–${num(e0.celdas.P4[15].monedas.p50)}. Un niño que ya conocía la versión actual lo notará. Conviene anunciarlo con el cambio («ahora todo leer suma, también releer») y no quitar nada de lo comprado.</li>
<li><b>Monedas con fracción.</b> El niño verá a veces +1 y a veces +2. La moneda al final de la pista debe mostrar lo que va a ganar esa frase.</li>
<li><b>Sílabas y palabras nuevas</b> dependen de la normalización del texto. Hay que contarlas en el servidor y solo en textos que no subió el propio niño.</li>
<li><b>La Cuncuna ligada a cuentos terminados</b> deja fuera al lector muy lento con sesiones cortas: por eso se propone la vía de 60 min activos.</li>
<li><b>Los cuentos 21–40 usan marcas registradas.</b> Si se retiran, cada nivel queda con 4 cuentos y los niños pasan antes a releer.</li>
</ul>
<h3>Telemetría mínima y respetuosa</h3>
<p>Ya existe en <code>sesiones_lectura</code>: duración activa, frases completadas, frases «muy rápido», sílabas leídas, monedas ganadas y nivel. Bastaría agregar contadores agregados, sin audio, sin texto y sin identificar al niño fuera de su cuenta:</p>
<ul>
<li>Segundos activos por unidad (p50/p90 por nivel) → calibrar <code>SILABAS_POR_MINUTO_REFERENCIA</code>.</li>
<li>Tropiezos por frase y cuentos que no se terminaron en la sesión → validar el costo de reiniciar.</li>
<li>Minutos por sesión dentro y fuera de la lectura (biblioteca, tienda).</li>
<li>Saldo, monedas ganadas y gastadas por semana → inflación real frente al catálogo.</li>
<li>Sesiones hasta la primera compra y hasta cada compra por tipo de artículo → contrastar con la tabla de esfuerzo.</li>
<li>Distribución de la duración de las sesiones → decidir si hace falta el «Ciempi ya comió mucho».</li>
</ul>
<p>Revisar 4–6 semanas de datos agregados con el adulto responsable y ajustar solo las constantes, sin cambiar las reglas.</p>

<h2 id="supuestos">11. Supuestos y fuentes</h2>
${tabla(['Supuesto', 'Valor', 'Fuente o nota'], filasSupuestos, 'texto')}
<ul class="tenue">
<li>Hasbrouck, J. y Tindal, G. (2017). <i>An update to compiled ORF norms</i> (Technical Report 1702). University of Oregon, Behavioral Research and Teaching. Tabla resumida por Read Naturally: <a href="https://www.readnaturally.com/research/5-components-of-reading/fluency">readnaturally.com</a>; ERIC ED594994. Son normas de inglés: sirven solo como orden de magnitud.</li>
<li>Tabla chilena de velocidad lectora (muy lenta … muy rápida, 1.º a 4.º básico), reproducida en el «Plan Dominio Lector» del Colegio La Providencia de Concepción (providencia.cmiescolar.cl). No se verificó su origen oficial.</li>
<li>Diseño sin rachas ni bucles de recompensa: ICO, Age Appropriate Design Code, estándar 13; Google Play Families. Recompensas cercanas a la lectura: Marinak y Gambrell (2008). Efecto de las recompensas esperadas sobre la motivación intrínseca: Deci, Koestner y Ryan (1999).</li>
</ul>

<h2 id="detalle">Anexo: los 7 modelos × 5 perfiles × 4 duraciones</h2>
<p>Monedas en la primera sesión con cuentos nuevos: mediana (p10–p90).</p>
${orden.map((id) => `<h3>${esc(M[id].nombre)}</h3>${tabla(cabSesion, filasSesion(id))}`).join('')}
</main>
<div id="tip" role="tooltip"></div>
<script>
(() => {
  const tip = document.getElementById('tip')
  const mostrar = (e, t) => { tip.textContent = t; tip.style.opacity = 1; const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8); tip.style.left = x + 'px'; tip.style.top = (e.clientY + 14) + 'px' }
  document.querySelectorAll('[data-tip]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      mostrar(e, el.dataset.tip)
      const svg = el.closest('svg'); const cruz = svg && svg.querySelector('.cruz')
      if (cruz && el.dataset.x) { cruz.setAttribute('x1', el.dataset.x); cruz.setAttribute('x2', el.dataset.x) }
    })
    el.addEventListener('mouseleave', () => { tip.style.opacity = 0 })
  })
})()
</script>
</body></html>
`
writeFileSync(new URL('../index.html', import.meta.url), html)

// Tablas en Markdown para ECONOMIA-V3.md
const tablasMd = [
  '## Niveles\n',
  md(cabNiveles, filasNiveles),
  '\n## Sesión actual (M0)\n',
  md(cabSesion, filasSesionMd('M0')),
  '\n## Modelos\n',
  md(cabModelos.slice(0, -1), filasModelos.map((f) => f.slice(0, -1).map((c) => c.replace(/<[^>]+>/g, '')))),
  '\n## E por duración\n',
  md(cabSesion, filasSesionMd('E')),
  '\n## Sesiones M0 relee\n',
  md(cabSesiones, filasSesionesMd('M0', 'relee')),
  '\n## Sesiones M0 subidos\n',
  md(cabSesiones, filasSesionesMd('M0', 'subidos')),
  '\n## Sesiones E relee\n',
  md(cabSesiones, filasSesionesMd('E', 'relee')),
  '\n## Sesiones E subidos\n',
  md(cabSesiones, filasSesionesMd('E', 'subidos')),
  '\n## Precios v3 · E subidos\n',
  md(cabSesiones, filasPrecios('E', 'subidos', false)),
  '\n## Precios v3 · E relee\n',
  md(cabSesiones, filasPrecios('E', 'relee', false)),
  '\n## Precios v3 · M0 subidos\n',
  md(cabSesiones, filasPrecios('M0', 'subidos', false)),
  '\n## Precios v3 · PREV subidos\n',
  md(cabSesiones, filasPrecios('PREV', 'subidos', false)),
  '\n## Cuncuna (sesiones de 15 min)\n',
  md(cabCuncuna, filasCuncuna(false)),
  '\n## P0 muy lento (factor 0,42)\n',
  md(cabLento, filasLento(false)),
  '\n## Precios v3 · E2 subidos\n',
  md(cabSesiones, filasPrecios('E2', 'subidos', false)),
  '\n## Precios v3 · E2 relee\n',
  md(cabSesiones, filasPrecios('E2', 'relee', false)),
  '\n## Esfuerzo de P0 por precio · E2\n',
  md(['Precio', 'P0 p50 relee', 'P0 p90 relee', 'P0 p50 nuevos', 'P0 p90 nuevos', 'Muy lento p50', 'Muy lento p90'], filasGrilla('E2')),
  '\n## Esfuerzo de P0 por precio · M0\n',
  md(['Precio', 'P0 p50 relee', 'P0 p90 relee', 'P0 p50 nuevos', 'P0 p90 nuevos', 'Muy lento p50', 'Muy lento p90'], filasGrilla('M0')),
  '\n## E2 por duración\n',
  md(cabSesion, filasSesionMd('E2')),
  '\n## Fuentes E2 (15 min, monedas) y campañas (%)\n',
  md(['Perfil', ...FUENTES.map((f) => f[1])], [...filasFuentes('E2', 'sesion'), ...filasFuentes('E2', 'relee'), ...filasFuentes('E2', 'subidos')]),
  '\n## Abusos ampliados\n',
  md(['Modelo', 'Acción', 'Monedas', 'Min', 'Por min'], filasAbusoAmpliado(false)),
  '\n## Equidad (Gini sobre 2 000 niños)\n',
  md(['Modelo', 'Gini 5 medianas', 'Gini niños', 'Máx/mín por minuto'], orden.map((id) => [M[id].nombre, num(M[id].equidad.gini, 2), num(M[id].equidad.giniNinos, 2), num(M[id].equidad.maxMin, 2)])),
  '\n## Abuso\n',
  md(['Modelo', 'Acción', 'Monedas', 'Min', 'Por min'], filasAbuso.map((f) => f.map((c) => String(c).replace(/<[^>]+>/g, '')))),
].join('\n')
writeFileSync(new URL('./datos/tablas.md', import.meta.url), tablasMd)
console.log('index.html y datos/tablas.md escritos')
