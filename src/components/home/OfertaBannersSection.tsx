'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { isStaff } from '@/utils/auth';
import { poolBannerImageUrlCandidates } from '@/lib/s3ParametroImageUrl';
import { getHomeOfertaBanners, type OfertaBanner } from '@/services/home';
import { useOfertaCountdown } from '@/hooks/useOfertaCountdown';
import {
  computeCountdownProgress,
  epochMillisToCountdownInput,
  formatDiasRestantesCorto,
  terminaProntoPorTiempo,
} from '@/utils/ofertaCountdown';
import { poolStockProgress } from '@/utils/poolStockProgress';
import PoolStockProgressBar from '@/components/catalog/PoolStockProgressBar';

const NAVY = '#0c2340';
const ORANGE = '#e8a04a';

function BannerSlideImage({ banner }: { banner: OfertaBanner }) {
  const candidates = useRef(
    banner.bannerImageUrl
      ? [banner.bannerImageUrl, ...poolBannerImageUrlCandidates(banner.pathBanner, null, banner.bannerImageUrl)]
      : poolBannerImageUrlCandidates(banner.pathBanner, null, banner.bannerImageUrl),
  ).current;
  const [attempt, setAttempt] = useState(0);
  const src = attempt < candidates.length ? candidates[attempt] : null;

  useEffect(() => {
    setAttempt(0);
  }, [banner.pathBanner, banner.bannerImageUrl]);

  if (!src) {
    return <div className="aspect-[4/3] w-full bg-gray-100" />;
  }

  return (
    <img
      src={src}
      alt={banner.descripcion || 'Oferta'}
      className="aspect-[4/3] w-full object-cover object-center"
      onError={() => setAttempt((a) => a + 1)}
    />
  );
}

function buildCatalogPoolHref(nroPool: number, nrocta?: string): string {
  const params = new URLSearchParams({ ofertas: 'true', nroPool: String(nroPool) });
  if (nrocta) params.set('nrocta', nrocta);
  return `/catalogo?${params.toString()}`;
}

function OfertaVigenteCard({ banner, nrocta }: { banner: OfertaBanner; nrocta?: string }) {
  const showCountdown = banner.cuentaRegresiva === true;
  const disdesInput = epochMillisToCountdownInput(banner.disdes);
  const dishasInput = epochMillisToCountdownInput(banner.dishas);

  const countdown = useOfertaCountdown({
    ofertaDisdes: disdesInput,
    ofertaDishas: dishasInput,
    enabled: showCountdown,
  });

  const timeMeta = useMemo(() => {
    if (!showCountdown || !countdown.visible) return null;
    const { remainingMs, expired } = computeCountdownProgress(disdesInput, dishasInput, new Date());
    if (expired || remainingMs <= 0) return null;
    return {
      label: formatDiasRestantesCorto(remainingMs),
      terminaPronto: terminaProntoPorTiempo(remainingMs),
    };
  }, [showCountdown, countdown.visible, countdown.label, disdesInput, dishasInput]);

  const stockProg = poolStockProgress(banner.cantidadTotal, banner.cantidadDisponible);
  const showStockProgress = banner.cierrePorStock === true || stockProg != null;

  const href = banner.link || buildCatalogPoolHref(banner.nroPool, nrocta);

  return (
    <article
      className="snap-start shrink-0 w-[300px] sm:w-[320px] rounded-xl bg-white shadow-md overflow-hidden transition-transform duration-300 ease-out motion-reduce:transition-none hover:-translate-y-1 hover:scale-[1.04] hover:shadow-xl motion-reduce:hover:transform-none"
    >
      <div className="relative">
        <BannerSlideImage banner={banner} />
        {timeMeta?.terminaPronto && (
          <span
            className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold text-red-600 shadow-sm"
          >
            <Clock className="h-3 w-3 shrink-0" aria-hidden />
            Termina pronto
          </span>
        )}
      </div>

      <div className="px-4 pt-3 pb-4">
        <h3 className="text-sm font-black text-[#001f3f] leading-snug line-clamp-2 mb-3">
          {banner.descripcion || `Pool #${banner.nroPool}`}
        </h3>

        {showStockProgress && (
          <PoolStockProgressBar
            cantidadTotal={banner.cantidadTotal}
            cantidadDisponible={banner.cantidadDisponible}
            variant="carousel"
          />
        )}

        <div className="flex items-center justify-between gap-2 mb-4 text-[11px] font-semibold">
          {stockProg ? (
            <span className="flex items-center gap-1.5 text-gray-600">
              <Users className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
              {stockProg.consumidos} consumidos
            </span>
          ) : (
            <span />
          )}
          {timeMeta?.label && (
            <span
              className={
                timeMeta.terminaPronto ? 'text-red-600 font-bold' : 'text-gray-500'
              }
            >
              {timeMeta.label}
            </span>
          )}
        </div>

        <Link
          href={href}
          className="block w-full rounded-lg py-2.5 text-center text-[11px] font-black uppercase tracking-wider text-white transition-colors hover:brightness-110"
          style={{ backgroundColor: NAVY }}
        >
          Ver productos
        </Link>
      </div>
    </article>
  );
}

function buildCatalogPoolsHref(nrocta?: string): string {
  const params = new URLSearchParams({ ofertas: 'true' });
  if (nrocta) params.set('nrocta', nrocta);
  return `/catalogo?${params.toString()}`;
}

export default function OfertaBannersSection() {
  const { user, selectedClient } = useSelector((state: RootState) => state.auth);
  const [banners, setBanners] = useState<OfertaBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nrocta = isStaff(user) && selectedClient?.nrocta ? selectedClient.nrocta : undefined;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getHomeOfertaBanners(nrocta)
      .then((data) => {
        if (!mounted) return;
        setBanners(data.banners ?? []);
        setActiveIndex(0);
      })
      .catch(() => {
        if (mounted) setBanners([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [nrocta]);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track || banners.length === 0) return;
    const normalized = ((index % banners.length) + banners.length) % banners.length;
    const slide = track.children[normalized] as HTMLElement | undefined;
    if (slide) {
      track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
    }
    setActiveIndex(normalized);
  }, [banners.length]);

  const goTo = (index: number) => scrollToIndex(index);
  const goNext = () => goTo(activeIndex + 1);
  const goPrev = () => goTo(activeIndex - 1);

  useEffect(() => {
    if (banners.length <= 1) return;
    intervalRef.current = setInterval(() => {
      goTo(activeIndex + 1);
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [banners.length, activeIndex, goTo]);

  const pauseAutoplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resumeAutoplay = () => {
    if (banners.length <= 1) return;
    intervalRef.current = setInterval(() => {
      goTo(activeIndex + 1);
    }, 6000);
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || banners.length === 0) return;
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
    setActiveIndex(closest);
  };

  if (loading || banners.length === 0) {
    return null;
  }

  const catalogHref = buildCatalogPoolsHref(nrocta);

  return (
    <section
      className="pb-6 sm:pb-10"
      style={{ backgroundColor: NAVY }}
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
    >
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-6 sm:pt-10 sm:pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 shrink-0 text-white/90" aria-hidden />
              <h2 className="text-sm sm:text-base font-black uppercase tracking-widest text-white">
                Ofertas vigentes
              </h2>
            </div>
          </div>
          <Link
            href={catalogHref}
            className="shrink-0 self-start rounded-lg border-2 px-4 py-2.5 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-white/10"
            style={{ borderColor: ORANGE }}
          >
            Ver todas las ofertas
          </Link>
        </div>

        <div className="relative">
          {banners.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Oferta anterior"
                onClick={() => goPrev()}
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-1 sm:-translate-x-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Oferta siguiente"
                onClick={() => goNext()}
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1 sm:translate-x-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {banners.map((banner) => (
              <OfertaVigenteCard key={banner.nroPool} banner={banner} nrocta={nrocta} />
            ))}
          </div>

          {banners.length > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {banners.map((b, i) => (
                <button
                  key={b.nroPool}
                  type="button"
                  aria-label={`Oferta ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === activeIndex ? 'bg-white' : 'bg-white/35'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
