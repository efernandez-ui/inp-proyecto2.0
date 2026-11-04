'use client'

import { ProductoVentaEspecial } from '@/interfaces/producto'
import { useOfertaCountdown } from '@/hooks/useOfertaCountdown'
import { absBonificacionPct } from '@/utils/productoPrecios'

type Variant = 'card' | 'detail' | 'cart'

type Props = {
    pool: ProductoVentaEspecial
    variant?: Variant
    visible?: boolean
}

const variantStyles: Record<Variant, { container: string; title: string; off: string; footer: string; bar: string }> = {
    card: {
        container: 'rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2',
        title: 'text-[9px] font-extrabold uppercase tracking-wide text-slate-800 truncate max-w-[55%]',
        off: 'text-[9px] font-extrabold italic text-emerald-600 whitespace-nowrap',
        footer: 'text-[8px] font-bold uppercase tracking-wide text-gray-500 text-center mt-1.5',
        bar: 'h-1.5',
    },
    cart: {
        container: 'rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 mt-2',
        title: 'text-[9px] font-extrabold uppercase tracking-wide text-slate-800 truncate max-w-[55%]',
        off: 'text-[9px] font-extrabold italic text-emerald-600 whitespace-nowrap',
        footer: 'text-[8px] font-bold uppercase tracking-wide text-gray-500 text-center mt-1.5',
        bar: 'h-1.5',
    },
    detail: {
        container: 'rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5',
        title: 'text-[10px] font-extrabold uppercase tracking-wide text-slate-800 truncate max-w-[55%]',
        off: 'text-[10px] font-extrabold italic text-emerald-600 whitespace-nowrap',
        footer: 'text-[9px] font-bold uppercase tracking-wide text-gray-500 text-center mt-2',
        bar: 'h-2',
    },
}

function poolTitle(pool: ProductoVentaEspecial): string {
    return pool.descripcionPool?.trim()
        || pool.tipoOferta?.trim()
        || 'ESPECIAL'
}

export default function OfertaCountdownBanner({ pool, variant = 'card', visible = true }: Props) {
    const styles = variantStyles[variant]
    const pct = absBonificacionPct(pool.porcentajeDescuento ?? 0)
    const { progressPct, label, visible: countdownVisible } = useOfertaCountdown({
        ofertaDisdes: pool.ofertaDisdes,
        ofertaDishas: pool.ofertaDishas,
        enabled: visible,
    })

    if (!visible || !countdownVisible || !label) {
        return null
    }

    return (
        <div className={styles.container} aria-live="polite">
            <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={styles.title} title={poolTitle(pool)}>
                    {poolTitle(pool)}
                </span>
                {pct > 0 && (
                    <span className={styles.off}>HASTA {pct}% OFF</span>
                )}
            </div>
            <div className={`w-full rounded-full bg-gray-200 overflow-hidden ${styles.bar}`}>
                <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-1000 ease-linear"
                    style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                />
            </div>
            <p className={styles.footer}>{label}</p>
        </div>
    )
}
