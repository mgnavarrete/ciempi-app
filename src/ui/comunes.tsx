import type { ReactNode } from 'react'

/** Íconos de trazo (24×24) para los controles de adultos. */
const TRAZOS = {
  atras: <path d="M15 5l-7 7 7 7" />,
  lapiz: <path d="M4 20h4L19 9l-4-4L4 16v4Z M13.5 6.5l4 4" />,
  ajustes: (
    <>
      <path d="M4 7h10 M18 7h2 M4 17h2 M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </>
  ),
  mas: <path d="M12 5v14 M5 12h14" />,
  basura: <path d="M5 7h14 M10 7V5h4v2 M7 7l1 12h8l1-12" />,
  adultos: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M16 5a3 3 0 0 1 0 6 M18 14c2 .6 3 2.8 3 6" />
    </>
  ),
  salir: <path d="M10 5H5v14h5 M14 8l4 4-4 4 M18 12H9" />,
  indice: <path d="M9 6h11 M9 12h11 M9 18h11 M4.5 6h.01 M4.5 12h.01 M4.5 18h.01" />,
  anterior: <path d="M11 6l-6 6 6 6 M19 6l-6 6 6 6" />,
  repetir: <path d="M4 12a8 8 0 1 0 2.4-5.7 M4 4v4h4" />,
} as const

export type NombreIcono = keyof typeof TRAZOS

export function Icono({ nombre, className = 'h-6 w-6' }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {TRAZOS[nombre]}
    </svg>
  )
}

export function BotonIcono(props: { etiqueta: string; icono: NombreIcono; onClick: () => void; activo?: boolean }) {
  return (
    <button
      onClick={props.onClick}
      aria-label={props.etiqueta}
      title={props.etiqueta}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full shadow-sm apaisado:h-9 apaisado:w-9 ${props.activo ? 'bg-petroleo text-white' : 'bg-white text-tinta'}`}
    >
      <Icono nombre={props.icono} />
    </button>
  )
}

/** Barra superior de cada pantalla: volver, título y acciones a la derecha. */
export function Encabezado({ titulo, alVolver, children }: { titulo?: ReactNode; alVolver?: () => void; children?: ReactNode }) {
  return (
    <header className="flex items-center gap-2 px-4 pb-1 pt-3 apaisado:px-4 apaisado:pt-1.5">
      {alVolver ? (
        <BotonIcono etiqueta="Volver" icono="atras" onClick={alVolver} />
      ) : (
        <img src="/ciempi.svg" alt="" className="h-10 w-10 rounded-xl apaisado:h-8 apaisado:w-8" />
      )}
      <div className="min-w-0 flex-1 truncate text-xl font-bold text-tinta apaisado:text-lg">{titulo ?? 'Ciempi'}</div>
      {children}
    </header>
  )
}

export function Monedas({ cantidad }: { cantidad: number }) {
  return (
    <span
      className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 text-lg font-bold text-naranjo shadow-sm"
      aria-label={`${cantidad} monedas`}
    >
      🪙 {cantidad}
    </span>
  )
}

export function BotonPrincipal({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-full bg-petroleo px-6 py-3 text-lg font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function BotonSecundario({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-full border-2 border-petroleo px-4 py-2 font-bold text-petroleo transition active:scale-95 disabled:border-[#d8cfbd] disabled:text-tinta-suave ${className}`}
    >
      {children}
    </button>
  )
}

export function BarraProgreso({ valor, className = '' }: { valor: number; className?: string }) {
  return (
    <div className={`h-2.5 overflow-hidden rounded-full bg-arena ${className}`} role="progressbar" aria-valuenow={Math.round(valor * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-verde" style={{ width: `${Math.min(1, Math.max(0, valor)) * 100}%` }} />
    </div>
  )
}

/** Portada del libro, o una tapa de color con la inicial si no tiene. */
export function Portada({ titulo, portada, className = '' }: { titulo: string; portada: string | null; className?: string }) {
  if (portada) return <img src={portada} alt="" className={`rounded-xl bg-white object-cover shadow-sm ${className}`} />
  const colores = ['#3a9fb1', '#ef9129', '#8eb743', '#ea6444', '#efc31d']
  const color = colores[[...titulo].reduce((n, c) => n + c.charCodeAt(0), 0) % colores.length]
  return (
    <div className={`grid place-items-center rounded-xl text-4xl font-bold text-white shadow-sm ${className}`} style={{ background: color }} aria-hidden>
      {titulo.trim()[0]?.toUpperCase() ?? '📖'}
    </div>
  )
}

export function MensajeError({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <p role="alert" className="rounded-xl bg-coral/10 px-4 py-2 text-coral">
      {error}
    </p>
  )
}

export const ICONOS_NINO = ['🐛', '🦊', '🐼', '🐸', '🦁', '🐨', '🐙', '🦄', '🐢', '🐝', '🐧', '🦖']
