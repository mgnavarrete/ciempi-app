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

const leer = (f) => JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'))
const { cuentos: CUENTOS, reglas: REGLAS } = leer('./datos/cuentos.json')
const CATALOGO = leer('./datos/catalogo.json')
const ABUSOS_REALES = leer('./datos/abusos.json')

export const SEMILLA = 20261103
const N_NINOS = 400 // niños simulados por celda (Monte Carlo)
const DURACIONES = [10, 15, 20, 30]
const SESIONES_CAMPANA = 160

// ─── Azar reproducible ─────────────────────────────────────────────────────
function mulberry32(a) {
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
const cuantil = (xs, q) => {
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
const cuentosDeNivel = (n) => CUENTOS.filter((c) => c.nivel === n)

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
const esperadoMin = (u, nivel) => u.silabas / REF_SPM[nivel] + 3 / 60

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
    nombre: 'E · Híbrido (recomendado)',
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
]

// ─── Un niño leyendo ───────────────────────────────────────────────────────
function nuevoNino(perfil, rng, modo) {
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
function sesion(n, modelo, minutos) {
  n.dia++
  n.bloque = { activoMin: 0, dados: 0 }
  const res = { monedas: 0, unidades: 0, silabas: 0, libros: 0, activoMin: 0, porFuente: { unidad: 0, hitos: 0, libro: 0, nuevas: 0, bloque: 0, nivel: 0, relectura: 0, sinTropiezo: 0 } }
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
    let completo = true
    let activoLibro = 0
    for (let k = 0; k < libro.totalUnidades; k++) {
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
      if (tu.tropieza) tropezoEnLibro = true
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
        const esperado = esperadoMin(u, nivel)
        const base = modelo.usaTiempoReal ? Math.min(esperado, tu.activo) : esperado
        const tasa = nuevaUnidad ? modelo.tasa : modelo.relecturaTasa
        if (nuevaUnidad) est.leidoHasta = fin
        est.acarreo += tasa * base
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
      const esperadoLibro = libro.unidades.reduce((s, u) => s + esperadoMin(u, nivel), 0)
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
  return res
}

// ─── Experimentos ──────────────────────────────────────────────────────────
function resumen(xs) {
  return { p10: r1(cuantil(xs, 0.1)), p50: r1(cuantil(xs, 0.5)), p90: r1(cuantil(xs, 0.9)), media: r1(xs.reduce((s, x) => s + x, 0) / xs.length) }
}

/** Primera sesión (contenido nuevo) de cada perfil × duración × modelo. */
function primeraSesion(modelo, perfil, minutos) {
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
  }
}

/** Muchas sesiones seguidas de 15 min: acumulado y cuándo alcanza cada precio. */
function campana(modelo, perfil, modo, minutos = 15) {
  const rng = mulberry32(SEMILLA + 77 + perfil.nivel * 1000 + (modo === 'subidos' ? 500 : 0))
  const curvas = []
  for (let i = 0; i < N_NINOS; i++) {
    const n = nuevoNino(perfil, rng, modo)
    const acum = []
    let agotado = null
    for (let k = 0; k < SESIONES_CAMPANA; k++) {
      sesion(n, modelo, minutos)
      acum.push(n.monedas)
      if (agotado === null && n.cuentosResueltos >= cuentosDeNivel(perfil.nivel).length) agotado = k + 1
    }
    curvas.push({ acum, agotado })
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
  return {
    curvaMediana,
    agotaCuentos: resumen(curvas.map((c) => c.agotado ?? SESIONES_CAMPANA + 1)),
    sesionesPara,
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
// Catálogo completo comprable: piezas de pago, descontando las familias de colores (se compran una vez).
const familiasExtra = 36 // paleta:harry + paleta:hermione (familia gryffindor) y paleta:minnie (familia rosa): 3 × 12
export const CATALOGO_COMPLETO = CATALOGO.resumen.totalTodoSuelto - familiasExtra

// ─── El caso que describe el usuario: ~20 min por cuento en nivel 0 ─────────
/**
 * Un niño P0 mucho más lento que la mediana (factor 0,42 ≈ 2 ppm efectivas):
 * con estos supuestos tarda unos 20 min de sesión en un cuento de nivel 0.
 * Sesión de 25 min para que alcance a terminarlo.
 */
export const CASO_USUARIO = { factor: 0.42, minutos: 25 }
function casoUsuario(modelo) {
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
function abuso(modelo) {
  // Arrastre lo más rápido que permite el motor sin tropezar (4 manzanas/s, LIMITE_MAXIMO_RITMO)
  // sobre un texto subido por el propio niño. Tiempos mínimos (s) por unidad: arrastre + 0,45 s
  // (MS_PASO_FRASE) + ~0,6 s de voz final. Subir un texto nuevo: ~40 s (pegar y guardar).
  const casos = []
  const subir = 40
  if (modelo.reglaRitmo) {
    // Texto real verificado: «Mariposa amarilla.» × 300 → nivel 2 sugerido, sin tope (datos/abusos.json).
    const n2 = ABUSOS_REALES.find((a) => a.id === 'n2-sin-tope')
    const tope2 = modelo.id === 'M0' ? Infinity : modelo.id === 'A' ? 14 : 14
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
    const esperado = silabas / REF_SPM[0] + 3 / 60
    const segUnidad = silabas / 4 + 0.45 + 0.6
    const activo = segUnidad / 60
    const porUnidad = modelo.tasa * (modelo.usaTiempoReal ? Math.min(esperado, activo) : esperado)
    const unidades = 300
    const bloque = modelo.bloque ? (modelo.bloque.monedas / modelo.bloque.minutos) : 0
    const min = (unidades * segUnidad + subir) / 60
    const pago = unidades * porUnidad + Math.min(bloque * min, modelo.bloque ? modelo.bloque.monedas * modelo.bloque.maxPorDia : 0) + (modelo.libroTerminado?.({ esperadoLibro: 0, activoLibro: 0 }) ?? 0)
    casos.push({ accion: 'Subir un texto de 300 frases de 8 sílabas (nivel 0) y arrastrar a 4 sílabas/s', monedas: Math.round(pago), minutos: r1(min), porMinuto: r1(pago / min) })
  }
  return casos
}

// ─── Equidad ───────────────────────────────────────────────────────────────
function gini(xs) {
  const n = xs.length
  const media = xs.reduce((s, x) => s + x, 0) / n
  let suma = 0
  for (const a of xs) for (const b of xs) suma += Math.abs(a - b)
  return suma / (2 * n * n * media)
}

// ─── Ejecutar ──────────────────────────────────────────────────────────────
const salida = {
  semilla: SEMILLA,
  nNinos: N_NINOS,
  duraciones: DURACIONES,
  perfiles: PERFILES,
  supuestos: SUPUESTOS,
  refSpm: REF_SPM,
  articulos: ARTICULOS,
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
    },
    abuso: abuso(modelo),
    casoUsuario: casoUsuario(modelo),
    campanas,
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

writeFileSync(new URL('./datos/resultados.json', import.meta.url), JSON.stringify(salida) + '\n')
console.log('datos/resultados.json escrito')
