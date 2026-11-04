import { describe, expect, it } from 'vitest'
import type { ProductoVentaEspecial } from '@/interfaces/producto'
import { elegirModoDescuento, getOfertaPorcentajeAplicado, resolveOfertaPrecios } from './ofertaPrecios'
import { resolvePreciosMoneda } from './productoPrecios'

function pool(
    partial: Partial<ProductoVentaEspecial> & Pick<ProductoVentaEspecial, 'porcentajeDescuento'>,
): ProductoVentaEspecial {
    return {
        nroPool: 1,
        orden: 1,
        cantidadDisponible: partial.cantidadDisponible ?? 10,
        ...partial,
    }
}

describe('elegirModoDescuento', () => {
    it('oferta gana si es mayor que bonif1 + bonif2', () => {
        expect(elegirModoDescuento(15, 5, 25)).toBe('oferta')
    })

    it('bonificaciones ganan si suma es mayor', () => {
        expect(elegirModoDescuento(15, 10, 20)).toBe('bonificacion')
    })

    it('empate favorece bonificaciones', () => {
        expect(elegirModoDescuento(15, 5, 20)).toBe('bonificacion')
    })
})

describe('resolveOfertaPrecios', () => {
    const base = {
        enOferta: 'S' as const,
        itemProductoVentaEspeciales: [pool({ porcentajeDescuento: 25 })],
        precioMostrar: 850,
        precioListaMostrar: 1000,
        bonificacion1: 15,
        bonificacion2: 0,
        quantity: 1,
    }

    it('aplica oferta sobre lista cuando oferta gana', () => {
        const r = resolveOfertaPrecios(base)
        expect(r.modoDescuento).toBe('oferta')
        expect(r.aplicaOfertaStock).toBe(true)
        expect(r.precioOriginalUnitario).toBe(1000)
        expect(r.precioOfertaUnitario).toBe(750)
        expect(r.porcentajeOferta).toBe(25)
    })

    it('aplica bonificaciones cuando suma gana', () => {
        const r = resolveOfertaPrecios({
            ...base,
            itemProductoVentaEspeciales: [pool({ porcentajeDescuento: 15 })],
            bonificacion2: 10,
        })
        expect(r.modoDescuento).toBe('bonificacion')
        expect(r.aplicaOfertaStock).toBe(false)
        expect(r.porcentajeOferta).toBe(0)
        expect(r.precioOfertaUnitario).toBe(765)
    })

    it('empate usa bonificaciones y no aplica oferta', () => {
        const r = resolveOfertaPrecios({
            ...base,
            itemProductoVentaEspeciales: [pool({ porcentajeDescuento: 20 })],
            bonificacion1: 15,
            bonificacion2: 5,
        })
        expect(r.modoDescuento).toBe('bonificacion')
        expect(r.aplicaOfertaStock).toBe(false)
        expect(getOfertaPorcentajeAplicado(
            { enOferta: 'S', itemProductoVentaEspeciales: [pool({ porcentajeDescuento: 20 })] },
            15,
            5,
        )).toBeNull()
    })

    it('sin stock de oferta no aplica oferta; bonif1 sigue activa si hay diferencia', () => {
        const r = resolveOfertaPrecios({
            ...base,
            enOferta: 'N',
            itemProductoVentaEspeciales: [pool({ porcentajeDescuento: 20, cantidadDisponible: 0 })],
        })
        expect(r.modoDescuento).toBe('bonificacion')
        expect(r.aplicaOfertaStock).toBe(false)
        expect(r.activa).toBe(true)
        expect(r.precioOfertaUnitario).toBe(850)
        expect(r.precioOriginalUnitario).toBe(1000)
    })

    it('producto 999-006060073: solo % del pool sobre lista del producto', () => {
        const offerPool = pool({ porcentajeDescuento: 35, precioNormalConIVA: 681546.8385 })
        const { precioMostrar, precioListaMostrar } = resolvePreciosMoneda({
            monedaProducto: 'USD',
            currency: 'ARS',
            precioFinalPeso: 563261.85,
            precioFinalDolar: 380.5823324584961,
            precioReferencia: 563261.85,
            cotizacionUSD: 1480,
        })
        const r = resolveOfertaPrecios({
            enOferta: 'S',
            itemProductoVentaEspeciales: [offerPool],
            precioMostrar,
            precioListaMostrar,
            bonificacion1: 0,
            bonificacion2: 0,
        })
        expect(r.modoDescuento).toBe('oferta')
        expect(r.precioOriginalUnitario).toBe(563261.85)
        expect(r.precioOfertaUnitario).toBe(366120.2)
    })

    it('solo bonif1 con lista=final: activa e infiere original', () => {
        const final = 14291.57
        const r = resolveOfertaPrecios({
            precioMostrar: final,
            precioListaMostrar: final,
            bonificacion1: 10,
            bonificacion2: 0,
            quantity: 1,
        })
        expect(r.activa).toBe(true)
        expect(r.modoDescuento).toBe('bonificacion')
        expect(r.precioOfertaUnitario).toBe(final)
        expect(r.precioOriginalUnitario).toBe(Math.round((final / 0.9) * 100) / 100)
        expect(r.porcentajeBonificacion1).toBe(10)
    })

    it('lista=final sin bonif ni oferta: inactive', () => {
        const r = resolveOfertaPrecios({
            precioMostrar: 1000,
            precioListaMostrar: 1000,
            bonificacion1: 0,
            bonificacion2: 0,
            quantity: 1,
        })
        expect(r.activa).toBe(false)
        expect(r.modoDescuento).toBe('ninguno')
        expect(r.precioOriginalUnitario).toBe(1000)
        expect(r.precioOfertaUnitario).toBe(1000)
    })
})
