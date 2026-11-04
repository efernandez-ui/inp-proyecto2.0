import { describe, expect, it } from 'vitest';
import { formatCmPercent, normalizeCmPercent } from './cartContribucionMarginal';

describe('cartContribucionMarginal', () => {
  it('normalizes fraction values to percent', () => {
    expect(normalizeCmPercent(0.27)).toBe(27);
    expect(normalizeCmPercent(0.3526)).toBeCloseTo(35.26);
  });

  it('keeps percent-scale values as-is', () => {
    expect(normalizeCmPercent(27)).toBe(27);
    expect(normalizeCmPercent(35.26)).toBe(35.26);
  });

  it('formats with two decimals and es-AR locale', () => {
    expect(formatCmPercent(27)).toBe('27,00%');
    expect(formatCmPercent(0.3526)).toBe('35,26%');
    expect(formatCmPercent(null)).toBe('—');
  });
});
