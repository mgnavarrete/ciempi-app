/**
 * Simulador de la economía de monedas de CIEMPI (economía v3).
 *
 * Reproducible: Node 22+, sin dependencias, semilla fija. Lee los cuentos ya
 * troceados con el código REAL del juego (datos/cuentos.json, generado por
 * extraer-cuentos.mts) y el catálogo real (datos/catalogo.json).
 *
 *   node docs/expansion-ciempi/economia/simulador/simular.mjs
 *
 * Escribe datos/resultados.json. Todo número de este archivo que no venga del
 * código del juego es un SUPUESTO: está marcado como tal en SUPUESTOS y en el
 * informe. No son datos de niños reales.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const leer = (f) => JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'))
export const { cuentos: CUENTOS, reglas: REGLAS } = leer('./datos/cuentos.json')
const CATALOGO = leer('./datos/catalogo.json')
const ABUSOS_REALES = leer('./datos/abusos.json')

export const SEMILLA = 20261103
const N_NINOS = 400 // niños simulados por celda (Monte Carlo)
const DURACIONES = [10, 15, 20, 30]
const SESIONES_CAMPANA = 160

// ─── Azar reproducible ─────────────────────────────────────────────────────
export function mulberry32(a) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function normal(rng) {
  const u = Math.max(rng(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
}
const lognormal = (rng, sigma) => Math.exp(sigma * normal(rng))
function poisson(rng, media) {
  const L = Math.exp(-media)
  let k = 0
  let p = 1
  do {
    k++
    p *= rng()
  } while (p > L)
  return k - 1
}
export const cuantil = (xs, q) => {
  const o = [...xs].sort((a, b) => a - b)
  if (!o.length) return NaN
  const i = (o.length - 1) * q
  const a = Math.floor(i)
  return o[a] + (o[Math.min(a + 1, o.length - 1)] - o[a]) * (i - a)
}
const r1 = (x) => Math.round(x * 10) / 10
const r2 = (x) => Math.round(x * 100) / 100

// ─── Supuestos (todos editables; ver ECONOMIA-V3.md §3) ────────────────────
/**
 * Perfiles. `ppm`: palabras correctas por minuto de la mediana del perfil
 * leyendo SIN ayuda. Anclas públicas:
 *  - Hasbrouck & Tindal (2017), ORF norms (inglés): 1.º básico invierno p10 9,
 *    p25 16, p50 29; primavera p50 60; 2.º invierno p50 84; 3.º primavera p50 112.
 *  - Tabla chilena de velocidad lectora usada en colegios (p. ej. Colegio La
 *    Providencia, Plan Dominio Lector): 1.º básico muy lenta ≤21, lenta 22–28,
 *    media alta 38–46; 2.º media alta 64–73; 3.º rápida 100–111. Origen
 *    oficial no verificado.
 * P0 no tiene norma: «recién empieza sílabas» está por debajo del p10 de
 * 1.º básico. Su valor (5 ppm) es un SUPUESTO.
 */
export const PERFILES = [
  { id: 'P0', nombre: 'Recién empieza sílabas', nivel: 0, ppm: 5, ancla: 'Supuesto: bajo el p10 de 1.º básico (9 ppm, H&T 2017) y bajo «muy lenta» chilena (≤21)', tropiezo: 0.1, pausasPorMin: 0.3, pausaSeg: 20, repetir: 0.1, fuera: 0.22 },
  { id: 'P1', nombre: 'Palabras, lento', nivel: 1, ppm: 15, ancla: 'H&T 2017 1.º básico invierno p25 = 16; chilena 1.º «muy lenta/lenta» (≤28)', tropiezo: 0.06, pausasPorMin: 0.25, pausaSeg: 15, repetir: 0.06, fuera: 0.2 },
  { id: 'P2', nombre: 'Empieza oraciones', nivel: 2, ppm: 40, ancla: 'H&T 2017 1.º primavera p25–p50 = 34–60; chilena 1.º «media alta» 38–46', tropiezo: 0.03, pausasPorMin: 0.2, pausaSeg: 15, repetir: 0.04, fuera: 0.17 },
  { id: 'P3', nombre: 'Párrafos', nivel: 3, ppm: 70, ancla: 'H&T 2017 2.º invierno p25–p50 = 59–84; chilena 2.º «media alta» 64–73', tropiezo: 0.02, pausasPorMin: 0.15, pausaSeg: 15, repetir: 0.03, fuera: 0.15 },
  { id: 'P4', nombre: 'Lector fluido', nivel: 4, ppm: 110, ancla: 'H&T 2017 3.º primavera p50 = 112; chilena 3.º «rápida» 100–111', tropiezo: 0.02, pausasPorMin: 0.12, pausaSeg: 15, repetir: 0.02, fuera: 0.13 },
]

export const SUPUESTOS = {
  silabasPorPalabra: { valor: 1.9, nota: 'Para pasar ppm (medidas en textos de curso) a sílabas/min. Los cuentos N2–N4 miden 1,8–2,0 sílabas por palabra (dificultad.ts).' },
  sigmaNino: { valor: 0.35, nota: 'Dispersión entre niños del mismo perfil (lognormal): p10 ≈ 0,64× y p90 ≈ 1,57× la mediana.' },
  sigmaUnidad: { valor: 0.25, nota: 'Variación de una frase a otra en el mismo niño.' },
  segundosEntreUnidades: { valor: { 0: 3, 1: 3, 2: 3.5, 3: 4, 4: 5 }, nota: 'Poner el dedo, MS_PASO_FRASE (0,45 s, código), esperar a que la voz termine y la celebración A03.' },
  vozMinSegPorSilaba: { valor: 0.4, nota: 'Nivel 0: la voz dice cada sílaba; el dedo no puede ir más rápido de lo que se escucha.' },
  vozPalabrasPorMinuto: { valor: 160, nota: 'Nivel 3: Ciempi lee cada fragmento entero; la unidad no termina antes que la voz.' },
  costoTropiezoSeg: { valor: 3.5, nota: 'MS_TROPIEZO = 1,5 s (código) + volver a poner el dedo; además se repite ~30 % de la frase.' },
  segundosPorLibro: { valor: { P0: 40, P1: 35, P2: 30, P3: 30, P4: 30 }, nota: 'Abrir el libro, pantalla final A10 y volver a la biblioteca.' },
  pausaActivaMaxSeg: { valor: 10, nota: 'MAX_PAUSA_ACTIVA_MS = 10 s (código): una pausa más larga no cuenta como tiempo activo.' },
  sesionesPorDia: { valor: 1, nota: 'Una sesión por día (para relecturas y bloques diarios).' },
  textoSubido: { valor: { 0: 10, 1: 12, 2: 15, 3: 6, 4: 4 }, nota: 'Unidades de un texto subido por un adulto cuando se acaban los cuentos (se arma con frases de los cuentos del nivel).' },
}

// ─── Textos ────────────────────────────────────────────────────────────────
export const cuentosDeNivel = (n) => CUENTOS.filter((c) => c.nivel === n)

/** Texto que sube un adulto: unidades tomadas al azar de los cuentos del nivel. */
function textoSubido(nivel, rng, i) {
  const fuente = cuentosDeNivel(nivel).flatMap((c) => c.unidades.map((u, k) => ({ ...u, sil: c.silabasDistintas, pal: c.palabrasDistintas })))
  const n = SUPUESTOS.textoSubido.valor[nivel]
  const unidades = Array.from({ length: n }, () => fuente[Math.floor(rng() * fuente.length)])
  return {
    id: `subido-${nivel}-${i}`,
    nivel,
    titulo: `Texto subido ${i + 1}`,
    subido: true,
    unidades: unidades.map(({ palabras, silabas, manzanas }) => ({ palabras, silabas, manzanas })),
    totalUnidades: n,
    silabasDistintas: [],
    palabrasDistintas: [],
  }
}

// ─── Modelos de recompensa ─────────────────────────────────────────────────
const MON_UNIDAD = { 0: 1, 1: 1, 2: 1, 3: 4, 4: 0 }
const TOPE_LIBRO = { 0: 10, 1: 10, 2: Infinity, 3: 15, 4: 0 }
const HITOS = REGLAS.HITOS
const RELECTURA_ACTUAL = { 0: 1, 1: 1, 2: 1, 3: 2, 4: 3 }

/** monedasDeUnidad del juego, con unidad y tope parametrizables. */
const monedasDeUnidad = (porUnidad, tope) => (nivel, k, total) => {
  if (total <= 0 || k < 1 || k > total) return 0
  const delLibro = Math.min(tope[nivel], total * porUnidad[nivel])
  return Math.floor((delLibro * k) / total) - Math.floor((delLibro * (k - 1)) / total)
}

/**
 * Modelo A: multiplicadores por nivel, calibrados para que la mediana de cada
 * perfil gane ~25–35 monedas en una sesión de 15 min con cuentos nuevos.
 */
export const A_UNIDAD = { 0: 3, 1: 1, 2: 1, 3: 2, 4: 0 }
export const A_TOPE = { 0: 30, 1: 10, 2: 9, 3: 6, 4: 0 }
export const A_HITOS = { 0: [], 1: [], 2: [{ porcentaje: 100, monedas: 2 }], 3: [], 4: [{ porcentaje: 50, monedas: 4 }, { porcentaje: 100, monedas: 6 }] }
export const A_RELECTURA = { 0: 3, 1: 1, 2: 1, 3: 1, 4: 2 }

/** Sílabas por minuto «de referencia» de cada nivel (modelos D y E). */
export const REF_SPM = { 0: 7, 1: 22, 2: 60, 3: 105, 4: 165 }
export const esperadoMin = (u, nivel, ref = REF_SPM) => u.silabas / ref[nivel] + 3 / 60
/** E2: ritmo de referencia con N0 = 5 síl/min (revisión de Fable). */
export const REF_SPM_E2 = { 0: 5, 1: 22, 2: 60, 3: 105, 4: 165 }

/**
 * Cada modelo dice cuánto paga cada cosa. `reglaRitmo`: si aplica la regla
 * actual (tropiezo = la frase no paga; 80 % del tramo a buen ritmo).
 */
const base = {
  reglaRitmo: true,
  unidad: (ctx) => monedasDeUnidad(MON_UNIDAD, TOPE_LIBRO)(ctx.nivel, ctx.k, ctx.total),
  hitos: HITOS,
  relectura: (ctx) => (ctx.yaPremiadoEntero && !ctx.relecturaHoy ? RELECTURA_ACTUAL[ctx.nivel] : 0),
  libroTerminado: () => 0,
  silabasNuevas: null,
  bloque: null,
  nivelCompleto: 0,
  sinTropiezo: 0,
}

export const MODELOS = [
  {
    id: 'M0',
    nombre: 'Actual (2.4.1)',
    resumen: 'Código real: 1 por frase (N0–N2), 4 por párrafo (N3), hitos en N4; topes 10/10/∞/15; relectura con bug (N0, N1, N3 nunca pagan).',
    ...base,
    // Bug real: en N0, N1 y N3 premioHasta nunca llega a 100 ⇒ la relectura nunca paga.
    relectura: (ctx) => ([0, 1, 3].includes(ctx.nivel) ? 0 : base.relectura(ctx)),
  },
  {
    id: 'PREV',
    nombre: 'Propuesta previa: N0 = 2 por frase, tope 10',
    resumen: 'Igual que el actual (con la relectura corregida), pero el nivel 0 paga 2 por frase con tope 10 por cuento.',
    ...base,
    unidad: (ctx) => monedasDeUnidad({ ...MON_UNIDAD, 0: 2 }, { ...TOPE_LIBRO, 2: 14 })(ctx.nivel, ctx.k, ctx.total),
  },
  {
    id: 'A',
    nombre: 'A · Multiplicadores por nivel',
    resumen: 'Mismas reglas, con monedas y topes multiplicados por nivel para acercar las monedas por minuto.',
    ...base,
    // Calibrado para ~2 monedas por minuto de lectura en la mediana de cada perfil.
    unidad: (ctx) =>
      monedasDeUnidad(A_UNIDAD, A_TOPE)(ctx.nivel, ctx.k, ctx.total),
    hitos: A_HITOS,
    relectura: (ctx) => (ctx.yaPremiadoEntero && !ctx.relecturaHoy ? A_RELECTURA[ctx.nivel] : 0),
  },
  {
    id: 'B',
    nombre: 'B · Hitos pedagógicos',
    resumen: 'Actual (relectura corregida, tope N2 = 14) + logros: terminar un cuento, sílabas/palabras nuevas, primer cuento sin tropiezos, nivel completo.',
    ...base,
    unidad: (ctx) => monedasDeUnidad(MON_UNIDAD, { ...TOPE_LIBRO, 2: 14 })(ctx.nivel, ctx.k, ctx.total),
    libroTerminado: () => 3,
    silabasNuevas: { 0: { cada: 15, monedas: 2, que: 'silabas' }, 1: { cada: 25, monedas: 2, que: 'palabras' } },
    sinTropiezo: 5,
    nivelCompleto: 15,
  },
  {
    id: 'C',
    nombre: 'C · Rato de lectura',
    resumen: 'Actual (relectura corregida, tope N2 = 14) + 3 monedas por cada 5 min de lectura activa, hasta 6 ratos al día (visible).',
    ...base,
    unidad: (ctx) => monedasDeUnidad(MON_UNIDAD, { ...TOPE_LIBRO, 2: 14 })(ctx.nivel, ctx.k, ctx.total),
    bloque: { minutos: 5, monedas: 3, maxPorDia: 6 },
  },
  {
    id: 'D',
    nombre: 'D · Esfuerzo esperado',
    resumen: 'Cada unidad paga 2 monedas por minuto que a un lector de ese nivel le toma leerla (sílabas ÷ ritmo de referencia del nivel). No mira el tiempo real.',
    reglaRitmo: false,
    tasa: 2,
    usaTiempoReal: false,
    unidad: null,
    hitos: { 0: [], 1: [], 2: [], 3: [], 4: [] },
    relecturaTasa: 1,
    libroTerminado: () => 0,
    silabasNuevas: null,
    bloque: null,
    nivelCompleto: 0,
    sinTropiezo: 0,
  },
  {
    id: 'E',
    nombre: 'E · Híbrido (versión del checkpoint)',
    resumen: 'D con «lo que sea menor» entre tiempo esperado y tiempo activo real + terminar cuento + sílabas/palabras nuevas (N0–N1) + nivel completo + rato de lectura; relectura a mitad de tasa.',
    reglaRitmo: false,
    tasa: 2,
    usaTiempoReal: true,
    unidad: null,
    hitos: { 0: [], 1: [], 2: [], 3: [], 4: [] },
    relecturaTasa: 1,
    // Terminar un libro por primera vez: +3, solo si el libro tiene al menos 1 min de
    // lectura esperada y el tiempo activo fue al menos la mitad de lo esperado
    // (un texto de una frase, o arrastrado sin leer, no da el premio).
    libroTerminado: ({ esperadoLibro, activoLibro }) => (esperadoLibro >= 1 && activoLibro >= 0.5 * esperadoLibro ? 3 : 0),
    silabasNuevas: { 0: { cada: 15, monedas: 2, que: 'silabas' }, 1: { cada: 25, monedas: 2, que: 'palabras' } },
    bloque: { minutos: 5, monedas: 2, maxPorDia: 6 },
    nivelCompleto: 15,
    sinTropiezo: 0,
  },
  {
    id: 'E2',
    nombre: 'E2 · Híbrido ajustado (recomendado v3)',
    resumen: 'E ajustado a las preferencias del usuario y a la revisión de Fable: sin rato de lectura pagado; la frase completada paga 2 por minuto activo hasta 2× lo esperado (el lento no pierde); N0 con referencia 5 síl/min; terminar paga min(3, minutos esperados); relectura 1,5 (N0–N1) o 1 (N2–N4) por minuto; +2 por relectura con mejora (menos tropiezos); sílabas/palabras nuevas y nivel completo.',
    reglaRitmo: false,
    tasa: 2,
    usaTiempoReal: true,
    ref: REF_SPM_E2,
    // Tope por unidad: 2 × lo esperado. Quien lee hasta 2 veces más lento que la referencia cobra todo su tiempo activo.
    capFactor: 2,
    unidad: null,
    hitos: { 0: [], 1: [], 2: [], 3: [], 4: [] },
    relecturaTasa: { 0: 1.5, 1: 1.5, 2: 1, 3: 1, 4: 1 },
    libroTerminado: ({ esperadoLibro, activoLibro }) => (esperadoLibro >= 1 && activoLibro >= 0.5 * esperadoLibro ? Math.min(3, Math.floor(esperadoLibro)) : 0),
    silabasNuevas: { 0: { cada: 15, monedas: 2, que: 'silabas' }, 1: { cada: 25, monedas: 2, que: 'palabras' } },
    bloque: null,
    nivelCompleto: 15,
    sinTropiezo: 0,
    // Relectura completa de un cuento con menos tropiezos que su mejor lectura completa anterior: +2 (una por cuento y día).
    mejora: 2,
    // Textos que no son de la biblioteca: lo esperado se calcula con el nivel más exigente entre el sugerido y el asignado.
    dificultadReal: true,
    // Textos propios: el premio de terminar se da (una vez por huella), con la misma condición de ≥ 1 min esperado.
    libroPropio: true,
  },
]

// ─── Un niño leyendo ───────────────────────────────────────────────────────
export function nuevoNino(perfil, rng, modo) {
  return {
    perfil,
    rng,
    modo, // 'relee' | 'subidos': qué hace cuando se acaban los cuentos de su nivel
    factor: lognormal(rng, SUPUESTOS.sigmaNino.valor),
    libros: new Map(), // id → { leidoHasta, terminado, relecturaDia, acarreo }
    cola: cuentosDeNivel(perfil.nivel).map((c) => c),
    subidos: 0,
    actual: null,
    silabasVistas: new Set(),
    palabrasVistas: new Set(),
    contadorNuevas: 0,
    sinTropiezoPagado: false,
    nivelCompletoPagado: false,
    dia: 0,
    monedas: 0,
    bloque: { activoMin: 0, dados: 0 },
    // Totales
    unidades: 0,
    silabasLeidas: 0,
    librosTerminados: 0,
    cuentosNuevosTerminados: 0,
    cuentosResueltos: 0, // terminados o dejados tras 2 intentos
  }
}

function siguienteLibro(n) {
  if (n.actual) return n.actual
  // Un libro que no alcanzó a terminar en 2 sesiones se deja (el niño o el adulto eligen otro).
  const sinTerminar = n.cola.find((c) => !n.libros.get(c.id)?.terminado && (n.libros.get(c.id)?.intentos ?? 0) < 2)
  if (sinTerminar) return (n.actual = sinTerminar)
  if (n.modo === 'subidos') {
    const t = textoSubido(n.perfil.nivel, n.rng, n.subidos++)
    n.cola.push(t)
    return (n.actual = t)
  }
  // Relee: el que hace más tiempo que no relee.
  const orden = [...n.cola].sort((a, b) => (n.libros.get(a.id)?.ultimaVez ?? 0) - (n.libros.get(b.id)?.ultimaVez ?? 0))
  return (n.actual = orden[0])
}

/** Tiempo (min) para leer una unidad y cuánto de eso es «activo». */
function tiempoUnidad(n, u, nivel) {
  const { rng, perfil } = n
  const spm = perfil.ppm * SUPUESTOS.silabasPorPalabra.valor * n.factor * lognormal(rng, SUPUESTOS.sigmaUnidad.valor)
  let lectura = u.silabas / spm
  if (nivel === 0) lectura = Math.max(lectura, (u.silabas * SUPUESTOS.vozMinSegPorSilaba.valor) / 60)
  if (nivel === 3) lectura = Math.max(lectura, u.palabras / SUPUESTOS.vozPalabrasPorMinuto.valor)
  const entre = SUPUESTOS.segundosEntreUnidades.valor[nivel] / 60
  const pausas = poisson(rng, perfil.pausasPorMin * lectura)
  let pausa = 0
  let pausaActiva = 0
  for (let i = 0; i < pausas; i++) {
    const s = -Math.log(Math.max(rng(), 1e-9)) * perfil.pausaSeg
    pausa += s / 60
    pausaActiva += Math.min(s, SUPUESTOS.pausaActivaMaxSeg.valor) / 60
  }
  const tropieza = rng() < perfil.tropiezo
  const extraTropiezo = tropieza ? SUPUESTOS.costoTropiezoSeg.valor / 60 + 0.3 * lectura : 0
  return { total: lectura + entre + pausa + extraTropiezo, activo: lectura + entre + pausaActiva + extraTropiezo, tropieza, lectura }
}

/** Una sesión de `minutos`. Devuelve lo ganado y lo hecho. */
export function sesion(n, modelo, minutos) {
  n.dia++
  n.bloque = { activoMin: 0, dados: 0 }
  const res = { monedas: 0, unidades: 0, silabas: 0, libros: 0, activoMin: 0, porFuente: { unidad: 0, hitos: 0, libro: 0, nuevas: 0, bloque: 0, nivel: 0, relectura: 0, sinTropiezo: 0, mejora: 0 }, pagadoMin: 0, total: 0, sobreTopeMin: 0, repeticionMin: 0 }
  const ganar = (m, fuente) => {
    if (!m) return
    res.monedas += m
    res.porFuente[fuente] += m
    n.monedas += m
  }
  const presupuesto = minutos * (1 - n.perfil.fuera)
  let t = 0
  const nivel = n.perfil.nivel
  let guardia = 0
  while (t < presupuesto && guardia++ < 500) {
    const libro = siguienteLibro(n)
    const est = n.libros.get(libro.id) ?? { leidoHasta: 0, terminado: false, relecturaDia: -1, acarreo: 0, ultimaVez: 0, premioHasta: 0 }
    n.libros.set(libro.id, est)
    const yaPremiadoEntero = est.terminado
    t += SUPUESTOS.segundosPorLibro.valor[n.perfil.id] / 60
    // Un cuento siempre empieza desde el comienzo (fraseDeInicio): lo ya leído se relee sin pagar.
    const tramo = { desde: 0, palabras: 0, buen: 0 }
    let tropezoEnLibro = false
    let tropiezosLibro = 0
    let completo = true
    let activoLibro = 0
    // Marcapáginas (variante estudiada solo para el lector muy lento): retoma donde iba si no terminó.
    const inicio = n.marcapaginas && !est.terminado ? Math.min(est.leidoHasta, libro.totalUnidades - 1) : 0
    for (let k = inicio; k < libro.totalUnidades; k++) {
      const u = libro.unidades[k]
      const tu = tiempoUnidad(n, u, nivel)
      if (t + tu.total > presupuesto) {
        completo = false
        t = presupuesto
        break
      }
      t += tu.total
      activoLibro += tu.activo
      res.activoMin += tu.activo
      res.unidades++
      res.silabas += u.silabas
      // Rato de lectura (C, E): bloques de tiempo activo.
      if (modelo.bloque) {
        n.bloque.activoMin += tu.activo
        while (n.bloque.activoMin >= modelo.bloque.minutos && n.bloque.dados < modelo.bloque.maxPorDia) {
          n.bloque.activoMin -= modelo.bloque.minutos
          n.bloque.dados++
          ganar(modelo.bloque.monedas, 'bloque')
        }
      }
      if (tu.tropieza) {
        tropezoEnLibro = true
        tropiezosLibro++
      }
      const fin = k + 1
      const nuevaUnidad = fin > est.leidoHasta
      if (modelo.reglaRitmo) {
        const aBuenRitmo = !tu.tropieza
        tramo.palabras += u.palabras
        if (aBuenRitmo) tramo.buen += u.palabras
        const ritmoBien = tramo.buen >= REGLAS.MINIMO_A_BUEN_RITMO * tramo.palabras
        if (ritmoBien && tramo.desde <= est.leidoHasta && nuevaUnidad) {
          est.leidoHasta = fin
          if (aBuenRitmo) ganar(modelo.unidad({ nivel, k: fin, total: libro.totalUnidades }), 'unidad')
          const pct = Math.floor((fin / libro.totalUnidades) * 100)
          const nuevos = (modelo.hitos[nivel] ?? []).filter((h) => h.porcentaje > est.premioHasta && h.porcentaje <= pct)
          if (nuevos.length) {
            ganar(nuevos.reduce((s, h) => s + h.monedas, 0), 'hitos')
            est.premioHasta = nuevos.at(-1).porcentaje
          }
        }
      } else {
        // D y E: cada unidad paga por esfuerzo esperado; E toma el menor entre esperado y activo real.
        const esperado = esperadoMin(u, nivel, modelo.ref)
        const base = modelo.usaTiempoReal ? Math.min((modelo.capFactor ?? 1) * esperado, tu.activo) : esperado
        // Verificación (no consume azar): tiempo activo que el tope por unidad deja sin pagar.
        if (modelo.usaTiempoReal) res.sobreTopeMin += Math.max(0, tu.activo - base)
        const tasa = nuevaUnidad ? modelo.tasa : typeof modelo.relecturaTasa === 'object' ? modelo.relecturaTasa[nivel] : modelo.relecturaTasa
        if (nuevaUnidad) est.leidoHasta = fin
        est.acarreo += tasa * base
        res.pagadoMin += base
        const m = Math.floor(est.acarreo + 1e-9)
        est.acarreo -= m
        ganar(m, nuevaUnidad ? 'unidad' : 'relectura')
      }
      // Hitos de sílabas / palabras nuevas (B, E).
      if (modelo.silabasNuevas?.[nivel] && !libro.subido) {
        const regla = modelo.silabasNuevas[nivel]
        const lista = regla.que === 'silabas' ? libro.silabasDistintas : libro.palabrasDistintas
        const vistas = regla.que === 'silabas' ? n.silabasVistas : n.palabrasVistas
        // Aproximación: las distintas del libro se reparten parejo entre sus unidades.
        const desde = Math.floor((lista.length * k) / libro.totalUnidades)
        const hasta = Math.floor((lista.length * (k + 1)) / libro.totalUnidades)
        for (const s of lista.slice(desde, hasta)) {
          if (!vistas.has(s)) {
            vistas.add(s)
            n.contadorNuevas++
            if (n.contadorNuevas % regla.cada === 0) ganar(regla.monedas, 'nuevas')
          }
        }
      }
      // Repetir la frase (volver atrás): más tiempo, sin monedas, empieza un tramo nuevo.
      if (n.rng() < n.perfil.repetir) {
        const otra = tiempoUnidad(n, u, nivel)
        if (t + otra.total <= presupuesto) {
          t += otra.total
          res.activoMin += otra.activo
          // Verificación: el simulador no paga esta repetición (E2 la pagaría como «releída»; ver ECONOMIA-V3 §18).
          res.repeticionMin += otra.activo
          tramo.desde = k
          tramo.palabras = u.palabras
          tramo.buen = u.palabras
        }
      }
    }
    if (!completo) {
      // Se acabó la sesión a mitad del libro; la próxima vez lo empieza de nuevo.
      // Tras 2 intentos sin terminarlo, lo deja y pasa al siguiente.
      est.ultimaVez = n.dia
      if (!est.terminado) {
        est.intentos = (est.intentos ?? 0) + 1
        if (est.intentos >= 2) {
          n.actual = null
          if (!libro.subido) n.cuentosResueltos++
        }
      } else n.actual = null
      break
    }
    // Libro terminado.
    n.actual = null
    est.ultimaVez = n.dia
    res.libros++
    if (!yaPremiadoEntero) {
      const esperadoLibro = libro.unidades.reduce((s, u) => s + esperadoMin(u, nivel, modelo.ref), 0)
      est.tropiezosUltima = tropiezosLibro
      ganar(modelo.libroTerminado({ esperadoLibro, activoLibro }), 'libro')
      if (!libro.subido && (est.intentos ?? 0) < 2) n.cuentosResueltos++
      if (modelo.sinTropiezo && !tropezoEnLibro && !n.sinTropiezoPagado) {
        n.sinTropiezoPagado = true
        ganar(modelo.sinTropiezo, 'sinTropiezo')
      }
      est.terminado = true
      if (!libro.subido) n.cuentosNuevosTerminados++
      if (modelo.nivelCompleto && !n.nivelCompletoPagado && n.cuentosNuevosTerminados === cuentosDeNivel(nivel).length) {
        n.nivelCompletoPagado = true
        ganar(modelo.nivelCompleto, 'nivel')
      }
    } else if (modelo.mejora) {
      // Contra su MEJOR lectura completa (no la última): tropezar a propósito no permite volver a cobrarla.
      if (inicio === 0 && est.tropiezosUltima !== undefined && tropiezosLibro < est.tropiezosUltima && est.mejoraDia !== n.dia) {
        est.mejoraDia = n.dia
        ganar(modelo.mejora, 'mejora')
      }
      if (inicio === 0) est.tropiezosUltima = Math.min(est.tropiezosUltima ?? Infinity, tropiezosLibro)
    } else if (modelo.relectura) {
      // Modelos con premio fijo por relectura (una vez al día por libro, a buen ritmo).
      const ritmoBien = !modelo.reglaRitmo || tramo.buen >= REGLAS.MINIMO_A_BUEN_RITMO * tramo.palabras
      if (ritmoBien && tramo.desde === 0) {
        const m = modelo.relectura({ nivel, yaPremiadoEntero, relecturaHoy: est.relecturaDia === n.dia })
        if (m) est.relecturaDia = n.dia
        ganar(m, 'relectura')
      }
    }
  }
  n.unidades += res.unidades
  res.total = minutos
  return res
}

// ─── Experimentos ──────────────────────────────────────────────────────────
export function resumen(xs) {
  return { p10: r1(cuantil(xs, 0.1)), p50: r1(cuantil(xs, 0.5)), p90: r1(cuantil(xs, 0.9)), media: r1(xs.reduce((s, x) => s + x, 0) / xs.length) }
}

/** Primera sesión (contenido nuevo) de cada perfil × duración × modelo. */
export function primeraSesion(modelo, perfil, minutos) {
  const rng = mulberry32(SEMILLA + perfil.nivel * 1000 + minutos)
  const m = []
  const l = []
  const u = []
  const s = []
  const a = []
  const fuentes = {}
  for (let i = 0; i < N_NINOS; i++) {
    const n = nuevoNino(perfil, rng, 'relee')
    const r = sesion(n, modelo, minutos)
    m.push(r.monedas)
    l.push(r.libros)
    u.push(r.unidades)
    s.push(r.silabas)
    a.push(r.activoMin)
    for (const [k, v] of Object.entries(r.porFuente)) fuentes[k] = (fuentes[k] ?? 0) + v / N_NINOS
  }
  return {
    monedas: resumen(m),
    porMinuto: r2(cuantil(m, 0.5) / minutos),
    libros: resumen(l),
    unidades: resumen(u),
    silabas: resumen(s),
    activoMin: resumen(a),
    fuentes: Object.fromEntries(Object.entries(fuentes).map(([k, v]) => [k, r1(v)])),
    _muestra: m.map((x) => x / minutos),
  }
}

/** Muchas sesiones seguidas de 15 min: acumulado y cuándo alcanza cada precio. */
export function campana(modelo, perfil, modo, minutos = 15) {
  const rng = mulberry32(SEMILLA + 77 + perfil.nivel * 1000 + (modo === 'subidos' ? 500 : 0))
  const curvas = []
  const fuentes = {}
  for (let i = 0; i < N_NINOS; i++) {
    const n = nuevoNino(perfil, rng, modo)
    const acum = []
    let agotado = null
    // Sesión en que termina su 4.º, 6.º y 8.º cuento distinto de la biblioteca (umbral de la Cuncuna).
    // Solo mira el contador: no consume azar, así que no cambia las demás cifras.
    const cuentos = { 4: null, 6: null, 8: null }
    let activo = 0
    let activoCuncuna = null
    let progresoCuncuna = null
    for (let k = 0; k < SESIONES_CAMPANA; k++) {
      const r = sesion(n, modelo, minutos)
      activo += r.activoMin
      for (const [f, v] of Object.entries(r.porFuente)) fuentes[f] = (fuentes[f] ?? 0) + v
      if (activoCuncuna === null && activo >= MINUTOS_ACTIVOS_CUNCUNA) activoCuncuna = k + 1
      if (progresoCuncuna === null && activo >= MINUTOS_ACTIVOS_CUNCUNA && frasesDistintas(n) >= FRASES_CUNCUNA) progresoCuncuna = k + 1
      acum.push(n.monedas)
      if (agotado === null && n.cuentosResueltos >= cuentosDeNivel(perfil.nivel).length) agotado = k + 1
      for (const u of [4, 6, 8]) if (cuentos[u] === null && n.cuentosNuevosTerminados >= u) cuentos[u] = k + 1
    }
    curvas.push({ acum, agotado, cuentos, activoCuncuna, progresoCuncuna })
  }
  const curvaMediana = Array.from({ length: SESIONES_CAMPANA }, (_, k) => Math.round(cuantil(curvas.map((c) => c.acum[k]), 0.5)))
  const sesionesPara = (precio) => {
    const xs = curvas.map((c) => {
      const i = c.acum.findIndex((v) => v >= precio)
      return i < 0 ? Infinity : i + 1
    })
    const f = (q) => {
      const v = cuantil(xs.filter(Number.isFinite).length === xs.length ? xs : xs.map((x) => (Number.isFinite(x) ? x : 1e9)), q)
      return v >= 1e8 ? null : Math.ceil(v)
    }
    return { p10: f(0.1), p50: f(0.5), p90: f(0.9) }
  }
  const sesionesHastaCuentos = Object.fromEntries(
    [4, 6, 8].map((u) => {
      const xs = curvas.map((c) => c.cuentos[u] ?? 1e9)
      const f = (q) => {
        const v = cuantil(xs, q)
        return v >= 1e8 ? null : Math.ceil(v)
      }
      return [u, { p10: f(0.1), p50: f(0.5), p90: f(0.9), nunca: curvas.filter((c) => c.cuentos[u] === null).length / curvas.length }]
    }),
  )
  const aCun = curvas.map((c) => c.activoCuncuna ?? 1e9)
  sesionesHastaCuentos.activoCuncuna = { p10: Math.ceil(cuantil(aCun, 0.1)), p50: Math.ceil(cuantil(aCun, 0.5)), p90: Math.ceil(cuantil(aCun, 0.9)) }
  const pCun = curvas.map((c) => c.progresoCuncuna ?? 1e9)
  const fq = (xs, q) => {
    const v = cuantil(xs, q)
    return v >= 1e8 ? null : Math.ceil(v)
  }
  sesionesHastaCuentos.progresoCuncuna = { p10: fq(pCun, 0.1), p50: fq(pCun, 0.5), p90: fq(pCun, 0.9) }
  return {
    curvaMediana,
    agotaCuentos: resumen(curvas.map((c) => c.agotado ?? SESIONES_CAMPANA + 1)),
    sesionesPara,
    sesionesHastaCuentos,
    // Monedas por fuente, promedio por niño en todas las sesiones de la campaña.
    fuentes: Object.fromEntries(Object.entries(fuentes).map(([k, v]) => [k, r1(v / N_NINOS)])),
  }
}

/** Frases (unidades) distintas de cuentos de la biblioteca leídas al menos una vez. */
const frasesDistintas = (n) => [...n.libros.entries()].reduce((s, [id, e]) => s + (id.startsWith('subido-') ? 0 : e.leidoHasta), 0)
/** Vía «progreso + tiempo» para la Cuncuna: 60 min activos Y 30 frases distintas de la biblioteca. */
export const FRASES_CUNCUNA = 30

const f2 = (xs, q) => {
  const v = cuantil(xs, q)
  return v >= 1e8 ? null : Math.ceil(v)
}
/** Precios para la tabla de esfuerzo de P0 (ECONOMIA-V3.md §9). */
export const GRILLA_PRECIOS = [6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 30, 32, 36, 40, 50, 60, 70, 80, 90, 100, 120, 150, 180, 200, 250, 300, 360, 400, 500]

/** Vía alternativa propuesta para la Cuncuna: minutos de lectura activa acumulados (ECONOMIA-V3.md §10). */
export const MINUTOS_ACTIVOS_CUNCUNA = 60

/**
 * Caso «20 min por cuento» a lo largo del tiempo: P0 muy lento (factor 0,42)
 * con sesiones de `minutos`. Azar propio (no altera las demás celdas).
 */
export function campanaLento(modelo, minutos, marcapaginas = false) {
  const perfil = PERFILES[0]
  const rng = mulberry32(SEMILLA + 4242 + minutos + (marcapaginas ? 7 : 0))
  const progresos = []
  let maxPagadoSobreReloj = 0
  const finales = []
  const cuentos6 = []
  const activosCuncuna = []
  const curvas = []
  for (let i = 0; i < N_NINOS; i++) {
    const n = nuevoNino(perfil, rng, 'relee')
    n.factor = CASO_USUARIO.factor
    n.marcapaginas = marcapaginas
    let prog = null
    let c6 = null
    let activo = 0
    let aCun = null
    const acum = []
    for (let k = 0; k < 60; k++) {
      const r = sesion(n, modelo, minutos)
      activo += r.activoMin
      maxPagadoSobreReloj = Math.max(maxPagadoSobreReloj, r.pagadoMin / r.total)
      if (aCun === null && activo >= MINUTOS_ACTIVOS_CUNCUNA) aCun = k + 1
      if (prog === null && activo >= MINUTOS_ACTIVOS_CUNCUNA && frasesDistintas(n) >= FRASES_CUNCUNA) prog = k + 1
      acum.push(n.monedas)
      if (c6 === null && n.cuentosNuevosTerminados >= 6) c6 = k + 1
    }
    curvas.push(acum)
    finales.push(n.monedas)
    cuentos6.push(c6 ?? 1e9)
    activosCuncuna.push(aCun ?? 1e9)
    progresos.push(prog ?? 1e9)
  }
  const sesPrecio = (precio) => {
    const xs = curvas.map((a) => {
      const i = a.findIndex((v) => v >= precio)
      return i < 0 ? 1e9 : i + 1
    })
    return { p50: f2(xs, 0.5), p90: f2(xs, 0.9) }
  }
  const f = (q) => {
    const v = cuantil(cuentos6, q)
    return v >= 1e8 ? null : Math.ceil(v)
  }
  return {
    minutos,
    marcapaginas,
    sesionesProgresoCuncuna: { p10: f2(progresos, 0.1), p50: f2(progresos, 0.5), p90: f2(progresos, 0.9) },
    maxPagadoSobreReloj: r2(maxPagadoSobreReloj),
    sesionesParaGrilla: Object.fromEntries(GRILLA_PRECIOS.map((p) => [p, sesPrecio(p)])),
    monedasEn20: resumen(curvas.map((a) => a[19])),
    monedasEn60: resumen(finales),
    sesionesHasta6Cuentos: { p10: f(0.1), p50: f(0.5), p90: f(0.9), nunca: r2(cuentos6.filter((x) => x >= 1e8).length / cuentos6.length) },
    sesionesHastaMinActivos: { p10: Math.ceil(cuantil(activosCuncuna, 0.1)), p50: Math.ceil(cuantil(activosCuncuna, 0.5)), p90: Math.ceil(cuantil(activosCuncuna, 0.9)) },
  }
}

// Precios de referencia (reales, del catálogo) y transformaciones (hipotéticas).
const precio = (id) => CATALOGO.items.find((i) => i.id === id)?.precio
export const ARTICULOS = [
  { id: 'gorro', nombre: 'Gorro común (Pirata)', precio: precio('cabeza:b06-ia-pirata'), real: true },
  { id: 'mascara', nombre: 'Máscara (Búho)', precio: precio('cabeza:b07-ia-buho'), real: true },
  { id: 'especial', nombre: 'Accesorio especial (Bufanda)', precio: precio('cuello:bufanda-calco32'), real: true },
  { id: 'conjunto', nombre: 'Conjunto completo (Mago)', precio: precio('conjunto:b12-set-luna'), real: true },
  { id: 'personaje50', nombre: 'Personaje nuevo (hipotético 50)', precio: 50, real: false },
  { id: 'personaje100', nombre: 'Personaje nuevo (hipotético 100)', precio: 100, real: false },
  { id: 'personaje150', nombre: 'Personaje nuevo (hipotético 150)', precio: 150, real: false },
]
/**
 * Escenarios de precio (propuesta de ECONOMIA-V3.md §9, NO aplicada): escalones
 * de la tienda, conjuntos reales, Dragón y la colección v3 en dos olas.
 * Ola 1 = 16 piezas universales/adaptables de Fantasía, Naturaleza y Espacio;
 * ola 2 = 4 exclusivos de especie + 3 mochilas (condicionadas a su rediseño).
 */
export const PRECIOS_V3 = { basico: 10, comun: 16, especial: 24, obra: 30, dragon: 80 }
export const COLECCION_V3 = {
  ola1: [
    ['F1 Casco suave', 'especial'], ['F2 Acolchado', 'obra'], ['F3 Capa de páginas', 'obra'], ['F4 Botas caballero', 'comun'], ['F5 Antifaz grifo', 'especial'],
    ['N1 Gorro pétalo', 'comun'], ['N2 Jardín', 'obra'], ['N4 Zuecos hongo', 'comun'], ['N5 Bufanda musgo', 'especial'], ['N6 Antifaz zorro', 'especial'],
    ['E1 Casco burbuja', 'especial'], ['E2 Traje astral', 'obra'], ['E4 Botas lunares', 'comun'], ['E5 Capa cometa', 'obra'], ['E6 Antenas luz', 'basico'], ['E7 Lentes planeta', 'comun'],
  ],
  ola2: [
    ['F7 Alas de cuento (Dragón)', 'obra'], ['F8 Cresta gema (Dragón)', 'comun'], ['E8 Cola cometa (Dragón)', 'basico'], ['N7 Mechones rocío (Cuncuna)', 'comun'],
    ['F6 Mochila cofre', 'especial'], ['N3 Mochila hoja', 'especial'], ['E3 Mochila cohete', 'especial'],
  ],
}
const sumaOla = (ola) => ola.reduce((s, [, e]) => s + PRECIOS_V3[e], 0)
export const ESCENARIOS_PRECIO = [
  { id: 'basico', nombre: 'Escalón básico', precio: PRECIOS_V3.basico },
  { id: 'comun', nombre: 'Escalón común', precio: PRECIOS_V3.comun },
  { id: 'especial', nombre: 'Escalón especial', precio: PRECIOS_V3.especial },
  { id: 'obra', nombre: 'Escalón obra (traje, capa)', precio: PRECIOS_V3.obra },
  { id: 'conjMin', nombre: 'Conjunto real más barato (Draco, Ratón)', precio: 53 },
  { id: 'conjMax', nombre: 'Conjunto real más caro (Espíritu, AraLuz)', precio: 84 },
  { id: 'dragon60', nombre: 'Dragón a 60', precio: 60 },
  { id: 'dragon80', nombre: 'Dragón a 80 (recomendado)', precio: 80 },
  { id: 'dragon100', nombre: 'Dragón a 100', precio: 100 },
  { id: 'dragon120', nombre: 'Dragón a 120 (borrador anterior)', precio: 120 },
  { id: 'ola1', nombre: 'Colección v3, ola 1 (16 piezas)', precio: sumaOla(COLECCION_V3.ola1) },
  { id: 'ola2', nombre: 'Colección v3, ola 2 (7 piezas) + Dragón', precio: sumaOla(COLECCION_V3.ola2) + PRECIOS_V3.dragon },
]

// Catálogo completo comprable: piezas de pago, descontando las familias de colores (se compran una vez).
const familiasExtra = 36 // paleta:harry + paleta:hermione (familia gryffindor) y paleta:minnie (familia rosa): 3 × 12
export const CATALOGO_COMPLETO = CATALOGO.resumen.totalTodoSuelto - familiasExtra
ESCENARIOS_PRECIO.push(
  { id: 'catalogoOla1', nombre: 'Catálogo actual + ola 1', precio: CATALOGO_COMPLETO + sumaOla(COLECCION_V3.ola1) },
  { id: 'catalogoV3', nombre: 'Catálogo actual + colección v3 completa + Dragón', precio: CATALOGO_COMPLETO + sumaOla(COLECCION_V3.ola1) + sumaOla(COLECCION_V3.ola2) + PRECIOS_V3.dragon },
)

// ─── El caso que describe el usuario: ~20 min por cuento en nivel 0 ─────────
/**
 * Un niño P0 mucho más lento que la mediana (factor 0,42 ≈ 2 ppm efectivas):
 * con estos supuestos tarda unos 20 min de sesión en un cuento de nivel 0.
 * Sesión de 25 min para que alcance a terminarlo.
 */
export const CASO_USUARIO = { factor: 0.42, minutos: 25 }
export function casoUsuario(modelo) {
  const perfil = PERFILES[0]
  const rng = mulberry32(SEMILLA + 999)
  const monedas = []
  const libros = []
  const minPorCuento = []
  for (let i = 0; i < N_NINOS; i++) {
    const n = nuevoNino(perfil, rng, 'relee')
    n.factor = CASO_USUARIO.factor
    const r = sesion(n, modelo, CASO_USUARIO.minutos)
    monedas.push(r.monedas)
    libros.push(r.libros)
    if (r.libros > 0) minPorCuento.push(CASO_USUARIO.minutos / r.libros)
  }
  return { monedas: resumen(monedas), libros: resumen(libros), porMinuto: r2(cuantil(monedas, 0.5) / CASO_USUARIO.minutos) }
}

// ─── Abuso: la acción repetitiva que más paga sin aprender ─────────────────
export function abuso(modelo) {
  // Arrastre lo más rápido que permite el motor sin tropezar (4 manzanas/s, LIMITE_MAXIMO_RITMO)
  // sobre un texto subido por el propio niño. Tiempos mínimos (s) por unidad: arrastre + 0,45 s
  // (MS_PASO_FRASE) + ~0,6 s de voz final. Subir un texto nuevo: ~40 s (pegar y guardar).
  const casos = []
  const subir = 40
  if (modelo.reglaRitmo) {
    // Texto real verificado: «Mariposa amarilla.» × 300 → nivel 2 sugerido, sin tope (datos/abusos.json).
    const n2 = ABUSOS_REALES.find((a) => a.id === 'n2-sin-tope')
    // Corregido tras la revisión de Fable: A usa A_TOPE[2] = 9 (antes se usaba 14 por error).
    const tope2 = modelo.id === 'M0' ? Infinity : modelo.id === 'A' ? A_TOPE[2] : 14
    const porUnidad2 = modelo.id === 'A' ? 1 : 1
    const pagoN2 = Math.min(tope2, n2.unidades * porUnidad2) + (modelo.hitos[2]?.reduce((s, h) => s + h.monedas, 0) ?? 0)
    const segN2 = n2.unidades * (0.5 + 0.45 + 0.6) + subir
    casos.push({ accion: 'Subir un texto de 300 oraciones «Mariposa amarilla.» (nivel 2 sugerido) y arrastrar', monedas: pagoN2, minutos: r1(segN2 / 60), porMinuto: r1(pagoN2 / (segN2 / 60)) })
    // N0: 10 frases «Sol.» → tope del libro; borrar y volver a subir.
    const topeN0 = modelo.id === 'A' ? 30 : 10
    const porFraseN0 = modelo.id === 'A' ? 3 : modelo.id === 'PREV' ? 2 : 1
    const pagoN0 = Math.min(topeN0, 10 * porFraseN0) + (modelo.libroTerminado?.({ esperadoLibro: 0, activoLibro: 0 }) ?? 0)
    const segN0 = 10 * (0.4 + 0.45 + 0.6) + subir
    // Rato de lectura (C): se suma mientras dure (máx. 6 ratos al día).
    const bloque = modelo.bloque ? (modelo.bloque.monedas * segN0) / 60 / modelo.bloque.minutos : 0
    casos.push({ accion: 'Subir 10 frases «Sol.» (nivel 0), leerlas, borrar y volver a subir', monedas: r1(pagoN0 + bloque), minutos: r1(segN0 / 60), porMinuto: r1((pagoN0 + bloque) / (segN0 / 60)) })
  } else {
    // D: paga lo esperado aunque se arrastre rápido. Texto N0 de 300 frases de 8 sílabas.
    const silabas = 8
    // Corregido tras la verificación: usa la referencia y el tope del modelo (antes, REF_SPM y tope 1× para E2).
    // Sin efecto numérico: el arrastre (3,05 s) queda bajo lo esperado con cualquiera de las dos referencias.
    const esperado = silabas / (modelo.ref ?? REF_SPM)[0] + 3 / 60
    const segUnidad = silabas / 4 + 0.45 + 0.6
    const activo = segUnidad / 60
    const porUnidad = modelo.tasa * (modelo.usaTiempoReal ? Math.min((modelo.capFactor ?? 1) * esperado, activo) : esperado)
    const unidades = 300
    const bloque = modelo.bloque ? (modelo.bloque.monedas / modelo.bloque.minutos) : 0
    const min = (unidades * segUnidad + subir) / 60
    const pago = unidades * porUnidad + Math.min(bloque * min, modelo.bloque ? modelo.bloque.monedas * modelo.bloque.maxPorDia : 0) + (modelo.libroTerminado?.({ esperadoLibro: 0, activoLibro: 0 }) ?? 0)
    casos.push({ accion: 'Subir un texto de 300 frases de 8 sílabas (nivel 0) y arrastrar a 4 sílabas/s', monedas: Math.round(pago), minutos: r1(min), porMinuto: r1(pago / min) })
  }
  return casos
}

// ─── Abusos ampliados (revisión de Fable y preferencias del usuario) ───────
/**
 * Pago determinista de un texto completo, leído de corrido y «a buen ritmo»
 * (el que abusa no tropieza). `segActivo`: segundos activos por unidad;
 * `falsificado`: la app declara el tope por unidad en vez del tiempo real.
 */
function pagoTexto(modelo, { nivel, sugerido, unidades, segActivo, propio, falsificado = false }) {
  const total = unidades.length
  let m = 0
  let actMin = 0
  let pagadoMin = 0
  if (modelo.reglaRitmo) {
    for (let k = 1; k <= total; k++) m += modelo.unidad({ nivel, k, total })
    m += (modelo.hitos[nivel] ?? []).reduce((s, h) => s + h.monedas, 0)
    actMin = (total * segActivo) / 60
    m += modelo.libroTerminado({ esperadoLibro: unidades.reduce((s, u) => s + esperadoMin(u, nivel), 0), activoLibro: actMin })
  } else {
    const ref = modelo.ref ?? REF_SPM
    const nivRef = modelo.dificultadReal ? Math.max(nivel, sugerido) : nivel
    let acc = 0
    let esp = 0
    for (const u of unidades) {
      const e = esperadoMin(u, nivRef, ref)
      const tope = (modelo.capFactor ?? 1) * e
      const a = falsificado ? tope : segActivo / 60
      esp += e
      actMin += a
      const base = modelo.usaTiempoReal ? Math.min(tope, a) : e
      pagadoMin += base
      acc += modelo.tasa * base
    }
    m += Math.floor(acc + 1e-9)
    if (!propio || modelo.libroPropio) m += modelo.libroTerminado({ esperadoLibro: esp, activoLibro: actMin })
  }
  if (modelo.bloque) m += Math.min(modelo.bloque.monedas * Math.floor(actMin / modelo.bloque.minutos), modelo.bloque.monedas * modelo.bloque.maxPorDia)
  return { monedas: m, actMin, pagadoMin }
}

const SUBIR_SEG = 40 // pegar y guardar un texto
const rep_ = (n, u) => Array.from({ length: n }, () => ({ ...u }))
export function abusoAmpliado(modelo) {
  const filas = []
  const fila = (id, accion, r, minutos, extra = {}) => filas.push({ id, accion, monedas: r1(r.monedas), minutos: r1(minutos), porMinuto: r1(r.monedas / minutos), ...extra })
  // 1. 300 × «Mariposa amarilla.» (N2 sugerido), arrastrar (1,55 s por oración).
  {
    const r = pagoTexto(modelo, { nivel: 2, sugerido: 2, unidades: rep_(300, { silabas: 7, palabras: 2 }), segActivo: 1.55, propio: true })
    fila('n2-largo', 'Texto propio de 300 «Mariposa amarilla.» (N2), arrastrado', r, (SUBIR_SEG + 300 * 1.55) / 60)
  }
  // 2. Muchos textos propios distintos de UNA oración difícil (N2 sugerido): subir, leer, repetir con otro texto.
  {
    const r = pagoTexto(modelo, { nivel: 2, sugerido: 2, unidades: [{ silabas: 10, palabras: 3 }], segActivo: 2, propio: true })
    fila('cortos', 'Muchos textos propios distintos de 1 oración (N2): subir y leer cada uno', r, (SUBIR_SEG + 2) / 60, { porTexto: r.monedas })
  }
  // 3. Textos propios de ~1 min esperado (6 oraciones) leídos a la mitad del tiempo esperado (justo para cobrar el premio de E).
  {
    const u = { silabas: 10, palabras: 4 }
    const seg = 0.5 * esperadoMin(u, 2) * 60
    const r = pagoTexto(modelo, { nivel: 2, sugerido: 2, unidades: rep_(6, u), segActivo: seg, propio: true })
    fila('un-minuto', 'Textos propios distintos de 6 oraciones (~1 min esperado), leídos a medio ritmo', r, (SUBIR_SEG + 6 * seg) / 60, { porTexto: r.monedas })
  }
  // 4. Texto difícil (sugerido N2) asignado en N0: 300 frases de 8 sílabas, arrastradas a 4 síl/s.
  const dificil = { nivel: 0, sugerido: 2, unidades: rep_(300, { silabas: 8, palabras: 3 }), propio: false }
  {
    const seg = 8 / 4 + 0.45 + 0.6
    const r = pagoTexto(modelo, { ...dificil, segActivo: seg })
    fila('dificil-n0', 'Texto difícil (sugerido N2) asignado en N0, 300 frases arrastradas', r, (SUBIR_SEG + 300 * seg) / 60)
  }
  // 5. Lo mismo, con tiempo activo FALSIFICADO desde la cola offline (la app declara el tope de cada frase).
  if (!modelo.reglaRitmo && modelo.usaTiempoReal) {
    const r = pagoTexto(modelo, { ...dificil, segActivo: 0, falsificado: true })
    // (a) Reloj actual de la rama de seguridad: solo exige 0,1 s/palabra y 0,5 s/unidad.
    const minA = (SUBIR_SEG + 300 * Math.max(0.5, 3 * 0.1)) / 60
    fila('falso-reloj-actual', 'Ídem con tiempo activo falsificado; reloj actual (0,1 s/palabra)', r, minA)
    // (b) Reloj que se adelanta con los segundos PAGADOS: no puede cobrar más rápido que el tiempo real.
    const minB = Math.max(minA, r.pagadoMin)
    fila('falso-reloj-pagado', 'Ídem; reloj que se adelanta con los segundos pagados', r, minB, { rafagaMaxHora: r1(modelo.tasa * 60) })
  }
  // 6. Rondar (añadido tras la verificación): tocar cada < 10 s sin leer y completar cada frase de un cuento
  //    de N0 de la biblioteca solo al llegar al tiempo máximo pagable (tope × lo esperado). Es la cota superior
  //    de «tiempo con la app abierta» en los modelos que pagan tiempo real: nunca rinde más que leer.
  {
    const u = { silabas: 10, palabras: 4 }
    const seg = (modelo.capFactor ?? 1) * esperadoMin(u, 0, modelo.ref ?? REF_SPM) * 60
    const r = pagoTexto(modelo, { nivel: 0, sugerido: 0, unidades: rep_(8, u), segActivo: seg, propio: false })
    fila('rondar', 'Rondar: tocar cada < 10 s y completar cada frase de N0 solo al llegar al máximo pagable', r, (8 * seg) / 60)
  }
  // 7. App abierta sin completar frases (toques cada < 10 s), 60 min.
  {
    const m = modelo.bloque ? Math.min(modelo.bloque.monedas * Math.floor(60 / modelo.bloque.minutos), modelo.bloque.monedas * modelo.bloque.maxPorDia) : 0
    filas.push({ id: 'abierta', accion: 'App abierta 60 min tocando la pantalla sin completar frases', monedas: m, minutos: 60, porMinuto: r1(m / 60) })
  }
  return filas
}

// ─── Equidad ───────────────────────────────────────────────────────────────
export function gini(xs) {
  const n = xs.length
  const media = xs.reduce((s, x) => s + x, 0) / n
  let suma = 0
  for (const a of xs) for (const b of xs) suma += Math.abs(a - b)
  return suma / (2 * n * n * media)
}

// ─── Ejecutar ──────────────────────────────────────────────────────────────
// Solo al ejecutarlo directamente; sensibilidad.mjs importa las funciones sin escribir resultados.json.
const esPrincipal = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (esPrincipal) {
const salida = {
  semilla: SEMILLA,
  nNinos: N_NINOS,
  duraciones: DURACIONES,
  perfiles: PERFILES,
  supuestos: SUPUESTOS,
  refSpm: REF_SPM,
  articulos: ARTICULOS,
  escenariosPrecio: ESCENARIOS_PRECIO,
  preciosV3: PRECIOS_V3,
  coleccionV3: COLECCION_V3,
  catalogoCompleto: CATALOGO_COMPLETO,
  catalogoResumen: CATALOGO.resumen,
  conjuntos: CATALOGO.conjuntos,
  abusosReales: ABUSOS_REALES,
  niveles: [0, 1, 2, 3, 4].map((n) => {
    const cs = cuentosDeNivel(n)
    const sil = new Set(cs.flatMap((c) => c.silabasDistintas))
    const pal = new Set(cs.flatMap((c) => c.palabrasDistintas))
    return {
      nivel: n,
      cuentos: cs.length,
      unidades: cs.map((c) => c.totalUnidades),
      palabras: cs.map((c) => c.palabras),
      silabas: cs.map((c) => c.silabas),
      monedas: cs.map((c) => c.monedasPrimeraLectura),
      totalMonedas: cs.reduce((s, c) => s + c.monedasPrimeraLectura, 0),
      silabasDistintas: sil.size,
      palabrasDistintas: pal.size,
      esperadoMinPorCuento: cs.map((c) => r1(c.unidades.reduce((s, u) => s + esperadoMin(u, n), 0))),
      monedasE: cs.map((c) => Math.floor(c.unidades.reduce((s, u) => s + 2 * esperadoMin(u, n), 0))),
    }
  }),
  modelos: [],
}

for (const modelo of MODELOS) {
  const celdas = {}
  for (const perfil of PERFILES) {
    celdas[perfil.id] = {}
    for (const min of DURACIONES) celdas[perfil.id][min] = primeraSesion(modelo, perfil, min)
  }
  const porMin15 = PERFILES.map((p) => celdas[p.id][15].porMinuto)
  const campanas = {}
  for (const perfil of PERFILES) {
    campanas[perfil.id] = {}
    for (const modo of ['relee', 'subidos']) {
      const c = campana(modelo, perfil, modo)
      campanas[perfil.id][modo] = {
        curvaMediana: c.curvaMediana,
        agotaCuentos: c.agotaCuentos,
        sesionesPara: Object.fromEntries([...ARTICULOS, { id: 'catalogo', precio: CATALOGO_COMPLETO }].map((a) => [a.id, c.sesionesPara(a.precio)])),
        sesionesParaPrecio: Object.fromEntries(ESCENARIOS_PRECIO.map((a) => [a.id, c.sesionesPara(a.precio)])),
        sesionesHastaCuentos: c.sesionesHastaCuentos,
        fuentes: c.fuentes,
        sesionesParaGrilla: perfil.id === 'P0' ? Object.fromEntries(GRILLA_PRECIOS.map((p) => [p, c.sesionesPara(p)])) : undefined,
      }
    }
  }
  salida.modelos.push({
    id: modelo.id,
    nombre: modelo.nombre,
    resumen: modelo.resumen,
    celdas,
    equidad: {
      porMinuto15: porMin15,
      ratioP4P0: r2(porMin15[4] / porMin15[0]),
      maxMin: r2(Math.max(...porMin15) / Math.min(...porMin15)),
      gini: r2(gini(porMin15)),
      // Gini sobre los 2 000 niños simulados (400 por perfil), monedas por minuto en 15 min. Responde a la crítica de usar 5 medianas.
      giniNinos: r2(gini(PERFILES.flatMap((p) => celdas[p.id][15]._muestra))),
    },
    abuso: abuso(modelo),
    abusoAmpliado: abusoAmpliado(modelo),
    casoUsuario: casoUsuario(modelo),
    campanas,
    p0Lento: [15, 25].map((min) => campanaLento(modelo, min)).concat(modelo.id === 'E2' || modelo.id === 'M0' ? [campanaLento(modelo, 15, true)] : []),
  })
  console.log(
    modelo.id.padEnd(5),
    '15 min p50:',
    PERFILES.map((p) => `${p.id}=${celdas[p.id][15].monedas.p50}`).join(' '),
    '| max/min',
    salida.modelos.at(-1).equidad.maxMin,
    'gini',
    salida.modelos.at(-1).equidad.gini,
  )
}

for (const m of salida.modelos) for (const p of Object.values(m.celdas)) for (const c of Object.values(p)) delete c._muestra
writeFileSync(new URL('./datos/resultados.json', import.meta.url), JSON.stringify(salida) + '\n')
console.log('datos/resultados.json escrito')
}
