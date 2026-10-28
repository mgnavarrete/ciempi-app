/**
 * Cómo se le pasa el texto a la voz para que suene bien en español. La voz
 * del teléfono lee cada cosa como cree que es: «Harry» a la española
 * («a-rri»), una sílaba suelta como «tie» como palabra en inglés («tai») y
 * una que no existe en español, como «rry», la deletrea. Aquí se reescriben
 * como se dicen (solo para la voz; en pantalla se ve igual).
 */

/**
 * Nombres que se dicen distinto de como se escriben. `silabas`: cómo se dice
 * cada sílaba en el nivel 0, alineadas con las de la pantalla («Ha-rry»).
 */
const NOMBRES: Record<string, { dice: string; silabas?: string[] }> = {
  harry: { dice: 'jarri', silabas: ['ja', 'ri'] },
  hulk: { dice: 'jolk', silabas: ['jolk'] },
  thor: { dice: 'tor', silabas: ['tor'] },
  barbie: { dice: 'barbi', silabas: ['bar', 'bi'] },
  hermione: { dice: 'jermáioni' },
  hogwarts: { dice: 'jóguarts' },
  potter: { dice: 'póter' },
  hagrid: { dice: 'jágrid' },
  quidditch: { dice: 'kuídich' },
  snitch: { dice: 'esnich' },
  charlie: { dice: 'chárli' },
  avengers: { dice: 'avényers' },
  spiderman: { dice: 'espáiderman' },
  iron: { dice: 'áiron' },
  superman: { dice: 'súperman' },
  peter: { dice: 'píter' },
  parker: { dice: 'párker' },
  tony: { dice: 'tóni' },
  may: { dice: 'mei' },
  falcon: { dice: 'fálcon' },
  black: { dice: 'blak' },
  widow: { dice: 'uídou' },
}

/**
 * Sílabas sueltas que la voz confunde con palabras en inglés. Con la tilde ya
 * no son esa palabra, y una sílaba sola se dice igual con o sin tilde.
 */
const SILABAS_EN_INGLES: Record<string, string> = {
  tie: 'tié',
  pie: 'pié',
  die: 'dié',
  lie: 'lié',
  bie: 'bié',
  via: 'vía',
}

/** La palabra sin signos y en minúsculas, como se busca en `NOMBRES` («Spider-Man!» → «spiderman»). */
const clave = (palabra: string) => palabra.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

/** Sin tildes (á → a), conservando la ñ y la ü. */
export const sinTilde = (t: string) => t.normalize('NFD').replace(/́/g, '').normalize('NFC')

/** Un texto (palabra o frase) como lo debe decir la voz: los nombres extranjeros, a la española. */
export function paraLaVoz(texto: string): string {
  return texto.replace(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu, (palabra) => NOMBRES[clave(palabra)]?.dice ?? palabra)
}

/**
 * Una sílaba suelta (nivel 0) como la debe decir la voz. `palabra` y
 * `silabas`: la palabra a la que pertenece y cómo se ve separada, para los
 * nombres que se dicen distinto («Ha-rry» → «ja», «ri»).
 */
export function silabaParaLaVoz(silaba: string, indice: number, palabra: string, silabas: string[]): string {
  const nombre = NOMBRES[clave(palabra)]?.silabas
  if (nombre && nombre.length === silabas.length) return nombre[indice]
  // «piés» suelta no es una palabra y la voz la deletrea: sin tilde se dice bien.
  let s = sinTilde(silaba).toLowerCase().replace(/[^\p{L}]/gu, '')
  // Una sílaba no empieza con «rr» en español (se dice igual con una r)…
  s = s.replace(/^rr/, 'r')
  // …ni termina en «y» después de consonante: «rry» → «rri».
  s = s.replace(/([^aeiou])y$/, '$1i')
  return SILABAS_EN_INGLES[s] ?? s
}

/**
 * Una sílaba (ya pasada por `silabaParaLaVoz`) como se le pide a las voces de
 * Microsoft. Esas voces toman muchas sílabas sueltas por siglas o por
 * palabras en inglés: «dra» la deletrean («de erre a»), «je» dicen «jota e»,
 * «flor» suena «floor». Con tilde la leen como una palabra en español
 * («drá», «jé», «flór»), y una sílaba sola se dice igual con o sin tilde.
 * Pero a una vocal sola le dicen «a con acento», y con «ñ» se alarga: esas
 * van sin tilde. «ll» suena como «y» (y escrita «ll» la deletrean), y la «y»
 * sola, «i griega»: se escribe «i». Medido con las cuatro voces.
 */
/** Sílabas que esas voces ya dicen bien y con tilde suenan exageradas («¡nó!»). */
const SIN_TILDE = new Set(['no', 'be', 'nu', 'po', 'pu', 'chi', 'do', 'cho', 'chu', 'bi', 'hoy', 'hay', 'voy', 'sep', 'vein'])

export function silabaParaMicrosoft(silaba: string): string {
  const s = silaba.replace(/^ll/, 'y')
  if (s === 'y') return 'i'
  if (/^[aeiouyñ]/.test(s) || /[áéíóú]/.test(s) || SIN_TILDE.has(s)) return s
  // La vocal fuerte de la sílaba («cuen» → «cuén»); si no hay, la última («fui» → «fuí»).
  const fuerte = s.search(/[aeo]/)
  const i = fuerte >= 0 ? fuerte : Math.max(s.lastIndexOf('i'), s.lastIndexOf('u'))
  return i < 0 ? s : s.slice(0, i) + 'áéíóú'['aeiou'.indexOf(s[i])] + s.slice(i + 1)
}

/** Quita signos para que la voz no cambie la entonación ("perro," → "perro"). */
export function limpiarParaVoz(palabra: string): string {
  return palabra.replace(/[^\p{L}\p{N}]/gu, '')
}

/**
 * Una palabra o sílaba suelta tal como se le pide a la voz (y como se guarda
 * su audio en el servidor): sin signos, en minúsculas y a la española.
 */
export function palabraParaLaVoz(texto: string): string {
  return limpiarParaVoz(paraLaVoz(texto)).toLowerCase()
}

/** Una frase tal como se le pide a la voz: sin emojis (la voz los leería) y a la española. */
export function fraseParaLaVoz(texto: string): string {
  return paraLaVoz(texto)
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}
