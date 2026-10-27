import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { AvisoVoz } from '../audio/AvisoVoz'
import { voz } from '../audio/voz'
import { useVozDeCiempi } from '../ciempi/vozDeCiempi'
import { useRepositorios } from '../datos/DatosProvider'
import { LIMITES_AJUSTES, type AjustesLectura, type PerfilNino, type SesionLectura } from '../dominio/tipos'
import { BotonPrincipal, Encabezado, Icono } from '../ui/comunes'

interface Props {
  perfil: PerfilNino
  alCambiar: (ajustes: AjustesLectura) => void
  alVolver: () => void
  /** Volver a ver la presentación de Ciempi. */
  alVerPresentacion?: () => void
  /** Cerrar sesión (solo en la app del niño; queda al final, lejos del dedo). */
  alSalir?: () => void
}

/** Ajustes de lectura del niño, ordenados por secciones. */
export function PantallaAjustes({ perfil, alCambiar, alVolver, alVerPresentacion, alSalir }: Props) {
  const { ajustes } = perfil
  useVozDeCiempi(perfil.ciempi.genero)
  const nombreVoz = useSyncExternalStore(
    (fn) => voz.suscribir(fn),
    () => voz.nombreVoz,
  )
  const cambiar = <K extends keyof AjustesLectura>(clave: K, valor: AjustesLectura[K]) => alCambiar({ ...ajustes, [clave]: valor })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Encabezado alVolver={alVolver} titulo={`Ajustes de ${perfil.apodo}`} />
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 overflow-y-auto px-5 pb-8 pt-2">
        <Seccion emoji="🔤" titulo="Letra">
          <Deslizador
            etiqueta="Tamaño"
            valor={ajustes.tamanoLetra}
            mostrar={`${ajustes.tamanoLetra} px`}
            {...LIMITES_AJUSTES.tamanoLetra}
            alCambiar={(v) => cambiar('tamanoLetra', v)}
          />
          <p className="rounded-xl bg-crema px-4 py-3 text-center font-lectura" style={{ fontSize: ajustes.tamanoLetra, letterSpacing: '0.05em' }}>
            <span className="rounded-[0.2em] bg-petroleo-claro text-petroleo">Ciempi</span> lee
          </p>
        </Seccion>

        <Seccion emoji="🔊" titulo="Voz">
          <AvisoVoz />
          <Deslizador
            etiqueta="Velocidad"
            valor={ajustes.velocidadVoz}
            mostrar={`${ajustes.velocidadVoz.toFixed(2)}×`}
            {...LIMITES_AJUSTES.velocidadVoz}
            alCambiar={(v) => cambiar('velocidadVoz', v)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                voz.desbloquear()
                voz.decirFrase(`Hola, soy ${perfil.ciempi.nombre}. ¡Vamos a leer!`, ajustes.velocidadVoz)
              }}
              className="rounded-full border-2 border-petroleo px-4 py-1.5 font-bold text-petroleo"
            >
              ▶ Probar voz
            </button>
            <span className="text-sm text-tinta-suave">
              {!voz.disponible ? 'Este navegador no tiene voz' : (nombreVoz ?? 'Sin voz en español')}
              {voz.disponible && !voz.conServidor && <span className="block text-xs opacity-70">{voz.resumenVoces}</span>}
            </span>
          </div>
        </Seccion>

        <Seccion emoji="🐢" titulo="Ritmo">
          <Deslizador
            etiqueta="«Más despacito» sobre"
            valor={ajustes.umbralPalabrasPorSegundo}
            mostrar={`${ajustes.umbralPalabrasPorSegundo.toLocaleString('es-CL')} palabras/s`}
            {...LIMITES_AJUSTES.umbralPalabrasPorSegundo}
            alCambiar={(v) => cambiar('umbralPalabrasPorSegundo', v)}
          />
          <p className="text-sm text-tinta-suave">Más bajo = exige leer más lento.</p>
        </Seccion>

        <Seccion emoji="🌙" titulo="Calma">
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block font-bold">Modo tranquilo</span>
              <span className="text-sm text-tinta-suave">Sin efectos de sonido ni animaciones intensas. La voz se mantiene.</span>
            </span>
            <input type="checkbox" checked={ajustes.modoTranquilo} onChange={(e) => cambiar('modoTranquilo', e.target.checked)} className="h-7 w-7 shrink-0 accent-petroleo" />
          </label>
        </Seccion>

        {alVerPresentacion && (
          <Seccion emoji="🐛" titulo={perfil.ciempi.nombre}>
            <button onClick={alVerPresentacion} className="self-start font-bold text-petroleo underline underline-offset-4">
              Ver la presentación de nuevo
            </button>
          </Seccion>
        )}

        <UltimasSesiones perfilId={perfil.id} />

        <BotonPrincipal onClick={alVolver} className="mt-2">
          Listo
        </BotonPrincipal>

        {alSalir && (
          <Seccion emoji="👤" titulo="Cuenta">
            {perfil.usuario && (
              <p className="text-sm text-tinta-suave">
                Entraste como <span className="font-mono font-bold text-tinta">{perfil.usuario}</span>
              </p>
            )}
            <button
              onClick={() => {
                if (confirm('¿Seguro que quieres salir? Para volver a entrar necesitas tu usuario y tu clave.')) alSalir()
              }}
              className="flex items-center gap-2 self-start rounded-full border-2 border-coral px-4 py-2 font-bold text-coral"
            >
              <Icono nombre="salir" className="h-5 w-5" /> Salir de Ciempi
            </button>
          </Seccion>
        )}
      </div>
    </div>
  )
}

function Seccion({ emoji, titulo, children }: { emoji: string; titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <span aria-hidden>{emoji}</span> {titulo}
      </h2>
      {children}
    </section>
  )
}

function Deslizador(props: { etiqueta: string; valor: number; mostrar: string; min: number; max: number; paso: number; alCambiar: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex justify-between">
        {props.etiqueta}
        <span className="text-tinta-suave tabular-nums">{props.mostrar}</span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.paso}
        value={props.valor}
        onChange={(e) => props.alCambiar(Number(e.target.value))}
        className="h-8 accent-petroleo"
      />
    </label>
  )
}

/** Resumen para el adulto: confirma que las sesiones se están registrando. */
function UltimasSesiones({ perfilId }: { perfilId: string }) {
  const repos = useRepositorios()
  const [sesiones, setSesiones] = useState<SesionLectura[]>([])
  useEffect(() => {
    void repos.sesiones.listarPorPerfil(perfilId).then((s) => setSesiones(s.slice(0, 5)))
  }, [repos, perfilId])

  if (sesiones.length === 0) return null
  return (
    <details className="rounded-2xl bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-lg font-bold">📊 Últimas lecturas</summary>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm">
        {sesiones.map((s) => {
          const minutos = s.duracionSegundos / 60
          return (
            <li key={s.id} className="flex flex-wrap justify-between gap-x-3 rounded-xl bg-crema px-3 py-2">
              <span>{new Date(s.iniciadaEn).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span className="text-tinta-suave">
                {minutos < 1 ? `${s.duracionSegundos} s` : `${minutos.toFixed(1)} min`} · {s.frasesCompletadas} frases · {s.frasesMuyRapido} 🐢 · {s.monedasGanadas} 🪙
              </span>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
