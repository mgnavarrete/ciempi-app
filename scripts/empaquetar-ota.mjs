#!/usr/bin/env node
// Paquete de actualización automática de la APK (ver docs/despliegue.md, «Actualizaciones
// automáticas de la APK»). Se corre después de `npm run build` (lo hace deploy/actualizar.sh):
//
//   node scripts/empaquetar-ota.mjs
//
// 1. Compila la web en modo APK (`vite build --mode apk`, la API en https://ciempi.minttu.cl)
//    en .ota/web: la web publicada en dist/ usa VITE_API_URL=/ y no sirve dentro de la APK.
// 2. La comprime en dist/ota/ciempi-web-<versión>-<sello>.zip.
// 3. Copia las APK de descargas/ (CIEMPI-x.y.z.apk, se suben a mano) a dist/descargas/.
// 4. Escribe dist/ota/ultima.json, lo que lee la app al abrirse.
//
// Variables: CIEMPI_COMPILACION (sello AAAAMMDDhhmmss; por omisión, la fecha del último commit),
// CIEMPI_DESCARGAS (carpeta de las APK; por omisión descargas/).
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { crc32, deflateRawSync } from 'node:zlib'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const paquete = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8'))
const version = paquete.version
const nativaMinima = paquete.ciempi?.nativaMinima
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`Versión rara en package.json: ${version}`)
if (!/^\d+\.\d+\.\d+$/.test(nativaMinima ?? '')) throw new Error('Falta "ciempi": { "nativaMinima": "x.y.z" } en package.json')

function selloDeCompilacion() {
  if (process.env.CIEMPI_COMPILACION) return process.env.CIEMPI_COMPILACION
  let fecha = new Date()
  try {
    const segundos = execFileSync('git', ['log', '-1', '--format=%ct'], { cwd: raiz, encoding: 'utf8' }).trim()
    if (segundos) fecha = new Date(Number(segundos) * 1000)
  } catch {
    // Sin git: la hora de ahora.
  }
  return fecha.toISOString().replace(/\D/g, '').slice(0, 14)
}
const compilacion = selloDeCompilacion()
if (!/^\d{14}$/.test(compilacion)) throw new Error(`CIEMPI_COMPILACION debe ser AAAAMMDDhhmmss: ${compilacion}`)
const nombre = `${version}-${compilacion}`

const dist = join(raiz, 'dist')
if (!existsSync(join(dist, 'index.html'))) throw new Error('Falta dist/index.html: corre antes npm run build')

// 1. La web en modo APK, con el mismo sello que irá en el manifiesto.
const web = join(raiz, '.ota', 'web')
console.log(`→ Compilando la web en modo APK (${nombre})…`)
execFileSync(join(raiz, 'node_modules', '.bin', 'vite'), ['build', '--mode', 'apk', '--outDir', web, '--emptyOutDir', '--logLevel', 'warn'], {
  cwd: raiz,
  stdio: 'inherit',
  env: { ...process.env, CIEMPI_COMPILACION: compilacion },
})
if (!existsSync(join(web, 'index.html'))) throw new Error('La compilación en modo APK no dejó index.html')
const js = listar(web).filter((r) => r.endsWith('.js'))
if (!js.some((r) => readFileSync(join(web, r), 'utf8').includes(compilacion))) {
  throw new Error('El paquete no lleva el sello de compilación: ¿cambió vite.config.ts?')
}

// 2. El zip (index.html en la raíz, como lo espera el plugin).
function listar(carpeta) {
  const salida = []
  const recorrer = (actual) => {
    for (const entrada of readdirSync(actual, { withFileTypes: true })) {
      const ruta = join(actual, entrada.name)
      if (entrada.isDirectory()) recorrer(ruta)
      else if (entrada.isFile()) salida.push(relative(carpeta, ruta).split(sep).join('/'))
    }
  }
  recorrer(carpeta)
  return salida.sort()
}

/** Zip mínimo (deflate, sin zip64): suficiente para una web de unos MB, sin dependencias. */
function crearZip(carpeta) {
  const locales = []
  const central = []
  let desplazamiento = 0
  // Fecha fija (1980-01-01): el mismo contenido da el mismo zip.
  const hora = 0
  const dia = (0 << 9) | (1 << 5) | 1
  for (const ruta of listar(carpeta)) {
    const datos = readFileSync(join(carpeta, ruta))
    const comprimido = deflateRawSync(datos, { level: 9 })
    const usarDeflate = comprimido.length < datos.length
    const cuerpo = usarDeflate ? comprimido : datos
    const metodo = usarDeflate ? 8 : 0
    const nombreArchivo = Buffer.from(ruta, 'utf8')
    const crc = crc32(datos) >>> 0
    if (datos.length > 0xffffffff || desplazamiento > 0xffffffff) throw new Error('Paquete demasiado grande para zip sin zip64')

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6) // nombres en UTF-8
    local.writeUInt16LE(metodo, 8)
    local.writeUInt16LE(hora, 10)
    local.writeUInt16LE(dia, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(cuerpo.length, 18)
    local.writeUInt32LE(datos.length, 22)
    local.writeUInt16LE(nombreArchivo.length, 26)
    local.writeUInt16LE(0, 28)
    locales.push(local, nombreArchivo, cuerpo)

    const cabecera = Buffer.alloc(46)
    cabecera.writeUInt32LE(0x02014b50, 0)
    cabecera.writeUInt16LE(20, 4)
    cabecera.writeUInt16LE(20, 6)
    cabecera.writeUInt16LE(0x0800, 8)
    cabecera.writeUInt16LE(metodo, 10)
    cabecera.writeUInt16LE(hora, 12)
    cabecera.writeUInt16LE(dia, 14)
    cabecera.writeUInt32LE(crc, 16)
    cabecera.writeUInt32LE(cuerpo.length, 20)
    cabecera.writeUInt32LE(datos.length, 24)
    cabecera.writeUInt16LE(nombreArchivo.length, 28)
    cabecera.writeUInt32LE(0, 38)
    cabecera.writeUInt32LE(desplazamiento, 42)
    central.push(cabecera, nombreArchivo)

    desplazamiento += local.length + nombreArchivo.length + cuerpo.length
  }
  const directorio = Buffer.concat(central)
  const fin = Buffer.alloc(22)
  fin.writeUInt32LE(0x06054b50, 0)
  const cantidad = central.length / 2
  if (cantidad > 0xffff) throw new Error('Demasiados archivos para zip sin zip64')
  fin.writeUInt16LE(cantidad, 8)
  fin.writeUInt16LE(cantidad, 10)
  fin.writeUInt32LE(directorio.length, 12)
  fin.writeUInt32LE(desplazamiento, 16)
  return Buffer.concat([...locales, directorio, fin])
}

const ota = join(dist, 'ota')
mkdirSync(ota, { recursive: true })
const zip = crearZip(web)
const archivoZip = `ciempi-web-${nombre}.zip`
writeFileSync(join(ota, archivoZip), zip)
const sha256 = createHash('sha256').update(zip).digest('hex')

// 3. Las APK para descargar a mano (canal directo). dist/ se borra en cada build: se copian de nuevo.
const compararVersiones = (a, b) => {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i]
  return 0
}
const carpetaApk = resolve(raiz, process.env.CIEMPI_DESCARGAS ?? 'descargas')
let apk = null
if (existsSync(carpetaApk)) {
  const apks = readdirSync(carpetaApk)
    .map((a) => ({ archivo: a, version: /^CIEMPI-(\d+\.\d+\.\d+)\.apk$/.exec(a)?.[1] }))
    .filter((a) => a.version && statSync(join(carpetaApk, a.archivo)).isFile())
    .sort((a, b) => compararVersiones(a.version, b.version))
  if (apks.length > 0) {
    mkdirSync(join(dist, 'descargas'), { recursive: true })
    for (const a of apks) copyFileSync(join(carpetaApk, a.archivo), join(dist, 'descargas', a.archivo))
    const ultima = apks.at(-1)
    apk = { version: ultima.version, url: `../descargas/${ultima.archivo}` }
  }
}

// 4. El manifiesto, al final y de una vez (nadie lee uno a medio escribir).
const manifiesto = {
  version,
  compilacion,
  paquete: nombre,
  url: archivoZip,
  sha256,
  // El plugin (@capgo/capacitor-updater) llama así al SHA-256 del zip.
  checksum: sha256,
  nativaMinima,
  apk,
  tamano: zip.length,
  publicado: new Date().toISOString(),
}
const temporal = join(ota, 'ultima.json.tmp')
writeFileSync(temporal, `${JSON.stringify(manifiesto, null, 2)}\n`)
renameSync(temporal, join(ota, 'ultima.json'))
rmSync(join(raiz, '.ota'), { recursive: true, force: true })

console.log(`→ dist/ota/${archivoZip} (${(zip.length / 1024 / 1024).toFixed(1)} MB, sha256 ${sha256.slice(0, 12)}…)`)
console.log(`→ dist/ota/ultima.json (APK mínima ${nativaMinima}${apk ? `, APK para descargar ${apk.version}` : ', sin APK en descargas/'})`)
