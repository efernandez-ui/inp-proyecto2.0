'use client'
import { useEffect, useRef, useState } from 'react'
interface Product {
  id: number
  name: string
  brand: string
  image: string
  href: string
}
export default function NewArrivalsSlider() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    setTimeout(() => {
      setProducts([
        {
          id: 1,
          name: 'Cubierta 100/80-17 M/C 52P TL',
          brand: 'Durtec Tires',
          image: 'https:',
          href: '/catalogo/1',
        },
        {
          id: 2,
          name: 'Cubierta 140/70-17 M/C 66H',
          brand: 'Eurogrip',
          image: 'https:',
          href: '/catalogo/2',
        },
        {
          id: 3,
          name: 'Disco de freno delantero',
          brand: 'Bremix',
          image: 'https:',
          href: '/catalogo/3',
        },
        {
          id: 4,
          name: 'Kit cadena + corona',
          brand: 'RK Racing',
          image: 'https:',
          href: '/catalogo/4',
        },
        {
          id: 5,
          name: 'Filtro de aceite',
          brand: 'Motul',
          image: 'https:',
          href: '/catalogo/5',
        },
      ])
      setLoading(false)
    }, 1200)
  }, [])
  const loopProducts = [...products, ...products]
  const handleScroll = () => {
    const container = containerRef.current
    if (!container) return
    const maxScroll = container.scrollWidth / 2
    if (container.scrollLeft >= maxScroll) {
      container.scrollLeft = container.scrollLeft - maxScroll
    }
  }
  const onUserInteract = () => {
    setIsUserInteracting(true)
    setTimeout(() => {
      setIsUserInteracting(false)
    }, 5000)
  }
  useEffect(() => {
    if (loading || isUserInteracting || !containerRef.current) return
    startAutoplay()
    return stopAutoplay
  }, [loading, isUserInteracting])
  const startAutoplay = () => {
    stopAutoplay()
    intervalRef.current = setInterval(() => {
      scrollRight()
    }, 4000)
  }
  const stopAutoplay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }
  const scrollLeft = () => {
    containerRef.current?.scrollBy({
      left: -220,
      behavior: 'smooth',
    })
  }
  const scrollRight = () => {
    containerRef.current?.scrollBy({
      left: 220,
      behavior: 'smooth',
    })
  }
  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      { }
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#001f3f] border-b pb-2">
          NOVEDADES
        </h2>
        { }
        <div className="hidden md:flex gap-2">
          <button
            onClick={scrollLeft}
            className="w-9 h-9 flex items-center justify-center rounded-full border hover:bg-gray-100 transition"
          >
            ‹
          </button>
          <button
            onClick={scrollRight}
            className="w-9 h-9 flex items-center justify-center rounded-full border hover:bg-gray-100 transition"
          >
            ›
          </button>
        </div>
      </div>
      { }
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-4"
        onMouseEnter={onUserInteract}
        onTouchStart={onUserInteract}
        onWheel={onUserInteract}
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))
          : loopProducts.map((product, index) => (
            <a
              key={index}
              href={product.href}
              className="snap-start min-w-[160px] sm:min-w-[200px] flex-shrink-0 text-center group"
            >
              <div className="h-40 flex items-center justify-center mb-3">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <p className="text-xs text-[#001f3f] font-medium leading-snug mb-1 line-clamp-2">
                {product.name}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                {product.brand}
              </p>
              <span className="inline-block bg-[#001f3f] text-white text-xs px-4 py-1.5 rounded-md hover:bg-[#000d1f] transition">
                Ver detalle
              </span>
            </a>
          ))}
      </div>
    </section>
  )
}
function SkeletonCard() {
  return (
    <div className="min-w-[160px] sm:min-w-[200px] animate-pulse text-center">
      <div className="h-40 bg-gray-200 rounded mb-3" />
      <div className="h-3 bg-gray-200 rounded mb-2" />
      <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto mb-3" />
      <div className="h-7 bg-gray-300 rounded w-24 mx-auto" />
    </div>
  )
}