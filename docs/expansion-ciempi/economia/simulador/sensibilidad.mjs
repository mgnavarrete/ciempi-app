/**
 * Verificación de E2: sensibilidad a los supuestos, tope por unidad, niveles 3 y 4
 * (mitigación) y migración desde 2.4.1 con saldos conservados.
 *
 *   node docs/expansion-ciempi/economia/simulador/sensibilidad.mjs
 *
 * Importa las funciones de simular.mjs (no reescribe resultados.json) y escribe
 * datos/sensibilidad.json. Misma semilla; cada escenario cambia UN supuesto (o
 * un grupo declarado), mide y lo restaura. No son datos de niños.
 */
import { writeFileSync } from 'node:fs'
import {
  SEMILLA, PERFILES, SUPUESTOS, MODELOS, REF_SPM_E2, CASO_USUARIO,
  mulberry32, cuantil, nuevoNino, sesion, primeraSesion, campana, campanaLento, casoUsuario, abusoAmpliado, gini, resumen,
} from './simular.mjs'

const E2 = MODELOS.find((m) => m.id === 'E2')
const M0 = MODELOS.find((m) => m.id === 'M0')
const r1 = (x) => Math.round(x * 10) / 10
const r2 = (x) => Math.round(x * 100) / 100
const N = 400

/** Indicadores de un escenario (E2 salvo que se indique). */
function medir(modelo = E2, minutos = 15) {
  const celdas = PERFILES.map((p) => primeraSesion(modelo, p, minutos))
  const porMin = celdas.map((c) => c.porMinuto)
  const m0 = PERFILES.map((p) => primeraSesion(M0, p, minutos).porMinuto)
  const c0 = campana(modelo, PERFILES[0], 'relee', minutos)
  const lento = campanaLento(modelo, minutos)
  const abusos = abusoAmpliado(modelo).filter((a) => a.id !== 'falso-reloj-actual')
  const peor = abusos.reduce((a, b) => (b.porMinuto > a.porMinuto ? b : a))
  return {
    monedas: Object.fromEntries(PERFILES.map((p, i) => [p.id, celdas[i].monedas.p50])),
    brecha: r2(Math.max(...porMin) / Math.min(...porMin)),
    brechaM0: r2(Math.max(...m0) / Math.min(...m0)),
    giniNinos: r2(gini(celdas.flatMap((c) => c._muestra))),
    casoUsuario: casoUsuario(modelo).monedas.p50,
    p0En20: c0.curvaMediana[19],
    p0Dragon80: c0.sesionesPara(80),
    lentoDragon80: lento.sesionesParaGrilla[80],
    lentoCuncunaVia3: lento.sesionesProgresoCuncuna,
    peorAbuso: { id: peor.id, porMinuto: peor.porMinuto },
  }
}

/** Ejecuta `cambiar`, mide y restaura una copia profunda de los supuestos tocados. */
function escenario(id, nombre, grupo, cambiar, opciones = {}) {
  const copiaP = PERFILES.map((p) => ({ ...p }))
  const copiaS = JSON.parse(JSON.stringify(SUPUESTOS))
  const copiaRef = { ...REF_SPM_E2 }
  const copiaCap = E2.capFactor
  cambiar()
  const t0 = Date.now()
  const r = medir(E2, opciones.minutos ?? 15)
  PERFILES.forEach((p, i) => Object.assign(p, copiaP[i]))
  for (const k of Object.keys(copiaS)) SUPUESTOS[k].valor = copiaS[k].valor
  Object.assign(REF_SPM_E2, copiaRef)
  E2.capFactor = copiaCap
  console.log(id.padEnd(16), `${((Date.now() - t0) / 1000).toFixed(1)} s`, JSON.stringify(r.monedas), 'brecha', r.brecha, 'abuso', r.peorAbuso.porMinuto)
  return { id, nombre, grupo, ...r }
}

const porPerfil = (f) => () => PERFILES.forEach(f)
const escenarios = [
  escenario('base', 'E2 tal como está (§6.3)', 'Base', () => {}),
  escenario('ritmo-70', 'Todos leen 30 % más lento', 'Ritmo', porPerfil((p) => (p.ppm *= 0.7))),
  escenario('ritmo-130', 'Todos leen 30 % más rápido', 'Ritmo', porPerfil((p) => (p.ppm *= 1.3))),
  escenario('ritmo-abre', 'P0–P1 30 % más lentos y P3–P4 30 % más rápidos', 'Ritmo', porPerfil((p) => (p.ppm *= p.nivel <= 1 ? 0.7 : p.nivel >= 3 ? 1.3 : 1))),
  escenario('ritmo-cierra', 'P0–P1 30 % más rápidos y P3–P4 30 % más lentos', 'Ritmo', porPerfil((p) => (p.ppm *= p.nivel <= 1 ? 1.3 : p.nivel >= 3 ? 0.7 : 1))),
  escenario('sigma-050', 'Más dispersión entre niños (σ 0,35 → 0,50)', 'Ritmo', () => (SUPUESTOS.sigmaNino.valor = 0.5)),
  escenario('tropiezo-50', 'Tropiezos a la mitad', 'Tropiezos', porPerfil((p) => (p.tropiezo *= 0.5))),
  escenario('tropiezo-200', 'Tropiezos al doble', 'Tropiezos', porPerfil((p) => (p.tropiezo *= 2))),
  escenario('tropiezo-300', 'Tropiezos al triple (P0 = 30 %)', 'Tropiezos', porPerfil((p) => (p.tropiezo *= 3))),
  escenario('fuera-70', 'Tiempo fuera de la lectura −30 %', 'Tiempo fuera', porPerfil((p) => (p.fuera *= 0.7))),
  escenario('fuera-130', 'Tiempo fuera de la lectura +30 %', 'Tiempo fuera', porPerfil((p) => (p.fuera *= 1.3))),
  escenario('sesion-10', 'Sesiones de 10 min', 'Duración', () => {}, { minutos: 10 }),
  escenario('sesion-20', 'Sesiones de 20 min', 'Duración', () => {}, { minutos: 20 }),
  escenario('sesion-30', 'Sesiones de 30 min', 'Duración', () => {}, { minutos: 30 }),
  escenario('ref-70', 'Referencias de E2 −30 % (todas)', 'Referencia E2', () => Object.keys(REF_SPM_E2).forEach((k) => (REF_SPM_E2[k] *= 0.7))),
  escenario('ref-130', 'Referencias de E2 +30 % (todas)', 'Referencia E2', () => Object.keys(REF_SPM_E2).forEach((k) => (REF_SPM_E2[k] *= 1.3))),
  escenario('ref-n0-7', 'N0 = 7 síl/min (valor de E)', 'Referencia E2', () => (REF_SPM_E2[0] = 7)),
  escenario('cap-150', 'Tope por unidad 1,5× (en vez de 2×)', 'Tope', () => (E2.capFactor = 1.5)),
  escenario('cap-300', 'Tope por unidad 3×', 'Tope', () => (E2.capFactor = 3)),
]

// ─── ¿A quién le corta el tope por unidad? ────────────────────────────────
/** Fracción del tiempo activo que queda sin pagar por el tope, y la repetición no pagada. */
function cortePorTope(capFactor) {
  const antes = E2.capFactor
  E2.capFactor = capFactor
  const filas = []
  const grupos = [...PERFILES.map((p) => ({ id: p.id, perfil: p, factor: null })), { id: 'Muy lento', perfil: PERFILES[0], factor: CASO_USUARIO.factor }]
  for (const g of grupos) {
    const rng = mulberry32(SEMILLA + 31337 + g.perfil.nivel)
    let activo = 0
    let sobre = 0
    let repeticion = 0
    const fracs = []
    for (let i = 0; i < N; i++) {
      const n = nuevoNino(g.perfil, rng, 'relee')
      if (g.factor) n.factor = g.factor
      let a = 0
      let s = 0
      for (let k = 0; k < 10; k++) {
        const r = sesion(n, E2, 15)
        a += r.activoMin - r.repeticionMin
        s += r.sobreTopeMin
        repeticion += r.repeticionMin
      }
      activo += a
      sobre += s
      fracs.push(a ? s / a : 0)
    }
    filas.push({ grupo: g.id, sinPagarPorTope: r2((100 * sobre) / activo), p90Nino: r1(100 * cuantil(fracs, 0.9)), repeticionNoPagada: r1((100 * repeticion) / (activo + repeticion)) })
  }
  E2.capFactor = antes
  return { capFactor, filas }
}
const tope = [1.25, 1.5, 2].map(cortePorTope)

// ─── Niveles 3 y 4: mitigación «palabras nuevas» en N2–N4 ─────────────────
const E2H = {
  ...E2,
  id: 'E2H',
  nombre: 'E2 + palabras nuevas en N2–N4 (+2 cada 40)',
  silabasNuevas: { ...E2.silabasNuevas, 2: { cada: 40, monedas: 2, que: 'palabras' }, 3: { cada: 40, monedas: 2, que: 'palabras' }, 4: { cada: 40, monedas: 2, que: 'palabras' } },
}
function compararModelos(modelos) {
  return modelos.map((m) => {
    const celdas = PERFILES.map((p) => primeraSesion(m, p, 15))
    const porMin = celdas.map((c) => c.porMinuto)
    const camp = Object.fromEntries(
      PERFILES.map((p) => {
        const out = {}
        for (const modo of ['relee', 'subidos']) {
          const c = campana(m, p, modo)
          out[modo] = { en3: c.curvaMediana[2], en10: c.curvaMediana[9], en20: c.curvaMediana[19], en144: c.curvaMediana[143], dragon80: c.sesionesPara(80).p50, conj84: c.sesionesPara(84).p50, ola1: c.sesionesPara(360).p50, fuentes: c.fuentes }
        }
        return [p.id, out]
      }),
    )
    return {
      id: m.id,
      nombre: m.nombre,
      monedas15: Object.fromEntries(PERFILES.map((p, i) => [p.id, celdas[i].monedas.p50])),
      brecha: r2(Math.max(...porMin) / Math.min(...porMin)),
      giniNinos: r2(gini(celdas.flatMap((c) => c._muestra))),
      peorAbuso: Math.max(...abusoAmpliado(m).filter((a) => a.id !== 'falso-reloj-actual').map((a) => a.porMinuto)),
      campanas: camp,
    }
  })
}
const mitigacion = compararModelos([M0, E2, E2H])

// ─── Migración: 20 sesiones en 2.4.1 y luego 40 en el modelo nuevo ────────
/**
 * Saldos conservados (nadie gasta en la simulación: el saldo es una cota alta).
 * `retro`: al migrar, se paga «nivel completo» (+15) a quien ya terminó los 8
 * cuentos de su nivel, y se cuentan como vistas las sílabas/palabras de los
 * cuentos que ya terminó (sin volver a pagarlas).
 */
function migracion(modeloNuevo, modo, { retro = false, antes = 20, despues = 40 } = {}) {
  return PERFILES.map((p) => {
    const rng = mulberry32(SEMILLA + 9000 + p.nivel * 10 + (modo === 'subidos' ? 5 : 0))
    const saldos = []
    const ganado10 = []
    const ganadoAntes10 = []
    const ola1 = []
    const nuevasRepetidas = []
    const retroPagado = []
    for (let i = 0; i < N; i++) {
      const n = nuevoNino(p, rng, modo)
      const hist = []
      for (let k = 0; k < antes; k++) hist.push(sesion(n, M0, 15).monedas)
      ganadoAntes10.push(hist.slice(-10).reduce((s, x) => s + x, 0))
      saldos.push(n.monedas)
      let extra = 0
      if (retro && modeloNuevo !== M0) {
        for (const [id, e] of n.libros) {
          if (!e.terminado || id.startsWith('subido-')) continue
          const c = n.cola.find((x) => x.id === id)
          for (const s of c.silabasDistintas) n.silabasVistas.add(s)
          for (const s of c.palabrasDistintas) n.palabrasVistas.add(s)
        }
        n.contadorNuevas = 0
        if (modeloNuevo.nivelCompleto && n.cuentosNuevosTerminados >= 8) {
          n.nivelCompletoPagado = true
          n.monedas += modeloNuevo.nivelCompleto
          extra = modeloNuevo.nivelCompleto
        }
      }
      retroPagado.push(extra)
      let g = 0
      let nuevas = 0
      let compra = null
      for (let k = 0; k < despues; k++) {
        const r = sesion(n, modeloNuevo, 15)
        if (k < 10) g += r.monedas
        nuevas += r.porFuente.nuevas
        if (compra === null && n.monedas >= saldos.at(-1) + 360) compra = k + 1
      }
      ganado10.push(g + extra)
      ola1.push(compra ?? 1e9)
      nuevasRepetidas.push(nuevas)
    }
    const f = (q) => {
      const v = cuantil(ola1, q)
      return v >= 1e8 ? null : Math.ceil(v)
    }
    return {
      perfil: p.id,
      saldoAlMigrar: resumen(saldos),
      ultimas10Antes: resumen(ganadoAntes10),
      primeras10Despues: resumen(ganado10),
      // Cuántas sesiones después de migrar hasta ganar 360 NUEVAS monedas (ola 1) sin tocar el saldo previo.
      sesionesOla1ConGanancia: { p50: f(0.5), p90: f(0.9) },
      // ¿Alcanza el saldo previo para la ola 1 entera el día del lanzamiento?
      saldoCubreOla1: r2(saldos.filter((s) => s >= 360).length / saldos.length),
      saldoCubreDragon: r2(saldos.filter((s) => s >= 80).length / saldos.length),
      nuevasPost: r1(nuevasRepetidas.reduce((s, x) => s + x, 0) / N),
      retroMedia: r1(retroPagado.reduce((s, x) => s + x, 0) / N),
    }
  })
}
const migraciones = {}
for (const modo of ['relee', 'subidos']) {
  migraciones[modo] = {
    M0: migracion(M0, modo),
    E2: migracion(E2, modo),
    E2retro: migracion(E2, modo, { retro: true }),
    E2Hretro: migracion(E2H, modo, { retro: true }),
  }
}

const salida = { semilla: SEMILLA, nNinos: N, escenarios, tope, mitigacion, migraciones }
writeFileSync(new URL('./datos/sensibilidad.json', import.meta.url), JSON.stringify(salida, null, 1) + '\n')
console.log('datos/sensibilidad.json escrito')
