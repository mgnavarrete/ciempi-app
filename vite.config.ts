/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

/**
 * Sello de compilación (AAAAMMDDhhmmss, UTC): distingue dos publicaciones de la misma versión
 * para la actualización automática de la APK (src/plataforma/actualizacion). Sale de la fecha del
 * último commit, así la APK y el paquete del servidor hechos del mismo commit llevan el mismo sello.
 * scripts/empaquetar-ota.mjs lo fija con CIEMPI_COMPILACION.
 */
function selloDeCompilacion(): string {
  if (process.env.CIEMPI_COMPILACION) return process.env.CIEMPI_COMPILACION
  let fecha = new Date()
  try {
    const segundos = execFileSync('git', ['log', '-1', '--format=%ct'], { encoding: 'utf8' }).trim()
    if (segundos) fecha = new Date(Number(segundos) * 1000)
  } catch {
    // Sin git: la hora de ahora.
  }
  return fecha.toISOString().replace(/\D/g, '').slice(0, 14)
}

// En WSL los cambios hechos desde Windows sobre /mnt/* no disparan inotify:
// se usa polling para que la recarga en caliente funcione igual.
const enWsl = Boolean(process.env.WSL_DISTRO_NAME)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // La versión de package.json, para mostrarla en Ajustes (la misma de la APK).
  define: { __VERSION_APP__: JSON.stringify(version), __COMPILACION_APP__: JSON.stringify(selloDeCompilacion()) },
  server: {
    port: 5173,
    // En desarrollo, /api va al servidor de Ciempi (npm run servidor), igual que con nginx.
    proxy: { '/api': 'http://127.0.0.1:3200' },
    watch: enWsl ? { usePolling: true, interval: 300 } : undefined,
  },
  test: {
    include: ['src/**/*.test.ts', 'server/test/**/*.test.ts'],
  },
})
