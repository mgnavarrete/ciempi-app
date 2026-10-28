/**
 * Tareas de administración desde la terminal del servidor:
 *   npm run cuenta -- clave <correo> <contraseña-nueva>   Cambia la contraseña de un adulto
 *   npm run cuenta -- lista                               Lista las cuentas de adultos
 *   npm run cuenta -- libros                              Lista los libros subidos (sin los cuentos de Ciempi)
 *   npm run cuenta -- borrar-libro <id>                   Borra un libro y lo saca de todas las bibliotecas
 */
import { cerrarOtrasSesiones, cifrarClave, normalizarCorreo } from './auth.ts'
import { migrar, pool } from './db.ts'

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
} else {
  console.log(
    'Uso:\n  npm run cuenta -- clave <correo> <contraseña-nueva>\n  npm run cuenta -- lista\n  npm run cuenta -- libros\n  npm run cuenta -- borrar-libro <id>',
  )
}
await pool.end()
