import { ProductoVentaEspecial } from '@/interfaces/producto'
import { absBonificacionPct, tienePrecioListaVisible } from './productoPrecios'

export type ModoDescuento = 'oferta' | 'bonificacion' | 'ninguno'

export type OfertaPrecioInput = {
    enOferta?: string | null
    itemProductoVentaEspeciales?: ProductoVentaEspecial[]
    /** Precio venta final del backend (bonif. 1 ya incluida), moneda de visualización */
    precioMostrar: number
    /** Precio lista c/IVA en moneda de visualización (si 0, se infiere) */
    precioListaMostrar?: number
    bonificacion1?: number | null
    bonificacion2?: number | null
    quantity?: number
    monedaAMostrar?: 'ARS' | 'USD'
    tipoCambio?: number
}

export type OfertaPrecioDisplay = {
    activa: boolean
    modoDescuento: ModoDescuento
    /** Si true, el carrito debe asociar pool / consumir stock de oferta */
    aplicaOfertaStock: boolean
    porcentajeOferta: number
    porcentajeBonificacion1: number
    porcentajeBonificacion2: number
    /** Descuento efectivo total sobre precio tachado unitario */
    porcentajeDescuento: number
    precioOriginal: number
    precioOferta: number
    precioOriginalUnitario: number
    precioOfertaUnitario: number
    precioTrasOfertaUnitario: number
}

function round2(value: number): number {
    return Math.round(value * 100) / 100
}

function poolTieneStockVendible(pool: ProductoVentaEspecial | undefined): boolean {
    if (!pool) return false
    const stock = pool.cantidadDisponible
    if (stock == null) return true
    return Number(stock) > 0
}

function aplicarDescuento(precio: number, pct: number): number {
    if (pct <= 0 || precio <= 0) return precio
    return round2(precio * (1 - pct / 100))
}

/** Precio lista/tachado cuando bonif. 1 ya viene aplicada en precioMostrar. */
function resolvePrecioOriginalBonif1(
    precioLista: number,
    precioMostrar: number,
    bonif1: number,
): number {
    if (tienePrecioListaVisible(precioLista, precioMostrar)) {
        return round2(precioLista)
    }
    if (bonif1 > 0 && bonif1 < 100 && precioMostrar > 0) {
        return round2(precioMostrar / (1 - bonif1 / 100))
    }
    return round2(precioMostrar)
}

function buildBonificacionActiva(
    quantity: number,
    precioOriginalUnitario: number,
    precioFinalUnitario: number,
    bonif1: number,
    bonif2: number,
): OfertaPrecioDisplay {
    const descuentoEfectivo = precioOriginalUnitario > 0
        ? round2((1 - precioFinalUnitario / precioOriginalUnitario) * 100)
        : 0
    return {
        activa: true,
        modoDescuento: 'bonificacion',
        aplicaOfertaStock: false,
        porcentajeOferta: 0,
        porcentajeBonificacion1: bonif1,
        porcentajeBonificacion2: bonif2,
        porcentajeDescuento: descuentoEfectivo,
        precioOriginal: round2(precioOriginalUnitario * quantity),
        precioOferta: round2(precioFinalUnitario * quantity),
        precioOriginalUnitario: round2(precioOriginalUnitario),
        precioOfertaUnitario: round2(precioFinalUnitario),
        precioTrasOfertaUnitario: round2(precioFinalUnitario),
    }
}

/** Oferta gana solo si es estrictamente mayor que bonif1 + bonif2 (empate → bonificaciones). */
export function elegirModoDescuento(
    bonif1: number,
    bonif2: number,
    ofertaPct: number
): 'oferta' | 'bonificacion' {
    const totalBonif = absBonificacionPct(bonif1) + absBonificacionPct(bonif2)
    return ofertaPct > totalBonif ? 'oferta' : 'bonificacion'
}

function getOfertaPctFromInput(input: OfertaPrecioInput): number {
    const pool = input.itemProductoVentaEspeciales?.[0]
    if (pool?.porcentajeDescuento == null || Number(pool.porcentajeDescuento) <= 0) return 0
    if (!poolTieneStockVendible(pool)) return 0
    const enOferta = input.enOferta?.trim?.() ?? input.enOferta
    if (enOferta === 'S' || pool.porcentajeDescuento != null) {
        return absBonificacionPct(pool.porcentajeDescuento)
    }
    return 0
}

/** Lista c/IVA del producto para calcular oferta (solo % descuento viene del pool). */
export function resolvePrecioListaParaOferta(
    precioListaMostrar: number,
    precioMostrar: number,
): number {
    const lista = precioListaMostrar > 0 ? precioListaMostrar : precioMostrar
    return round2(lista)
}

export function debeMostrarPrecioPromocional(oferta: OfertaPrecioDisplay): boolean {
    return oferta.activa || oferta.modoDescuento === 'oferta' || oferta.modoDescuento === 'bonificacion'
}

function buildInactiveResult(
    quantity: number,
    precioMostrar: number,
    precioFinalUnitario: number,
    bonif1: number,
    bonif2: number
): OfertaPrecioDisplay {
    return {
        activa: false,
        modoDescuento: 'ninguno',
        aplicaOfertaStock: false,
        porcentajeOferta: 0,
        porcentajeBonificacion1: bonif1,
        porcentajeBonificacion2: bonif2,
        porcentajeDescuento: 0,
        precioOriginal: round2(precioMostrar * quantity),
        precioOferta: round2(precioFinalUnitario * quantity),
        precioOriginalUnitario: round2(precioMostrar),
        precioOfertaUnitario: round2(precioFinalUnitario),
        precioTrasOfertaUnitario: round2(precioFinalUnitario),
    }
}

/**
 * Resuelve precio promocional: oferta comercial vs bonificaciones (no acumulativos).
 * - Oferta: lista c/IVA × (1 − oferta%)
 * - Bonificaciones: precioMostrar (bonif. 1) + bonif. 2 si aplica
 */
export function resolveOfertaPrecios(input: OfertaPrecioInput): OfertaPrecioDisplay {
    const quantity = Math.max(1, input.quantity ?? 1)
    const precioMostrar = input.precioMostrar || 0
    const pool = input.itemProductoVentaEspeciales?.[0]
    const precioLista = resolvePrecioListaParaOferta(
        input.precioListaMostrar ?? 0,
        precioMostrar,
    )
    const bonif1 = absBonificacionPct(input.bonificacion1)
    const bonif2 = absBonificacionPct(input.bonificacion2)
    const ofertaPctRaw = getOfertaPctFromInput(input)
    const precioFinalBonif = aplicarDescuento(precioMostrar, bonif2)

    if (ofertaPctRaw <= 0 || precioMostrar <= 0) {
        const activaBonif2 = bonif2 > 0 && precioFinalBonif < precioMostrar
        if (activaBonif2) {
            const precioOriginalUnitario = resolvePrecioOriginalBonif1(precioLista, precioMostrar, bonif1)
            return buildBonificacionActiva(quantity, precioOriginalUnitario, precioFinalBonif, bonif1, bonif2)
        }
        // Solo bonif. 1: final del backend ya la incluye; inferir lista si referencia ≈ final
        if (bonif1 > 0 && precioMostrar > 0) {
            const precioOriginalUnitario = resolvePrecioOriginalBonif1(precioLista, precioMostrar, bonif1)
            if (tienePrecioListaVisible(precioOriginalUnitario, precioMostrar)) {
                return buildBonificacionActiva(quantity, precioOriginalUnitario, precioMostrar, bonif1, 0)
            }
        }
        return buildInactiveResult(quantity, precioMostrar, precioFinalBonif, bonif1, bonif2)
    }

    const modo = elegirModoDescuento(bonif1, bonif2, ofertaPctRaw)

    if (modo === 'oferta' && ofertaPctRaw > 0) {
        const baseLista = precioLista > 0 ? precioLista : precioMostrar
        if (baseLista <= 0) {
            return buildInactiveResult(quantity, precioMostrar, precioFinalBonif, bonif1, bonif2)
        }
        const precioOriginalUnitario = round2(baseLista)
        const precioOfertaUnitario = aplicarDescuento(baseLista, ofertaPctRaw)
        const descuentoEfectivo = round2((1 - precioOfertaUnitario / baseLista) * 100)
        const stockOk = poolTieneStockVendible(pool)
        return {
            activa: stockOk,
            modoDescuento: stockOk ? 'oferta' : 'ninguno',
            aplicaOfertaStock: stockOk,
            porcentajeOferta: ofertaPctRaw,
            porcentajeBonificacion1: 0,
            porcentajeBonificacion2: 0,
            porcentajeDescuento: descuentoEfectivo,
            precioOriginal: round2(precioOriginalUnitario * quantity),
            precioOferta: round2(precioOfertaUnitario * quantity),
            precioOriginalUnitario,
            precioOfertaUnitario,
            precioTrasOfertaUnitario: precioOfertaUnitario,
        }
    }

    // Bonificaciones ganan (incluye empate con oferta disponible)
    const precioOriginalUnitario = resolvePrecioOriginalBonif1(precioLista, precioMostrar, bonif1)
    const activa =
        (bonif2 > 0 && precioFinalBonif < precioMostrar)
        || tienePrecioListaVisible(precioOriginalUnitario, precioFinalBonif)

    if (!activa) {
        return buildInactiveResult(quantity, precioMostrar, precioFinalBonif, bonif1, bonif2)
    }

    return buildBonificacionActiva(quantity, precioOriginalUnitario, precioFinalBonif, bonif1, bonif2)
}

export function getOfertaPorcentaje(product: {
    enOferta?: string | null
    itemProductoVentaEspeciales?: ProductoVentaEspecial[]
}): number | null {
    const pool = product.itemProductoVentaEspeciales?.[0]
    if (!poolTieneStockVendible(pool)) return null
    const enOferta = product.enOferta?.trim?.() ?? product.enOferta
    if (enOferta !== 'S' && !pool?.porcentajeDescuento) return null
    const pct = product.itemProductoVentaEspeciales?.[0]?.porcentajeDescuento
    if (pct == null || Number(pct) <= 0) return null
    return Math.abs(Number(pct))
}

/** % oferta solo si gana frente a bonif1 + bonif2. */
export function getOfertaPorcentajeAplicado(
    product: {
        enOferta?: string | null
        itemProductoVentaEspeciales?: ProductoVentaEspecial[]
    },
    bonif1: number,
    bonif2: number
): number | null {
    const oferta = getOfertaPorcentaje(product)
    if (oferta == null) return null
    return elegirModoDescuento(bonif1, bonif2, oferta) === 'oferta' ? oferta : null
}

export function getOfertaBadgeLabel(ofertaPct: number | null): string | null {
    if (ofertaPct == null || ofertaPct <= 0) return null
    return `OFERTA ${ofertaPct}%`
}

export function getTotalDescuentoBadge(
    _oferta: OfertaPrecioDisplay,
    ofertaPct: number | null
): string | null {
    return getOfertaBadgeLabel(ofertaPct)
}
