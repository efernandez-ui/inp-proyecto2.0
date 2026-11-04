import { describe, expect, it } from 'vitest';
import { stockCantidadCell, stockDisplayForUser } from './stockDisplay';

describe('stockDisplayForUser', () => {
  it('C/P muestra número si ≤50', () => {
    expect(stockDisplayForUser('C', 12).mode).toBe('number');
    expect(stockCantidadCell('C', 12)).toBe('12');
  });

  it('C/P muestra check si >50 o cantidad null + ALTO', () => {
    expect(stockDisplayForUser('C', 80).mode).toBe('check');
    expect(stockCantidadCell('C', 80)).toBe('✓');
    expect(stockDisplayForUser('P', null, 'ALTO').mode).toBe('check');
    expect(stockCantidadCell('P', null, 'ALTO')).toBe('✓');
  });

  it('V muestra cantidad exacta siempre', () => {
    expect(stockDisplayForUser('V', 80).mode).toBe('number');
    expect(stockCantidadCell('V', 80)).toBe('80');
  });

  it('C con VERSTK=S muestra cantidad exacta >50', () => {
    expect(stockDisplayForUser('C', 80, null, 'S').mode).toBe('number');
    expect(stockCantidadCell('C', 80, null, 'S')).toBe('80');
  });

  it('guest oculta', () => {
    expect(stockDisplayForUser(null, 80).mode).toBe('hidden');
    expect(stockCantidadCell(null, 80)).toBe('');
  });
});
