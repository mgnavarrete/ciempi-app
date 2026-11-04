import { comprarItem, normalizarApariencia, puedePonerse } from '../../ciempi/catalogo'
import { CUNCUNA, CUNCUNA_POR_LECTURA, motivoCuncuna } from '../desbloqueoCuncuna'
import { PRECIOS_MOCHILAS_2_1, PRECIOS_TIENDA_ANTIGUA, esCompraAntigua } from '../../ciempi/tiendaAntigua'
import { AUTOR_CUENTOS, CUENTOS, CUENTOS_DE_PERSONAJES, portadaCuento } from '../../contenido/cuentos'
import { dividirConParrafos } from '../../lenguaje/frases'
import { hoy } from '../../lectura/monedas'
import { calcularPremio, combinarEstados, type EstadoPremios } from '../../lectura/premios'
import { reglasDe } from '../../lectura/monedas'
import { modeloDeCompilacion } from '../economia'
import { nuevoId } from '../../dominio/ids'
import {
  AJUSTES_POR_DEFECTO,
  normalizarAjustes,
  type Asignacion,
  type Cuenta,
  type Id,
  type NivelLectura,
  type PerfilNino,
  type SesionLectura,
  type Texto,
} from '../../dominio/tipos'
import type {
  Autenticacion,
  Desbloqueo,
  PedidoPremio,
  RepositorioAsignaciones,
  RepositorioPerfiles,
  RepositorioPremios,
  RepositorioSesiones,
  RepositorioTextos,
  Repositorios,
  ResolucionPremio,
} from '../repositorios'

/**
 * Implementación sin conexión: una cuenta local implícita, todo en
 * localStorage de este dispositivo. Útil para probar y para usar en un solo
 * equipo; con el servidor se agregan login y sincronización.
 */

/** Versión del formato guardado. Si cambia, se puede migrar o descartar. */
const PREFIJO = 'ciempi:v1:'

type AlmacenClaveValor = Pick<Storage, 'getItem' | 'setItem'>

const ahora = () => new Date().toISOString()

/** Una "tabla" guardada como arreglo JSON en una sola clave. */
class Tabla<T extends { id: Id }> {
  constructor(
    private almacen: AlmacenClaveValor,
    private nombre: string,
  ) {}

  todos(): T[] {
    try {
      return JSON.parse(this.almacen.getItem(PREFIJO + this.nombre) ?? '[]') as T[]
    } catch {
      return []
    }
  }

  obtener(id: Id): T | null {
    return this.todos().find((f) => f.id === id) ?? null
  }

  guardar(fila: T): T {
    const filas = this.todos()
    const i = filas.findIndex((f) => f.id === fila.id)
    if (i >= 0) filas[i] = fila
    else filas.push(fila)
    this.reemplazar(filas)
    return fila
  }

  eliminar(id: Id) {
    this.reemplazar(this.todos().filter((f) => f.id !== id))
  }

  reemplazar(filas: T[]) {
    this.almacen.setItem(PREFIJO + this.nombre, JSON.stringify(filas))
  }
}

/** Lo ya pagado de cada libro (id = el de la asignación), como en el servidor. */
type PremiosDeLibro = EstadoPremios & { id: Id }
/** Pedidos de premio ya atendidos (id = operationId): repetir uno no paga otra vez. */
type PremioAtendido = { id: Id; otorgadas: number }
/** Lo desbloqueado (id = «perfil|item»), como la tabla `desbloqueos` del servidor. */
type DesbloqueoLocal = Desbloqueo & { id: Id; perfilId: Id }

interface Tablas {
  cuentas: Tabla<Cuenta>
  perfiles: Tabla<PerfilNino>
  textos: Tabla<Texto>
  asignaciones: Tabla<Asignacion>
  sesiones: Tabla<SesionLectura>
  premios: Tabla<PremiosDeLibro>
  premiosAtendidos: Tabla<PremioAtendido>
  desbloqueos: Tabla<DesbloqueoLocal>
}

/**
 * Cambios de datos guardados que se aplican una sola vez por navegador.
 * (En el servidor son las migraciones de server/sql.)
 */
const MIGRACIONES: { id: string; aplicar: (t: Tablas) => void }[] = [
  {
    // La voz por defecto pasó de 0.85 a 1: quien no la había tocado, toma la nueva.
    id: '2026-10-voz-1',
    aplicar: ({ perfiles }) =>
      perfiles
        .todos()
        .filter((p) => p.ajustes.velocidadVoz === 0.85)
        .forEach((p) => perfiles.guardar({ ...p, ajustes: { ...p.ajustes, velocidadVoz: AJUSTES_POR_DEFECTO.velocidadVoz } })),
  },
  {
    // Libros: capítulos, autor y portada; perfiles con creadoPor; y cada
    // texto existente queda en la biblioteca de cada niño.
    id: '2026-10-libros',
    aplicar: ({ perfiles, textos, asignaciones }) => {
      const perfilesV1 = perfiles.todos() as (PerfilNino & { cuentaId?: Id })[]
      perfiles.reemplazar(perfilesV1.map(({ cuentaId, ...p }) => ({ ...p, creadoPor: p.creadoPor ?? cuentaId ?? '' })))

      const textosV1 = textos.todos() as Partial<Texto>[] as Texto[]
      textos.reemplazar(
        textosV1.map((t) => ({
          ...t,
          autor: t.autor ?? null,
          portada: t.portada ?? null,
          capitulos: t.capitulos ?? [{ titulo: t.titulo, desdeFrase: 0 }],
        })),
      )

      for (const p of perfiles.todos()) {
        for (const t of textos.todos() as (Texto & { cuentaId?: Id })[]) {
          asignaciones.guardar(nuevaAsignacion(p.id, t.id, t.subidoPor ?? t.cuentaId ?? ''))
        }
      }
    },
  },
  {
    // El umbral de ritmo pasa de sílabas/s a palabras/s.
    id: '2026-10-umbral-palabras',
    aplicar: ({ perfiles }) => perfiles.reemplazar(perfiles.todos().map((p) => ({ ...p, ajustes: normalizarAjustes(p.ajustes) }))),
  },
  {
    // "Máximo leído" por libro, para poder volver atrás sin volver a ganar monedas.
    id: '2026-10-frase-maxima',
    aplicar: ({ asignaciones, textos }) =>
      asignaciones.reemplazar(
        asignaciones.todos().map((a) => ({
          ...a,
          fraseMaxima: a.fraseMaxima ?? (a.estado === 'completada' ? (textos.obtener(a.textoId)?.frases.length ?? a.fraseActual) : a.fraseActual),
        })),
      ),
  },
  {
    // Cuentas de niño: el texto pasa a tener "subidoPor" y la sesión "usuarioId".
    id: '2026-10-cuentas-nino',
    aplicar: ({ perfiles, textos, sesiones }) => {
      perfiles.reemplazar(perfiles.todos().map((p) => ({ ...p, usuario: p.usuario ?? null, tieneCuenta: p.tieneCuenta ?? false })))
      const textosV2 = textos.todos() as (Texto & { cuentaId?: Id })[]
      textos.reemplazar(textosV2.map(({ cuentaId, ...t }) => ({ ...t, subidoPor: t.subidoPor ?? cuentaId ?? '' })))
      const sesionesV2 = sesiones.todos() as (SesionLectura & { cuentaId?: Id })[]
      sesiones.reemplazar(sesionesV2.map(({ cuentaId, ...x }) => ({ ...x, usuarioId: x.usuarioId ?? cuentaId ?? '' })))
    },
  },
  {
    // El umbral de ritmo por defecto pasó de 1,5 a 2,5 palabras/s: quien no lo había tocado, toma el nuevo.
    id: '2026-10-umbral-2-5',
    aplicar: ({ perfiles }) =>
      perfiles
        .todos()
        .filter((p) => p.ajustes.umbralPalabrasPorSegundo === 1.5)
        .forEach((p) => perfiles.guardar({ ...p, ajustes: { ...p.ajustes, umbralPalabrasPorSegundo: AJUSTES_POR_DEFECTO.umbralPalabrasPorSegundo } })),
  },
  {
    // El umbral de ritmo por defecto pasó de 2,5 al máximo (4 palabras/s): quien no lo había tocado, toma el nuevo.
    id: '2026-10-umbral-maximo',
    aplicar: ({ perfiles }) =>
      perfiles
        .todos()
        .filter((p) => p.ajustes.umbralPalabrasPorSegundo === 2.5)
        .forEach((p) => perfiles.guardar({ ...p, ajustes: { ...p.ajustes, umbralPalabrasPorSegundo: AJUSTES_POR_DEFECTO.umbralPalabrasPorSegundo } })),
  },
  {
    // Los cuentos de Ciempi llegan a la biblioteca de los niños que ya existían.
    id: '2026-10-cuentos-de-ciempi',
    aplicar: (tablas) => tablas.perfiles.todos().forEach((p) => darCuentos(tablas, p.id, p.creadoPor)),
  },
  {
    // Llegan los cuentos del nivel 0 (sílabas); los que un adulto quitó no vuelven.
    id: '2026-10-cuentos-nivel-0',
    aplicar: (tablas) =>
      tablas.perfiles.todos().forEach((p) =>
        darCuentos(
          tablas,
          p.id,
          p.creadoPor,
          CUENTOS.filter((c) => c.nivel === 0),
        ),
      ),
  },
  {
    // Los cuentos con portada y «Don Ciempiés» en vez de «Ciempi».
    id: '2026-10-cuentos-con-portada',
    aplicar: actualizarCuentos,
  },
  {
    // Llegan los cuentos con personajes conocidos (superhéroes, Harry Potter, Barbie).
    id: '2026-10-cuentos-de-personajes',
    aplicar: (tablas) => tablas.perfiles.todos().forEach((p) => darCuentos(tablas, p.id, p.creadoPor, CUENTOS_DE_PERSONAJES)),
  },
  {
    // CIEMPI 2.1: la tienda vende solo los diseños nuevos. Lo comprado en la
    // anterior (menos fondos y comida) se devuelve en monedas y sale del inventario.
    id: '2026-10-tienda-nueva',
    aplicar: ({ perfiles }) =>
      perfiles.todos().forEach((p) => {
        const inventario = p.inventario ?? []
        const devolver = inventario.filter(esCompraAntigua).reduce((s, id) => s + (PRECIOS_TIENDA_ANTIGUA[id] ?? 0), 0)
        perfiles.guardar({ ...p, monedas: p.monedas + devolver, inventario: inventario.filter((id) => !esCompraAntigua(id)), ciempi: normalizarApariencia(p.ciempi) })
      }),
  },
  {
    // CIEMPI 2.2: las mochilas salen de la tienda (se veían pegadas encima del cuerpo): se devuelven.
    id: '2026-10-sin-mochilas',
    aplicar: ({ perfiles }) =>
      perfiles.todos().forEach((p) => {
        const inventario = p.inventario ?? []
        const devolver = inventario.reduce((s, id) => s + (PRECIOS_MOCHILAS_2_1[id] ?? 0), 0)
        if (devolver) {
          // La mochila devuelta deja de estar puesta (desde 2.5.2 las mochilas vuelven a existir en la tienda).
          const ciempi = normalizarApariencia(p.ciempi)
          perfiles.guardar({ ...p, monedas: p.monedas + devolver, inventario: inventario.filter((id) => !(id in PRECIOS_MOCHILAS_2_1)), ciempi: ciempi.espalda in PRECIOS_MOCHILAS_2_1 ? { ...ciempi, espalda: 'espalda:espalda-nada' } : ciempi })
        }
      }),
  },
]

function migrar(almacen: AlmacenClaveValor, tablas: Tablas) {
  const clave = PREFIJO + 'migraciones'
  const aplicadas = new Set<string>(JSON.parse(almacen.getItem(clave) ?? '[]'))
  for (const m of MIGRACIONES) {
    if (aplicadas.has(m.id)) continue
    m.aplicar(tablas)
    aplicadas.add(m.id)
  }
  almacen.setItem(clave, JSON.stringify([...aplicadas]))
}

/**
 * Deja en la biblioteca del niño los cuentos de Ciempi, cada uno en su nivel
 * (y los textos guardados, al día). Igual que el servidor: ver server/src/cuentos.ts.
 */
function darCuentos(tablas: Tablas, perfilId: Id, asignadaPor: Id, cuentos = CUENTOS) {
  actualizarCuentos(tablas)
  for (const c of cuentos) {
    if (!tablas.asignaciones.todos().some((a) => a.perfilId === perfilId && a.textoId === c.id)) {
      tablas.asignaciones.guardar(nuevaAsignacion(perfilId, c.id, asignadaPor, c.nivel))
    }
  }
}

/** Los textos de los cuentos de Ciempi, al día (si se corrigió uno, o cambió su portada). */
function actualizarCuentos({ textos }: Tablas) {
  for (const c of CUENTOS) {
    const guardado = textos.obtener(c.id)
    if (guardado?.textoOriginal === c.texto && guardado.titulo === c.titulo && guardado.portada === portadaCuento(c.id)) continue
    const fecha = ahora()
    textos.guardar({
      id: c.id,
      subidoPor: null,
      titulo: c.titulo,
      autor: AUTOR_CUENTOS,
      textoOriginal: c.texto,
      ...dividirConParrafos(c.texto),
      capitulos: [{ titulo: c.titulo, desdeFrase: 0 }],
      portada: portadaCuento(c.id),
      origen: 'ciempi',
      creadoEn: guardado?.creadoEn ?? fecha,
      actualizadoEn: fecha,
    })
  }
}

function nuevaAsignacion(perfilId: Id, textoId: Id, asignadaPor: Id, nivel: NivelLectura = 1): Asignacion {
  const fecha = ahora()
  return {
    id: nuevoId(),
    asignadaPor,
    perfilId,
    textoId,
    modo: 'coro',
    nivel,
    estado: 'pendiente',
    fraseActual: 0,
    fraseMaxima: 0,
    asignadaEn: fecha,
    actualizadaEn: fecha,
    completadaEn: null,
  }
}

const SIN_CONEXION = 'Esta función necesita una cuenta en línea.'

/** Completa perfiles guardados antes de que existiera la tienda de Ciempi. */
const completarPerfil = (p: PerfilNino): PerfilNino => ({ ...p, ciempi: normalizarApariencia(p.ciempi, p.inventario ?? []), inventario: p.inventario ?? [] })

export function crearRepositoriosLocales(almacen: AlmacenClaveValor = window.localStorage): Repositorios {
  const tablas: Tablas = {
    cuentas: new Tabla<Cuenta>(almacen, 'cuentas'),
    perfiles: new Tabla<PerfilNino>(almacen, 'perfiles'),
    textos: new Tabla<Texto>(almacen, 'textos'),
    asignaciones: new Tabla<Asignacion>(almacen, 'asignaciones'),
    sesiones: new Tabla<SesionLectura>(almacen, 'sesiones'),
    premios: new Tabla<PremiosDeLibro>(almacen, 'premios'),
    premiosAtendidos: new Tabla<PremioAtendido>(almacen, 'premios-atendidos'),
    desbloqueos: new Tabla<DesbloqueoLocal>(almacen, 'desbloqueos'),
  }
  migrar(almacen, tablas)
  const { cuentas, perfiles, textos, asignaciones, sesiones } = tablas

  /**
   * Lo ya pagado de un libro. Antes de 2.5 no había tabla de premios: lo leído
   * y lo premiado de la asignación ya estaban pagados (se toman la primera vez).
   */
  const premiosDe = (a: Asignacion): PremiosDeLibro =>
    tablas.premios.obtener(a.id) ?? {
      id: a.id,
      ...combinarEstados({ pagadoHasta: a.leidoHasta ?? 0, hitosHasta: a.premioHasta ?? 0, relecturaDia: a.relecturaPremiadaEn ?? null }),
    }

  /**
   * ¿Ya se ganó la Cuncuna? (ver src/datos/desbloqueoCuncuna.ts). Si recién
   * cumple, queda anotada «por celebrar» y entra al inventario. Idempotente.
   */
  const revisarCuncuna = (perfilId: Id) => {
    // 2.5.2: la Cuncuna se compra con monedas (igual que el servidor); lo ya ganado se conserva.
    if (!CUNCUNA_POR_LECTURA) return
    const perfil = perfiles.obtener(perfilId)
    if (!perfil || tablas.desbloqueos.obtener(`${perfilId}|${CUNCUNA}`)) return
    const cuentos = asignaciones
      .todos()
      .filter((a) => a.perfilId === perfilId)
      .map((a) => ({ textoId: a.textoId, total: textos.obtener(a.textoId)?.frases.length ?? 0, pagado: tablas.premios.obtener(a.id)?.pagadoHasta ?? 0 }))
    const motivo = motivoCuncuna(cuentos)
    if (!motivo) return
    tablas.desbloqueos.guardar({ id: `${perfilId}|${CUNCUNA}`, perfilId, item: CUNCUNA, motivo, estado: 'por_celebrar', otorgadoEn: ahora(), celebradoEn: null })
    const inventario = perfil.inventario ?? []
    if (!inventario.includes(CUNCUNA)) perfiles.guardar({ ...perfil, inventario: [...inventario, CUNCUNA] })
  }

  /** Sin login: una única cuenta local que se crea sola. */
  const cuentaLocal = (): Cuenta =>
    cuentas.todos()[0] ??
    cuentas.guardar({ id: nuevoId(), correo: null, rol: 'apoderado', nombreVisible: 'Este dispositivo', creadaEn: ahora() })

  const auth: Autenticacion = {
    async sesionActual() {
      const cuenta = cuentaLocal()
      return { tipo: 'adulto', usuarioId: cuenta.id, cuenta }
    },
    async registrarse() {
      throw new Error(SIN_CONEXION)
    },
    async iniciarSesionAdulto() {
      throw new Error(SIN_CONEXION)
    },
    async iniciarSesionNino() {
      throw new Error(SIN_CONEXION)
    },
    async cerrarSesion() {},
    async enviarRecuperacion() {
      throw new Error(SIN_CONEXION)
    },
    async cambiarMiClave() {
      throw new Error(SIN_CONEXION)
    },
    alPedirNuevaClave() {
      return () => {}
    },
    alCambiar() {
      return () => {}
    },
  }

  const repoPerfiles: RepositorioPerfiles = {
    async listar() {
      return perfiles
        .todos()
        .map(completarPerfil)
        .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))
    },
    async obtener(id) {
      const p = perfiles.obtener(id)
      return p ? completarPerfil(p) : null
    },
    async crear({ apodo, icono }) {
      const perfil = perfiles.guardar({
        id: nuevoId(),
        creadoPor: cuentaLocal().id,
        apodo,
        icono,
        usuario: null,
        tieneCuenta: false,
        pinHash: null,
        ajustes: { ...AJUSTES_POR_DEFECTO },
        monedas: 0,
        ciempi: normalizarApariencia(null),
        inventario: [],
        creadoEn: ahora(),
      })
      // Todo lector nuevo parte con los cuentos de Ciempi.
      darCuentos(tablas, perfil.id, perfil.creadoPor)
      return perfil
    },
    async actualizarAjustes(id, ajustes) {
      const perfil = perfiles.obtener(id)
      if (!perfil) throw new Error(`Perfil ${id} no existe`)
      return perfiles.guardar({ ...perfil, ajustes })
    },
    async sumarMonedas(id, cantidad) {
      const perfil = perfiles.obtener(id)
      if (!perfil) throw new Error(`Perfil ${id} no existe`)
      const monedas = Math.max(0, perfil.monedas + cantidad)
      perfiles.guardar({ ...perfil, monedas })
      return monedas
    },
    async cambiarClave() {
      throw new Error(SIN_CONEXION)
    },
    async actualizarCiempi(id, apariencia) {
      const perfil = perfiles.obtener(id)
      if (!perfil) throw new Error(`Perfil ${id} no existe`)
      const { inventario } = completarPerfil(perfil)
      const ciempi = normalizarApariencia(apariencia)
      // Como el servidor: todas las partes y la criatura tienen que ser suyas.
      if (!puedePonerse(ciempi, inventario)) throw new Error('Primero hay que comprarlo')
      return completarPerfil(perfiles.guardar({ ...perfil, ciempi }))
    },
    async comprar(id, itemId, precioVisto) {
      const perfil = perfiles.obtener(id)
      if (!perfil) throw new Error(`Perfil ${id} no existe`)
      const { inventario, monedas } = completarPerfil(perfil)
      const nuevo = comprarItem(inventario, monedas, itemId, precioVisto)
      perfiles.guardar({ ...perfil, monedas: nuevo.monedas, inventario: nuevo.inventario })
      return { monedas: nuevo.monedas, inventario: nuevo.inventario }
    },
    async crearInvitacion() {
      throw new Error(SIN_CONEXION)
    },
    async canjearInvitacion() {
      throw new Error(SIN_CONEXION)
    },
  }

  const repoTextos: RepositorioTextos = {
    async listar() {
      return textos.todos().sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn))
    },
    async obtener(id) {
      return textos.obtener(id)
    },
    async guardar(texto) {
      return textos.guardar(texto)
    },
    async eliminar(id) {
      textos.eliminar(id)
      asignaciones.reemplazar(asignaciones.todos().filter((a) => a.textoId !== id))
    },
  }

  const repoAsignaciones: RepositorioAsignaciones = {
    async listarPorPerfil(perfilId) {
      return asignaciones
        .todos()
        .filter((a) => a.perfilId === perfilId)
        .map((a) => ({ ...a, nivel: a.nivel ?? 1 }))
        .sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn))
    },
    async asignar(perfilId, textoId, nivel = 1) {
      const existente = asignaciones.todos().find((a) => a.perfilId === perfilId && a.textoId === textoId)
      if (existente) return existente
      return asignaciones.guardar({ ...nuevaAsignacion(perfilId, textoId, cuentaLocal().id), nivel })
    },
    async cambiarNivel(id, nivel) {
      const a = asignaciones.obtener(id)
      if (!a) throw new Error(`Asignación ${id} no existe`)
      return asignaciones.guardar({ ...a, nivel, actualizadaEn: ahora() })
    },
    async guardarProgreso(id, { fraseActual, fraseMaxima, estado, leidoHasta, premioHasta, relecturaPremiadaEn }) {
      const a = asignaciones.obtener(id)
      if (!a) throw new Error(`Asignación ${id} no existe`)
      // Lo ya pagado queda anotado antes de que cambie lo leído.
      if (!tablas.premios.obtener(id)) tablas.premios.guardar(premiosDe(a))
      const fecha = ahora()
      return asignaciones.guardar({
        ...a,
        fraseActual,
        fraseMaxima: Math.max(a.fraseMaxima ?? 0, fraseMaxima),
        leidoHasta: Math.max(a.leidoHasta ?? 0, leidoHasta ?? 0),
        premioHasta: Math.max(a.premioHasta ?? 0, premioHasta ?? 0),
        relecturaPremiadaEn: relecturaPremiadaEn ?? a.relecturaPremiadaEn ?? null,
        estado,
        actualizadaEn: fecha,
        // Se recuerda que lo terminó aunque lo esté leyendo de nuevo.
        completadaEn: estado === 'completada' ? (a.completadaEn ?? fecha) : a.completadaEn,
      })
    },
    async quitar(id) {
      asignaciones.eliminar(id)
    },
  }

  const repoSesiones: RepositorioSesiones = {
    async guardar(sesion) {
      return sesiones.guardar(sesion)
    },
    async listarPorPerfil(perfilId) {
      return sesiones
        .todos()
        .filter((s) => s.perfilId === perfilId)
        .sort((a, b) => b.iniciadaEn.localeCompare(a.iniciadaEn))
    },
  }

  /**
   * Sin conexión no hay servidor: los premios se calculan aquí, con las mismas
   * reglas y el mismo cálculo (src/lectura/premios.ts), y se pagan al instante.
   * (No hay revisión de ritmo: en este modo los datos son del dispositivo.)
   */
  const oyentesPremios = new Set<Parameters<RepositorioPremios['alResolver']>[0]>()
  const repoPremios: RepositorioPremios = {
    async reclamar(pedido: PedidoPremio): Promise<ResolucionPremio> {
      const perfil = perfiles.obtener(pedido.perfilId)
      const a = asignaciones.obtener(pedido.asignacionId)
      const texto = a && textos.obtener(a.textoId)
      let r: Exclude<ResolucionPremio, { estado: 'pendiente' }>
      const atendido = tablas.premiosAtendidos.obtener(pedido.operationId)
      if (!perfil || !a || !texto || a.perfilId !== perfil.id) r = { estado: 'descartado', motivo: 'Ese libro ya no está en la biblioteca' }
      else if (atendido) r = { estado: 'otorgado', otorgadas: atendido.otorgadas, monedas: perfil.monedas }
      else {
        const previo = premiosDe(a)
        // Sin cuenta, la economía la fija la compilación (VITE_ECONOMIA; por defecto 2.4.1).
        const calculo = calcularPremio(texto, a.nivel ?? 1, previo, pedido, { hoy: hoy(), reglas: reglasDe(modeloDeCompilacion()) })
        const e = calculo.estado
        tablas.premios.guardar({ id: a.id, ...e })
        tablas.premiosAtendidos.guardar({ id: pedido.operationId, otorgadas: calculo.monedas })
        asignaciones.guardar({
          ...a,
          leidoHasta: Math.max(a.leidoHasta ?? 0, e.pagadoHasta),
          premioHasta: Math.max(a.premioHasta ?? 0, e.hitosHasta),
          relecturaPremiadaEn: e.relecturaDia ?? a.relecturaPremiadaEn ?? null,
        })
        const monedas = perfil.monedas + calculo.monedas
        perfiles.guardar({ ...perfil, monedas })
        // Como el servidor: después de cada premio se revisa si ya ganó la Cuncuna.
        revisarCuncuna(perfil.id)
        r = { estado: 'otorgado', otorgadas: calculo.monedas, monedas }
      }
      oyentesPremios.forEach((fn) => fn(pedido, r))
      return r
    },
    async reintentar() {},
    pendientes: () => 0,
    economia: () => modeloDeCompilacion(),
    alResolver(fn) {
      oyentesPremios.add(fn)
      return () => void oyentesPremios.delete(fn)
    },
  }

  return {
    enLinea: false,
    auth,
    perfiles: repoPerfiles,
    textos: repoTextos,
    asignaciones: repoAsignaciones,
    sesiones: repoSesiones,
    premios: repoPremios,
    desbloqueos: {
      async listar(perfilId) {
        revisarCuncuna(perfilId)
        return tablas.desbloqueos
          .todos()
          .filter((d) => d.perfilId === perfilId)
          .map(({ id: _id, perfilId: _p, ...d }) => d)
      },
      async celebrar(perfilId, item) {
        const d = tablas.desbloqueos.obtener(`${perfilId}|${item}`)
        if (!d) throw new Error('Eso no está desbloqueado')
        tablas.desbloqueos.guardar({ ...d, estado: 'celebrado', celebradoEn: d.celebradoEn ?? ahora() })
      },
    },
  }
}
