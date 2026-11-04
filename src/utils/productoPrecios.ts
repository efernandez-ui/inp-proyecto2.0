export type PreciosMonedaInput = {
    monedaProducto: string | null | undefined
    currency: string | null | undefined
    precioFinalPeso?: number | null
    precioFinalDolar?: number | null
    precioReferencia?: number | null
    cotizacionUSD?: number | null
}

export type PreciosMonedaDisplay = {
    esUSD: boolean
    quiereEnUSD: boolean
    monedaAMostrar: 'ARS' | 'USD'
    simboloMoneda: string
    tipoCambio: number
    precioMostrar: number
    precioListaMostrar: number
}

function round2(value: number): number {
    return Math.round(value * 100) / 100
}

export function resolveTipoCambio(
    precioFinalARS: number,
    precioFinalUSD: number | null | undefined,
    cotizacionUSD?: number | null
): number {
    if (precioFinalUSD && precioFinalARS && precioFinalUSD > 0) {
        return precioFinalARS / precioFinalUSD
    }
    if (cotizacionUSD != null && Number(cotizacionUSD) > 0) {
        return Number(cotizacionUSD)
    }
    return 0
}

/** Convierte precioReferencia (siempre en ARS del backend) a la moneda de visualización. */
export function convertirPrecioReferencia(
    precioReferenciaARS: number,
    monedaAMostrar: 'ARS' | 'USD',
    esUSD: boolean,
    tipoCambio: number
): number {
    if (precioReferenciaARS <= 0) return 0
    if (monedaAMostrar === 'USD') {
        if (tipoCambio > 0) return round2(precioReferenciaARS / tipoCambio)
        return esUSD ? precioReferenciaARS : 0
    }
    return precioReferenciaARS
}

export function resolvePreciosMoneda(input: PreciosMonedaInput): PreciosMonedaDisplay {
    const esUSD = input.monedaProducto === 'USD'
    const precioFinalARS = Number(input.precioFinalPeso) || 0
    const precioFinalUSD = input.precioFinalDolar != null ? Number(input.precioFinalDolar) : null
    const precioReferenciaARS = Number(input.precioReferencia) || 0
    const tipoCambio = resolveTipoCambio(precioFinalARS, precioFinalUSD, input.cotizacionUSD)

    const quiereEnUSD = input.currency === 'USD'
    const monedaAMostrar: 'ARS' | 'USD' = quiereEnUSD ? 'USD' : 'ARS'

    let precioMostrar: number
    if (monedaAMostrar === 'USD') {
        if (esUSD) {
            precioMostrar = precioFinalUSD || 0
        } else if (tipoCambio > 0) {
            precioMostrar = round2(precioFinalARS / tipoCambio)
        } else {
            precioMostrar = 0
        }
    } else {
        precioMostrar = precioFinalARS
    }

    const precioListaMostrar = convertirPrecioReferencia(
        precioReferenciaARS,
        monedaAMostrar,
        esUSD,
        tipoCambio
    )

    return {
        esUSD,
        quiereEnUSD,
        monedaAMostrar,
        simboloMoneda: monedaAMostrar === 'USD' ? 'US$ ' : '$ ',
        tipoCambio,
        precioMostrar,
        precioListaMostrar,
    }
}

export function absBonificacionPct(value: number | null | undefined): number {
    if (value == null || Number.isNaN(Number(value))) return 0
    return Math.abs(Number(value))
}

/**
 * True solo si, a 2 decimales, la lista es estrictamente mayor que el precio de venta.
 * Evita tachar precios que se ven iguales tras formatear (float / redondeos Softland).
 */
export function tienePrecioListaVisible(precioLista: number, precioVenta: number): boolean {
    if (!(precioLista > 0) || !(precioVenta > 0)) return false
    return round2(precioLista) > round2(precioVenta)
}

/**
 * Bonif. 1 desde el campo del API o inferida por diferencia lista vs precio final (misma moneda).
 */
export function resolveBonificacion1Pct(
    bonificacionField: number | null | undefined,
    precioLista: number,
    precioConBonif: number
): number {
    const fromField = absBonificacionPct(bonificacionField)
    if (fromField > 0) return fromField

    if (precioLista <= 0 || precioConBonif <= 0 || precioConBonif >= precioLista) return 0
    const inferred = (1 - precioConBonif / precioLista) * 100
    return inferred >= 0.01 ? round2(inferred) : 0
}

/** Precio al público: markup (+%) sobre precio venta final, como antes del catálogo con ofertas. */
export function calcularPrecioPublico(precioMostrar: number, markupPercentage: number): number {
    if (precioMostrar <= 0) return 0
    return round2(precioMostrar * (1 + (markupPercentage || 0) / 100))
}
