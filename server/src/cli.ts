/**
 * Tareas de administración desde la terminal del servidor:
 *   npm run cuenta -- clave <correo> <contraseña-nueva>   Cambia la contraseña de un adulto
 *   npm run cuenta -- lista                               Lista las cuentas de adultos
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
} else {
  console.log('Uso:\n  npm run cuenta -- clave <correo> <contraseña-nueva>\n  npm run cuenta -- lista')
}
await pool.end()
