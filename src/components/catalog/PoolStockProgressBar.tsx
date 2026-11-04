'use client';

import { poolStockProgress } from '@/utils/poolStockProgress';

type Props = {
  cantidadTotal?: number | null;
  cantidadDisponible?: number | null;
  /** Barra compacta para ProductCard; default para carousel home. */
  variant?: 'card' | 'carousel';
};

export default function PoolStockProgressBar({
  cantidadTotal,
  cantidadDisponible,
  variant = 'carousel',
}: Props) {
  const prog = poolStockProgress(cantidadTotal, cantidadDisponible);
  if (!prog) {
    return null;
  }

  if (variant === 'card') {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2" aria-live="polite">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-600">Progreso</span>
          <span className="text-[9px] font-extrabold text-[#001f3f]">{prog.pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#2563eb] transition-[width] duration-500"
            style={{ width: `${prog.pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[8px] font-bold uppercase tracking-wide text-gray-500 text-center">
          {prog.consumidos} de {prog.meta} consumidos
        </p>
      </div>
    );
  }

  return (
    <div className="mb-3" aria-live="polite">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Progreso</span>
        <span className="text-xs font-black text-[#001f3f]">{prog.pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#2563eb] transition-[width] duration-500"
          style={{ width: `${prog.pct}%` }}
        />
      </div>
    </div>
  );
}
