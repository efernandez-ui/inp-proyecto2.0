import ProductSkeleton from './ProductSkeleton'

export default function CatalogSkeleton() {
    return (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {/* Generamos 8 tarjetas de carga */}
            {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
            ))}
        </div>
    )
}
