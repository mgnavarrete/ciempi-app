/**
 * Los audios de las voces de Microsoft traen silencio antes de hablar (unos
 * 0,2 s) y después (hasta 1,4 s en una palabra sola). Al leer palabra por
 * palabra eso se nota como una demora: la voz empieza tarde y la palabra
 * siguiente espera a que termine el silencio. Aquí se busca dónde empieza y
 * dónde termina la voz, para tocar solo esa parte.
 */

/** Ventana con la que se mide el volumen (10 ms). */
const VENTANA_S = 0.01
/** Lo que se deja antes y después de la voz, para no comerse el comienzo ni la última consonante. */
const MARGEN_ANTES_S = 0.03
const MARGEN_DESPUES_S = 0.08

/** Dónde empieza y termina la voz (en segundos) dentro de un audio. */
export interface Bordes {
  inicio: number
  fin: number
}

export function bordesDeLaVoz(muestras: Float32Array, frecuencia: number): Bordes {
  const duracion = muestras.length / frecuencia
  const largo = Math.max(1, Math.round(VENTANA_S * frecuencia))
  const volumenes: number[] = []
  for (let i = 0; i < muestras.length; i += largo) {
    let suma = 0
    const hasta = Math.min(muestras.length, i + largo)
    for (let j = i; j < hasta; j++) suma += muestras[j] * muestras[j]
    volumenes.push(Math.sqrt(suma / (hasta - i)))
  }
  const maximo = Math.max(0, ...volumenes)
  // Sin voz (o casi): se toca entero.
  if (maximo < 0.005) return { inicio: 0, fin: duracion }
  const umbral = Math.max(0.003, maximo * 0.04)
  const primera = volumenes.findIndex((v) => v >= umbral)
  let ultima = volumenes.length - 1
  while (volumenes[ultima] < umbral) ultima--
  return {
    inicio: Math.max(0, primera * VENTANA_S - MARGEN_ANTES_S),
    fin: Math.min(duracion, (ultima + 1) * VENTANA_S + MARGEN_DESPUES_S),
  }
}
