import { describe, expect, it } from 'vitest'
import { tienePrecioListaVisible } from './productoPrecios'

describe('tienePrecioListaVisible', () => {
    it('false si lista y venta redondean al mismo valor a 2 decimales', () => {
        expect(tienePrecioListaVisible(79659.474, 79659.471)).toBe(false)
        expect(tienePrecioListaVisible(117276.78, 117276.78)).toBe(false)
    })

    it('true si la lista es claramente mayor a 2 decimales', () => {
        expect(tienePrecioListaVisible(1000, 850)).toBe(true)
        expect(tienePrecioListaVisible(100.015, 100.004)).toBe(true)
    })

    it('false si falta lista o venta', () => {
        expect(tienePrecioListaVisible(0, 100)).toBe(false)
        expect(tienePrecioListaVisible(100, 0)).toBe(false)
    })
})
