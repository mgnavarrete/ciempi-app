import { describe, expect, it, vi } from 'vitest'
import { nuevoId } from './ids'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('nuevoId', () => {
  it('genera UUID v4 aunque no exista crypto.randomUUID (http en la red local)', () => {
    vi.stubGlobal('isSecureContext', false)
    const ids = new Set(Array.from({ length: 50 }, nuevoId))
    vi.unstubAllGlobals()
    expect(ids.size).toBe(50)
    for (const id of ids) expect(id).toMatch(UUID_V4)
  })
})
