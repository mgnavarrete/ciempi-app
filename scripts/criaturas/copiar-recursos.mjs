#!/usr/bin/env node
// Copia del laboratorio a public/criaturas/ SOLO los recursos que usa el juego
// (src/ciempi/v2/criaturas/), con manifiestos recortados a esas piezas.
// No modifica los originales: docs/rediseno-ciempi/laboratorio-transformaciones/recursos/.
//
//   node scripts/criaturas/copiar-recursos.mjs
//
// Qué se queda fuera: rostro v4b del Dragón y v4 de la Cuncuna (no elegidos),
// iteración v1 de Serpiente y Camaleón (cabeza-piel v1, lengüita, pierna/pie v1,
// torretas v1 y v2), expresiones -alt y -sinlengua (el juego no las pide) y los
// accesorios v4 (fuera de esta versión).
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const origen = join(raiz, 'docs/rediseno-ciempi/laboratorio-transformaciones/recursos')
const destino = join(raiz, 'public/criaturas')
const leer = (r) => JSON.parse(readFileSync(join(origen, r), 'utf8'))
const NOTA = 'Copia para el juego (scripts/criaturas/copiar-recursos.mjs): solo lo que usa src/ciempi/v2/criaturas/. Original en docs/rediseno-ciempi/laboratorio-transformaciones/recursos/.'

/** Piezas de cuerpo que usa cada especie (iteración aprobada). */
const PIEZAS = {
  dragon: ['seg-a', 'seg-b', 'seg-c', 'seg-d', 'frente', 'cola', 'pierna', 'pie', 'cabeza-rasgos', 'alas'],
  cuncuna: ['seg-a', 'seg-b', 'seg-c', 'seg-d', 'frente', 'cola', 'pierna', 'pie', 'cabeza-rasgos'],
  serpiente: ['seg-a', 'seg-b', 'seg-c', 'seg-d', 'frente', 'cola', 'cabeza-piel-v2'],
  camaleon: ['seg-a', 'seg-b', 'seg-c', 'seg-d', 'frente', 'cola', 'pierna-v2', 'pie-v2', 'cabeza-piel', 'casco'],
}
/** Carpeta del rostro y qué capas usa (el Camaleón con ojos k3 solo la capa `rostro`). */
const ROSTROS = { dragon: ['v4', ['rostro', 'ojos']], cuncuna: ['v4b', ['rostro', 'ojos']], serpiente: ['rostro-v2', ['rostro', 'ojos']], camaleon: ['rostro-v2', ['rostro']] }

// Las miniaturas (public/criaturas/miniaturas/) son de otro script: no se tocan.
for (const e of Object.keys(PIEZAS)) rmSync(join(destino, e), { recursive: true, force: true, maxRetries: 3 })
const copiados = new Set()
const copiar = (rel) => {
  if (copiados.has(rel)) return
  mkdirSync(dirname(join(destino, rel)), { recursive: true })
  copyFileSync(join(origen, rel), join(destino, rel))
  copiados.add(rel)
}
const escribir = (rel, datos) => {
  mkdirSync(dirname(join(destino, rel)), { recursive: true })
  writeFileSync(join(destino, rel), JSON.stringify({ nota: NOTA, ...datos }, null, 1) + '\n')
}

for (const [especie, ids] of Object.entries(PIEZAS)) {
  const m = leer(`${especie}/manifiesto.json`)
  const piezas = ids.map((id) => {
    const p = m.piezas.find((x) => x.id === id)
    if (!p) throw Error(`Falta ${id} en ${especie}`)
    copiar(`${especie}/${p.archivo}`)
    return p
  })
  escribir(`${especie}/manifiesto.json`, { ...m, estado: 'aprobado para el juego (AD-022)', piezas, bytesTotales: undefined })

  const [carpeta, capas] = ROSTROS[especie]
  const r = leer(`${especie}/${carpeta}/manifiesto.json`)
  // Solo las expresiones que el juego alcanza: una por B03 (la primera, como `entradaDe`).
  const vistas = new Set()
  const expresiones = {}
  for (const [k, e] of Object.entries(r.expresiones)) {
    if (!e.b03 || vistas.has(e.b03)) continue
    vistas.add(e.b03)
    const entrada = { b03: e.b03 }
    if (capas.includes('rostro')) { entrada.rostro = e.rostro; copiar(`${especie}/${carpeta}/${e.rostro.archivo}`) }
    if (capas.includes('ojos')) { entrada.ojos = e.ojos ?? []; for (const o of entrada.ojos) if (o) copiar(`${especie}/${carpeta}/${o.archivo}`) }
    expresiones[k] = entrada
  }
  if (!vistas.has(r.porDefecto)) throw Error('Sin expresión por defecto en ' + especie)
  escribir(`${especie}/${carpeta}/manifiesto.json`, { especie, version: r.version, porDefecto: r.porDefecto, expresiones })
}

// Ojos k3 «Atardecer» (todas las variantes del Camaleón).
const k3 = leer('camaleon/ojos-k3/manifiesto.json')
for (const t of Object.values(k3.torretas)) copiar(`camaleon/ojos-k3/${t.archivo}`)
escribir('camaleon/ojos-k3/manifiesto.json', k3)

const bytes = [...copiados].reduce((s, r) => s + statSync(join(destino, r)).size, 0)
console.log(`${copiados.size} archivos copiados a public/criaturas/ (${(bytes / 1024).toFixed(0)} KiB, sin miniaturas).`)
