'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { ProductoDTO } from '@/interfaces/producto';
import { mapProductoToUI } from '@/adapters/mapProductoToUI';
import ProductCard from './ProductCard';
import { useProductImages } from './useProductImages';

type Props = {
  products: ProductoDTO[];
  loading?: boolean;
  emptyMessage?: string;
  embeddedInVinculados?: boolean;
};

const AUTOPLAY_DELAY_MS = 3000;

export default function ProductVinculadosGrid({
  products,
  loading = false,
  emptyMessage = 'No hay productos disponibles en estos momentos.',
  embeddedInVinculados = true,
}: Props) {
  const { images, loading: imagesLoading } = useProductImages(products ?? []);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldAutoplay = (products?.length ?? 0) > 4;
  const showNav = (products?.length ?? 0) > 1;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: shouldAutoplay,
    align: 'start',
    slidesToScroll: 1,
  });

  const updateScrollState = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!imagesLoading && Object.keys(images).length > 0) {
      setRefreshKey((k) => k + 1);
    }
  }, [imagesLoading, images]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    updateScrollState();
    emblaApi.on('select', updateScrollState);
    emblaApi.on('reInit', updateScrollState);
    return () => {
      emblaApi.off('select', updateScrollState);
      emblaApi.off('reInit', updateScrollState);
    };
  }, [emblaApi, products, refreshKey, shouldAutoplay, updateScrollState]);

  useEffect(() => {
    if (!emblaApi || !shouldAutoplay) return;

    const stopAutoplay = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const startAutoplay = () => {
      stopAutoplay();
      intervalRef.current = setInterval(() => {
        emblaApi.scrollNext();
      }, AUTOPLAY_DELAY_MS);
    };

    if (isPlaying) {
      startAutoplay();
    } else {
      stopAutoplay();
    }

    return stopAutoplay;
  }, [emblaApi, isPlaying, shouldAutoplay, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Cargando...</span>
      </div>
    );
  }

  if (!products?.length) {
    return <div className="px-6 py-16 text-center text-sm text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {showNav && (
        <button
          type="button"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className="absolute left-0 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30 sm:h-10 sm:w-10"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      <div
        className={`overflow-hidden ${showNav ? 'px-10 sm:px-12' : ''}`}
        ref={emblaRef}
      >
        <div className="flex items-stretch">
          {products.map((producto) => {
            const key = `${producto.tippro}-${producto.artcod}`;
            const uiProduct = mapProductoToUI(producto, images[key] || []);
            return (
              <div
                key={`${key}-${refreshKey}`}
                className="flex min-w-0 flex-[0_0_100%] flex-col px-2 sm:flex-[0_0_50%] sm:px-3 lg:flex-[0_0_33.333%] xl:flex-[0_0_25%]"
              >
                <div className="flex h-full min-h-0 flex-1 flex-col">
                  <ProductCard
                    product={uiProduct}
                    embeddedInVinculados={embeddedInVinculados}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showNav && (
        <button
          type="button"
          onClick={scrollNext}
          disabled={!canScrollNext}
          className="absolute right-0 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30 sm:h-10 sm:w-10"
          aria-label="Siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
