import { fraseParaLaVoz, palabraParaLaVoz, silabaParaLaVoz } from '../audio/pronunciacion.ts'
import { dividirConParrafos, dividirEnFragmentos, quitarGuiones } from '../lenguaje/frases.ts'
import { silabearFrase } from '../lenguaje/silabas.ts'
import { vistaPorNivel } from '../lenguaje/unidades.ts'
import type { Cuento } from './cuentos.ts'

/**
 * Todo lo que la voz puede llegar a decir al leer un cuento en su nivel, tal
 * como la app se lo pide al servidor (ver PantallaLectura y audio/voz.ts).
 * Con esto el servidor graba de antemano los cuentos de Ciempi
 * (`node src/cli.ts grabar-cuentos`), para que suenen al instante.
 */
export function textosParaGrabar(cuento: Cuento): { palabras: string[]; frases: string[] } {
  const { frases: lineas, parrafos } = dividirConParrafos(cuento.texto)
  const texto = { frases: lineas, parrafos, capitulos: [] }
  const palabras = new Set<string>()
  const frases = new Set<string>()
  const frase = (t: string) => {
    const f = fraseParaLaVoz(quitarGuiones(t))
    if (f) frases.add(f)
  }

  for (const linea of lineas)
    for (const p of silabearFrase(quitarGuiones(linea))) {
      // Tocar una palabra la dice, en cualquier nivel.
      palabras.add(palabraParaLaVoz(p.texto))
      if (cuento.nivel === 0) p.silabas.forEach((s, i) => palabras.add(palabraParaLaVoz(silabaParaLaVoz(s, i, p.texto, p.silabas))))
    }

  for (const unidad of vistaPorNivel(texto, cuento.nivel).unidades) {
    const limpia = quitarGuiones(unidad)
    // La oración entera (nivel 2) o la frase (niveles 0 y 1, «Escuchar primero»).
    if (cuento.nivel <= 2) frase(limpia)
    // Nivel 3: cada frase de su manzana; niveles 3 y 4: cada oración (nivel 4 y «Escuchar primero»).
    if (cuento.nivel === 3) dividirEnFragmentos(limpia).forEach(frase)
    if (cuento.nivel >= 3) dividirEnFragmentos(limpia, { porOracion: true }).forEach(frase)
  }
  palabras.delete('')
  return { palabras: [...palabras], frases: [...frases] }
}
