import { describe, expect, it } from 'vitest'
import { isProductoNuevo } from './productoNuevo'

describe('isProductoNuevo', () => {
  it('returns true for S (case insensitive)', () => {
    expect(isProductoNuevo('S')).toBe(true)
    expect(isProductoNuevo('s')).toBe(true)
    expect(isProductoNuevo(' S ')).toBe(true)
  })

  it('returns false otherwise', () => {
    expect(isProductoNuevo('N')).toBe(false)
    expect(isProductoNuevo(null)).toBe(false)
    expect(isProductoNuevo(undefined)).toBe(false)
    expect(isProductoNuevo('')).toBe(false)
  })
})
