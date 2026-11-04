import { describe, expect, it } from 'vitest';
import { formatHomeDate, formatSaldoArs, isVideoPath } from './home';

describe('home service helpers', () => {
  it('formatSaldoArs returns dash for null', () => {
    expect(formatSaldoArs(null)).toBe('—');
  });

  it('formatSaldoArs formats ARS currency', () => {
    const formatted = formatSaldoArs(3862462.87);
    expect(formatted).toContain('3.862.462,87');
  });

  it('formatHomeDate formats valid ISO date', () => {
    const formatted = formatHomeDate('2026-07-13T12:00:00.000Z');
    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/07/);
    expect(formatted).toMatch(/13/);
  });

  it('isVideoPath detects mp4', () => {
    expect(isVideoPath('banners/promo.mp4')).toBe(true);
    expect(isVideoPath('banner.webp')).toBe(false);
  });
});
