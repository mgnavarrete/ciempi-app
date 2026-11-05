/**
 * Cuentos donde el protagonista es el Ciempi del niño, con el nombre que el
 * niño le puso («Tito aprende a nadar»).
 *
 * El texto guardado (en la app y en el servidor) es una plantilla con marcas:
 *  - `{ciempi}` → el nombre de su Ciempi (`perfil.ciempi.nombre`);
 *  - `{amigo}`  → «amigo» o «amiga», según `ciempi.genero`;
 *  - `{o}`      → la terminación «o» o «a» («list{o}» → «listo», «lista»).
 *
 * El nombre se pone recién al mostrar y al leer (en PantallaLectura, después
 * de armar las unidades del nivel con la plantilla): así las frases, sus
 * índices y el avance son los mismos para todos los niños y no cambian si el
 * niño le cambia el nombre. Las monedas de un cuento de Ciempi se recuerdan
 * por su id (server/src/premios.ts, claveDe) y se calculan con la plantilla:
 * renombrar no vuelve a pagar nada.
 */

/** Lo único que se usa de la apariencia de Ciempi. */
export interface NombreDeCiempi {
  nombre?: string | null
  genero?: 'nino' | 'nina' | null
}

export const MARCA_NOMBRE = '{ciempi}'
const NOMBRE_POR_DEFECTO = 'Ciempi'
const RE_MARCAS = /\{(ciempi|amigo|o)\}/g

/** ¿El texto (título o frase) tiene marcas que reemplazar? */
export const tieneMarcas = (texto: string) => /\{(ciempi|amigo|o)\}/.test(texto)

/**
 * El nombre tal como va en el cuento: sin signos que cambien cómo se divide
 * el texto (puntos, comas, llaves…), con mayúscula inicial y, si queda vacío,
 * «Ciempi».
 */
export function nombreParaCuento(ciempi?: NombreDeCiempi | null): string {
  const limpio = (ciempi?.nombre ?? '')
    .replace(/[^\p{L}\p{N}\s'’-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!limpio) return NOMBRE_POR_DEFECTO
  return limpio.charAt(0).toUpperCase() + limpio.slice(1)
}

/** Pone el nombre (y el género) de su Ciempi en un texto con marcas. Sin marcas, lo deja igual. */
export function ponerNombre(texto: string, ciempi?: NombreDeCiempi | null): string {
  if (!tieneMarcas(texto)) return texto
  const nombre = nombreParaCuento(ciempi)
  const nina = ciempi?.genero === 'nina'
  return texto.replace(RE_MARCAS, (_, marca: string) => (marca === 'ciempi' ? nombre : marca === 'amigo' ? (nina ? 'amiga' : 'amigo') : nina ? 'a' : 'o'))
}

/**
 * El libro con el nombre de su Ciempi en el título (para la biblioteca). Las
 * frases quedan como plantilla: PantallaLectura arma las unidades con ella y
 * pone el nombre después, para que el avance no dependa del nombre.
 */
export function conNombreDeCiempi<T extends { titulo: string }>(texto: T | null, ciempi?: NombreDeCiempi | null): T | null {
  return texto && tieneMarcas(texto.titulo) ? { ...texto, titulo: ponerNombre(texto.titulo, ciempi) } : texto
}

/**
 * Las palabras del nombre, en minúsculas y sin signos: en el nivel 0 no se
 * separan en sílabas (un nombre puede tener sílabas difíciles), se leen de
 * corrido y la voz las dice enteras. Ver lenguaje/silabas.ts, silabearFrase.
 */
export function palabrasDelNombre(ciempi?: NombreDeCiempi | null): ReadonlySet<string> {
  return new Set(
    nombreParaCuento(ciempi)
      .split(' ')
      .map(nucleoDePalabra)
      .filter(Boolean),
  )
}

/** La palabra sin signos alrededor y en minúsculas («¡Tito!» → «tito»). */
export const nucleoDePalabra = (palabra: string) => palabra.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase()
