'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { isStaff } from '@/utils/auth';
import { getHomeCuratedLists } from '@/services/home';
import type { ProductoDTO } from '@/interfaces/producto';
import ProductCard from '@/components/catalog/ProductCard';
import { mapProductoToUI } from '@/adapters/mapProductoToUI';
import { useProductImages } from '@/components/catalog/useProductImages';

const AUTOPLAY_MS = 5000;

function CuratedSlider({ title, products }: { title: string; products: ProductoDTO[] }) {
  const { images } = useProductImages(products);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const pausedRef = useRef(false);
  const programmaticScrollRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track || products.length === 0) return;
      const normalized = ((index % products.length) + products.length) % products.length;
      const slide = track.children[normalized] as HTMLElement | undefined;
      if (!slide) return;

      programmaticScrollRef.current = true;
      activeIndexRef.current = normalized;
      setActiveIndex(normalized);
      track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
      window.setTimeout(() => {
        programmaticScrollRef.current = false;
      }, 700);
    },
    [products.length],
  );

  const goTo = useCallback((index: number) => scrollToIndex(index), [scrollToIndex]);
  const goNext = useCallback(() => scrollToIndex(activeIndexRef.current + 1), [scrollToIndex]);
  const goPrev = useCallback(() => scrollToIndex(activeIndexRef.current - 1), [scrollToIndex]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (products.length <= 1) return;
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      scrollToIndex(activeIndexRef.current + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [products.length, scrollToIndex]);

  const pauseAutoplay = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const resumeAutoplay = useCallback(() => {
    pausedRef.current = false;
  }, []);

  const resumeAutoplayDelayed = useCallback(() => {
    window.setTimeout(() => {
      pausedRef.current = false;
    }, 3000);
  }, []);

  const handleScroll = useCallback(() => {
    if (programmaticScrollRef.current) return;
    const track = trackRef.current;
    if (!track || products.length === 0) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < track.children.length; i++) {
      const el = track.children[i] as HTMLElement;
      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(center - elCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    activeIndexRef.current = closest;
    setActiveIndex(closest);
  }, [products.length]);

  if (!products.length) return null;

  const multi = products.length > 1;

  return (
    <section className="mb-8 sm:mb-10">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4 mb-4">
        <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-[#0c2340]">{title}</h2>
        {multi && (
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              aria-label="Anterior"
              className="rounded-full border border-gray-200 bg-white p-2 text-[#0c2340] shadow-sm transition hover:bg-gray-50"
              onClick={() => goPrev()}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              className="rounded-full border border-gray-200 bg-white p-2 text-[#0c2340] shadow-sm transition hover:bg-gray-50"
              onClick={() => goNext()}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 relative">
        {multi && (
          <>
            <button
              type="button"
              aria-label="Producto anterior"
              onClick={() => goPrev()}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-[#0c2340] shadow-md hover:bg-gray-50 sm:hidden"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Producto siguiente"
              onClick={() => goNext()}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-[#0c2340] shadow-md hover:bg-gray-50 sm:hidden"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <div
          ref={trackRef}
          onScroll={handleScroll}
          onMouseEnter={pauseAutoplay}
          onMouseLeave={resumeAutoplay}
          onTouchStart={pauseAutoplay}
          onTouchEnd={resumeAutoplayDelayed}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scroll-px-4 pb-2 lg:snap-none lg:scroll-px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((producto) => {
            const key = `${producto.tippro}-${producto.artcod}`;
            const uiProduct = mapProductoToUI(producto, images[key] || []);
            return (
              <div
                key={key}
                className="snap-center shrink-0 w-[calc(100%-2.5rem)] max-w-[320px] sm:snap-start md:w-[calc((100%-1rem)/2)] md:max-w-none lg:w-[calc((100%-4*1rem)/5)]"
              >
                <ProductCard product={uiProduct} />
              </div>
            );
          })}
        </div>

        {multi && (
          <div className="mt-3 flex justify-center gap-1.5 sm:mt-4 lg:hidden">
            {products.map((p, i) => (
              <button
                key={`${p.tippro}-${p.artcod}-dot`}
                type="button"
                aria-label={`Producto ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === activeIndex ? 'w-5 bg-[#0c2340]' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function HomeCuratedListsSection() {
  const { user, selectedClient } = useSelector((state: RootState) => state.auth);
  const [data, setData] = useState<Awaited<ReturnType<typeof getHomeCuratedLists>> | null>(null);
  const [loading, setLoading] = useState(true);

  const nrocta = isStaff(user) && selectedClient?.nrocta ? selectedClient.nrocta : undefined;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getHomeCuratedLists(nrocta)
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch(() => {
        if (mounted) setData(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [nrocta]);

  if (loading || !data) return null;

  const sliders: { show: boolean; title: string; products: ProductoDTO[] }[] = [
    { show: data.muestraDestacados, title: 'Destacados', products: data.destacados ?? [] },
    { show: data.muestraMasVendidos, title: 'Más vendidos', products: data.masVendidos ?? [] },
    { show: data.muestraUltimosIngresos, title: 'Últimos ingresos', products: data.ultimosIngresos ?? [] },
  ];

  const visible = sliders.filter((s) => s.show && s.products.length > 0);
  if (!visible.length) return null;

  return (
    <div className="pt-2 pb-4 sm:pb-6">
      {visible.map((slider) => (
        <CuratedSlider key={slider.title} title={slider.title} products={slider.products} />
      ))}
    </div>
  );
}
