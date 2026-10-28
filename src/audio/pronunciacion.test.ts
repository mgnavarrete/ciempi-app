import { describe, expect, it } from 'vitest'
import { CUENTOS } from '../contenido/cuentos'
import { dividirConParrafos } from '../lenguaje/frases'
import { silabearFrase } from '../lenguaje/silabas'
import { paraLaVoz, silabaParaLaVoz } from './pronunciacion'

const silabaDe = (palabra: string, i: number) => {
  const p = silabearFrase(palabra)[0]
  return silabaParaLaVoz(p.silabas[i], i, p.texto, p.silabas)
}

describe('pronunciación para la voz', () => {
  it('los nombres extranjeros, a la española', () => {
    expect(paraLaVoz('¡Hola, Harry!')).toBe('¡Hola, jarri!')
    expect(paraLaVoz('Spider-Man lanza su telaraña.')).toBe('espáiderman lanza su telaraña.')
    expect(paraLaVoz('Hermione cerró los ojos.')).toBe('jermáioni cerró los ojos.')
    expect(paraLaVoz('La casa de Juan')).toBe('La casa de Juan')
  })

  it('las sílabas de los nombres: «Ha-rry» se dice «ja-ri» (una r al comienzo ya suena fuerte)', () => {
    expect([silabaDe('Harry', 0), silabaDe('Harry', 1)]).toEqual(['ja', 'ri'])
    expect([silabaDe('Barbie', 0), silabaDe('Barbie', 1)]).toEqual(['bar', 'bi'])
    expect(silabaDe('Thor', 0)).toBe('tor')
  })

  it('las sílabas que la voz leería en inglés o deletrearía', () => {
    expect(silabaDe('tiene', 0)).toBe('tié')
    expect(silabaDe('tiene', 1)).toBe('ne')
    expect(silabaDe('Ciempiés', 1)).toBe('pies')
    expect(silabaParaLaVoz('rry', 1, 'Larry', ['La', 'rry'])).toBe('ri')
  })

  it('en los cuentos del nivel 0 ninguna sílaba queda con letras que la voz deletrearía', () => {
    for (const c of CUENTOS.filter((c) => c.nivel === 0))
      for (const f of dividirConParrafos(c.texto).frases)
        for (const p of silabearFrase(f))
          p.silabas.forEach((s, i) => {
            const dicha = silabaParaLaVoz(s, i, p.texto, p.silabas)
            expect([p.texto, dicha]).not.toEqual([p.texto, expect.stringMatching(/^rr|[^aeiou]y$|^h[^aeiou]|th/)])
          })
  })
})
