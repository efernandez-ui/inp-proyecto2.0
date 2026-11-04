'use client'

import { ModoDescuento, OfertaPrecioDisplay as OfertaPrecioDisplayType } from '@/utils/ofertaPrecios'
import { tienePrecioListaVisible } from '@/utils/productoPrecios'

type Variant = 'card' | 'list' | 'detail'

interface Props {
    oferta: OfertaPrecioDisplayType
    simboloMoneda: string
    format: (val: number) => string
    quantity: number
    variant?: Variant
    label?: string
}

const variantStyles: Record<Variant, { price: string; original: string; label: string }> = {
    card: {
        // inp ProductCard .price: 1.3rem (~20px), weight 900, tracking tight
        price: 'text-[20px] font-black text-[#0056b3] leading-none tracking-tighter',
        original: 'text-[0.85rem] line-through text-gray-400 font-semibold',
        label: 'text-[9.6px] text-gray-400 font-medium uppercase tracking-tighter',
    },
    list: {
        price: 'text-[18px] font-black text-[#001f3f] leading-none',
        original: 'text-[12px] line-through text-gray-400 font-semibold',
        label: 'text-[9px] font-bold text-gray-400 uppercase',
    },
    detail: {
        price: 'text-2xl sm:text-3xl font-black text-[#0056b3] leading-tight',
        original: 'text-base line-through text-gray-400 font-semibold',
        label: 'text-[9px] text-gray-400 font-bold uppercase tracking-tighter',
    },
}

function labelForModo(modo: ModoDescuento, showTotal: boolean): string {
    if (modo === 'oferta') {
        return showTotal ? 'Total' : 'Precio final'
    }
    if (modo === 'bonificacion') {
        return showTotal ? 'Total bonificado' : 'Precio bonificado'
    }
    return showTotal ? 'Total' : 'Precio final'
}

export default function OfertaPrecioDisplay({
    oferta,
    simboloMoneda,
    format,
    quantity,
    variant = 'card',
    label,
}: Props) {
    const styles = variantStyles[variant]
    const showTotal = quantity > 1
    const precioDestacado = showTotal ? oferta.precioOferta : oferta.precioOfertaUnitario
    const precioTachado = showTotal ? oferta.precioOriginal : oferta.precioOriginalUnitario
    const showTachado = tienePrecioListaVisible(precioTachado, precioDestacado)
    const precioUnitFinal = oferta.precioOfertaUnitario
    const labelText = label ?? labelForModo(oferta.modoDescuento, showTotal)
    const bonif1 = oferta.porcentajeBonificacion1
    const bonif2 = oferta.porcentajeBonificacion2

    return (
        <div>
            <p className={styles.label}>{labelText}</p>
            <div className="flex items-baseline gap-2 flex-wrap">
                <span className={styles.price}>
                    {simboloMoneda}{format(precioDestacado)}
                </span>
                {showTachado && (
                <span className={styles.original}>
                    {simboloMoneda}{format(precioTachado)}
                </span>
                )}
                {oferta.modoDescuento === 'bonificacion' && bonif1 > 0 && (
                    <span className="bg-[#e7000b] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                        BONIF {bonif1}{bonif2 > 0 ? `+${bonif2}` : ''}%
                    </span>
                )}
            </div>
            {showTotal && (
                <p className="text-[10px] font-bold text-gray-400">
                    Unit.: {simboloMoneda}{format(precioUnitFinal)}
                </p>
            )}
        </div>
    )
}
