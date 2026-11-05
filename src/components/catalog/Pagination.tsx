import Link from 'next/link'

interface PaginationProps {
    currentPage: number
    totalPages: number
    hasContent?: boolean
    searchParams?: URLSearchParams
}

export default function Pagination({
    currentPage,
    totalPages,
    hasContent = true,
    searchParams,
}: PaginationProps) {
    const buildHref = (page: number) => {
        const params = new URLSearchParams(searchParams)
        params.set('page', (page + 1).toString())
        return `?${params.toString()}`
    }

    if (totalPages <= 0 || !hasContent) return null

    const pages = Array.from(
        { length: Math.min(6, totalPages) },
        (_, i) => Math.max(0, currentPage - 2) + i
    ).filter(p => p < totalPages && p >= 0)

    const showPrev = currentPage > 0
    const showNext = currentPage < totalPages - 1

    return (
        <nav
            className="flex justify-center"
            aria-label="Paginación"
        >
            <div className="flex items-center gap-1 rounded-[10px] bg-white shadow-sm border border-gray-200 px-2 py-0.5">
                {showPrev && (
                    <Link
                        href={buildHref(currentPage - 1)}
                        className="px-3 py-1.5 rounded-[10px] text-sm text-[#001f3f] hover:bg-[#001f3f]/10 transition"
                        aria-label="Página anterior"
                    >
                        ←
                    </Link>
                )}

                {pages.map(page => {
                    const isActive = page === currentPage
                    return (
                        <Link
                            key={page}
                            href={buildHref(page)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`
                px-4 py-1.5 rounded-[10px] text-sm font-medium transition
                ${isActive
                                    ? 'bg-[#001f3f] text-white shadow'
                                    : 'text-[#001f3f] hover:bg-[#001f3f]/10'
                                }
              `}
                        >
                            {page + 1}
                        </Link>
                    )
                })}

                {showNext && (
                    <Link
                        href={buildHref(currentPage + 1)}
                        className="px-3 py-1.5 rounded-[10px] text-sm text-[#001f3f] hover:bg-[#001f3f]/10 transition"
                        aria-label="Página siguiente"
                    >
                        →
                    </Link>
                )}
            </div>
        </nav>
    )
}
