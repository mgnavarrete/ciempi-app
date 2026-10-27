import { crearApp } from './app.ts'
import { migrar } from './db.ts'

// Crea o actualiza las tablas antes de empezar a atender.
await migrar()
const app = await crearApp()

const PUERTO = Number(process.env.PORT ?? 3200)
const HOST = process.env.HOST ?? '127.0.0.1'
await app.listen({ port: PUERTO, host: HOST })
