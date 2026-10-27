import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { normalizarApariencia, type AparienciaCiempi } from '../../ciempi/catalogo'
import { normalizarAjustes } from '../../dominio/tipos'
import type {
  AjustesLectura,
  Asignacion,
  Capitulo,
  Cuenta,
  InvitacionNino,
  PerfilNino,
  Sesion,
  SesionLectura,
  Texto,
} from '../../dominio/tipos'
import type { Repositorios } from '../repositorios'

/**
 * Implementación con Supabase: niños y adultos con su propio acceso, y datos
 * sincronizados entre dispositivos. Los permisos los impone la RLS de
 * supabase/migrations; aquí solo se traducen filas (snake_case) ↔ tipos
 * de dominio (camelCase).
 */

/**
 * Los niños no tienen correo: Supabase Auth necesita uno, así que se arma un
 * correo interno a partir del usuario ("tomi" → tomi@ninos.ciempi.app).
 * Nunca se le envían correos (la confirmación de correo debe estar
 * desactivada en el proyecto; ver README).
 */
export const DOMINIO_NINOS = 'ninos.ciempi.app'
const correoDeNino = (usuario: string) => `${usuario.trim().toLowerCase()}@${DOMINIO_NINOS}`

type Fila = Record<string, unknown>

/** Supabase devuelve { data, error }: se convierte el error en excepción legible. */
function valor<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(traducir(r.error.message))
  return r.data as T
}

function traducir(mensaje: string): string {
  if (/invalid login credentials/i.test(mensaje)) return 'Usuario o clave incorrectos.'
  if (/already registered|already been registered/i.test(mensaje)) return 'Ya existe una cuenta con ese correo o usuario.'
  if (/email not confirmed/i.test(mensaje)) return 'Revisa tu correo y confirma la cuenta antes de entrar.'
  if (/password should be at least/i.test(mensaje)) return 'La clave debe tener al menos 6 caracteres.'
  if (/should be different from the old/i.test(mensaje)) return 'La contraseña nueva tiene que ser distinta de la anterior.'
  if (/rate limit|security purposes|only request this/i.test(mensaje)) return 'Espera un minuto antes de pedir otro correo.'
  if (/database error saving new user/i.test(mensaje)) return 'No se pudo crear la cuenta del niño. Inténtalo de nuevo.'
  if (/failed to fetch|network/i.test(mensaje)) return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.'
  return mensaje
}

const aPerfil = (f: Fila): PerfilNino => ({
  id: f.id as string,
  creadoPor: f.creado_por as string,
  usuario: (f.usuario as string | null) ?? null,
  tieneCuenta: f.usuario_id != null,
  apodo: f.apodo as string,
  icono: f.icono as string,
  pinHash: null,
  ajustes: normalizarAjustes(f.ajustes as AjustesLectura),
  monedas: f.monedas as number,
  ciempi: normalizarApariencia(f.ciempi as Partial<AparienciaCiempi> | null),
  inventario: (f.inventario as string[] | null) ?? [],
  creadoEn: f.creado_en as string,
})

const aTexto = (f: Fila): Texto => ({
  id: f.id as string,
  subidoPor: f.subido_por as string,
  titulo: f.titulo as string,
  autor: (f.autor as string | null) ?? null,
  textoOriginal: (f.texto_original as string | undefined) ?? '',
  frases: f.frases as string[],
  capitulos: f.capitulos as Capitulo[],
  portada: (f.portada as string | null) ?? null,
  origen: f.origen as Texto['origen'],
  creadoEn: f.creado_en as string,
  actualizadoEn: f.actualizado_en as string,
})

const deTexto = (t: Texto): Fila => ({
  id: t.id,
  subido_por: t.subidoPor,
  titulo: t.titulo,
  autor: t.autor,
  texto_original: t.textoOriginal,
  frases: t.frases,
  capitulos: t.capitulos,
  portada: t.portada,
  origen: t.origen,
  creado_en: t.creadoEn,
  actualizado_en: t.actualizadoEn,
})

const aAsignacion = (f: Fila): Asignacion => ({
  id: f.id as string,
  asignadaPor: f.asignada_por as string,
  perfilId: f.perfil_id as string,
  textoId: f.texto_id as string,
  modo: f.modo as Asignacion['modo'],
  estado: f.estado as Asignacion['estado'],
  fraseActual: f.frase_actual as number,
  fraseMaxima: (f.frase_maxima as number | undefined) ?? (f.frase_actual as number),
  asignadaEn: f.asignada_en as string,
  actualizadaEn: f.actualizada_en as string,
  completadaEn: (f.completada_en as string | null) ?? null,
})

const aSesion = (f: Fila): SesionLectura => ({
  id: f.id as string,
  usuarioId: f.usuario_id as string,
  perfilId: f.perfil_id as string,
  textoId: (f.texto_id as string | null) ?? null,
  asignacionId: (f.asignacion_id as string | null) ?? null,
  modo: f.modo as SesionLectura['modo'],
  iniciadaEn: f.iniciada_en as string,
  duracionSegundos: f.duracion_segundos as number,
  frasesCompletadas: f.frases_completadas as number,
  frasesMuyRapido: f.frases_muy_rapido as number,
  silabasLeidas: f.silabas_leidas as number,
  monedasGanadas: f.monedas_ganadas as number,
})

const deSesion = (s: SesionLectura): Fila => ({
  id: s.id,
  usuario_id: s.usuarioId,
  perfil_id: s.perfilId,
  texto_id: s.textoId,
  asignacion_id: s.asignacionId,
  modo: s.modo,
  iniciada_en: s.iniciadaEn,
  duracion_segundos: s.duracionSegundos,
  frases_completadas: s.frasesCompletadas,
  frases_muy_rapido: s.frasesMuyRapido,
  silabas_leidas: s.silabasLeidas,
  monedas_ganadas: s.monedasGanadas,
})

const aInvitacion = (f: Fila): InvitacionNino => ({
  codigo: f.codigo as string,
  perfilId: f.perfil_id as string,
  creadaPor: f.creada_por as string,
  expiraEn: f.expira_en as string,
})

/** Columnas de la lista de textos: sin texto_original, que es grande y la lista no lo usa. */
const COLUMNAS_LISTA_TEXTOS = 'id,subido_por,titulo,autor,frases,capitulos,portada,origen,creado_en,actualizado_en'

/**
 * @param sb cliente principal (guarda la sesión del dispositivo).
 * @param crearClienteAlta cliente sin sesión persistente, para crear la
 *   cuenta de un niño sin cerrar la sesión del adulto que la crea.
 */
export function crearRepositoriosSupabase(sb: SupabaseClient, crearClienteAlta: () => SupabaseClient): Repositorios {
  async function sesionDe(s: Session): Promise<Sesion> {
    const usuarioId = s.user.id
    if (s.user.user_metadata?.tipo === 'nino') {
      const fila = valor(await sb.from('perfiles_ninos').select('id').eq('usuario_id', usuarioId).maybeSingle()) as Fila | null
      if (!fila) throw new Error('Esta cuenta de lector ya no tiene perfil. Pídele ayuda a un adulto.')
      return { tipo: 'nino', usuarioId, perfilId: fila.id as string }
    }
    const fila = valor(await sb.from('cuentas').select('*').eq('id', usuarioId).maybeSingle()) as Fila | null
    const cuenta: Cuenta = {
      id: usuarioId,
      correo: s.user.email ?? null,
      rol: (fila?.rol as Cuenta['rol']) ?? 'apoderado',
      nombreVisible: (fila?.nombre_visible as string) ?? '',
      creadaEn: (fila?.creada_en as string) ?? s.user.created_at,
    }
    return { tipo: 'adulto', usuarioId, cuenta }
  }

  async function idActual(): Promise<string> {
    const { data } = await sb.auth.getSession()
    if (!data.session) throw new Error('La sesión expiró. Vuelve a entrar.')
    return data.session.user.id
  }

  return {
    enLinea: true,

    auth: {
      async sesionActual() {
        const { data } = await sb.auth.getSession()
        return data.session ? sesionDe(data.session) : null
      },
      async registrarse({ correo, clave, nombreVisible, rol }) {
        if (correo.trim().toLowerCase().endsWith(`@${DOMINIO_NINOS}`)) throw new Error('Usa tu correo personal.')
        const { data, error } = await sb.auth.signUp({
          email: correo,
          password: clave,
          options: { data: { nombre_visible: nombreVisible, rol } },
        })
        if (error) throw new Error(traducir(error.message))
        // Si el proyecto exige confirmar el correo, todavía no hay sesión.
        if (!data.session) throw new Error('Te enviamos un correo para confirmar la cuenta. Ábrelo y luego entra.')
        const sesion = await sesionDe(data.session)
        if (sesion.tipo !== 'adulto') throw new Error('No se pudo crear la cuenta.')
        return sesion.cuenta
      },
      async iniciarSesionAdulto(correo, clave) {
        const { error } = await sb.auth.signInWithPassword({ email: correo.trim(), password: clave })
        if (error) throw new Error(traducir(error.message))
      },
      async iniciarSesionNino(usuario, clave) {
        const { error } = await sb.auth.signInWithPassword({ email: correoDeNino(usuario), password: clave })
        if (error) throw new Error(traducir(error.message))
      },
      async cerrarSesion() {
        await sb.auth.signOut()
      },
      async enviarRecuperacion(correo) {
        if (correo.trim().toLowerCase().endsWith(`@${DOMINIO_NINOS}`)) throw new Error('Los lectores no tienen correo: un adulto les cambia la clave.')
        // El enlace del correo vuelve a esta misma app (debe estar en la lista de URLs permitidas de Supabase).
        const { error } = await sb.auth.resetPasswordForEmail(correo.trim(), { redirectTo: `${window.location.origin}/?recuperar=1` })
        if (error) throw new Error(traducir(error.message))
      },
      async cambiarMiClave(clave) {
        const { error } = await sb.auth.updateUser({ password: clave })
        if (error) throw new Error(traducir(error.message))
      },
      alPedirNuevaClave(fn) {
        const { data } = sb.auth.onAuthStateChange((evento) => {
          if (evento === 'PASSWORD_RECOVERY') setTimeout(fn, 0)
        })
        return () => data.subscription.unsubscribe()
      },
      alCambiar(fn) {
        // Solo se avisa cuando cambia el usuario: refrescos de token o volver a
        // la pestaña no deben sacar al niño de lo que está leyendo.
        let ultimo: string | null | undefined
        const { data } = sb.auth.onAuthStateChange((_evento, sesion) => {
          const id = sesion?.user.id ?? null
          if (id === ultimo) return
          const primera = ultimo === undefined
          ultimo = id
          if (primera) return // la app ya pidió sesionActual() al partir
          // No se llama a Supabase dentro del callback (puede trabarse): se difiere.
          setTimeout(() => {
            if (!sesion) fn(null)
            else void sesionDe(sesion).then(fn, () => fn(null))
          }, 0)
        })
        return () => data.subscription.unsubscribe()
      },
    },

    perfiles: {
      async listar() {
        return (valor(await sb.from('perfiles_ninos').select('*').order('creado_en')) as Fila[]).map(aPerfil)
      },
      async obtener(id) {
        const fila = valor(await sb.from('perfiles_ninos').select('*').eq('id', id).maybeSingle()) as Fila | null
        return fila ? aPerfil(fila) : null
      },
      async crear({ apodo, icono, usuario, clave }) {
        const perfil = aPerfil(valor(await sb.from('perfiles_ninos').insert({ apodo, icono }).select().single()))
        if (!usuario || !clave) return perfil
        try {
          // 1) Se reserva el usuario y se obtiene un secreto de un solo uso.
          const secreto = valor(await sb.rpc('preparar_cuenta_nino', { p_perfil: perfil.id, p_usuario: usuario })) as string
          // 2) Se crea el usuario del niño con un cliente aparte, para no tocar la sesión del adulto.
          const { error } = await crearClienteAlta().auth.signUp({
            email: correoDeNino(usuario),
            password: clave,
            options: { data: { tipo: 'nino', perfil_id: perfil.id, secreto } },
          })
          if (error) throw new Error(traducir(error.message))
          return { ...perfil, usuario: usuario.trim().toLowerCase(), tieneCuenta: true }
        } catch (e) {
          // Si no se pudo crear el acceso, no queda un niño a medias.
          await sb.from('perfiles_ninos').delete().eq('id', perfil.id)
          throw e
        }
      },
      async cambiarClave(perfilId, clave) {
        valor(await sb.rpc('cambiar_clave_nino', { p_perfil: perfilId, p_clave: clave }))
      },
      async actualizarAjustes(id, ajustes) {
        return aPerfil(valor(await sb.from('perfiles_ninos').update({ ajustes }).eq('id', id).select().single()))
      },
      async sumarMonedas(id, cantidad) {
        return valor(await sb.rpc('sumar_monedas', { p_perfil: id, p_cantidad: cantidad })) as number
      },
      async actualizarCiempi(id, apariencia) {
        // La base de datos revisa que todo lo puesto sea gratis o comprado.
        return aPerfil(valor(await sb.from('perfiles_ninos').update({ ciempi: apariencia }).eq('id', id).select().single()))
      },
      async comprar(id, itemId) {
        return valor(await sb.rpc('comprar_para_ciempi', { p_perfil: id, p_item: itemId })) as { monedas: number; inventario: string[] }
      },
      async crearInvitacion(perfilId) {
        return aInvitacion(valor(await sb.rpc('crear_invitacion', { p_perfil: perfilId })) as Fila)
      },
      async canjearInvitacion(codigo) {
        return aPerfil(valor(await sb.rpc('canjear_invitacion', { p_codigo: codigo })) as Fila)
      },
    },

    textos: {
      async listar() {
        const uid = await idActual()
        const filas = valor(
          await sb.from('textos').select(COLUMNAS_LISTA_TEXTOS).eq('subido_por', uid).order('actualizado_en', { ascending: false }),
        ) as unknown as Fila[]
        return filas.map(aTexto)
      },
      async obtener(id) {
        const fila = valor(await sb.from('textos').select('*').eq('id', id).maybeSingle()) as Fila | null
        return fila ? aTexto(fila) : null
      },
      async guardar(texto) {
        return aTexto(valor(await sb.from('textos').upsert(deTexto(texto)).select().single()))
      },
      async eliminar(id) {
        valor(await sb.from('textos').delete().eq('id', id))
      },
    },

    asignaciones: {
      async listarPorPerfil(perfilId) {
        const filas = valor(await sb.from('asignaciones').select('*').eq('perfil_id', perfilId).order('actualizada_en', { ascending: false }))
        return (filas as Fila[]).map(aAsignacion)
      },
      async asignar(perfilId, textoId, modo = 'coro') {
        const existente = valor(
          await sb.from('asignaciones').select('*').eq('perfil_id', perfilId).eq('texto_id', textoId).maybeSingle(),
        ) as Fila | null
        if (existente) return aAsignacion(existente)
        return aAsignacion(valor(await sb.from('asignaciones').insert({ perfil_id: perfilId, texto_id: textoId, modo }).select().single()))
      },
      async guardarProgreso(id, { fraseActual, fraseMaxima, estado }) {
        const ahora = new Date().toISOString()
        // frase_maxima nunca baja: lo garantiza un trigger en la base de datos.
        const cambios: Fila = { frase_actual: fraseActual, frase_maxima: fraseMaxima, estado, actualizada_en: ahora }
        // Al terminar se marca la fecha; al releer se conserva (no se borra).
        if (estado === 'completada') cambios.completada_en = ahora
        return aAsignacion(valor(await sb.from('asignaciones').update(cambios).eq('id', id).select().single()))
      },
      async quitar(id) {
        valor(await sb.from('asignaciones').delete().eq('id', id))
      },
    },

    sesiones: {
      async guardar(sesion) {
        return aSesion(valor(await sb.from('sesiones_lectura').upsert(deSesion(sesion)).select().single()))
      },
      async listarPorPerfil(perfilId) {
        const filas = valor(await sb.from('sesiones_lectura').select('*').eq('perfil_id', perfilId).order('iniciada_en', { ascending: false }).limit(200))
        return (filas as Fila[]).map(aSesion)
      },
    },
  }
}
