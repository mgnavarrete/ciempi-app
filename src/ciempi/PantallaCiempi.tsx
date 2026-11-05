import { CATEGORIAS_SOLO_ACCESORIO, MiniaturaAccesorio } from './v2/MiniaturaAccesorio'
import { useEffect, useRef, useState } from 'react'
import { sonarCelebracion } from '../audio/sonidos'
import { useRepositorios } from '../datos/DatosProvider'
import type { PerfilNino } from '../dominio/tipos'
import { BotonPrincipal, Encabezado, MensajeError, Monedas } from '../ui/comunes'
import {
  BAILES,
  CATEGORIAS,
  PARTES,
  SIN_ESTAMPADO,
  VARIANTES,
  ahorroDe,
  bailePorId,
  buscarItem,
  lleva,
  loTiene,
  precioDe,
  puedePonerse,
  type AparienciaCiempi,
  type Baile,
  type CategoriaCiempi,
  type Genero,
  type VariantesCiempi,
} from './catalogo'
import { CiempiPersonaje } from './CiempiPersonaje'
import { Comida, FondoTema } from './dibujos'
import { MiniaturaCiempi } from './v2/Miniatura'
import { ESPECIES, especieDeItem, type EspecieId } from './criaturas'
import { MiniaturaCriatura, TiendaCriaturas } from './TiendaCriaturas'
import { BarraCompra, MasEnLaTienda, PestanasDeslizables, Precio, SelloNuevo, Vacio, clasePestana, esNuevo } from './tiendaUi'
import { aComprar, conCaraALaVista, conColor, despuesDeComprar, probarCriatura as probarCriaturaSobre, probarTarjeta, sinPrueba, tarjetasDe, type Prueba, type Tarjeta } from './pruebaTienda'
import { GrillaBailes } from './BailesCiempi'
import { ANIMACIONES } from './v2/animacion/animaciones.js'
import type { EventoCiempi } from './v2/CiempiVivo'

const CUNCUNA = 'especie:cuncuna'

export type ModoCiempi = 'tienda' | 'ropero'

interface Props {
  perfil: PerfilNino
  /** «tienda»: solo lo que no tiene (se prueba y se compra). «ropero»: solo lo suyo (se pone al tocar). */
  modo: ModoCiempi
  /** Sección con que abre (p. ej. «bailes», desde la rueda del inicio). */
  seccionInicial?: string
  alCambiarModo: (modo: ModoCiempi) => void
  alCambiarPerfil: (cambios: Partial<PerfilNino>) => void
  alVolver: () => void
}

/** La tienda ordenada como se viste a Ciempi: cabeza, cuerpo, su mundo y, al final, conjuntos completos. */
const SECCIONES: { id: string; nombre: string; emoji: string; categorias: CategoriaCiempi[]; fondo: string }[] = [
  // Criaturas (2.5; primera desde 2.5.2): su propia vista (pestañas por especie), no categorías de PARTES.
  { id: 'criaturas', nombre: 'Criaturas', emoji: '🐉', categorias: [], fondo: 'bg-verde-claro' },
  { id: 'cabeza', nombre: 'Cabeza', emoji: '🎩', categorias: ['cabeza', 'pelo', 'cara', 'gesto', 'ojos', 'detalle'], fondo: 'bg-naranjo-claro' },
  { id: 'cuerpo', nombre: 'Cuerpo', emoji: '🐛', categorias: ['paleta', 'textura', 'cuello', 'espalda', 'pies'], fondo: 'bg-petroleo-claro' },
  { id: 'mundo', nombre: 'Su mundo', emoji: '🏞️', categorias: ['fondo', 'comida'], fondo: 'bg-amarillo/25' },
  // Bailes (2.7): no cambian el dibujo; se miran bailando, se compran y uno se elige para celebrar.
  { id: 'bailes', nombre: 'Bailes', emoji: '💃', categorias: ['baile'], fondo: 'bg-[#efe6fa]' },
  { id: 'conjuntos', nombre: 'Conjuntos', emoji: '🦸', categorias: ['conjunto'], fondo: 'bg-coral/15' },
]

const colorPuesto = (a: AparienciaCiempi, t: Tarjeta) => {
  const parte = t.item.categoria as keyof VariantesCiempi
  return !t.color || (a.variantes[parte] ?? VARIANTES[t.item.id][0].id) === t.color.id
}
const llevaTarjeta = (a: AparienciaCiempi, t: Tarjeta) => lleva(a, t.item) && colorPuesto(a, t)
/** ¿Ya es suyo? Un conjunto también, si ya tiene todas sus piezas (no le queda nada por pagar). */
const esSuya = (inventario: string[], t: Tarjeta) =>
  loTiene(inventario, t.item.id) || (t.item.categoria === 'conjunto' && precioDe(t.item, inventario) === 0)
/** Lo que se ve de Ciempi (sin nombre ni género). */
const look = (a: AparienciaCiempi) => JSON.stringify([...PARTES.map((p) => a[p]), a.variantes, a.criatura])

/**
 * La tienda y el ropero de Ciempi: una sola pantalla con dos modos (2.6).
 * En la tienda solo está lo que todavía no tiene. Desde 2.8 se prueba una sola
 * cosa nueva a la vez, sobre lo que tiene guardado: tocar otra la reemplaza y
 * cambiar de sección o de categoría la descarta (ver pruebaTienda.ts). La
 * barra de compra muestra ese único producto (un conjunto se compra como pack).
 * Lo comprado sale de la tienda y queda en su ropero, donde tocar algo se lo
 * pone y se guarda.
 *
 * Diseño: en celular vertical, Ciempi arriba en un panel fijo que se achica un
 * poco al desplazar la grilla; en celular horizontal y tablet, dos columnas
 * (Ciempi fijo a la izquierda). La barra de compra va debajo de la grilla, en
 * el flujo: nunca tapa a Ciempi ni la última fila.
 */
export function PantallaCiempi({ perfil, modo, seccionInicial, alCambiarModo, alCambiarPerfil, alVolver }: Props) {
  const enTienda = modo === 'tienda'
  const repos = useRepositorios()
  const tranquilo = perfil.ajustes.modoTranquilo
  const [seccion, setSeccion] = useState(() => SECCIONES.find((s) => s.id === seccionInicial) ?? SECCIONES[0])
  const [categoria, setCategoria] = useState<CategoriaCiempi>(() => SECCIONES.find((s) => s.id === seccionInicial)?.categorias[0] ?? 'cabeza')
  // Lo que se está probando: cómo se ve y la única cosa nueva (puede no estar comprada).
  const [prueba, setPrueba] = useState<Prueba>(() => sinPrueba(perfil.ciempi))
  const probando = prueba.apariencia
  const [nombre, setNombre] = useState(perfil.ciempi.nombre)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [estreno, setEstreno] = useState<string | null>(null)
  const [editandoNombre, setEditandoNombre] = useState(false)
  // Lo guardado y el inventario más recientes (las compras seguidas no esperan a que la pantalla se redibuje).
  const guardado = useRef(perfil.ciempi)
  guardado.current = perfil.ciempi
  const inventario = perfil.inventario
  const [especie, setEspecie] = useState<EspecieId>((especieDeItem(perfil.ciempi.criatura)?.id ?? ESPECIES[0].id) as EspecieId)
  // La Cuncuna recién ganada leyendo: se celebra una vez (por_celebrar → «¡Ponérmela!» → celebrado).
  const [celebrarCuncuna, setCelebrarCuncuna] = useState(false)
  // Celular vertical: Ciempi se achica un poco al desplazar la grilla (sin desaparecer).
  const [compacto, setCompacto] = useState(false)
  const lista = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let vigente = true
    repos.desbloqueos
      ?.listar(perfil.id)
      .then(async (ds) => {
        if (!vigente) return
        if (ds.some((d) => d.item === CUNCUNA) && !perfil.inventario.includes(CUNCUNA)) {
          // Se la dieron leyendo: el inventario que tiene la app todavía no la trae.
          const p = await repos.perfiles.obtener(perfil.id)
          if (vigente && p) alCambiarPerfil({ inventario: p.inventario })
        }
        if (vigente && ds.some((d) => d.item === CUNCUNA && d.estado === 'por_celebrar')) setCelebrarCuncuna(true)
      })
      .catch(() => {})
    return () => {
      vigente = false
    }
    // Solo al entrar a la tienda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil.id])

  const guardar = async (apariencia: AparienciaCiempi) => {
    setError(null)
    try {
      const actualizado = await repos.perfiles.actualizarCiempi(perfil.id, apariencia)
      guardado.current = actualizado.ciempi
      alCambiarPerfil({ ciempi: actualizado.ciempi })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  /** Descarta la prueba: Ciempi vuelve a verse como lo tiene guardado. */
  const volverALoMio = () => {
    setPrueba(sinPrueba(guardado.current))
    setAviso(null)
  }
  /** Al cambiar de lista (sección, categoría, especie o modo): sin prueba y la grilla arriba. */
  const otraLista = () => {
    volverALoMio()
    setEstreno(null)
    setCompacto(false)
    lista.current?.scrollTo?.({ top: 0 })
  }
  const irA = (s: (typeof SECCIONES)[number]) => {
    if (s.id === seccion.id) return
    setSeccion(s)
    setCategoria(s.categorias[0])
    otraLista()
  }
  const irACategoria = (c: CategoriaCiempi) => {
    if (c === categoria) return
    setCategoria(c)
    otraLista()
  }

  // Al pasar de la tienda al ropero (o al revés), se deshace la prueba.
  useEffect(() => {
    otraLista()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo])

  const elegir = (t: Tarjeta) => {
    setEstreno(null)
    // El aviso de colores: la paleta quita el estampado guardado.
    setAviso(t.item.categoria === 'paleta' && guardado.current.textura !== SIN_ESTAMPADO ? 'Quitamos el estampado para que se vean los colores.' : null)
    if (!enTienda) {
      // Ropero: se lo pone al tiro, sobre lo que tiene guardado.
      const puesta = conColor(guardado.current, t)
      setPrueba(sinPrueba(puesta))
      if (puedePonerse(puesta, inventario)) void guardar(puesta)
      return
    }
    // Tienda: una sola cosa nueva, sobre lo guardado (la prueba anterior se descarta).
    const nueva = probarTarjeta(guardado.current, t)
    setPrueba(nueva)
    // Si ya es suyo, se lo pone de inmediato (sin botón extra).
    if (puedePonerse(nueva.apariencia, inventario)) void guardar(nueva.apariencia)
  }

  // Lo único que se está probando y todavía no es suyo (con su precio).
  const compra = enTienda ? aComprar(prueba, inventario) : null
  const cambiado = look(probando) !== look(perfil.ciempi)

  const comprar = async () => {
    if (!compra) return
    setOcupado(true)
    setError(null)
    try {
      const r = await repos.perfiles.comprar(perfil.id, compra.item.id, compra.precio)
      alCambiarPerfil({ monedas: r.monedas, inventario: r.inventario })
      // Se pone lo comprado tal como se lo estaba probando (con su color).
      const actualizado = await repos.perfiles.actualizarCiempi(perfil.id, despuesDeComprar(guardado.current, prueba))
      guardado.current = actualizado.ciempi
      alCambiarPerfil({ ciempi: actualizado.ciempi, monedas: r.monedas, inventario: r.inventario })
      setPrueba(sinPrueba(actualizado.ciempi))
      setEstreno(`¡${compra.item.nombre} nuevo!`)
      if (!tranquilo) sonarCelebracion()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  // ── Criaturas ──
  const probarCriatura = (criatura: string | null) => {
    setEstreno(null)
    setAviso(null)
    setPrueba(probarCriaturaSobre(guardado.current, criatura))
  }
  const usarCriatura = async (criatura: string | null) => {
    setOcupado(true)
    const puesta = { ...guardado.current, criatura }
    await guardar(puesta)
    setOcupado(false)
    if (guardado.current.criatura !== criatura) return
    setPrueba(sinPrueba(guardado.current))
    setEstreno(criatura ? `¡${buscarItem(criatura)?.nombre}!` : `¡${guardado.current.nombre}!`)
    if (!tranquilo) sonarCelebracion()
  }
  /** Compra sin ponérsela (con el total que se mostró). */
  const comprarCriatura = async (itemId: string, precioVisto: number) => {
    setOcupado(true)
    setError(null)
    try {
      const r = await repos.perfiles.comprar(perfil.id, itemId, precioVisto)
      alCambiarPerfil({ monedas: r.monedas, inventario: r.inventario })
      setEstreno(`¡Ya tienes ${buscarItem(itemId)?.nombre}!`)
      if (!tranquilo) sonarCelebracion()
      return true
    } catch (e) {
      setError((e as Error).message)
      return false
    } finally {
      setOcupado(false)
    }
  }
  const cambiarEspecie = (e: EspecieId) => {
    if (e === especie) return
    setEspecie(e)
    otraLista()
  }
  const ponermelaCuncuna = async () => {
    setCelebrarCuncuna(false)
    irA(SECCIONES.find((s) => s.id === 'criaturas')!)
    setEspecie('cuncuna')
    await usarCriatura('variante:cuncuna-clasica')
    await repos.desbloqueos?.celebrar(perfil.id, CUNCUNA).catch(() => {})
  }
  const despuesCuncuna = () => {
    setCelebrarCuncuna(false)
    void repos.desbloqueos?.celebrar(perfil.id, CUNCUNA).catch(() => {})
  }
  const enCriaturas = seccion.id === 'criaturas'

  // ── Bailes (2.7) ──
  const enBailes = seccion.id === 'bailes'
  const [baileVisto, setBaileVisto] = useState<Baile | null>(null)
  const [accionPrevia, setAccionPrevia] = useState<EventoCiempi | null>(null)
  // En modo tranquilo Ciempi está quieto: baila (suave) solo lo que se toca.
  const [bailando, setBailando] = useState(false)
  const finBaile = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(finBaile.current), [])
  useEffect(() => setBaileVisto(null), [modo, seccion.id])
  const mirarBaile = (b: Baile) => {
    setEstreno(null)
    setBaileVisto(b)
    setAccionPrevia({ id: b.animacion, n: (accionPrevia?.n ?? 0) + 1 })
    if (tranquilo) {
      setBailando(true)
      window.clearTimeout(finBaile.current)
      const dur = ANIMACIONES.find((a) => a.id === b.animacion)?.duracion ?? 3
      finBaile.current = window.setTimeout(() => setBailando(false), dur * 1000 + 400)
    }
  }
  // Tienda: los que no tiene (sin la celebración clásica, que es de todos). Ropero: los suyos, con la clásica.
  const bailes = BAILES.filter((b) => (enTienda ? !b.oculto && !loTiene(inventario, b.id) : loTiene(inventario, b.id)))
  const baileAComprar = enTienda && baileVisto && !loTiene(inventario, baileVisto.id) ? baileVisto : null
  const comprarBaile = async (b: Baile) => {
    setOcupado(true)
    setError(null)
    try {
      const r = await repos.perfiles.comprar(perfil.id, b.id, b.precio)
      alCambiarPerfil({ monedas: r.monedas, inventario: r.inventario })
      setBaileVisto(null)
      setEstreno(`¡${b.nombre} nuevo!`)
      if (!tranquilo) sonarCelebracion()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setOcupado(false)
    }
  }
  const elegirCelebracion = async (b: Baile) => {
    mirarBaile(b)
    if (guardado.current.celebracion === b.id) return
    setOcupado(true)
    await guardar({ ...guardado.current, celebracion: b.id })
    setOcupado(false)
    if (guardado.current.celebracion === b.id) setEstreno(`¡Celebrará con ${b.nombre}!`)
  }

  const cambiarGenero = (g: Genero) => {
    const genero = probando.genero === g ? null : g
    setPrueba({ ...prueba, apariencia: { ...probando, genero } })
    void guardar({ ...guardado.current, genero })
  }

  const guardarNombre = () => {
    const limpio = nombre.trim() || 'Ciempi'
    setNombre(limpio)
    if (limpio !== perfil.ciempi.nombre) void guardar({ ...guardado.current, nombre: limpio })
  }

  /** Celular vertical: al bajar por la grilla Ciempi se achica un poco; al volver arriba, crece. */
  const alDesplazar = (e: React.UIEvent<HTMLElement>) => {
    const el = e.currentTarget
    if (!compacto && el.scrollTop > 32 && el.scrollHeight - el.clientHeight > 160) setCompacto(true)
    else if (compacto && el.scrollTop < 4) setCompacto(false)
  }

  const tarjetas = tarjetasDe(categoria).filter((t) => esSuya(inventario, t) !== enTienda)
  const animar = tranquilo ? '' : 'transition active:scale-95'
  const irALaTienda = () => alCambiarModo('tienda')
  const categorias = CATEGORIAS.filter((c) => seccion.categorias.includes(c.id)).sort((a, b) => seccion.categorias.indexOf(a.id) - seccion.categorias.indexOf(b.id))
  // En ojos, gestos, lentes y detalles, la vista previa quita la máscara que tapa la cara (lo guardado no cambia).
  const vista = conCaraALaVista(probando, enCriaturas || enBailes ? null : categoria)
  const conjuntoProbado = prueba.item?.categoria === 'conjunto' ? prueba.item : null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Encabezado alVolver={alVolver} titulo={enTienda ? 'Tienda' : 'Mi ropero'}>
        {enTienda ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amarillo px-3.5 py-1 text-2xl font-bold text-tinta shadow-md apaisado:py-0.5 apaisado:text-xl" aria-label={`${perfil.monedas} monedas`}>
            🪙 {perfil.monedas}
          </span>
        ) : (
          <Monedas cantidad={perfil.monedas} />
        )}
        <button
          onClick={() => alCambiarModo(enTienda ? 'ropero' : 'tienda')}
          className={`flex min-h-11 shrink-0 items-center gap-1 rounded-full px-3 py-2 text-sm font-bold shadow-sm apaisado:py-1.5 ${enTienda ? 'bg-petroleo text-white' : 'bg-naranjo text-white'} ${animar}`}
        >
          <span aria-hidden>{enTienda ? '👕' : '🛍️'}</span> {enTienda ? 'Ropero' : 'Tienda'}
        </button>
      </Encabezado>

      {/* Celular vertical: Ciempi arriba y debajo la tienda. Celular horizontal y tablet: dos columnas. */}
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-2 px-4 pb-2 pt-1 dos-columnas:max-w-5xl dos-columnas:flex-row dos-columnas:gap-4 apaisado:gap-3 apaisado:pt-0">
        <div className="flex shrink-0 flex-col gap-2 dos-columnas:min-h-0 dos-columnas:w-[40%] dos-columnas:justify-start apaisado:w-[38%]">
          {/* Ciempi grande, siempre a la vista. */}
          <div
            className={`relative w-full shrink-0 overflow-hidden rounded-3xl shadow-sm ${compacto ? 'h-[clamp(9rem,25dvh,13rem)]' : 'h-[clamp(10rem,32dvh,18rem)]'} ${tranquilo ? '' : 'transition-[height] duration-300 ease-out'} dos-columnas:aspect-square dos-columnas:h-auto dos-columnas:max-h-full`}
          >
            <FondoTema fondo={vista.fondo} />
            <div className="pointer-events-none absolute inset-x-[6%] bottom-3 top-11 flex items-end justify-center">
              <CiempiPersonaje apariencia={vista} ancho="100%" className="max-h-full" animado={!tranquilo || bailando} tranquilo={tranquilo} festejarCambios={!tranquilo} accion={accionPrevia} />
            </div>
            {/* Lo que come, frente a su boca */}
            <svg viewBox="-14 -14 28 28" className="pointer-events-none absolute bottom-7 right-[4%] h-9 w-9 apaisado:bottom-5 apaisado:h-7 apaisado:w-7" aria-hidden>
              <Comida comida={vista.comida} x={0} y={0} tamano={12} />
            </svg>
            {estreno && (
              <p role="status" className="aparecer absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 font-bold text-naranjo shadow-sm">
                {estreno} 🎉
              </p>
            )}
            {vista !== probando && (
              <p className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-tinta-suave shadow-sm">
                👀 Sin máscara, para ver la cara
              </p>
            )}
            {/* El nombre se cambia desde aquí, para no quitarle espacio a Ciempi. */}
            <button
              onClick={() => setEditandoNombre(!editandoNombre)}
              aria-expanded={editandoNombre}
              className="absolute bottom-2 left-2 min-h-11 rounded-full bg-white/95 px-3 py-1.5 font-bold text-petroleo shadow-sm active:scale-95"
            >
              ✏️ {perfil.ciempi.nombre}
            </button>
          </div>

          {editandoNombre && (
          <div className="aparecer flex flex-wrap items-end gap-3">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-sm font-bold text-tinta-suave">Su nombre</span>
              <input
                value={nombre}
                maxLength={20}
                onChange={(e) => setNombre(e.target.value)}
                onBlur={guardarNombre}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  ;(e.currentTarget as HTMLInputElement).blur()
                  setEditandoNombre(false)
                }}
                className="campo"
              />
            </label>
            <div className="flex gap-1.5" role="group" aria-label="Es">
              {(
                [
                  ['nino', 'Niño'],
                  ['nina', 'Niña'],
                ] as const
              ).map(([g, etiqueta]) => (
                <button
                  key={g}
                  aria-pressed={probando.genero === g}
                  onClick={() => cambiarGenero(g)}
                  className={`min-h-11 rounded-full px-4 py-2.5 font-bold ${probando.genero === g ? 'bg-petroleo text-white' : 'bg-white text-tinta-suave'}`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>
          )}
        </div>

        {/* La tienda: pestañas fijas, la grilla con su propio desplazamiento y, debajo, la barra de compra. */}
        <div className="@container flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          {/* Primero dónde (cabeza, cuerpo, su mundo, conjuntos) y después qué. */}
          <div className="grid shrink-0 grid-cols-6 gap-1" role="tablist" aria-label="Secciones">
            {SECCIONES.map((s) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={seccion.id === s.id}
                onClick={() => irA(s)}
                className={`flex min-h-11 min-w-0 flex-col items-center justify-center rounded-2xl px-0.5 py-1.5 text-[11px] font-bold leading-tight tracking-tight apaisado:py-1 @lg:text-xs ${animar} ${seccion.id === s.id ? 'bg-petroleo text-white shadow-md' : `${s.fondo} text-tinta shadow-sm`}`}
              >
                <span className="text-2xl leading-none apaisado:text-base" aria-hidden>
                  {s.emoji}
                </span>
                <span className="max-w-full whitespace-nowrap">{s.nombre}</span>
              </button>
            ))}
          </div>
          {enCriaturas && (
            <TiendaCriaturas
              probando={probando}
              puesta={perfil.ciempi}
              modo={modo}
              alIrATienda={irALaTienda}
              tranquilo={tranquilo}
              inventario={inventario}
              monedas={perfil.monedas}
              ocupado={ocupado}
              alProbar={probarCriatura}
              alUsar={(c) => void usarCriatura(c)}
              alComprar={comprarCriatura}
              alVolverALoMio={volverALoMio}
              especie={especie}
              alCambiarEspecie={cambiarEspecie}
              lista={lista}
              alDesplazar={alDesplazar}
              error={<MensajeError error={error} />}
            />
          )}
          {!enCriaturas && !enBailes && categorias.length > 1 && (
            <PestanasDeslizables etiqueta={seccion.nombre} elegida={categoria}>
              {categorias.map((c) => (
                <button key={c.id} role="tab" aria-selected={categoria === c.id} onClick={() => irACategoria(c.id)} className={clasePestana(categoria === c.id)}>
                  <span aria-hidden>{c.emoji}</span> {c.nombre}
                </button>
              ))}
            </PestanasDeslizables>
          )}
          {!enCriaturas && (
            <div ref={lista} onScroll={alDesplazar} className="-mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-1 pb-1 pt-0.5">
              {enBailes && enTienda && <p className="text-sm text-tinta-suave">Toca un baile para verlo. Después, toca a {perfil.ciempi.nombre} en el inicio para elegir qué baila.</p>}
              {enBailes && !enTienda && <p className="text-sm text-tinta-suave">⭐ Elige con qué baile celebra {perfil.ciempi.nombre} cuando terminas un cuento.</p>}
              {enBailes && bailes.length === 0 && (
                <Vacio fondo={seccion.fondo} enTienda={enTienda} alIrALaTienda={irALaTienda}>
                  ¡Ya tienes todos los bailes! 🎉
                </Vacio>
              )}
              {enBailes && bailes.length > 0 && (
                <GrillaBailes
                  bailes={bailes}
                  apariencia={probando}
                  enTienda={enTienda}
                  tranquilo={tranquilo}
                  monedas={perfil.monedas}
                  elegido={baileVisto?.id ?? null}
                  celebracion={bailePorId(perfil.ciempi.celebracion)?.id ?? ''}
                  fondo={seccion.fondo}
                  ocupado={ocupado}
                  alElegir={mirarBaile}
                  alCelebrar={(b) => void elegirCelebracion(b)}
                />
              )}
              {aviso && <p className="shrink-0 rounded-2xl bg-amarillo/40 px-3 py-2 text-sm font-bold">{aviso}</p>}
              {enTienda && categoria === 'conjunto' && <p className="text-sm text-tinta-suave">Un conjunto viste a Ciempi entero y sale más barato que comprar cada cosa.</p>}

              {!enBailes && tarjetas.length === 0 && (
                <Vacio fondo={seccion.fondo} enTienda={enTienda} alIrALaTienda={irALaTienda}>
                  {enTienda ? '¡Ya tienes todo aquí! 🎉' : `Todavía no tienes ${(CATEGORIAS.find((c) => c.id === categoria)?.nombre ?? 'nada').toLowerCase()}.`}
                </Vacio>
              )}
              {!enBailes && tarjetas.length > 0 && (
                <ul className={`grid shrink-0 grid-cols-3 content-start gap-2.5 rounded-3xl p-2.5 ${seccion.fondo} apaisado:gap-2 apaisado:p-2 @xl:grid-cols-4`}>
                  {tarjetas.map((t) => {
                    const puesto = llevaTarjeta(perfil.ciempi, t)
                    const elegido = llevaTarjeta(probando, t) && (t.item.categoria !== 'conjunto' || conjuntoProbado?.id === t.item.id || puesto)
                    const precio = precioDe(t.item, inventario)
                    const alcanza = perfil.monedas >= precio
                    const ahorro = enTienda ? ahorroDe(t.item, inventario) : 0
                    return (
                      <li key={t.clave}>
                        <button
                          onClick={() => elegir(t)}
                          aria-pressed={elegido}
                          className={`relative flex h-full min-h-11 w-full flex-col items-center gap-1 rounded-2xl bg-white p-1.5 pb-2 shadow-md ${animar} ${elegido ? 'ring-4 ring-petroleo' : ''}`}
                        >
                          {enTienda && esNuevo(t.item.id) && <SelloNuevo />}
                          <Miniatura tarjeta={t} base={vista} />
                          <span className="text-center text-sm font-bold leading-tight [overflow-wrap:anywhere] [hyphens:auto]" lang="es">
                            {t.color ? t.color.nombre : t.item.nombre}
                          </span>
                          {t.color && <span className="-mt-1 text-center text-xs leading-tight text-tinta-suave">{t.item.nombre}</span>}
                          {enTienda ? (
                            <>
                              <Precio precio={precio} alcanza={alcanza} />
                              {!alcanza && <span className="-mt-0.5 text-[11px] font-bold leading-tight text-tinta-suave">Te faltan {precio - perfil.monedas}</span>}
                              {alcanza && ahorro > 0 && <span className="-mt-0.5 text-[11px] font-bold text-verde">Ahorras {ahorro}</span>}
                            </>
                          ) : (
                            <span className={`mt-auto text-xs font-bold ${puesto ? 'text-verde' : 'text-petroleo'}`}>{puesto ? '✓ Puesto' : 'Ponérmelo'}</span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                  {!enTienda && <MasEnLaTienda alIrALaTienda={irALaTienda} />}
                </ul>
              )}
              <MensajeError error={error} />
            </div>
          )}

          {baileAComprar && (
            <BarraCompra>
              <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                <p className="min-w-0 basis-full text-sm leading-snug @md:flex-1 @md:basis-0">
                  <span aria-hidden>{baileAComprar.emoji}</span> <span className="font-bold">{baileAComprar.nombre}</span>
                  {perfil.monedas < baileAComprar.precio && (
                    <>
                      {' '}
                      · Te faltan <span className="font-bold text-naranjo">{baileAComprar.precio - perfil.monedas} 🪙</span>: ¡sigue leyendo!
                    </>
                  )}
                </p>
                <button onClick={() => mirarBaile(baileAComprar)} className="mr-auto min-h-11 shrink-0 text-sm font-bold text-petroleo underline underline-offset-4 @md:mr-0">
                  ↻ Otra vez
                </button>
                <BotonPrincipal onClick={() => void comprarBaile(baileAComprar)} disabled={ocupado || perfil.monedas < baileAComprar.precio} className="min-h-11 shrink-0 px-4 py-2 text-base">
                  Comprar · 🪙 {baileAComprar.precio}
                </BotonPrincipal>
              </div>
            </BarraCompra>
          )}

          {/* Una sola cosa nueva a la vez: su nombre, su precio y comprarla. */}
          {enTienda && !enCriaturas && !enBailes && compra && (
            <BarraCompra>
              <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                <p className="min-w-0 basis-full text-sm leading-snug @md:flex-1 @md:basis-0">
                  Te estás probando <span className="font-bold">{compra.item.nombre}</span>
                  {conjuntoProbado && ' (conjunto completo)'}.
                  {perfil.monedas < compra.precio && (
                    <>
                      {' '}
                      Te faltan <span className="font-bold text-naranjo">{compra.precio - perfil.monedas} 🪙</span>: ¡sigue leyendo!
                    </>
                  )}
                </p>
                <button onClick={volverALoMio} className="mr-auto min-h-11 shrink-0 text-sm font-bold text-petroleo underline underline-offset-4 @md:mr-0">
                  ↺ <span className="@md:hidden">Lo mío</span>
                  <span className="hidden @md:inline">Volver a lo mío</span>
                </button>
                <BotonPrincipal onClick={() => void comprar()} disabled={ocupado || perfil.monedas < compra.precio} className="min-h-11 shrink-0 px-4 py-2 text-base">
                  Comprar · 🪙 {compra.precio}
                </BotonPrincipal>
              </div>
            </BarraCompra>
          )}
          {enTienda && !enCriaturas && !enBailes && !compra && cambiado && (
            <BarraCompra>
              <button onClick={volverALoMio} className="min-h-11 self-end font-bold text-petroleo underline underline-offset-4">
                ↺ Volver a lo mío
              </button>
            </BarraCompra>
          )}
        </div>
      </div>

      {celebrarCuncuna && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-tinta/30 p-5">
          <div role="dialog" aria-label="¡Ganaste la Cuncuna!" className="aparecer flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-crema p-6 text-center shadow-xl">
            <p className="text-3xl" aria-hidden>
              🎉
            </p>
            <p className="text-2xl font-bold">¡Ganaste la Cuncuna!</p>
            <MiniaturaCriatura varianteId="variante:cuncuna-clasica" especie={ESPECIES.find((e) => e.id === 'cuncuna')!} className="h-36 w-full" />
            <p className="text-lg">Ahora {perfil.ciempi.nombre} puede ser una Cuncuna.</p>
            <BotonPrincipal onClick={() => void ponermelaCuncuna()} className="w-full">
              ¡Ponérmela!
            </BotonPrincipal>
            <button onClick={despuesCuncuna} className="font-bold text-petroleo underline underline-offset-4">
              Ahora no
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Dibujo chico de cada cosa de la tienda: su Ciempi con la pieza puesta, de cerca. */
function Miniatura({ tarjeta, base }: { tarjeta: Tarjeta; base: AparienciaCiempi }) {
  const caja = 'h-24 w-full apaisado:h-[4.5rem]'
  const { item } = tarjeta
  if (item.categoria === 'fondo')
    return (
      <div className={`${caja} relative overflow-hidden rounded-xl`} aria-hidden>
        <FondoTema fondo={item.id} />
      </div>
    )
  if (item.categoria === 'comida')
    return (
      <svg viewBox="-16 -16 32 32" className={caja} aria-hidden>
        <Comida comida={item.id} x={0} y={0} tamano={12} />
      </svg>
    )
  if (CATEGORIAS_SOLO_ACCESORIO.has(item.categoria))
    return <MiniaturaAccesorio item={item} apariencia={conColor(base, tarjeta)} color={tarjeta.color?.id} className={caja} />
  return <MiniaturaCiempi apariencia={conColor(base, tarjeta)} categoria={item.categoria} className={caja} />
}

