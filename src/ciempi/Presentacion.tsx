import { useEffect, useState, type ReactNode } from 'react'
import { voz } from '../audio/voz'
import type { PerfilNino } from '../dominio/tipos'
import { BotonPrincipal } from '../ui/comunes'
import { CATALOGO, buscarItem, ponerItem, type AparienciaCiempi, type Genero, type ItemCiempi } from './catalogo'
import { MiniaturaCiempi } from './v2/Miniatura'
import { CiempiPersonaje } from './CiempiPersonaje'
import { Comida, FondoTema } from './dibujos'
import { useVozDeCiempi } from './vozDeCiempi'

interface Props {
  perfil: PerfilNino
  alTerminar: (apariencia: AparienciaCiempi) => void
}

const NOMBRES: Record<Genero, string[]> = {
  nino: ['Ciempi', 'Pipo', 'Rayo', 'Tito'],
  nina: ['Ciempi', 'Pipa', 'Lunita', 'Rayita'],
}

const GESTOS = ['A04', 'A08', 'A12', 'A03']
/** Lo que se puede elegir en la presentación: solo cosas gratis. */
const gratis = (categoria: 'paleta' | 'cabeza') => CATALOGO.filter((i) => i.categoria === categoria && i.precio === 0)
/** Lo que se muestra de la tienda al final de la presentación. */
const VITRINA = ['cabeza:b06-ia-corona', 'espalda:b08-ia-heroica', 'conjunto:b12-set-robot'].map(buscarItem).filter((i): i is ItemCiempi => !!i)

type Paso = 'genero' | 'nombre' | 'colores' | 'gorro' | 'leer' | 'ritmo' | 'tienda'
const PASOS: Paso[] = ['genero', 'nombre', 'colores', 'gorro', 'leer', 'ritmo', 'tienda']

/**
 * La primera vez que el niño entra, Ciempi se presenta: el niño elige si es
 * niño o niña, su nombre, sus colores y su gorro, y Ciempi le cuenta cómo se
 * lee y para qué sirven las monedas. Cada mensaje también se dice en voz alta.
 */
export function Presentacion({ perfil, alTerminar }: Props) {
  const tranquilo = perfil.ajustes.modoTranquilo
  const [paso, setPaso] = useState(0)
  const [a, setA] = useState<AparienciaCiempi>(perfil.ciempi)
  const actual = PASOS[paso]
  // La voz cambia apenas se elige niño o niña.
  useVozDeCiempi(a.genero)
  const amigo = a.genero === 'nina' ? 'tu amiga' : a.genero === 'nino' ? 'tu amigo' : 'tu nuevo amigo'

  const mensajes: Record<Paso, string> = {
    genero: `¡Hola, ${perfil.apodo}! Soy un ciempiés al que le encanta leer. ¿Quieres que sea niño o niña?`,
    nombre: '¡Genial! ¿Cómo me vas a llamar?',
    colores: `¡Me encanta llamarme ${a.nombre}! Elige mis colores.`,
    gorro: '¿Qué me pongo en la cabeza?',
    leer: 'Para leer, pon tu dedo sobre mí y llévame despacito por el camino. Cuando llego a una manzana, leemos esa palabra juntos.',
    ritmo: 'Si vas muy rápido, me tropiezo. Lee con calma: mientras avanzas en un libro ganas monedas, ¡y al terminarlo te llevas un premio!',
    tienda: `Con tus monedas me puedes vestir: gorros, capas, peinados ¡y disfraces completos! Soy ${a.nombre}, ${amigo}. ¿Vamos a leer?`,
  }

  // Ciempi dice cada mensaje (después del primer toque: los navegadores no hablan sin un gesto).
  const [hablar, setHablar] = useState(false)
  useEffect(() => {
    if (hablar) voz.decirFrase(mensajes[actual], perfil.ajustes.velocidadVoz)
  }, [paso, hablar]) // solo al cambiar de paso, no con cada letra del nombre
  useEffect(() => () => voz.callar(), [])

  const avanzar = () => {
    voz.desbloquear()
    setHablar(true)
    if (paso < PASOS.length - 1) setPaso(paso + 1)
    else alTerminar({ ...a, presentado: true })
  }

  const elegirGenero = (genero: Genero) => {
    setA({ ...a, genero })
    voz.desbloquear()
    setHablar(true)
    setPaso(1)
  }

  const puedeSeguir = actual !== 'genero' && (actual !== 'nombre' || a.nombre.trim().length > 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <div className="flex flex-1 gap-1.5" aria-label={`Paso ${paso + 1} de ${PASOS.length}`}>
          {PASOS.map((p, i) => (
            <span key={p} className={`h-2 flex-1 rounded-full ${i <= paso ? 'bg-petroleo' : 'bg-arena'}`} />
          ))}
        </div>
        {paso >= 4 && (
          <button onClick={() => alTerminar({ ...a, presentado: true })} className="text-sm font-bold text-tinta-suave">
            Saltar
          </button>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6 pt-4 apaisado:flex-row apaisado:items-center">
        {/* Ciempi con lo que se va eligiendo, y su globo de diálogo */}
        <div className="relative h-56 shrink-0 overflow-hidden rounded-3xl shadow-sm apaisado:h-48 apaisado:w-1/2">
          <FondoTema fondo={a.fondo} />
          <p key={paso} className="aparecer absolute inset-x-3 top-3 z-10 rounded-2xl rounded-br-sm bg-white/95 px-4 py-3 text-lg leading-snug shadow-sm">
            {mensajes[actual]}
          </p>
          <div className="pointer-events-none absolute inset-x-0 bottom-1 mx-auto w-[min(70%,300px)]">
            {/* En cada mensaje hace algo distinto: saluda, mira con curiosidad, juega, celebra. */}
            <CiempiPersonaje apariencia={a} ancho="100%" animado={!tranquilo} festejarCambios={!tranquilo} accion={{ id: GESTOS[paso % GESTOS.length], n: paso }} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          {actual === 'genero' && (
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['nino', 'Niño', '👦'],
                  ['nina', 'Niña', '👧'],
                ] as const
              ).map(([g, etiqueta, emoji]) => (
                <button key={g} onClick={() => elegirGenero(g)} className="flex flex-col items-center gap-1 rounded-3xl bg-white p-5 text-2xl font-bold shadow-sm active:scale-95">
                  <span className="text-5xl" aria-hidden>
                    {emoji}
                  </span>
                  {etiqueta}
                </button>
              ))}
            </div>
          )}

          {actual === 'nombre' && (
            <>
              <input
                value={a.nombre}
                onChange={(e) => setA({ ...a, nombre: e.target.value.slice(0, 20) })}
                aria-label="Su nombre"
                className="campo text-center text-2xl"
              />
              <div className="flex flex-wrap justify-center gap-2">
                {NOMBRES[a.genero ?? 'nino'].map((n) => (
                  <button key={n} onClick={() => setA({ ...a, nombre: n })} className={`rounded-full px-4 py-2 font-bold ${a.nombre === n ? 'bg-petroleo text-white' : 'bg-white'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </>
          )}

          {actual === 'colores' && (
            <Opciones>
              {gratis('paleta').map((i) => (
                <Opcion key={i.id} elegida={a.paleta === i.id} alElegir={() => setA(ponerItem(a, i))} nombre={i.nombre}>
                  <MiniaturaCiempi apariencia={ponerItem(a, i)} categoria="paleta" className="h-12 w-20" />
                </Opcion>
              ))}
            </Opciones>
          )}

          {actual === 'gorro' && (
            <Opciones>
              {gratis('cabeza').map((i) => (
                <Opcion key={i.id} elegida={a.cabeza === i.id} alElegir={() => setA(ponerItem(a, i))} nombre={i.nombre}>
                  <MiniaturaCiempi apariencia={ponerItem(a, i)} categoria="cabeza" className="h-14 w-14" />
                </Opcion>
              ))}
            </Opciones>
          )}

          {actual === 'leer' && <DemoPista apariencia={a} />}
          {actual === 'ritmo' && (
            <div className="flex items-center justify-center gap-6 rounded-3xl bg-white p-5 text-center shadow-sm">
              <span className="text-5xl" aria-hidden>
                🐢
              </span>
              <span className="text-lg">
                Despacito = <span className="font-bold text-naranjo">🪙 monedas</span>
              </span>
            </div>
          )}
          {actual === 'tienda' && (
            <div className="grid grid-cols-3 gap-3">
              {VITRINA.map((i) => (
                <div key={i.id} className="flex flex-col items-center rounded-2xl bg-white p-2 shadow-sm">
                  <MiniaturaCiempi apariencia={ponerItem(a, i)} categoria={i.categoria} className="h-14 w-full" />
                  <span className="text-sm font-bold text-naranjo">🪙 {i.precio}</span>
                </div>
              ))}
            </div>
          )}

          {actual !== 'genero' && (
            <div className="mt-auto flex gap-3 pt-2">
              <button onClick={() => setPaso(paso - 1)} className="px-3 font-bold text-tinta-suave">
                Atrás
              </button>
              <BotonPrincipal onClick={avanzar} disabled={!puedeSeguir} className="flex-1 py-4 text-xl">
                {actual === 'tienda' ? '¡Vamos a leer!' : 'Siguiente'}
              </BotonPrincipal>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Opciones({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function Opcion({ elegida, alElegir, nombre, children }: { elegida: boolean; alElegir: () => void; nombre: string; children: ReactNode }) {
  return (
    <button
      onClick={alElegir}
      aria-pressed={elegida}
      className={`flex flex-col items-center gap-2 rounded-2xl bg-white p-3 font-bold shadow-sm active:scale-95 ${elegida ? 'ring-4 ring-petroleo' : ''}`}
    >
      {children}
      {nombre}
    </button>
  )
}

/** La pista en pequeño: Ciempi avanza con el dedo, se come las manzanas y se encienden las palabras. */
function DemoPista({ apariencia }: { apariencia: AparienciaCiempi }) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-sm">
      <p className="text-center font-lectura text-3xl tracking-wide">
        <span className="demo-palabra rounded px-0.5">Mi</span> <span className="demo-palabra demo-palabra-2 rounded px-0.5">perro</span>{' '}
        <span className="demo-palabra demo-palabra-3 rounded px-0.5">come</span>
      </p>
      <div className="relative h-20 overflow-hidden rounded-full border-2 border-[#e2d6bf] bg-arena">
        {[22, 50, 78].map((x, i) => (
          <svg key={x} viewBox="-14 -14 28 28" className={`demo-manzana absolute top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 demo-manzana-${i + 1}`} style={{ left: `${x}%` }} aria-hidden>
            <Comida comida={apariencia.comida} x={0} y={0} tamano={11} />
          </svg>
        ))}
        <div className="demo-ciempi absolute top-1/2 h-16 w-28 -translate-y-1/2">
          <MiniaturaCiempi apariencia={apariencia} categoria="conjunto" className="h-full w-full" />
          <span className="absolute -bottom-1 right-1 text-3xl" aria-hidden>
            👆
          </span>
        </div>
      </div>
      <p className="text-center text-sm text-tinta-suave">Desliza de izquierda a derecha →</p>
    </div>
  )
}
