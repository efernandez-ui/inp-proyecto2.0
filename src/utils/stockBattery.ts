export type StockEstado = 'BAJO' | 'MEDIO' | 'ALTO';

/** Réplica de ProductoService.createStockDTO: >=50 ALTO, >0 MEDIO, sino BAJO. */
export function parseStockValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return 0;
    const compact = raw.replace(/\s+/g, '');
    const normalized =
      compact.includes(',') && compact.includes('.')
        ? compact.replace(/\./g, '').replace(',', '.')
        : compact.replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function resolveStockEstado(cantidad: number): StockEstado {
  if (cantidad >= 50) return 'ALTO';
  if (cantidad > 0) return 'MEDIO';
  return 'BAJO';
}

export function normalizeStockEstado(value: unknown): StockEstado | null {
  if (typeof value !== 'string') return null;
  const upper = value.trim().toUpperCase();
  if (upper === 'ALTO' || upper === 'MEDIO' || upper === 'BAJO') return upper;
  return null;
}

export function stockEstadoToBatteryClass(estado: StockEstado): string {
  switch (estado) {
    case 'ALTO':
      return 'bg-emerald-500';
    case 'MEDIO':
      return 'bg-amber-400';
    default:
      return 'bg-red-400';
  }
}

export function resolveStockBatteryClass(stock: unknown, estado?: string | null): string {
  const fromEstado = normalizeStockEstado(estado);
  if (fromEstado) return stockEstadoToBatteryClass(fromEstado);
  return stockEstadoToBatteryClass(resolveStockEstado(parseStockValue(stock)));
}

export function branchStockFromList<T extends { sucursal?: string; cantidad?: unknown; estado?: string | null }>(
  stockList: T[] | null | undefined,
  label: string,
  fallback?: unknown,
) {
  const fromList = stockList?.find((s) => s.sucursal?.toUpperCase() === label.toUpperCase());
  if (fromList) {
    return { cantidad: fromList.cantidad, estado: fromList.estado ?? null };
  }
  return { cantidad: fallback, estado: null };
}
