import { useState } from 'react'
import { BotonPrincipal, BotonSecundario } from '../ui/comunes'
import { ahorroDe, buscarItem, loTiene, precioDe, soloDesbloqueo, type AparienciaCiempi } from './catalogo'
import { ESPECIES, especieDeItem, variantesDe, variantesDePaquete, miniaturaDe, type EspecieCriatura, type EspecieId } from './criaturas'

/**
 * Sección «Criaturas» de la tienda (2.5): una pestaña por especie, tarjetas
 * grandes con su miniatura, y abajo lo que se puede hacer con la que se está
 * probando. Tocar una tarjeta solo prueba (no guarda ni cobra). Comprar no
 * pone la criatura: después aparece «¡Usar ahora!». Toda compra muestra el
 * desglose y pide confirmación; `precioVisto` es el total mostrado.
 */
interface Props {
  probando: AparienciaCiempi
  /** Lo guardado (lo que tiene puesto). */
  puesta: AparienciaCiempi
  inventario: string[]
  monedas: number
  ocupado: boolean
  /** Prueba una criatura (null = Ciempi) sin guardar. */
  alProbar: (criatura: string | null) => void
  /** Se la pone (guarda). */
  alUsar: (criatura: string | null) => void
  /** Compra con el total que se mostró. Devuelve true si se compró. */
  alComprar: (itemId: string, precioVisto: number) => Promise<boolean>
  alVolverALoMio: () => void
  especie: EspecieId
  alCambiarEspecie: (e: EspecieId) => void
}

/** Lo que cuesta, por partes: la especie (si falta) y la variante o el paquete. */
export function desglose(itemId: string, inventario: string[]) {
  const item = buscarItem(itemId)!
  const e = especieDeItem(itemId)!
  const total = precioDe(item, inventario)
  const conEspecie = !inventario.includes(e.item)
  const partes: { nombre: string; precio: number }[] = []
  if (conEspecie) partes.push({ nombre: e.nombre, precio: e.precio })
  if (item.categoria === 'paquete') {
    const faltan = variantesDePaquete(e.id).filter((v) => !inventario.includes(v)).length
    partes.push({ nombre: `${faltan} ${faltan === 1 ? 'color' : 'colores'} de ${e.nombre}`, precio: total - (conEspecie ? e.precio : 0) })
  } else if (item.categoria === 'variante' && item.precio > 0) partes.push({ nombre: item.nombre, precio: item.precio })
  return { total, partes, ahorro: ahorroDe(item, inventario), texto: `${partes.map((p) => `${p.nombre} ${p.precio}`).join(' + ')}${partes.length > 1 ? ` = ${total}` : ''} 🪙` }
}

export function TiendaCriaturas(props: Props) {
  const { probando, puesta, inventario, monedas, ocupado, especie } = props
  const e = ESPECIES.find((x) => x.id === especie)!
  const bloqueada = soloDesbloqueo(e.item, inventario)
  const [confirmar, setConfirmar] = useState<string | null>(null)
  // Recién comprada (sin ponérsela todavía): ofrece «¡Usar ahora!».
  const [recien, setRecien] = useState<string | null>(null)

  const elegida = probando.criatura
  const elegidaEsDeEsta = !!elegida && especieDeItem(elegida)?.id === especie
  const suya = !!elegida && loTiene(inventario, elegida)
  const yaPuesta = probando.criatura === puesta.criatura
  const paquete = buscarItem(e.paquete)!
  const tienePaquete = loTiene(inventario, e.paquete)

  const comprar = async (itemId: string) => {
    const { total } = desglose(itemId, inventario)
    setConfirmar(null)
    if (await props.alComprar(itemId, total)) setRecien(buscarItem(itemId)?.categoria === 'variante' ? itemId : null)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-5 flex shrink-0 gap-2 overflow-x-auto px-5 pb-1 apaisado:mx-0 apaisado:px-0" role="tablist" aria-label="Criaturas">
        <button
          aria-pressed={probando.criatura === null}
          onClick={() => props.alProbar(null)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 font-bold apaisado:px-3 apaisado:py-1.5 apaisado:text-sm ${probando.criatura === null ? 'bg-petroleo text-white' : 'bg-white text-tinta'}`}
        >
          <img src="/ciempi.svg" alt="" className="h-6 w-6 rounded-full bg-white p-0.5" /> Ciempi
        </button>
        {ESPECIES.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={especie === x.id}
            onClick={() => props.alCambiarEspecie(x.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 font-bold apaisado:px-3 apaisado:py-1.5 apaisado:text-sm ${especie === x.id ? 'bg-naranjo text-white' : 'bg-white text-tinta'}`}
          >
            <span aria-hidden>{x.emoji}</span> {x.nombre}
            {soloDesbloqueo(x.item, inventario) && <span aria-label="bloqueada">🔒</span>}
          </button>
        ))}
      </div>

      {bloqueada && (
        <p className="flex items-center gap-2 rounded-2xl bg-amarillo/40 px-3 py-2 font-bold">
          <span className="text-2xl" aria-hidden>
            🔒
          </span>
          Lee 6 cuentos de nivel 0 y la Cuncuna será tuya.
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 apaisado:grid-cols-3 apaisado:gap-2">
        {variantesDe(especie).map((v) => {
          const item = buscarItem(v.item)!
          const esSuya = loTiene(inventario, v.item)
          const esPuesta = puesta.criatura === v.item
          const probada = probando.criatura === v.item
          return (
            <li key={v.id}>
              <button
                onClick={() => {
                  setRecien(null)
                  props.alProbar(v.item)
                }}
                aria-pressed={probada}
                className={`flex w-full flex-col items-center gap-1 rounded-2xl bg-white p-2 pb-2.5 shadow-sm transition active:scale-95 ${probada ? 'ring-4 ring-petroleo' : ''}`}
              >
                <MiniaturaCriatura varianteId={v.item} especie={e} bloqueada={bloqueada} />
                <span className="text-center font-bold leading-tight">{item.nombre}</span>
                <span className={`text-sm font-bold ${esPuesta ? 'text-verde' : esSuya ? 'text-petroleo' : bloqueada ? 'text-tinta-suave' : 'text-naranjo'}`}>
                  {esPuesta ? '✓ Puesta' : esSuya ? 'Tuya' : bloqueada ? '🔒 Bloqueada' : `🪙 ${precioDe(item, inventario)}`}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* El paquete: todos los colores de la especie, con su ahorro. */}
      {!bloqueada && (
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <span className="text-3xl" aria-hidden>
            📦
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight">{paquete.nombre}</p>
            {tienePaquete ? (
              <p className="text-sm text-tinta-suave">¡Ya tienes todos los colores!</p>
            ) : (
              <>
                <p className="text-sm text-tinta-suave">{desglose(e.paquete, inventario).partes.map((x) => x.nombre).join(' + ')}</p>
                <p className="text-sm font-bold text-verde">Ahorras {ahorroDe(paquete, inventario)} 🪙</p>
              </>
            )}
          </div>
          {!tienePaquete && (
            <BotonSecundario onClick={() => setConfirmar(e.paquete)} disabled={ocupado || monedas < precioDe(paquete, inventario)} className="shrink-0 px-3 py-1.5 text-sm">
              🪙 {precioDe(paquete, inventario)}
            </BotonSecundario>
          )}
        </div>
      )}

      {/* Lo que se puede hacer con la que se está probando. */}
      {(!yaPuesta || (elegidaEsDeEsta && !suya)) && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-3xl flex-col gap-2 border-t border-[#e2d6bf] bg-crema/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur apaisado:max-w-4xl apaisado:py-2">
          {elegida && !suya && !soloDesbloqueo(elegida, inventario) && (
            <p className="text-sm">
              {desglose(elegida, inventario).texto}
              {monedas < precioDe(buscarItem(elegida)!, inventario) && (
                <>
                  {' '}
                  · Te faltan <span className="font-bold text-naranjo">{precioDe(buscarItem(elegida)!, inventario) - monedas} 🪙</span>: ¡sigue leyendo!
                </>
              )}
            </p>
          )}
          {elegida && soloDesbloqueo(elegida, inventario) && <p className="text-sm font-bold">🔒 Lee 6 cuentos de nivel 0 para ganar la Cuncuna.</p>}
          <div className="flex flex-wrap items-center gap-2">
            {recien && recien === elegida && suya && !yaPuesta ? (
              <BotonPrincipal onClick={() => props.alUsar(elegida)} disabled={ocupado} className="px-5 py-2 text-base">
                ¡Usar ahora!
              </BotonPrincipal>
            ) : suya && !yaPuesta ? (
              <BotonPrincipal onClick={() => props.alUsar(elegida)} disabled={ocupado} className="px-5 py-2 text-base">
                Usar
              </BotonPrincipal>
            ) : (
              elegida &&
              !suya &&
              !soloDesbloqueo(elegida, inventario) && (
                <BotonPrincipal
                  onClick={() => setConfirmar(elegida)}
                  disabled={ocupado || monedas < precioDe(buscarItem(elegida)!, inventario)}
                  className="px-5 py-2 text-base"
                >
                  Comprar 🪙 {precioDe(buscarItem(elegida)!, inventario)}
                </BotonPrincipal>
              )
            )}
            {elegida === null && !yaPuesta && (
              <BotonPrincipal onClick={() => props.alUsar(null)} disabled={ocupado} className="px-5 py-2 text-base">
                Usar Ciempi
              </BotonPrincipal>
            )}
            {!yaPuesta && (
              <button onClick={props.alVolverALoMio} className="ml-auto shrink-0 font-bold text-petroleo underline underline-offset-4">
                ↺ Volver a lo mío
              </button>
            )}
          </div>
        </div>
      )}

      {confirmar && (
        <ConfirmarCompra
          itemId={confirmar}
          inventario={inventario}
          ocupado={ocupado}
          alConfirmar={() => void comprar(confirmar)}
          alCancelar={() => setConfirmar(null)}
        />
      )}
    </div>
  )
}

/** «Vas a comprar: Dragón 80 + Dragón de Fuego 24 = 104 🪙. ¿Confirmas?» */
function ConfirmarCompra(props: { itemId: string; inventario: string[]; ocupado: boolean; alConfirmar: () => void; alCancelar: () => void }) {
  const d = desglose(props.itemId, props.inventario)
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-tinta/30 sm:items-center" onClick={props.alCancelar}>
      <div
        role="dialog"
        aria-label="Confirmar compra"
        onClick={(e) => e.stopPropagation()}
        className="aparecer flex w-full max-w-lg flex-col gap-4 rounded-t-3xl bg-crema p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl"
      >
        <p className="text-xl font-bold">Vas a comprar:</p>
        <ul className="flex flex-col gap-1 text-lg">
          {d.partes.map((p) => (
            <li key={p.nombre} className="flex justify-between gap-3">
              <span>{p.nombre}</span>
              <span className="font-bold">{p.precio} 🪙</span>
            </li>
          ))}
          <li className="flex justify-between gap-3 border-t border-[#e2d6bf] pt-1 text-xl font-bold text-naranjo">
            <span>Total</span>
            <span>{d.total} 🪙</span>
          </li>
        </ul>
        {d.ahorro > 0 && <p className="font-bold text-verde">Ahorras {d.ahorro} 🪙</p>}
        <p className="text-lg">¿Confirmas?</p>
        <div className="flex gap-3">
          <BotonSecundario onClick={props.alCancelar} className="flex-1 py-3 text-lg">
            No
          </BotonSecundario>
          <BotonPrincipal onClick={props.alConfirmar} disabled={props.ocupado} className="flex-1">
            Sí, comprar
          </BotonPrincipal>
        </div>
      </div>
    </div>
  )
}

/**
 * La miniatura horneada; mientras carga, o si todavía no existe (la hornea
 * RENDER en public/criaturas/miniaturas/), el emoji de la especie: nunca queda vacía.
 */
export function MiniaturaCriatura({ varianteId, especie, bloqueada = false, className = 'h-28 w-full apaisado:h-20' }: { varianteId: string; especie: EspecieCriatura; bloqueada?: boolean; className?: string }) {
  const [estado, setEstado] = useState<'cargando' | 'lista' | 'falla'>('cargando')
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {estado !== 'lista' && (
        <span className={`text-6xl apaisado:text-5xl ${bloqueada ? 'opacity-60 grayscale' : ''}`} aria-hidden>
          {especie.emoji}
        </span>
      )}
      {estado !== 'falla' && (
        <img
          src={miniaturaDe(varianteId)}
          alt=""
          onLoad={() => setEstado('lista')}
          onError={() => setEstado('falla')}
          className={`h-full w-full object-contain ${estado !== 'lista' ? 'absolute inset-0 opacity-0' : bloqueada ? 'opacity-60 grayscale' : ''}`}
        />
      )}
      {bloqueada && (
        <span className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 text-lg shadow-sm" aria-hidden>
          🔒
        </span>
      )}
    </div>
  )
}
