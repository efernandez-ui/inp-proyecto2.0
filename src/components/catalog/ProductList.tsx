'use client'
import { ProductoDTO } from "@/interfaces/producto"
import ProductCard from './ProductCard'
import ProductSpreadsheetView from './ProductSpreadsheetView'
import Pagination from './Pagination'
import { useProductImages } from './useProductImages'
import { mapProductoToUI } from '@/adapters/mapProductoToUI'
import { useState, useEffect, useMemo } from 'react'
import { useCatalogUI } from '@/context/CatalogUIContext'
import { useIsCatalogDesktop } from '@/hooks/useMediaQuery'

interface Props {
    data: {
        content: ProductoDTO[]
        page: {
            totalPages: number
            totalElements: number
        }
    }
    currentPage: number
    searchParams?: URLSearchParams
}

export default function ProductList({ data, currentPage, searchParams }: Props) {
    const { images, loading } = useProductImages(data.content || [])
    const [refreshKey, setRefreshKey] = useState(0)
    const { viewMode } = useCatalogUI()
    const isCatalogDesktop = useIsCatalogDesktop()
    /** En mobile solo grilla; Excel queda deshabilitada. */
    const effectiveViewMode = isCatalogDesktop && viewMode === 'spreadsheet' ? 'spreadsheet' : 'grid'

    // Force re-render when images finish loading
    useEffect(() => {
        if (!loading && Object.keys(images).length > 0) {
            setRefreshKey(k => k + 1)
        }
    }, [loading, images])

    const uiProducts = useMemo(() => {
        return (data.content || []).map((producto) => {
            const key = `${producto.tippro}-${producto.artcod}`
            return mapProductoToUI(producto, images[key] || [])
        })
    }, [data.content, images, refreshKey])

    if (!data.content?.length) {
        return (
            <p className="text-center py-10 text-gray-500">
                No se encontraron productos
            </p>
        )
    }

    const PAGE_SIZE = 20
    const startIndex = Math.max(0, currentPage * PAGE_SIZE)

    const pagination = (
        <Pagination
            currentPage={currentPage}
            totalPages={data.page?.totalPages || 0}
            hasContent={true}
            searchParams={searchParams}
        />
    )

    return (
        <>
            <div className="mb-4 flex min-h-10 items-center justify-between">
                <div className="text-sm text-gray-600">
                    Mostrando {data.content.length} registros de {data.page?.totalElements || 0}
                </div>
                {pagination}
            </div>
            {effectiveViewMode === 'spreadsheet' ? (
                <ProductSpreadsheetView
                    key={refreshKey}
                    products={uiProducts}
                    startIndex={startIndex}
                />
            ) : (
                <ul className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {uiProducts.map((uiProduct) => {
                        const key = `${uiProduct.tippro}-${uiProduct.artcod}`
                        return (
                            <ProductCard
                                key={`${key}-${refreshKey}`}
                                product={uiProduct}
                            />
                        )
                    })}
                </ul>
            )}
            <div className="flex justify-end items-center mt-6">
                {pagination}
            </div>
        </>
    )
}
