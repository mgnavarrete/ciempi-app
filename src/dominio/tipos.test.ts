import { describe, expect, it } from 'vitest'
import { normalizarAjustes } from './tipos'

describe('normalizarAjustes', () => {
  it('«leer con voz: no» de antes pasa a leer sin voz; si no se eligió nada, depende del nivel', () => {
    expect(normalizarAjustes({ conVoz: false } as never).modoVoz).toBe('solo')
    expect(normalizarAjustes({ conVoz: true } as never).modoVoz).toBeUndefined()
    expect(normalizarAjustes({}).modoVoz).toBeUndefined()
    expect(normalizarAjustes({ modoVoz: 'eco' }).modoVoz).toBe('eco')
    expect(normalizarAjustes({ conVoz: false } as never)).not.toHaveProperty('conVoz')
  })
})
