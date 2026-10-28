import { crearApp } from './app.ts'
import { sembrarCuentos } from './cuentos.ts'
import { migrar } from './db.ts'

// Crea o actualiza las tablas (y los cuentos de Ciempi) antes de empezar a atender.
await migrar()
await sembrarCuentos()
const app = await crearApp()

const PUERTO = Number(process.env.PORT ?? 3200)
const HOST = process.env.HOST ?? '127.0.0.1'
await app.listen({ port: PUERTO, host: HOST })
