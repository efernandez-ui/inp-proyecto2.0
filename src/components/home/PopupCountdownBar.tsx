'use client';

import { usePopupCountdown } from '@/hooks/usePopupCountdown';

/** Color cuenta regresiva popup legacy (bannerPopupCountdown.xhtml). */
const LEGACY_NAVY = '#312782';

type Props = {
  fechaHasta: string;
};

function CountdownGroup({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-1 pt-2 pb-1 leading-none text-center min-w-[3rem]">
      <span className="text-3xl sm:text-4xl font-bold tabular-nums">{value}</span>
      <span className="text-[10px] sm:text-xs mt-1 opacity-95">{label}</span>
    </div>
  );
}

export default function PopupCountdownBar({ fechaHasta }: Props) {
  const countdown = usePopupCountdown(fechaHasta);

  if (!countdown.visible) {
    return null;
  }

  if (countdown.expired) {
    return (
      <div
        className="flex items-center justify-center py-3 text-white text-sm font-bold"
        style={{ backgroundColor: LEGACY_NAVY }}
        role="status"
        aria-live="polite"
      >
        ¡Oferta finalizada!
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-4 text-white"
      style={{ backgroundColor: LEGACY_NAVY }}
      role="timer"
      aria-live="polite"
      aria-label={`Cuenta regresiva: ${countdown.dias} días, ${countdown.horas} horas, ${countdown.minutos} minutos`}
    >
      <CountdownGroup value={countdown.dias} label="Días" />
      <CountdownGroup value={countdown.horas} label="Horas" />
      <CountdownGroup value={countdown.minutos} label="Minutos" />
      <CountdownGroup value={countdown.segundos} label="Segundos" />
    </div>
  );
}
