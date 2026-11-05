import { useState, type ReactNode, type RefObject, type UIEvent } from 'react'
import { BotonPrincipal, BotonSecundario } from '../ui/comunes'
import { BarraCompra, MasEnLaTienda, PestanasDeslizables, Precio, SelloNuevo, Vacio, clasePestana } from './tiendaUi'
import { ahorroDe, buscarItem, loTiene, precioDe, soloDesbloqueo, type AparienciaCiempi } from './catalogo'
import { ESPECIES, especieDeItem, variantesDe, variantesDePaquete, miniaturaDe, type EspecieCriatura, type EspecieId } from './criaturas'

/**
 * Sección «Criaturas» de la tienda (2.5): una pestaña por especie, tarjetas
 * grandes con su miniatura, y abajo lo que se puede hacer con la que se está
 * probando. Tocar una tarjeta solo prueba (no guarda ni cobra). Comprar no
 * pone la criatura: después aparece «¡Usar ahora!». Toda compra muestra el
 * desglose y pide confirmación; `precioVisto` es el total mostrado.
 *
 * En la tienda solo están las que no tiene; en el ropero, solo las suyas
 * (tocar una se la pone y se guarda, sin precios ni paquetes).
 */
interface Props {
  modo: 'tienda' | 'ropero'
  alIrATienda: () => void
  tranquilo?: boolean
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
  /** La lista con desplazamiento propio (la pantalla la vuelve arriba y achica a Ciempi al bajar). */
  lista?: RefObject<HTMLDivElement | null>
  alDesplazar?: (e: UIEvent<HTMLElement>) => void
  /** Mensaje de error de la pantalla, al final de la lista. */
  error?: ReactNode
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
  const { probando, puesta, inventario, monedas, ocupado, modo } = props
  const enTienda = modo === 'tienda'
  const animar = props.tranquilo ? '' : 'transition active:scale-95'
  // Tienda: lo que le falta. Ropero: lo suyo.
  const mostrar = (item: string) => loTiene(inventario, item) !== enTienda
  const especies = ESPECIES.filter((x) => x.id === props.especie || variantesDe(x.id).some((v) => mostrar(v.item)))
  const visibles = enTienda ? especies : especies.filter((x) => variantesDe(x.id).some((v) => mostrar(v.item)))
  const e = visibles.find((x) => x.id === props.especie) ?? visibles[0]
  const especie = e?.id
  const variantes = e ? variantesDe(e.id).filter((v) => mostrar(v.item)) : []
  const [confirmar, setConfirmar] = useState<string | null>(null)
  // Recién comprada (sin ponérsela todavía): ofrece «¡Usar ahora!».
  const [recien, setRecien] = useState<string | null>(null)

  const elegida = probando.criatura
  const elegidaEsDeEsta = !!elegida && especieDeItem(elegida)?.id === especie
  const suya = !!elegida && loTiene(inventario, elegida)
  const yaPuesta = probando.criatura === puesta.criatura
  const bloqueada = !!e && soloDesbloqueo(e.item, inventario)
  const paquete = e ? buscarItem(e.paquete)! : null
  const tienePaquete = !!e && loTiene(inventario, e.paquete)

  const comprar = async (itemId: string) => {
    const { total } = desglose(itemId, inventario)
    setConfirmar(null)
    if (await props.alComprar(itemId, total)) setRecien(buscarItem(itemId)?.categoria === 'variante' ? itemId : null)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <PestanasDeslizables etiqueta="Criaturas" elegida={especie ?? ''}>
        {/* En el ropero, volver a ser Ciempi (sin criatura). */}
        {!enTienda && (
          <button
            aria-pressed={puesta.criatura === null}
            onClick={() => props.alUsar(null)}
            disabled={ocupado}
            className={`flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 font-bold apaisado:px-3 apaisado:text-sm ${animar} ${puesta.criatura === null ? 'bg-petroleo text-white' : 'bg-white text-tinta shadow-sm'}`}
          >
            <img src="/ciempi.svg" alt="" className="h-6 w-6 rounded-full bg-white p-0.5" /> Ciempi {puesta.criatura === null && '✓'}
          </button>
        )}
        {visibles.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={especie === x.id}
            onClick={() => props.alCambiarEspecie(x.id)}
            className={clasePestana(especie === x.id)}
          >
            <span aria-hidden>{x.emoji}</span> {x.nombre}
            {soloDesbloqueo(x.item, inventario) && <span aria-label="bloqueada">🔒</span>}
          </button>
        ))}
      </PestanasDeslizables>

      <div ref={props.lista} onScroll={props.alDesplazar} className="-mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-1 pb-1 pt-0.5">
      {!e && (
        <Vacio fondo="bg-verde-claro" enTienda={enTienda} alIrALaTienda={props.alIrATienda}>
          {enTienda ? '¡Ya tienes todo aquí! 🎉' : 'Todavía no tienes criaturas.'}
        </Vacio>
      )}
      {e && variantes.length === 0 && (
        <Vacio fondo="bg-verde-claro" enTienda={enTienda} alIrALaTienda={props.alIrATienda}>
          ¡Ya tienes todos los colores de {e.nombre}! 🎉
        </Vacio>
      )}

      {e && variantes.length > 0 && (
      <ul className="grid shrink-0 grid-cols-3 content-start gap-2.5 rounded-3xl bg-verde-claro p-2.5 apaisado:gap-2 apaisado:p-2 @xl:grid-cols-4">
        {variantes.map((v) => {
          const item = buscarItem(v.item)!
          const esSuya = loTiene(inventario, v.item)
          const esPuesta = puesta.criatura === v.item
          const probada = enTienda ? probando.criatura === v.item : esPuesta
          const precio = precioDe(item, inventario)
          return (
            <li key={v.id}>
              <button
                onClick={() => {
                  setRecien(null)
                  if (enTienda) props.alProbar(v.item)
                  else props.alUsar(v.item)
                }}
                disabled={!enTienda && ocupado}
                aria-pressed={probada}
                className={`relative flex h-full min-h-11 w-full flex-col items-center gap-1 rounded-2xl bg-white p-1.5 pb-2 shadow-md ${animar} ${probada ? 'ring-4 ring-petroleo' : ''}`}
              >
                {enTienda && !bloqueada && <SelloNuevo />}
                <MiniaturaCriatura varianteId={v.item} especie={e} bloqueada={bloqueada} className="h-24 w-full apaisado:h-[4.5rem]" />
                <span className="text-center text-sm font-bold leading-tight">{item.nombre}</span>
                {!enTienda ? (
                  <span className={`mt-auto text-xs font-bold ${esPuesta ? 'text-verde' : 'text-petroleo'}`}>{esPuesta ? '✓ Puesta' : 'Ponérmela'}</span>
                ) : esSuya ? (
                  <span className="mt-auto text-xs font-bold text-petroleo">Tuya</span>
                ) : bloqueada ? (
                  <span className="mt-auto text-xs font-bold text-tinta-suave">🔒 Leyendo</span>
                ) : (
                  <>
                    <Precio precio={precio} alcanza={monedas >= precio} />
                    {monedas < precio && <span className="-mt-0.5 text-[11px] font-bold leading-tight text-tinta-suave">Te faltan {precio - monedas}</span>}
                  </>
                )}
              </button>
            </li>
          )
        })}
        {!enTienda && <MasEnLaTienda alIrALaTienda={props.alIrATienda} />}
      </ul>
      )}

      {/* El paquete: todos los colores de la especie, con su ahorro (solo en la tienda). */}
      {enTienda && e && paquete && !bloqueada && !tienePaquete && (
        <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
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
            <BotonSecundario onClick={() => setConfirmar(e.paquete)} disabled={ocupado || monedas < precioDe(paquete, inventario)} className="min-h-11 shrink-0 px-3 py-1.5 text-sm">
              🪙 {precioDe(paquete, inventario)}
            </BotonSecundario>
          )}
        </div>
      )}

      {props.error}
      </div>

      {/* Lo que se puede hacer con la que se está probando (debajo de la lista: no tapa nada). */}
      {enTienda && (!yaPuesta || (elegidaEsDeEsta && !suya)) && (
        <BarraCompra>
          {elegida && !suya && !soloDesbloqueo(elegida, inventario) && (
            <p className="text-sm leading-snug">
              {desglose(elegida, inventario).texto}
              {monedas < precioDe(buscarItem(elegida)!, inventario) && (
                <>
                  {' '}
                  · Te faltan <span className="font-bold text-naranjo">{precioDe(buscarItem(elegida)!, inventario) - monedas} 🪙</span>: ¡sigue leyendo!
                </>
              )}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {recien && recien === elegida && suya && !yaPuesta ? (
              <BotonPrincipal onClick={() => props.alUsar(elegida)} disabled={ocupado} className="min-h-11 px-5 py-2 text-base">
                ¡Usar ahora!
              </BotonPrincipal>
            ) : suya && !yaPuesta ? (
              <BotonPrincipal onClick={() => props.alUsar(elegida)} disabled={ocupado} className="min-h-11 px-5 py-2 text-base">
                Usar
              </BotonPrincipal>
            ) : (
              elegida &&
              !suya &&
              !soloDesbloqueo(elegida, inventario) && (
                <BotonPrincipal
                  onClick={() => setConfirmar(elegida)}
                  disabled={ocupado || monedas < precioDe(buscarItem(elegida)!, inventario)}
                  className="min-h-11 px-5 py-2 text-base"
                >
                  Comprar 🪙 {precioDe(buscarItem(elegida)!, inventario)}
                </BotonPrincipal>
              )
            )}
            {elegida === null && !yaPuesta && (
              <BotonPrincipal onClick={() => props.alUsar(null)} disabled={ocupado} className="min-h-11 px-5 py-2 text-base">
                Usar Ciempi
              </BotonPrincipal>
            )}
            {!yaPuesta && (
              <button onClick={props.alVolverALoMio} className="order-first mr-auto min-h-11 shrink-0 text-sm font-bold text-petroleo underline underline-offset-4">
                ↺ <span className="@md:hidden">Lo mío</span>
                <span className="hidden @md:inline">Volver a lo mío</span>
              </button>
            )}
          </div>
        </BarraCompra>
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
