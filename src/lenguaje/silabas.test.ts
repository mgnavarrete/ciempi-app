import { describe, expect, it } from 'vitest'
import { separarSilabas, silabearFrase } from './silabas'

const casos: Record<string, string> = {
  // Las del enunciado
  Papelucho: 'Pa-pe-lu-cho',
  país: 'pa-ís',
  ahora: 'a-ho-ra',
  cigüeña: 'ci-güe-ña',
  construcción: 'cons-truc-ción',
  carro: 'ca-rro',
  llave: 'lla-ve',
  muy: 'muy',

  // Diptongos y triptongos
  cuaderno: 'cua-der-no',
  ciudad: 'ciu-dad',
  huevo: 'hue-vo',
  Uruguay: 'U-ru-guay',
  buey: 'buey',
  aire: 'ai-re',
  construí: 'cons-truí',

  // Hiatos
  leer: 'le-er',
  poeta: 'po-e-ta',
  día: 'dí-a',
  reír: 're-ír',
  baúl: 'ba-úl',
  maíz: 'ma-íz',
  río: 'rí-o',

  // H intermedia
  búho: 'bú-ho',
  deshacer: 'des-ha-cer',
  almohada: 'al-mo-ha-da',
  anhelo: 'an-he-lo',

  // Dígrafos y u muda
  chocolate: 'cho-co-la-te',
  perro: 'pe-rro',
  queso: 'que-so',
  guitarra: 'gui-ta-rra',
  pingüino: 'pin-güi-no',
  calle: 'ca-lle',

  // Grupos consonánticos
  hablar: 'ha-blar',
  sombrero: 'som-bre-ro',
  problema: 'pro-ble-ma',
  instante: 'ins-tan-te',
  obstáculo: 'obs-tá-cu-lo',
  abrazo: 'a-bra-zo',
  atlas: 'at-las',
  inglés: 'in-glés',
  transporte: 'trans-por-te',

  // La y como consonante y como vocal
  ayer: 'a-yer',
  reyes: 're-yes',
  hoy: 'hoy',
  y: 'y',

  // Varios
  mariposa: 'ma-ri-po-sa',
  ciempiés: 'ciem-piés',
  Ciempi: 'Ciem-pi',
  sol: 'sol',
  a: 'a',
  examen: 'e-xa-men',
}

describe('separarSilabas', () => {
  for (const [palabra, esperado] of Object.entries(casos)) {
    it(`${palabra} → ${esperado}`, () => {
      expect(separarSilabas(palabra).join('-')).toBe(esperado)
    })
  }

  it('deja los signos pegados en la primera y última sílaba', () => {
    expect(separarSilabas('¡Hola!')).toEqual(['¡Ho', 'la!'])
    expect(separarSilabas('casa,')).toEqual(['ca', 'sa,'])
    expect(separarSilabas('«Ciempi»')).toEqual(['«Ciem', 'pi»'])
  })

  it('no rompe números ni palabras con guion', () => {
    expect(separarSilabas('2025')).toEqual(['2025'])
    expect(separarSilabas('franco-chileno')).toEqual(['franco-chileno'])
  })
})

describe('silabearFrase', () => {
  it('separa las palabras y sus sílabas', () => {
    expect(silabearFrase('  Mi  perro come. ')).toEqual([
      { texto: 'Mi', silabas: ['Mi'] },
      { texto: 'perro', silabas: ['pe', 'rro'] },
      { texto: 'come.', silabas: ['co', 'me.'] },
    ])
  })
})
