'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Plus, Search } from 'lucide-react';
import { INPAY_BRAND_LOGO, INPAY_TERMINALS, filterCoeficientesByTerminal } from '@/config/inpayTerminals';
import {
  formatMultiplo,
  formatPercent,
  planKey,
  type TarjetaCoeficiente,
} from '@/services/tarjetasCoeficientes';
import { matchesPlanSearch } from './planSearch';

const searchInputClass =
  'box-border h-10 w-full rounded-full border-0 bg-gray-100 pl-10 pr-4 text-sm font-medium text-[#001f3f] placeholder:text-gray-400 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0e8c85]/20 [color-scheme:light]';

interface Props {
  coeficientes: TarjetaCoeficiente[];
  terminalId: string;
  fechaUltimaModificacion?: string | null;
  selectedPlanKey?: string;
  onSelectPlan: (plan: TarjetaCoeficiente) => void;
}

export default function CoeficientesTable({
  coeficientes,
  terminalId,
  fechaUltimaModificacion,
  selectedPlanKey,
  onSelectPlan,
}: Props) {
  const [search, setSearch] = useState('');

  const terminal = INPAY_TERMINALS.find((t) => t.id === terminalId);
  const terminalLabel = terminal?.label ?? terminalId;

  const filteredRows = useMemo(() => {
    const byTerminal = filterCoeficientesByTerminal(coeficientes, terminalId);
    const q = search.trim().toLowerCase();
    if (!q) return byTerminal;
    return byTerminal.filter((r) => matchesPlanSearch(r, q));
  }, [coeficientes, terminalId, search]);

  const applySearch = (value: string) => {
    setSearch(value);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Image
            src={INPAY_BRAND_LOGO}
            alt="INPay"
            width={120}
            height={40}
            className="h-9 w-auto shrink-0 object-contain"
          />
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-[#001f3f] sm:text-xl">
              Listado de Coeficientes
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Terminal activa:{' '}
              <span className="font-bold uppercase tracking-wide text-[#fc7703]">
                {terminalLabel}
              </span>
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-gray-500">
                {filteredRows.length} registro{filteredRows.length === 1 ? '' : 's'}
                {search.trim() ? ' (filtrados)' : ''}
              </span>
            </p>
            {fechaUltimaModificacion && (
              <p className="mt-1 text-[10px] font-medium text-gray-400">
                Últ. modificación: {fechaUltimaModificacion}
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:min-w-[220px] sm:max-w-xs">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => applySearch(e.target.value)}
              placeholder="Buscar plan..."
              className={searchInputClass}
            />
          </div>
          {search.trim() && (
            <button
              type="button"
              onClick={() => applySearch('')}
              className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-gray-500 hover:text-[#001f3f]"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[min(520px,60vh)] overflow-x-auto overflow-y-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500 shadow-[0_1px_0_0_rgb(243,244,246)]">
            <tr>
              <th className="px-4 py-3">Tarjeta</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Comisión ION POS</th>
              <th className="px-4 py-3">Coef. financiero</th>
              <th className="px-4 py-3">Múltiplo total</th>
              <th className="px-4 py-3 text-[#0e8c85]">Múltiplo c/IVA</th>
              <th className="px-4 py-3">Cód. plan</th>
              <th className="w-12 px-2 py-3" aria-label="Simular" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  No hay coeficientes para mostrar.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const key = planKey(row);
                const isSelected = selectedPlanKey === key;
                return (
                  <tr
                    key={key}
                    className={`group transition ${
                      isSelected ? 'bg-orange-50/70' : 'hover:bg-gray-50/80'
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.tarjeta}</td>
                    <td className="px-4 py-2.5 text-gray-700">{row.plan}</td>
                    <td className="px-4 py-2.5 tabular-nums text-gray-800">
                      {formatPercent(row.comision)}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-gray-800">
                      {formatMultiplo(row.coeficienteFinanciero)}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-gray-800">
                      {formatMultiplo(row.multiploTotal)}
                    </td>
                    <td className="px-4 py-2.5 font-bold tabular-nums text-[#001f3f]">
                      {formatMultiplo(row.multiploTotalConIva)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {row.codigoPlan?.trim() ? row.codigoPlan : '—'}
                    </td>
                    <td className="px-2 py-2.5">
                      <button
                        type="button"
                        onClick={() => onSelectPlan(row)}
                        title="Usar este plan en el simulador"
                        aria-label={`Simular con ${row.tarjeta} — ${row.plan}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[#fc7703] text-white shadow-sm transition-all hover:bg-[#e56a00] active:scale-95 ${
                          isSelected
                            ? 'opacity-100 ring-2 ring-[#fc7703] ring-offset-2'
                            : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
                        }`}
                      >
                        <Plus className="h-4 w-4" strokeWidth={3} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 text-xs text-gray-600">
        <span className="font-semibold text-[#0e8c85]">
          Todas las tarjetas en una sola terminal
        </span>
        <span className="mx-2 text-gray-300">·</span>
        <span>Video instructivo sobre terminales INPay (próximamente)</span>
      </div>
    </div>
  );
}
