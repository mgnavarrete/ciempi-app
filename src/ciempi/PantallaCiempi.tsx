import { useRef, useState } from 'react'
import { sonarCelebracion } from '../audio/sonidos'
import { useRepositorios } from '../datos/DatosProvider'
import type { PerfilNino } from '../dominio/tipos'
import { BotonPrincipal, Encabezado, MensajeError, Monedas } from '../ui/comunes'
import {
  CATALOGO,
  CATEGORIAS,
  CONJUNTOS,
  PARTES,
  SIN_ESTAMPADO,
  VARIANTES,
  ahorroDe,
  buscarItem,
  lleva,
  loTiene,
  ponerItem,
  precioDe,
  type AparienciaCiempi,
  type CategoriaCiempi,
  type Genero,
  type ItemCiempi,
  type VariantesCiempi,
} from './catalogo'
import { CiempiPersonaje } from './CiempiPersonaje'
import { Comida, FondoTema } from './dibujos'
import { MiniaturaCiempi } from './v2/Miniatura'

interface Props {
  perfil: PerfilNino
  alCambiarPerfil: (cambios: Partial<PerfilNino>) => void
  alVolver: () => void
}

/** La tienda ordenada como se viste a Ciempi: cabeza, cuerpo, su mundo y, al final, conjuntos completos. */
const SECCIONES: { id: string; nombre: string; emoji: string; categorias: CategoriaCiempi[] }[] = [
  { id: 'cabeza', nombre: 'Cabeza', emoji: '🎩', categorias: ['cabeza', 'pelo', 'cara', 'gesto', 'ojos', 'detalle'] },
  { id: 'cuerpo', nombre: 'Cuerpo', emoji: '🐛', categorias: ['paleta', 'textura', 'cuello', 'espalda', 'pies'] },
  { id: 'mundo', nombre: 'Su mundo', emoji: '🏞️', categorias: ['fondo', 'comida'] },
  { id: 'conjuntos', nombre: 'Conjuntos', emoji: '🦸', categorias: ['conjunto'] },
]

/** Una tarjeta de la tienda: una pieza o uno de sus colores (todos vienen con la pieza). */
interface Tarjeta {
  clave: string
  item: ItemCiempi
  color?: { id: string; nombre: string }
}
const tarjetasDe = (categoria: CategoriaCiempi): Tarjeta[] =>
  CATALOGO.filter((i) => i.categoria === categoria).flatMap((item) =>
    VARIANTES[item.id] ? VARIANTES[item.id].map((color) => ({ clave: `${item.id}|${color.id}`, item, color })) : [{ clave: item.id, item }],
  )
const conColor = (a: AparienciaCiempi, t: Tarjeta): AparienciaCiempi => {
  const puesta = ponerItem(a, t.item)
  return t.color ? { ...puesta, variantes: { ...puesta.variantes, [t.item.categoria]: t.color.id } } : puesta
}
const colorPuesto = (a: AparienciaCiempi, t: Tarjeta) => {
  const parte = t.item.categoria as keyof VariantesCiempi
  return !t.color || (a.variantes[parte] ?? VARIANTES[t.item.id][0].id) === t.color.id
}
const llevaTarjeta = (a: AparienciaCiempi, t: Tarjeta) => lleva(a, t.item) && colorPuesto(a, t)
/** Lo que se ve de Ciempi (sin nombre ni género). */
const look = (a: AparienciaCiempi) => JSON.stringify([...PARTES.map((p) => a[p]), a.variantes])

/**
 * Armario y tienda de Ciempi (solo los diseños nuevos). Tocar algo se lo
 * prueba; si ya es suyo, se lo pone; si no, abajo aparece qué falta comprar.
 * «Volver a lo mío» deshace las pruebas. Un conjunto se prueba entero y se
 * compra como pack.
 */
export function PantallaCiempi({ perfil, alCambiarPerfil, alVolver }: Props) {
  const repos = useRepositorios()
  const tranquilo = perfil.ajustes.modoTranquilo
  const [seccion, setSeccion] = useState(SECCIONES[0])
  const [categoria, setCategoria] = useState<CategoriaCiempi>('cabeza')
  // Lo que se está probando (puede incluir cosas no compradas todavía).
  const [probando, setProbando] = useState<AparienciaCiempi>(perfil.ciempi)
  const [nombre, setNombre] = useState(perfil.ciempi.nombre)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [estreno, setEstreno] = useState<string | null>(null)
  const [editandoNombre, setEditandoNombre] = useState(false)
  // El último conjunto que se probó (para ofrecer el pack).
  const [conjunto, setConjunto] = useState<ItemCiempi | null>(null)
  // Lo guardado y el inventario más recientes (las compras seguidas no esperan a que la pantalla se redibuje).
  const guardado = useRef(perfil.ciempi)
  guardado.current = perfil.ciempi
  const inventario = perfil.inventario

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

  const irA = (s: (typeof SECCIONES)[number]) => {
    setSeccion(s)
    setCategoria(s.categorias[0])
  }

  const elegir = (t: Tarjeta) => {
    setEstreno(null)
    setAviso(t.item.categoria === 'paleta' && probando.textura !== SIN_ESTAMPADO ? 'Quitamos el estampado para que se vean los colores.' : null)
    setConjunto(t.item.categoria === 'conjunto' ? t.item : null)
    setProbando(conColor(probando, t))
    // Si ya es suyo, se lo pone de inmediato (sin botón extra), sobre lo que tiene guardado.
    const puesta = conColor(guardado.current, t)
    if (PARTES.every((p) => loTiene(inventario, puesta[p]))) void guardar(puesta)
  }

  const volverALoMio = () => {
    setProbando(guardado.current)
    setConjunto(null)
    setAviso(null)
  }

  // Lo que se está probando y todavía no es suyo: un conjunto entero, o pieza por pieza.
  const packProbado = conjunto && lleva(probando, conjunto) && !loTiene(inventario, conjunto.id) ? conjunto : null
  const enPack = new Set(packProbado ? (CONJUNTOS.find((c) => c.id === packProbado.id)?.piezas ?? []) : [])
  const pendientes = [
    ...(packProbado ? [packProbado] : []),
    ...PARTES.map((p) => buscarItem(probando[p])).filter((i): i is ItemCiempi => !!i && !loTiene(inventario, i.id) && !enPack.has(i.id)),
  ]
  const total = pendientes.reduce((s, i) => s + precioDe(i, inventario), 0)
  const cambiado = look(probando) !== look(perfil.ciempi)

  const comprar = async (items: ItemCiempi[]) => {
    setOcupado(true)
    setError(null)
    try {
      let inv = inventario
      let puesta = guardado.current
      let monedas = perfil.monedas
      for (const item of items) {
        const r = await repos.perfiles.comprar(perfil.id, item.id, precioDe(item, inv))
        inv = r.inventario
        monedas = r.monedas
        // Se pone lo comprado tal como se lo estaba probando (con su color).
        puesta = ponerItem(puesta, item)
        if (item.categoria === 'conjunto') puesta = { ...puesta, variantes: { ...puesta.variantes, ...CONJUNTOS.find((c) => c.id === item.id)?.variantes } }
        else if (item.categoria in probando.variantes) {
          const parte = item.categoria as keyof VariantesCiempi
          puesta = { ...puesta, variantes: { ...puesta.variantes, [parte]: probando.variantes[parte] } }
        }
      }
      alCambiarPerfil({ monedas, inventario: inv })
      const actualizado = await repos.perfiles.actualizarCiempi(perfil.id, puesta)
      guardado.current = actualizado.ciempi
      alCambiarPerfil({ ciempi: actualizado.ciempi, monedas, inventario: inv })
      setProbando(actualizado.ciempi)
      setConjunto(null)
      setEstreno(items.length === 1 ? `¡${items[0].nombre} nuevo!` : '¡Todo nuevo!')
      if (!tranquilo) sonarCelebracion()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  const cambiarGenero = (g: Genero) => {
    const genero = probando.genero === g ? null : g
    setProbando({ ...probando, genero })
    void guardar({ ...guardado.current, genero })
  }

  const guardarNombre = () => {
    const limpio = nombre.trim() || 'Ciempi'
    setNombre(limpio)
    if (limpio !== perfil.ciempi.nombre) void guardar({ ...guardado.current, nombre: limpio })
  }

  const tarjetas = tarjetasDe(categoria)
  const categorias = CATEGORIAS.filter((c) => seccion.categorias.includes(c.id)).sort((a, b) => seccion.categorias.indexOf(a.id) - seccion.categorias.indexOf(b.id))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Encabezado alVolver={alVolver} titulo={`Mi ${perfil.ciempi.nombre}`}>
        <Monedas cantidad={perfil.monedas} />
      </Encabezado>

      {/* En horizontal: Ciempi fijo a la izquierda; a la derecha las secciones y la grilla con su propio scroll. */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-5 pb-32 pt-2 apaisado:min-h-0 apaisado:max-w-4xl apaisado:flex-row apaisado:gap-5 apaisado:overflow-hidden apaisado:pb-0 apaisado:pt-1">
        <div className="flex flex-col gap-3 apaisado:w-[38%] apaisado:shrink-0 apaisado:justify-center apaisado:pb-3">
          {/* Ciempi grande, de las monedas hasta las secciones. */}
          <div className="relative h-72 shrink-0 overflow-hidden rounded-3xl shadow-sm apaisado:h-56">
            <FondoTema fondo={probando.fondo} />
            <div className="pointer-events-none absolute inset-x-0 bottom-3 mx-auto w-[min(86%,440px)]">
              <CiempiPersonaje apariencia={probando} ancho="100%" animado={!tranquilo} festejarCambios={!tranquilo} />
            </div>
            {/* Lo que come, frente a su boca */}
            <svg viewBox="-14 -14 28 28" className="pointer-events-none absolute bottom-7 right-[4%] h-9 w-9 apaisado:bottom-5 apaisado:h-7 apaisado:w-7" aria-hidden>
              <Comida comida={probando.comida} x={0} y={0} tamano={12} />
            </svg>
            {estreno && (
              <p role="status" className="aparecer absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 font-bold text-naranjo shadow-sm">
                {estreno} 🎉
              </p>
            )}
            {cambiado && (
              <button onClick={volverALoMio} className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1.5 font-bold text-petroleo shadow-sm active:scale-95">
                ↺ Volver a lo mío
              </button>
            )}
            {/* El nombre se cambia desde aquí, para no quitarle espacio a Ciempi. */}
            <button
              onClick={() => setEditandoNombre(!editandoNombre)}
              aria-expanded={editandoNombre}
              className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1.5 font-bold text-petroleo shadow-sm active:scale-95"
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
                  className={`rounded-full px-4 py-2.5 font-bold ${probando.genero === g ? 'bg-petroleo text-white' : 'bg-white text-tinta-suave'}`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 apaisado:min-h-0 apaisado:gap-2">
          {/* Primero dónde (cabeza, cuerpo, su mundo, conjuntos) y después qué. */}
          <div className="grid shrink-0 grid-cols-4 gap-2" role="tablist" aria-label="Secciones">
            {SECCIONES.map((s) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={seccion.id === s.id}
                onClick={() => irA(s)}
                className={`flex flex-col items-center rounded-2xl px-1 py-2 font-bold leading-tight apaisado:py-1.5 apaisado:text-sm ${seccion.id === s.id ? 'bg-petroleo text-white shadow-md' : 'bg-white text-tinta shadow-sm'}`}
              >
                <span className="text-2xl apaisado:text-xl" aria-hidden>
                  {s.emoji}
                </span>
                {s.nombre}
              </button>
            ))}
          </div>
          {categorias.length > 1 && (
            <div className="-mx-5 flex shrink-0 gap-2 overflow-x-auto px-5 pb-1 apaisado:mx-0 apaisado:px-0" role="tablist" aria-label={seccion.nombre}>
              {categorias.map((c) => (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={categoria === c.id}
                  onClick={() => setCategoria(c.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 font-bold apaisado:px-3 apaisado:py-1.5 apaisado:text-sm ${categoria === c.id ? 'bg-naranjo text-white' : 'bg-white text-tinta'}`}
                >
                  <span aria-hidden>{c.emoji}</span> {c.nombre}
                </button>
              ))}
            </div>
          )}
          {aviso && <p className="rounded-2xl bg-amarillo/40 px-3 py-2 text-sm font-bold">{aviso}</p>}
          {categoria === 'conjunto' && <p className="text-sm text-tinta-suave">Un conjunto viste a Ciempi entero y sale más barato que comprar cada cosa.</p>}

          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 apaisado:min-h-0 apaisado:flex-1 apaisado:grid-cols-4 apaisado:content-start apaisado:gap-2 apaisado:overflow-y-auto apaisado:p-1 apaisado:pb-24">
            {tarjetas.map((t) => {
              const suyo = loTiene(inventario, t.item.id)
              const puesto = llevaTarjeta(perfil.ciempi, t)
              const elegido = llevaTarjeta(probando, t) && (t.item.categoria !== 'conjunto' || conjunto?.id === t.item.id || puesto)
              const ahorro = !suyo ? ahorroDe(t.item, inventario) : 0
              return (
                <li key={t.clave}>
                  <button
                    onClick={() => elegir(t)}
                    aria-pressed={elegido}
                    className={`flex w-full flex-col items-center gap-1 rounded-2xl bg-white p-2 pb-2.5 shadow-sm transition active:scale-95 ${elegido ? 'ring-4 ring-petroleo' : ''}`}
                  >
                    <Miniatura tarjeta={t} base={probando} />
                    <span className="text-center text-sm font-bold leading-tight">{t.color ? t.color.nombre : t.item.nombre}</span>
                    {t.color && <span className="-mt-1 text-center text-[11px] leading-tight text-tinta-suave">{t.item.nombre}</span>}
                    <span className={`text-xs font-bold ${puesto ? 'text-verde' : suyo ? 'text-petroleo' : 'text-naranjo'}`}>
                      {puesto ? '✓ Puesto' : suyo ? 'Usar' : `🪙 ${precioDe(t.item, inventario)}`}
                    </span>
                    {ahorro > 0 && <span className="-mt-1 text-[11px] font-bold text-verde">Ahorras {ahorro}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
          <MensajeError error={error} />
        </div>
      </div>

      {pendientes.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-3xl flex-col gap-2 border-t border-[#e2d6bf] bg-crema/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur apaisado:max-w-4xl apaisado:py-2">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 text-sm">
              Te estás probando {pendientes.length === 1 ? 'algo nuevo' : `${pendientes.length} cosas nuevas`}.
              {perfil.monedas < total && (
                <>
                  {' '}
                  Te faltan <span className="font-bold text-naranjo">{total - perfil.monedas} 🪙</span>: ¡sigue leyendo!
                </>
              )}
            </p>
            <button onClick={volverALoMio} className="shrink-0 font-bold text-petroleo underline underline-offset-4">
              ↺ Volver a lo mío
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendientes.map((i) => (
              <button
                key={i.id}
                onClick={() => void comprar([i])}
                disabled={ocupado || perfil.monedas < precioDe(i, inventario)}
                className="rounded-full bg-white px-3 py-2 text-sm font-bold shadow-sm disabled:opacity-50"
              >
                {i.nombre} · 🪙 {precioDe(i, inventario)}
              </button>
            ))}
            {pendientes.length > 1 && (
              <BotonPrincipal onClick={() => void comprar(pendientes)} disabled={ocupado || perfil.monedas < total} className="px-4 py-2 text-sm">
                Comprar todo · 🪙 {total}
              </BotonPrincipal>
            )}
            {pendientes.length === 1 && (
              <BotonPrincipal onClick={() => void comprar(pendientes)} disabled={ocupado || perfil.monedas < total} className="px-5 py-2 text-base">
                Comprar · 🪙 {total}
              </BotonPrincipal>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Dibujo chico de cada cosa de la tienda: su Ciempi con la pieza puesta, de cerca. */
function Miniatura({ tarjeta, base }: { tarjeta: Tarjeta; base: AparienciaCiempi }) {
  const caja = 'h-16 w-full apaisado:h-12'
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
  return <MiniaturaCiempi apariencia={conColor(base, tarjeta)} categoria={item.categoria} className={caja} />
}
