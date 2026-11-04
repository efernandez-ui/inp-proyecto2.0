import { describe, expect, it } from 'vitest';
import { formatCotizacionDolarValor } from './moneda';

describe('formatCotizacionDolarValor', () => {
  it('formats with two decimal places', () => {
    expect(formatCotizacionDolarValor(1234.5)).toMatch(/1\.234,50|1,234.50/);
  });

  it('rounds to two decimals in display', () => {
    const formatted = formatCotizacionDolarValor(1500.999);
    expect(formatted).toContain('1.501,00');
  });
});
