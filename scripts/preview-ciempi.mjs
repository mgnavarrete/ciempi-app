// Ejecutar desde la raíz: node scripts/preview-ciempi.mjs
// Lámina estática de los componentes reales; no reemplaza la revisión en móvil.
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'node:fs'

const destino = 'docs/rediseno-ciempi'
mkdirSync(destino, { recursive: true })
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { CiempiPersonaje } = await server.ssrLoadModule('/src/ciempi/CiempiPersonaje.tsx')
  const { APARIENCIA_INICIAL } = await server.ssrLoadModule('/src/ciempi/catalogo.ts')
  const variantes = [['Antenas', 'cabeza-antenas'], ['Jockey', 'cabeza-jockey'], ['Gorro de lana', 'cabeza-gorro-lana'], ['Astronauta', 'cabeza-astronauta']]
  let contenido = '<rect width="1200" height="840" fill="#fdf8ee"/><text x="52" y="60" font-family="sans-serif" font-size="30" font-weight="bold" fill="#223d5d">Ciempi · Primera implementación ilustrada</text>'
  for (const [i, [nombre, cabeza]] of variantes.entries()) {
    const dibujo = renderToStaticMarkup(createElement(CiempiPersonaje, {
      apariencia: { ...APARIENCIA_INICIAL, cabeza, pies: 'pies-zapatillas' }, ancho: 490, animado: false,
    }))
    contenido += `<g transform="translate(${40 + i % 2 * 580} ${95 + Math.floor(i / 2) * 350})"><rect width="550" height="325" rx="24" fill="white"/><text x="24" y="38" font-family="sans-serif" font-size="22" fill="#223d5d">${nombre}</text><g transform="translate(25 30)">${dibujo}</g></g>`
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="840" viewBox="0 0 1200 840">${contenido}</svg>`
  writeFileSync(`${destino}/ilustracion-implementada-v1.svg`, svg)
  await sharp(Buffer.from(svg)).png().toFile(`${destino}/ilustracion-implementada-v1.png`)
} finally {
  await server.close()
}
