import type { AparienciaCiempi } from '../ciempi/catalogo'
import type { SolicitudPremio } from '../lectura/premios'
import type {
  AjustesLectura,
  Asignacion,
  Cuenta,
  EstadoAsignacion,
  Id,
  InvitacionNino,
  NivelLectura,
  PerfilNino,
  RolCuenta,
  Sesion,
  SesionLectura,
  Texto,
} from '../dominio/tipos'

/**
 * Contratos de la capa de datos. La UI solo conoce estas interfaces.
 * Hay dos implementaciones: localStorage (sin cuenta, un solo dispositivo)
 * y la API del servidor de Ciempi (con login y sincronización). Todo es asíncrono.
 */

export interface Autenticacion {
  /** Quién tiene la sesión iniciada en este dispositivo, o null. */
  sesionActual(): Promise<Sesion | null>
  /** Registro de un adulto (los niños los crea un adulto con perfiles.crear). */
  registrarse(datos: { correo: string; clave: string; nombreVisible: string; rol: RolCuenta }): Promise<Cuenta>
  iniciarSesionAdulto(correo: string, clave: string): Promise<void>
  iniciarSesionNino(usuario: string, clave: string): Promise<void>
  cerrarSesion(): Promise<void>
  /** Manda al correo del adulto un enlace para crear una contraseña nueva. */
  enviarRecuperacion(correo: string): Promise<void>
  /** Cambia la contraseña del adulto con sesión iniciada (o recién llegado desde el enlace). */
  cambiarMiClave(clave: string): Promise<void>
  /** Avisa cuando el adulto llega desde el enlace de recuperación (hay que pedirle la clave nueva). */
  alPedirNuevaClave(fn: () => void): () => void
  /** Avisa cuando cambia quién tiene la sesión. Devuelve la función para desuscribirse. */
  alCambiar(fn: (sesion: Sesion | null) => void): () => void
}

export interface RepositorioPerfiles {
  /** Niños visibles para la sesión: los suyos (adulto) o el propio (niño). */
  listar(): Promise<PerfilNino[]>
  obtener(id: Id): Promise<PerfilNino | null>
  /** Crea al niño; en línea, con `usuario` y `clave` le crea además su acceso. */
  crear(datos: { apodo: string; icono: string; usuario?: string; clave?: string }): Promise<PerfilNino>
  /** Un admin cambia la clave del niño (solo en línea). */
  cambiarClave(perfilId: Id, clave: string): Promise<void>
  actualizarAjustes(id: Id, ajustes: AjustesLectura): Promise<PerfilNino>
  /**
   * Un adulto suma (o resta) monedas a mano, con un motivo, y devuelve el nuevo
   * saldo. Las monedas por leer no pasan por aquí: ver `premios`.
   */
  sumarMonedas(id: Id, cantidad: number, motivo?: string): Promise<number>
  /** Guarda cómo se ve su Ciempi. Solo puede ponerse cosas gratis o compradas. */
  actualizarCiempi(id: Id, apariencia: AparienciaCiempi): Promise<PerfilNino>
  /** Compra algo de la tienda de Ciempi con sus monedas (atómico). */
  /** `precioVisto`: lo que mostró la tienda; si ahora cuesta más, no se cobra. */
  comprar(id: Id, itemId: string, precioVisto?: number): Promise<{ monedas: number; inventario: string[] }>
  /** Código para que otra cuenta se vincule a este niño (solo en línea). */
  crearInvitacion(perfilId: Id): Promise<InvitacionNino>
  /** Vincula la cuenta actual al niño de la invitación (solo en línea). */
  canjearInvitacion(codigo: string): Promise<PerfilNino>
}

export interface RepositorioTextos {
  /** Textos que subió el usuario actual. */
  listar(): Promise<Texto[]>
  /** Incluye textos de otras cuentas asignados a niños vinculados. */
  obtener(id: Id): Promise<Texto | null>
  guardar(texto: Texto): Promise<Texto>
  eliminar(id: Id): Promise<void>
}

/** Lo que se guarda después de cada frase: dónde va y lo que ya leyó y ganó (no baja). */
export interface ProgresoAsignacion {
  fraseActual: number
  fraseMaxima: number
  estado: EstadoAsignacion
  leidoHasta?: number
  premioHasta?: number
  relecturaPremiadaEn?: string | null
}

export interface RepositorioAsignaciones {
  listarPorPerfil(perfilId: Id): Promise<Asignacion[]>
  /** Agrega el texto a la biblioteca del niño en ese nivel (si ya estaba, la devuelve). */
  asignar(perfilId: Id, textoId: Id, nivel?: NivelLectura): Promise<Asignacion>
  /** Solo un adulto del niño: en qué nivel lee ese libro. */
  cambiarNivel(id: Id, nivel: NivelLectura): Promise<Asignacion>
  guardarProgreso(id: Id, progreso: ProgresoAsignacion): Promise<Asignacion>
  quitar(id: Id): Promise<void>
}

export interface RepositorioSesiones {
  /** Crea o actualiza la sesión (se guarda a medida que avanza). */
  guardar(sesion: SesionLectura): Promise<SesionLectura>
  listarPorPerfil(perfilId: Id): Promise<SesionLectura[]>
}

/**
 * Un pedido de premio por leer (ver src/lectura/premios.ts): la app dice hasta
 * dónde leyó y quien guarda los datos (el servidor, o este dispositivo sin
 * conexión) calcula cuánto corresponde. `operationId` lo genera la app: el
 * mismo pedido repetido paga una sola vez.
 */
export type PedidoPremio = SolicitudPremio & {
  operationId: Id
  perfilId: Id
  asignacionId: Id
  /** Lo que la app cree que gana, para mostrarlo al instante. No decide nada. */
  esperadas: number
}

export type ResolucionPremio =
  /** `monedas`: el saldo del niño después del premio, según quien guarda los datos. */
  | { estado: 'otorgado'; otorgadas: number; monedas: number }
  /** Sin conexión (o muy rápido): queda guardado en el dispositivo y se reintenta. */
  | { estado: 'pendiente' }
  /** No se puede pagar (por ejemplo, quitaron el libro): no se reintenta. */
  | { estado: 'descartado'; motivo: string }

export interface RepositorioPremios {
  /** Pide el premio. Se guarda en el dispositivo hasta tener respuesta: sin conexión no se pierde. */
  reclamar(pedido: PedidoPremio): Promise<ResolucionPremio>
  /** Vuelve a enviar lo pendiente (al abrir la app, al volver la conexión, antes de comprar). */
  reintentar(): Promise<void>
  /** Monedas esperadas de lo que el servidor todavía no confirma. */
  pendientes(perfilId: Id): number
  /** Avisa cada vez que un pedido se resuelve, también los que estaban en la cola. Devuelve cómo dejar de escuchar. */
  alResolver(fn: (pedido: PedidoPremio, resolucion: Exclude<ResolucionPremio, { estado: 'pendiente' }>) => void): () => void
}

export interface Repositorios {
  /** true con el servidor: hay login, invitaciones y sincronización entre dispositivos. */
  enLinea: boolean
  auth: Autenticacion
  perfiles: RepositorioPerfiles
  textos: RepositorioTextos
  asignaciones: RepositorioAsignaciones
  sesiones: RepositorioSesiones
  premios: RepositorioPremios
}
