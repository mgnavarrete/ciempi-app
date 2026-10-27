import { createClient } from '@supabase/supabase-js'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { crearRepositoriosLocales } from './localStorage/repositoriosLocales'
import type { Repositorios } from './repositorios'
import { crearRepositoriosSupabase } from './supabase/repositoriosSupabase'

const ContextoDatos = createContext<Repositorios | null>(null)

/**
 * Único punto donde se decide qué implementación de datos usa la app:
 * con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local se usa
 * Supabase (login + sincronización); sin ellas, localStorage.
 */
function repositoriosSegunEntorno(): Repositorios {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const clave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (url && clave) {
    const alta = () =>
      createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'ciempi-alta' } })
    // Flujo implícito: el enlace de "recuperar contraseña" funciona aunque se abra
    // en otro dispositivo (p. ej. se pide en el computador y se abre en el celular).
    return crearRepositoriosSupabase(createClient(url, clave, { auth: { flowType: 'implicit' } }), alta)
  }
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
