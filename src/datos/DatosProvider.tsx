import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { crearRepositoriosApi } from './api/repositoriosApi'
import { crearRepositoriosLocales } from './localStorage/repositoriosLocales'
import type { Repositorios } from './repositorios'

const ContextoDatos = createContext<Repositorios | null>(null)

/**
 * Único punto donde se decide qué implementación de datos usa la app:
 * - VITE_API_URL="/" → el servidor de Ciempi en el mismo sitio (la web en nginx);
 * - VITE_API_URL="https://ciempi.minttu.cl" → ese servidor (la app Android);
 * - sin VITE_API_URL → sin conexión, todo en este dispositivo (localStorage).
 */
function repositoriosSegunEntorno(): Repositorios {
  const url = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  if (url) return crearRepositoriosApi(url === '/' ? '' : url.replace(/\/$/, ''))
  return crearRepositoriosLocales()
}

export function DatosProvider({ children, repositorios }: { children: ReactNode; repositorios?: Repositorios }) {
  const repos = useMemo(() => repositorios ?? repositoriosSegunEntorno(), [repositorios])
  return <ContextoDatos.Provider value={repos}>{children}</ContextoDatos.Provider>
}

export function useRepositorios(): Repositorios {
  const repos = useContext(ContextoDatos)
  if (!repos) throw new Error('useRepositorios debe usarse dentro de <DatosProvider>')
  return repos
}
