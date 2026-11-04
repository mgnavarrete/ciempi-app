// Página de paridad del JUEGO: src/ciempi/v2/criaturas (TypeScript, servida por Vite).
import { load, defaults } from '../../../src/ciempi/v2/arte/cargar.js'
import { componerCriatura, formaDe, prepararCriatura } from '../../../src/ciempi/v2/criaturas/base'
import { estadisticasTinte, tintesHechos, usarHorneadas } from '../../../src/ciempi/v2/criaturas/tinte'
import { escena } from '../../../src/ciempi/v2/pose'
// @ts-expect-error módulo JS sin tipos
import { dibujarEscena } from './dibujar.js'

declare global { interface Window { paridad: unknown } }
// `?sinHornear`: todo con el tinte en vivo (para hornear y para medirlo).
if (new URLSearchParams(location.search).has('sinHornear')) usarHorneadas({})
await load()
window.paridad = {
  inicial: { ...defaults, expresion: 'b03-alegre' },
  estadisticas: estadisticasTinte,
  tintesHechos,
  async preparar(id: string) { const t = performance.now(); await prepararCriatura(id); return performance.now() - t },
  async dibujar(id: string, sel: Record<string, string | number>, n: number) {
    await prepararCriatura(id)
    const svg = componerCriatura(sel, id)
    return dibujarEscena(escena(svg, n, 'p', formaDe(id)))
  },
}
document.body.dataset.listo = '1'
