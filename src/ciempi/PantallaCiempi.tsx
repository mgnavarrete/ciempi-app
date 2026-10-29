import { useState } from 'react'
import { sonarCelebracion } from '../audio/sonidos'
import { useRepositorios } from '../datos/DatosProvider'
import type { PerfilNino } from '../dominio/tipos'
import { BotonPrincipal, Encabezado, MensajeError, Monedas } from '../ui/comunes'
import {
  CATALOGO,
  CATEGORIAS,
  PARTES,
  VARIANTES,
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

/**
 * Armario y tienda de Ciempi (solo los diseños nuevos). Tocar algo se lo
 * prueba; si ya es suyo, se lo pone; si no, aparece el botón para comprarlo
 * con monedas. Un conjunto se prueba entero y se compra como pack.
 */
export function PantallaCiempi({ perfil, alCambiarPerfil, alVolver }: Props) {
  const repos = useRepositorios()
  const tranquilo = perfil.ajustes.modoTranquilo
  const [categoria, setCategoria] = useState<CategoriaCiempi>('conjunto')
  // Lo que se está probando (puede incluir algo no comprado todavía).
  const [probando, setProbando] = useState<AparienciaCiempi>(perfil.ciempi)
  const [nombre, setNombre] = useState(perfil.ciempi.nombre)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [estreno, setEstreno] = useState<string | null>(null)
  // El último conjunto que se probó (para ofrecer el pack).
  const [conjunto, setConjunto] = useState<ItemCiempi | null>(null)
  const inventario = perfil.inventario

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
    setConjunto(item.categoria === 'conjunto' ? item : null)
    setProbando(ponerItem(probando, item))
    // Si ya es suyo, se lo pone de inmediato (sin botón extra), sobre lo que tiene guardado.
    const puesta = ponerItem(perfil.ciempi, item)
    if (PARTES.every((p) => loTiene(inventario, puesta[p]))) void guardar(puesta)
  }

  const elegirVariante = (parte: keyof VariantesCiempi, id: string) => {
    setProbando({ ...probando, variantes: { ...probando.variantes, [parte]: id } })
    // El color viene con la pieza: si la tiene puesta, se guarda.
    if (perfil.ciempi[parte] === probando[parte]) void guardar({ ...perfil.ciempi, variantes: { ...perfil.ciempi.variantes, [parte]: id } })
  }

  const comprar = async (item: ItemCiempi) => {
    setOcupado(true)
    setError(null)
    try {
      const { monedas, inventario } = await repos.perfiles.comprar(perfil.id, item.id)
      alCambiarPerfil({ monedas, inventario })
      // Se pone lo comprado (con el color que se estaba probando).
      const puesta = ponerItem(perfil.ciempi, item)
      if (item.categoria !== 'conjunto' && item.categoria in probando.variantes) {
        const parte = item.categoria as keyof VariantesCiempi
        puesta.variantes = { ...puesta.variantes, [parte]: probando.variantes[parte] }
      }
      const actualizado = await repos.perfiles.actualizarCiempi(perfil.id, puesta)
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

  // Lo que se está probando y todavía no es suyo: el conjunto entero o la pieza de esta categoría.
  const enCategoria = categoria === 'conjunto' ? conjunto : buscarItem(probando[categoria])
  const porComprar = enCategoria && !loTiene(inventario, enCategoria.id) && lleva(probando, enCategoria) ? enCategoria : undefined
  const precio = porComprar ? precioDe(porComprar, inventario) : 0
  const items = CATALOGO.filter((i) => i.categoria === categoria)
  // Colores de la pieza de esta categoría (bufandas, capas y algunos lentes).
  const parteConColores = (['cara', 'cuello', 'espalda'] as const).find((p) => p === categoria)
  const colores = parteConColores ? VARIANTES[probando[parteConColores]] : undefined

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
              <CiempiPersonaje apariencia={probando} ancho="100%" animado={!tranquilo} festejarCambios={!tranquilo} />
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
              const suyo = loTiene(inventario, item.id)
              const puesto = lleva(perfil.ciempi, item)
              const elegido = lleva(probando, item) && (item.categoria !== 'conjunto' || conjunto?.id === item.id)
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
                      {puesto ? '✓ Puesto' : suyo ? 'Usar' : `🪙 ${precioDe(item, inventario)}`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {colores && parteConColores && (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Colores">
              <span className="text-sm font-bold text-tinta-suave">Colores:</span>
              {colores.map((v) => (
                <button
                  key={v.id}
                  aria-pressed={(probando.variantes[parteConColores] ?? colores[0].id) === v.id}
                  onClick={() => elegirVariante(parteConColores, v.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-bold ${(probando.variantes[parteConColores] ?? colores[0].id) === v.id ? 'bg-petroleo text-white' : 'bg-white'}`}
                >
                  {v.nombre}
                </button>
              ))}
            </div>
          )}
          {categoria === 'conjunto' && <p className="text-sm text-tinta-suave">Un conjunto cuesta menos que sus piezas por separado, y no se cobra lo que ya tienes.</p>}
          <MensajeError error={error} />
        </div>
      </div>

      {porComprar && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-3xl items-center gap-3 border-t border-[#e2d6bf] bg-crema/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur apaisado:max-w-4xl apaisado:py-2">
          <p className="min-w-0 flex-1 text-sm">
            Te estás probando <span className="font-bold">{porComprar.nombre}</span>.
            {perfil.monedas < precio && (
              <>
                {' '}
                Te faltan <span className="font-bold text-naranjo">{precio - perfil.monedas} 🪙</span>: ¡sigue leyendo!
              </>
            )}
          </p>
          <BotonPrincipal onClick={() => void comprar(porComprar)} disabled={ocupado || perfil.monedas < precio} className="shrink-0 px-5 py-2.5 text-base">
            Comprar 🪙 {precio}
          </BotonPrincipal>
        </div>
      )}
    </div>
  )
}

/** Dibujo chico de cada cosa de la tienda: su Ciempi con la pieza puesta, de cerca. */
function Miniatura({ item, base }: { item: ItemCiempi; base: AparienciaCiempi }) {
  const caja = 'h-16 w-full apaisado:h-12'
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
  return <MiniaturaCiempi apariencia={ponerItem(base, item)} categoria={item.categoria} className={caja} />
}
