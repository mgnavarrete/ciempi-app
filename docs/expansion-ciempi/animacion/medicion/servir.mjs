// Compila una página del banco en modo producción (React de producción, como
// la APK) y la sirve con `vite preview` en 127.0.0.1:8773. Lo usan medir.mjs,
// capturas.mjs y la demo de E08.
import { build, preview } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const aqui = dirname(fileURLToPath(import.meta.url))
export const raiz = resolve(aqui, '../../../..')

/** Playwright viene de NODE_PATH (require de CommonJS sí lo respeta; import no). */
export const { chromium } = createRequire(import.meta.url)('playwright')
/** Chromium instalado por Playwright (la versión de NODE_PATH espera otro build; se usa el disponible). */
export const CHROMIUM = process.env.CHROMIUM || join(process.env.HOME, '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')

/** Compila `paginas` (rutas absolutas .html) y las sirve; devuelve la URL de cada una. */
export async function servir(paginas, etiqueta, puerto = 8773) {
  const salida = join(process.env.SALIDA_BANCO || join(tmpdir(), 'banco-ciempi'), etiqueta)
  const { version } = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8'))
  await build({
    root: raiz, logLevel: 'warn', configFile: false,
    plugins: [react(), tailwindcss()],
    define: { __VERSION_APP__: JSON.stringify(version) },
    build: { outDir: salida, emptyOutDir: true, rollupOptions: { input: paginas } },
  })
  const servidor = await preview({ root: raiz, configFile: false, logLevel: 'warn', build: { outDir: salida }, preview: { port: puerto, host: '127.0.0.1', strictPort: true } })
  return { salida, urls: paginas.map((p) => `http://127.0.0.1:${puerto}/${relative(raiz, p)}`), cerrar: () => servidor.close() }
}
