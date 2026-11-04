'use client';

import { useEffect, useMemo, useState } from 'react';

const MS_DAY = 1000 * 60 * 60 * 24;
const MS_HOUR = 1000 * 60 * 60;
const MS_MINUTE = 1000 * 60;
const MS_SECOND = 1000;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function parseFechaHasta(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const ms = new Date(value.trim()).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export type PopupCountdownState = {
  visible: boolean;
  expired: boolean;
  dias: string;
  horas: string;
  minutos: string;
  segundos: string;
};

export function usePopupCountdown(fechaHasta: string | null | undefined): PopupCountdownState {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const endMs = parseFechaHasta(fechaHasta);
    if (endMs == null) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [fechaHasta]);

  return useMemo(() => {
    const endMs = parseFechaHasta(fechaHasta);
    if (endMs == null) {
      return {
        visible: false,
        expired: true,
        dias: '00',
        horas: '00',
        minutos: '00',
        segundos: '00',
      };
    }

    const distancia = endMs - now;
    if (distancia <= 0) {
      return {
        visible: true,
        expired: true,
        dias: '00',
        horas: '00',
        minutos: '00',
        segundos: '00',
      };
    }

    const dias = Math.floor(distancia / MS_DAY);
    const horas = Math.floor((distancia % MS_DAY) / MS_HOUR);
    const minutos = Math.floor((distancia % MS_HOUR) / MS_MINUTE);
    const segundos = Math.floor((distancia % MS_MINUTE) / MS_SECOND);

    return {
      visible: true,
      expired: false,
      dias: pad2(dias),
      horas: pad2(horas),
      minutos: pad2(minutos),
      segundos: pad2(segundos),
    };
  }, [fechaHasta, now]);
}
