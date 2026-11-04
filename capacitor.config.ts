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
  plugins: {
    // Actualización de la parte web desde el servidor propio (src/plataforma/actualizacion y
    // docs/despliegue.md). Todo lo decide la app: nada automático ni servicios de Capgo.
    CapacitorUpdater: {
      autoUpdate: false,
      // Sin estadísticas ni canales en la nube de Capgo.
      statsUrl: '',
      channelUrl: '',
      updateUrl: 'https://ciempi.minttu.cl/ota/ultima.json',
      // Si un paquete nuevo no avisa que arrancó (notifyAppReady) en 15 s, se vuelve al anterior.
      appReadyTimeout: 15000,
      // Un paquete que falló se guarda marcado como error: así no se vuelve a descargar.
      autoDeleteFailed: false,
      autoDeletePrevious: true,
      // Al instalar una APK nueva se descartan los paquetes descargados (vuelve la web de la APK).
      resetWhenUpdate: true,
      shakeMenu: false,
    },
  },
}

export default config
