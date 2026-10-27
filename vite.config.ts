/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

// En WSL los cambios hechos desde Windows sobre /mnt/* no disparan inotify:
// se usa polling para que la recarga en caliente funcione igual.
const enWsl = Boolean(process.env.WSL_DISTRO_NAME)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // La versión de package.json, para mostrarla en Ajustes (la misma de la APK).
  define: { __VERSION_APP__: JSON.stringify(version) },
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
