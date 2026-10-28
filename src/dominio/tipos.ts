import type { AparienciaCiempi } from '../ciempi/catalogo.ts'

/**
 * Modelo de datos de Ciempi.
 *
 * Se guarda igual en localStorage y en el PostgreSQL del servidor: ids uuid,
 * fechas ISO y todo cuelga de una `cuentaId` (el adulto dueño). Ver server/sql.
 * En TypeScript se usa camelCase; el servidor traduce a snake_case.
 */

export type Id = string
/** Fecha y hora en formato ISO 8601 (timestamptz en Postgres). */
export type FechaISO = string

// ── Adultos ────────────────────────────────────────────────────────────────

export type RolCuenta = 'terapeuta' | 'apoderado'

/** Adulto con correo y contraseña. */
export interface Cuenta {
  id: Id
  /** null en la cuenta local de la fase 1 (sin login). */
  correo: string | null
  rol: RolCuenta
  nombreVisible: string
  creadaEn: FechaISO
}

/**
 * Quién usa la app en este dispositivo:
 * - nino: el lector, que ve su biblioteca (su app);
 * - adulto: un admin, que ve a sus niños y su avance.
 */
export type Sesion =
  | { tipo: 'nino'; usuarioId: Id; perfilId: Id }
  | { tipo: 'adulto'; usuarioId: Id; cuenta: Cuenta }

// ── Niños ──────────────────────────────────────────────────────────────────

export interface AjustesLectura {
  /** Tamaño de la letra de la frase, en px. */
  tamanoLetra: number
  /** Sin sonidos de efectos ni animaciones intensas. La voz se mantiene. */
  modoTranquilo: boolean
  /** Velocidad de la voz (SpeechSynthesisUtterance.rate). 1 = normal. */
  velocidadVoz: number
  /** Palabras por segundo sobre las cuales se considera "demasiado rápido". */
  umbralPalabrasPorSegundo: number
  /**
   * Cómo acompaña la voz, elegido por el niño: coro (dice cada palabra al
   * pasar), eco (lee la unidad antes) o solo (sin voz). Sin elegir: según el
   * nivel del libro (ver MODO_POR_NIVEL en lectura/modos.ts).
   */
  modoVoz?: ModoLectura
}

/** Máximo del umbral de ritmo (palabras/s); es también el valor por defecto. */
const LIMITE_MAXIMO_RITMO = 4

export const AJUSTES_POR_DEFECTO: AjustesLectura = {
  tamanoLetra: 44,
  modoTranquilo: false,
  velocidadVoz: 1,
  // El máximo: «Más despacito» solo con un zarpazo.
  umbralPalabrasPorSegundo: LIMITE_MAXIMO_RITMO,
}

export const LIMITES_AJUSTES = {
  tamanoLetra: { min: 28, max: 72, paso: 2 },
  velocidadVoz: { min: 0.5, max: 1.5, paso: 0.05 },
  umbralPalabrasPorSegundo: { min: 0.5, max: LIMITE_MAXIMO_RITMO, paso: 0.25 },
} as const

/**
 * Completa y actualiza ajustes guardados con versiones anteriores. Antes el
 * umbral era en sílabas por segundo; una palabra tiene ~2 sílabas.
 */
export function normalizarAjustes(guardados: Partial<AjustesLectura> & { umbralSilabasPorSegundo?: number; conVoz?: boolean }): AjustesLectura {
  const { umbralSilabasPorSegundo, conVoz, ...resto } = guardados
  const ajustes: AjustesLectura = { ...AJUSTES_POR_DEFECTO, ...resto }
  // Antes había solo «leer con voz» sí/no: no equivale a leer sin voz.
  if (conVoz === false && !ajustes.modoVoz) ajustes.modoVoz = 'solo'
  if (guardados.umbralPalabrasPorSegundo === undefined && umbralSilabasPorSegundo !== undefined) {
    const { min, max, paso } = LIMITES_AJUSTES.umbralPalabrasPorSegundo
    ajustes.umbralPalabrasPorSegundo = Math.min(max, Math.max(min, Math.round(umbralSilabasPorSegundo / 2 / paso) * paso))
  }
  return ajustes
}

/**
 * Un niño lector. Tiene su propio acceso (usuario + clave, sin correo), que
 * crea un adulto admin. Puede tener varios admins (terapeuta y apoderado)
 * mediante MiembroNino. Datos mínimos a propósito (son menores de edad):
 * apodo, ícono y usuario. Sin nombre completo, fecha de nacimiento, correo
 * ni diagnóstico.
 */
export interface PerfilNino {
  id: Id
  /** Cuenta adulta que creó el perfil. */
  creadoPor: Id
  /** Usuario con el que el niño entra a la app (null si no tiene cuenta propia). */
  usuario: string | null
  tieneCuenta: boolean
  apodo: string
  /** Emoji o identificador del ícono con el que el niño reconoce su perfil. */
  icono: string
  /** Hash del PIN opcional. Es solo para elegir perfil, no es seguridad. */
  pinHash: string | null
  ajustes: AjustesLectura
  monedas: number
  /** Cómo se ve su Ciempi (nombre, colores, gorro, zapatos, fondo…). */
  ciempi: AparienciaCiempi
  /** Ids de lo que compró en la tienda de Ciempi (lo gratis no se guarda). */
  inventario: string[]
  creadoEn: FechaISO
}

/** Vínculo entre un niño y una cuenta adulta. */
export interface MiembroNino {
  perfilId: Id
  cuentaId: Id
  rol: RolCuenta
  creadoEn: FechaISO
}

/** Código para que otra cuenta (p. ej. el apoderado) se vincule a un niño. */
export interface InvitacionNino {
  codigo: string
  perfilId: Id
  creadaPor: Id
  expiraEn: FechaISO
}

// ── Textos y asignaciones ──────────────────────────────────────────────────

/** ciempi: los cuentos que trae la app (ver contenido/cuentos.ts), de nadie en particular. */
export type OrigenTexto = 'pegado' | 'pdf' | 'ejemplo' | 'ciempi'

export interface Capitulo {
  titulo: string
  /** Índice de la primera frase del capítulo dentro de Texto.frases. */
  desdeFrase: number
}

/** Un texto corto o un libro completo. Los cortos tienen un solo capítulo. */
export interface Texto {
  id: Id
  /**
   * Usuario que lo subió (un adulto o el propio niño). Solo él puede editarlo o
   * borrarlo. null en los cuentos de Ciempi, que nadie puede borrar.
   */
  subidoPor: Id | null
  titulo: string
  autor: string | null
  /** Texto limpio de origen (para volver a dividirlo si cambian las reglas). */
  textoOriginal: string
  /** Frases ya revisadas por el adulto, en orden de lectura. */
  frases: string[]
  capitulos: Capitulo[]
  /**
   * Frases donde empieza un párrafo o una estrofa (para el nivel 3). Los libros
   * subidos antes no lo tienen: ahí los párrafos se arman por largo.
   */
  parrafos?: number[]
  /** Miniatura de la portada (data URL JPEG) o null. */
  portada: string | null
  origen: OrigenTexto
  creadoEn: FechaISO
  actualizadoEn: FechaISO
}

/**
 * - coro: el niño desliza y la app lee junto con él (fase 1).
 * - eco:  la app lee la frase y luego el niño la repite deslizando.
 * - solo: solo iluminación, sin voz.
 */
export type ModoLectura = 'coro' | 'eco' | 'solo'

export type EstadoAsignacion = 'pendiente' | 'en_curso' | 'completada' | 'archivada'

/** Un texto en la biblioteca de un niño, con su progreso. */
/**
 * Nivel de lectura de un libro para un niño: 0 sílabas, 1 palabra, 2 oración,
 * 3 párrafo, 4 libre. Ver lenguaje/unidades.ts.
 */
export type NivelLectura = 0 | 1 | 2 | 3 | 4

export interface Asignacion {
  id: Id
  /** Usuario que lo agregó a la biblioteca (un adulto o el propio niño). */
  asignadaPor: Id
  perfilId: Id
  textoId: Id
  modo: ModoLectura
  /** Lo elige un adulto; el mismo libro puede estar en otro nivel para otro niño. */
  nivel: NivelLectura
  estado: EstadoAsignacion
  /** Índice de la próxima frase a leer, para retomar. */
  fraseActual: number
  /**
   * Hasta dónde ha llegado alguna vez. Si vuelve atrás o repite un capítulo,
   * fraseActual retrocede pero esto no: las monedas solo se ganan con frases nuevas.
   */
  fraseMaxima: number
  asignadaEn: FechaISO
  actualizadaEn: FechaISO
  completadaEn: FechaISO | null
}

// ── Sesiones ───────────────────────────────────────────────────────────────

export interface SesionLectura {
  id: Id
  /** Usuario con sesión iniciada al leer (normalmente el propio niño). */
  usuarioId: Id
  perfilId: Id
  textoId: Id | null
  asignacionId: Id | null
  modo: ModoLectura
  /** Nivel en que se leyó (las sesiones antiguas no lo tienen: nivel 1). */
  nivel?: NivelLectura
  iniciadaEn: FechaISO
  duracionSegundos: number
  frasesCompletadas: number
  /** Frases terminadas en las que hubo al menos un "más despacito". */
  frasesMuyRapido: number
  /** Sílabas leídas a buen ritmo (para calcular velocidad). */
  silabasLeidas: number
  monedasGanadas: number
}
