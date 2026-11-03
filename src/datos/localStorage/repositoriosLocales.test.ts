import { describe, expect, it } from 'vitest'
import { CUENTOS } from '../../contenido/cuentos'
import { crearTexto, prepararCuentaNueva } from '../inicio'
import { hoy } from '../../lectura/monedas'
import { crearRepositoriosLocales } from './repositoriosLocales'

function almacenEnMemoria() {
  const datos = new Map<string, string>()
  return {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
  }
}

async function preparado() {
  const almacen = almacenEnMemoria()
  const repos = crearRepositoriosLocales(almacen)
  const sesion = (await repos.auth.sesionActual())!
  const cuenta = sesion.tipo === 'adulto' ? sesion.cuenta : null!
  await prepararCuentaNueva(repos)
  const [perfil] = await repos.perfiles.listar()
  return { almacen, repos, cuenta, perfil }
}

describe('repositorios en localStorage', () => {
  it('la primera vez crea un niño con los cuentos de Ciempi en su biblioteca, una sola vez', async () => {
    const { almacen, repos, perfil } = await preparado()
    await prepararCuentaNueva(repos)
    const otraVez = crearRepositoriosLocales(almacen)
    expect(await otraVez.perfiles.listar()).toHaveLength(1)
    const biblioteca = await otraVez.asignaciones.listarPorPerfil(perfil.id)
    expect(biblioteca).toHaveLength(CUENTOS.length)
    for (const c of CUENTOS) expect(biblioteca.find((a) => a.textoId === c.id)?.nivel).toBe(c.nivel)
    const texto = await otraVez.textos.obtener(CUENTOS.find((c) => c.titulo === 'Canción de Don Ciempiés')!.id)
    expect(texto).toMatchObject({ subidoPor: null, origen: 'ciempi', parrafos: [0, 4, 8, 12] })
    expect(texto?.capitulos).toEqual([{ titulo: texto?.titulo, desdeFrase: 0 }])
  })

  it('persiste monedas y ajustes del perfil', async () => {
    const { almacen, repos, perfil } = await preparado()
    expect(await repos.perfiles.sumarMonedas(perfil.id, 3)).toBe(3)
    expect(await repos.perfiles.sumarMonedas(perfil.id, -10)).toBe(0)
    await repos.perfiles.actualizarAjustes(perfil.id, { ...perfil.ajustes, modoTranquilo: true })
    const releido = await crearRepositoriosLocales(almacen).perfiles.obtener(perfil.id)
    expect(releido?.ajustes.modoTranquilo).toBe(true)
  })

  it('guarda el progreso de lectura de cada libro', async () => {
    const { almacen, repos, cuenta, perfil } = await preparado()
    const libro = await repos.textos.guardar(crearTexto(cuenta.id, { titulo: 'Libro', textoOriginal: 'Uno. Dos. Tres.', origen: 'pegado' }))
    const a = await repos.asignaciones.asignar(perfil.id, libro.id)
    expect(await repos.asignaciones.asignar(perfil.id, libro.id)).toEqual(a)

    await repos.asignaciones.guardarProgreso(a.id, { fraseActual: 2, fraseMaxima: 2, estado: 'en_curso' })
    const releida = (await crearRepositoriosLocales(almacen).asignaciones.listarPorPerfil(perfil.id)).find((x) => x.id === a.id)
    expect(releida).toMatchObject({ fraseActual: 2, fraseMaxima: 2, estado: 'en_curso', completadaEn: null })

    const terminada = await repos.asignaciones.guardarProgreso(a.id, { fraseActual: 3, fraseMaxima: 3, estado: 'completada' })
    expect(terminada.completadaEn).not.toBeNull()

    // Volver a empezar: la frase actual retrocede, pero el máximo y la fecha de término se conservan.
    const releyendo = await repos.asignaciones.guardarProgreso(a.id, { fraseActual: 0, fraseMaxima: 0, estado: 'en_curso' })
    expect(releyendo).toMatchObject({ fraseActual: 0, fraseMaxima: 3, completadaEn: terminada.completadaEn })
  })

  it('eliminar un texto lo saca de las bibliotecas', async () => {
    const { repos, cuenta, perfil } = await preparado()
    const libro = await repos.textos.guardar(crearTexto(cuenta.id, { titulo: 'Libro', textoOriginal: 'Uno. Dos.', origen: 'pegado' }))
    await repos.asignaciones.asignar(perfil.id, libro.id)
    await repos.textos.eliminar(libro.id)
    expect(await repos.asignaciones.listarPorPerfil(perfil.id)).toHaveLength(CUENTOS.length)
  })

  it('una sesión se actualiza en vez de duplicarse', async () => {
    const { repos, cuenta, perfil } = await preparado()
    const sesion = {
      id: crypto.randomUUID(),
      usuarioId: cuenta.id,
      perfilId: perfil.id,
      textoId: null,
      asignacionId: null,
      modo: 'coro' as const,
      iniciadaEn: new Date().toISOString(),
      duracionSegundos: 10,
      frasesCompletadas: 1,
      frasesMuyRapido: 0,
      silabasLeidas: 6,
      monedasGanadas: 1,
    }
    await repos.sesiones.guardar(sesion)
    await repos.sesiones.guardar({ ...sesion, frasesCompletadas: 2 })
    const sesiones = await repos.sesiones.listarPorPerfil(perfil.id)
    expect(sesiones).toHaveLength(1)
    expect(sesiones[0].frasesCompletadas).toBe(2)
  })

  it('sin conexión, las invitaciones avisan que necesitan cuenta en línea', async () => {
    const { repos, perfil } = await preparado()
    expect(repos.enLinea).toBe(false)
    await expect(repos.perfiles.crearInvitacion(perfil.id)).rejects.toThrow(/en línea/)
  })
})

describe('migraciones', () => {
  it('convierte los datos de la versión anterior: voz, perfiles, textos y biblioteca', async () => {
    const almacen = almacenEnMemoria()
    // Datos tal como los guardaba la fase 1.
    almacen.setItem('ciempi:v1:cuentas', JSON.stringify([{ id: 'c1', correo: null, rol: 'apoderado', nombreVisible: 'x', creadaEn: '2026-10-27' }]))
    almacen.setItem(
      'ciempi:v1:perfiles',
      JSON.stringify([
        {
          id: 'p1', cuentaId: 'c1', apodo: 'Lector', icono: '🐛', pinHash: null, monedas: 7, creadoEn: '2026-10-27',
          ajustes: { tamanoLetra: 44, modoTranquilo: false, velocidadVoz: 0.85, umbralSilabasPorSegundo: 3 },
        },
      ]),
    )
    almacen.setItem(
      'ciempi:v1:textos',
      JSON.stringify([{ id: 't1', cuentaId: 'c1', titulo: 'Cuento', textoOriginal: 'Hola.', frases: ['Hola.'], origen: 'pegado', creadoEn: '2026-10-27', actualizadoEn: '2026-10-27' }]),
    )
    almacen.setItem('ciempi:v1:migraciones', '[]')

    const repos = crearRepositoriosLocales(almacen)
    const perfil = await repos.perfiles.obtener('p1')
    expect(perfil).toMatchObject({ creadoPor: 'c1', monedas: 7, usuario: null, tieneCuenta: false })
    expect(perfil?.ajustes.velocidadVoz).toBe(1)
    // 3 sílabas/s → 1,5 palabras/s → 2,5 → 4 (cada vez que cambió el valor por defecto).
    expect(perfil?.ajustes.umbralPalabrasPorSegundo).toBe(4)
    expect(perfil?.ajustes).not.toHaveProperty('umbralSilabasPorSegundo')
    expect(await repos.textos.obtener('t1')).toMatchObject({ subidoPor: 'c1', autor: null, portada: null, capitulos: [{ titulo: 'Cuento', desdeFrase: 0 }] })
    const biblioteca = await repos.asignaciones.listarPorPerfil('p1')
    expect(biblioteca.find((a) => a.textoId === 't1')).toMatchObject({ fraseActual: 0 })
    // Y recibe los cuentos de Ciempi.
    expect(biblioteca).toHaveLength(1 + CUENTOS.length)

    // Si después elige 0.85 a mano, no se vuelve a pisar.
    await repos.perfiles.actualizarAjustes('p1', { ...perfil!.ajustes, velocidadVoz: 0.85 })
    expect((await crearRepositoriosLocales(almacen).perfiles.obtener('p1'))?.ajustes.velocidadVoz).toBe(0.85)
  })
})

describe('tienda de Ciempi', () => {
  it('compra con monedas, no compra sin ellas y solo deja ponerse lo comprado', async () => {
    const { almacen, repos, perfil } = await preparado()
    expect(perfil.ciempi.nombre).toBe('Ciempi')

    await expect(repos.perfiles.comprar(perfil.id, 'cabeza:b06-ia-corona')).rejects.toThrow(/Te faltan 25 monedas/)
    await expect(repos.perfiles.actualizarCiempi(perfil.id, { ...perfil.ciempi, cabeza: 'cabeza:b06-ia-corona' })).rejects.toThrow(/comprarlo/)

    await repos.perfiles.sumarMonedas(perfil.id, 30)
    expect(await repos.perfiles.comprar(perfil.id, 'cabeza:b06-ia-corona')).toEqual({ monedas: 5, inventario: ['cabeza:b06-ia-corona'] })
    // Comprar dos veces no cobra de nuevo.
    expect(await repos.perfiles.comprar(perfil.id, 'cabeza:b06-ia-corona')).toEqual({ monedas: 5, inventario: ['cabeza:b06-ia-corona'] })

    await repos.perfiles.actualizarCiempi(perfil.id, { ...perfil.ciempi, nombre: 'Rayito', genero: 'nina', cabeza: 'cabeza:b06-ia-corona' })
    const releido = await crearRepositoriosLocales(almacen).perfiles.obtener(perfil.id)
    expect(releido?.ciempi).toMatchObject({ nombre: 'Rayito', genero: 'nina', cabeza: 'cabeza:b06-ia-corona' })
    expect(releido?.monedas).toBe(5)
  })
})

describe('premios sin conexión (mismo cálculo que el servidor)', () => {
  async function conLibro(nivel: 0 | 1 | 2 | 3 | 4 = 1) {
    const p = await preparado()
    const libro = await p.repos.textos.guardar(
      crearTexto(p.cuenta.id, { titulo: 'Libro', textoOriginal: 'Mi gato duerme. El sol sale. Ciempi come.', origen: 'pegado' }),
    )
    const a = await p.repos.asignaciones.asignar(p.perfil.id, libro.id, nivel)
    const pedido = (operationId: string, solicitud: { tipo: 'avance'; hasta: number; conPremio: boolean } | { tipo: 'relectura'; dia: string }, esperadas = 1) => ({
      ...solicitud,
      operationId,
      perfilId: p.perfil.id,
      asignacionId: a.id,
      esperadas,
    })
    return { ...p, libro, a, pedido }
  }

  it('calcula lo que corresponde (lo esperado por la app no cuenta) y el mismo pedido paga una vez', async () => {
    const { almacen, repos, perfil, pedido } = await conLibro()
    const avisos: unknown[] = []
    repos.premios.alResolver((_, r) => avisos.push(r))
    expect(await repos.premios.reclamar(pedido('op-00001', { tipo: 'avance', hasta: 1, conPremio: true }, 99))).toEqual({ estado: 'otorgado', otorgadas: 1, monedas: 1 })
    // Repetido (reintento): responde lo mismo y no suma.
    expect(await repos.premios.reclamar(pedido('op-00001', { tipo: 'avance', hasta: 1, conPremio: true }))).toEqual({ estado: 'otorgado', otorgadas: 1, monedas: 1 })
    // Otro pedido por lo mismo (otra pestaña): nada.
    expect(await repos.premios.reclamar(pedido('op-00002', { tipo: 'avance', hasta: 1, conPremio: true }))).toMatchObject({ otorgadas: 0, monedas: 1 })
    expect(avisos).toHaveLength(3)
    expect(repos.premios.pendientes(perfil.id)).toBe(0)
    // Queda guardado: al abrir la app otra vez sigue igual.
    const otraVez = crearRepositoriosLocales(almacen)
    expect((await otraVez.perfiles.obtener(perfil.id))?.monedas).toBe(1)
    expect(await otraVez.premios.reclamar(pedido('op-00001', { tipo: 'avance', hasta: 1, conPremio: true }))).toMatchObject({ otorgadas: 1, monedas: 1 })
  })

  it('relectura: solo con el libro terminado y una vez por día (también en el nivel 1, sin hitos)', async () => {
    const { repos, a, pedido } = await conLibro(1)
    const dia = hoy()
    expect(await repos.premios.reclamar(pedido('op-relee-1', { tipo: 'relectura', dia }))).toMatchObject({ otorgadas: 0 })
    await repos.premios.reclamar(pedido('op-avance-3', { tipo: 'avance', hasta: 3, conPremio: true }))
    expect(await repos.premios.reclamar(pedido('op-relee-2', { tipo: 'relectura', dia }))).toMatchObject({ otorgadas: 1 })
    expect(await repos.premios.reclamar(pedido('op-relee-3', { tipo: 'relectura', dia }))).toMatchObject({ otorgadas: 0 })
    const guardada = (await repos.asignaciones.listarPorPerfil(a.perfilId)).find((x) => x.id === a.id)
    expect(guardada).toMatchObject({ leidoHasta: 3, relecturaPremiadaEn: dia })
  })

  it('un libro leído antes de 2.5 (sin registro de premios) cuenta como ya pagado', async () => {
    const { almacen, repos, perfil, a, pedido } = await conLibro(1)
    await repos.asignaciones.guardarProgreso(a.id, { fraseActual: 2, fraseMaxima: 2, estado: 'en_curso', leidoHasta: 2 })
    // Como si los datos fueran de 2.4.x: sin la tabla de premios.
    almacen.setItem('ciempi:v1:premios', '[]')
    const otraVez = crearRepositoriosLocales(almacen)
    expect(await otraVez.premios.reclamar(pedido('op-viejo-2', { tipo: 'avance', hasta: 2, conPremio: true }))).toMatchObject({ otorgadas: 0 })
    expect(await otraVez.premios.reclamar(pedido('op-viejo-3', { tipo: 'avance', hasta: 3, conPremio: true }))).toMatchObject({ otorgadas: 1, monedas: 1 })
    expect((await otraVez.perfiles.obtener(perfil.id))?.monedas).toBe(1)
  })

  it('un libro que ya no está: descartado', async () => {
    const { repos, a, pedido } = await conLibro()
    await repos.asignaciones.quitar(a.id)
    expect(await repos.premios.reclamar(pedido('op-quitado', { tipo: 'avance', hasta: 1, conPremio: true }))).toMatchObject({ estado: 'descartado' })
  })
})
