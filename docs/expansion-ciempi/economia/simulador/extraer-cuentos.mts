/**
 * Extrae, con el troceo REAL del juego, las unidades de cada cuento de Ciempi
 * en su nivel y lo que paga hoy la primera lectura (src/lectura/monedas.ts).
 * No copia reglas: importa los módulos TypeScript del juego tal cual.
 *
 * Ejecutar desde la raíz del repo (Node 22.6 o superior, sin dependencias):
 *   node --experimental-strip-types docs/expansion-ciempi/economia/simulador/extraer-cuentos.mts
 * Escribe docs/expansion-ciempi/economia/simulador/datos/cuentos.json
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { CUENTOS } from '../../../../src/contenido/cuentos.ts'
import { dividirConParrafos, quitarGuiones, dividirEnFragmentos } from '../../../../src/lenguaje/frases.ts'
import { vistaPorNivel } from '../../../../src/lenguaje/unidades.ts'
import { silabearFrase } from '../../../../src/lenguaje/silabas.ts'
import { medirTexto } from '../../../../src/lenguaje/dificultad.ts'
import {
  HITOS,
  MINIMO_A_BUEN_RITMO,
  MONEDAS_POR_UNIDAD,
  TOPE_POR_LIBRO,
  contarPalabras,
  monedasDeUnidad,
  premioRelectura,
} from '../../../../src/lectura/monedas.ts'

const salida = CUENTOS.map((c, i) => {
  // Igual que server/src/cuentos.ts (sembrarCuentos).
  const { frases, parrafos } = dividirConParrafos(c.texto)
  const texto = { frases, parrafos, capitulos: [{ titulo: c.titulo, desdeFrase: 0 }] }
  const vista = vistaPorNivel(texto, c.nivel)
  const total = vista.unidades.length
  const unidades = vista.unidades.map((u, k) => {
    // Igual que PantallaLectura: la unidad sin guiones de diálogo.
    const limpia = quitarGuiones(u)
    const sil = silabearFrase(limpia)
    // Manzanas de la pista (lo que el niño recorre con el dedo): sílabas en N0,
    // palabras en N1-2, fragmentos en N3 y fragmentos por oración en N4.
    const manzanas =
      c.nivel === 0
        ? sil.reduce((s, p) => s + p.silabas.length, 0)
        : c.nivel <= 2
          ? sil.length
          : dividirEnFragmentos(limpia, { porOracion: c.nivel === 4 }).length
    return {
      palabras: contarPalabras(limpia),
      silabas: sil.reduce((s, p) => s + p.silabas.length, 0),
      manzanas,
      monedas: monedasDeUnidad(c.nivel, k + 1, total),
    }
  })
  const porUnidad = unidades.reduce((s, u) => s + u.monedas, 0)
  const porHitos = HITOS[c.nivel].reduce((s, h) => s + h.monedas, 0)
  const m = medirTexto(frases)
  // Sílabas y palabras distintas (en minúscula, sin signos): para hitos de "sílabas nuevas".
  const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}]/gu, '')
  const todas = vista.unidades.flatMap((u) => silabearFrase(quitarGuiones(u)))
  const silabasDistintas = [...new Set(todas.flatMap((p) => p.silabas.map(norm)).filter(Boolean))]
  const palabrasDistintas = [...new Set(todas.map((p) => norm(p.texto)).filter(Boolean))]
  return {
    n: i + 1,
    id: c.id,
    nivel: c.nivel,
    titulo: c.titulo,
    personajeConMarca: i >= 20,
    frases: frases.length,
    totalUnidades: total,
    palabras: unidades.reduce((s, u) => s + u.palabras, 0),
    silabas: unidades.reduce((s, u) => s + u.silabas, 0),
    silabasPorPalabra: +m.silabasPorPalabra.toFixed(3),
    palabrasPorOracion: +m.palabrasPorOracion.toFixed(2),
    monedasPrimeraLectura: porUnidad + porHitos,
    monedasPorUnidad: porUnidad,
    monedasPorHitos: porHitos,
    relectura: premioRelectura(c.nivel),
    unidades,
    silabasDistintas,
    palabrasDistintas,
  }
})

const reglas = {
  MONEDAS_POR_UNIDAD,
  TOPE_POR_LIBRO: Object.fromEntries(Object.entries(TOPE_POR_LIBRO).map(([k, v]) => [k, Number.isFinite(v) ? v : null])),
  HITOS,
  MINIMO_A_BUEN_RITMO,
  RELECTURA: Object.fromEntries([0, 1, 2, 3, 4].map((n) => [n, premioRelectura(n as 0)])),
}
mkdirSync(new URL('./datos/', import.meta.url), { recursive: true })
writeFileSync(new URL('./datos/cuentos.json', import.meta.url), JSON.stringify({ reglas, cuentos: salida }, null, 1) + '\n')
for (const c of salida) {
  console.log(
    String(c.n).padStart(2),
    'N' + c.nivel,
    c.titulo.padEnd(36),
    'unid',
    String(c.totalUnidades).padStart(3),
    'pal',
    String(c.palabras).padStart(4),
    'síl',
    String(c.silabas).padStart(4),
    'monedas',
    c.monedasPrimeraLectura,
  )
}
