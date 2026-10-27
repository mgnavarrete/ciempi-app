/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En WSL los cambios hechos desde Windows sobre /mnt/* no disparan inotify:
// se usa polling para que la recarga en caliente funcione igual.
const enWsl = Boolean(process.env.WSL_DISTRO_NAME)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    watch: enWsl ? { usePolling: true, interval: 300 } : undefined,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
