import {
  parseStockValue,
  resolveStockBatteryClass,
  normalizeStockEstado,
} from '@/utils/stockBattery';
import { stockDisplayForUser } from '@/utils/stockDisplay';

type Props = {
  label: string;
  stock?: unknown;
  estado?: string | null;
  variant?: 'default' | 'card';
  /** Tipo usuario (C/P/V/…) — controla tooltip con/sin cantidad */
  userTipo?: string | null;
  /** USR_USUWEB_VERSTK=S → cantidad exacta siempre */
  verStock?: string | boolean | null;
};

export default function StockItem({ label, stock, estado, userTipo, verStock, variant = 'default' }: Props) {
  const color = resolveStockBatteryClass(stock, estado);
  const display = stockDisplayForUser(userTipo, stock, estado, verStock);
  const title =
    display.mode === 'check'
      ? `Stock ${label}: Disponible`
      : display.mode === 'number'
        ? `Stock ${label}: ${display.value}`
        : `Stock ${label}`;

  const qtyLabel =
    display.mode === 'number'
      ? String(display.value ?? 0)
      : display.mode === 'check'
        ? '✓'
        : '';

  // Si no hay cantidad ni estado útil, aún mostramos batería por parse
  const qty = parseStockValue(stock);
  const fromEstado = normalizeStockEstado(estado);
  void qty;
  void fromEstado;

  if (variant === 'card') {
    return (
      <div className="flex flex-col items-center gap-1" title={title}>
        <span className="text-[8px] font-extrabold text-gray-400">{label}</span>
        <div className={`relative h-4 w-3 rounded-[2px] ${color}`}>
          <span className={`absolute -top-[3px] left-1/2 h-[3px] w-1.5 -translate-x-1/2 rounded-t-sm ${color}`} />
        </div>
        {qtyLabel ? <span className="text-[9px] font-bold leading-none tabular-nums text-gray-600">{qtyLabel}</span> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5" title={title}>
      <span className="text-[8px] font-extrabold text-gray-400">{label}</span>
      <div className={`w-3 h-4 rounded-[2px] ${color} relative shadow-inner`}>
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-0.5 bg-gray-200 rounded-full" />
      </div>
      {qtyLabel ? (
        <span className="text-[9px] font-bold text-gray-600 tabular-nums leading-none">
          {qtyLabel}
        </span>
      ) : null}
    </div>
  );
}
