export default function ProductSkeleton() {
    return (
        <div className="bg-white border border-gray-200 p-4 flex flex-col h-full animate-pulse">
            {/* Badge circular placeholder */}
            <div className="absolute top-2 right-2 w-9 h-9 bg-gray-100 rounded-full" />

            {/* Imagen placeholder */}
            <div className="h-48 bg-gray-100 rounded-lg mb-4 w-full" />

            <div className="flex flex-col flex-grow space-y-3">
                {/* Marca */}
                <div className="h-3 bg-gray-100 rounded w-1/3" />

                {/* Título (dos líneas) */}
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-4/5" />
                </div>

                {/* Código */}
                <div className="h-3 bg-gray-100 rounded w-1/4 mb-4" />

                {/* Precios */}
                <div className="space-y-4 pt-2">
                    <div className="h-8 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>

                {/* Baterías de stock */}
                <div className="flex justify-between pt-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="h-2 bg-gray-100 rounded w-6" />
                            <div className="w-3 h-5 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>

                {/* Botón */}
                <div className="h-10 bg-gray-100 rounded mt-auto w-full" />
            </div>
        </div>
    )
}