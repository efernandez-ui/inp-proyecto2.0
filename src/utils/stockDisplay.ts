import { parseStockValue, resolveStockEstado, type StockEstado } from './stockBattery';

export type StockDisplayMode = 'number' | 'check' | 'hidden';

export type StockDisplay = {
  mode: StockDisplayMode;
  value?: number;
  estado: StockEstado;
  label: string;
};

const STAFF = new Set(['V', 'A', 'S', 'B']);

function resolveEstado(cantidad: number | null, estadoHint?: string | null): StockEstado {
  const hint = estadoHint != null ? String(estadoHint).trim().toUpperCase() : '';
  if (hint === 'ALTO' || hint === 'MEDIO' || hint === 'BAJO') return hint as StockEstado;
  if (cantidad != null) return resolveStockEstado(cantidad);
  return 'BAJO';
}

function isVerStockReal(flag?: string | boolean | null): boolean {
  if (flag === true) return true;
  if (typeof flag === 'string') return flag.trim().toUpperCase() === 'S';
  return false;
}

/**
 * Visibilidad de cantidad según tipo (legado Facelets).
 * C/P: número si ≤50; >50 (o API null + ALTO) → check / "Disponible".
 * V/S/B/A o verStockReal (USR_USUWEB_VERSTK=S): cantidad exacta.
 * Guest: oculto.
 */
export function stockDisplayForUser(
  tipo: string | null | undefined,
  cantidad: unknown,
  estadoHint?: string | null,
  verStockReal?: string | boolean | null,
): StockDisplay {
  const t = (tipo != null ? String(tipo) : '').trim().toUpperCase();
  const hasRaw = !(cantidad === null || cantidad === undefined || cantidad === '');
  const raw = hasRaw ? parseStockValue(cantidad) : null;
  const estado = resolveEstado(raw, estadoHint);

  if (!t) {
    return { mode: 'hidden', estado, label: 'Stock' };
  }

  if (STAFF.has(t) || isVerStockReal(verStockReal)) {
    const value = raw ?? 0;
    return {
      mode: 'number',
      value,
      estado: resolveStockEstado(value),
      label: `Stock: ${value}`,
    };
  }

  if (t === 'C' || t === 'P') {
    if (raw != null && raw <= 50) {
      return {
        mode: 'number',
        value: raw,
        estado: resolveStockEstado(raw),
        label: `Stock: ${raw}`,
      };
    }
    if ((raw != null && raw > 50) || estado === 'ALTO') {
      return { mode: 'check', estado: 'ALTO', label: 'Disponible' };
    }
    return { mode: 'hidden', estado, label: 'Stock' };
  }

  return { mode: 'hidden', estado, label: 'Stock' };
}

export function stockCantidadCell(
  tipo: string | null | undefined,
  cantidad: unknown,
  estadoHint?: string | null,
  verStockReal?: string | boolean | null,
): string {
  const d = stockDisplayForUser(tipo, cantidad, estadoHint, verStockReal);
  if (d.mode === 'number') return String(d.value ?? 0);
  if (d.mode === 'check') return '✓';
  return '';
}
