import { useCallback, useEffect, useState } from 'react'
import { PantallaAdultos } from './adultos/PantallaAdultos'
import { PantallaAjustes } from './ajustes/PantallaAjustes'
import { PantallaAgregarLibro } from './biblioteca/PantallaAgregarLibro'
import { PantallaCiempi } from './ciempi/PantallaCiempi'
import { Presentacion } from './ciempi/Presentacion'
import { PantallaBiblioteca, type LibroEnBiblioteca } from './biblioteca/PantallaBiblioteca'
import { useRepositorios } from './datos/DatosProvider'
import { prepararCuentaNueva } from './datos/inicio'
import type { AjustesLectura, Id, PerfilNino, Sesion } from './dominio/tipos'
import type { IdFuente } from './fuentes/entradas'
import { PantallaAcceso } from './inicio/PantallaAcceso'
import { PantallaNuevaClave } from './inicio/CambiarClave'
import { PantallaPerfiles } from './inicio/PantallaPerfiles'
import { PantallaLectura } from './lectura/PantallaLectura'
import { PantallaNuevoTexto } from './textos/PantallaNuevoTexto'

type Vista =
  /** Depende de quién entró: el niño a sus libros, el adulto a su panel. */
  | { tipo: 'inicio' }
  | { tipo: 'biblioteca'; perfilId: Id }
  | { tipo: 'leer'; perfilId: Id; libro: LibroEnBiblioteca }
  | { tipo: 'ajustes'; perfilId: Id; volverA: Vista }
  | { tipo: 'agregarLibro'; perfilId: Id }
  | { tipo: 'ciempi'; perfilId: Id }
  | { tipo: 'presentacion'; perfilId: Id }
  | { tipo: 'adultos' }
  | { tipo: 'nuevoTexto'; fuente: IdFuente; paraPerfilId?: Id }

export function App() {
  const repos = useRepositorios()
  /** undefined = todavía revisando si hay sesión. */
  const [sesion, setSesion] = useState<Sesion | null | undefined>(undefined)
  const [perfiles, setPerfiles] = useState<PerfilNino[] | null>(null)
  const [vista, setVista] = useState<Vista>({ tipo: 'inicio' })
  const [error, setError] = useState<string | null>(null)
  // Llegó desde el enlace de "recuperar contraseña": hay que pedirle la nueva.
  const [pidiendoClave, setPidiendoClave] = useState(() => new URLSearchParams(window.location.search).has('recuperar'))

  useEffect(() => {
    repos.auth.sesionActual().then(setSesion, (e: Error) => setError(e.message))
    const dejarSesion = repos.auth.alCambiar((s) => {
      setSesion(s)
      setVista({ tipo: 'inicio' })
    })
    const dejarRecuperacion = repos.auth.alPedirNuevaClave(() => setPidiendoClave(true))
    return () => {
      dejarSesion()
      dejarRecuperacion()
    }
  }, [repos])

  const terminarNuevaClave = () => {
    setPidiendoClave(false)
    window.history.replaceState(null, '', window.location.pathname)
  }

  const recargarPerfiles = useCallback(async () => setPerfiles(await repos.perfiles.listar()), [repos])

  useEffect(() => {
    if (!sesion) return setPerfiles(null)
    void (async () => {
      // Sin conexión se deja un niño con el cuento de ejemplo para probar de inmediato.
      if (!repos.enLinea) await prepararCuentaNueva(repos, sesion.usuarioId)
      await recargarPerfiles()
    })().catch((e: Error) => setError(e.message))
  }, [repos, sesion, recargarPerfiles])

  const actualizarPerfil = (id: Id, cambios: Partial<PerfilNino>) =>
    setPerfiles((ps) => ps?.map((p) => (p.id === id ? { ...p, ...cambios } : p)) ?? null)

  const ganarMonedas = async (id: Id, cantidad: number) => {
    actualizarPerfil(id, { monedas: await repos.perfiles.sumarMonedas(id, cantidad) })
  }

  const cambiarAjustes = (id: Id, ajustes: AjustesLectura) => {
    actualizarPerfil(id, { ajustes })
    void repos.perfiles.actualizarAjustes(id, ajustes)
  }

  if (error) return <p className="p-6 text-coral">No se pudieron cargar los datos: {error}</p>
  if (sesion === undefined) return null
  // Llegó desde el enlace del correo: puede no tener sesión todavía (la crea al guardar la clave nueva).
  if (pidiendoClave && sesion?.tipo !== 'nino') {
    return (
      <Marco>
        <PantallaNuevaClave alTerminar={terminarNuevaClave} />
      </Marco>
    )
  }
  if (sesion === null) {
    return (
      <Marco>
        <PantallaAcceso />
      </Marco>
    )
  }
  if (!perfiles) return null

  const esNino = sesion.tipo === 'nino'
  /** Un adulto con cuenta en línea mira los libros del niño sin mover su avance. */
  const esAdmin = sesion.tipo === 'adulto' && repos.enLinea
  const perfilDe = (id: Id) => perfiles.find((p) => p.id === id)
  const salir = () => void repos.auth.cerrarSesion()
  const inicio = () => setVista({ tipo: 'inicio' })

  const pantalla = (() => {
    switch (vista.tipo) {
      case 'inicio': {
        if (sesion.tipo === 'nino') return mostrarBiblioteca(sesion.perfilId)
        if (esAdmin) return mostrarAdultos()
        return (
          <PantallaPerfiles
            perfiles={perfiles}
            alElegir={(p) => setVista({ tipo: 'biblioteca', perfilId: p.id })}
            alCrear={(p) => {
              setPerfiles([...perfiles, p])
              setVista({ tipo: 'biblioteca', perfilId: p.id })
            }}
            alIrAdultos={() => setVista({ tipo: 'adultos' })}
          />
        )
      }

      case 'biblioteca':
        return mostrarBiblioteca(vista.perfilId)

      case 'leer': {
        const perfil = perfilDe(vista.perfilId)
        if (!perfil) return null
        const { asignacion, texto } = vista.libro
        return (
          <PantallaLectura
            key={asignacion.id}
            perfil={perfil}
            usuarioId={sesion.usuarioId}
            texto={texto}
            asignacion={asignacion}
            vistaPrevia={esAdmin}
            alGanarMonedas={(n) => void ganarMonedas(perfil.id, n)}
            alProgreso={(progreso) => void repos.asignaciones.guardarProgreso(asignacion.id, progreso)}
            alVolver={() => setVista({ tipo: 'biblioteca', perfilId: perfil.id })}
            alAjustes={() => setVista({ tipo: 'ajustes', perfilId: perfil.id, volverA: vista })}
          />
        )
      }

      case 'ajustes': {
        const perfil = perfilDe(vista.perfilId)
        if (!perfil) return null
        return (
          <PantallaAjustes
            perfil={perfil}
            alCambiar={(a) => cambiarAjustes(perfil.id, a)}
            alVolver={() => setVista(vista.volverA)}
            alVerPresentacion={esAdmin ? undefined : () => setVista({ tipo: 'presentacion', perfilId: perfil.id })}
            alSalir={esNino ? salir : undefined}
          />
        )
      }

      case 'agregarLibro':
        return (
          <PantallaAgregarLibro
            perfilId={vista.perfilId}
            usuarioId={sesion.usuarioId}
            alAgregar={() => setVista({ tipo: 'biblioteca', perfilId: vista.perfilId })}
            alVolver={() => setVista({ tipo: 'biblioteca', perfilId: vista.perfilId })}
          />
        )

      case 'ciempi': {
        const perfil = perfilDe(vista.perfilId)
        if (!perfil) return null
        return (
          <PantallaCiempi
            perfil={perfil}
            alCambiarPerfil={(cambios) => actualizarPerfil(perfil.id, cambios)}
            alVolver={() => setVista({ tipo: 'biblioteca', perfilId: perfil.id })}
          />
        )
      }

      case 'presentacion': {
        const perfil = perfilDe(vista.perfilId)
        return perfil ? mostrarPresentacion(perfil) : null
      }

      case 'adultos':
        return mostrarAdultos()

      case 'nuevoTexto':
        return (
          <PantallaNuevoTexto
            usuarioId={sesion.usuarioId}
            perfiles={perfiles}
            paraPerfilId={vista.paraPerfilId}
            fuenteInicial={vista.fuente}
            alGuardar={() => setVista({ tipo: 'adultos' })}
            alVolver={() => setVista({ tipo: 'adultos' })}
          />
        )
    }
  })()

  function mostrarPresentacion(perfil: PerfilNino) {
    return (
      <Presentacion
        perfil={perfil}
        alTerminar={(apariencia) => {
          actualizarPerfil(perfil.id, { ciempi: apariencia })
          setVista({ tipo: 'biblioteca', perfilId: perfil.id })
          void repos.perfiles.actualizarCiempi(perfil.id, apariencia).then((p) => actualizarPerfil(perfil.id, { ciempi: p.ciempi }))
        }}
      />
    )
  }

  function mostrarBiblioteca(perfilId: Id) {
    const perfil = perfilDe(perfilId)
    if (!perfil) return null
    // La primera vez que el niño entra, Ciempi se presenta.
    if (!esAdmin && !perfil.ciempi.presentado) return mostrarPresentacion(perfil)
    return (
      <PantallaBiblioteca
        perfil={perfil}
        usuarioId={sesion!.usuarioId}
        modo={esAdmin ? 'admin' : 'nino'}
        alLeer={(libro) => setVista({ tipo: 'leer', perfilId, libro })}
        alAjustes={() => setVista({ tipo: 'ajustes', perfilId, volverA: { tipo: 'biblioteca', perfilId } })}
        alAgregarLibro={esAdmin ? undefined : () => setVista({ tipo: 'agregarLibro', perfilId })}
        alPersonalizar={esAdmin ? undefined : () => setVista({ tipo: 'ciempi', perfilId })}
        alVolver={esNino ? undefined : esAdmin ? () => setVista({ tipo: 'adultos' }) : inicio}
      />
    )
  }

  function mostrarAdultos() {
    if (sesion?.tipo !== 'adulto') return null
    return (
      <PantallaAdultos
        cuenta={sesion.cuenta}
        perfiles={perfiles!}
        alVolver={esAdmin ? undefined : inicio}
        alSalir={esAdmin ? salir : undefined}
        alAgregarTexto={(fuente, para) => setVista({ tipo: 'nuevoTexto', fuente, paraPerfilId: para?.id })}
        alAjustesDe={(p) => setVista({ tipo: 'ajustes', perfilId: p.id, volverA: { tipo: 'adultos' } })}
        alVerLibros={(p) => setVista({ tipo: 'biblioteca', perfilId: p.id })}
        alCambiarNinos={() => void recargarPerfiles()}
      />
    )
  }

  return <Marco>{pantalla}</Marco>
}

function Marco({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex h-dvh min-h-0 w-full max-w-5xl flex-col apaisado:max-w-none">{children}</div>
}
