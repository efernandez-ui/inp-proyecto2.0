export type PoolStockProgress = {
  /** Unidades reservadas + consumidas (meta − disponible vendible). */
  consumidos: number;
  meta: number;
  pct: number;
};

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
}

/**
 * Progreso de pool por unidades consumidas/reservadas (misma lógica que ventaProgress en admin).
 * {@code consumidos} = meta − stock vendible (CNTTOT − (CNTTOT − CNTRES − CNTCON)).
 */
export function poolStockProgress(
  cantidadTotal: number | null | undefined,
  cantidadDisponible: number | null | undefined,
): PoolStockProgress | null {
  const meta = cantidadTotal != null ? Number(cantidadTotal) : NaN;
  const disp = cantidadDisponible != null ? Number(cantidadDisponible) : NaN;
  if (!Number.isFinite(meta) || !Number.isFinite(disp) || meta <= 0) {
    return null;
  }
  const consumidos = Math.max(0, Math.round(meta - disp));
  return {
    consumidos,
    meta: Math.round(meta),
    pct: clampPct(Math.round((consumidos / meta) * 100)),
  };
}
