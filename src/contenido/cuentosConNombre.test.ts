import { describe, expect, it } from 'vitest'
import { medirTexto, nivelSugerido } from '../lenguaje/dificultad'
import { dividirConParrafos } from '../lenguaje/frases'
import { silabearFrase } from '../lenguaje/silabas'
import { vistaPorNivel } from '../lenguaje/unidades'
import { CUENTOS, CUENTOS_DE_TU_CIEMPI, CUENTOS_ORIGINALES, PORTADA_CON_CIEMPI, portadaCuento } from './cuentos'
import { nombreParaCuento, palabrasDelNombre, ponerNombre, tieneMarcas } from './nombreCiempi'

/** Nombres que un niño le podría poner: corto, largo (con sílabas de más), de dos palabras y el de fábrica. */
const NOMBRES = [
  { nombre: 'Tito', genero: 'nino' as const },
  { nombre: 'Margarita', genero: 'nina' as const },
  { nombre: 'Don Pepe', genero: null },
  { nombre: 'Ciempi', genero: null },
]

/** El cuento con el nombre puesto, dividido igual que en la app (primero la plantilla, después el nombre). */
const conNombre = (texto: string, ciempi: (typeof NOMBRES)[number]) => {
  const { frases, parrafos } = dividirConParrafos(texto)
  return { frases: frases.map((f) => ponerNombre(f, ciempi)), parrafos }
}

describe('cuentos con su Ciempi de protagonista', () => {
  it('son 25, sin nivel 4, con ids nuevos y el nombre en el título y en el texto', () => {
    expect(CUENTOS_DE_TU_CIEMPI).toHaveLength(25)
    expect([0, 1, 2, 3, 4].map((n) => CUENTOS_DE_TU_CIEMPI.filter((c) => c.nivel === n).length)).toEqual([6, 6, 6, 7, 0])
    expect(new Set(CUENTOS.map((c) => c.id)).size).toBe(CUENTOS.length)
    for (const c of CUENTOS_DE_TU_CIEMPI) {
      expect(c.titulo).toContain('{ciempi}')
      expect(c.texto).toContain('{ciempi}')
      // Solo marcas conocidas.
      expect(c.texto.replace(/\{(ciempi|amigo|o)\}/g, '')).not.toMatch(/[{}]/)
    }
    // Los de siempre no cambian ni llevan marcas.
    expect(CUENTOS_ORIGINALES).toHaveLength(40)
    for (const c of CUENTOS_ORIGINALES) expect(tieneMarcas(c.titulo + c.texto)).toBe(false)
  })

  it('cada uno cumple su nivel con cualquier nombre (el nombre cuenta como una unidad)', () => {
    for (const c of CUENTOS_DE_TU_CIEMPI)
      for (const ciempi of NOMBRES) {
        const { frases, parrafos } = conNombre(c.texto, ciempi)
        expect([c.titulo, ciempi.nombre, nivelSugerido(frases, parrafos, palabrasDelNombre(ciempi))]).toEqual([c.titulo, ciempi.nombre, c.nivel])
      }
  })

  it('en el nivel 0, el nombre aparece pocas veces y lo demás son palabras de una o dos sílabas', () => {
    for (const c of CUENTOS_DE_TU_CIEMPI.filter((c) => c.nivel === 0)) {
      const veces = c.texto.split('{ciempi}').length - 1
      expect([c.titulo, veces >= 2 && veces <= 4]).toEqual([c.titulo, true])
      const { frases } = conNombre(c.texto, NOMBRES[1])
      for (const p of frases.flatMap((f) => silabearFrase(f, palabrasDelNombre(NOMBRES[1]))))
        expect([p.texto, p.silabas.length <= 2]).toEqual([p.texto, true])
    }
  })

  it('tienen la misma extensión que los cuentos de siempre de su nivel', () => {
    for (const n of [0, 1, 2, 3] as const) {
      const palabras = (texto: string) => medirTexto(dividirConParrafos(texto).frases).palabras
      const antes = CUENTOS_ORIGINALES.filter((c) => c.nivel === n).map((c) => palabras(c.texto))
      for (const c of CUENTOS_DE_TU_CIEMPI.filter((c) => c.nivel === n)) {
        const p = palabras(c.texto)
        expect([c.titulo, p >= Math.min(...antes) * 0.9 && p <= Math.max(...antes) * 1.1]).toEqual([c.titulo, true])
      }
    }
  })

  it('en su nivel, cada unidad cabe en pantalla', () => {
    for (const c of CUENTOS_DE_TU_CIEMPI) {
      const { unidades } = vistaPorNivel({ ...dividirConParrafos(c.texto), capitulos: [] }, c.nivel)
      const maximo = { 0: 8, 1: 8, 2: 12, 3: 60, 4: 160 }[c.nivel]
      for (const u of unidades) expect(u.split(/\s+/).length).toBeLessThanOrEqual(maximo)
    }
  })

  it('la portada es su Ciempi sobre un fondo de la tienda; los de siempre conservan la suya', () => {
    for (const c of CUENTOS_DE_TU_CIEMPI) expect(portadaCuento(c.id)).toMatch(new RegExp(`^${PORTADA_CON_CIEMPI}fondo-[a-z]+:.+`))
    expect(portadaCuento(CUENTOS_ORIGINALES[0].id)).toMatch(/^\/portadas\/cuento-\d\d\.svg$/)
  })
})

describe('el nombre de su Ciempi en el cuento', () => {
  it('reemplaza el nombre y el género («amigo», «amiga», la terminación)', () => {
    const texto = '{ciempi} es {amigo} de todos y está list{o}. ¡Bravo, {ciempi}!'
    expect(ponerNombre(texto, { nombre: 'Tito', genero: 'nino' })).toBe('Tito es amigo de todos y está listo. ¡Bravo, Tito!')
    expect(ponerNombre(texto, { nombre: 'Lula', genero: 'nina' })).toBe('Lula es amiga de todos y está lista. ¡Bravo, Lula!')
    // Sin género elegido, en masculino; sin nombre, «Ciempi».
    expect(ponerNombre('{ciempi} está list{o}', { nombre: '', genero: null })).toBe('Ciempi está listo')
    expect(ponerNombre('{ciempi}', null)).toBe('Ciempi')
    // Un texto sin marcas queda igual.
    expect(ponerNombre('Hola, sol.', { nombre: 'Tito' })).toBe('Hola, sol.')
  })

  it('el nombre no trae signos que cambien cómo se divide el cuento, y empieza con mayúscula', () => {
    expect(nombreParaCuento({ nombre: '  tito. el {grande}! ' })).toBe('Tito el grande')
    expect(nombreParaCuento({ nombre: '¿?' })).toBe('Ciempi')
    expect(nombreParaCuento({ nombre: 'María-José' })).toBe('María-José')
  })

  it('en el nivel 0 el nombre se lee entero: no se separa en sílabas', () => {
    const enteras = palabrasDelNombre({ nombre: 'Margarita Flor' })
    const palabras = silabearFrase('¡Hola, Margarita Flor! La casa.', enteras)
    expect(palabras.map((p) => p.silabas)).toEqual([['¡Ho', 'la,'], ['Margarita'], ['Flor!'], ['La'], ['ca', 'sa.']])
    expect(palabras.map((p) => !!p.entera)).toEqual([false, true, true, false, false])
    // Sin nombre, como siempre.
    expect(silabearFrase('Margarita').map((p) => p.silabas)).toEqual([['Mar', 'ga', 'ri', 'ta']])
  })

  it('el cuento con el nombre tiene las mismas frases (y el mismo avance) que la plantilla', () => {
    for (const c of CUENTOS_DE_TU_CIEMPI) {
      const plantilla = dividirConParrafos(c.texto)
      for (const ciempi of NOMBRES) {
        const puesto = conNombre(c.texto, ciempi)
        expect(puesto.frases).toHaveLength(plantilla.frases.length)
        expect(puesto.parrafos).toEqual(plantilla.parrafos)
        expect(puesto.frases.some((f) => f.includes(nombreParaCuento(ciempi)))).toBe(true)
        expect(puesto.frases.join(' ')).not.toMatch(/[{}]/)
      }
    }
  })
})
