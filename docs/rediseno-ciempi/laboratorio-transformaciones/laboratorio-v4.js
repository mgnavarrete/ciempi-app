// Controles V4 del laboratorio (T03 Serpiente, T04 Camaleón), en archivo aparte para
// no tocar laboratorio.js: interruptor de la lengüita de la Serpiente y aviso del
// camuflaje del Camaleón. Espera a que laboratorio.js publique window.lab.
const esperar = () => new Promise((ok) => { const v = () => (window.lab && document.body.dataset.cargado ? ok(window.lab) : requestAnimationFrame(v)); v() })
const lab = await esperar()
const caja = document.querySelector('#estado-especie')?.parentElement
if (caja) {
  const fila = document.createElement('label')
  fila.className = 'fila'
  fila.id = 'v4-lengua'
  fila.innerHTML = '<input type="checkbox" id="lengua-v4" checked> Lengüita de la Serpiente (en expresiones sonrientes)'
  // Iteración de Serpiente y Camaleón: v2 (rostro propio, por omisión) o v1 (rostro de Ciempi, para comparar).
  const iter = document.createElement('label')
  iter.className = 'fila'
  iter.id = 'v4-iter'
  iter.innerHTML = 'Iteración <select id="iter-v4"><option value="v2">v2 · rostro propio</option><option value="v1">v1 · rostro de Ciempi</option></select>'
  const nota = document.createElement('p')
  nota.className = 'ayuda'
  nota.id = 'v4-nota'
  caja.append(iter, fila, nota)
  const pintar = () => {
    const e = lab.estado.especie
    fila.hidden = e !== 'serpiente'
    iter.hidden = e !== 'serpiente' && e !== 'camaleon'
    nota.textContent = e === 'camaleon' ? 'Camuflaje: con la paleta Clásico, el Camaleón toma los colores del conjunto o la superficie puestos.' : e === 'serpiente' ? 'Sin patas: el calzado se guarda puesto y vuelve en otra criatura.' : ''
  }
  fila.querySelector('input').onchange = (ev) => { lab.estado.sel.lengua = ev.target.checked ? 'si' : 'no'; lab.actualizar() }
  const params = new URLSearchParams(location.search)
  const sel = iter.querySelector('select')
  if (params.get('iter') === 'v1') { sel.value = 'v1'; lab.estado.sel.iter = 'v1'; lab.actualizar() }
  sel.onchange = () => { if (sel.value === 'v1') lab.estado.sel.iter = 'v1'; else delete lab.estado.sel.iter; lab.actualizar() }
  for (const b of document.querySelectorAll('#criaturas button')) b.addEventListener('click', () => requestAnimationFrame(pintar))
  pintar()
}
