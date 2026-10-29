/**
 * El Ciempi clásico (anterior a 2.0). Ya no se vende ni se elige: solo se dibuja
 * mientras carga el nuevo o si no se pudo cargar. Lo que se come en la pista
 * (la comida) sí sigue siendo del niño.
 */

export interface AparienciaClasica {
  paleta: string
  forma: string
  ojos: string
  cabeza: string
  cara: string
  pies: string
  diseno: string
  comida: string
}

export interface Paleta {
  /** Colores de los segmentos, en orden (se repiten). */
  cuerpo: string[]
  cabeza: string
}

const PALETAS: Record<string, Paleta> = {
  clasica: { cuerpo: ['#3a9fb1', '#ef9129'], cabeza: '#ef9129' },
}

export const APARIENCIA_CLASICA: AparienciaClasica = {
  paleta: 'paleta-clasica',
  forma: 'forma-circulo',
  ojos: 'ojos-normales',
  cabeza: 'cabeza-antenas',
  cara: 'cara-nada',
  pies: 'pies-clasicos',
  diseno: 'diseno-liso',
  comida: 'comida-manzana',
}

export const paletaDe = (a: AparienciaClasica): Paleta => PALETAS[a.paleta.slice(a.paleta.indexOf('-') + 1)] ?? PALETAS.clasica
