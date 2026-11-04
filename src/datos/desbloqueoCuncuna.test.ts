import { describe, expect, it } from 'vitest'
import { ORIGINALES_N0, motivoCuncuna } from './desbloqueoCuncuna'
import { CUENTOS } from '../contenido/cuentos'

describe('regla local de la Cuncuna', () => {
  // La comparación con server/src/desbloqueos.ts vive en server/test/desbloqueo-cliente.test.ts
  // (la compilación de la app no debe importar código del servidor).

  it('6 de N0, todos los que queden si quitaron (mínimo 4), o 6 cuentos de cualquier nivel', () => {
    const leido = (id: string, pagado = 10) => ({ textoId: id, total: 10, pagado })
    const n0 = ORIGINALES_N0.map((id) => leido(id, 0))
    expect(motivoCuncuna(n0)).toBeNull()
    expect(motivoCuncuna(n0.map((c, i) => (i < 6 ? leido(c.textoId) : c)))).toBe('nivel0')
    expect(motivoCuncuna(n0.map((c, i) => (i < 5 ? leido(c.textoId) : c)))).toBeNull()
    // Quitaron 4 de N0: con los 4 que quedan, basta.
    expect(motivoCuncuna(ORIGINALES_N0.slice(0, 4).map((id) => leido(id)))).toBe('nivel0')
    expect(motivoCuncuna(ORIGINALES_N0.slice(0, 3).map((id) => leido(id)))).toBeNull()
    const otros = CUENTOS.filter((c) => c.nivel > 0).slice(0, 6).map((c) => leido(c.id))
    expect(motivoCuncuna([...n0, ...otros])).toBe('cuentos')
    // Un texto propio no cuenta.
    expect(motivoCuncuna([...n0, ...otros.slice(0, 5), leido('propio')])).toBeNull()
  })
})
