import { leerModeloEconomia, type ModeloEconomia } from '../lectura/monedas'

/**
 * Qué economía usa la app cuando calcula ella misma (modo sin cuenta) o antes
 * de saber qué dice el servidor: la bandera de compilación `VITE_ECONOMIA`
 * ('e2' activa el modelo experimental). Sin bandera, o con un valor que no se
 * entiende, rige la economía 2.4.1: la app nunca paga con reglas que nadie eligió.
 * Con cuenta manda el servidor (su bandera ECONOMIA): cada premio dice cuál usa.
 */
export function modeloDeCompilacion(valor: unknown = import.meta.env?.VITE_ECONOMIA): ModeloEconomia {
  try {
    return leerModeloEconomia(typeof valor === 'string' ? valor : undefined)
  } catch {
    return 'actual'
  }
}
