// Interruptor «Accesorios v1 / v4» del laboratorio de transformaciones.
// v1 = mochilas y calzado del juego tal cual; v4 = construcción de accesorios-v4.js.
// Cambia el parámetro `accesorios` y recarga conservando criatura, longitud, selección y fondo.
import { ACTIVO } from './accesorios-v4.js'

const fieldset = [...document.querySelectorAll('fieldset')].find((f) => f.querySelector('legend')?.textContent === 'Vista')
if (fieldset) {
  const fila = document.createElement('div')
  fila.className = 'botones pequenos'
  fila.setAttribute('role', 'radiogroup')
  fila.setAttribute('aria-label', 'Mochilas y calzado')
  fila.append('Mochilas y calzado:')
  for (const [valor, texto] of [['v1', 'Accesorios v1'], ['v4', 'Accesorios v4']]) {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = texto
    b.dataset.accesorios = valor
    b.setAttribute('role', 'radio')
    b.setAttribute('aria-checked', String((valor === 'v4') === ACTIVO))
    b.title = valor === 'v4' ? 'Mochila en el segmento con correas; pierna dentro del zapato (laboratorio, pendiente de aprobación)' : 'Vestuario del juego sin cambios'
    b.onclick = () => {
      if ((valor === 'v4') === ACTIVO) return
      const p = new URLSearchParams(location.search)
      const e = window.lab?.estado
      if (e) {
        p.set('especie', e.especie); p.set('n', e.n); p.set('sel', JSON.stringify(e.sel))
        if (e.comparar !== undefined) p.set('comparar', e.comparar)
      }
      if (document.body.dataset.fondo === 'oscuro') p.set('fondo', 'oscuro'); else p.delete('fondo')
      if (valor === 'v4') p.set('accesorios', 'v4'); else p.delete('accesorios')
      location.search = p.toString()
    }
    fila.append(b)
  }
  fieldset.append(fila)
}
