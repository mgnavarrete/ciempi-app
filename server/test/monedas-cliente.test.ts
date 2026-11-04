/**
 * El flujo de premios de la app de punta a punta: los repositorios reales del
 * cliente (src/datos/api, con su cola de premios) contra el servidor real
 * escuchando en un puerto, con E2 y con 2.4.1. Reproduce el bug de 2.6.0: al
 * iniciar sesión la app revisa la cola vacía, la cola quedaba trabada y
 * ningún premio salía mientras se leía (con E2, cero monedas y nada a la vista).
 * Contra un PostgreSQL real (DATABASE_URL), en su propio esquema.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const HAY_BASE = !!process.env.DATABASE_URL

/** Lo que esta prueba usa de los repositorios del cliente (src/datos/repositorios.ts). */
type Resolucion = { estado: 'otorgado'; otorgadas: number; monedas: number } | { estado: 'pendiente' } | { estado: 'descartado'; motivo: string }
interface ReposCliente {
  auth: { registrarse(datos: object): Promise<unknown> }
  perfiles: { crear(datos: object): Promise<{ id: string }>; obtener(id: string): Promise<{ monedas: number } | null> }
  asignaciones: { listarPorPerfil(perfilId: string): Promise<{ id: string; textoId: string; nivel: number }[]> }
  textos: { obtener(id: string): Promise<{ frases: string[]; capitulos: unknown[]; parrafos?: number[] } | null> }
  premios: { reintentar(): Promise<void>; reclamar(pedido: object): Promise<Resolucion>; economia?(): string }
}
const ESQUEMA = 'prueba_monedas_cliente'

describe.skipIf(!HAY_BASE)('premios del cliente contra el servidor (E2 y 2.4.1)', async () => {
  process.env.NODE_ENV = 'test'
  delete process.env.ECONOMIA
  const url = new URL(process.env.DATABASE_URL!)
  url.searchParams.set('options', `-c search_path=${ESQUEMA}`)
  process.env.DATABASE_URL = url.toString()
  const { pool, migrar } = await import('../src/db.ts')
  const { crearApp } = await import('../src/app.ts')
  // El cliente se carga con una ruta en variable: el tsconfig del servidor (node16) no revisa src/datos.
  const rutaCliente = '../../src/datos/api/repositoriosApi.ts'
  const { crearRepositoriosApi } = (await import(/* @vite-ignore */ rutaCliente)) as { crearRepositoriosApi: (base: string) => ReposCliente }
  const { vistaPorNivel, fraseDeUnidad } = await import('../../src/lenguaje/unidades.ts')
  const { contarPalabras, contarSilabas, monedasDeUnidad, REGLAS_MONEDAS } = await import('../../src/lectura/monedas.ts')

  let ahora = Date.parse('2026-11-04T15:00:00Z')
  const apps: Awaited<ReturnType<typeof crearApp>>[] = []
  const servidor = async (economia: 'e2' | 'actual') => {
    const app = await crearApp({ ahora: () => ahora, economia })
    await app.listen({ port: 0, host: '127.0.0.1' })
    apps.push(app)
    const dir = app.server.address() as { port: number }
    return `http://127.0.0.1:${dir.port}`
  }

  beforeAll(async () => {
    await pool.query(`drop schema if exists ${ESQUEMA} cascade; create schema ${ESQUEMA}`)
    await migrar()
    await (await import('../src/cuentos.ts')).sembrarCuentos()
  })
  afterAll(async () => {
    for (const a of apps) await a.close()
    await pool.query(`drop schema if exists ${ESQUEMA} cascade`)
    await pool.end()
  })

  let cuentas = 0
  /**
   * Como la app: un profesor entra, abre la sesión de una niña (la cola se
   * revisa al iniciar, vacía) y lee un cuento de Ciempi del nivel pedido, unidad
   * por unidad, a ritmo normal (1,5 s por sílaba), pidiendo cada premio como
   * PantallaLectura (sin saber todavía qué economía rige, esperando 0 monedas
   * con E2 o las de 2.4.1).
   */
  async function leerCuento(base: string, nivel: 0 | 2, modoCliente: 'e2' | 'actual') {
    const repos = crearRepositoriosApi(base)
    await repos.auth.registrarse({ correo: `profe${++cuentas}@test.cl`, clave: 'clave-segura', nombreVisible: 'Profe', rol: 'profesor' })
    const nina = await repos.perfiles.crear({ apodo: `Sofi${cuentas}`, icono: '🐛', usuario: `sofi${cuentas}`, clave: 'clave123' })
    // App.tsx: con sesión, lo que quedó sin enviar sale de inmediato (aquí, nada).
    await repos.premios.reintentar()
    const asignacion = (await repos.asignaciones.listarPorPerfil(nina.id)).find((a) => a.nivel === nivel)!
    const texto = (await repos.textos.obtener(asignacion.textoId))!
    const vista = vistaPorNivel(texto as never, nivel)
    const total = vista.unidades.length
    const resoluciones: Resolucion[] = []
    for (let i = 0; i < total; i++) {
      const unidad = vista.unidades[i]
      if (contarPalabras(unidad) === 0) continue
      const segundos = 1.5 * contarSilabas(unidad) + 1
      ahora += segundos * 1000
      const esperadas = modoCliente === 'e2' ? 0 : monedasDeUnidad(nivel, i + 1, total)
      const ultima = i === total - 1
      resoluciones.push(
        await repos.premios.reclamar({
          operationId: `op-${cuentas}-${i}-${Math.random().toString(36).slice(2)}`,
          perfilId: nina.id,
          asignacionId: asignacion.id,
          tipo: 'avance',
          hasta: fraseDeUnidad(vista, i + 1, texto.frases.length),
          conPremio: true,
          segundosActivos: segundos,
          ...(ultima ? { tropiezos: 0 } : {}),
          esperadas,
        }),
      )
    }
    const saldo = (await repos.perfiles.obtener(nina.id))!.monedas
    return { resoluciones, saldo, unidades: total, economia: repos.premios.economia?.() }
  }

  const pagado = (rs: Resolucion[]) => rs.reduce((s, r) => s + (r.estado === 'otorgado' ? r.otorgadas : 0), 0)

  it('con E2, leer un cuento de nivel 0 y otro de nivel 2 a ritmo normal paga más de 0 mientras se lee', async () => {
    const base = await servidor('e2')
    for (const nivel of [0, 2] as const) {
      const r = await leerCuento(base, nivel, 'e2')
      // Cada pedido lo responde el servidor en el momento (antes quedaban «pendientes» en la cola).
      expect(r.resoluciones.every((x) => x.estado === 'otorgado')).toBe(true)
      expect(pagado(r.resoluciones)).toBeGreaterThan(0)
      expect(r.saldo).toBe(pagado(r.resoluciones))
      expect(r.economia).toBe('e2')
    }
  }, 60_000)

  it('con E2 paga aunque la app crea que rige 2.4.1 (manda segundos activos desde la primera unidad)', async () => {
    const base = await servidor('e2')
    const r = await leerCuento(base, 0, 'actual')
    expect(r.resoluciones.every((x) => x.estado === 'otorgado')).toBe(true)
    expect(pagado(r.resoluciones)).toBeGreaterThan(0)
    expect(r.saldo).toBe(pagado(r.resoluciones))
  }, 60_000)

  it('con 2.4.1 paga lo de siempre (una moneda por unidad hasta el tope), sin pagar dos veces', async () => {
    const base = await servidor('actual')
    const r = await leerCuento(base, 0, 'actual')
    expect(r.resoluciones.every((x) => x.estado === 'otorgado')).toBe(true)
    const esperado = Math.min(r.unidades * REGLAS_MONEDAS.porUnidad[0], REGLAS_MONEDAS.topePorLibro[0])
    expect(pagado(r.resoluciones)).toBe(esperado)
    expect(r.saldo).toBe(esperado)
    expect(r.economia).toBe('actual')
  }, 60_000)
})
