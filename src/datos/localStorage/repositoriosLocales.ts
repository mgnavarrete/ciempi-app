import { PARTES, buscarItem, loTiene, normalizarApariencia } from '../../ciempi/catalogo'
import { nuevoId } from '../../dominio/ids'
import {
  AJUSTES_POR_DEFECTO,
  normalizarAjustes,
  type Asignacion,
  type Cuenta,
  type Id,
  type PerfilNino,
  type SesionLectura,
  type Texto,
} from '../../dominio/tipos'
import type {
  Autenticacion,
  RepositorioAsignaciones,
  RepositorioPerfiles,
  RepositorioSesiones,
  RepositorioTextos,
  Repositorios,
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

interface Tablas {
  cuentas: Tabla<Cuenta>
  perfiles: Tabla<PerfilNino>
  textos: Tabla<Texto>
  asignaciones: Tabla<Asignacion>
  sesiones: Tabla<SesionLectura>
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

function nuevaAsignacion(perfilId: Id, textoId: Id, asignadaPor: Id): Asignacion {
  const fecha = ahora()
  return {
    id: nuevoId(),
    asignadaPor,
    perfilId,
    textoId,
    modo: 'coro',
    nivel: 1,
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
const completarPerfil = (p: PerfilNino): PerfilNino => ({ ...p, ciempi: normalizarApariencia(p.ciempi), inventario: p.inventario ?? [] })

export function crearRepositoriosLocales(almacen: AlmacenClaveValor = window.localStorage): Repositorios {
  const tablas: Tablas = {
    cuentas: new Tabla<Cuenta>(almacen, 'cuentas'),
    perfiles: new Tabla<PerfilNino>(almacen, 'perfiles'),
    textos: new Tabla<Texto>(almacen, 'textos'),
    asignaciones: new Tabla<Asignacion>(almacen, 'asignaciones'),
    sesiones: new Tabla<SesionLectura>(almacen, 'sesiones'),
  }
  migrar(almacen, tablas)
  const { cuentas, perfiles, textos, asignaciones, sesiones } = tablas

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
      return perfiles.guardar({
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
      for (const c of PARTES) {
        if (!loTiene(inventario, ciempi[c])) throw new Error('Primero hay que comprarlo')
      }
      return completarPerfil(perfiles.guardar({ ...perfil, ciempi }))
    },
    async comprar(id, itemId) {
      const perfil = perfiles.obtener(id)
      if (!perfil) throw new Error(`Perfil ${id} no existe`)
      const item = buscarItem(itemId)
      if (!item) throw new Error('Eso no está en la tienda')
      const { inventario, monedas } = completarPerfil(perfil)
      if (loTiene(inventario, itemId)) return { monedas, inventario }
      if (monedas < item.precio) throw new Error(`Te faltan ${item.precio - monedas} monedas`)
      const nuevo = { monedas: monedas - item.precio, inventario: [...inventario, itemId] }
      perfiles.guardar({ ...perfil, ...nuevo })
      return nuevo
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
    async guardarProgreso(id, { fraseActual, fraseMaxima, estado }) {
      const a = asignaciones.obtener(id)
      if (!a) throw new Error(`Asignación ${id} no existe`)
      const fecha = ahora()
      return asignaciones.guardar({
        ...a,
        fraseActual,
        fraseMaxima: Math.max(a.fraseMaxima ?? 0, fraseMaxima),
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

  return {
    enLinea: false,
    auth,
    perfiles: repoPerfiles,
    textos: repoTextos,
    asignaciones: repoAsignaciones,
    sesiones: repoSesiones,
  }
}
