'use client'
import DescuentoCornerBadges from './DescuentoCornerBadges'
import NuevoProductBadge from './NuevoProductBadge'
import { resolveOfertaPrecios } from '@/utils/ofertaPrecios'
import { resolvePreciosMoneda } from '@/utils/productoPrecios'
import { isProductoNuevo } from '@/utils/productoNuevo'
import { isValidProductImageUrl, PRODUCT_PLACEHOLDER } from '@/utils/productImage'

interface Props {
    producto: any
}

export default function ProductImage({ producto }: Props) {
    const primaryImage = isValidProductImageUrl(producto.imgchi) ? producto.imgchi : ''
    const bonificacion = producto.bonificacion ? Math.abs(Number(producto.bonificacion)) : 0
    const bonif2 = producto.bonificacion2 ? Math.abs(Number(producto.bonificacion2)) : 0
    const { precioMostrar, precioListaMostrar } = resolvePreciosMoneda({
        monedaProducto: producto.moneda,
        currency: null,
        precioFinalPeso: producto.precioFinalPeso,
        precioFinalDolar: producto.precioFinalDolar,
        precioReferencia: producto.precioReferencia,
        cotizacionUSD: producto.cotizacionUSD,
    })
    const ofertaPrecios = resolveOfertaPrecios({
        enOferta: producto.enOferta,
        itemProductoVentaEspeciales: producto.itemProductoVentaEspeciales,
        precioMostrar,
        precioListaMostrar,
        bonificacion1: bonificacion,
        bonificacion2: bonif2,
    })
    const badgeModo = ofertaPrecios.modoDescuento === 'oferta'
        ? 'oferta' as const
        : bonificacion > 0
            ? 'bonificacion' as const
            : 'ninguno' as const
    return (
        <div className="
      relative bg-white cursor-pointer
      flex items-center justify-center
      p-6 h-72
      group/image
    ">
            <DescuentoCornerBadges
                modoDescuento={badgeModo}
                bonificacion1={bonificacion}
                porcentajeOferta={ofertaPrecios.porcentajeOferta}
                size="card"
            />
            <NuevoProductBadge
                visible={isProductoNuevo(producto.nuevo)}
                size="card"
            />
            {producto.tieneImagenes > 1 && (
                <span className="
          absolute bottom-3 right-3
          bg-black/70 text-white text-[10px]
          px-2 py-1 rounded-full
        ">
                    {producto.tieneImagenes} fotos
                </span>
            )}
            <img
                src={primaryImage || PRODUCT_PLACEHOLDER}
                alt={producto.descripcion}
                className="
            max-h-full max-w-full object-contain
            transition-transform duration-300
            group-hover/image:scale-105
          "
                onError={(e) => {
                    const target = e.currentTarget
                    if (!target.src.endsWith(PRODUCT_PLACEHOLDER)) {
                        target.src = PRODUCT_PLACEHOLDER
                    }
                }}
            />
        </div>
    )
}
