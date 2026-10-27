import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'

/**
 * Lo que la APK de Android necesita del teléfono (plugin nativo en
 * android/app/src/main/java/cl/ciempi/app/TelefonoPlugin.java). En la web no hace nada.
 */

interface Zona {
  x: number
  y: number
  ancho: number
  alto: number
}

interface PluginTelefono {
  excluirGestos(opciones: { zonas: Zona[] }): Promise<void>
  minimizar(): Promise<void>
  instalarVoz(): Promise<void>
  addListener(evento: 'atras', fn: () => void): Promise<PluginListenerHandle>
}

export const enAndroid = Capacitor.getPlatform() === 'android'
const Telefono = registerPlugin<PluginTelefono>('Telefono')

/**
 * El gesto "atrás" del teléfono hace lo mismo que el botón Volver de la
 * pantalla. Leyendo no hace nada: el niño desliza cerca del borde y no debe
 * salirse sin querer. Donde no hay Volver (la biblioteca), la app se va al
 * fondo sin cerrarse.
 */
export function usarGestoAtras(): void {
  if (!enAndroid) return
  void Telefono.addListener('atras', () => {
    if (document.querySelector('.pista')) return
    const volver = document.querySelector<HTMLButtonElement>('button[aria-label="Volver"]')
    if (volver) volver.click()
    else void Telefono.minimizar()
  })
}

/** Android no toma el gesto "atrás" sobre este elemento mientras esté en pantalla. */
export function protegerDelGestoAtras(el: HTMLElement): () => void {
  if (!enAndroid) return () => {}
  const enviar = () => {
    const r = el.getBoundingClientRect()
    void Telefono.excluirGestos({ zonas: [{ x: r.left, y: r.top, ancho: r.width, alto: r.height }] })
  }
  enviar()
  const observador = new ResizeObserver(enviar)
  observador.observe(el)
  window.addEventListener('resize', enviar)
  return () => {
    observador.disconnect()
    window.removeEventListener('resize', enviar)
    void Telefono.excluirGestos({ zonas: [] })
  }
}

/** Abre la descarga de voces del teléfono (Servicios de voz de Google, o los ajustes de texto a voz). */
export function instalarVozDelTelefono(): Promise<void> {
  return Telefono.instalarVoz()
}
