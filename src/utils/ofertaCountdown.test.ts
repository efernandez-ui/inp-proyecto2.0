import { describe, expect, it } from 'vitest'
import {
    computeCountdownProgress,
    formatTiempoRestante,
    isFechaCierreReal,
    parseOfertaFecha,
    resolveOfertaCountdownContext,
} from './ofertaCountdown'

describe('parseOfertaFecha', () => {
    it('parsea ISO como hora local sin desplazar UTC', () => {
        const d = parseOfertaFecha('2026-06-30T02:59:00.000+00:00')
        expect(d).not.toBeNull()
        expect(d!.getFullYear()).toBe(2026)
        expect(d!.getMonth()).toBe(5)
        expect(d!.getDate()).toBe(30)
        expect(d!.getHours()).toBe(2)
        expect(d!.getMinutes()).toBe(59)
        expect(d!.getSeconds()).toBe(0)
    })
})

describe('isFechaCierreReal', () => {
    it('rechaza fechas sentinela abiertas', () => {
        expect(isFechaCierreReal('2099-12-31T00:00:00.000+00:00')).toBe(false)
        expect(isFechaCierreReal('1900-01-01T00:00:00.000+00:00')).toBe(false)
    })

    it('acepta fecha de cierre real', () => {
        expect(isFechaCierreReal('2026-06-30T02:59:00.000+00:00')).toBe(true)
    })
})

describe('computeCountdownProgress', () => {
    it('calcula progreso intermedio', () => {
        const disdes = '2026-06-01T00:00:00.000+00:00'
        const dishas = '2026-06-11T00:00:00.000+00:00'
        const now = parseOfertaFecha('2026-06-06T00:00:00.000+00:00')!
        const r = computeCountdownProgress(disdes, dishas, now)
        expect(r.expired).toBe(false)
        expect(r.progressPct).toBe(50)
        expect(r.remainingMs).toBeGreaterThan(0)
    })

    it('marca expirado al pasar dishas', () => {
        const disdes = '2026-06-01T00:00:00.000+00:00'
        const dishas = '2026-06-11T00:00:00.000+00:00'
        const now = parseOfertaFecha('2026-06-12T00:00:00.000+00:00')!
        const r = computeCountdownProgress(disdes, dishas, now)
        expect(r.expired).toBe(true)
        expect(r.remainingMs).toBe(0)
    })
})

describe('formatTiempoRestante', () => {
    it('muestra días con horas minutos y segundos', () => {
        const label = formatTiempoRestante(2 * 86_400_000 + 3 * 3_600_000 + 5 * 60_000 + 7_000)
        expect(label).toBe('FALTAN 2 DÍAS 3H 05M 07S')
    })

    it('muestra horas minutos y segundos bajo un día', () => {
        expect(formatTiempoRestante(2 * 3_600_000 + 15 * 60_000 + 30_000)).toBe('FALTAN 2H 15M 30S')
    })

    it('muestra solo segundos al final', () => {
        expect(formatTiempoRestante(45_000)).toBe('FALTAN 45S')
    })
})

describe('resolveOfertaCountdownContext', () => {
    const poolBase = {
        nroPool: 1,
        orden: 1,
        cantidadDisponible: 5,
        porcentajeDescuento: 13,
        cuentaRegresiva: true,
        ofertaDisdes: '2026-06-01T00:00:00.000+00:00',
        ofertaDishas: '2099-12-31T00:00:00.000+00:00',
    }

    it('oculta si no hay cuenta regresiva', () => {
        const r = resolveOfertaCountdownContext({
            enOferta: 'S',
            itemProductoVentaEspeciales: [{ ...poolBase, cuentaRegresiva: false }],
            ofertaPrecios: { modoDescuento: 'oferta', aplicaOfertaStock: true },
        })
        expect(r.shouldShow).toBe(false)
    })

    it('oculta si stock es 0', () => {
        const r = resolveOfertaCountdownContext({
            enOferta: 'S',
            itemProductoVentaEspeciales: [{ ...poolBase, cantidadDisponible: 0, ofertaDishas: '2026-12-31T23:59:00.000+00:00' }],
            ofertaPrecios: { modoDescuento: 'oferta', aplicaOfertaStock: true },
        })
        expect(r.shouldShow).toBe(false)
    })

    it('muestra con oferta activa y fecha real futura', () => {
        const futureEnd = new Date()
        futureEnd.setDate(futureEnd.getDate() + 10)
        const iso = `${futureEnd.getFullYear()}-${String(futureEnd.getMonth() + 1).padStart(2, '0')}-${String(futureEnd.getDate()).padStart(2, '0')}T23:59:00.000+00:00`

        const r = resolveOfertaCountdownContext({
            enOferta: 'S',
            itemProductoVentaEspeciales: [{ ...poolBase, ofertaDishas: iso }],
            ofertaPrecios: { modoDescuento: 'oferta', aplicaOfertaStock: true },
        })
        expect(r.shouldShow).toBe(true)
        expect(r.pool?.nroPool).toBe(1)
    })
})
