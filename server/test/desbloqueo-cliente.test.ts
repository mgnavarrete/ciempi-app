import { describe, expect, it } from 'vitest'
import { CUNCUNA as CUNCUNA_SERVIDOR, ORIGINALES_N0 as N0_SERVIDOR, REGLA_CUNCUNA } from '../src/desbloqueos'
import { CUNCUNA, ORIGINALES_N0, REGLA_CUNCUNA_LOCAL } from '../../src/datos/desbloqueoCuncuna'

// Movida desde src/datos/desbloqueoCuncuna.test.ts: la app no debe compilar código del servidor.
describe('regla local de la Cuncuna', () => {
  it('usa los mismos números y cuentos que el servidor', () => {
    expect(CUNCUNA).toBe(CUNCUNA_SERVIDOR)
    expect(ORIGINALES_N0).toEqual(N0_SERVIDOR)
    expect(REGLA_CUNCUNA_LOCAL).toEqual({ cuentosMinimos: REGLA_CUNCUNA.cuentosMinimos, minimoSiQuitaron: REGLA_CUNCUNA.minimoSiQuitaron })
  })
})
