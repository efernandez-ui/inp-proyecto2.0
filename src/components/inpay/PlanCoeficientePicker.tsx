'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import {
  planKey,
  type TarjetaCoeficiente,
} from '@/services/tarjetasCoeficientes';
import { matchesPlanSearch, planDisplayLabel } from './planSearch';

type Props = {
  plans: TarjetaCoeficiente[];
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
};

export default function PlanCoeficientePicker({ plans, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = plans.find((p) => planKey(p) === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter((p) => matchesPlanSearch(p, q));
  }, [plans, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const handleSelect = (plan: TarjetaCoeficiente) => {
    onChange(planKey(plan));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative mt-1">
      <button
        type="button"
        disabled={disabled || plans.length === 0}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white py-3 pl-3 pr-2 text-left text-sm font-semibold text-[#001f3f] outline-none transition hover:border-gray-300 focus:border-[#0e8c85] focus:ring-2 focus:ring-[#0e8c85]/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="line-clamp-2 min-w-0 flex-1">
          {selected ? planDisplayLabel(selected) : 'Sin planes para esta terminal'}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && plans.length > 0 && (
        <div
          className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          <div className="border-b border-gray-100 p-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar tarjeta o plan..."
                className="box-border h-9 w-full rounded-lg border-0 bg-gray-100 pl-9 pr-3 text-sm text-[#001f3f] placeholder:text-gray-400 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0e8c85]/20"
                autoFocus
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-gray-500">Sin resultados</li>
            ) : (
              filtered.map((plan) => {
                const key = planKey(plan);
                const isSelected = key === value;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => handleSelect(plan)}
                      className={`w-full px-3 py-2.5 text-left text-sm transition hover:bg-gray-50 ${
                        isSelected ? 'bg-orange-50/80 font-semibold text-[#001f3f]' : 'text-gray-700'
                      }`}
                    >
                      {planDisplayLabel(plan)}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <p className="border-t border-gray-100 px-3 py-1.5 text-[10px] font-medium text-gray-400">
            {filtered.length} de {plans.length} planes
          </p>
        </div>
      )}
    </div>
  );
}
