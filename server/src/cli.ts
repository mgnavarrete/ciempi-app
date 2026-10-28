/**
 * Tareas de administración desde la terminal del servidor:
 *   npm run cuenta -- clave <correo> <contraseña-nueva>   Cambia la contraseña de un adulto
 *   npm run cuenta -- lista                               Lista las cuentas de adultos
 *   npm run cuenta -- libros                              Lista los libros subidos (sin los cuentos de Ciempi)
 *   npm run cuenta -- borrar-libro <id>                   Borra un libro y lo saca de todas las bibliotecas
 *   npm run cuenta -- grabar-cuentos [voces…]             Graba con las voces de Microsoft todo lo que se dice
 *                                                         en los cuentos de Ciempi (lo ya grabado se salta)
 */
import { CUENTOS } from '../../src/contenido/cuentos.ts'
import { textosParaGrabar } from '../../src/contenido/textosParaGrabar.ts'
import { cerrarOtrasSesiones, cifrarClave, normalizarCorreo } from './auth.ts'
import { migrar, pool } from './db.ts'
import { VOCES_MICROSOFT, fuenteMicrosoft, microsoftInstalado, type VozMicrosoft } from './voz.ts'

const [orden, ...args] = process.argv.slice(2)
await migrar()

if (orden === 'clave' && args.length === 2) {
  const correo = normalizarCorreo(args[0])
  const { rows } = await pool.query(`update usuarios set clave_hash = $1 where tipo = 'adulto' and correo = $2 returning id`, [await cifrarClave(args[1]), correo])
  if (!rows[0]) {
    console.error(`No existe una cuenta con el correo ${correo}`)
    process.exitCode = 1
  } else {
    await cerrarOtrasSesiones(rows[0].id)
    console.log(`Contraseña cambiada para ${correo}.`)
  }
} else if (orden === 'lista') {
  const { rows } = await pool.query(`select u.correo, c.nombre_visible, c.rol, u.creado_en from usuarios u join cuentas c on c.id = u.id order by u.creado_en`)
  console.table(rows)
} else if (orden === 'libros') {
  const { rows } = await pool.query(
    `select t.id, t.titulo, coalesce(u.correo, u.usuario) as subido_por, array_length(t.frases, 1) as frases,
            (select count(*) from asignaciones a where a.texto_id = t.id)::int as ninos
       from textos t left join usuarios u on u.id = t.subido_por
      where t.origen <> 'ciempi' order by t.creado_en`,
  )
  console.table(rows)
} else if (orden === 'borrar-libro' && args.length === 1) {
  const { rows } = await pool.query(`delete from textos where id = $1 and origen <> 'ciempi' returning titulo`, [args[0]])
  if (!rows[0]) {
    console.error('No existe ese libro (los cuentos de Ciempi no se borran).')
    process.exitCode = 1
  } else console.log(`Borrado «${rows[0].titulo}» y quitado de todas las bibliotecas.`)
} else if (orden === 'grabar-cuentos') {
  await grabarCuentos(args.length ? args : Object.keys(VOCES_MICROSOFT))
} else {
  console.log(
    'Uso:\n  npm run cuenta -- clave <correo> <contraseña-nueva>\n  npm run cuenta -- lista\n  npm run cuenta -- libros\n  npm run cuenta -- borrar-libro <id>\n  npm run cuenta -- grabar-cuentos [lorenzo catalina paloma alonso]',
  )
}
await pool.end()

/**
 * Graba de antemano todo lo que la voz dice en los cuentos de Ciempi (cada
 * palabra, sílaba y oración, en cada voz), para que suene al instante. Lo ya
 * grabado se salta: se puede volver a correr después de agregar cuentos.
 */
async function grabarCuentos(voces: string[]) {
  const desconocidas = voces.filter((v) => !(v in VOCES_MICROSOFT))
  if (desconocidas.length) {
    console.error(`Voces desconocidas: ${desconocidas.join(', ')}. Hay: ${Object.keys(VOCES_MICROSOFT).join(', ')}.`)
    process.exitCode = 1
    return
  }
  if (!microsoftInstalado()) {
    console.error('Las voces de Microsoft no están instaladas: bash deploy/instalar-voz-microsoft.sh')
    process.exitCode = 1
    return
  }
  // Grabando de una vez se puede pedir más a la vez que mientras los niños leen.
  process.env.VOZ_MICROSOFT_A_LA_VEZ ??= '8'
  const textos = new Set<string>()
  for (const c of CUENTOS) {
    const t = textosParaGrabar(c)
    for (const x of [...t.palabras, ...t.frases]) textos.add(x)
  }
  for (const voz of voces as VozMicrosoft[]) {
    const fuente = fuenteMicrosoft(voz)
    const { rows } = await pool.query<{ clave: string }>('select clave from audios_voz where clave like $1', [`${fuente.id}|1|%`])
    const hechas = new Set(rows.map((r) => r.clave))
    const faltan = [...textos].filter((t) => !hechas.has(`${fuente.id}|1|${t}`))
    console.log(`${voz}: ${textos.size - faltan.length} ya grabados, faltan ${faltan.length}.`)
    let listos = 0
    let fallas = 0
    // De a varios a la vez (fuenteMicrosoft limita cuántos procesos corren juntos).
    for (let i = 0; i < faltan.length; i += 20) {
      await Promise.all(
        faltan.slice(i, i + 20).map(async (texto) => {
          try {
            const audio = await fuente.generar(texto, 1)
            await pool.query('insert into audios_voz (clave, audio) values ($1, $2) on conflict do nothing', [`${fuente.id}|1|${texto}`, audio])
            listos++
          } catch (e) {
            fallas++
            if (fallas <= 5) console.error(`  no se pudo grabar «${texto}»: ${(e as Error).message}`)
          }
        }),
      )
      console.log(`  ${voz}: ${Math.min(i + 20, faltan.length)} de ${faltan.length}`)
    }
    console.log(`${voz}: listo (${listos} grabados${fallas ? `, ${fallas} fallaron: vuelve a correrlo` : ''}).`)
  }
}
