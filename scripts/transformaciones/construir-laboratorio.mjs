#!/usr/bin/env node
// Traduce a JS los módulos TypeScript que usa el laboratorio de transformaciones
// (pose.ts, especie.ts y compatibilidad.ts) con el `typescript` ya instalado; no
// empaqueta ni instala nada. También guarda la versión de pose.ts del último commit
// de main (3e188ce) como `pose-original.js`, para comprobar en el navegador que la
// escena de Ciempi sigue siendo idéntica.
// Uso (desde la raíz): node scripts/transformaciones/construir-laboratorio.mjs
import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..')
const gen = path.join(raiz, 'docs/rediseno-ciempi/laboratorio-transformaciones/gen')
fs.mkdirSync(gen, {recursive: true})

const traducir = (codigo, nombre) => {
  const js = ts.transpileModule(codigo, {compilerOptions: {module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: false}, fileName: nombre}).outputText
  // Importaciones relativas con extensión, como exige el navegador.
  return `// Generado por scripts/transformaciones/construir-laboratorio.mjs desde ${nombre}. No editar.\n` + js.replace(/from '(\.\/[^']+?)'/g, (_, p) => `from '${p.endsWith('.js') ? p : p + '.js'}'`)
}
for (const f of ['pose.ts', 'especie.ts', 'compatibilidad.ts']) {
  const src = path.join(raiz, 'src/ciempi/v2', f)
  fs.writeFileSync(path.join(gen, f.replace('.ts', '.js')), traducir(fs.readFileSync(src, 'utf8'), 'src/ciempi/v2/' + f))
}
const original = execFileSync('git', ['show', '3e188ce:src/ciempi/v2/pose.ts'], {cwd: raiz, encoding: 'utf8'})
fs.writeFileSync(path.join(gen, 'pose-original.js'), traducir(original, 'src/ciempi/v2/pose.ts@3e188ce'))
console.log('gen/', fs.readdirSync(gen).join(', '))
