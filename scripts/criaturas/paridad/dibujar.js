// Dibujo común de las dos páginas de paridad (laboratorio y juego): la misma
// escena (html + viewBox de pose.ts) en un <svg> de ancho fijo, con las imágenes
// ya decodificadas antes de avisar que está lista.
const NS = 'http://www.w3.org/2000/svg'
export async function dibujarEscena(e, ancho = 640) {
  const [x, y, w, h] = e.viewBox.split(' ').map(Number)
  const lienzo = document.querySelector('#lienzo')
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`)
  svg.setAttribute('width', ancho)
  svg.setAttribute('height', Math.round((ancho * h) / w))
  svg.innerHTML = `<g>${e.html}</g>`
  if (new URLSearchParams(location.search).has('transparente')) document.documentElement.style.background = document.body.style.background = 'transparent'
  lienzo.replaceChildren(svg)
  const hrefs = [...new Set([...svg.querySelectorAll('image')].map((i) => i.getAttribute('href')))]
  await Promise.all(hrefs.map((u) => { const im = new Image(); im.src = u; return im.decode().catch(() => { throw Error('No carga ' + u) }) }))
  await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))
  await new Promise((ok) => setTimeout(ok, Number(new URLSearchParams(location.search).get('espera') || 60)))
  return { imagenes: hrefs.length, ancho, alto: Math.round((ancho * h) / w) }
}
