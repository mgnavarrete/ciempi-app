// Interfaz del laboratorio de transformaciones (LABORATORIO, no integrado al juego).
// Usa sin modificarlos el cargador y el compositor del juego (src/ciempi/v2/arte),
// pose.ts/especie.ts/compatibilidad.ts traducidos a gen/ y el rig de animación.
import { ANIMACIONES } from '../../../src/ciempi/v2/animacion/animaciones.js'
import { Reproductor } from '../../../src/ciempi/v2/animacion/motor.js'
import { aApariencia, ESPECIES } from './especies.js'
import { etiquetar } from './gen/compatibilidad.js'
import { env, INICIAL, escenaDe, dibujar, nuevoRig, mostrarError } from './nucleo.js'

const $ = (s) => document.querySelector(s)
const PARTE_DE = { paleta: 'paleta', expresion: 'gesto', ojos: 'ojos', cabeza: 'cabeza', cara: 'cara', pelo: 'pelo', detalle: 'detalle', cuello: 'cuello', espalda: 'espalda', pies: 'pies', textura: 'textura' }
const VARIANTE_DE = { cuello: 'variante', cara: 'varianteLentes', espalda: 'varianteCapa' }
const TEXTO_TIPO = { universal: 'universal', adaptable: 'adaptable', exclusivo: 'exclusivo', oculto: 'oculto en esta especie' }

// ── Estado de la interfaz ────────────────────────────────────────────────────
const estado = { especie: 'dragon', comparar: 'ciempi', n: 5, sel: { ...INICIAL }, anim: ANIMACIONES[0] }
const params = new URLSearchParams(location.search)
if (params.get('especie') in ESPECIES) estado.especie = params.get('especie')
if (params.has('n')) estado.n = Math.max(0, Math.min(40, +params.get('n') || 0))
if (params.has('comparar')) estado.comparar = params.get('comparar')
if (params.has('sel')) try { Object.assign(estado.sel, JSON.parse(params.get('sel'))) } catch { /* selección inválida: se ignora */ }
if (params.get('fondo') === 'oscuro') document.body.dataset.fondo = 'oscuro'

let rigs = []
const reproductor = new Reproductor((pose, t) => {
  for (const r of rigs) {
    r.cambiarRostro($('#exp-anim').checked && pose.expresion ? pose.expresion : estado.sel.expresion)
    r.aplicar(pose)
  }
  $('#reproducir').textContent = reproductor.reproduciendo ? '❚❚' : '▶'
  $('#costo').textContent = `t = ${t.toFixed(2).replace('.', ',')} s · ${reproductor.costo().toFixed(2).replace('.', ',')} ms por cuadro (${rigs.length} rigs)`
})
reproductor.suelo = false

let generacion = 0
async function actualizar() {
  const mia = ++generacion
  try {
    const { especie, comparar, n, sel } = estado
    const a = await escenaDe(especie, sel, n)
    const b = comparar ? await escenaDe(comparar, sel, n) : null
    const tamanos = await Promise.all([{ alto: 84 }, { ancho: 96 }, { ancho: 240 }, { ancho: 320 }].map(async (t) => ({ t, e: await escenaDe(especie, sel, n) })))
    if (mia !== generacion) return
    const nuevos = []
    const montar = (e, lienzo, opciones) => {
      const { svg, g } = dibujar(e, opciones)
      lienzo.replaceChildren(svg)
      try { nuevos.push(nuevoRig(e, g)) } catch (err) { console.error('Rig:', err) }
    }
    montar(a, $('#lienzo-a'))
    $('#titulo-a').textContent = `${ESPECIES[especie].nombre} · N = ${n} · ${ESPECIES[especie].estado}`
    $('#vista-b').hidden = !b
    $('#ab').classList.toggle('doble', !!b)
    if (b) { montar(b, $('#lienzo-b')); $('#titulo-b').textContent = `${ESPECIES[comparar].nombre} · misma selección · N = ${n}` }
    $('#tamanos').replaceChildren(...tamanos.map(({ t, e }) => {
      const fig = document.createElement('figure')
      const cap = document.createElement('figcaption')
      cap.textContent = t.alto ? `${t.alto} px de alto (pista)` : `${t.ancho} px de ancho`
      const lienzo = document.createElement('div')
      fig.append(lienzo, cap)
      montar(e, lienzo, t)
      return fig
    }))
    rigs = nuevos
    for (const r of rigs) for (const id of estado.anim.expresiones || []) r.precargarRostro(id)
    reproductor.segmentos = n
    reproductor.dibujar()
    pintarCompatibilidad(a)
    pintarEtiquetas()
    $('#estado-especie').textContent = ESPECIES[especie].estado + (ESPECIES[especie].exclusivos.length ? ` · exclusivos: ${ESPECIES[especie].exclusivos.map((x) => x.nombre).join(', ')}` : '')
    document.body.dataset.listo = String(mia)
  } catch (e) { mostrarError(e) }
}

function pintarCompatibilidad(e) {
  const r = e.resolucion
  const items = Object.values(r.etiquetas).map((et) => {
    const li = document.createElement('li')
    const tipo = et.visible ? et.tipo : 'oculto'
    li.innerHTML = `<b class="et ${tipo}">${TEXTO_TIPO[tipo]}</b> ${et.parte}: <code>${et.id}</code>${et.motivo ? ' — ' + et.motivo : ''}`
    return li
  })
  for (const rasgo of r.rasgosOcultos) {
    const li = document.createElement('li')
    li.innerHTML = `<b class="et oculto">rasgo guardado</b> ${rasgo}: lo tapa una pieza puesta (vuelve al quitarla).`
    items.push(li)
  }
  $('#compat').replaceChildren(...items)
}

// ── Controles ────────────────────────────────────────────────────────────────
function controles() {
  $('#criaturas').replaceChildren(...Object.values(ESPECIES).map((e) => {
    const b = document.createElement('button')
    b.type = 'button'; b.textContent = e.nombre; b.dataset.especie = e.id; b.setAttribute('role', 'radio')
    b.onclick = () => { estado.especie = e.id; marcarCriatura(); actualizar() }
    return b
  }))
  marcarCriatura()
  $('#n').value = estado.n; $('#n-valor').textContent = estado.n
  $('#n').oninput = () => { estado.n = +$('#n').value; $('#n-valor').textContent = estado.n; actualizar() }
  $('#n-rapidos').replaceChildren(...[0, 1, 2, 5, 8, 12, 22, 40].map((n) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = n
    b.onclick = () => { estado.n = n; $('#n').value = n; $('#n-valor').textContent = n; actualizar() }
    return b
  }))
  $('#conjuntos').replaceChildren(...env.sets.map((s) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = s.nombre
    b.onclick = () => { estado.sel = { ...INICIAL, ...s.seleccion }; if (!s.seleccion.expresion) estado.sel.expresion = INICIAL.expresion; sincronizarSelects(); actualizar() }
    return b
  }))
  $('#restaurar').onclick = () => { estado.sel = { ...INICIAL }; sincronizarSelects(); actualizar() }

  const cont = $('#categorias')
  for (const [clave, nombre, items] of env.groups) {
    const div = document.createElement('div'); div.className = 'categoria'
    const fila = document.createElement('div'); fila.className = 'fila'
    const label = document.createElement('label'); label.textContent = nombre; label.htmlFor = 'sel-' + clave
    const select = document.createElement('select'); select.id = 'sel-' + clave; select.dataset.clave = clave
    const opciones = clave === 'expresion' ? items.filter((x) => x.id.startsWith('b03-')) : items
    for (const it of opciones) select.append(new Option(it.nombre, it.id))
    if (clave === 'espalda') select.append(new Option('Alitas de dragón (exclusivo)', 'dragon-alas'))
    const et = document.createElement('span'); et.className = 'et'; et.dataset.etiqueta = clave
    select.onchange = () => { estado.sel[clave] = select.value; pintarVariante(clave, items, div); actualizar() }
    fila.append(label, select, et); div.append(fila); cont.append(div)
    pintarVariante(clave, items, div)
  }
  sincronizarSelects()

  $('#anim').replaceChildren(...ANIMACIONES.map((a) => new Option(`${a.id} · ${a.nombre}`, a.id)))
  $('#anim').onchange = () => { estado.anim = ANIMACIONES.find((a) => a.id === $('#anim').value); reproductor.cargar({ ...estado.anim }); for (const r of rigs) for (const id of estado.anim.expresiones || []) r.precargarRostro(id) }
  $('#reproducir').onclick = () => (reproductor.reproduciendo ? reproductor.pausar() : reproductor.reproducir())
  $('#reiniciar').onclick = () => reproductor.reiniciar()
  $('#velocidad').oninput = () => { reproductor.velocidad = +$('#velocidad').value; $('#vel-valor').textContent = $('#velocidad').value.replace('.', ',') + '×' }
  const reducePreferido = matchMedia('(prefers-reduced-motion: reduce)').matches
  $('#reducido').checked = reducePreferido
  const aplicarReducido = () => { reproductor.movimiento = $('#reducido').checked ? 0.35 : 1; reproductor.dibujar() }
  $('#reducido').onchange = aplicarReducido; aplicarReducido()
  $('#exp-anim').onchange = () => reproductor.dibujar()
  for (const r of document.querySelectorAll('input[name=fondo]')) {
    r.checked = r.value === document.body.dataset.fondo
    r.onchange = () => { document.body.dataset.fondo = r.value }
  }
  for (const e of Object.values(ESPECIES)) $('#comparar').append(new Option(e.nombre, e.id))
  $('#comparar').value = estado.comparar
  $('#comparar').onchange = () => { estado.comparar = $('#comparar').value; actualizar() }
  reproductor.cargar({ ...estado.anim })
  if (!reducePreferido && !params.has('quieto')) reproductor.reproducir()
}

function pintarVariante(clave, items, div) {
  div.querySelector('.variante')?.remove()
  const it = items.find((x) => x.id === estado.sel[clave])
  const vk = VARIANTE_DE[clave]
  if (!vk || !it?.variantes?.length) return
  const fila = document.createElement('div'); fila.className = 'fila variante'
  const label = document.createElement('label'); label.textContent = 'Variante'
  const s = document.createElement('select')
  for (const v of it.variantes) s.append(new Option(v.nombre, v.id))
  s.value = it.variantes.some((v) => v.id === estado.sel[vk]) ? estado.sel[vk] : it.variantes[0].id
  s.onchange = () => { estado.sel[vk] = s.value; actualizar() }
  fila.append(label, s); div.append(fila)
}

function sincronizarSelects() {
  for (const s of document.querySelectorAll('#categorias select[data-clave]')) {
    const v = estado.sel[s.dataset.clave]
    s.value = [...s.options].some((o) => o.value === v) ? v : s.options[0].value
    const grupo = env.groups.find((g) => g[0] === s.dataset.clave)
    pintarVariante(s.dataset.clave, grupo[2], s.closest('.categoria'))
  }
}

function marcarCriatura() {
  for (const b of document.querySelectorAll('#criaturas button')) b.setAttribute('aria-checked', String(b.dataset.especie === estado.especie))
}

function pintarEtiquetas() {
  const apariencia = aApariencia(estado.sel)
  for (const span of document.querySelectorAll('[data-etiqueta]')) {
    const clave = span.dataset.etiqueta, parte = PARTE_DE[clave]
    const et = etiquetar(parte, apariencia[parte], estado.especie)
    const tipo = et.visible ? et.tipo : 'oculto'
    span.className = 'et ' + tipo
    span.textContent = TEXTO_TIPO[tipo]
    span.title = et.motivo || ''
  }
}

if (!params.has('sin-interfaz')) { controles(); await actualizar() }
window.lab = { env, escenaDe, dibujar, nuevoRig, estado, actualizar, ANIMACIONES }
document.body.dataset.cargado = '1'
