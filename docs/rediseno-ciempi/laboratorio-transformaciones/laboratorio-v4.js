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
  const nota = document.createElement('p')
  nota.className = 'ayuda'
  nota.id = 'v4-nota'
  caja.append(fila, nota)
  const pintar = () => {
    const e = lab.estado.especie
    fila.hidden = e !== 'serpiente'
    nota.textContent = e === 'camaleon' ? 'Camuflaje: con la paleta Clásico, el Camaleón toma los colores del conjunto o la superficie puestos.' : e === 'serpiente' ? 'Sin patas: el calzado se guarda puesto y vuelve en otra criatura.' : ''
  }
  fila.querySelector('input').onchange = (ev) => { lab.estado.sel.lengua = ev.target.checked ? 'si' : 'no'; lab.actualizar() }
  for (const b of document.querySelectorAll('#criaturas button')) b.addEventListener('click', () => requestAnimationFrame(pintar))
  pintar()
}
