'use client';

import {
  branchStockFromList,
  resolveStockBatteryClass,
} from '@/utils/stockBattery';
import { stockCantidadCell, stockDisplayForUser } from '@/utils/stockDisplay';
import StockItem from './StockItem';

type StockRow = { sucursal?: string; cantidad?: unknown; estado?: string | null };

type Props = {
  userTipo?: string | null;
  verStock?: string | boolean | null;
  stockList?: StockRow[] | null;
  stockNoa?: unknown;
  stockNea?: unknown;
  stockBue?: unknown;
  stockCuy?: unknown;
  /** Compact: four batteries with quantities beside them. Full: Almc / batería / Cant. */
  variant?: 'compact' | 'table';
};

const BRANCHES = ['NOA', 'NEA', 'BUE', 'CUY'] as const;

export default function BranchStockDisplay({
  userTipo,
  verStock,
  stockList,
  stockNoa,
  stockNea,
  stockBue,
  stockCuy,
  variant = 'table',
}: Props) {
  const rows = BRANCHES.map((label) => {
    const fallback =
      label === 'NOA' ? stockNoa
        : label === 'NEA' ? stockNea
          : label === 'BUE' ? stockBue
            : stockCuy;
    const branch = branchStockFromList(stockList, label, fallback);
    const display = stockDisplayForUser(userTipo, branch.cantidad, branch.estado, verStock);
    const color = resolveStockBatteryClass(branch.cantidad, branch.estado);
    const cant = stockCantidadCell(userTipo, branch.cantidad, branch.estado, verStock);
    return { label, color, display, cant, stock: branch.cantidad, estado: branch.estado };
  });

  if (variant === 'compact') {
    return (
      <div className="mb-4 grid grid-cols-4 gap-1 rounded-xl border border-slate-100 bg-slate-50 px-2 py-2">
        {rows.map((r) => (
          <StockItem
            key={r.label}
            label={r.label}
            stock={r.stock}
            estado={r.estado}
            userTipo={userTipo}
            verStock={verStock}
            variant="card"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50/50 mb-4">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="text-gray-400 uppercase tracking-wide">
            <th className="py-1.5 px-2 text-left font-bold">Almc.</th>
            <th className="py-1.5 px-2 text-center font-bold">Nivel</th>
            <th className="py-1.5 px-2 text-right font-bold">Cant.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-gray-100">
              <td className="py-1.5 px-2 font-bold text-gray-600">{r.label}</td>
              <td className="py-1.5 px-2">
                <div className="flex justify-center" title={r.display.label}>
                  <div className={`w-3 h-4 rounded-[2px] ${r.color} relative shadow-inner`}>
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-0.5 bg-gray-200 rounded-full" />
                  </div>
                </div>
              </td>
              <td className="py-1.5 px-2 text-right font-bold text-gray-700 tabular-nums">
                {r.cant || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
