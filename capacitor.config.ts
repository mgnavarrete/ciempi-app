import type { CapacitorConfig } from '@capacitor/cli'

/** App Android (y más adelante iOS) con Capacitor: la misma web empaquetada. */
const config: CapacitorConfig = {
  appId: 'cl.ciempi.app',
  appName: 'CIEMPI',
  webDir: 'dist',
  android: {
    // La app se usa siempre en horizontal (ver AndroidManifest: screenOrientation).
    backgroundColor: '#fdf8ee',
  },
}

export default config
