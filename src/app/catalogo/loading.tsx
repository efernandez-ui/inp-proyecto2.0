import CatalogSkeleton from '@/components/catalog/CatalogSkeleton'

export default function Loading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="h-8 w-64 bg-gray-200 rounded mb-6 animate-pulse" />
            <CatalogSkeleton />
        </div>
    )
}
