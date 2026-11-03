// Compila la demo de E08 (index.html) y la hoja de cuadros (hoja.html) en
// modo producción dentro de demo-comer/dist/, sin copiar public/ (16 MB):
// servir.mjs sirve dist/ y toma /ciempi-v2/ de public/ del repositorio.
//   node docs/expansion-ciempi/animacion/demo-comer/construir.mjs
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = resolve(aqui, '../../../..')
const { version } = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8'))
await build({
  root: aqui, base: './', configFile: false, publicDir: false, logLevel: 'warn',
  plugins: [react(), tailwindcss()],
  define: { __VERSION_APP__: JSON.stringify(version) },
  build: { outDir: join(aqui, 'dist'), emptyOutDir: true, rollupOptions: { input: [join(aqui, 'index.html'), join(aqui, 'hoja.html')] } },
})
console.log('Listo:', join(aqui, 'dist'))
