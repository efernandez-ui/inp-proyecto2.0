'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { homePopupImageUrlCandidates } from '@/lib/s3ParametroImageUrl';
import { getHomePopups, type HomePopup } from '@/services/home';
import PopupCountdownBar from '@/components/home/PopupCountdownBar';

const POPUP_MEDIA_HEIGHT = 'h-[200px] sm:h-[240px]';
const POPUP_MEDIA_FRAME =
  'flex h-full w-full items-center justify-center overflow-hidden p-1';
const POPUP_IMAGE_CLASS =
  'block h-full w-full max-h-full max-w-full object-contain object-center';

const SESSION_KEY = 'intercap_popup_closed';

function popupsFingerprint(popups: HomePopup[]): string {
  return popups
    .map((p) => `${p.orden}:${p.pathImagen ?? ''}`)
    .join('|');
}

function isPopupDismissed(popups: HomePopup[]): boolean {
  const fp = popupsFingerprint(popups);
  return sessionStorage.getItem(`${SESSION_KEY}:${fp}`) === '1';
}

function PopupImage({
  popup,
  className,
}: {
  popup: HomePopup;
  className?: string;
}) {
  const candidates = useMemo(
    () => homePopupImageUrlCandidates(popup.pathImagen, popup.imageUrl),
    [popup.pathImagen, popup.imageUrl],
  );
  const [attempt, setAttempt] = useState(0);
  const src = attempt < candidates.length ? candidates[attempt] : null;

  useEffect(() => {
    setAttempt(0);
  }, [popup.pathImagen, popup.imageUrl]);

  if (!src) {
    return (
      <div
        className={`${POPUP_MEDIA_FRAME} bg-gray-100 text-gray-400 text-[10px] font-medium ${className ?? ''}`}
      >
        Sin imagen
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={popup.descripcion || 'Promoción'}
      className={className ?? POPUP_IMAGE_CLASS}
      onError={() => setAttempt((a) => a + 1)}
      decoding="async"
    />
  );
}

function PopupSlideContent({ popup }: { popup: HomePopup }) {
  const tipo = (popup.tipoBanner ?? 'IN').trim().toUpperCase();
  const media = <PopupImage popup={popup} />;

  if (tipo === 'LI' && popup.link) {
    const href = popup.link.startsWith('/') ? popup.link : `/${popup.link}`;
    return (
      <Link
        href={href}
        className={POPUP_MEDIA_FRAME}
        title={popup.descripcion ?? undefined}
      >
        {media}
      </Link>
    );
  }

  if (tipo === 'LE' && popup.link) {
    return (
      <a
        href={popup.link}
        target="_blank"
        rel="noopener noreferrer"
        className={POPUP_MEDIA_FRAME}
        title={popup.descripcion ?? undefined}
      >
        {media}
      </a>
    );
  }

  return (
    <div className={POPUP_MEDIA_FRAME} title={popup.descripcion ?? undefined}>
      {media}
    </div>
  );
}

export default function FloatingAnnouncement() {
  const [popups, setPopups] = useState<HomePopup[]>([]);
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;
    getHomePopups()
      .then((data) => {
        if (!mounted) return;
        const active = data.popups ?? [];
        setPopups(active);
        if (active.length === 0) return;

        if (!isPopupDismissed(active)) {
          setVisible(true);
        }
      })
      .catch((err) => {
        console.error('No se pudieron cargar los popups', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!visible || popups.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % popups.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible, popups.length]);

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem(`${SESSION_KEY}:${popupsFingerprint(popups)}`, '1');
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  if (popups.length === 0) {
    return null;
  }

  const popup = popups[current];
  const showDescriptions = popups.some((p) => p.descripcion?.trim());
  const showCountdown = Boolean(popup.fechaHasta?.trim());

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3 }}
          className="
            fixed z-[10050]
            bottom-4 left-1/2 -translate-x-1/2
            w-[88%] max-w-[300px]
            sm:left-auto sm:right-4 sm:translate-x-0 sm:max-w-[320px]
          "
        >
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden relative">
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar"
              className="absolute top-1.5 right-1.5 z-20 bg-black/60 text-white rounded-full
              w-6 h-6 text-xs flex items-center justify-center hover:bg-black"
            >
              ✕
            </button>

            {showCountdown && (
              <PopupCountdownBar fechaHasta={popup.fechaHasta!} />
            )}

            <div
              className={`relative w-full ${POPUP_MEDIA_HEIGHT} bg-gray-50 overflow-hidden`}
            >
              {popups.map((p, index) => {
                const isActive = index === current;
                return (
                  <div
                    key={p.orden}
                    className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                      isActive
                        ? 'z-10 opacity-100'
                        : 'z-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    <PopupSlideContent popup={p} />
                  </div>
                );
              })}

              {popups.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5 pointer-events-none">
                  {popups.map((p, i) => (
                    <button
                      key={p.orden}
                      type="button"
                      aria-label={`Popup ${i + 1}`}
                      onClick={() => setCurrent(i)}
                      className={`pointer-events-auto h-1.5 w-1.5 rounded-full transition-colors ${
                        i === current ? 'bg-[#0e8c85]' : 'bg-gray-400/70'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {showDescriptions && (
              <div className="px-3 py-2 border-t border-gray-100 min-h-[40px]">
                <p className="text-[10px] leading-snug text-gray-600 font-medium line-clamp-2">
                  {popup.descripcion?.trim() ?? ''}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
