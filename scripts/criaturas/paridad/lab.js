// Página de paridad del LABORATORIO (referencia aprobada): nucleo.js tal cual, sin
// modificarlo, con la selección que usan las láminas de variantes (laminas-v4.js).
import { INICIAL, escenaDe } from '../../../docs/rediseno-ciempi/laboratorio-transformaciones/nucleo.js'
import { CATALOGO, buscarVariante } from '../../../docs/rediseno-ciempi/laboratorio-transformaciones/variantes.js'
import { dibujarEscena } from './dibujar.js'

window.paridad = {
  inicial: INICIAL,
  variantes: Object.values(CATALOGO).flatMap((e) => e.variantes.map((v) => v.id)),
  async dibujar(id, sel, n) {
    const { especie } = buscarVariante(id)
    const e = await escenaDe(especie, { ...sel, rostro: CATALOGO[especie].disenoBase.rostro, varianteEspecie: id }, n)
    return dibujarEscena(e)
  },
}
document.body.dataset.listo = '1'
