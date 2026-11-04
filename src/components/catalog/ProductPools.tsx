'use client'
import { ProductoVentaEspecial } from '@/interfaces/producto'
import { OfertaPrecioDisplay } from '@/utils/ofertaPrecios'
import { resolveOfertaCountdownContext } from '@/utils/ofertaCountdown'
import OfertaCountdownBanner from './OfertaCountdownBanner'

interface Props {
    pools: ProductoVentaEspecial[]
    showCountdown?: boolean
    enOferta?: string | null
    ofertaPrecios?: Pick<OfertaPrecioDisplay, 'modoDescuento' | 'aplicaOfertaStock'>
}

function poolStock(pool: ProductoVentaEspecial): number {
    const n = Number(pool.cantidadDisponible ?? 0)
    return Number.isFinite(n) ? n : 0
}

export default function ProductPools({ pools, showCountdown = true, enOferta, ofertaPrecios }: Props) {
    const visiblePools = (pools ?? []).filter((pool) => poolStock(pool) > 0)

    if (enOferta !== 'S' || visiblePools.length === 0) {
        return (
            <p className="text-xs text-gray-400 italic">
                Sin ventas especiales para tu cuenta
            </p>
        )
    }

    const countdownContext = resolveOfertaCountdownContext({
        enOferta,
        itemProductoVentaEspeciales: visiblePools,
        ofertaPrecios,
    })

    return (
        <div className="space-y-3">
            {visiblePools.map((pool) => (
                <div
                    key={`${pool.nroPool}-${pool.orden}`}
                    className="border border-amber-200 rounded-lg p-3 bg-amber-50/60"
                >
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                            <span className="text-xs font-bold text-gray-800 block">
                                {pool.descripcionPool || pool.tipoOferta || `Pool #${pool.nroPool}`}
                            </span>
                            <span className="text-[10px] text-gray-500">Pool #{pool.nroPool}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-800 rounded-full whitespace-nowrap">
                                Stock {pool.cantidadDisponible}
                            </span>
                        </div>
                    </div>
                    {showCountdown && countdownContext.shouldShow && countdownContext.pool?.nroPool === pool.nroPool && (
                        <OfertaCountdownBanner pool={pool} variant="detail" />
                    )}
                    {pool.cierrePorStock && !pool.cuentaRegresiva && (
                        <p className="text-[10px] text-amber-800">Cierre por stock</p>
                    )}
                </div>
            ))}
        </div>
    )
}
