/** CM% por línea: API envía 0–100; legacy a veces fracción 0–1. */
export function normalizeCmPercent(value?: number | null): number | null {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const n = Number(value);
  if (Math.abs(n) > 0 && Math.abs(n) <= 1) return n * 100;
  return n;
}

export function formatCmPercent(value?: number | null): string {
  const pct = normalizeCmPercent(value);
  if (pct == null) return '—';
  return `${pct.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function cmPercentToneClass(value?: number | null): string {
  const pct = normalizeCmPercent(value);
  if (pct == null) return 'text-gray-400';
  return pct > 20 ? 'text-emerald-600' : 'text-amber-600';
}
