'use client'

import CatalogHeader from './CatalogHeader'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface CatalogHeaderWrapperProps {
    totalProducts: number
    currentPage: number
    pageSize: number
}

function CatalogHeaderContent({ totalProducts, currentPage, pageSize }: CatalogHeaderWrapperProps) {
    return (
        <CatalogHeader
            totalProducts={totalProducts}
            currentPage={currentPage}
            pageSize={pageSize}
        />
    )
}

export default function CatalogHeaderWrapper(props: CatalogHeaderWrapperProps) {
    return (
        <Suspense fallback={<div className="h-32 bg-gray-200 animate-pulse" />}>
            <CatalogHeaderContent {...props} />
        </Suspense>
    )
}
