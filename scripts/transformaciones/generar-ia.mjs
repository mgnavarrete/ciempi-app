#!/usr/bin/env node
// Generación real con Codex CLI (image_gen) para las transformaciones T01/T02.
// Uso: node scripts/transformaciones/generar-ia.mjs <destino> <id> <prompt.txt> <ref1.png> [ref2.png ...]
// Corre `codex exec` en un directorio temporal aislado, copia el PNG resultante a
// <destino>/<id>.png, guarda el prompt en <destino>/<id>-prompt.txt y registra la
// generación en <destino>/generaciones.json (fuente original, referencias, fecha).
import {spawnSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const [destino, id, promptFile, ...refs] = process.argv.slice(2)
if (!destino || !id || !promptFile || !refs.length) {
  console.error('Uso: generar-ia.mjs <destino> <id> <prompt.txt> <ref1.png> [ref2.png ...]')
  process.exit(2)
}
const prompt = fs.readFileSync(promptFile, 'utf8').trim()
const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), `ia-${id}-`))
const refsTmp = refs.map((r, i) => {
  const d = path.join(tmp, `ref${i + 1}${path.extname(r)}`)
  fs.copyFileSync(r, d)
  return d
})
const salida = `${id}.png`
const instruccion = `Use the image generation tool (image_gen) to create the image described below, using the attached images as references in the given order. Then save the final generated PNG (with real alpha transparency when transparency is requested) into the current directory as ${salida}. Do not write any other files and do not draw the image with code.\n\nIMAGE PROMPT:\n${prompt}`
const inicio = Date.now()
const antes = new Set(listarGeneradas())
const r = spawnSync('codex', ['exec', '--skip-git-repo-check', '--sandbox', 'workspace-write', '-C', tmp, ...refsTmp.flatMap((x) => ['-i', x])], {input: instruccion, encoding: 'utf8',maxBuffer: 64 * 1024 * 1024, timeout: 15 * 60 * 1000})
const log = (r.stdout || '') + '\n' + (r.stderr || '')
fs.writeFileSync(path.join(tmp, 'codex.log'), log)
let png = path.join(tmp, salida)
if (!fs.existsSync(png)) {
  const cand = fs.readdirSync(tmp).filter((f) => f.endsWith('.png') && !f.startsWith('ref'))
  if (cand.length) png = path.join(tmp, cand[0])
}
// Fuente original de image_gen: la mencionada en el registro o la nueva en ~/.codex/generated_images.
let fuente = (log.match(/\/home\/[^\s'"`]+generated_images\/[^\s'"`]+\.png/) || [null])[0]
if (!fuente) fuente = listarGeneradas().filter((f) => !antes.has(f)).pop() || null
if (!fs.existsSync(png) && fuente && fs.existsSync(fuente)) png = fuente
if (!fs.existsSync(png)) {
  console.error(`[${id}] sin imagen. Registro en ${tmp}/codex.log`)
  process.exit(1)
}
fs.mkdirSync(destino, {recursive: true})
fs.copyFileSync(png, path.join(destino, `${id}.png`))
fs.writeFileSync(path.join(destino, `${id}-prompt.txt`), prompt + '\n')
// Un registro por generación (las generaciones corren en paralelo); `registro-ia.mjs` los reúne.
const registro = {id, archivo: `${id}.png`, prompt: `${id}-prompt.txt`, referencias: refs, fuenteOriginal: fuente, herramienta: 'Codex CLI 0.166 exec + image_gen', fecha: new Date().toISOString(), segundos: Math.round((Date.now() - inicio) / 1000)}
fs.writeFileSync(path.join(destino, `${id}-registro.json`), JSON.stringify(registro, null, 2) + '\n')
console.log(`[${id}] OK ${path.join(destino, id + '.png')} (${Math.round((Date.now() - inicio) / 1000)} s)`)

function listarGeneradas() {
  const raiz = path.join(os.homedir(), '.codex', 'generated_images')
  if (!fs.existsSync(raiz)) return []
  const out = []
  for (const d of fs.readdirSync(raiz)) {
    const p = path.join(raiz, d)
    if (fs.statSync(p).isDirectory()) for (const f of fs.readdirSync(p)) if (f.endsWith('.png')) out.push(path.join(p, f))
  }
  return out.sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs)
}
