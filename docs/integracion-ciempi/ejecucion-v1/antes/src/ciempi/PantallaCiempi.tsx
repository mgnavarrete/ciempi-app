import { useState } from 'react'
import { sonarCelebracion } from '../audio/sonidos'
import { useRepositorios } from '../datos/DatosProvider'
import type { PerfilNino } from '../dominio/tipos'
import { BotonPrincipal, Encabezado, MensajeError, Monedas } from '../ui/comunes'
import {
  CATALOGO,
  CATEGORIAS,
  PALETAS,
  loTiene,
  variante,
  type AparienciaCiempi,
  type CategoriaCiempi,
  type Genero,
  type ItemCiempi,
} from './catalogo'
import { CiempiPersonaje } from './CiempiPersonaje'
import { Cabeza, Comida, FondoTema, Segmento } from './dibujos'

interface Props {
  perfil: PerfilNino
  alCambiarPerfil: (cambios: Partial<PerfilNino>) => void
  alVolver: () => void
}

/**
 * Armario y tienda de Ciempi. Tocar algo se lo prueba; si ya es suyo, se lo
 * pone; si no, aparece el botón para comprarlo con monedas.
 */
export function PantallaCiempi({ perfil, alCambiarPerfil, alVolver }: Props) {
  const repos = useRepositorios()
  const tranquilo = perfil.ajustes.modoTranquilo
  const [categoria, setCategoria] = useState<CategoriaCiempi>('paleta')
  // Lo que se está probando (puede incluir algo no comprado todavía).
  const [probando, setProbando] = useState<AparienciaCiempi>(perfil.ciempi)
  const [nombre, setNombre] = useState(perfil.ciempi.nombre)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [estreno, setEstreno] = useState<string | null>(null)

  const guardar = async (apariencia: AparienciaCiempi) => {
    setError(null)
    try {
      const actualizado = await repos.perfiles.actualizarCiempi(perfil.id, apariencia)
      alCambiarPerfil({ ciempi: actualizado.ciempi })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const elegir = (item: ItemCiempi) => {
    setEstreno(null)
    const nueva = { ...probando, [item.categoria]: item.id }
    setProbando(nueva)
    // Si ya es suyo, se lo pone de inmediato (sin botón extra).
    if (loTiene(perfil.inventario, item.id)) void guardar({ ...perfil.ciempi, [item.categoria]: item.id })
  }

  const comprar = async (item: ItemCiempi) => {
    setOcupado(true)
    setError(null)
    try {
      const { monedas, inventario } = await repos.perfiles.comprar(perfil.id, item.id)
      alCambiarPerfil({ monedas, inventario })
      const actualizado = await repos.perfiles.actualizarCiempi(perfil.id, { ...perfil.ciempi, [item.categoria]: item.id })
      alCambiarPerfil({ ciempi: actualizado.ciempi, monedas, inventario })
      setEstreno(item.nombre)
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
    void guardar({ ...perfil.ciempi, genero })
  }

  const guardarNombre = () => {
    const limpio = nombre.trim() || 'Ciempi'
    setNombre(limpio)
    if (limpio !== perfil.ciempi.nombre) void guardar({ ...perfil.ciempi, nombre: limpio })
  }

  // Lo que se está probando en esta categoría, si todavía no es suyo.
  const probandoId = probando[categoria]
  const porComprar = !loTiene(perfil.inventario, probandoId) ? CATALOGO.find((i) => i.id === probandoId) : undefined
  const items = CATALOGO.filter((i) => i.categoria === categoria)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Encabezado alVolver={alVolver} titulo={`Mi ${perfil.ciempi.nombre}`}>
        <Monedas cantidad={perfil.monedas} />
      </Encabezado>

      {/* En horizontal: Ciempi fijo a la izquierda; a la derecha las pestañas siempre visibles y la grilla con su propio scroll. */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-5 pb-28 pt-2 apaisado:min-h-0 apaisado:max-w-4xl apaisado:flex-row apaisado:gap-5 apaisado:overflow-hidden apaisado:pb-0 apaisado:pt-1">
        <div className="flex flex-col gap-3 apaisado:w-[38%] apaisado:shrink-0 apaisado:justify-center apaisado:pb-3">
          <div className="relative h-52 shrink-0 overflow-hidden rounded-3xl shadow-sm apaisado:h-40">
            <FondoTema fondo={probando.fondo} />
            <div className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto w-[min(78%,340px)]">
              <CiempiPersonaje apariencia={probando} ancho="100%" animado={!tranquilo} />
            </div>
            {/* Lo que come, frente a su boca */}
            <svg viewBox="-14 -14 28 28" className="pointer-events-none absolute bottom-7 right-[4%] h-9 w-9 apaisado:bottom-5 apaisado:h-7 apaisado:w-7" aria-hidden>
              <Comida comida={probando.comida} x={0} y={0} tamano={12} />
            </svg>
            {estreno && (
              <p role="status" className="aparecer absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 font-bold text-naranjo shadow-sm">
                ¡{estreno} nuevo! 🎉
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-sm font-bold text-tinta-suave">Su nombre</span>
              <input
                value={nombre}
                maxLength={20}
                onChange={(e) => setNombre(e.target.value)}
                onBlur={guardarNombre}
                onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
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
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 apaisado:min-h-0 apaisado:gap-2">
          <div className="-mx-5 flex shrink-0 gap-2 overflow-x-auto px-5 pb-1 apaisado:mx-0 apaisado:px-0" role="tablist">
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={categoria === c.id}
                onClick={() => setCategoria(c.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 font-bold apaisado:px-3 apaisado:py-1.5 apaisado:text-sm ${categoria === c.id ? 'bg-petroleo text-white' : 'bg-white text-tinta'}`}
              >
                <span aria-hidden>{c.emoji}</span> {c.nombre}
              </button>
            ))}
          </div>

          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 apaisado:min-h-0 apaisado:flex-1 apaisado:grid-cols-4 apaisado:content-start apaisado:gap-2 apaisado:overflow-y-auto apaisado:p-1 apaisado:pb-24">
            {items.map((item) => {
              const suyo = loTiene(perfil.inventario, item.id)
              const puesto = perfil.ciempi[item.categoria] === item.id
              const elegido = probando[item.categoria] === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => elegir(item)}
                    aria-pressed={elegido}
                    className={`flex w-full flex-col items-center gap-1 rounded-2xl bg-white p-2 pb-2.5 shadow-sm transition active:scale-95 ${elegido ? 'ring-4 ring-petroleo' : ''}`}
                  >
                    <Miniatura item={item} base={probando} />
                    <span className="text-center text-sm font-bold leading-tight">{item.nombre}</span>
                    <span className={`text-xs font-bold ${puesto ? 'text-verde' : suyo ? 'text-petroleo' : 'text-naranjo'}`}>
                      {puesto ? '✓ Puesto' : suyo ? 'Usar' : `🪙 ${item.precio}`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <MensajeError error={error} />
        </div>
      </div>

      {porComprar && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-3xl items-center gap-3 border-t border-[#e2d6bf] bg-crema/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur apaisado:max-w-4xl apaisado:py-2">
          <p className="min-w-0 flex-1 text-sm">
            Te estás probando <span className="font-bold">{porComprar.nombre}</span>.
            {perfil.monedas < porComprar.precio && (
              <>
                {' '}
                Te faltan <span className="font-bold text-naranjo">{porComprar.precio - perfil.monedas} 🪙</span>: ¡sigue leyendo!
              </>
            )}
          </p>
          <BotonPrincipal onClick={() => void comprar(porComprar)} disabled={ocupado || perfil.monedas < porComprar.precio} className="shrink-0 px-5 py-2.5 text-base">
            Comprar 🪙 {porComprar.precio}
          </BotonPrincipal>
        </div>
      )}
    </div>
  )
}

/** Dibujo chico de cada cosa de la tienda. */
function Miniatura({ item, base }: { item: ItemCiempi; base: AparienciaCiempi }) {
  const conItem = { ...base, [item.categoria]: item.id }
  const caja = 'h-16 w-full apaisado:h-12'
  switch (item.categoria) {
    case 'paleta': {
      const p = PALETAS[variante(item.id)]
      return (
        <div className={`${caja} flex items-center justify-center gap-1`} aria-hidden>
          {[...p.cuerpo.slice(0, 4), p.cabeza].map((c, i) => (
            <span key={i} className="h-6 w-6 rounded-full border-2 border-[#223d5d]" style={{ background: c }} />
          ))}
        </div>
      )
    }
    case 'cabeza':
      return (
        <svg viewBox="-34 -58 68 82" className={caja} aria-hidden>
          <Cabeza apariencia={conItem} />
        </svg>
      )
    case 'cara':
    case 'ojos':
      // De cerca y sin gorro, para que se vea bien la cara.
      return (
        <svg viewBox="-22 -24 46 46" className={caja} aria-hidden>
          <Cabeza apariencia={{ ...conItem, cabeza: 'cabeza-nada' }} />
        </svg>
      )
    case 'forma':
    case 'pies':
    case 'diseno':
      return (
        // Para los zapatos se acerca la vista a las patitas.
        <svg viewBox={item.categoria === 'pies' ? '8 36 44 26' : '0 0 60 64'} className={caja} aria-hidden>
          <Segmento x={30} y={26} r={18} color={PALETAS[variante(base.paleta)]?.cuerpo[0] ?? '#3a9fb1'} indice={0} apariencia={conItem} />
        </svg>
      )
    case 'fondo':
      return (
        <div className={`${caja} relative overflow-hidden rounded-xl`} aria-hidden>
          <FondoTema fondo={item.id} />
        </div>
      )
    case 'comida':
      return (
        <svg viewBox="-16 -16 32 32" className={caja} aria-hidden>
          <Comida comida={item.id} x={0} y={0} tamano={12} />
        </svg>
      )
  }
}
