'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { homeBannerImageUrlCandidates } from '@/lib/s3ParametroImageUrl';
import {
  getHomeBanners,
  isVideoPath,
  type HomeBanner,
  type HomeBannersResponse,
} from '@/services/home';

const WRAPPER_CLASS = 'block w-full';

const MEDIA_CLASS =
  'block w-full h-auto max-w-full object-contain object-center bg-[#001f3f]';

function BannerMedia({
  banner,
  pathImagenesHome,
  className,
}: {
  banner: HomeBanner;
  pathImagenesHome?: string | null;
  className?: string;
}) {
  const candidates = useRef(
    banner.imageUrl
      ? [banner.imageUrl, ...homeBannerImageUrlCandidates(banner.pathImagen, pathImagenesHome)]
      : homeBannerImageUrlCandidates(banner.pathImagen, pathImagenesHome)
  ).current;
  const [attempt, setAttempt] = useState(0);
  const src = attempt < candidates.length ? candidates[attempt] : null;

  useEffect(() => {
    setAttempt(0);
  }, [banner.pathImagen, banner.imageUrl, pathImagenesHome]);

  if (!src) {
    return <div className={`bg-gray-200 min-h-[120px] ${className ?? ''}`} />;
  }

  const video =
    isVideoPath(banner.pathImagen) || isVideoPath(banner.imageUrl) || isVideoPath(src);

  if (video) {
    return (
      <video
        src={src}
        className={className}
        autoPlay
        muted
        loop
        playsInline
        onError={() => setAttempt((a) => a + 1)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={banner.descripcion || 'Banner'}
      className={className}
      onError={() => setAttempt((a) => a + 1)}
    />
  );
}

function BannerSlideContent({
  banner,
  pathImagenesHome,
}: {
  banner: HomeBanner;
  pathImagenesHome?: string | null;
}) {
  const tipo = (banner.tipoBanner ?? 'IN').trim().toUpperCase();
  const media = (
    <BannerMedia banner={banner} pathImagenesHome={pathImagenesHome} className={MEDIA_CLASS} />
  );

  if (tipo === 'LI' && banner.link) {
    const href = banner.link.startsWith('/') ? banner.link : `/${banner.link}`;
    return (
      <Link href={href} className={WRAPPER_CLASS} title={banner.descripcion ?? undefined}>
        {media}
      </Link>
    );
  }

  if (tipo === 'LE' && banner.link) {
    return (
      <a
        href={banner.link}
        target="_blank"
        rel="noopener noreferrer"
        className={WRAPPER_CLASS}
        title={banner.descripcion ?? undefined}
      >
        {media}
      </a>
    );
  }

  return (
    <div className={WRAPPER_CLASS} title={banner.descripcion ?? undefined}>
      {media}
    </div>
  );
}

interface HomeBannerCarouselProps {
  fullBleed?: boolean;
}

export default function HomeBannerCarousel({ fullBleed = false }: HomeBannerCarouselProps) {
  const [data, setData] = useState<HomeBannersResponse | null>(null);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const banners = data?.banners ?? [];
  const pathImagenesHome = data?.pathImagenesHome;

  const goTo = (index: number) => {
    if (banners.length === 0) return;
    setCurrent(((index % banners.length) + banners.length) % banners.length);
  };

  const goNext = () => goTo(current + 1);
  const goPrev = () => goTo(current - 1);

  useEffect(() => {
    let mounted = true;
    getHomeBanners()
      .then((response) => {
        if (!mounted) return;
        setData(response);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading || banners.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading, banners.length]);

  const pauseAutoplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resumeAutoplay = () => {
    if (banners.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    pauseAutoplay();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) goNext();
    else if (diff < -50) goPrev();
    touchStartX.current = null;
    resumeAutoplay();
  };

  const shellClass = fullBleed ? '' : 'rounded-lg overflow-hidden';

  if (loading) {
    return (
      <div
        className={`w-full max-w-full bg-gray-200 animate-pulse min-h-[120px] sm:min-h-[160px] ${shellClass}`}
      />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <section
      className={`w-full max-w-full bg-[#001f3f] ${shellClass}`}
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Altura natural de la imagen (legacy: width 100%, height auto). Grid apila slides para el fade. */}
      <div className="relative w-full">
        <div className="grid w-full [&>*]:col-start-1 [&>*]:row-start-1">
          {banners.map((banner, index) => {
            const isActive = index === current;
            return (
              <div
                key={banner.orden}
                className={`w-full transition-opacity duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                }`}
                aria-hidden={!isActive}
              >
                <BannerSlideContent banner={banner} pathImagenesHome={pathImagenesHome} />
              </div>
            );
          })}
        </div>

        {banners.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-2 pointer-events-none">
            {banners.map((b, i) => (
              <button
                key={b.orden}
                type="button"
                aria-label={`Banner ${i + 1}`}
                onClick={() => goTo(i)}
                className={`pointer-events-auto h-2 w-2 rounded-full transition-colors ${
                  i === current ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
