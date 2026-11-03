// Sirve la demo compilada (dist/) en http://127.0.0.1:8773/ sin `npm run dev`.
// /ciempi-v2/… (vestuario) y /favicon.png salen de public/ del repositorio.
//   node docs/expansion-ciempi/animacion/demo-comer/servir.mjs [puerto]
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const publico = resolve(aqui, '../../../../public')
const dist = join(aqui, 'dist')
const puerto = +(process.argv[2] ?? 8773)
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' }

createServer((req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (ruta.endsWith('/')) ruta += 'index.html'
  const seguro = normalize(ruta).replace(/^(\.\.[/\\])+/, '')
  const base = seguro.startsWith('/ciempi-v2/') || seguro === '/favicon.png' ? publico : dist
  const archivo = join(base, seguro)
  if (!archivo.startsWith(base) || !existsSync(archivo) || !statSync(archivo).isFile()) {
    res.writeHead(404).end('No encontrado')
    return
  }
  res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] ?? 'application/octet-stream' })
  createReadStream(archivo).pipe(res)
}).listen(puerto, '127.0.0.1', () => console.log(`Demo E08: http://127.0.0.1:${puerto}/  ·  hoja: http://127.0.0.1:${puerto}/hoja.html`))
