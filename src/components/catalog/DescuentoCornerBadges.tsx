'use client'

import { ModoDescuento } from '@/utils/ofertaPrecios'

type Size = 'card' | 'list' | 'detail'

type Props = {
    modoDescuento: ModoDescuento
    bonificacion1: number
    porcentajeOferta?: number
    size?: Size
    /** Si false, no muestra badges (ej. usuario no logueado). */
    visible?: boolean
}

const sizeStyles: Record<Size, { pos: string; text: string; pad: string; left: string; right: string }> = {
    card: {
        pos: 'top-4',
        text: 'text-[10px]',
        pad: 'px-2 py-1',
        left: 'left-4',
        right: 'right-4',
    },
    list: {
        pos: 'top-2',
        text: 'text-[10px]',
        pad: 'px-2 py-1',
        left: 'left-2',
        right: 'right-2',
    },
    detail: {
        pos: 'top-2',
        text: 'text-xs',
        pad: 'px-3 py-1',
        left: 'left-2 sm:left-[88px]',
        right: 'right-2',
    },
}

/** Badge de oferta (morado) o bonificación (rojo) según el modo ganador. */
export default function DescuentoCornerBadges({
    modoDescuento,
    bonificacion1,
    porcentajeOferta = 0,
    size = 'card',
    visible = true,
}: Props) {
    if (!visible) return null

    const s = sizeStyles[size]
    const base = `absolute ${s.pos} z-20 font-bold rounded-full shadow-md ${s.text} ${s.pad}`

    if (modoDescuento === 'oferta' && porcentajeOferta > 0) {
        return (
            <div className={`${base} ${s.right} bg-purple-600 text-white`}>
                OFERTA {porcentajeOferta}%
            </div>
        )
    }

    if (modoDescuento !== 'oferta' && bonificacion1 > 0) {
        return (
            <div className={`${base} ${s.right} bg-[#e7000b] text-white`}>
                BONIF {bonificacion1}%
            </div>
        )
    }

    return null
}
